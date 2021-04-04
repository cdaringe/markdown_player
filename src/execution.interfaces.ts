type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

export type BaseExecutionConfig = {
  file?: { name: string; content: string; autoRemove?: boolean };
  writeCmdStdout?: typeof Deno.stdout.write;
  writeCmdStderr?: typeof Deno.stderr.write;
};

export type CmdExecution = {
  cmd: string;
  args?: string[];
} & BaseExecutionConfig;

export type ExecutionConfig = CmdExecution;
export type ExecutionConfigCreator = (
  content: string,
  metaExecutionConfig: RecursivePartial<ExecutionConfig>
) => ExecutionConfig;
