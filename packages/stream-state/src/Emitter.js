/* @flow */

export type Emitter<V> = {|
  emit: (value: V) => void,
  listen: (fn: (value: V) => void) => () => void,
|};

export const createEmitter = <V>(): Emitter<V> => {
  const listeners: Set<(value: V) => any> = new Set();

  return {
    listen: (fn: (value: V) => any) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    emit: (value: V) => listeners.forEach(fn => fn(value)),
  };
};
