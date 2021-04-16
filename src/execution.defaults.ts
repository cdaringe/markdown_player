import type { ExecutionConfigCreator } from "./execution.interfaces.ts";
export type LanguageExecutors = Record<string, ExecutionConfigCreator>;
import { getString as getRandomString } from "./random.ts";

type Codegen = {
  print: (str: string) => string;
};
export type LanguageCodegen = Record<string, Codegen>;

export const executionArgSymbol = "$ARG";

const withDefaultFields: (defaults: {
  cmd: string;
  filename?: string;
  args: (opts: { filename?: string; content?: string }) => string[];
}) => ExecutionConfigCreator = ({ args, cmd, filename: defaultFilename }) =>
  (
    node,
    meta,
  ) => {
    const filename = meta.file?.name || defaultFilename;
    const fileAutoRemove = meta.file ? !!meta.file.autoRemove : true;
    return {
      cmd: meta.cmd || cmd,
      args: (meta.args as string[]) ||
        args({ filename, content: filename ? undefined : node.value }),
      file: filename
        ? {
          name: filename,
          content: node.value,
          autoRemove: fileAutoRemove,
        }
        : undefined,
      node,
      group: meta.group,
    };
  };

const javascript: ExecutionConfigCreator = withDefaultFields({
  cmd: "node",
  args: ({ filename, content }) =>
    filename ? [filename] : content ? ["-e", content] : [],
});

const typescript: ExecutionConfigCreator = withDefaultFields({
  // `deno eval` does not yet support typescript. deno scripts must be written
  // to disk
  cmd: "deno",
  filename: `.tmp.${getRandomString()}.markdown_player.deno.ts`,
  args: ({ filename, content }) =>
    filename ? ["run", "-q", "-A", "--unstable", filename] : (() => {
      if (content) throw new Error(`deno supports filename only`);
      return [];
    })(),
});

const sh: ExecutionConfigCreator = withDefaultFields({
  cmd: "sh",
  args: ({ filename, content }) =>
    filename ? [filename] : ["-c", content || ""],
});

const bash: ExecutionConfigCreator = withDefaultFields({
  cmd: "bash",
  args: ({ filename, content }) =>
    filename ? [filename] : content ? ["-c", content] : [],
});

export const DEFAULT_LANGUAGE_EXECUTORS: LanguageExecutors = {
  ts: typescript,
  typescript,
  sh,
  bash,
  js: javascript,
  javascript,
};

const tsCodegen: Codegen = {
  print: (s) => `;Deno.stdout.writeSync(new TextEncoder().encode("${s}"));`,
};
const shCodegen: Codegen = {
  print: (s) => `echo "${s}"`,
};
const jsCodegen: Codegen = {
  print: (s) => `console.log("${s}");`,
};
export const DEFAULT_LANGUAGE_CODEGENERATORS: LanguageCodegen = {
  ts: tsCodegen,
  typescript: tsCodegen,
  sh: shCodegen,
  bash: shCodegen,
  js: jsCodegen,
  javascript: jsCodegen,
};
