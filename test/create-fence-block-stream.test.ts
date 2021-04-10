import { assertEquals } from "./3p/asserts.ts";
import { createFenceBlockStream } from "../src/create-fence-block-stream.ts";
import { readLines } from "./3p/readline.ts";
import { relative } from "./fixture/setup.ts";

const fixtureFilename = relative(
  import.meta.url,
  "create-fence-block-stream.md",
);

async function pipeFileToStream<S extends TransformStream>(
  filename: string,
  stream: S,
) {
  const file = await Deno.open(filename);
  const writer = stream.writable.getWriter();
  for await (const line of readLines(file)) {
    await writer.write(line);
  }
  await writer.write(null);
  file.close();
}

Deno.test({
  name: `${import.meta.url} - createFenceBlockStream`,
  async fn() {
    const chunks: string[] = [];
    const stream = createFenceBlockStream((chunk) => !!chunk.startsWith("```"));
    const piped = pipeFileToStream(fixtureFilename, stream);
    for await (const chunk of stream.readable) chunks.push(chunk);
    await piped;
    assertEquals(chunks, ["a", "b", "c", "123"]);
  },
});
