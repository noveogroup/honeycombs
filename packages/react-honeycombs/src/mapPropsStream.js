/* @flow */

import * as React from 'react';
import {
  Observable,
  type ObservableInterface,
  // eslint-disable-next-line no-unused-vars
  type SubscriptionInterface,
  type SubscriptionObserver,
} from 'es-observable';

export type HOC<P, R> = (
  Component: React$ComponentType<P>,
) => React$ComponentType<R>;

export type ObservableTransform<P, R> = (
  propsObservable: Observable<P>,
) => ObservableInterface<R>;

function callNext<T>(observer: SubscriptionObserver<T>) {
  observer.next(this);
}

export const mapPropsStream = <P: {}, R: {}>(
  fn: ObservableTransform<P, R>,
): HOC<R, P> => (Component: React$ComponentType<R>): React$ComponentType<P> =>
  class WithStream extends React.PureComponent<P, R> {
    /* ::
    propsObservers: Set<SubscriptionObserver<P>>;
    propsObservable: Observable<P>;
    stateObservable: ObservableInterface<R>;
    subscription: SubscriptionInterface<R>;
    */

    constructor(props, context) {
      super(props, context);

      this.propsObservable = new Observable(subscriptionObserver => {
        this.propsObservers.add(subscriptionObserver);
        return () => {
          this.propsObservers.delete(subscriptionObserver);
        };
      });

      this.stateObservable = fn(this.propsObservable);
    }

    componentDidMount() {
      this.subscribe();
    }

    componentWillReceiveProps(nextProps) {
      this.pushProps(nextProps);
    }

    componentWillUnmount() {
      this.unsubscribe();
    }

    subscribe() {
      this.subscription = this.stateObservable.subscribe(
        (value: R): void => {
          this.setState(value);
        },
      );

      this.pushProps(this.props);
    }

    pushProps(props: P) {
      this.propsObservers.forEach(callNext, props);
    }

    unsubscribe() {
      this.subscription.unsubscribe();
      delete this.subscription;
    }

    render() {
      return this.state && <Component {...this.state} />;
    }
  };
