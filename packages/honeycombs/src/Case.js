/* @flow */

import type { ObserverInterface, ObservableInterface } from 'es-observable';

import { StoreObservable } from './StoreObservable';
import { StateSubject } from './StateSubject';
import { type Runner } from './Queue';
import { SimpleStore, type SimpleStoreLike } from './SimpleStore';

export class Case<S, P> extends StoreObservable<S>
  implements ObservableInterface<S>, SimpleStoreLike<S>, ObserverInterface<P> {
  #run /* : Runner<P> */;

  constructor(store: SimpleStore<S>, subject: StateSubject<S>, run: Runner<P>) {
    super(store, subject);
    this.#run = run;
  }

  next(payload: P) {
    const run = this.#run;
    run(payload);
  }
}
