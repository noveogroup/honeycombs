/* @flow */

import $$observable from 'symbol-observable';
import type { ObservableInterface } from 'es-observable';

import { Store } from './Store';

export type Task<S> = S => ObservableInterface<S> | Promise<S> | S;

type Res<S> = (S => S) | S;

export type PayloadHandler<S, P> = P => Res<S>;
export type PayloadPromiseHandler<S, P> = P => Promise<Res<S>>;
export type PayloadObservableHandler<S, P> = P => ObservableInterface<Res<S>>;
export type PromiseSetter<S, P> = (S, P) => Promise<S>;
export type ObservableSetter<S, P> = (S, P) => ObservableInterface<S>;

type AddTask<S> = (Res<S>) => void;

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

  createParallelRunner(next: S => void): AddTask<S> {
    return (newState: Res<S>) =>
      this.run((prevState: S) =>
        next(typeof newState == 'function' ? newState(prevState) : newState),
      );
  }

  case<P>(handler: PayloadHandler<S, P>, next: S => void) {
    const run = this.createParallelRunner(next);
    return (payload: P) => {
      Promise.resolve(handler(payload)).then(run);
    };
  }

  fromPromise<P>(
    handler: PayloadPromiseHandler<S, P>,
    next: S => void,
    error: Error => void,
  ) {
    const run = this.createParallelRunner(next);
    return (payload: P) => {
      handler(payload).then(run, error);
    };
  }

  fromObservable<P>(
    handler: PayloadObservableHandler<S, P>,
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
    handler: PromiseSetter<S, P>,
    next: S => void,
    error: Error => void,
  ) {
    return (payload: P): void =>
      this.run(prevState => handler(prevState, payload).then(next, error));
  }

  awaitObservable<P>(
    handler: ObservableSetter<S, P>,
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
