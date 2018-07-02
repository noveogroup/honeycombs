/* @flow */

import $$observable from 'symbol-observable';

import {
  Subscription,
  type ObservableInterface,
  type ObserverInterface,
} from 'es-observable';

import { StateSubject } from './StateSubject';
import { SimpleStore } from './SimpleStore';

export class StoreObservable<S> implements ObservableInterface<S> {
  #store /* : SimpleStore<S> */;

  #subject /* : StateSubject<S> */;

  constructor(store: SimpleStore<S>) {
    this.#store = store;
    this.#subject = new StateSubject(store);
  }

  getState(): S {
    return this.#store.getState();
  }

  subscribe(observer: (S => any) | ObserverInterface<S>): Subscription<S> {
    return this.#subject.subscribe(observer);
  }

  /* ::
  +subscribe: ((
    next: (S) => any,
    error?: (Error) => any,
    complete?: () => any,
  ) => Subscription<S>) &
    ((observer: ObserverInterface<S>) => Subscription<S>);
  */

  // $FlowFixMe
  [$$observable]() {
    return this;
  }
}
