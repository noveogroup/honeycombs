/* @flow */

import type { ObserverInterface, ObservableInterface } from 'es-observable';

import { StoreObservable } from './StoreObservable';
import { StateSubject } from './StateSubject';
import { type Runner } from './Queue';
import { Store, type StoreLike } from './Store';

export class Case<S, P> extends StoreObservable<S>
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
