import type { ExecutionConfigCreator } from "./execution.interfaces.ts";
export type LanguageExecutors = Record<string, ExecutionConfigCreator>;

export const executionArgSymbol = "$ARG";

const typescript: ExecutionConfigCreator = (content, meta) => {
  const filename =
    meta.file?.name ||
    `.tmp.${Math.random().toString().substr(2, 6)}.markdown_player.deno.ts`;
  const fileAutoRemove = meta.file ? meta.file.autoRemove : true;
  return {
    cmd: "deno",
    // `deno eval` does not yet support typescript. deno scripts must be written
    // to disk
    args: ["run", "-q", "-A", "--unstable", filename],
    file: {
      name: filename,
      content,
      autoRemove: fileAutoRemove,
    },
  };
};

const sh: ExecutionConfigCreator = (content) => ({
  cmd: "sh",
  args: ["-c", content],
});
export const DEFAULT_LANGUAGE_EXECUTORS: LanguageExecutors = {
  ts: typescript,
  typescript,
  sh,
};
