import { createOutputNode } from "../src/ast.ts";
import { assertEquals } from "./3p/asserts.ts";
Deno.test({
  name: `${import.meta.url}`,
  fn() {
    assertEquals(createOutputNode("wee"), {
      children: [],
      lang: "txt",
      meta: "{skipRun: true, isExecutionOutput: true}",
      type: "code",
      value: "wee",
    });
  },
});
