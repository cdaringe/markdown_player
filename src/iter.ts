export function zip<A, B>(a: A[], b: B[]): [A, B][] {
  return a.map((ap, i) => [ap, b[i]]);
}
