/* @flow */

export interface SimpleStoreLike<S> { getState(): S }

export class SimpleStore<S> implements SimpleStoreLike<S> {
  static of<T>(initialState: T): SimpleStore<T> {
    return new SimpleStore(initialState);
  }

  #state /* : S */;

  constructor(initialState: S) {
    this.#state = initialState;
  }

  getState(): S {
    return this.#state;
  }

  setState(newState: S): S {
    return (this.#state = newState);
  }
}
