import type { ExecutionConfigCreator } from "./execution.interfaces.ts";
export type LanguageExecutors = Record<string, ExecutionConfigCreator>;
import { getString as getRandomString } from "./random.ts";

type Codegen = {
  print: (str: string) => string;
};
export type LanguageCodegen = Record<string, Codegen>;

export const executionArgSymbol = "$ARG";

const typescript: ExecutionConfigCreator = (node, meta) => {
  const filename = meta.file?.name ||
    `.tmp.${getRandomString()}.markdown_player.deno.ts`;
  const fileAutoRemove = meta.file ? !!meta.file.autoRemove : true;
  return {
    cmd: "deno",
    // `deno eval` does not yet support typescript. deno scripts must be written
    // to disk
    args: ["run", "-q", "-A", "--unstable", filename],
    file: {
      name: filename,
      content: node.value,
      autoRemove: fileAutoRemove,
    },
    node,
  };
};

const sh: ExecutionConfigCreator = (node) => ({
  cmd: "sh",
  args: ["-c", node.value],
  node,
});
export const DEFAULT_LANGUAGE_EXECUTORS: LanguageExecutors = {
  ts: typescript,
  typescript,
  sh,
};

const tsCodegen: Codegen = {
  print: (s) => `;Deno.stdout.writeSync(new TextEncoder().encode("${s}"));`,
};
const shCodegen: Codegen = {
  print: (s) => `echo ${s}`,
};
export const DEFAULT_LANGUAGE_CODEGENERATORS: LanguageCodegen = {
  ts: tsCodegen,
  typescript: tsCodegen,
  sh: shCodegen,
};
