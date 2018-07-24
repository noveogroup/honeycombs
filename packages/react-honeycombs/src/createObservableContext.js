/* @flow */

import * as React from 'react';
// eslint-disable-next-line no-unused-vars
import { type SubscriberSubscription } from 'es-observable';

import type { ObservableInterface } from './types';

type Props<T> = {|
  observable: ObservableInterface<T>,
  children: React$Node,
|};

export const createObservableContext = <T>(): {|
  Provider: React$ComponentType<Props<T>>,
  Consumer: React$ComponentType<{ children: (value: T) => React$Node }>,
|} => {
  const {
    Provider: ReactProvider,
    Consumer: ReactConsumer,
  } = React.createContext();

  class Provider extends React.PureComponent<Props<T>, {| value: T |}> {
    /* :: subscription: SubscriberSubscription<T>; */

    updateObserver = {
      next: (value: T): void => {
        this.setState({ value });
      },
    };

    componentDidMount() {
      this.subscribe();
    }

    componentWillReceiveProps(newProps: Props<T>) {
      const { observable } = this.props;

      if (newProps.observable !== observable) {
        this.unsubscribe();
        this.subscribe();
      }
    }

    componentWillUnmount() {
      this.unsubscribe();
    }

    subscribe() {
      const { observable } = this.props;
      this.subscription = observable.subscribe(this.updateObserver);
    }

    unsubscribe() {
      this.subscription.unsubscribe();
    }

    render() {
      if (!this.state) return null;
      const { children } = this.props;
      const { value } = this.state;
      return <ReactProvider value={value}>{children}</ReactProvider>;
    }
  }

  const Consumer = (props: { children: (value: T) => React$Node }) => (
    <ReactConsumer>
      {value => (value === undefined ? null : props.children(value))}
    </ReactConsumer>
  );

  return { Provider, Consumer };
};
