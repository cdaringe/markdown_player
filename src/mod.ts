import { fromMarkdown, MDAST, mdAstVisit, pMap } from "./3p.ts";
import * as exec from "./execution.ts";
export { exec };

export type RunConfig = {
  languageExecutors: exec.LanguageExecutors;
};

export type PlayFileOptions = {
  runConfig?: RunConfig;
  /**
   * Set to value >1 if code blocks are safe to be run independently
   */
  concurrency?: number;
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
  const text = await Deno.readTextFile(filename);
  const ast = fromMarkdown(text);
  const fences = getCodeFences(ast);
  const runnable = exec.config.getRunnable(fences);
  const groups = exec.cmdsByGroup(runnable);
  const runs = await pMap(groups, exec.runCodeGroup, {
    concurrency: options?.concurrency || 1,
  });
  return { ast, runs };
}
