/* @flow */
/* eslint import/no-extraneous-dependencies: off */

import test from 'ava';
import { Observable } from '../../es-observable/src';

import { map } from './map';

test('map uncurried', t => {
  t.plan(3);

  const observable = map(value => value * 2, Observable.from([1, 2, 3]));

  let i = 0;

  observable.subscribe(
    (value): void => {
      i += 1;
      t.is(value, i * 2);
    },
  );

  return (observable: any);
});

test('map curried', t => {
  t.plan(3);

  const observable = map(value => value * 2)(Observable.from([1, 2, 3]));

  let i = 0;

  observable.subscribe(
    (value): void => {
      i += 1;
      t.is(value, i * 2);
    },
  );

  return (observable: any);
});
