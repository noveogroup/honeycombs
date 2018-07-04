/* @flow */

import $$observable from 'symbol-observable';
import type { ObserverInterface, ObservableInterface } from 'es-observable';

import { StoreObservable } from './StoreObservable';
import { StateSubject } from './StateSubject';
import { Queue } from './Queue';
import type { SimpleStoreLike } from './SimpleStore';

export class Case<S, P> extends StoreObservable<S>
  implements ObservableInterface<S>, SimpleStoreLike<S>, ObserverInterface<P> {
  static from<ST, PT>(
    queue: Queue<ST>,
    mainSubject: StateSubject<ST>,
    handler: (
      state: ST,
      payload: PT,
    ) => ObservableInterface<ST> | Promise<ST> | ST,
  ): Case<ST, PT> {
    return new Case(queue, mainSubject, handler);
  }

  static payload<ST, PT>(
    queue: Queue<ST>,
    mainSubject: StateSubject<ST>,
    handler: (payload: PT) => ObservableInterface<ST> | Promise<ST> | ST,
  ): Case<ST, PT> {
    return Case.from(queue, mainSubject, (_: ST, payload: PT) =>
      handler(payload),
    );
  }

  static always<ST>(
    queue: Queue<ST>,
    mainSubject: StateSubject<ST>,
    payload: ST,
  ): Case<ST, void> {
    return Case.from(queue, mainSubject, () => payload);
  }

  static set<ST>(
    queue: Queue<ST>,
    mainSubject: StateSubject<ST>,
  ): Case<ST, ST> {
    return Case.from(queue, mainSubject, (_, payload: ST) => payload);
  }

  #queue /* : Queue<S> */;

  #mainSubject /* : StateSubject<S> */;

  #subject /* : StateSubject<S> */;

  #handler /* : (state: S, payload: P) => ObservableInterface<S> | Promise<S> | S */;

  #next /* : (S) => void */;

  #error /* : (Error) => void */;

  constructor(
    queue: Queue<S>,
    mainSubject: StateSubject<S>,
    handler: (state: S, payload: P) => ObservableInterface<S> | Promise<S> | S,
  ) {
    const store = queue.getStore();
    const subject = new StateSubject(store);
    super(store, subject);
    this.#mainSubject = mainSubject;
    this.#handler = handler;
    this.#subject = subject;
    this.#queue = queue;

    this.#next = (newState: S) => {
      store.setState(newState);
      subject.next(newState);
      mainSubject.next(newState);
    };

    this.#error = error => {
      subject.error(error);
      mainSubject.error(error);
    };
  }

  next(payload: P) {
    const handler = this.#handler;
    const next = this.#next;
    const error = this.#error;

    this.#queue.run(
      state =>
        new Promise(resolve => {
          const result: ObservableInterface<S> | Promise<S> | S = handler(
            state,
            payload,
          );

          // $FlowFixMe
          if (typeof result[$$observable] == 'function') {
            // $FlowFixMe
            const observable: ObservableInterface<S> = result[$$observable]();

            observable.subscribe(
              next,
              err => {
                error(err);
                resolve();
              },
              resolve,
            );
            // $FlowFixMe
          } else if (typeof result.then == 'function') {
            result.then(next, error).then(resolve);
          } else {
            next((result: any));
            resolve();
          }
        }),
    );
  }
}
