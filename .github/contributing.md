# contributing

Thanks for your interest in contributing.

# bootstrapping

To bootstrap development, please

- install [deno](https://deno.land/), latest. it's changing constantly, and we
  want to keep up with it :)
- [install `rad`](https://github.com/cdaringe/rad#install) for executing tasks
  - use the version tracked in [3p.ts](./../.rad/3p.ts), as that is what CI will
    use :)
- fork & clone this repo

# submitting patches

You're awesome. Thank you!

- If adding a new function:

  - add `src/<functionName>.ts`. the first line in this file should be a
    description, which CI will auto-add to the readme.md table
  - add `test/<functionName>.ts`

- write tests.
- run the tests, `rad test`
- run the formatter, `rad format`
- commit messages must be adherent to
  [semantic-release](https://github.com/semantic-release/semantic-release#commit-message-format)
- run `rad check` as a final failsafe, once your commit is checked in
- open a pull request

# code of conduct

Please refer to the
[nodejs code-of-conduct](https://github.com/nodejs/node/blob/main/CODE_OF_CONDUCT.md).
