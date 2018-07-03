/* @flow */

import type { ObserverInterface, ObservableInterface } from 'es-observable';

import { StoreObservable } from './StoreObservable';
import { StateSubject } from './StateSubject';
import { SimpleStore, type SimpleStoreLike } from './SimpleStore';

export class Case<S, P> extends StoreObservable<S>
  implements ObservableInterface<S>, SimpleStoreLike<S>, ObserverInterface<P> {
  static from<ST, PT>(
    store: SimpleStore<ST>,
    mainSubject: StateSubject<ST>,
    handler: (state: ST, payload: PT) => ST,
  ): Case<ST, PT> {
    return new Case(store, mainSubject, handler);
  }

  static payload<ST, PT>(
    store: SimpleStore<ST>,
    mainSubject: StateSubject<ST>,
    handler: (payload: PT) => ST,
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

  #handler /* : (state: S, payload: P) => S */;

  constructor(
    store: SimpleStore<S>,
    mainSubject: StateSubject<S>,
    handler: (state: S, payload: P) => S,
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

    const newState = store.setState(handler(store.getState(), payload));
    this.#subject.next(newState);
    this.#mainSubject.next(newState);
  }
}
