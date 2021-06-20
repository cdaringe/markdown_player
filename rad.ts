import { patchInstallVersion, Task, Tasks } from "./.rad/mod.ts";

const install: Task =
  `deno cache --lock=lock.json --lock-write src/3p.ts test/3p/3p.ts`;
const clean: Task = `rm -f .tmp*`;
const lint: Task = `deno lint --unstable --log-level=debug`;
const _test: Task = `deno test -A --unstable`;
const test: Task = { dependsOn: [_test, clean], dependsOnSerial: true };
const testdebug: Task = `${test} --inspect-brk`;
const format: Task = `deno fmt --unstable`;
const formatCheck: Task = `${format} --check`;
const check: Task = {
  dependsOn: [clean, formatCheck, lint, test],
  dependsOnSerial: true,
};
const run: Task =
  `USER=cdaringe deno run --lock=lock.json --cached-only -A --unstable src/bin.ts readme.md --appendOutput`;

export const tasks: Tasks = {
  _test,
  formatCheck,
  check,
  patchInstallVersion,
  ...{ clean, c: clean },
  ...{ lint, l: lint },
  ...{ install, i: install },
  ...{ test, t: test },
  ...{ testdebug, td: testdebug },
  ...{ format, f: format },
  ...{ run, r: run },
};
