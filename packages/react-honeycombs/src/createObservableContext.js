/* @flow */

import * as React from 'react';
import {
  type ObservableInterface,
  // eslint-disable-next-line no-unused-vars
  type SubscriptionInterface,
} from 'es-observable';

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
    /* :: subscription: SubscriptionInterface<T>; */

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

      this.subscription = observable.subscribe(
        (value: T): void => {
          this.setState({ value });
        },
      );
    }

    unsubscribe() {
      this.subscription.unsubscribe();
    }

    render() {
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
