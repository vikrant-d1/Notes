# Redux, Redux-Saga 

## 1. Redux Fundamentals

### What is Redux?

Redux is a **predictable state container** for JavaScript apps. It helps manage global application state using a strict unidirectional data flow.

### Three Principles of Redux

| # | Principle | Meaning |
|---|-----------|---------|
| 1 | **Single Source of Truth** | The entire app state lives in one store object |
| 2 | **State is Read-Only** | The only way to change state is by dispatching an action |
| 3 | **Changes via Pure Functions** | Reducers are pure functions that take previous state + action → return new state |

### Redux Data Flow

```
User Interaction
      ↓
  dispatch(action)
      ↓
  Middleware (optional — thunk, saga, logger)
      ↓
  Reducer(prevState, action) → newState
      ↓
  Store updates
      ↓
  UI re-renders (via useSelector / connect)
```

---

## 2. Core Redux Concepts

### Actions

Actions are plain JavaScript objects with a `type` field.

```js
*// Action*
const increment = { type: 'counter/increment', payload: 5 };

*// Action Creator*
const increment = (*amount*) => ({
  type: 'counter/increment',
  payload: amount,
});
```

### Reducers

Pure functions: `(state, action) => newState`. They must never mutate state.

```js
const initialState = { count: 0 };

function counterReducer(*state* = initialState, *action*) {
  switch (action.type) {
    case 'counter/increment':
      return { ...state, count: state.count + action.payload };
    case 'counter/decrement':
      return { ...state, count: state.count - action.payload };
    default:
      return state;
  }
}
```

### Store

```js
import { createStore, combineReducers } from 'redux';

const rootReducer = combineReducers({
  counter: counterReducer,
  user: userReducer,
});

const store = createStore(rootReducer);
```

### Key Store Methods

| Method | Description |
|--------|-------------|
| `store.getState()` | Returns the current state tree |
| `store.dispatch(action)` | Dispatches an action to trigger a state change |
| `store.subscribe(listener)` | Registers a callback that runs after every dispatch |

### Connecting React to Redux

```jsx
*// Modern approach — hooks*
import { useSelector, useDispatch } from 'react-redux';

function Counter() {
  const count = useSelector((*state*) => state.counter.count);
  const dispatch = useDispatch();

  return (
    \<button *onClick*={() => dispatch({ type: 'counter/increment', payload: 1 })}>
      Count: {count}
    \</button>
  );
}
```

```jsx
*// Legacy approach — connect HOC*
import { connect } from 'react-redux';

const mapStateToProps = (*state*) => ({ count: state.counter.count });
const mapDispatchToProps = { increment };

export default connect(mapStateToProps, mapDispatchToProps)(Counter);
```

---

## 3. Redux Toolkit (RTK)

Redux Toolkit is the **official, recommended** way to write Redux logic. It simplifies boilerplate.

### createSlice

```js
import { createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (*state*) => {
      state.value += 1; *// Immer allows "mutating" syntax*
    },
    decrement: (*state*) => {
      state.value -= 1;
    },
    incrementByAmount: (*state*, *action*) => {
      state.value += action.payload;
    },
  },
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;
export default counterSlice.reducer;
```

### configureStore

```js
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
    user: userSlice.reducer,
  },
  middleware: (*getDefaultMiddleware*) =>
    getDefaultMiddleware().concat(sagaMiddleware),
});
```

### createAsyncThunk

```js
export const fetchUser = createAsyncThunk('user/fetch', async (*userId*) => {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
});

*// In slice:*
extraReducers: (*builder*) => {
  builder
    .addCase(fetchUser.pending, (*state*) => { state.loading = true; })
    .addCase(fetchUser.fulfilled, (*state*, *action*) => {
      state.loading = false;
      state.data = action.payload;
    })
    .addCase(fetchUser.rejected, (*state*, *action*) => {
      state.loading = false;
      state.error = action.error.message;
    });
};
```

### Why RTK over Plain Redux?

- Eliminates boilerplate (no manual action types, action creators, switch-case reducers)
- Includes Immer for immutable updates using "mutating" syntax
- Includes Redux Thunk by default
- Built-in Redux DevTools support
- `createAsyncThunk` for async operations
- `createEntityAdapter` for normalized state management

---

## 4. Redux Middleware

