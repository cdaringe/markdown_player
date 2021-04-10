export const createFenceBlockStream = (
  testChunkDivider: (chunk: string, transform: TransformStream) => boolean,
) => {
  let strBuffer = "";
  const stream = new TransformStream<string, string>({
    transform(chunk, controller) {
      if (chunk === null) return controller.terminate();
      if (testChunkDivider(chunk, stream)) {
        if (strBuffer) controller.enqueue(strBuffer);
        strBuffer = "";
      } else {
        strBuffer += chunk;
      }
    },
  });
  return stream;
};
