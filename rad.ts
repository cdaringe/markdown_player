import type { Task, Tasks } from "https://deno.land/x/rad@v6.3.6/src/mod.ts";

const clean: Task = `rm -f .tmp*`;
const lint: Task = `deno lint --unstable`;
const _test: Task = `deno test -A --unstable`;
const test: Task = { dependsOn: [_test, clean], dependsOnSerial: true };
const testdebug: Task = `${test} --inspect-brk`;
const format: Task = `deno fmt --unstable`;
const run: Task = `deno run -A --unstable src/bin.ts readme.md`;

export const tasks: Tasks = {
  _test,
  ...{ clean, c: clean },
  ...{ lint, l: lint },
  ...{ test, t: test },
  ...{ testdebug, td: testdebug },
  ...{ format, f: format },
  ...{ run, r: run },
};
