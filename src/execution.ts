import { MDAST, writerFromStreamWriter, yaml, zod } from "./3p.ts";
import {
  DEFAULT_LANGUAGE_CODEGENERATORS,
  DEFAULT_LANGUAGE_EXECUTORS,
  executionArgSymbol,
} from "./execution.defaults.ts";
import type {
  CmdExecution,
  CmdExecutionTuple,
  ExecutionConfig,
  ExecutionConfigCreator,
} from "./execution.interfaces.ts";
import { createFenceBlockStream } from "./create-fence-block-stream.ts";

export * from "./execution.defaults.ts";
export * from "./execution.interfaces.ts";

const EXEC_GROUP_DELIM = `@@mdp_delim@@`;

const codeFenceExecConfigSchema = zod
  .object({
    group: zod
      .string()
      .refine((s) => s.match(/[a-zA-Z_]+/))
      .optional(),
    skipRun: zod.boolean().optional(),
    cmd: zod.string().optional(),
    file: zod
      .object({
        name: zod.string(),
        autoRemove: zod.boolean().optional(),
      })
      .optional(),
    args: zod.array(zod.string()).optional(),
  })
  .strict();
export type CodeFenceConfig = zod.infer<typeof codeFenceExecConfigSchema>;

export const config = {
  ofMdNode(node: MDAST, schema: CodeFenceConfig): ExecutionConfig | undefined {
    const createFromDefaults: ExecutionConfigCreator | undefined =
      DEFAULT_LANGUAGE_EXECUTORS[node.lang];
    function asserts(v: unknown): asserts v {
      if (!v) {
        throw new Error(
          `no execution provided in codefence, and no default execution for block of ${node.lang}`
        );
      }
    }
    if (!node.meta) {
      asserts(createFromDefaults);
      return createFromDefaults(node, {});
    }
    const { file, args, cmd, skipRun } = schema;
    const { name: filename, autoRemove = false } = file || {};
    if (skipRun) {
      throw new Error(`illegal execution config parse of skipped block`);
    }
    const mdConfig: Partial<ExecutionConfig> = {
      cmd,
      file: filename
        ? { name: filename, content: node.value, autoRemove }
        : undefined,
      args,
      node,
    };
    const config = cmd
      ? (mdConfig as ExecutionConfig)
      : (() => {
          asserts(createFromDefaults);
          return createFromDefaults(node, mdConfig);
        })();
    // console.log(config);
    return config;
  },
  getRunnable(nodes: MDAST[]) {
    return nodes
      .map(function filterMapExecutableBlock(node) {
        const metaExecution = node.meta
          ? codeFenceExecConfigSchema.parse(yaml.parse(node.meta))
          : {};
        const isSkipping = !!metaExecution.skipRun;
        const shouldAttemptExecution =
          !isSkipping &&
          !!(metaExecution.cmd || DEFAULT_LANGUAGE_EXECUTORS[node.lang]);
        return shouldAttemptExecution
          ? config.ofMdNode(node, metaExecution)
          : null;
      })
      .filter(Boolean)
      .map((config) => {
        // type narrowing function only
        if (!config) throw new Error("missing config");
        return config;
      });
  },
};

export function cmdsByGroup(cmds: ExecutionConfig[]): CmdExecutionTuple[] {
  return cmds.reduce((groupTuples, exec) => {
    const groupTuple = groupTuples.find(([name]) => name === exec.group);
    if (!groupTuple) {
      return [
        ...(groupTuples || []),
        [exec.group, [exec]] as CmdExecutionTuple,
      ];
    }
    groupTuple[1].push(exec);
    return groupTuples;
  }, [] as CmdExecutionTuple[]);
}

