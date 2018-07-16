/* @flow */
/* eslint import/no-extraneous-dependencies: off */

import test from 'ava';

import { reduce } from '../../es-observable/src/reduce';

import { Subject } from './Subject';

test('Subject', async t => {
  const subject = new Subject();

  setTimeout(() => {
    subject.next(1);
    subject.next(2);
    subject.next(3);
    subject.complete();
  }, 0);

  t.deepEqual(await reduce(subject), [1, 2, 3]);
});
