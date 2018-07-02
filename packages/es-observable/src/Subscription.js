/* @flow */

import type {
  ObserverInterface,
  SubscriberSubscription,
  SubscriptionInterface,
} from './types';

/* :: import type { SubscriberFunction } from './Observable'; */

import { SubscriptionObserver } from './SubscriptionObserver';

export class Subscription<T> implements SubscriptionInterface<T> {
  #closed /* : boolean */;

  #subscription /* : void | SubscriberSubscription<T> */;

  #unsubscribe /* : void | (() => void) */;

  #observer /* : ObserverInterface<T> */;

  #subscriptionObserver /* : SubscriptionObserver<T> */;

  constructor(
    observer: ObserverInterface<T>,
    subscriber: SubscriberFunction<T>,
  ) {
    this.#closed = false;
    if (observer.start) observer.start(this);

    this.#observer = observer;
    this.#subscriptionObserver = new SubscriptionObserver(this);

    const subscription: SubscriberSubscription<T> | (() => void) = subscriber(
      this.#subscriptionObserver,
    );

    if (typeof subscription == 'function') {
      this.#unsubscribe = subscription;
    } else {
      this.#subscription = subscription;
      this.#unsubscribe = subscription.unsubscribe;
    }

    if (this.closed) this.unsubscribe();
  }

  unsubscribe() {
    if (!this.#closed) {
      if (this.#unsubscribe) this.#unsubscribe.call(this.#subscription);
      this.#subscriptionObserver.close();
      this.#closed = true;
    }
  }

  get closed(): boolean {
    return this.#closed;
  }

  get observer(): ObserverInterface<T> {
    return this.#observer;
  }

  get subscriptionObserver(): SubscriptionObserver<T> {
    return this.#subscriptionObserver;
  }
}
