type I = string | Uint8Array;

export const createFenceBlockStream = (fenceRgx: RegExp) => {
  const state = {
    isCollecting: false,
    partialBlock: "",
  };
  const decoder = new TextDecoder();
  let controller: TransformStreamDefaultController<string>;
  const asStr = (v: I) => (typeof v === "string" ? v : decoder.decode(v));
  const stream = new TransformStream<I, string>({
    start(c) {
      controller = c;
    },
    transform(uchunk, controller) {
      let chunk = asStr(uchunk);
      while (chunk) {
        const match = chunk.match(fenceRgx);
        if (match) {
          if (state.isCollecting) {
            state.partialBlock += chunk.substr(0, match.index!);
            controller.enqueue(state.partialBlock);
            state.partialBlock = "";
            state.isCollecting = false;
          } else {
            state.isCollecting = true;
          }
          chunk = chunk.substr(match.index!).replace(fenceRgx, "");
        } else {
          if (state.isCollecting) {
            state.partialBlock += chunk;
          } else {
            //
          }
          chunk = "";
        }
      }
    },
  });
  return { stream, terminate: () => controller.terminate() };
};
