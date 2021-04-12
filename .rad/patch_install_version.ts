import type { Task } from "./common.ts";

export const task: Task = {
  fn: async ({ Deno, fs, logger }) => {
    const nextVersion = Deno.env.get("NEXT_VERSION");
    if (!nextVersion) throw new Error("NEXT_VERSION not found");
    const toPatch = [
      { filename: "readme.md", regex: /\d+.\d+.\d+[^/]*/g },
      { filename: "src/version.ts", regex: /\d+.\d+.\d+[^"]*/ },
    ];
    for (const { filename, regex } of toPatch) {
      logger.info(`updating ${filename} with new version ${nextVersion}`);
      const oldContent = await Deno.readTextFile(filename);
      const nextContent = oldContent.replace(regex, nextVersion);
      await Deno.writeTextFile(filename, nextContent);
    }
  },
};
