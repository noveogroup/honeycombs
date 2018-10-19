# Honeycombs

State manager with built-in side-effects.

## Install

`npm i -S honeycombs` or `yarn add honeycombs`

## API

```js
import * as hc from 'honeycombs';
```

- `hc.of(initialState): Honeycomb` — creates instance of `Honeycomb`.

### `Honeycomb`

`Honeycomb` is store. Store can to create handlers (`Bee` instances) by this methods:

- `honeycomb.transform(payload => oldState => newState): Bee`

- `honeycomb.apply(payload => newState): Bee`

- `honeycomb.apply(payload => oldState => newState): Bee`

- `honeycomb.just(): Bee` — `Bee` just sets state to received payload value.

- `honeycomb.always(constantValue): Bee` — `Bee` always sets state to `constantValue`.

- `honeycomb.fromPromise(payload => Promise<newState>): Bee`

  `honeycomb.fromPromise(payload => Promise<oldState => newState>): Bee`

  Order of state changes depends on order of promises resolving.

- `honeycomb.awaitPromise(payload => Promise<newState>): Bee`

  `honeycomb.awaitPromise(payload => Promise<oldState => newState>): Bee`

  Order of state changes depends on order of `Bee` in call queue.
  Resolving of this promise blocks to the queue.

- `honeycomb.fromObservable(payload => Observable<newState>): Bee`

  `honeycomb.fromObservable(payload => Observable<oldState => newState>): Bee`

  All values of `Observable` will change the state.
  Order of state changes depends on order of `Observable` values.

- `honeycomb.awaitObservable(payload => Observable<newState>): Bee`

  `honeycomb.awaitObservable(payload => Observable<oldState => newState>): Bee`

  All values of `Observable` will change the state.
  Awaiting of `Observable` complete blocks to the queue.

`Honeycomb` is `Observable`. You can to subscribe to store using method `subscribe`:

`honeycomb.subscribe(next [, error, complete] ): Subscription`

`honeycomb.subscribe(observer): Subscription`

`Observer` is object with optional methods:

- `observer.next(newState)`
- `observer.error(Error)`
- `observer.complete()`

`Subscription` is object with method `unsubscribe()`;

### `Bee`

`Bee` is store handler. This is:

- Function that can receive a payload value.
- Observer that have method `next()`, receives a payload value.
- `Observable` of state values, emits only when this `Bee` was called.
  So you can to subscribe to state changes, executed of specified `Bee`.

## Usage

```js
import * as hc from 'honeycombs';

const counter = hc.of(0);

const reset = counter.always(0);
const setTo = counter.just();
const increment = counter.transform(state => state + 1);
const decrement = counter.transform(state => state - 1);
const add = counter.apply(payload => state => state + payload);
const subtract = counter.apply(payload => state => state - payload);

increment();  // 1
increment();  // 2
decrement();  // 1
add(5);       // 6
subtract(1);  // 5
setTo(10);    // 10
reset();      // 0
```

### With observable streams

```js
import * as hc from 'honeycombs';
import { from, empty, fromPromise } from 'most';

const user = hc.of({ status: 'not logged in' });

const login = user.awaitObservable((_, { username, password }) =>
  fromPromise(
    fetch('https://example.com/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
      .then(async response => {
        if (!response.ok) return { status: 'auth failed' };

        const { assessToken, refreshToken } = await response.json();

        return {
          status: 'logged in',
          username,
          assessToken,
          refreshToken,
        };
      })
      .catch(() => ({ status: 'auth failed' })),
  ).startWith({ status: 'logging in' }),
);

const refresh = user.awaitObservable(
  state =>
    state.status === 'logged in'
      ? fromPromise(
          fetch('https://example.com/api/token', {
            method: 'POST',
            body: JSON.stringify({ refreshToken: state.refreshToken }),
          })
            .then(async response => {
              if (!response.ok) return { status: 'not logged in' };

              const { assessToken, refreshToken } = await response.json();

              return {
                status: 'logged in',
                username: state.username,
                assessToken,
                refreshToken,
              };
            })
            .catch(() => ({ status: 'auth failed' })),
        ).startWith({ status: 'logging in' })
      : empty(),
);

const logout = user.always({ status: 'not logged in' });

from(user)
  .filter(state => state.status === 'logged in')
  .merge(from(logout))
  .subscribe(console.log);

login({ username: '...', password: '...' });
refresh({ refreshToken: '...' });
logout();
```

### With promises

```js
import * as hc from 'honeycombs';

const posts = hc.of();

const loadPosts = posts.fromPromise(
  ({ limit = 10, offset = 0 } = {}) =>
    fetch(`https://example.com/api/posts?limit=${limit}&offset=${offset}`)
      .then(response => response.json()),
);

loadPosts();
loadPosts({ limit: 20, offset: 50 });
```
