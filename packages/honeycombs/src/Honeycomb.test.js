/* @flow */
/* eslint import/no-extraneous-dependencies: off */

import test from 'ava';

import { Observable } from '../../es-observable/src';
import { reduce } from '../../es-observable/src/reduce';

import { of } from './Honeycomb';
import { createClosingObservable } from './createClosingObservable';

test('Store', async t => {
  const { complete, createObservable } = createClosingObservable();
  const inc = value => value + 1;
  const dec = value => value - 1;

  const counter = of(0);

  t.is(counter.getState(), 0);

  const increment = counter.case(() => inc);
  const decrement = counter.fromPromise(async () => dec);
  const add = counter.fromObservable(payload =>
    Observable.of(state => state + payload),
  );

  const increment3 = counter.fromObservable(() => Observable.of(inc, inc, inc));

  const storeObservable = createObservable(counter);
  const incObservable = createObservable(increment);
  const decObservable = createObservable(decrement);
  const addObservable = createObservable(add);
  const inc3Observable = createObservable(increment3);

  increment.next();
  increment.next();
  increment.next();
  decrement.next();
  add.next(10);
  increment3.next();

  setTimeout(complete, 0);

  const [
    storeValues,
    incValues,
    decValues,
    addValues,
    inc3Values,
  ] = await Promise.all([
    reduce(storeObservable),
    reduce(incObservable),
    reduce(decObservable),
    reduce(addObservable),
    reduce(inc3Observable),
  ]);

  t.deepEqual(storeValues, [0, 1, 2, 3, 2, 12, 13, 14, 15]);
  t.deepEqual(incValues, [0, 1, 2, 3]);
  t.deepEqual(decValues, [0, 2]);
  t.deepEqual(addValues, [0, 12]);
  t.deepEqual(inc3Values, [0, 13, 14, 15]);
});

test('Store non-blocking execution', async t => {
  const createQueue = (): Observable<number> =>
    new Observable(observer => {
      const values = [1, 2, 3].reverse();
      const interval = setInterval(() => {
        const value = values.pop();
        if (value != null) return observer.next(value);
        observer.complete();
        clearInterval(interval);
      }, 20);
      return () => clearInterval(interval);
    });
  const { complete, createObservable } = createClosingObservable();
  const counter = of(0);
  const run1 = counter.fromObservable(createQueue);
  const run2 = counter.fromObservable(createQueue);

  const observable = createObservable(counter);

  run1.next();
  run2.next();

  setTimeout(complete, 500);

  t.deepEqual(await reduce(observable), [0, 1, 1, 2, 2, 3, 3]);
});

test('Store blocking execution', async t => {
  const createQueue = (): Observable<number> =>
    new Observable(observer => {
      const values = [1, 2, 3].reverse();
      const interval = setInterval(() => {
        const value = values.pop();
        if (value != null) return observer.next(value);
        observer.complete();
        clearInterval(interval);
      }, 20);
      return () => clearInterval(interval);
    });
  const { complete, createObservable } = createClosingObservable();
  const counter = of(0);
  const run1 = counter.awaitObservable(createQueue);
  const run2 = counter.awaitObservable(createQueue);

  const observable = createObservable(counter);

  run1.next();
  run2.next();

  setTimeout(complete, 500);

  t.deepEqual(await reduce(observable), [0, 1, 2, 3, 1, 2, 3]);
});

test('Store observable', async t => {
  const { complete, createObservable } = createClosingObservable();
  const inc = value => value + 1;
  const dec = value => value - 1;

  const counter = of(0);

  const increment = counter.case(() => inc);
  const decrement = counter.case(() => dec);

  const observable = counter.createStoreObservable({ increment, decrement });

  const state = await new Promise(resolve => observable.subscribe(resolve));

  state.increment();
  state.increment();
  state.increment();
  state.decrement();
  state.decrement();

  setTimeout(complete, 0);

  const [values, states] = await Promise.all([
    reduce(createObservable(counter)),
    reduce(createObservable(observable)),
  ]);

  t.deepEqual(values, [0, 1, 2, 3, 2, 1]);
  t.deepEqual(
    states,
    [0, 1, 2, 3, 2, 1].map(value => ({
      state: value,
      increment: state.increment,
      decrement: state.decrement,
    })),
  );
});
