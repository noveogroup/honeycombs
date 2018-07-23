/* @flow */

import {
  type ObserverInterface,
  type SubscriberSubscription,
} from 'es-observable';

export interface ObservableInterface<T> {
  +subscribe: ((
    next: (T) => void,
    error?: (Error) => void,
    complete?: () => void,
  ) => SubscriberSubscription<T>) &
    ((observer: ObserverInterface<T>) => SubscriberSubscription<T>);
}
