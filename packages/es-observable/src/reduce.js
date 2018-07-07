/* @flow */

import type { ObservableInterface } from './types';

export const reduce = <T>(
  observable: ObservableInterface<T>,
): Promise<$ReadOnlyArray<T>> =>
  new Promise((resolve, reject) => {
    const acc = [];
    observable.subscribe({
      next(value) {
        acc.push(value);
      },
      error(error) {
        reject(error);
      },
      complete() {
        resolve([...acc]);
      },
    });
  });
