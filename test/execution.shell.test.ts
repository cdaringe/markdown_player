import { assertEquals } from "./3p/asserts.ts";
import { fromMarkdown, StringWriter } from "../src/3p.ts";
import { exec, getCodeFences } from "../src/mod.ts";
import { relative } from "./fixture/setup.ts";

const fixture = Deno.readTextFileSync(
  relative(import.meta.url, "execution.shell.md")
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
  // only: true,
  name: import.meta.url,
  async fn() {
    for (const [config, expected] of cases) {
      const outStream = new StringWriter();
      const output = await exec.runCodeSnippet({
        ...config,
        outStream,
      });
      assertEquals(output.statusCode, 0);
      assertEquals(outStream.toString(), expected);
      if (config.file?.name) await Deno.remove(config?.file.name);
    }
  },
});
