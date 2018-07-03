/* @flow */
/* eslint import/no-extraneous-dependencies: off */

import test from 'ava';

import { Observable } from './Observable';
import { reduce } from './reduce';

test('Observable', async t => {
  const observable = new Observable(observer => {
    observer.next(1);
    observer.next(2);
    observer.next(3);
    observer.complete();
    return () => {};
  });

  t.deepEqual(await reduce(observable), [1, 2, 3]);
  t.deepEqual(await reduce(Observable.from(observable)), [1, 2, 3]);
  t.deepEqual(await reduce(Observable.from([1, 2, 3])), [1, 2, 3]);
  t.deepEqual(await reduce(Observable.of(1, 2, 3)), [1, 2, 3]);
});
