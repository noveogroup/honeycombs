/* @flow */

import symbolObservable from 'symbol-observable';
import { Stream, from, type Subscriber, type Subscription } from 'most';

import { createEmitter, type Emitter } from './Emitter';
import { maybe } from './Maybe';

type Listener<T> = {|
  next(value: T): void,
  error(value: Error): void,
  complete(value: void | T): void,
  subscribe(subscriber: Subscriber<T>): Subscription<T>,
|};

const call = (fn: () => void) => fn();

const createListener = <T>(): Listener<T> => {
  const nextEmitter: Emitter<T> = createEmitter();
  const errorEmitter: Emitter<Error> = createEmitter();
  const completeEmitter: Emitter<void | T> = createEmitter();

  return {
    next: nextEmitter.emit,
    error: errorEmitter.emit,
    complete: completeEmitter.emit,
    subscribe: (subscriber: Subscriber<T>): Subscription<T> => {
      const bind = <F: Function>(fn: F): F => fn.bind(subscriber);

      const next = maybe(subscriber.next)
        .map(bind)
        .map(nextEmitter.listen);

      const error = maybe(subscriber.error)
        .map(bind)
        .map(errorEmitter.listen);

      const complete = maybe(subscriber.complete)
        .map(bind)
        .map(completeEmitter.listen);

      return {
        unsubscribe() {
          next.forEach(call);
          error.forEach(call);
          complete.forEach(call);
        },
      };
    },
  };
};

export type Subject<T> = {|
  next: (value: T) => void,
  error: (error: Error) => void,
  complete: (value: void | T) => void,
  stream: Stream<T>,
|};

export const createSubject = <T>(): Subject<T> => {
  const { subscribe, ...listeners }: Listener<T> = createListener();

  return {
    ...listeners,
    stream: from({
      subscribe,
      [symbolObservable]() {
        return this;
      },
    }),
  };
};

export const createReplaySubject = <T>(initialState: T): Subject<T> => {
  const { subscribe, next, ...listeners }: Listener<T> = createListener();

  let state: T = initialState;
  const setState = (value: T): T => (state = value);

  return {
    next: (newState: T) => next(setState(newState)),
    ...listeners,
    stream: from({
      subscribe: (subscriber: Subscriber<T>): Subscription<T> => {
        const subscription: Subscription<T> = subscribe(subscriber);
        next(state);
        return subscription;
      },
      [symbolObservable]() {
        return this;
      },
    }),
  };
};
