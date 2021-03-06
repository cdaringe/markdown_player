# markdown_player

▶️ Executable markdown files.

Write markdown documentation, _run_ markdown documentation!

## Install

Install the CLI:

`deno install --unstable -f -A -n markdown_player "https://deno.land/x/markdown_player@v1.2.3/src/bin.ts"`

Install the `deno` library:

```ts {skipRun: true}
import * as markdownPlayer from "https://deno.land/x/markdown_player@v1.2.3/src/mod.ts";
markdownPlayer.playFile("readme.md");
```

## How it works

- Reads a markdown file
- Parses all
  [fenced code blocks](https://www.markdownguide.org/extended-syntax/#fenced-code-blocks)
- Executes each code fence in an independent or shared process
- Captures and re-emits command output!

## Preview

This is a living document. Let's observe markdown_player in action!

- Write code in code blocks
- Run `markdown_player /path/to/file.md --appendOutput`
- Observe the output

```ts
import { getEmojiByName } from "https://deno.land/x/getmoji@1.2.3/mod.ts";
const fileType = "markdown";
const description = `Runs code fences in a ${fileType} file`;
console.log(`${description} ${await getEmojiByName("pizza")}`);
```

```txt {skipRun: true, isExecutionOutput: true}
Runs code fences in a markdown file 🍕
```

The above output was auto written to this document by using the `--appendOutput`
flag!

## Features

- share execution environments between code blocks
- configure code blocks to be run with custom commands
- optionally write code blocks to files, with support for optional auto-removal

## API

Code fences can be configured via single line yaml in the meta section. Consider
the following markdown meta:

`` ```bash {file: {name: greeting.sh}} ``

Now, apply it to a real code block (warning, the meta is hidden by real
codeblocks, unless you look at the markdown source):

```bash {file: {name: greeting.sh}}
# creates a file called "greeting.sh", as specified in the meta
echo "hello $USER!"
```

```txt {skipRun: true, isExecutionOutput: true}
hello cdaringe!
```

...and that file gets run!

| meta-option         | type       | description                                                                                                  |
| ------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `skipRun`           | boolean?   | Do not execute this code block                                                                               |
| `group`             | string?    | Run any same named group code blocks in the same file                                                        |
| `cmd`               | string?    | Executable to run                                                                                            |
| `args`              | string\[]? | Args to pass to the executable. Use the string "$ARG" to get the contents of the code fence                  |
| `file`              | object?    | Flush the code block to a file then execute it. This is the default operation mode.                          |
| `file.name`         | string?    | Name the file. Otherwise, a random filename is generated                                                     |
| `file.autoRemove`   | boolean?   | Set to false to keep the file. Otherwise, it is deleted by default                                           |
| `isExecutionOutput` | boolean?   | Signify that this block is for capturing stdio from the above code block. Generally considered a private API |
| `skipOutput`        | boolean?   | Run the block, but skip writing output if appendOutput mode is also requested                                |

You can verify your compact YAML syntax using
https://yaml-online-parser.appspot.com/.

## Examples

### Meta blocks

The following block has meta: `` ```js {cmd: node, args: ["--eval", $ARG]} ``

```js {cmd: node, args: ["--eval", $ARG]}
// no file is written
console.log(123);
```

```txt {skipRun: true, isExecutionOutput: true}
123
```

The following block has meta:
`` ```js {file: {name: 456-demo.js, autoRemove: true}, cmd: node, args: [456-demo.js]} ``

```js {file: {name: 456-demo.js, autoRemove: true}, cmd: node, args: [456-demo.js]}
console.log(456);
```

```txt {skipRun: true, isExecutionOutput: true}
456
```

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

```txt {skipRun: true, isExecutionOutput: true}
4
```

What about the square of a square?

```ts {group: group_demo}
console.log(square(twoSquared));
```

```txt {skipRun: true, isExecutionOutput: true}
16
```

### Run a code block, but skip output

use the `skipOutput` meta flag: `` ```ts {skipOutput: true} ``

```ts {skipOutput: true}
// print out an enormous string!
console.log([...Array(1e4)].join("a\n"));
```

## FAQ

> Error: Exec format error (os error 8)

Did you try to execute a file that was not a binary, or had no
`#!/usr/env/bin LANG` block?
