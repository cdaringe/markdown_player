export * as markdown from "https://deno.land/x/markdown@v2.0.0/mod.ts";
export * as yaml from "https://deno.land/std@0.91.0/encoding/yaml.ts";
export * as path from "https://deno.land/std@0.91.0/path/mod.ts";
export * as zod from "https://deno.land/x/zod@v3.0.0-alpha.33/mod.ts";
import toMarkdown_ from "https://esm.sh/mdast-util-to-markdown";
import fromMarkdown_ from "https://esm.sh/mdast-util-from-markdown";
import mdAstVisit_ from "https://esm.sh/unist-util-visit";
export { default as pMap } from "https://deno.land/x/promise_fns@v1.5.0/src/map.ts";
export type MDAST = {
  type: string;
  lang: string;
  meta: string;
  value: string;
  parent?: MDAST;
};
export const toMarkdown = (toMarkdown_ as unknown) as (ast: MDAST) => string;
export const fromMarkdown = (fromMarkdown_ as unknown) as (md: string) => MDAST;
export const mdAstVisit = mdAstVisit_;
