/* @flow */

/* :: import { Subscription } from './Subscription'; */

import type {
  // eslint-disable-next-line no-unused-vars
  ObserverInterface,
  SubscriptionObserverInterface,
} from './types';

const emptyFn = () => {};

export class SubscriptionObserver<T>
  implements SubscriptionObserverInterface<T> {
  #next /* : T => void */;

  #error /* : Error => void */;

  #complete /* : () => void */;

  #subscription /* : Subscription<T> */;

  #observer /* : ObserverInterface<T> */;

  constructor(subscription: Subscription<T>) {
    this.#subscription = subscription;
    this.#observer = subscription.observer;
    this.#next = subscription.observer.next || emptyFn;
    this.#error = subscription.observer.error || emptyFn;
    this.#complete = subscription.observer.complete || emptyFn;
  }

  next(value: T) {
    this.#next.call(this.#subscription.observer, value);
  }

  error(error: Error) {
    this.#error.call(this.#subscription.observer, error);
    this.#subscription.unsubscribe();
  }

  complete() {
    this.#complete.call(this.#subscription.observer);
    this.#subscription.unsubscribe();
  }

  close() {
    this.#next = emptyFn;
    this.#error = emptyFn;
    this.#complete = emptyFn;
  }

  get closed(): boolean {
    return this.#subscription.closed;
  }

  get subscription(): Subscription<T> {
    return this.#subscription;
  }
}
