/* @flow */

import $$observable from 'symbol-observable';

import type {
  ObserverInterface,
  ObservableInterface,
  SubscriberSubscription,
} from './types';

import { Subscription } from './Subscription';
import { SubscriptionObserver } from './SubscriptionObserver';

export type SubscriberFunction<T> = (
  observer: SubscriptionObserver<T>,
) => (void => void) | SubscriberSubscription<T>;

const emptySubscription = () => {};

export class Observable<T> implements ObservableInterface<T> {
  static of<V>(...values: $ReadOnlyArray<V>): Observable<V> {
    return new Observable(subscriptionObserver => {
      values.forEach(value => subscriptionObserver.next(value));
      subscriptionObserver.complete();
      return emptySubscription;
    });
  }

  static from<V>(
    source /* : Iterable<V> | ObservableInterface<V> */,
  ): Observable<V> {
    // $FlowFixMe
    if (typeof source[Symbol.iterator] == 'function') {
      return Observable.of(...(source: any));
    }

    // $FlowFixMe
    if (typeof source[$$observable] == 'function') {
      return new Observable(subscriptionObserver =>
        // $FlowFixMe
        (source[$$observable](): ObservableInterface<V>).subscribe(
          subscriptionObserver,
        ),
      );
    }

    throw new Error('Unknown source');
  }

  #subscriber /* : SubscriberFunction<T> */;

  #subscriptionObserver /* : SubscriptionObserver<T> */;

  constructor(subscriber: SubscriberFunction<T>) {
    this.#subscriber = subscriber;
  }

  subscribe(
    next: (T => void) | ObserverInterface<T>,
    error?: Error => void,
    complete?: () => void,
  ): Subscription<T> {
    const observer: ObserverInterface<T> =
      typeof next == 'function' ? { next, error, complete } : next;

    return new Subscription(observer, this.#subscriber);
  }

  /* ::
  +subscribe: ((
    next: (T) => void,
    error?: (Error) => void,
    complete?: () => void,
  ) => Subscription<T>) &
    ((observer: ObserverInterface<T>) => Subscription<T>);
  */

  // $FlowFixMe
  [$$observable]() {
    return this;
  }
}
