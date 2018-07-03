/* @flow */

import type { Subscription, ObserverInterface } from 'es-observable';

import { Subject } from './Subject';
import { SimpleStore } from './SimpleStore';

export class StateSubject<S> extends Subject<S> {
  #store /* : SimpleStore<S> */;

  constructor(store: SimpleStore<S>) {
    super();
    this.#store = store;
  }

  subscribe(observer: (S => any) | ObserverInterface<S>): Subscription<S> {
    const state = this.#store.getState();

    if (typeof observer == 'function') observer(state);
    else if (observer.next) observer.next(state);

    return Subject.prototype.subscribe.call(this, observer);
  }

  /* ::
  +subscribe: ((
    next: (S) => any,
    error?: (Error) => any,
    complete?: () => any,
  ) => Subscription<S>) &
    ((observer: ObserverInterface<S>) => Subscription<S>);
  */
}
