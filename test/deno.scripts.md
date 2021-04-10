```ts
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
const x = await sleep(1).then(() => 2);
console.log(JSON.stringify({ x }));
```
