import { playFile } from "./mod.ts";
import { PlayerError } from "./error.ts";

try {
  const filename = Deno.args[0];
  await playFile(filename);
} catch (err) {
  if (err instanceof PlayerError) {
    console.error(err.message);
    Deno.exit(1);
  }
  throw err;
}
