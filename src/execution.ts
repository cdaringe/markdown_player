import { MDAST, yaml, zod, path } from "./3p.ts";
import {
  DEFAULT_LANGUAGE_EXECUTORS,
  executionArgSymbol,
} from "./execution.defaults.ts";
import type {
  ExecutionConfig,
  ExecutionConfigCreator,
} from "./execution.interfaces.ts";
import concatStreams from "./concat_streams.ts";

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
    if (!node.meta) {
      if (!createFromDefaults) {
        throw new Error(
          `no execution provided in codefence, and no default execution for block of ${node.lang}`
        );
      }
      return createFromDefaults(node.value, {});
    }
    const { filename, args, cmd, skipRun } = schema;
    if (skipRun)
      throw new Error(`illegal execution config parse of skipped block`);
    const mdConfig: Partial<ExecutionConfig> = {
      cmd,
      file: filename ? { name: filename, content: node.value } : undefined,
      args: args?.map((v: string) =>
        v === executionArgSymbol ? node.value : v
      ),
    };
    const config = cmd
      ? (mdConfig as ExecutionConfig)
      : createFromDefaults(node.value, mdConfig);
    // console.log(config);
    return config;
  },
  // finalize(
  //   metaExecutionConfig: ExecutionConfig | undefined,
  //   node: MDAST
  // ): ExecutionConfig {
  //   const defaultLangExecution = DEFAULT_LANGUAGE_EXECUTORS[node.lang];
  //   if (metaExecutionConfig?.cmd) {
  //     return {
  //       ...defaultLangExecution,
  //       ...metaExecutionConfig,
  //     };
  //   }
  //   if (defaultLangExecution) return defaultLangExecution;
  //   throw new Error(`no execution config available for language ${lang}`);
  // },
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

// export const readToBuf = (it: AsyncIterable, bu)

export async function runCodeSnippet(opts: ExecutionConfig) {
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
  // console.log([cmd, ...args]);
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
      // console.error(`${cmd} ${args.join(" ")}`);
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
