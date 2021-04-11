import { assertEquals } from "./3p/asserts.ts";
import {
  createFenceBlockStream,
  // findDelimBounded,
} from "../src/create-fence-block-stream.ts";
import { writerFromStreamWriter } from "../src/3p.ts";
import { relative } from "./fixture/setup.ts";

const fixtureFilename = relative(
  import.meta.url,
  "create-fence-block-stream.md",
);

async function pipeFileToStream<S extends TransformStream>(
  filename: string,
  stream: S,
  terminateStream: () => void,
) {
  const file = await Deno.open(filename);
  await Deno.copy(file, writerFromStreamWriter(stream.writable.getWriter()));
  terminateStream();
  file.close();
}

// Deno.test({
//   // only: true,
//   name: `${import.meta.url} - findDelimBounded`,
//   fn() {
//     assertEquals(findDelimBounded("", ""), { found: [] });
//     const caseB = findDelimBounded("-", "-b-");
//     assertEquals(caseB, { found: ["b"] });
//     const caseC = findDelimBounded("-", " -b- ");
//     assertEquals(caseC, { pre: " ", found: ["b"], post: " " });
//     const caseD = findDelimBounded("```", "# test\n\n```\na\n```\n");
//     assertEquals(caseD, { pre: "# test\n\n", found: ["\na\n"], post: "\n" });
//   },
// });

Deno.test({
  // only: true,
  name: `${import.meta.url} - createFenceBlockStream`,
  async fn() {
    const chunks: string[] = [];
    const { stream, terminate } = createFenceBlockStream(/```\n/);
    const piped = pipeFileToStream(fixtureFilename, stream, terminate);
    for await (const chunk of stream.readable) {
      chunks.push(chunk);
    }
    await piped;
    assertEquals(chunks, ["a\n", "b\n", "c\n", "123\n"]);
  },
});
