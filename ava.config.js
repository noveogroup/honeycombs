/* @flow */

import testOptions from './babel.config';

export default {
  require: ['@babel/register', 'esm'],
  babel: { testOptions },
};
