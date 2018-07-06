/* @flow */

import type { Subscription, ObserverInterface } from 'es-observable';

import { Subject } from './Subject';
import { Store } from './Store';

export class StateSubject<S> extends Subject<S> {
  #store /* : Store<S> */;

  constructor(store: Store<S>) {
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
