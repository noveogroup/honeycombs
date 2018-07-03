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

  const dec = counter.case(async state => state - 1);

  const add = counter.case((state, payload) => state + payload);

  const set = counter.set();
  const setDouble = counter.payload(payload => Observable.of(payload * 2));
  const reset = counter.always(initialState);

  const storeObservable = createObservable(counter);
  const incObservable = createObservable(inc);
  const decObservable = createObservable(dec);
  const addObservable = createObservable(add);
  const setObservable = createObservable(set);
  const setDoubleObservable = createObservable(setDouble);
  const resetObservable = createObservable(reset);

  inc.next();
  inc.next();
  dec.next();
  add.next(10);
  set.next(100500);
  setDouble.next(100500);
  reset.next();

  setTimeout(() => completeSubject.complete(), 0);

  const [
    storeValues,
    incValues,
    decValues,
    addValues,
    setValues,
    setDoubleValues,
    resetValues,
  ] = await Promise.all([
    reduce(storeObservable),
    reduce(incObservable),
    reduce(decObservable),
    reduce(addObservable),
    reduce(setObservable),
    reduce(setDoubleObservable),
    reduce(resetObservable),
  ]);

  t.deepEqual(storeValues, [
    initialState,
    1,
    2,
    1,
    11,
    100500,
    100500 * 2,
    initialState,
  ]);

  t.deepEqual(incValues, [initialState, 1, 2]);
  t.deepEqual(decValues, [initialState, 1]);
  t.deepEqual(addValues, [initialState, 11]);
  t.deepEqual(setValues, [initialState, 100500]);
  t.deepEqual(setDoubleValues, [initialState, 100500 * 2]);
  t.deepEqual(resetValues, [initialState, initialState]);
});
