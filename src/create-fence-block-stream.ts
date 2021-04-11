const splitOn = (slicable: string, ...indices: number[]) =>
  [0, ...indices].map((n, i, m) => slicable.slice(n, m[i + 1]));

type FindBoundedResult = { pre?: string; found: string[]; post?: string };

// export function findDelimBounded(
//   delim: string | RegExp,
//   haystack: string
// ): FindBoundedResult {
//   if (!haystack) return { found: [] };
//   const firstMatchIdx = haystack.match(delim)?.index;
//   if (!Number.isInteger(firstMatchIdx)) return { pre: haystack, found: [] };
//   const [pre, nextHaystack] = splitOn(haystack, firstMatchIdx!);
//   const parts = nextHaystack.split(delim);
//   // const [p1, p2, p3] = parts;
//   // if (p1 === "" && p2 === "" && !p3) return { found: [""] };
//   const result = parts.reduce(
//     (acc, part, i) => {
//       if (acc.post) {
//         const post = acc.post;
//         delete acc.post;
//         return { ...acc, found: [...acc.found, `${post}${part}`] };
//       }
//       const isLastPart = i === parts.length - 1;
//       if (isLastPart) {
//         return { ...acc, post: part };
//       }
//       if (i % 2 === 1) {
//         return { ...acc, found: [...acc.found, part] };
//       }
//       // in-between junk! throw it away :)
//       return acc;
//     },
//     {
//       pre,
//       found: [],
//       post: undefined,
//     } as FindBoundedResult
//   );
//   // if (!result.post) delete result.post;
//   return result;
// }

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
      //   const { pre, found, post } = findDelimBounded(nextFenceRgx, chunk);
      //   if (pre) {
      //     if (partialBlock !== null) {
      //       partialBlock += pre;
      //     }
      //   }
      //   found?.forEach((v) => controller.enqueue(v));
      //   if (post) partialBlock = post;
      // },
    },
  });
  return { stream, terminate: () => controller.terminate() };
};