Middleware sits between dispatch and the reducer. It can intercept, modify, delay, or replace actions.

### How Middleware Works

```
dispatch(action)
  → Middleware 1 (e.g., logger)
    → Middleware 2 (e.g., thunk)
      → Middleware 3 (e.g., saga)
        → Reducer
```

### Custom Middleware Structure

```js
const loggerMiddleware = (*store*) => (*next*) => (*action*) => {
  console.log('Dispatching:', action);
  const result = next(action); *// passes action to next middleware or reducer*
  console.log('New State:', store.getState());
  return result;
};
```

### Redux Thunk vs Redux-Saga

| Feature | Thunk | Saga |
|---------|-------|------|
| Complexity | Simple | Steeper learning curve |
| Approach | Dispatch functions | Generator functions |
| Side effects | Promises / async-await | Effects (call, put, take) |
| Testing | Requires mocking | Declarative — easy to test |
| Cancellation | Manual | Built-in (takeLatest, race) |
| Debouncing | Manual | Built-in (delay, debounce) |
| Parallel execution | `Promise.all` | `all([...])` effect |
| Best for | Simple async logic | Complex async workflows |

---

## 5. Redux-Saga Fundamentals

### What is Redux-Saga?

Redux-Saga is a middleware library that uses **ES6 Generator functions** to handle side effects (API calls, data caching, routing, etc.) in a readable and testable way.

### Generator Functions — Quick Recap

```js
function* myGenerator() {
  const a = yield 'first yield';   *// pauses here*
  const b = yield 'second yield';  *// pauses here*
  return 'done';
}

const gen = myGenerator();
gen.next();       *// { value: 'first yield', done: false }*
gen.next('hello'); *// { value: 'second yield', done: false } — 'hello' assigned to a*
gen.next('world'); *// { value: 'done', done: true } — 'world' assigned to b*
```

### Basic Saga Setup

```js
import createSagaMiddleware from 'redux-saga';
import { configureStore } from '@reduxjs/toolkit';
import rootSaga from './sagas';

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: rootReducer,
  middleware: (*getDefaultMiddleware*) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);
```

### Root Saga Pattern

```js
import { all, fork } from 'redux-saga/effects';
import { watchFetchUsers } from './userSagas';
import { watchFetchPosts } from './postSagas';

export default function* rootSaga() {
  yield all([
    fork(watchFetchUsers),
    fork(watchFetchPosts),
  ]);
}
```

---

## 6. Saga Effects (Deep Dive)

Effects are plain JavaScript objects that describe the side effect to perform. The saga middleware interprets them.

### Effect Creators — Complete Reference

| Effect | Purpose | Blocking? |
|--------|---------|-----------|
| `call(fn, ...args)` | Call a function (usually async), waits for result | Yes |
| `put(action)` | Dispatch an action to the Redux store | No |
| `take(pattern)` | Wait for a specific action to be dispatched | Yes |
| `takeEvery(pattern, saga)` | Run saga on **every** matching action | No (fork-based) |
| `takeLatest(pattern, saga)` | Run saga only for the **latest** action, cancel previous | No (fork-based) |
| `takeLeading(pattern, saga)` | Run saga only for the **first** action, ignore until done | No (fork-based) |
| `fork(fn, ...args)` | Non-blocking call — runs in background | No |
| `spawn(fn, ...args)` | Detached fork — errors don't bubble up to parent | No |
| `select(selector)` | Read from the Redux store state | No |
| `all([...effects])` | Run multiple effects in parallel, wait for all | Yes |
| `race({...effects})` | Run multiple effects, return the first to finish | Yes |
| `delay(ms)` | Pause the saga for given milliseconds | Yes |
| `cancel(task)` | Cancel a forked task | No |
| `cancelled()` | Check if the current saga was cancelled | No |
| `throttle(ms, pattern, saga)` | Like takeEvery but throttled | No |
| `debounce(ms, pattern, saga)` | Like takeEvery but debounced | No |
| `actionChannel(pattern)` | Buffer incoming actions into a channel | No |
| `flush(channel)` | Flush all buffered messages from a channel | Yes |

### call — Calling Async Functions

