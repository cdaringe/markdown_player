import { playFile } from "./mod.ts";
import { PlayerError, PlayerErrorSilentFail } from "./error.ts";
import { parseFlags, zod } from "./3p.ts";

const helpText = `
markdown_player: executable markdown files

   Usage
     $ markdown_player <filename> [flags]

   Options
    --help  show the help menu
    --version print version
    --appendOutput add or update text output after each codeblock

   Examples
     $ markdown_player readme.md --appendOutput
`;

const cliSchema = zod.object({
  _: zod.array(zod.string()).refine((args) => {
    const filename = args[0];
    try {
      return Deno.statSync(filename);
    } catch (err) {
      if (err?.name === "PermissionDenied") throw err;
      throw new PlayerError(
        filename ? `invalid file ${filename}` : "no filename provided",
      );
    }
  }),
  appendOutput: zod.boolean().optional(),
  help: zod.boolean().optional(),
});

try {
  const flags = parseFlags(Deno.args);
  if (flags.help) {
    console.log(helpText);
    throw new PlayerErrorSilentFail();
  }
  const config = cliSchema.parse(flags);
  const filename = config._[0];
  await playFile(filename, {
    appendOutput: config.appendOutput,
  });
} catch (err) {
  if (err instanceof PlayerError) {
    if (err instanceof PlayerErrorSilentFail) {
      // pass
    } else {
      console.error(err.message);
    }
    Deno.exit(1);
  }
  throw err;
}
