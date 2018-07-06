/* @flow */

import type { ObservableInterface } from 'es-observable';

import { StoreObservable } from './StoreObservable';
// eslint-disable-next-line no-unused-vars
import { StateSubject } from './StateSubject';
import { Store, type StoreLike } from './Store';
import {
  Queue,
  type PayloadHandler,
  type PayloadPromiseHandler,
  type PayloadObservableHandler,
  type PromiseSetter,
  type ObservableSetter,
} from './Queue';
import { Bee } from './Bee';

class Honeycomb<S> extends StoreObservable<S>
  implements ObservableInterface<S>, StoreLike<S> {
  #queue /* : Queue<S> */;

  #store /* : Store<S> */;

  #mainSubject /* : StateSubject<S> */;

  #createCaseEmitters /* : () => * */;

  constructor(initialState: S) {
    const store = Store.of(initialState);
    const mainSubject = new StateSubject(store);
    const queue = new Queue(store);
    super(store, mainSubject);
    this.#mainSubject = mainSubject;
    this.#queue = queue;
    this.#store = store;

    this.#createCaseEmitters = () => {
      const caseSubject: StateSubject<S> = new StateSubject(store);

      return {
        queue,
        store,
        caseSubject,
        next(newState: S) {
          store.setState(newState);
          caseSubject.next(newState);
          mainSubject.next(newState);
        },
        error(err: Error) {
          caseSubject.error(err);
          mainSubject.error(err);
        },
      };
    };
  }

  case<P>(handler: PayloadHandler<S, P>): Bee<S, P> {
    const createCaseEmitters = this.#createCaseEmitters;
    const { queue, store, caseSubject, next } = createCaseEmitters();
    return new Bee(store, caseSubject, queue.case(handler, next));
  }

  fromPromise<P>(handler: PayloadPromiseHandler<S, P>): Bee<S, P> {
    const createCaseEmitters = this.#createCaseEmitters;
    const { queue, store, caseSubject, next, error } = createCaseEmitters();
    return new Bee(store, caseSubject, queue.fromPromise(handler, next, error));
  }

  fromObservable<P>(handler: PayloadObservableHandler<S, P>): Bee<S, P> {
    const createCaseEmitters = this.#createCaseEmitters;
    const { queue, store, caseSubject, next, error } = createCaseEmitters();
    return new Bee(
      store,
      caseSubject,
      queue.fromObservable(handler, next, error),
    );
  }

  awaitPromise<P>(handler: PromiseSetter<S, P>): Bee<S, P> {
    const createCaseEmitters = this.#createCaseEmitters;
    const { queue, store, caseSubject, next, error } = createCaseEmitters();
    return new Bee(
      store,
      caseSubject,
      queue.awaitPromise(handler, next, error),
    );
  }

  awaitObservable<P>(handler: ObservableSetter<S, P>): Bee<S, P> {
    const createCaseEmitters = this.#createCaseEmitters;
    const { queue, store, caseSubject, next, error } = createCaseEmitters();
    return new Bee(
      store,
      caseSubject,
      queue.awaitObservable(handler, next, error),
    );
  }
}

export type { Honeycomb };

export function of<T>(initialState: T): Honeycomb<T> {
  return new Honeycomb(initialState);
}