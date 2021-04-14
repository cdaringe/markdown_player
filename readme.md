# markdown_player

▶️ Executable markdown files.

Write markdown documentation, _run_ markdown documentation!

## demo

- Write code in codeblocks
- Run `markdown_player /path/to/file.md --appendOutput`
- Observe the output

```ts
const fileType = "markdown";
const description = `Runs code fences in a ${fileType} file.`;
console.log(description);
```

```txt {skipRun: true, output: true}
Runs code fences in a markdown file.
```

The above output was auto-added to this document by the `--appendOutput` flag!

## features

- share execution environments between codeblocks
- configure codeblocks to be run with custom commands
- write codeblocks to disk, permanently or with auto-removal

## examples

The following are written in a narrative style to demonstrate functionality.

### Share execution context

Sharing variables can be achieved by adding a `{group: name}` to the codeblock
meta. All items in a `group` eventually get run from a single file, where all
blocks are combined into a single file.

Math is important. Learn math! Consider this function:

```ts {group: group_demo}
const square = (x: number) => x * x;
```

What if we passed a two?

```ts {group: group_demo}
const twoSquared = square(2);
console.log(twoSquared);
```

```txt {skipRun: true, output: true}
4
```

What about the square of a square?

```ts {group: group_demo}
console.log(square(twoSquared));
```

```txt {skipRun: true, output: true}
16
```

Wow! Sharing variables is great!

## why?

Documentation or demonstration? Which is more powerful for helping users? Why
settle for just one? What if you could deliver both, from the exact same
markdown content?

Turn your markdown _into_ an application!

---

```sh {skipRun: true}
deno install -A --unstable ...
```

## api

`playFile(...)`

## configuration

### codefences

Codef ences can be configure via compact yaml in the codefence meta section.

markdown codefences have the form:
`<TRIPLE_BACKTICK><LANG><META><BODY><TRIPLEBACKTICK>`

Example:

delete me

```ts {file: {name: cool file.ts, autoRemove: true}, cmd: deno, args: [eval, $ARG]}
console.log(123);
```

```txt {skipRun: true, output: true}
123
```

````md
```ts {filename: cool file.ts, cmd: deno, args: [eval, $ARG]}
console.log(123);
```
````

You can verify your compact YAML syntax using
https://yaml-online-parser.appspot.com/.

## FAQ

> Error: Exec format error (os error 8)

Did you try to execute a file that was not a binary, or had no
`#!/usr/env/bin LANG` block?
