import {
  MDAST,
  StringWriter,
  writerFromStreamWriter,
  yaml,
  zod,
} from "./3p.ts";
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
import { collectAsync } from "./iter.ts";

export * from "./execution.defaults.ts";
export * from "./execution.interfaces.ts";

const EXEC_GROUP_DELIM = `@@mdp_delim@@`;

const codeFenceExecConfigSchema = zod.object({
  isExecutionOutput: zod.boolean().optional(),
  group: zod
    .string()
    .refine((s) => s.match(/[a-zA-Z_]+/))
    .optional(),
  skipRun: zod.boolean().optional(),
  skipOutput: zod.boolean().optional(),
  cmd: zod.string().optional(),
  file: zod
    .object({
      name: zod.string(),
      autoRemove: zod.boolean().optional(),
    })
    .optional(),
  args: zod.array(zod.string()).optional(),
});
export type CodeFenceConfig = zod.infer<typeof codeFenceExecConfigSchema>;

export function parseNodeMeta(meta: MDAST["meta"]) {
  return codeFenceExecConfigSchema.parse(yaml.parse(meta));
}

export const config = {
  ofMdNode(node: MDAST, schema: CodeFenceConfig): ExecutionConfig | undefined {
    const createFromDefaults: ExecutionConfigCreator | undefined =
      DEFAULT_LANGUAGE_EXECUTORS[node.lang];
    function asserts(v: unknown): asserts v {
      if (!v) {
        throw new Error(
          `no execution provided in codefence, and no default execution for block of ${node.lang}`,
        );
      }
    }
    if (!node.meta) {
      asserts(createFromDefaults);
      return createFromDefaults(node, {});
    }
    const { file, args, cmd, skipRun, group } = schema;
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
      group,
    };
    const config = cmd && createFromDefaults
      ? createFromDefaults(node, mdConfig)
      : cmd
      ? (mdConfig as ExecutionConfig)
      : (() => {
        asserts(createFromDefaults);
        return createFromDefaults(node, mdConfig);
      })();
    return config;
  },
  getRunnable(nodes: MDAST[]) {
    return nodes
      .map(function filterMapExecutableBlock(node) {
        const metaExecution = node.meta ? parseNodeMeta(node.meta) : {};
        const isSkipping = !!metaExecution.skipRun ||
          !!metaExecution.isExecutionOutput;
        const shouldAttemptExecution = !isSkipping &&
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
  return cmds.reduce((groupTuples, exec, i) => {
    const groupTuple = groupTuples.find(([name]) => name === exec.group);
    if (!exec.group || !groupTuple) {
      return [
        ...(groupTuples || []),
        [exec.group || `g${i}`, [exec]] as CmdExecutionTuple,
      ];
    }
    groupTuple[1].push(exec);
    return groupTuples;
  }, [] as CmdExecutionTuple[]);
}

export async function runCodeSnippet(opts: ExecutionConfig) {
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
  const finalArgs = args.map((v: string) =>
    v === executionArgSymbol ? fileContent || opts.node.value || fileContent : v
  );
  // console.log([cmd, ...args]);
  let proc: Deno.Process | null = null;
  const cmdNArgs = [cmd, ...finalArgs];
  try {
    const procRun = Deno.run({
      cmd: cmdNArgs,
      stdin: "inherit",
      stdout: "piped",
      stderr: "piped",
      env: {
        ...Deno.env.toObject(),
        // colors do not serialize well into markdown, due to shell escape codes
        NO_COLOR: "1",
      },
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
      const errContent = (() => {
        try {
          return errStream.toString();
        } catch {
          return "";
        }
      })();
      throw new Error(
        [
          `failed to run code block:`,
          JSON.stringify(cmdNArgs, null, 2),
          errContent,
          `exit code: ${status.code}`,
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }
  } catch (err) {
    console.error(
      [
        `failed to run process ${[cmd, ...args].join(" ")}\n\n`,
        `\t${err?.stack || err}`,
      ].join(""),
    );
    throw err;
  } finally {
    if (autoRemove && filename) await Deno.remove(filename);
    proc?.close();
  }
}

export type CmdResult = { cmd: CmdExecution; output: string };

function createGroupedFenceExecution({
  cmds,
}: {
  cmds: CmdExecution[];
  groupName: string;
}) {
  const [cmd0] = cmds;
  if (!cmd0) throw new Error("missing cmd in group");
  if (cmds.length <= 1) throw new Error(`cmd groups must have >1 cmd`);
  const cmd0File = cmd0.file;
  const isFileExecutionRequired = cmds.length > 1;
  if (!cmd0File && isFileExecutionRequired) {
    throw new Error(
      `grouped code must be flushed to a file, but no file content present`,
    );
  }
  const file = cmd0File ? { ...cmd0File } : undefined;
  if (!file) {
    throw new Error(
      [
        `the first command the the group must execute from a file. received:`,
        JSON.stringify(cmd0, null, 2),
      ].join("\n"),
    );
  }
  const exec: ExecutionConfig = { ...cmd0, file };
  const outputDelimiters = cmds.map((cmd, i) => {
    const content = cmd.file?.content;
    if (!content) {
      throw new Error(
        [
          `no file content and command is part of a group`,
          `execution of ${cmds.length} code fences. cannot execute`,
          `a command in a group of commands if the cmd cannot be serialized`,
          `to disk`,
        ].join(" "),
      );
    }
    const lang = cmd.node.lang;
    const langPrinter = DEFAULT_LANGUAGE_CODEGENERATORS[lang];
    if (!langPrinter) {
      throw new Error(
        `missing printer for ${lang}. cannot partition code groups`,
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

export async function runCodeBlock(cmd: CmdExecution): Promise<CmdResult> {
  const writer = new StringWriter();
  await runCodeSnippet({
    ...cmd,
    outStream: writer,
    errStream: writer,
  });
  const output = writer.toString();
  return {
    output,
    cmd,
  };
}

export async function runCodeBlockGroup([
  groupName = "default",
  cmds,
]: CmdExecutionTuple) {
  const { exec } = createGroupedFenceExecution({
    cmds,
    groupName,
  });
  const { stream, terminate } = createFenceBlockStream(
    new RegExp(EXEC_GROUP_DELIM),
  );
  const writer = writerFromStreamWriter(
    stream.writable.getWriter() as WritableStreamDefaultWriter<Uint8Array>,
  );
  const running = runCodeSnippet({
    ...exec,
    outStream: writer,
    errStream: writer,
  }).finally(terminate);
  const outputs = await collectAsync(stream.readable);
  await running;
  const result = cmds.map((cmd, i) => {
    const output = outputs[i];
    if (output === undefined || output === null) {
      throw new Error(`unable to find output for cmd ${JSON.stringify(cmd)}`);
    }
    return { cmd, output } as CmdResult;
  });
  return result;
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
