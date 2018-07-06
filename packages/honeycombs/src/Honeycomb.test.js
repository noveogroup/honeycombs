/* @flow */
/* eslint import/no-extraneous-dependencies: off */

import test from 'ava';

import { Observable } from 'es-observable';
import { reduce } from 'es-observable/src/reduce';

import { of } from './Honeycomb';
import { Subject } from './Subject';

const createObservable = (target, completeSubject = new Subject()) => ({
  complete() {
    completeSubject.complete();
  },
  observable: new Observable(observer => {
    target.subscribe(observer);
    completeSubject.subscribe(observer);
    return () => {};
  }),
});

test('Store', async t => {
  const completeSubject = new Subject();

  const counter = of(0);

  t.is(counter.getState(), 0);

  const inc = value => value + 1;

  const increment = counter.case(() => inc);
  const decrement = counter.fromPromise(async () => state => state - 1);
  const add = counter.fromObservable(payload =>
    Observable.of(state => state + payload),
  );

  const increment3 = counter.fromObservable(() => Observable.of(inc, inc, inc));

  const { observable: storeObservable } = createObservable(
    counter,
    completeSubject,
  );
  const { observable: incObservable } = createObservable(
    increment,
    completeSubject,
  );
  const { observable: decObservable } = createObservable(
    decrement,
    completeSubject,
  );
  const { observable: addObservable } = createObservable(add, completeSubject);
  const { observable: inc3Observable } = createObservable(
    increment3,
    completeSubject,
  );

  increment.next();
  increment.next();
  increment.next();
  decrement.next();
  add.next(10);
  increment3.next();

  setTimeout(() => completeSubject.complete(), 0);

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

test('Store non-blocking execution', async t => {
  const counter = of(0);
  const run1 = counter.fromObservable(createQueue);
  const run2 = counter.fromObservable(createQueue);

  const { observable, complete } = createObservable(counter);

  run1.next();
  run2.next();

  setTimeout(complete, 500);

  t.deepEqual(await reduce(observable), [0, 1, 1, 2, 2, 3, 3]);
});

test('Store blocking execution', async t => {
  const counter = of(0);
  const run1 = counter.awaitObservable(createQueue);
  const run2 = counter.awaitObservable(createQueue);

  const { observable, complete } = createObservable(counter);

  run1.next();
  run2.next();

  setTimeout(complete, 500);

  t.deepEqual(await reduce(observable), [0, 1, 2, 3, 1, 2, 3]);
});
