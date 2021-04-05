export default async function concat(
  ...streams: (Deno.Reader & Deno.Closer)[]
) {
  const arrBuf: number[] = [];
  await Promise.all(
    streams.map(async function readToSharedBuffer(s, i) {
      for await (const buffer of Deno.iter(s)) {
        for (const chunk of buffer) arrBuf.push(chunk);
      }
      s.close();
    }),
  );
  return new Uint8Array(arrBuf);
}
