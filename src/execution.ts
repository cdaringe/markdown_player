import { MDAST, yaml, zod } from "./3p.ts";
import {
  DEFAULT_LANGUAGE_CODEGENERATORS,
  DEFAULT_LANGUAGE_EXECUTORS,
  executionArgSymbol,
} from "./execution.defaults.ts";
import type {
  CmdExecutionTuple,
  ExecutionConfig,
  ExecutionConfigCreator,
} from "./execution.interfaces.ts";
import concatStreams from "./concat_streams.ts";
import { getString as getRandomString } from "./random.ts";
import { extractNeedleWrappedChunks } from "./haystack.ts";

export * from "./execution.defaults.ts";
export * from "./execution.interfaces.ts";

const codeFenceExecConfigSchema = zod.object({
  skipRun: zod.boolean().optional(),
  cmd: zod.string().optional(),
  filename: zod.string().optional(),
  args: zod.array(zod.string()).optional(),
});
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
    const { filename, args, cmd, skipRun } = schema;
    if (skipRun) {
      throw new Error(`illegal execution config parse of skipped block`);
    }
    const mdConfig: Partial<ExecutionConfig> = {
      cmd,
      file: filename ? { name: filename, content: node.value } : undefined,
      args: args?.map((v: string) =>
        v === executionArgSymbol ? node.value : v
      ),
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
      return [...groupTuples, [exec.group, [exec]] as CmdExecutionTuple];
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
    writeCmdStdout = Deno.stdout.write,
    writeCmdStderr = Deno.stderr.write,
  } = opts;
  // console.log(opts);
  const filename = file?.name;
  const fileContent = file?.content || "";
  if (filename) {
    // if the execution request a file to be written, write it
    await Deno.writeTextFile(filename, fileContent, { mode: 0o777 });
  }
  // console.log([exec, ...args]);
  let proc: Deno.Process | null = null;
  try {
    const procRun = Deno.run({
      cmd: [cmd, ...args],
      stdin: "inherit",
      stdout: "piped",
      stderr: "piped",
    });
    proc = procRun;
    const outputP = concatStreams(procRun.stdout, procRun.stderr);
    const status = await procRun.status();
    const output = await outputP;
    // console.log(status, output);
    if (status.code) {
      // console.error(`${exec} ${args.join(" ")}`);
      await writeCmdStderr(output);
      throw new Error(`command failed, exit code: ${status.code}`);
    }
    await writeCmdStdout(output);
    return { output, statusCode: status.code };
  } catch (err) {
    console.error(
      [
        `failed to run process ${[cmd, ...args].join(" ")}\n\n`,
        `\t${err}`,
      ].join("")
    );
    throw err;
  } finally {
    proc?.close();
  }
}

export type CmdResult = { output: Uint8Array; statusCode: number };

export async function runCodeGroup([groupName, [...cmds]]: CmdExecutionTuple) {
  const hd = cmds[0];
  if (!hd) throw new Error("missing cmd in group");
  if (!cmds.length) return runCodeSnippet(hd);
  const hdFile = hd.file;
  if (!hdFile) {
    throw new Error(
      `grouped code must be flushed to a file, but no file content present`
    );
  }
  const groupExec: ExecutionConfig = { ...cmds[0], file: { ...hdFile } };
  const file = groupExec.file!;
  const outputSymbols = cmds.map((cmd, i) => {
    const content = cmd.file?.content;
    if (!content) throw new Error("cannot group. no file content found");
    const lang = cmd.node.lang;
    const langPrinter = DEFAULT_LANGUAGE_CODEGENERATORS[lang];
    if (!langPrinter) {
      throw new Error(
        `missing printer for ${lang}. cannot partition code groups`
      );
    }
    const outputSymbol = `mdp_group_${groupName}_${getRandomString()}`;
    const langEmitSym = langPrinter.print(outputSymbol);
    const nextChunk = `${langEmitSym}${content}${langEmitSym}`;
    file.content = i === 0 ? nextChunk : `${file.content}${nextChunk}`;
    return outputSymbol;
  });
  debugger; // eslint-disable-line
  const result = await runCodeSnippet(groupExec);
  const outputs = extractNeedleWrappedChunks(
    new TextDecoder().decode(result.output),
    outputSymbols
  );
  return {
    ...result,
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
