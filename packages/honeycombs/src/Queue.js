/* @flow */

import $$observable from 'symbol-observable';
import type { ObservableLike } from 'es-observable';

import { Store } from './Store';

export type Runner<P> = (payload: P) => void;

const getState = <S>(store: Store<S>): S => store.getState();

export class Queue<S> {
  /* :: +getStore: () => Store<S>; */

  #queue /* : Promise<Store<S>> */;

  constructor(store: Store<S>) {
    this.#queue = Promise.resolve(store);
    this.getStore = () => store;
  }

  run(task: S => void | Promise<void>) {
    this.#queue = this.#queue
      .then(getState)
      .then(task)
      .then(this.getStore);
  }

  createParallelRunner(next: S => void): ((S => S) | S) => void {
    return (newState: (S => S) | S) =>
      this.run((prevState: S) =>
        next(typeof newState == 'function' ? newState(prevState) : newState),
      );
  }

  case<P>(handler: P => (S => S) | S, next: S => void) {
    const run = this.createParallelRunner(next);
    return (payload: P) => {
      Promise.resolve(handler(payload)).then(run);
    };
  }

  fromPromise<P>(
    handler: P => Promise<(S => S) | S>,
    next: S => void,
    error: Error => void,
  ) {
    const run = this.createParallelRunner(next);
    return (payload: P) => {
      handler(payload).then(run, error);
    };
  }

  fromObservable<P>(
    handler: P => ObservableLike<(S => S) | S>,
    next: S => void,
    error: Error => void,
  ) {
    const run = this.createParallelRunner(next);
    return (payload: P) => {
      Promise.resolve(handler(payload)).then(result => {
        // $FlowFixMe
        const observable: typeof result = result[$$observable]();
        observable.subscribe(v => run(v), error);
      });
    };
  }

  awaitPromise<P>(
    handler: (S, P) => Promise<S>,
    next: S => void,
    error: Error => void,
  ) {
    return (payload: P): void =>
      this.run(prevState => handler(prevState, payload).then(next, error));
  }

  awaitObservable<P>(
    handler: (S, P) => ObservableLike<S>,
    next: S => void,
    error: Error => void,
  ) {
    return (payload: P): void =>
      this.run(prevState =>
        Promise.resolve(handler(prevState, payload)).then(result => {
          // $FlowFixMe
          const observable: typeof result = result[$$observable]();
          return new Promise(resolve =>
            observable.subscribe(next, error, resolve),
          );
        }),
      );
  }
}
