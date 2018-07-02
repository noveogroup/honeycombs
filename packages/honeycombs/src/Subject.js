/* @flow */

import {
  Observable,
  type ObservableInterface,
  type SubscriptionObserver,
  type ObserverInterface,
} from 'es-observable';

function callNext<T>(observer: SubscriptionObserver<T>) {
  return observer.next(this);
}

function callError<T>(observer: SubscriptionObserver<T>) {
  return observer.error(this);
}

const callComplete = <T>(observer: SubscriptionObserver<T>) =>
  observer.complete();

export class Subject<T> extends Observable<T>
  implements ObservableInterface<T>, ObserverInterface<T> {
  #observers /* : Set<SubscriptionObserver<T>> */;

  constructor() {
    const observers: Set<SubscriptionObserver<T>> = new Set();

    super(observer => {
      observers.add(observer);
      return () => {
        observers.delete(observer);
      };
    });

    this.#observers = observers;
  }

  next(value: T) {
    this.#observers.forEach(callNext, value);
  }

  error(error: Error) {
    this.#observers.forEach(callError, error);
  }

  complete() {
    this.#observers.forEach(callComplete);
  }
}
