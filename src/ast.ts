import type { MDAST } from "./3p.ts";
export function createOutputNode(text: string): MDAST {
  return {
    type: "code",
    lang: "txt",
    meta: "{skipRun: true, output: true}",
    value: text,
    children: [],
  };
}
