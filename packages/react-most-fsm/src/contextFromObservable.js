/* @flow */

import * as React from 'react';
import { from, type Observable } from 'most';

import { mapPropsStream } from './mapPropsStream';

export const contextFromObservable = <T, C: React$Node>(
  observable: Observable<T>,
): {|
  Provider: React$ComponentType<{| children: C |}>,
  Consumer: React$ComponentType<{| children: (value: T) => C |}>,
|} => {
  const { Provider, Consumer } = React.createContext();

  const stream = from(observable);

  return {
    Provider: mapPropsStream(props$ =>
      props$
        .combine((props, value) => ({ ...props, value }), stream)
        .multicast(),
    )(Provider),

    Consumer: (props: *) => (
      <Consumer>
        {value => (value == null ? null : props.children(value))}
      </Consumer>
    ),
  };
};
