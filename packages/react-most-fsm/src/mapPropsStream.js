/* @flow */

import * as React from 'react';
import { Stream, from, type Observable, type Subscription } from 'most';

import { createSubject, type Subject } from 'most-fsm';

type MapPropsStream = <P: {}, R: {}>(
  fn: (props$: Stream<P>) => Stream<R>,
) => (Component: React$ComponentType<R>) => React$ComponentType<P>;

export const mapPropsStream: MapPropsStream = <P: {}, R: {}>(
  pipe: (props$: Stream<P>) => Observable<R>,
) => (Component: React$ComponentType<any>): React$ComponentType<any> =>
  class WithProps extends React.PureComponent<P, R> {
    constructor(props: P, context: mixed) {
      super(props, context);
      this.propsSubject = createSubject();
      this.props$ = from(pipe(this.propsSubject.stream)).multicast();
    }

    componentWillMount() {
      this.subscription = this.props$.subscribe({
        next: (newProps: R) => this.setState(newProps),
      });
      this.propsSubject.next(this.props);
    }

    componentWillReceiveProps(newProps: P) {
      this.propsSubject.next(newProps);
    }

    componentWillUnmount() {
      this.subscription.unsubscribe();
    }

    propsSubject: Subject<P>;
    props$: Stream<R>;
    subscription: Subscription<R>;

    render() {
      return <Component {...this.state} />;
    }
  };
