/* @flow */

import type { ObservableInterface } from 'es-observable';

import { StoreObservable } from './StoreObservable';
// eslint-disable-next-line no-unused-vars
import { StateSubject } from './StateSubject';
import { SimpleStore, type SimpleStoreLike } from './SimpleStore';
import { Queue, type Task } from './Queue';
import { Case, type Handler } from './Case';

class Store<S> extends StoreObservable<S>
  implements ObservableInterface<S>, SimpleStoreLike<S> {
  #queue /* : Queue<S> */;

  #subject /* : StateSubject<S> */;

  constructor(initialState: S) {
    const store = SimpleStore.of(initialState);
    const subject = new StateSubject(store);
    const queue = new Queue(store);
    super(store, subject);
    this.#subject = subject;
    this.#queue = queue;
  }

  case<P>(handler: Handler<S, P>): Case<S, P> {
    return Case.from(this.#queue, this.#subject, handler);
  }

  state(handler: Task<S>): Case<S, void> {
    return Case.state(this.#queue, this.#subject, handler);
  }

  always(payload: S): Case<S, void> {
    return Case.always(this.#queue, this.#subject, payload);
  }

  set(): Case<S, S> {
    return Case.set(this.#queue, this.#subject);
  }
}

export type { Store };

export function of<T>(initialState: T): Store<T> {
  return new Store(initialState);
}
