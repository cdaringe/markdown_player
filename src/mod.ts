import { fromMarkdown, MDAST, mdAstVisit, pMap } from "./3p.ts";
import * as exec from "./execution.ts";
export { exec };
type RunConfig = {
  languageExecutors: exec.LanguageExecutors;
};
type PlayFileOptions = {
  runConfig?: RunConfig;
};

export function getNodes(ast: MDAST, type: string) {
  const nodes: MDAST[] = [];
  mdAstVisit<MDAST>(ast, type, (node) => {
    // @warning -- do not return a value from this fn
    nodes.push(node);
  });
  return nodes;
}

export const getCodeFences = (ast: MDAST) => getNodes(ast, "code");

export async function playFile(filename: string, options?: PlayFileOptions) {
  const contents = await Deno.readTextFile(filename);
  const ast = fromMarkdown(contents);
  const toRun = exec.config.getRunnable(getCodeFences(ast));
  const results = await pMap(toRun, exec.runCodeSnippet, { concurrency: 1 });
  return results;
}
