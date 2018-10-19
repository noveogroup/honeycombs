/* @flow */

// eslint-disable-next-line
import { of, empty, fromPromise } from 'most';
import * as hc from 'honeycombs';

const counter = hc.of(0);

const reset = counter.always(0);
const setTo = counter.just();
const increment = counter.transform(state => state + 1);
const decrement = counter.transform(state => state - 1);
const add = counter.apply(payload => state => state + payload);
const subtract = counter.apply(payload => state => state - payload);

increment(); // 1
increment(); // 2
decrement(); // 1
add(5); // 6
subtract(1); // 5
setTo(10); // 10
reset(); // 0

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

login({ username: '...', password: '...' });
refresh({ refreshToken: '...' });
logout();

const posts = hc.of();

const loadPosts = posts.fromPromise(({ limit = 10, offset = 0 } = {}) =>
  fetch(`https://example.com/api/posts?limit=${limit}&offset=${offset}`).then(
    response => response.json(),
  ),
);

loadPosts();
loadPosts({ limit: 20, offset: 50 });
