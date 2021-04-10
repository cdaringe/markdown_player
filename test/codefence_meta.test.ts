import { assertEquals } from "./3p/asserts.ts";
import { fromMarkdown } from "../src/3p.ts";
import { exec, getCodeFences } from "../src/mod.ts";
import { relative } from "./fixture/setup.ts";
import { DEFAULT_LANGUAGE_EXECUTORS } from "../src/execution.defaults.ts";

const fixture = Deno.readTextFileSync(
  relative(import.meta.url, "codefence_meta.md"),
);

const fixtureAst = fromMarkdown(fixture);

const [
  caseEmptyMeta,
  caseSingleMetaWriteFile,
  caseSingleMetaWhitespaceWriteFile,
  caseMetaMulti,
  caseSkipMd,
] = exec.config.getRunnable(getCodeFences(fixtureAst));

const createDenoExec = DEFAULT_LANGUAGE_EXECUTORS["ts"]!;
const createShExec = DEFAULT_LANGUAGE_EXECUTORS["sh"]!;

Deno.test({
  name: `${import.meta.url} caseEmptyMeta`,
  fn() {
    assertEquals(
      caseEmptyMeta,
      createShExec(caseEmptyMeta.node, {
        cmd: "sh",
        args: ["-c", ""],
      }),
    );
  },
});

Deno.test({
  name: `${import.meta.url} caseSingleMetaWriteFile`,
  fn() {
    assertEquals(
      caseSingleMetaWriteFile,
      createDenoExec(caseSingleMetaWriteFile.node, {
        file: { name: "ok.ts" },
      }),
    );
  },
});

Deno.test({
  name: `${import.meta.url} caseSingleMetaWhitespaceWriteFile`,
  fn() {
    assertEquals(
      caseSingleMetaWhitespaceWriteFile,
      createDenoExec(caseSingleMetaWhitespaceWriteFile.node, {
        file: { name: "file with white space.ts" },
      }),
    );
  },
});

Deno.test({
  name: `${import.meta.url} caseMetaMulti`,
  fn() {
    const expected = {
      cmd: caseMetaMulti.cmd,
      args: caseMetaMulti.args,
      file: caseMetaMulti.file,
    };
    assertEquals(expected, {
      cmd: "cmd",
      args: ["cmd", "arg0", "--flag"],
      file: {
        name: "/path/to/my username/file.ts",
        content: "",
        autoRemove: false,
      },
    } as exec.CodeFenceConfig);
  },
});

Deno.test({
  name: `${import.meta.url} caseSkipMd`,
  fn() {
    assertEquals(caseSkipMd, undefined, "caseSkipMd");
  },
});
