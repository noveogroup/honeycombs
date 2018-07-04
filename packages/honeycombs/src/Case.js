/* @flow */

import type { ObserverInterface, ObservableInterface } from 'es-observable';

import { StoreObservable } from './StoreObservable';
import { StateSubject } from './StateSubject';
import { Queue, type Task } from './Queue';
import type { SimpleStoreLike } from './SimpleStore';

export type Handler<S, P> = P =>
  | ObservableInterface<Task<S> | S>
  | Promise<Task<S> | S>
  | Task<S>
  | S;

export class Case<S, P> extends StoreObservable<S>
  implements ObservableInterface<S>, SimpleStoreLike<S>, ObserverInterface<P> {
  static from<ST, PT>(
    queue: Queue<ST>,
    mainSubject: StateSubject<ST>,
    handler: Handler<ST, PT>,
  ): Case<ST, PT> {
    return new Case(queue, mainSubject, handler);
  }

  static state<ST>(
    queue: Queue<ST>,
    mainSubject: StateSubject<ST>,
    handler: Task<S>,
  ): Case<ST, void> {
    return new Case(queue, mainSubject, () => handler);
  }

  static always<ST>(
    queue: Queue<ST>,
    mainSubject: StateSubject<ST>,
    payload: ST,
  ): Case<ST, void> {
    const always = (): ST => payload;
    return Case.from(queue, mainSubject, () => always);
  }

  static set<ST>(
    queue: Queue<ST>,
    mainSubject: StateSubject<ST>,
  ): Case<ST, ST> {
    return Case.from(queue, mainSubject, (payload: ST) => payload);
  }

  #queue /* : Queue<S> */;

  #mainSubject /* : StateSubject<S> */;

  #subject /* : StateSubject<S> */;

  #handler /* : Handler<S, P> */;

  #next /* : (S) => void */;

  #error /* : (Error) => void */;

  constructor(
    queue: Queue<S>,
    mainSubject: StateSubject<S>,
    handler: Handler<S, P>,
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
    this.#queue.handle(handler(payload), this.#next, this.#error);
  }
}
