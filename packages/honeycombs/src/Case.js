/* @flow */

import $$observable from 'symbol-observable';
import type { ObserverInterface, ObservableInterface } from 'es-observable';

import { StoreObservable } from './StoreObservable';
import { StateSubject } from './StateSubject';
import { SimpleStore, type SimpleStoreLike } from './SimpleStore';

export class Case<S, P> extends StoreObservable<S>
  implements ObservableInterface<S>, SimpleStoreLike<S>, ObserverInterface<P> {
  static from<ST, PT>(
    store: SimpleStore<ST>,
    mainSubject: StateSubject<ST>,
    handler: (
      state: ST,
      payload: PT,
    ) => ObservableInterface<ST> | Promise<ST> | ST,
  ): Case<ST, PT> {
    return new Case(store, mainSubject, handler);
  }

  static payload<ST, PT>(
    store: SimpleStore<ST>,
    mainSubject: StateSubject<ST>,
    handler: (payload: PT) => ObservableInterface<ST> | Promise<ST> | ST,
  ): Case<ST, PT> {
    return Case.from(store, mainSubject, (_: ST, payload: PT) =>
      handler(payload),
    );
  }

  static always<ST>(
    store: SimpleStore<ST>,
    mainSubject: StateSubject<ST>,
    payload: ST,
  ): Case<ST, void> {
    return Case.from(store, mainSubject, () => payload);
  }

  static set<ST>(
    store: SimpleStore<ST>,
    mainSubject: StateSubject<ST>,
  ): Case<ST, ST> {
    return Case.from(store, mainSubject, (_, payload: ST) => payload);
  }

  #store /* : SimpleStore<S> */;

  #mainSubject /* : StateSubject<S> */;

  #subject /* : StateSubject<S> */;

  #handler /* : (state: S, payload: P) => ObservableInterface<S> | Promise<S> | S */;

  constructor(
    store: SimpleStore<S>,
    mainSubject: StateSubject<S>,
    handler: (state: S, payload: P) => ObservableInterface<S> | Promise<S> | S,
  ) {
    const subject = new StateSubject(store);
    super(store, subject);
    this.#mainSubject = mainSubject;
    this.#handler = handler;
    this.#store = store;
    this.#subject = subject;
  }

  next(payload: P) {
    const handler = this.#handler;
    const store = this.#store;
    const subject = this.#subject;
    const mainSubject = this.#mainSubject;

    const result: ObservableInterface<S> | Promise<S> | S = handler(
      store.getState(),
      payload,
    );

    // $FlowFixMe
    if (typeof result[$$observable] == 'function') {
      // $FlowFixMe
      const observable: ObservableInterface<S> = result[$$observable]();

      observable.subscribe(
        value => {
          const newState = store.setState(value);
          subject.next(newState);
          mainSubject.next(newState);
        },
        error => {
          subject.error(error);
          mainSubject.error(error);
        },
        () => {
          subject.complete();
          mainSubject.complete();
        },
      );
      // $FlowFixMe
    } else if (typeof result.then == 'function') {
      result.then(
        value => {
          const newState = store.setState(value);
          subject.next(newState);
          mainSubject.next(newState);
        },
        error => {
          subject.error(error);
          mainSubject.error(error);
        },
      );
    } else {
      const newState = store.setState((result: any));
      this.#subject.next(newState);
      this.#mainSubject.next(newState);
    }
  }
}
