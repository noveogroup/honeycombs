/* @flow */

import {
  Observable,
  type ObservableInterface,
  type ObservableLike,
} from 'es-observable';

import { map } from './map';
import { StoreObservable } from './StoreObservable';
import { StateSubject } from './StateSubject';
import { Store, type StoreLike } from './Store';
import { Queue } from './Queue';
import * as bee from './Bee';

export type ActionsSpec<S> = {
  [string]: bee.Bee<S, any>,
};

export type GetNextType<S> = <B: bee.Bee<S, any>>(
  B,
) => $PropertyType<B, 'next'>;

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

  apply<P>(handler: P => (S => S) | S): bee.Bee<S, P> {
    return this.case(handler);
  }

  case<P>(handler: P => (S => S) | S): bee.Bee<S, P> {
    const createCaseEmitters = this.#createCaseEmitters;
    const { queue, store, caseSubject, next } = createCaseEmitters();
    return bee.of(store, caseSubject, queue.case(handler, next));
  }

  transform(handler: S => S): bee.Bee<S, void> {
    return this.case(() => handler);
  }

  always(payload: S): bee.Bee<S, void> {
    return this.case(() => payload);
  }

  just(): bee.Bee<S, S> {
    return this.case(payload => payload);
  }

  willBee<P>(handler: P => Promise<(S => S) | S>): Bee<S, P> {
    return this.fromPromise(handler);
  }

  fromPromise<P>(handler: P => Promise<(S => S) | S>): bee.Bee<S, P> {
    const createCaseEmitters = this.#createCaseEmitters;
    const { queue, store, caseSubject, next, error } = createCaseEmitters();
    return bee.of(store, caseSubject, queue.fromPromise(handler, next, error));
  }

  willBees<P>(handler: P => ObservableInterface<(S => S) | S>): Bee<S, P> {
    return this.fromObservable(handler);
  }

  fromObservable<P>(handler: P => ObservableLike<(S => S) | S>): bee.Bee<S, P> {
    const createCaseEmitters = this.#createCaseEmitters;
    const { queue, store, caseSubject, next, error } = createCaseEmitters();
    return bee.of(
      store,
      caseSubject,
      queue.fromObservable(handler, next, error),
    );
  }

  awaitBee<P>(handler: (S, P) => Promise<S>): Bee<S, P> {
    return this.awaitPromise(handler);
  }

  awaitPromise<P>(handler: (S, P) => Promise<S>): bee.Bee<S, P> {
    const createCaseEmitters = this.#createCaseEmitters;
    const { queue, store, caseSubject, next, error } = createCaseEmitters();
    return bee.of(store, caseSubject, queue.awaitPromise(handler, next, error));
  }

  awaitBees<P>(handler: (S, P) => ObservableInterface<S>): Bee<S, P> {
    return this.awaitObservable(handler);
  }

  awaitObservable<P>(handler: (S, P) => ObservableLike<S>): bee.Bee<S, P> {
    const createCaseEmitters = this.#createCaseEmitters;
    const { queue, store, caseSubject, next, error } = createCaseEmitters();
    return bee.of(
      store,
      caseSubject,
      queue.awaitObservable(handler, next, error),
    );
  }

  createStoreObservable<SP: ActionsSpec<S>>(
    bees: SP,
  ): Observable<{|
    ...$Exact<$ObjMap<SP, GetNextType<S>>>,
    state: S,
  |}> {
    const methods = Object.entries(bees).reduce(
      (acc, [key, beeInstance]: [string, any]) => {
        acc[key] = beeInstance.next;
        return acc;
      },
      {},
    );

    return map((state: S) => ({ ...methods, state }), this);
  }
}

export type { Honeycomb };

export function of<T>(initialState: T): Honeycomb<T> {
  return new Honeycomb(initialState);
}
