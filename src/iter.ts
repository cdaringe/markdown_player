export function zip<A, B>(a: A[], b: B[]): [A, B][] {
  return a.map((ap, i) => [ap, b[i]]);
}

export async function collectAsync<T>(iter: AsyncIterable<T>) {
  const collection: T[] = [];
  for await (const v of iter) collection.push(v);
  return collection;
}
