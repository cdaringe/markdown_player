import { assertEquals } from "./3p/asserts.ts";
import { extractNeedleWrappedChunks } from "../src/haystack.ts";

/**
 * @warning
 * this text is intentionally challenging to grok, ensuring that the test
 * is robust against whitespace, duplicate needles, and similar needs in the
 * haystack.
 */
const fixture = `
// needle-1

a b c

12345

// needle-1// needle-2

d_e_f

____++++====// needle-1// needle-2// needle-3
needle-3
 needle-3
//needle-3
// needle-3

`;
Deno.test({
  name: `${import.meta.url} extractNeedleWrappedChunks`,
  fn() {
    const actual = extractNeedleWrappedChunks(
      fixture,
      [1, 2, 3].map((i) => `// needle-${i}`),
    );
    const expected = [
      `

a b c

12345

`,
      `

d_e_f

____++++====// needle-1`,
      `
needle-3
 needle-3
//needle-3
`,
    ];
    expected.forEach((expectedStr, i) => {
      assertEquals(actual[i], expectedStr);
    });
  },
});
