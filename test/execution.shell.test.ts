import { assertEquals } from "./3p/asserts.ts";
import { fromMarkdown } from "../src/3p.ts";
import { exec, getCodeFences } from "../src/mod.ts";
import { relative } from "./fixture/setup.ts";

const fixture = Deno.readTextFileSync(
  relative(import.meta.url, "fixture/shell_exec.md")
);
const fixtureAst = fromMarkdown(fixture);

const [basicEcho, echoFromFile] = await exec.config.getRunnable(
  getCodeFences(fixtureAst)
);
const cases = [
  [basicEcho, "test_echo\n"] as const,
  [echoFromFile, "test_shell_echoed\n"] as const,
];

Deno.test({
  name: import.meta.url,
  async fn() {
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
      if (config.file?.name) await Deno.remove(config?.file.name);
    }
  },
});
