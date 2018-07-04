/* @flow */

import $$observable from 'symbol-observable';
import type { ObservableInterface } from 'es-observable';

import { SimpleStore } from './SimpleStore';

export type Task<S> = (state: S) => ObservableInterface<S> | Promise<S> | S;

const getState = <S>(store: SimpleStore<S>): S => store.getState();

export class Queue<S> {
  /* :: +getStore: () => SimpleStore<S>; */

  #queue /* : Promise<SimpleStore<S>> */;

  constructor(store: SimpleStore<S>) {
    this.#queue = Promise.resolve(store);
    this.getStore = () => store;
  }

  run(task: S => void | Promise<void>) {
    this.#queue = this.#queue
      .then(getState)
      .then(task)
      .then(this.getStore);
  }

  createTaskSender(
    next: S => void,
    error: Error => void,
  ): (stateHandler: Task<S> | S) => void {
    return stateHandler =>
      typeof stateHandler == 'function'
        ? this.addTask(stateHandler, next, error)
        : this.run(() => next(stateHandler));
  }

  addTask(task: Task<S>, next: S => void, error: Error => void) {
    this.run(async (state: S) => {
      const result: ObservableInterface<S> | Promise<S> | S = task(state);

      // $FlowFixMe
      if (result && typeof result[$$observable] == 'function') {
        const observable: ObservableInterface<S> = result
          // $FlowFixMe
          [$$observable]();

        await new Promise(resolve =>
          observable.subscribe(
            next,
            err => {
              error(err);
              resolve();
            },
            resolve,
          ),
        );

        // $FlowFixMe
      } else if (result && typeof result.then == 'function') {
        await result.then(next, error);
      } else {
        next((result: any));
      }
    });
  }

  handle(
    payload:
      | ObservableInterface<Task<S> | S>
      | Promise<Task<S> | S>
      | Task<S>
      | S,
    next: S => void,
    error: Error => void,
  ) {
    // $FlowFixMe
    if (payload && typeof payload[$$observable] == 'function') {
      // $FlowFixMe
      payload[$$observable]().subscribe(
        this.createTaskSender(next, error),
        error,
      );
      // $FlowFixMe
    } else if (payload && typeof payload.then == 'function') {
      (payload: any).then(this.createTaskSender(next, error), error);
    } else if (typeof payload == 'function') {
      this.addTask(payload, next, error);
    } else {
      this.run(() => next((payload: any)));
    }
  }
}
