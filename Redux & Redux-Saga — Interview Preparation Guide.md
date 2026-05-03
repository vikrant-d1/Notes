# Redux & Redux-Saga — Interview Preparation Guide

---

## Table of Contents

1. [Redux Fundamentals](#1-redux-fundamentals)
2. [Core Redux Concepts](#2-core-redux-concepts)
3. [Redux Toolkit (RTK)](#3-redux-toolkit-rtk)
4. [Redux Middleware](#4-redux-middleware)
5. [Redux-Saga Fundamentals](#5-redux-saga-fundamentals)
6. [Saga Effects (Deep Dive)](#6-saga-effects-deep-dive)
7. [Advanced Saga Patterns](#7-advanced-saga-patterns)
8. [Zustand — Complete Guide](#8-zustand--complete-guide)
9. [Redux vs Zustand vs Saga — Detailed Comparison](#9-redux-vs-zustand-vs-saga--detailed-comparison)
10. [Common Interview Questions & Answers](#10-common-interview-questions--answers)
11. [Code Snippets & Patterns](#11-code-snippets--patterns)
12. [Tricky / Scenario-Based Questions](#12-tricky--scenario-based-questions)

---

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
// Action
const increment = { type: 'counter/increment', payload: 5 };

// Action Creator
const increment = (amount) => ({
  type: 'counter/increment',
  payload: amount,
});
```

### Reducers

Pure functions: `(state, action) => newState`. They must never mutate state.

```js
const initialState = { count: 0 };

function counterReducer(state = initialState, action) {
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
// Modern approach — hooks
import { useSelector, useDispatch } from 'react-redux';

function Counter() {
  const count = useSelector((state) => state.counter.count);
  const dispatch = useDispatch();

  return (
    <button onClick={() => dispatch({ type: 'counter/increment', payload: 1 })}>
      Count: {count}
    </button>
  );
}
```

```jsx
// Legacy approach — connect HOC
import { connect } from 'react-redux';

const mapStateToProps = (state) => ({ count: state.counter.count });
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
    increment: (state) => {
      state.value += 1; // Immer allows "mutating" syntax
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
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
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(sagaMiddleware),
});
```

### createAsyncThunk

```js
export const fetchUser = createAsyncThunk('user/fetch', async (userId) => {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
});

// In slice:
extraReducers: (builder) => {
  builder
    .addCase(fetchUser.pending, (state) => { state.loading = true; })
    .addCase(fetchUser.fulfilled, (state, action) => {
      state.loading = false;
      state.data = action.payload;
    })
    .addCase(fetchUser.rejected, (state, action) => {
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
const loggerMiddleware = (store) => (next) => (action) => {
  console.log('Dispatching:', action);
  const result = next(action); // passes action to next middleware or reducer
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
  const a = yield 'first yield';   // pauses here
  const b = yield 'second yield';  // pauses here
  return 'done';
}

const gen = myGenerator();
gen.next();       // { value: 'first yield', done: false }
gen.next('hello'); // { value: 'second yield', done: false } — 'hello' assigned to a
gen.next('world'); // { value: 'done', done: true } — 'world' assigned to b
```

### Basic Saga Setup

```js
import createSagaMiddleware from 'redux-saga';
import { configureStore } from '@reduxjs/toolkit';
import rootSaga from './sagas';

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
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

function* fetchUserSaga(action) {
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

    yield take('LOGOUT'); // waits here until logout action dispatched
    yield call(api.logout);
    yield put({ type: 'LOGOUT_SUCCESS' });
  }
}
```

### takeEvery vs takeLatest vs takeLeading

```js
import { takeEvery, takeLatest, takeLeading } from 'redux-saga/effects';

// takeEvery — handles EVERY action (parallel)
// User clicks 5 times → 5 API calls
function* watchFetchUsers() {
  yield takeEvery('FETCH_USERS_REQUEST', fetchUsersSaga);
}

// takeLatest — cancels previous, runs latest
// User clicks 5 times → only last API call matters
function* watchSearchUsers() {
  yield takeLatest('SEARCH_USERS', searchUsersSaga);
}

// takeLeading — ignores new actions until current finishes
// User clicks 5 times → only first API call runs
function* watchSubmitForm() {
  yield takeLeading('SUBMIT_FORM', submitFormSaga);
}
```

### select — Reading from State

```js
function* checkAuthSaga() {
  const token = yield select((state) => state.auth.token);
  if (!token) {
    yield put({ type: 'REDIRECT_LOGIN' });
  }
}
```

### fork vs spawn

```js
// fork — child error crashes parent
function* parentSaga() {
  yield fork(childSaga);
  // if childSaga throws → parentSaga is also cancelled
}

// spawn — detached; errors don't bubble up
function* parentSaga() {
  yield spawn(childSaga);
  // if childSaga throws → parentSaga continues running
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

function* authorize(credentials) {
  try {
    const token = yield call(api.login, credentials);
    yield put({ type: 'LOGIN_SUCCESS', payload: token });
  } catch (error) {
    yield put({ type: 'LOGIN_FAILURE', payload: error });
  } finally {
    if (yield cancelled()) {
      // cleanup logic if the saga was cancelled
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

function* performSearch(action) {
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
    yield delay(5000); // poll every 5 seconds
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
function* fetchWithRetry(apiCall, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = yield call(apiCall);
      return response;
    } catch (error) {
      if (i < maxRetries - 1) {
        yield delay(1000 * Math.pow(2, i)); // exponential backoff
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
    yield call(handleRequest, payload); // processes one at a time
  }
}
```

### Pattern 6: Optimistic Updates

```js
function* optimisticUpdate(action) {
  const previousState = yield select((state) => state.todos);

  // Optimistically update UI
  yield put({ type: 'TODO_UPDATED', payload: action.payload });

  try {
    yield call(api.updateTodo, action.payload);
  } catch (error) {
    // Rollback on failure
    yield put({ type: 'TODO_ROLLBACK', payload: previousState });
    yield put({ type: 'SHOW_ERROR', payload: 'Update failed' });
  }
}
```

---

## 8. Zustand — Complete Guide

### What is Zustand?

Zustand (German for "state") is a **small, fast, and scalable** state management library for React. It uses a simplified flux-like approach with hooks — no boilerplate, no providers, no reducers required.

### Why Zustand?

- Tiny bundle size (~1KB gzipped)
- No Provider wrapper needed
- No boilerplate — define state and actions in one place
- Built-in support for async actions
- Supports middleware (persist, devtools, immer)
- Selective re-renders out of the box
- Works outside React components too

### Installation

```bash
npm install zustand
```

### Basic Store — Counter Example

```js
import { create } from 'zustand';

const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  incrementByAmount: (amount) => set((state) => ({ count: state.count + amount })),
  reset: () => set({ count: 0 }),
}));
```

### Using in a Component

```jsx
function Counter() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  const decrement = useCounterStore((state) => state.decrement);

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}
// No Provider needed — just use it directly!
```

### Async Actions (API Calls)

Zustand handles async natively — no thunks, no sagas needed for simple cases.

```js
const useUserStore = create((set) => ({
  user: null,
  loading: false,
  error: null,

  fetchUser: async (userId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/users/${userId}`);
      const user = await response.json();
      set({ user, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));

// Usage in component
function UserProfile({ userId }) {
  const { user, loading, error, fetchUser } = useUserStore();

  useEffect(() => {
    fetchUser(userId);
  }, [userId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  return <h1>{user?.name}</h1>;
}
```

### Selectors & Preventing Re-renders

```js
// BAD — component re-renders when ANY state changes
const { count, name, age } = useStore();

// GOOD — component only re-renders when count changes
const count = useStore((state) => state.count);

// Multiple values — use shallow comparison
import { shallow } from 'zustand/shallow';

const { count, name } = useStore(
  (state) => ({ count: state.count, name: state.name }),
  shallow
);
```

### Slices Pattern (Splitting Large Stores)

```js
// userSlice.js
const createUserSlice = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
});

// cartSlice.js
const createCartSlice = (set, get) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  getTotal: () => get().items.reduce((sum, item) => sum + item.price, 0),
});

// Combined store
const useBoundStore = create((...args) => ({
  ...createUserSlice(...args),
  ...createCartSlice(...args),
}));
```

### `get()` — Accessing State Inside Actions

```js
const useStore = create((set, get) => ({
  items: [],
  selectedId: null,

  getSelectedItem: () => {
    const { items, selectedId } = get();
    return items.find((item) => item.id === selectedId);
  },

  removeSelected: () => {
    const { items, selectedId } = get();
    set({ items: items.filter((item) => item.id !== selectedId) });
  },
}));
```

### Middleware — persist, devtools, immer

```js
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const useStore = create(
  devtools(
    persist(
      immer((set) => ({
        todos: [],
        addTodo: (text) =>
          set((state) => {
            state.todos.push({ id: Date.now(), text, completed: false });
          }),
        toggleTodo: (id) =>
          set((state) => {
            const todo = state.todos.find((t) => t.id === id);
            if (todo) todo.completed = !todo.completed;
          }),
      })),
      { name: 'todo-storage' } // key for localStorage
    ),
    { name: 'TodoStore' } // name in Redux DevTools
  )
);
```

### Subscribe — Reacting to State Changes Outside React

```js
// Listen to state changes outside of React
const unsub = useStore.subscribe(
  (state) => console.log('New count:', state.count)
);

// Subscribe to a specific slice
const unsub = useStore.subscribe(
  (state) => state.count,
  (count, prevCount) => console.log('Count changed:', prevCount, '→', count)
);

// Use state anywhere (Node.js, vanilla JS, utilities)
const currentCount = useStore.getState().count;
useStore.getState().increment();
```

### Computed / Derived State

```js
const useStore = create((set, get) => ({
  items: [],
  filter: 'all',

  // Computed getter
  get filteredItems() {
    const { items, filter } = get();
    if (filter === 'completed') return items.filter((i) => i.completed);
    if (filter === 'active') return items.filter((i) => !i.completed);
    return items;
  },
}));

// Or use a selector (better for memoization)
const filteredItems = useStore((state) =>
  state.items.filter((i) => (state.filter === 'all' ? true : i.completed))
);
```

### Zustand with TypeScript

```ts
interface BearState {
  bears: number;
  increase: (by: number) => void;
  reset: () => void;
}

const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
  reset: () => set({ bears: 0 }),
}));
```

### Transient Updates (High-Frequency Updates without Re-render)

```js
// For things like mouse position, animation frames, etc.
const useStore = create((set) => ({
  position: { x: 0, y: 0 },
  setPosition: (x, y) => set({ position: { x, y } }),
}));

// Subscribe directly to avoid React re-renders
useEffect(() => {
  const handleMouseMove = (e) => {
    useStore.getState().setPosition(e.clientX, e.clientY);
  };
  window.addEventListener('mousemove', handleMouseMove);
  return () => window.removeEventListener('mousemove', handleMouseMove);
}, []);

// Read imperatively via ref
const posRef = useRef(useStore.getState().position);
useEffect(() => useStore.subscribe(
  (state) => (posRef.current = state.position)
), []);
```

---

## 9. Redux vs Zustand vs Saga — Detailed Comparison

### Side-by-Side Architecture

```
REDUX + SAGA                          ZUSTAND
──────────────                        ──────
Component                             Component
  ↓ dispatch(action)                    ↓ store.increment()
Saga Middleware                       (direct call — no dispatch)
  ↓ intercepts action                   ↓
Worker Saga                           set((state) => newState)
  ↓ yield call(api)                     ↓
  ↓ yield put(successAction)          Store updates
Reducer                                 ↓
  ↓ (state, action) → newState        Component re-renders
Store updates                         (via selector hook)
  ↓
Component re-renders
(via useSelector)
```

### Same Feature — 3 Approaches Compared

#### Example: Todo App with API

**Approach 1 — Redux + Saga (Most Complex)**

```js
// ─── actions.js ───
const FETCH_TODOS = 'todos/fetch';
const FETCH_TODOS_SUCCESS = 'todos/fetchSuccess';
const FETCH_TODOS_FAILURE = 'todos/fetchFailure';
const ADD_TODO = 'todos/add';
const ADD_TODO_SUCCESS = 'todos/addSuccess';

// ─── reducer.js ───
const initialState = { items: [], loading: false, error: null };

function todoReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_TODOS:
      return { ...state, loading: true, error: null };
    case FETCH_TODOS_SUCCESS:
      return { ...state, loading: false, items: action.payload };
    case FETCH_TODOS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case ADD_TODO_SUCCESS:
      return { ...state, items: [...state.items, action.payload] };
    default:
      return state;
  }
}

// ─── sagas.js ───
import { call, put, takeLatest, takeEvery } from 'redux-saga/effects';

function* fetchTodosSaga() {
  try {
    const todos = yield call(api.getTodos);
    yield put({ type: FETCH_TODOS_SUCCESS, payload: todos });
  } catch (error) {
    yield put({ type: FETCH_TODOS_FAILURE, payload: error.message });
  }
}

function* addTodoSaga(action) {
  try {
    const todo = yield call(api.addTodo, action.payload);
    yield put({ type: ADD_TODO_SUCCESS, payload: todo });
  } catch (error) {
    yield put({ type: 'SHOW_ERROR', payload: error.message });
  }
}

function* watchTodos() {
  yield takeLatest(FETCH_TODOS, fetchTodosSaga);
  yield takeEvery(ADD_TODO, addTodoSaga);
}

// ─── store.js ───
import createSagaMiddleware from 'redux-saga';
import { configureStore } from '@reduxjs/toolkit';

const sagaMiddleware = createSagaMiddleware();
const store = configureStore({
  reducer: { todos: todoReducer },
  middleware: (getDefault) => getDefault({ thunk: false }).concat(sagaMiddleware),
});
sagaMiddleware.run(watchTodos);

// ─── Component.jsx ───
function TodoList() {
  const { items, loading, error } = useSelector((state) => state.todos);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({ type: FETCH_TODOS });
  }, []);

  const handleAdd = (text) => {
    dispatch({ type: ADD_TODO, payload: { text } });
  };

  if (loading) return <p>Loading...</p>;
  return items.map((t) => <div key={t.id}>{t.text}</div>);
}
```

**Total files: 4** | **Lines of code: ~70+**

---

**Approach 2 — Redux Toolkit + createAsyncThunk (Moderate)**

```js
// ─── todoSlice.js ───
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchTodos = createAsyncThunk('todos/fetch', async () => {
  const response = await fetch('/api/todos');
  return response.json();
});

export const addTodo = createAsyncThunk('todos/add', async (text) => {
  const response = await fetch('/api/todos', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  return response.json();
});

const todoSlice = createSlice({
  name: 'todos',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodos.pending, (state) => { state.loading = true; })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addTodo.fulfilled, (state, action) => {
        state.items.push(action.payload);
      });
  },
});

// ─── Component.jsx ───
function TodoList() {
  const { items, loading } = useSelector((state) => state.todos);
  const dispatch = useDispatch();

  useEffect(() => { dispatch(fetchTodos()); }, []);

  return items.map((t) => <div key={t.id}>{t.text}</div>);
}
```

**Total files: 2** | **Lines of code: ~45**

---

**Approach 3 — Zustand (Simplest)**

```js
// ─── useTodoStore.js ───
import { create } from 'zustand';

const useTodoStore = create((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchTodos: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/todos');
      const items = await response.json();
      set({ items, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  addTodo: async (text) => {
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      const todo = await response.json();
      set((state) => ({ items: [...state.items, todo] }));
    } catch (error) {
      set({ error: error.message });
    }
  },
}));

// ─── Component.jsx ───
function TodoList() {
  const items = useTodoStore((state) => state.items);
  const loading = useTodoStore((state) => state.loading);
  const fetchTodos = useTodoStore((state) => state.fetchTodos);

  useEffect(() => { fetchTodos(); }, []);

  return items.map((t) => <div key={t.id}>{t.text}</div>);
}
```

**Total files: 2** | **Lines of code: ~35**

---

### Feature Comparison Table

| Feature | Redux + Saga | Redux Toolkit | Zustand |
|---------|-------------|---------------|---------|
| **Bundle Size** | ~15KB + ~14KB (saga) | ~11KB | ~1KB |
| **Boilerplate** | High (actions, reducers, sagas, watchers) | Medium (slices, thunks) | Minimal (single store file) |
| **Provider Required** | Yes (`<Provider>`) | Yes (`<Provider>`) | No |
| **Async Handling** | Saga effects (call, put, take) | createAsyncThunk | Native async/await |
| **Cancellation** | Built-in (takeLatest, cancel, race) | Manual (AbortController) | Manual (AbortController) |
| **Debounce/Throttle** | Built-in (debounce, throttle effects) | Manual | Manual |
| **Polling** | Built-in pattern (fork + delay + cancel) | Manual | Manual (setInterval) |
| **Retry Logic** | Easy with generator loops | Manual | Manual |
| **Race Conditions** | Built-in (race effect) | Manual | Manual |
| **Complex Workflows** | Excellent (channels, forks, take patterns) | Limited | Limited |
| **Testing** | Easy (declarative effects = plain objects) | Standard (mock API) | Standard (mock API) |
| **DevTools** | Excellent (Redux DevTools) | Excellent (Redux DevTools) | Good (via devtools middleware) |
| **Learning Curve** | Steep (generators + effects) | Moderate | Easy |
| **Re-render Control** | useSelector + memoized selectors | useSelector + memoized selectors | Built-in selectors (auto-optimized) |
| **Use Outside React** | store.dispatch / store.getState | store.dispatch / store.getState | getState / setState / subscribe |
| **Middleware** | Rich ecosystem | Built-in (thunk, serializable check) | persist, devtools, immer |
| **TypeScript** | Verbose | Good | Excellent |
| **Community / Ecosystem** | Massive | Massive | Growing fast |

### When to Use What?

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CHOOSING THE RIGHT TOOL                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Simple app, few shared states         →  Zustand                  │
│  Medium app, standard CRUD + API       →  Zustand or RTK           │
│  Large app, many devs, strict patterns →  Redux Toolkit            │
│  Complex async (polling, retry, race)  →  Redux + Saga             │
│  WebSocket / real-time data flows      →  Redux + Saga (channels)  │
│  Micro-frontend / multiple stores      →  Zustand (no Provider)    │
│  Quick prototype / side project        →  Zustand                  │
│  Enterprise with existing Redux        →  Add Saga if needed       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Same Pattern — Cancellation Comparison

**Redux-Saga — Built-in cancellation**

```js
function* searchSaga() {
  yield takeLatest('SEARCH', function* (action) {
    yield delay(400); // auto-cancelled if new SEARCH comes in
    const results = yield call(api.search, action.payload);
    yield put({ type: 'SEARCH_SUCCESS', payload: results });
  });
}
```

**Zustand — Manual cancellation with AbortController**

```js
const useSearchStore = create((set) => ({
  results: [],
  controller: null,

  search: async (query) => {
    // Cancel previous request
    const prev = useSearchStore.getState().controller;
    if (prev) prev.abort();

    const controller = new AbortController();
    set({ controller });

    try {
      const response = await fetch(`/api/search?q=${query}`, {
        signal: controller.signal,
      });
      const results = await response.json();
      set({ results });
    } catch (error) {
      if (error.name !== 'AbortError') {
        set({ error: error.message });
      }
    }
  },
}));
```

### Same Pattern — Polling Comparison

**Redux-Saga — Clean polling with cancellation**

```js
function* pollSaga() {
  while (true) {
    yield take('START_POLL');
    const task = yield fork(function* () {
      while (true) {
        const data = yield call(api.fetchLatest);
        yield put({ type: 'DATA_UPDATED', payload: data });
        yield delay(5000);
      }
    });
    yield take('STOP_POLL');
    yield cancel(task);
  }
}
```

**Zustand — Polling with setInterval**

```js
const usePollStore = create((set, get) => ({
  data: null,
  intervalId: null,

  startPolling: () => {
    const id = setInterval(async () => {
      try {
        const response = await fetch('/api/latest');
        const data = await response.json();
        set({ data });
      } catch (error) {
        console.error('Poll error:', error);
      }
    }, 5000);
    set({ intervalId: id });
  },

  stopPolling: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    set({ intervalId: null });
  },
}));
```

### Zustand-Specific Interview Questions

**Q: How does Zustand avoid unnecessary re-renders?**

Zustand uses **selector-based subscriptions**. When you pass a selector `(state) => state.count`, the component only re-renders when `count` changes — not when other parts of the state update. This is automatic and doesn't need `React.memo` or `useMemo`.

**Q: Can Zustand replace Redux entirely?**

For most small-to-medium apps, yes. Zustand handles state, async, persistence, and devtools. However, Redux + Saga is better for apps needing complex async orchestration (cancellation, racing, channels, retries) or when strict unidirectional data flow and action logging are required.

**Q: How does Zustand handle state persistence?**

Using the `persist` middleware, which automatically syncs state with `localStorage` (or any storage engine):

```js
const useStore = create(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'app-settings',          // localStorage key
      partialize: (state) => ({ theme: state.theme }), // persist only certain fields
    }
  )
);
```

**Q: Can you use Zustand outside React?**

Yes — this is a major advantage over Context API:

```js
// In a utility file or Node.js
const count = useStore.getState().count;
useStore.getState().increment();
useStore.subscribe((state) => console.log(state));
```

**Q: What is the difference between `set` and `setState` in Zustand?**

`set` is used **inside** the store definition (within `create`). `setState` is used **outside** the store to update state imperatively:

```js
// Inside store — use set
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// Outside store — use setState
useStore.setState({ count: 10 });
```

---

## 10. Common Interview Questions & Answers

### Q1: What is the difference between Redux state and React local state?

Redux state is **global** — accessible by any component. React local state (`useState`) is scoped to a single component. Use Redux for state shared across multiple components (auth, theme, cart). Use local state for UI-only concerns (form input focus, dropdown open/close).

### Q2: Why are reducers called "reducers"?

Because they follow the signature of `Array.prototype.reduce()`: a function that takes an accumulator (state) and a value (action) and returns a new accumulator (new state).

### Q3: What is the purpose of `combineReducers`?

It splits the root reducer into smaller, independent reducers — each managing its own slice of the state tree. They are combined back into one root reducer that delegates to the slice reducers.

### Q4: Can I dispatch actions inside a reducer?

No. Reducers must be **pure functions** — no side effects. Dispatching inside a reducer would cause infinite loops and violate the single-direction data flow.

### Q5: What is "selector" in Redux?

A selector is a function that extracts specific data from the store state. Libraries like `reselect` provide **memoized selectors** for performance.

```js
import { createSelector } from 'reselect';

const selectTodos = (state) => state.todos;
const selectCompletedTodos = createSelector(
  [selectTodos],
  (todos) => todos.filter((t) => t.completed)
);
```

### Q6: How does `takeLatest` handle concurrent requests?

When a new action matching the pattern is dispatched while a previous saga is still running, `takeLatest` automatically **cancels** the previous saga and starts a new one. Only the result of the latest request is used.

### Q7: What is the difference between `call` and `fork`?

`call` is **blocking** — the saga waits for the called function to complete. `fork` is **non-blocking** — the saga continues immediately while the forked task runs in the background.

### Q8: How do you test Redux-Sagas?

Sagas are easy to test because effects are plain objects:

```js
import { call, put } from 'redux-saga/effects';

test('fetchUserSaga', () => {
  const gen = fetchUserSaga({ payload: { userId: 1 } });

  expect(gen.next().value).toEqual(call(api.fetchUser, 1));

  const mockUser = { id: 1, name: 'John' };
  expect(gen.next(mockUser).value).toEqual(
    put({ type: 'FETCH_USER_SUCCESS', payload: mockUser })
  );

  expect(gen.next().done).toBe(true);
});
```

### Q9: What happens if a saga throws an uncaught error?

If a saga started with `fork` throws, its parent saga is also cancelled. Use `spawn` instead for isolated tasks where you don't want errors to propagate. Always wrap API calls in try/catch.

### Q10: When would you choose Redux-Saga over Redux Thunk?

Choose Saga when you need: complex async workflows, cancellation logic, debouncing/throttling, racing effects, polling, retry mechanisms, or when testability of side effects is critical. Choose Thunk for straightforward async operations (simple API fetch and dispatch).

---

## 11. Code Snippets & Patterns

### Complete CRUD Saga Example

```js
// actions
const FETCH_ITEMS = 'items/fetch';
const CREATE_ITEM = 'items/create';
const UPDATE_ITEM = 'items/update';
const DELETE_ITEM = 'items/delete';

// worker sagas
function* fetchItemsSaga() {
  try {
    yield put({ type: 'items/loading' });
    const items = yield call(api.getItems);
    yield put({ type: 'items/fetchSuccess', payload: items });
  } catch (error) {
    yield put({ type: 'items/fetchFailure', payload: error.message });
  }
}

function* createItemSaga(action) {
  try {
    const newItem = yield call(api.createItem, action.payload);
    yield put({ type: 'items/createSuccess', payload: newItem });
    yield put({ type: 'SHOW_TOAST', payload: 'Item created!' });
  } catch (error) {
    yield put({ type: 'items/createFailure', payload: error.message });
  }
}

function* updateItemSaga(action) {
  try {
    const updated = yield call(api.updateItem, action.payload);
    yield put({ type: 'items/updateSuccess', payload: updated });
  } catch (error) {
    yield put({ type: 'items/updateFailure', payload: error.message });
  }
}

function* deleteItemSaga(action) {
  try {
    yield call(api.deleteItem, action.payload);
    yield put({ type: 'items/deleteSuccess', payload: action.payload });
  } catch (error) {
    yield put({ type: 'items/deleteFailure', payload: error.message });
  }
}

// watcher saga
function* watchItems() {
  yield takeLatest(FETCH_ITEMS, fetchItemsSaga);
  yield takeEvery(CREATE_ITEM, createItemSaga);
  yield takeEvery(UPDATE_ITEM, updateItemSaga);
  yield takeEvery(DELETE_ITEM, deleteItemSaga);
}
```

### Error Boundary Saga

```js
function* safeSaga(saga, ...args) {
  try {
    yield call(saga, ...args);
  } catch (error) {
    yield put({ type: 'GLOBAL_ERROR', payload: error.message });
    console.error('Saga error:', error);
  }
}

// Usage in root saga
export default function* rootSaga() {
  yield all([
    fork(safeSaga, watchFetchUsers),
    fork(safeSaga, watchFetchPosts),
  ]);
}
```

### Channel-Based WebSocket Integration

```js
import { eventChannel } from 'redux-saga';
import { take, put, call, fork, cancel } from 'redux-saga/effects';

function createWebSocketChannel(url) {
  return eventChannel((emit) => {
    const ws = new WebSocket(url);

    ws.onmessage = (event) => emit(JSON.parse(event.data));
    ws.onerror = (error) => emit({ type: 'WS_ERROR', error });
    ws.onclose = () => emit({ type: 'WS_CLOSED' });

    return () => ws.close(); // unsubscribe function
  });
}

function* watchWebSocket() {
  const channel = yield call(createWebSocketChannel, 'wss://api.example.com/ws');

  try {
    while (true) {
      const message = yield take(channel);
      yield put({ type: 'WS_MESSAGE_RECEIVED', payload: message });
    }
  } finally {
    channel.close();
  }
}
```

---

## 12. Tricky / Scenario-Based Questions

### S1: "How would you handle token refresh in a saga?"

```js
function* apiCallWithRefresh(apiFunc, ...args) {
  try {
    return yield call(apiFunc, ...args);
  } catch (error) {
    if (error.status === 401) {
      // Token expired — try refreshing
      try {
        const newToken = yield call(api.refreshToken);
        yield put({ type: 'TOKEN_REFRESHED', payload: newToken });
        return yield call(apiFunc, ...args); // retry original call
      } catch (refreshError) {
        yield put({ type: 'FORCE_LOGOUT' });
        throw refreshError;
      }
    }
    throw error;
  }
}
```

### S2: "How do you prevent duplicate form submissions?"

Use `takeLeading` — it ignores new actions while the current saga is running.

```js
function* watchFormSubmit() {
  yield takeLeading('FORM_SUBMIT', handleFormSubmit);
}
```

### S3: "How would you implement infinite scroll?"

```js
function* loadMoreSaga() {
  const { page, hasMore } = yield select((state) => state.feed);
  if (!hasMore) return;

  try {
    const data = yield call(api.getFeed, page + 1);
    yield put({
      type: 'FEED_LOADED',
      payload: { items: data.items, hasMore: data.hasMore, page: page + 1 },
    });
  } catch (error) {
    yield put({ type: 'FEED_ERROR', payload: error.message });
  }
}

function* watchLoadMore() {
  yield throttle(1000, 'LOAD_MORE', loadMoreSaga);
}
```

### S4: "How would you handle multiple API calls where one depends on the other?"

```js
function* fetchOrderDetails(action) {
  const order = yield call(api.getOrder, action.payload.orderId);
  const user = yield call(api.getUser, order.userId);         // depends on order
  const address = yield call(api.getAddress, user.addressId);  // depends on user

  yield put({
    type: 'ORDER_DETAILS_LOADED',
    payload: { order, user, address },
  });
}
```

### S5: "Explain what happens step-by-step when an action is dispatched with saga middleware."

1. Component dispatches an action via `dispatch()`.
2. Action hits the Redux middleware pipeline.
3. Saga middleware checks if any watcher (takeEvery/takeLatest/take) is waiting for this action type.
4. If matched, the watcher forks/spawns the corresponding worker saga.
5. The worker saga yields effects (call, put, select, etc.).
6. The saga middleware **interprets** each effect and executes the corresponding operation.
7. Results are passed back into the generator via `gen.next(result)`.
8. When the worker saga `put`s an action, that action goes through the full middleware chain again and reaches the reducer.
9. Reducer computes new state → store updates → connected components re-render.

---

## Quick Revision Cheat Sheet

```
Redux Core:     Store → dispatch(action) → Reducer → newState → UI
Middleware:     dispatch → middleware chain → reducer
Saga Flow:      Watcher (take/takeEvery) → Worker (call/put) → Reducer

call  = blocking (waits)       |  fork  = non-blocking (background)
put   = dispatch action        |  select = read state
take  = wait for action        |  all   = parallel, wait for all
race  = parallel, first wins   |  delay = sleep

takeEvery   = handle ALL       (parallel workers)
takeLatest  = handle LATEST    (cancel previous)
takeLeading = handle FIRST     (ignore until done)
debounce    = wait until idle   (search input)
throttle    = max once per interval (scroll events)
```

---

*Good luck with your interview!*
