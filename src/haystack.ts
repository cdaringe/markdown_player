export function extractNeedleWrappedChunks(
  haystack: string,
  needles: string[]
) {
  function getIdx(needle: string, start = 0) {
    const i = haystack.indexOf(needle, start);
    if (i < 0) throw new Error(`failed to find needle ${needle} in haystack`);
    return i;
  }
  return needles.reduce(function extractChunk(chunks, needle) {
    const start = getIdx(needle);
    const startNeedleEnd = start + needle.length;
    const end = getIdx(needle, startNeedleEnd);
    const chunkLength = end - startNeedleEnd;
    const chunk = haystack.substr(startNeedleEnd, chunkLength);
    haystack = haystack.substr(end + needle.length);
    return [...chunks, chunk];
  }, [] as string[]);
}
