# markdown_player

▶️ Executable markdown files.

Write markdown documentation, _run_ markdown documentation!

## Install

Install the CLI:

`deno install --unstable -f -A -n markdown_player "https://deno.land/x/markdown_player@v1.0.0/src/bin.ts"`

Install the `deno` library:

```ts {skipRun: true}
import * as markdownPlayer from "https://deno.land/x/markdown_player@v1.0.0/src/mod.ts";
markdownPlayer.playFile("readme.md");
```

## How it works

- Reads a markdown file
- Parses all
  [fenced code blocks](https://www.markdownguide.org/extended-syntax/#fenced-code-blocks)
- Executes each code fence in an independent or shared process
- Captures and re-emits command output!

## Code

## Demo

- Write code in code blocks
- Run `markdown_player /path/to/file.md --appendOutput`
- Observe the output

```ts
import { getEmojiByName } from "https://deno.land/x/getmoji@1.2.4/mod.ts";
const fileType = "markdown";
const description = `Runs code fences in a ${fileType} file`;
console.log(`${description} ${await getEmojiByName("pizza")}`);
```

```txt {skipRun: true, output: true}
Runs code fences in a markdown file 🍕
```

The above output sample was auto written to this document by using the
`--appendOutput` flag!

## Features

- share execution environments between code blocks
- configure code blocks to be run with custom commands
- write code blocks to disk, permanently or with auto-removal

## API

Code fences can be configured via single line yaml in the meta section. E.g.:

````txt
```your-lang META_SECTION
...
````

| meta-option     | type      | description                                                                                                  |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| output          | boolean?  | Signify that this block is for capturing stdio from the above code block. Generally considered a private API |
| group           | string?   | Run any same named group code blocks in the same file                                                        |
| skipRun         | boolean?  | Do not execute this code block                                                                               |
| cmd             | string?   | Executable to run                                                                                            |
| args            | string[]? | Args to pass to the executable. Use the string "$ARG" to get the contents of the code fence                  |
| file            | object?   | Flush the code block to a file then execute it. This is the default operation mode.                          |
| file.name       | string?   | Name the file. Otherwise, a random filename is generated                                                     |
| file.autoRemove | boolean?  | Set to false to keep the file. Otherwise, it is deleted by default                                           |

```js {cmd: node, args: ["--eval", $ARG]}
// no file is written
console.log(123);
```

```js {file: {name: 456-demo.js, autoRemove: false}, cmd: node}
console.log(456);
```

You can verify your compact YAML syntax using
https://yaml-online-parser.appspot.com/.

## Examples

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

## FAQ

> Error: Exec format error (os error 8)

Did you try to execute a file that was not a binary, or had no
`#!/usr/env/bin LANG` block?
