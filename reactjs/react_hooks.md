# React Hooks — Interview Prep Guide

> Definitions, syntax, use cases, and cross questions for every major React hook.

---

## Table of Contents

1. [useState](#1-usestate)
2. [useEffect](#2-useeffect)
3. [useLayoutEffect](#3-uselayouteffect)
4. [useMemo](#4-usememo)
5. [useCallback](#5-usecallback)
6. [useRef](#6-useref)
7. [useContext](#7-usecontext)
8. [useReducer](#8-usereducer)
9. [useTransition](#9-usetransition)
10. [useDeferredValue](#10-usedeferredvalue)
11. [useId](#11-useid)
12. [useSyncExternalStore](#12-usesyncexternalstore)
13. [useImperativeHandle](#13-useimperativehandle)
14. [use (React 19)](#14-use-react-19)
15. [useOptimistic (React 19)](#15-useoptimistic-react-19)
16. [useActionState (React 19)](#16-useactionstate-react-19)
17. [useFormStatus (React 19)](#17-useformstatus-react-19)
18. [Hook Selection Matrix](#hook-selection-matrix)

---

## 1. useState

**Definition:** Returns a stateful value and a setter function. State is stored on the fiber node; calling the setter enqueues an update and triggers a re-render.

**Syntax:**
```js
const [state, setState] = useState(initialValue)
```

**Use when:** Simple, independent values — toggles, counters, form fields.

### Interview Questions

**Q: What is a stale closure in useState?**
> Using `state` directly inside `setTimeout` captures the value at render time. Use the functional updater `setState(prev => ...)` to always read the latest value.

**Q: Does `setState({...obj})` always trigger a re-render even if values are the same?**
> Yes — a new object reference is created, so `Object.is` returns false and React re-renders. To skip, keep the same reference or use `useReducer` with a comparison.

**Q: When is the lazy initializer `useState(() => ...)` useful?**
> When the initial value is expensive to compute (e.g. reading from localStorage). The function runs only once on mount, not on every render.

**Q: How does React 18 batching differ from React 17?**
> React 18 batches state updates everywhere — inside promises, `setTimeout`, and native events. React 17 only batched inside React event handlers.

---

## 2. useEffect

**Definition:** Synchronizes a component with an external system (API calls, subscriptions, timers). Runs **after paint** — non-blocking for the browser.

**Syntax:**
```js
useEffect(() => {
  // side effect
  return () => { /* cleanup */ }
}, [deps])
```

| Dependency Array | Behavior |
|---|---|
| Omitted | Runs after every render |
| `[]` | Runs once on mount; cleanup on unmount |
| `[a, b]` | Runs when `a` or `b` change |

**Use when:** Data fetching, event subscriptions, DOM side effects that don't need to block paint.

### Interview Questions

**Q: Why is `useEffect` NOT the same as `componentDidMount`?**
> `useEffect` fires after paint, not before. `componentDidMount` fires synchronously after DOM insertion. For layout-critical work, use `useLayoutEffect`.

**Q: What is the Strict Mode double-invocation and why does React do it?**
> React 18 mounts → unmounts → remounts in dev to surface missing cleanups. Your effect must be resilient to this — always return a cleanup function.

**Q: Why do object/array dependencies cause infinite loops?**
> A new object literal creates a new reference on every render. `Object.is` comparison returns false each time, so the effect keeps firing. Destructure primitives or memoize the object.

**Q: How do you prevent race conditions in data fetching with `useEffect`?**
> Use a `cancelled` flag or `AbortController`. In the cleanup function set `cancelled = true` / call `controller.abort()` so stale responses don't update state.

---

## 3. useLayoutEffect

**Definition:** Same API as `useEffect` but fires **synchronously after DOM mutations and before the browser paints**. Use for layout measurements that must be correct on the first frame.

**Syntax:**
```js
useLayoutEffect(() => {
  // read/mutate DOM
  return () => { /* cleanup */ }
}, [deps])
```

**Use when:** Measuring DOM size/position, preventing visual flicker, syncing animations based on layout.

### Interview Questions

**Q: When would you choose `useLayoutEffect` over `useEffect`?**
> When you need to read or mutate the DOM before the user sees the frame — e.g. positioning a tooltip or measuring an element's width to set another element's size.

**Q: What is the danger of heavy computation inside `useLayoutEffect`?**
> It blocks painting. Every millisecond spent there is visible jank to the user.

**Q: Why does `useLayoutEffect` warn on SSR?**
> There is no DOM on the server, so it can't run meaningfully. Use `useEffect` or a conditional check (`typeof window !== 'undefined'`) for SSR-safe code.

---

## 4. useMemo

**Definition:** Caches the result of an expensive computation. React recomputes only when dependencies change. Primary use: referential stability for objects/arrays passed to memoized children.

**Syntax:**
```js
const value = useMemo(() => computeExpensive(a, b), [a, b])
```

**Use when:** Expensive calculations; keeping object/array references stable to prevent child re-renders.

### Interview Questions

**Q: Is `useMemo` a guarantee that the value won't be recomputed?**
> No. React may discard cached values under memory pressure. Your code must be correct without it — `useMemo` is a performance hint only.

**Q: What comparison does React use for `useMemo` dependencies?**
> `Object.is` — same as `===` except `Object.is(NaN, NaN)` is `true` and `Object.is(+0, -0)` is `false`.

**Q: How is `useMemo` related to `useCallback`?**
> `useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`. `useCallback` memoizes a function; `useMemo` memoizes a computed value.

**Q: Will the React Compiler (React 19+) make `useMemo` obsolete?**
> Potentially yes for many cases — it auto-memoizes. But manual `useMemo` may still be useful for complex or library-level optimizations.

---

## 5. useCallback

**Definition:** Memoizes a function reference. Returns the same function between renders unless dependencies change. Prevents unnecessary re-renders of memoized child components.

**Syntax:**
```js
const fn = useCallback(() => { /* ... */ }, [deps])
```

**Use when:** Passing callbacks to `React.memo` children; stable function references for `useEffect` deps.

### Interview Questions

**Q: When is `useCallback` NOT worth using?**
> When the function isn't passed as a prop to a memoized child, or when the component tree is small. The overhead of memoization can exceed the savings.

**Q: What's the difference between `useCallback` and `useMemo`?**
> `useCallback` memoizes a function. `useMemo` memoizes a computed value. `useCallback(fn, deps) === useMemo(() => fn, deps)`.

**Q: Can `useCallback` cause stale closures?**
> Yes — if you omit a dependency, the callback captures a stale value. Always include all values the callback reads in the dependency array.

---

## 6. useRef

**Definition:** Returns `{ current: value }` that persists for the component's lifetime. Mutating `.current` does **not** trigger a re-render. Used for DOM nodes and mutable instance variables.

**Syntax:**
```js
const ref = useRef(initialValue)
```

**Use when:** DOM access, storing timers/intervals, previous values, WebSocket instances.

### Interview Questions

**Q: What's the difference between `useRef` and `useState` for storing a value?**
> `useRef` mutation doesn't cause a re-render. `useState` mutation does. Use `useRef` for values that need to persist but shouldn't drive the UI.

**Q: What is a callback ref and when would you use it?**
> A function passed as the `ref` prop, called when the element mounts/unmounts. Use it when you need to be notified of attachment — e.g. for dynamically rendered lists where `useRef` won't fire reliably.

**Q: Is `useRef` the functional equivalent of `this.instanceVar` in class components?**
> Yes — it stores mutable values that survive re-renders without triggering them, same as instance properties on a class.

---

## 7. useContext

**Definition:** Reads the nearest matching `Context.Provider` value above the component in the tree. Solves prop drilling without external libraries.

**Syntax:**
```js
const value = useContext(SomeContext)
```

**Use when:** Sharing auth state, theme, locale, or any value needed by many components at different nesting levels.

### Interview Questions

**Q: When should you NOT use `useContext`?**
> For frequently changing values (e.g. mouse position) — every consumer re-renders on every change. Use Zustand/Jotai for high-frequency updates, or split contexts by concern.

**Q: Why is throwing in a custom hook (`if (!context) throw`) a good practice?**
> It gives a clear error message instead of a confusing `undefined` value, making it obvious the component was used outside its Provider.

**Q: How do you avoid unnecessary re-renders with `useContext`?**
> Split contexts by concern (separate `AuthContext`, `ThemeContext`). Memoize the provider value with `useMemo`. Use `useReducer` inside the provider for complex state.

---

## 8. useReducer

**Definition:** Manages complex state via a pure `reducer(state, action) => newState` function. Centralizes state transitions. Inspired by Redux.

**Syntax:**
```js
const [state, dispatch] = useReducer(reducer, initialState, init?)
```

**Use when:** Multiple related state values, state that depends on previous state, logic that benefits from being testable in isolation.

### `useState` vs `useReducer`

| Feature | `useState` | `useReducer` |
|---|---|---|
| Best for | Simple, independent values | Complex or related state |
| Update style | Direct setter | Dispatch actions |
| Testability | Harder | Reducer is a pure function — easy |
| Boilerplate | Minimal | More, but scales better |

### Interview Questions

**Q: When would you choose `useReducer` over `useState`?**
> When you have multiple related values that update together, or when next state depends on previous state in complex ways. Reducer logic is also easier to unit-test.

**Q: What is the lazy initializer (3rd argument) in `useReducer` for?**
> For expensive initial state computation — the `init(initialArg)` function runs only on mount. Also allows resetting to initial state by dispatching the `initialArg` to `init`.

**Q: What should you NOT do in a reducer?**
> Side effects — no API calls, no random values, no `Date.now()`. Reducers must be pure functions. Side effects belong in event handlers or `useEffect`.

---

## 9. useTransition

**Definition:** Marks a state update as non-urgent. React can interrupt it if a more urgent update (like typing) arrives. Part of React 18's concurrent rendering model.

**Syntax:**
```js
const [isPending, startTransition] = useTransition()
```

**Use when:** Heavy filtering/sorting triggered by user input; navigating between expensive views without blocking input.

### Interview Questions

**Q: How is `useTransition` different from debouncing?**
> Debounce delays execution. `startTransition` runs immediately at lower priority — React may interrupt and restart it. Debounce is a timer trick; transitions are a rendering priority concept.

**Q: Can you pass async code to `startTransition`?**
> No — the callback must be synchronous. The state update inside it is what gets marked as a transition.

**Q: What does `isPending` tell you and when should you use it?**
> It's `true` while the transition is in progress. Use it to show a loading indicator without hiding the current (stale) content.

---

## 10. useDeferredValue

**Definition:** Returns a deferred copy of a value that lags behind during urgent updates. Tells React: "this value can be stale for a moment while you handle urgent work."

**Syntax:**
```js
const deferred = useDeferredValue(value)
```

**Use when:** You receive a frequently-changing prop but can't control the setter — you defer its consumption instead.

### `useTransition` vs `useDeferredValue`

| Aspect | `useTransition` | `useDeferredValue` |
|---|---|---|
| Controls | The state update itself | A derived value |
| You need | Access to the `setState` call | Just the value |
| Use when | You own the state update | You receive a prop |

### Interview Questions

**Q: What's the key difference between `useTransition` and `useDeferredValue`?**
> `useTransition` controls the state update itself — you need access to the setter. `useDeferredValue` works on a received value — useful when you don't own the state.

**Q: How can you show staleness visually with `useDeferredValue`?**
> Compare `query !== deferredQuery`. When `true`, the value is stale — dim the results list with `opacity: 0.6` to signal a refresh is coming.

---

## 11. useId

**Definition:** Generates a unique, stable, SSR-safe identifier. Guarantees the same ID on server and client, preventing hydration mismatches.

**Syntax:**
```js
const id = useId()
```

**Use when:** Linking `<label htmlFor>` to inputs; `aria-describedby`; any case requiring stable unique IDs across server and client.

### Interview Questions

**Q: Can you use `useId` for list keys?**
> No — `useId` is for DOM `id` attributes, not React `key` props. Keys should come from your data (e.g. `item.id`).

**Q: Why is `Math.random()` dangerous for IDs in SSR apps?**
> Server and client generate different random values, causing a hydration mismatch. `useId` produces deterministic IDs that match across both.

---

## 12. useSyncExternalStore

**Definition:** Subscribes a component to an external store in a concurrent-safe way. Prevents "tearing" — where different components read different snapshots of the same store.

**Syntax:**
```js
const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)
```

**Use when:** Browser APIs (online status, media queries), third-party stores (Redux, Zustand), any mutable global state outside React.

### Interview Questions

**Q: What is "tearing" and why does it matter in concurrent React?**
> In concurrent mode, React can yield between renders. Without `useSyncExternalStore`, component A and B could read different values from the same external store in a single pass. This hook forces synchronous, consistent reads.

**Q: What happens if `getSnapshot` returns a new object on every call?**
> The component re-renders infinitely — React keeps detecting a "changed" snapshot. `getSnapshot` must return the same reference if the value hasn't changed.

---

## 13. useImperativeHandle

**Definition:** Customizes the instance value exposed via `forwardRef`. Restricts the ref API surface — parents only get the methods you explicitly expose.

**Syntax:**
```js
useImperativeHandle(ref, () => ({ method() {} }), [deps])
```

**Use when:** Complex components like modals, media players, or inputs where a parent needs to call `open()`, `close()`, `play()` imperatively.

### Interview Questions

**Q: What is the principle of least privilege here?**
> Expose only the minimum API needed — don't leak the raw DOM node. The parent should call `open()`, not reach into `dialogRef.current.showModal()`.

**Q: Is `forwardRef` still required in React 19?**
> No — refs can be passed as a regular prop in React 19. `useImperativeHandle` still works the same way.

**Q: When should you avoid `useImperativeHandle`?**
> It's an escape hatch. Prefer declarative props/state whenever possible. Only use it when the imperative API is genuinely simpler than a declarative alternative.

---

## 14. use (React 19)

**Definition:** Reads a Promise or Context value during render. Integrates with Suspense. Unlike hooks, it **can** be called conditionally — it's an API, not a hook.

**Syntax:**
```js
const value = use(promiseOrContext)
```

**Use when:** Reading async data in render; conditionally reading a context value.

### Interview Questions

**Q: Why does `use()` break the rules of hooks intentionally?**
> It doesn't allocate a slot in the hook linked list. It's a compiler/runtime primitive, not a traditional hook — so conditional and loop usage is safe.

**Q: What happens if you pass a new Promise to `use()` on every render?**
> The component suspends infinitely. Promises must be cached outside the render path (`useMemo`, module-level, or a cache library).

**Q: How does `use()` replace `useContext`?**
> `use(SomeContext)` is the modern replacement for `useContext(SomeContext)`, with the added benefit of conditional calling.

---

## 15. useOptimistic (React 19)

**Definition:** Provides an optimistic copy of a value that updates instantly during an async action, then automatically reverts if the action fails.

**Syntax:**
```js
const [optimistic, addOptimistic] = useOptimistic(actual, updateFn)
```

**Use when:** Like/unlike buttons, todo completion, any action where immediate feedback matters more than waiting for the server.

### Interview Questions

**Q: How does automatic rollback work?**
> When the parent re-renders with the same actual value (indicating the server didn't confirm the change), React reverts the optimistic state automatically.

**Q: Does `useOptimistic` replace try/catch/rollback state patterns?**
> Yes — it eliminates the manual optimistic → success/failure state management you'd otherwise write with `useState`.

---

## 16. useActionState (React 19)

**Definition:** Manages form action state and pending status. Consolidates the common `isPending + useEffect + useState` form submission pattern into a single hook.

**Syntax:**
```js
const [state, formAction, isPending] = useActionState(action, initialState)
```

**Use when:** Forms with server actions; any async form submission that needs loading + error + success states.

### Interview Questions

**Q: What did `useActionState` used to be called?**
> `useFormState` — it was renamed in React 19 RC to better reflect its broader applicability beyond forms.

**Q: What is progressive enhancement in the context of `useActionState`?**
> When used with server actions and a `permalink`, the form works even before JavaScript loads — it falls back to native HTML form submission.

---

## 17. useFormStatus (React 19)

**Definition:** Gives a child component information about the parent `<form>`'s submission status. Must be called from a component rendered **inside** a `<form>`.

**Syntax:**
```js
const { pending, data, method, action } = useFormStatus()
// imported from 'react-dom', not 'react'
```

**Use when:** Building reusable submit buttons that automatically disable/show loading state based on the parent form.

### Interview Questions

**Q: Why must `useFormStatus` be called inside a child of `<form>`, not in the same component?**
> It reads from the nearest parent form. Calling it in the same component that renders the `<form>` won't work — it needs to be a descendant.

**Q: Why is `useFormStatus` imported from `react-dom` and not `react`?**
> It's tied to DOM form behavior, so it lives in the DOM-specific package, not the platform-agnostic core.

---

## Hook Selection Matrix

| Need | Hook |
|---|---|
| Component-level state | `useState` |
| Side effects after render | `useEffect` |
| DOM measurement before paint | `useLayoutEffect` |
| Expensive computation caching | `useMemo` |
| Memoized callback reference | `useCallback` |
| DOM refs or mutable instance variables | `useRef` |
| Expose imperative API via ref | `useImperativeHandle` |
| Share value across component tree | `useContext` |
| Complex / related state logic | `useReducer` |
| Mark non-urgent updates | `useTransition` |
| Defer a frequently-changing value | `useDeferredValue` |
| SSR-safe unique IDs | `useId` |
| Subscribe to external store (concurrent-safe) | `useSyncExternalStore` |
| DevTools labels for custom hooks | `useDebugValue` |
| CSS-in-JS style injection | `useInsertionEffect` |
| Read Promise/Context in render | `use` |
| Form action state + pending | `useActionState` |
| Optimistic UI updates | `useOptimistic` |
| Parent form submission status | `useFormStatus` |

---

## Common Senior-Level Questions

**Q: What is the order of execution of `useInsertionEffect`, `useLayoutEffect`, and `useEffect`?**
> `useInsertionEffect` → DOM mutations → `useLayoutEffect` → browser paint → `useEffect`.

**Q: Why can't hooks be called conditionally?**
> React identifies hooks by their call order in the fiber's hook linked list. If a hook is skipped conditionally, subsequent hooks shift positions, mapping to the wrong slot and corrupting state.

**Q: How is `use()` different from all other hooks?**
> `use` can be called inside conditionals and loops — it's an API, not a hook, and doesn't allocate a slot in the hook linked list.

**Q: When would you use `useTransition` vs `useDeferredValue`?**
> Use `useTransition` when you own the state setter. Use `useDeferredValue` when you receive a value as a prop and can't control when it updates.

---

*Covers React 16–19. Good luck with your interview!*
