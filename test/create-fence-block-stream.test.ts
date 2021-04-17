import { assertEquals } from "./3p/asserts.ts";
import { createFenceBlockStream } from "../src/create-fence-block-stream.ts";
import { writerFromStreamWriter } from "../src/3p.ts";
import { relative } from "./fixture/setup.ts";
import { collectAsync } from "../src/iter.ts";

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

Deno.test({
  // only: true,
  name: `${import.meta.url} - createFenceBlockStream`,
  async fn() {
    const { stream, terminate } = createFenceBlockStream(/```\n/);
    const piped = pipeFileToStream(fixtureFilename, stream, terminate);
    const chunks = await collectAsync(stream.readable);
    await piped;
    assertEquals(chunks, ["a\n", "b\n", "c\n", "123\n"]);
  },
});
