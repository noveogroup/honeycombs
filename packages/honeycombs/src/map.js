/* @flow */
/* eslint
  no-shadow: off,
  no-redeclare: off,
*/

import { Observable, type ObservableInterface } from 'es-observable';

const call = <T, R>(
  fn: T => R,
  observable: ObservableInterface<T>,
): Observable<R> =>
  new Observable(observer => {
    const subscription = observable.subscribe(
      value => observer.next(fn(value)),
      error => observer.error(error),
      () => observer.complete(),
    );

    return () => subscription.unsubscribe();
  });

declare export function map<T, R>(
  fn: (T) => R,
): (observable: ObservableInterface<T>) => Observable<R>;

declare export function map<T, R>(
  fn: (T) => R,
  observable: ObservableInterface<T>,
): Observable<R>;

export function map(fn, observable) {
  return observable ? call(fn, observable) : observable => call(fn, observable);
}
