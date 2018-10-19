/* @flow */

import $$observable from 'symbol-observable';

import type {
  Subscription,
  ObserverInterface,
  ObservableInterface,
} from 'es-observable';

import { StoreObservable } from './StoreObservable';
import { StateSubject } from './StateSubject';
import { type Runner } from './Queue';
import { Store, type StoreLike } from './Store';

class BeeSubject<S, P> extends StoreObservable<S>
  implements ObservableInterface<S>, StoreLike<S>, ObserverInterface<P> {
  #run /* : Runner<P> */;

  constructor(store: Store<S>, subject: StateSubject<S>, run: Runner<P>) {
    super(store, subject);
    this.#run = run;
  }

  next(payload: P) {
    const run = this.#run;
    run(payload);
  }
}

export type Bee<S, P> = {
  (payload: P): void,
  next(payload: P): void,
  getState(): S,
  +subscribe: ((
    next: (S) => void,
    error?: (Error) => void,
    complete?: () => void,
  ) => Subscription<S>) &
    ((observer: ObserverInterface<S>) => Subscription<S>),
};

export const of = <S, P>(
  store: Store<S>,
  subject: StateSubject<S>,
  run: Runner<P>,
): Bee<S, P> => {
  const beeSubject = new BeeSubject(store, subject, run);

  const bee = (payload: P): void => beeSubject.next(payload);

  bee.next = (payload: P): void => beeSubject.next(payload);
  bee.getState = (): S => beeSubject.getState();
  bee.subscribe = (n: any, e, c) => beeSubject.subscribe(n, e, c);

  // $FlowFixMe
  bee[$$observable] = beeSubject[$$observable]();

  return bee;
};