```js
import { call, put } from 'redux-saga/effects';
import api from '../api';

function* fetchUserSaga(*action*) {
  try {
    const user = yield call(api.fetchUser, action.payload.userId);
    yield put({ type: 'FETCH_USER_SUCCESS', payload: user });
  } catch (error) {
    yield put({ type: 'FETCH_USER_FAILURE', payload: error.message });
  }
}
```

### put — Dispatching Actions

```js
yield put({ type: 'LOADING_START' });
const data = yield call(api.fetchData);
yield put({ type: 'LOADING_END' });
yield put({ type: 'DATA_LOADED', payload: data });
```

### take — Waiting for Actions

```js
function* loginFlowSaga() {
  while (true) {
    const { payload } = yield take('LOGIN_REQUEST');
    const user = yield call(api.login, payload);
    yield put({ type: 'LOGIN_SUCCESS', payload: user });

    yield take('LOGOUT'); *// waits here until logout action dispatched*
    yield call(api.logout);
    yield put({ type: 'LOGOUT_SUCCESS' });
  }
}
```

### takeEvery vs takeLatest vs takeLeading

```js
import { takeEvery, takeLatest, takeLeading } from 'redux-saga/effects';

*// takeEvery — handles EVERY action (parallel)*
*// User clicks 5 times → 5 API calls*
function* watchFetchUsers() {
  yield takeEvery('FETCH_USERS_REQUEST', fetchUsersSaga);
}

*// takeLatest — cancels previous, runs latest*
*// User clicks 5 times → only last API call matters*
function* watchSearchUsers() {
  yield takeLatest('SEARCH_USERS', searchUsersSaga);
}

*// takeLeading — ignores new actions until current finishes*
*// User clicks 5 times → only first API call runs*
function* watchSubmitForm() {
  yield takeLeading('SUBMIT_FORM', submitFormSaga);
}
```

### select — Reading from State

```js
function* checkAuthSaga() {
  const token = yield select((*state*) => state.auth.token);
  if (!token) {
    yield put({ type: 'REDIRECT_LOGIN' });
  }
}
```

### fork vs spawn

```js
*// fork — child error crashes parent*
function* parentSaga() {
  yield fork(childSaga);
*// if childSaga throws → parentSaga is also cancelled*
}

*// spawn — detached; errors don't bubble up*
function* parentSaga() {
  yield spawn(childSaga);
*// if childSaga throws → parentSaga continues running*
}
```

### all — Parallel Execution

```js
function* fetchDashboardData() {
  const [users, posts, comments] = yield all([
    call(api.fetchUsers),
    call(api.fetchPosts),
    call(api.fetchComments),
  ]);
  yield put({ type: 'DASHBOARD_LOADED', payload: { users, posts, comments } });
}
```

### race — First One Wins

```js
function* fetchWithTimeout() {
  const { response, timeout } = yield race({
    response: call(api.fetchData),
    timeout: delay(5000),
  });

  if (response) {
    yield put({ type: 'FETCH_SUCCESS', payload: response });
  } else {
    yield put({ type: 'FETCH_TIMEOUT' });
  }
}
```

---

## 7. Advanced Saga Patterns

### Pattern 1: Cancellable Saga (Login/Logout Flow)

```js
function* loginFlow() {
  while (true) {
    const { payload } = yield take('LOGIN_REQUEST');
    const task = yield fork(authorize, payload);

    const action = yield take(['LOGOUT', 'LOGIN_FAILURE']);

    if (action.type === 'LOGOUT') {
      yield cancel(task);
    }

    yield call(api.clearToken);
  }
}

function* authorize(*credentials*) {
  try {
    const token = yield call(api.login, credentials);
    yield put({ type: 'LOGIN_SUCCESS', payload: token });
  } catch (error) {
    yield put({ type: 'LOGIN_FAILURE', payload: error });
  } finally {
    if (yield cancelled()) {
*// cleanup logic if the saga was cancelled*
      console.log('Login was cancelled');
    }
  }
}
```

### Pattern 2: Debounced Search

```js
import { debounce } from 'redux-saga/effects';

function* watchSearchInput() {
  yield debounce(400, 'SEARCH_INPUT_CHANGED', performSearch);
}

function* performSearch(*action*) {
  const results = yield call(api.search, action.payload);
  yield put({ type: 'SEARCH_RESULTS', payload: results });
}
```

### Pattern 3: Polling

