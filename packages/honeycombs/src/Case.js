/* @flow */

import type { ObserverInterface, ObservableInterface } from 'es-observable';

import { StateSubject } from './StateSubject';
import { SimpleStore } from './SimpleStore';
import { StoreObservable } from './StoreObservable';

export class Case<S, P> extends StoreObservable<S>
  implements ObservableInterface<S>, ObserverInterface<P> {
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
    super(store);
    this.#mainSubject = mainSubject;
    this.#handler = handler;
  }

  next(payload: P) {
    const handler = this.#handler;
    const newState = this.#store.setState(
      handler(this.#store.getState(), payload),
    );
    this.#subject.next(newState);
    this.#mainSubject.next(newState);
  }
}
