import { assertEquals } from "./3p/asserts.ts";
import { playFile } from "../src/mod.ts";
import { relative } from "./fixture/setup.ts";

const fixtureFilename = relative(import.meta.url, "deno.scripts.group.md");

Deno.test({
  // only: true,
  name: import.meta.url,
  async fn() {
    const res = await playFile(fixtureFilename);
    const run0 = res.runs[0];
    if ("outputs" in run0) {
      assertEquals(run0.outputs, [
        `what's the meaning of life, "dudeskie"?\n`,
        `The meaning is 42\n`,
      ]);
    } else {
      throw new Error("expected outputs for each chunk");
    }
  },
});