```js
function* pollData() {
  while (true) {
    try {
      const data = yield call(api.fetchLatestData);
      yield put({ type: 'DATA_UPDATED', payload: data });
    } catch (error) {
      yield put({ type: 'POLL_ERROR', payload: error });
    }
    yield delay(5000); *// poll every 5 seconds*
  }
}

function* watchPolling() {
  while (true) {
    yield take('START_POLLING');
    const pollTask = yield fork(pollData);
    yield take('STOP_POLLING');
    yield cancel(pollTask);
  }
}
```

### Pattern 4: Retry Logic

```js
function* fetchWithRetry(*apiCall*, *maxRetries* = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = yield call(apiCall);
      return response;
    } catch (error) {
      if (i < maxRetries - 1) {
        yield delay(1000 * Math.pow(2, i)); *// exponential backoff*
      } else {
        throw error;
      }
    }
  }
}
```

### Pattern 5: Action Channel (Sequential Processing)

```js
import { actionChannel, take, call } from 'redux-saga/effects';

function* watchRequests() {
  const requestChannel = yield actionChannel('REQUEST');

  while (true) {
    const { payload } = yield take(requestChannel);
    yield call(handleRequest, payload); *// processes one at a time*
  }
}
```

### Pattern 6: Optimistic Updates

```js
function* optimisticUpdate(*action*) {
  const previousState = yield select((*state*) => state.todos);

*// Optimistically update UI*
  yield put({ type: 'TODO_UPDATED', payload: action.payload });

  try {
    yield call(api.updateTodo, action.payload);
  } catch (error) {
*// Rollback on failure*
    yield put({ type: 'TODO_ROLLBACK', payload: previousState });
    yield put({ type: 'SHOW_ERROR', payload: 'Update failed' });
  }
}
```

---


## 13. Modern Redux Toolkit Architecture

A modern Redux application can be thought of as:

```text
React UI
  ↓
Feature hooks / selectors
  ↓
Redux Toolkit
  ├── createSlice → client/application state
  ├── RTK Query → server/API state
  ├── createListenerMiddleware → lightweight side effects
  ├── createAsyncThunk → straightforward async workflows
  └── Redux-Saga → complex orchestration when justified
```

Do not automatically use Saga for every API request.

### createAction

```ts
import { createAction } from "@reduxjs/toolkit";

export const userSelected = createAction<string>("users/userSelected");
```

### createReducer

```ts
import { createReducer } from "@reduxjs/toolkit";

const reducer = createReducer({ count: 0 }, (builder) => {
  builder.addCase("increment", (state) => {
    state.count += 1;
  });
});
```

### Listener Middleware

Useful for simple action-driven side effects without introducing Saga.

```ts
import { createListenerMiddleware } from "@reduxjs/toolkit";

const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  actionCreator: loginSucceeded,
  effect: async (action, listenerApi) => {
    console.log(action.payload);
  },
});
```



# 14. RTK Query — Major Missing Topic

RTK Query is Redux Toolkit's API fetching and caching solution.

It handles:

- API requests
- loading/error state
- caching
- request deduplication
- cache invalidation
- refetching
- polling
- mutations
- optimistic updates
- pagination
- request lifecycle

## Basic Example

```ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  reducerPath: "api",

  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
  }),

  tagTypes: ["User"],

  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => "/users",
      providesTags: ["User"],
    }),

    createUser: builder.mutation<User, Partial<User>>({
      query: (body) => ({
        url: "/users",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),
  }),
});
```

## Query vs Mutation

```text
Query
  → read server data
  → cache result

Mutation
  → change server data
  → invalidate/update cache
```

## Cache Invalidation

```ts
getUsers: builder.query<User[], void>({
  query: () => "/users",
  providesTags: ["User"],
}),

createUser: builder.mutation<User, CreateUserInput>({
  query: (body) => ({
    url: "/users",
    method: "POST",
    body,
  }),
  invalidatesTags: ["User"],
}),
```

## Optimistic Update

```ts
async onQueryStarted(user, { dispatch, queryFulfilled }) {
  const patch = dispatch(
    api.util.updateQueryData("getUsers", undefined, (draft) => {
      const existing = draft.find((item) => item.id === user.id);

      if (existing) Object.assign(existing, user);
    })
  );

  try {
    await queryFulfilled;
  } catch {
    patch.undo();
  }
}
```




