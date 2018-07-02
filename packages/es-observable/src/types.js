/* @flow */

/* eslint no-use-before-define: off */

// eslint-disable-next-line no-unused-vars
export interface SubscriberSubscription<T> {
  unsubscribe(): void;
}

export interface SubscriptionInterface<T> extends SubscriberSubscription<T> {
  get closed(): boolean;
}

export interface ObservableInterface<T> {
  +subscribe: ((
    next: (T) => void,
    error?: (Error) => void,
    complete?: () => void,
  ) => SubscriptionInterface<T>) &
    ((observer: ObserverInterface<T>) => SubscriptionInterface<T>);
}

export interface ObserverInterface<T> {
  +start?: void | ((subscription: SubscriptionInterface<T>) => void);
  +next?: void | ((value: T) => void);
  +error?: void | ((errorValue: Error) => void);
  +complete?: void | (() => void);
}

export interface SubscriptionObserverInterface<T> {
  next(value: T): void;
  error(errorValue: Error): void;
  complete(): void;
  get closed(): boolean;
}
