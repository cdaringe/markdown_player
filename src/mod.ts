import { fromMarkdown, MDAST, mdAstVisit, pMap, toMarkdown } from "./3p.ts";
import { createOutputNode } from "./ast.ts";
import * as exec from "./execution.ts";
export { exec };
import { zip } from "./iter.ts";

export type RunConfig = {
  languageExecutors: exec.LanguageExecutors;
};

export type PlayFileOptions = {
  runConfig?: RunConfig;
  /**
   * Set to value >1 if code blocks are safe to be run independently
   */
  concurrency?: number;
  /**
   * Attach or update a text markdown with the results of a block
   */
  appendOutput?: boolean;
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
  const isAppendingOutput = !!options?.appendOutput;
  const nextAst: MDAST | null = isAppendingOutput ? { ...ast } : null;
  runs.forEach((run) =>
    run.forEach(({ cmd, output }) => {
      const trimmedOutput = output.trim();
      if (isAppendingOutput && trimmedOutput) {
        if (!nextAst) throw new Error("ast missing");
        const cmdIdx = nextAst.children.findIndex((n) => n === cmd.node);
        if (cmdIdx < 0) throw new Error("could not find cmd code block :(");
        const outputIdx = cmdIdx + 1;
        const outNode = nextAst.children[outputIdx] as MDAST | undefined;
        if (outNode?.lang === "txt" && outNode?.meta?.match(/output:\s+true/)) {
          outNode.value = output;
        } else {
          nextAst.children.splice(
            outputIdx,
            0,
            createOutputNode(trimmedOutput)
          );
        }
      }
      console.log(output);
    })
  );
  if (isAppendingOutput) {
    await Deno.writeTextFile(filename, toMarkdown(nextAst!));
  }
  return { ast, runs };
}
