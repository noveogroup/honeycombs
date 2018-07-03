/* @flow */
/* eslint import/no-extraneous-dependencies: off */

import test from 'ava';

import { SimpleStore } from './SimpleStore';

test('SimpleStore', t => {
  const store = SimpleStore.of(1);

  t.is(store.getState(), 1);
  t.is(store.setState(2), 2);
  t.is(store.getState(), 2);
});
