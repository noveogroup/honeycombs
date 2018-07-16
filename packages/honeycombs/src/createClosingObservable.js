/* @flow */
/* eslint
  import/no-extraneous-dependencies: off,
  import/named: off,
*/

import { Observable, type ObservableInterface } from '../../es-observable/src';

import { Subject } from './Subject';

export const createClosingObservable = () => {
  const subject = new Subject();
  return {
    complete: () => subject.complete(),
    createObservable: <T>(target: ObservableInterface<T>) =>
      new Observable(observer => {
        const targetSubscription = target.subscribe(observer);
        const subjectSubscription = subject.subscribe(observer);
        return () => {
          targetSubscription.unsubscribe();
          subjectSubscription.unsubscribe();
        };
      }),
  };
};
