/* @flow */

export interface StoreLike<S> { getState(): S }

export class Store<S> implements StoreLike<S> {
  static of<T>(initialState: T): Store<T> {
    return new Store(initialState);
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
