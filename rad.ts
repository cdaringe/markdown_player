import type { Task, Tasks } from "https://deno.land/x/rad/src/mod.ts";

const lint: Task = `deno lint --unstable`;
const test: Task = `deno test -A --unstable`;
const testdebug: Task = `${test} --inspect-brk`;
const format: Task = `deno fmt --unstable`;
const run: Task = `deno run -A --unstable src/bin.ts readme.md`;

export const tasks: Tasks = {
  ...{ lint, l: lint },
  ...{ test, t: test },
  ...{ testdebug, td: testdebug },
  ...{ format, f: format },
  ...{ run, r: run },
};
