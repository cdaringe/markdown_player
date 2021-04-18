# run code in comments

<!-- $MDP_PROCESS
```ts {group: demo}
const countFiles = (dirname: string) =>
  Deno.readDir(dirname).then((iter) => [...iter]);
const isFile = (filename: string) =>
  Deno.stat(filename).then(({ isFile }) => isFile);
const isFolder = (filename: string) =>
  Deno.stat(filename).then(({ isFolder }) => isFolder);
```
-->
