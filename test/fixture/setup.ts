import { path } from "../3p/path.ts";
export const createRelative = (url: string) =>
  path.dirname(url.replace("file://" + Deno.cwd() + "/", ""));
export const relative = (url: string, slug: string) =>
  path.resolve(createRelative(url), slug);
