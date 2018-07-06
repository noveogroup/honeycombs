/* @flow */
/* eslint import/no-extraneous-dependencies: off */

import test from 'ava';

import { Store } from './Store';

test('Store', t => {
  const store = Store.of(1);

  t.is(store.getState(), 1);
  t.is(store.setState(2), 2);
  t.is(store.getState(), 2);
});
