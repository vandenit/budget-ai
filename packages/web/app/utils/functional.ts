import * as R from "ramda";

type AsyncFunction<T, R> = (input: T) => Promise<R>;

export const pipeP =
  <T, R>(...fns: AsyncFunction<any, any>[]): AsyncFunction<T, R> =>
  (input: T): Promise<R> =>
    fns.reduce<Promise<any>>(
      (promise, fn) => promise.then(fn),
      Promise.resolve(input)
    );

export const composeP = <T, R>(
  ...fns: AsyncFunction<any, any>[]
): AsyncFunction<T, R> => pipeP(...fns.reverse());
