Here's a block with two vars:

```ts {group: test_group}
const what = 'what\'s the meaning of life, "dudeskie"?';
const meaning = 42;
console.log(what);
```

These vars are very interesting.

Even more, what happens when we re-use those blocks?

```ts {group: test_group}
console.log(`The meaning is ${meaning}`);
```
