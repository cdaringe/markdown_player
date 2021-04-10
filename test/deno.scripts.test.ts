import { assertEquals } from "./3p/asserts.ts";
import { fromMarkdown } from "../src/3p.ts";
import { exec, getCodeFences } from "../src/mod.ts";
import { relative } from "./fixture/setup.ts";

Deno.test({
  name: import.meta.url,
  async fn() {
    const fixtureFilename = relative(import.meta.url, "deno.scripts.md");
    const fixtureText = Deno.readTextFileSync(fixtureFilename);
    const fixtureAst = fromMarkdown(fixtureText);
    const [caseSleepEcho] = await exec.config.getRunnable(
      getCodeFences(fixtureAst),
    );
    const cases = [[caseSleepEcho, `{"x":2}\n`] as const];
    for (const [config, expected] of cases) {
      const output = await exec.runCodeSnippet({
        ...config,
        writeCmdStdout: async (out) => {
          const actual = new TextDecoder().decode(out);
          await assertEquals(actual, expected);
          return 0;
        },
        writeCmdStderr: () => {
          return Promise.reject(new Error("no stderr expected"));
        },
      });
      assertEquals(output.statusCode, 0);
    }
  },
});
