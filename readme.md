# markdown_player

▶️ Executable markdown files.

Runs code fences in a markdown file.

## why?

Documentation or demonstration? Which is more powerful for helping users? Why
settle for just one? What if you could deliver both, from the same markdown
file(s)?

Turn your markdown _into_ an application!

```sh {skipRun: true}
deno install -A --unstable
```

## api

`playFile(...)`

## configuration

### codefences

Codef ences can be configure via compact yaml in the codefence meta section.

markdown codefences have the form:
`<TRIPLE_BACKTICK><LANG><META><BODY><TRIPLEBACKTICK>`

Example:

````md
```ts {filename: /path/to/my \username/file.ts, cmd: deno, args: [eval, $ARG]}
console.log(123);
```
````

You can verify your compact YAML syntax using
https://yaml-online-parser.appspot.com/.

## FAQ

> Error: Exec format error (os error 8)

Did you try to execute a file that was not a binary, or had no
`#!/usr/env/bin LANG` block?