export async function runCodeSnippet(
  opts: ExecutionConfig
): Promise<CmdResult> {
  const {
    cmd,
    args = [],
    file,
    outStream = Deno.stdout,
    errStream = Deno.stderr,
  } = opts;
  const { name: filename, content: fileContent = "", autoRemove } = file || {};
  if (filename) {
    try {
      // if the execution request a file to be written, write it
      await Deno.writeTextFile(filename, fileContent, { mode: 0o777 });
    } catch (err) {
      throw new Error(`failed to write file ${filename}: ${err}`);
    }
  }
  // console.log([cmd, ...args]);
  let proc: Deno.Process | null = null;
  try {
    const procRun = Deno.run({
      cmd: [
        cmd,
        ...args.map((v: string) =>
          v === executionArgSymbol ? fileContent : v
        ),
      ],
      stdin: "inherit",
      stdout: "piped",
      stderr: "piped",
    });
    proc = procRun;
    const [_, __, status] = await Promise.all([
      Deno.copy(procRun.stdout, outStream),
      Deno.copy(procRun.stderr, errStream),
      procRun.status(),
    ]);
    procRun.stdout.close();
    procRun.stderr.close();
    if (status.code) {
      throw new Error(`command failed, exit code: ${status.code}`);
    }
    return { statusCode: status.code };
  } catch (err) {
    console.error(
      [
        `failed to run process ${[cmd, ...args].join(" ")}\n\n`,
        `\t${err?.stack || err}`,
      ].join("")
    );
    throw err;
  } finally {
    if (autoRemove && filename) await Deno.remove(filename);
    proc?.close();
  }
}

export type CmdResult = { statusCode: number };

function createGroupedFenceExecution({
  cmds,
  groupName,
}: {
  cmds: CmdExecution[];
  groupName: string;
}) {
  const [cmd0] = cmds;
  if (!cmd0) throw new Error("missing cmd in group");
  const cmd0File = cmd0.file;
  if (!cmd0File) {
    throw new Error(
      `grouped code must be flushed to a cmd0File, but no cmd0File content present`
    );
  }
  const file = { ...cmd0File };
  const exec: ExecutionConfig = { ...cmd0, file };
  const outputDelimiters = cmds.map((cmd, i) => {
    const content = cmd.file?.content;
    if (!content) throw new Error("cannot group. no file content found");
    const lang = cmd.node.lang;
    const langPrinter = DEFAULT_LANGUAGE_CODEGENERATORS[lang];
    if (!langPrinter) {
      throw new Error(
        `missing printer for ${lang}. cannot partition code groups`
      );
    }
    const outputSymbol = EXEC_GROUP_DELIM;
    const langEmitSym = langPrinter.print(outputSymbol);
    const nextChunk = `${langEmitSym}${content}${langEmitSym}`;
    file.content = i === 0 ? nextChunk : `${file.content}${nextChunk}`;
    return outputSymbol;
  });
  return { exec, outputDelimiters };
}

export async function runCodeGroup([
  groupName = "default",
  cmds,
]: CmdExecutionTuple) {
  const { exec } = createGroupedFenceExecution({
    cmds,
    groupName,
  });
  const {
    stream: fencedOutputStream,
    terminate: terminateStream,
  } = createFenceBlockStream(new RegExp(EXEC_GROUP_DELIM));
  const writer = writerFromStreamWriter(
    fencedOutputStream.writable.getWriter() as WritableStreamDefaultWriter<Uint8Array>
  );
  const running = runCodeSnippet({
    ...exec,
    outStream: writer,
    errStream: writer,
  }).finally(terminateStream);
  const outputs: string[] = [];
  for await (const chunk of fencedOutputStream.readable) {
    outputs.push(chunk);
  }
  return {
    ...(await running),
    cmds,
    outputs,
  };
}

export type RunnableSnippetCodeFenceMeta = {
  /**
   * @unimplemented
   * Specify how to execute the file, if the default interpreter is not desired.
   * @example
   * For instance, if the default interpretter for typescript is deno, but you
   * want to use nodejs, you could specify "node -r ts-node/register $ARG"
   */
  args?: string;
};
