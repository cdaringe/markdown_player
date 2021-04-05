// deno-lint-ignore-file no-explicit-any
type OperatorFunction<I, O> = (i: I) => O;

export function pipe<A, B>(op1: OperatorFunction<A, B>): OperatorFunction<A, B>;
export function pipe<A, B, C>(
  op1: OperatorFunction<A, B>,
  op2: OperatorFunction<B, C>,
): OperatorFunction<A, C>;
export function pipe<A, B, C, D>(
  op1: OperatorFunction<A, B>,
  op2: OperatorFunction<B, C>,
  op3: OperatorFunction<C, D>,
): OperatorFunction<A, D>;
export function pipe<A, B, C, D, E>(
  op1: OperatorFunction<A, B>,
  op2: OperatorFunction<B, C>,
  op3: OperatorFunction<C, D>,
  op4: OperatorFunction<D, E>,
): OperatorFunction<A, E>;
export function pipe<A, B, C, D, E, F>(
  op1: OperatorFunction<A, B>,
  op2: OperatorFunction<B, C>,
  op3: OperatorFunction<C, D>,
  op4: OperatorFunction<D, E>,
  op5: OperatorFunction<E, F>,
): OperatorFunction<A, F>;
export function pipe<A, B, C, D, E, F, G>(
  op1: OperatorFunction<A, B>,
  op2: OperatorFunction<B, C>,
  op3: OperatorFunction<C, D>,
  op4: OperatorFunction<D, E>,
  op5: OperatorFunction<E, F>,
  op6: OperatorFunction<F, G>,
): OperatorFunction<A, G>;
export function pipe(fn1: any, ...fns: any[]) {
  const piped = fns.reduce(
    (prevFn, nextFn) => (value: any) => nextFn(prevFn(value)),
    (value: any) => value,
  );
  return (...args: any[]) => piped(fn1(...args));
}

export function zip<A, B>(a: A[], b: B[]) {
  return a.map((it, i) => [it, b[i]] as const);
}
