/* @flow */

import { SimpleStore } from './SimpleStore';

const getState = <S>(store: SimpleStore<S>): S => store.getState();

export class Queue<S> {
  /* :: +getStore: () => SimpleStore<S>; */

  #queue /* : Promise<SimpleStore<S>> */;

  constructor(store: SimpleStore<S>) {
    this.#queue = Promise.resolve(store);
    this.getStore = () => store;
  }

  run(task: S => Promise<void>) {
    this.#queue = this.#queue
      .then(getState)
      .then(task)
      .then(this.getStore);
  }
}
