/* @flow */
/* eslint import/no-extraneous-dependencies: off */

import test from 'ava';

import { Observable } from 'es-observable';
import { reduce } from 'es-observable/src/reduce';

import { of } from './Store';
import { Subject } from './Subject';

const completeSubject = new Subject();

const createObservable = target =>
  new Observable(observer => {
    target.subscribe(observer);
    completeSubject.subscribe(observer);
    return () => {};
  });

test('Store', async t => {
  const initialState = 0;

  const counter = of(initialState);

  t.is(counter.getState(), 0);

  const inc = counter.case(state => state + 1);
  const dec = counter.case(state => state - 1);
  const add = counter.case((state, payload) => state + payload);
  const set = counter.set();
  const reset = counter.always(initialState);

  const storeObservable = createObservable(counter);
  const incObservable = createObservable(inc);
  const decObservable = createObservable(dec);
  const addObservable = createObservable(add);
  const setObservable = createObservable(set);
  const resetObservable = createObservable(reset);

  setTimeout(() => {
    inc.next();
    t.is(counter.getState(), 1);

    inc.next();
    t.is(counter.getState(), 2);

    dec.next();
    t.is(counter.getState(), 1);

    add.next(10);
    t.is(counter.getState(), 11);

    set.next(100500);
    t.is(counter.getState(), 100500);

    reset.next();
    t.is(counter.getState(), initialState);

    completeSubject.complete();
  }, 0);

  const [
    storeValues,
    incValues,
    decValues,
    addValues,
    setValues,
    resetValues,
  ] = await Promise.all([
    reduce(storeObservable),
    reduce(incObservable),
    reduce(decObservable),
    reduce(addObservable),
    reduce(setObservable),
    reduce(resetObservable),
  ]);

  t.deepEqual(storeValues, [initialState, 1, 2, 1, 11, 100500, initialState]);
  t.deepEqual(incValues, [initialState, 1, 2]);
  t.deepEqual(decValues, [initialState, 1]);
  t.deepEqual(addValues, [initialState, 11]);
  t.deepEqual(setValues, [initialState, 100500]);
  t.deepEqual(resetValues, [initialState, initialState]);
});
