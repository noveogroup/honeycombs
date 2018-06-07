/* @flow */

type Nothing<T> = {
  map<R>(fn: (T) => R): Nothing<R>,
  forEach(fn: (T) => any): void,
};

const nothing: Nothing<any> = {
  map: () => nothing,
  forEach: () => {},
};

type Just<T> = {
  map<R>(fn: (T) => R): Just<R>,
  forEach(fn: (T) => any): void,
};

const just = <T>(value: T): Just<T> => ({
  map: <R>(fn: T => R): Just<R> => just(fn(value)),
  forEach: (fn: T => any) => {
    fn(value);
  },
});

type Maybe<T> = {
  map<R>(fn: (T) => R): Maybe<R>,
  forEach(fn: (T) => any): void,
};

export const maybe = <T>(value: ?T): Maybe<T> =>
  value == null
    ? nothing
    : {
        map: (fn: any) => just(fn(value)),
        forEach: (fn: any) => {
          fn(value);
        },
      };
