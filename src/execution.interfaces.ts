import type { MDAST } from "./3p.ts";
type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

export type BaseExecutionConfig = {
  file?: { name: string; content: string; autoRemove?: boolean };
  group?: string;
  writeCmdStdout?: typeof Deno.stdout.write;
  writeCmdStderr?: typeof Deno.stderr.write;
  node: MDAST;
};

export type CmdExecution = {
  cmd: string;
  args?: string[];
} & BaseExecutionConfig;

export type ExecutionConfig = CmdExecution;
export type ExecutionConfigCreator = (
  node: MDAST,
  metaExecutionConfig: RecursivePartial<ExecutionConfig>,
) => ExecutionConfig;

export type CmdExecutionTuple = [string | undefined, CmdExecution[]];
