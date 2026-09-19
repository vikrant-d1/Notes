## 1. What is Rendering in React?
Rendering is the process where React executes a component to determine
what the UI should look like.

During rendering:

-   React calls component functions.
-   React creates a new element/Fiber tree representation.
-   React reconciles the new result with the previous tree.
-   React determines what work is required.
-   The Commit phase applies necessary DOM changes.

> **Important:** A render does not mean the browser DOM is updated every
> time.

``` jsx
function Counter() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

------------------------------------------------------------------------

## 2. What causes a component to re-render?
Common causes include:

-   State updates (`useState`, `useReducer`)
-   Parent rendering
-   Props changing
-   Context value changes
-   External store updates
-   Force updates in class components

``` jsx
const [count, setCount] = useState(0);

setCount(count + 1);
```

Calling the setter schedules an update.

> A state update does not necessarily mean the DOM changes.

------------------------------------------------------------------------

## 3. Does React re-render the whole page?
No.

React may execute component functions again, but it does not blindly
recreate the entire browser DOM.

``` jsx
function App() {
  return (
    <>
      <Header />
      <Counter />
    </>
  );
}
```

When `Counter` updates:

-   React schedules rendering work.
-   Components affected by the update may execute again.
-   Reconciliation determines what changed.
-   Only required DOM mutations are committed.

`React.memo` can allow a child to bail out when its props are unchanged.

------------------------------------------------------------------------

## 4. What is the Virtual DOM?
The Virtual DOM is a conceptual term commonly used to describe React's
in-memory representation of UI elements.

Modern React is better understood through its **element tree and Fiber
tree**.

React:

1.  Executes components.
2.  Produces React elements.
3.  Builds/reconciles Fiber work.
4.  Determines required changes.
5.  Commits necessary DOM updates.

> Avoid saying that React always "compares two complete Virtual DOM
> trees" as if it were a simple tree-diff algorithm. Fiber and
> reconciliation are more accurate concepts.

------------------------------------------------------------------------

## 5. What is Reconciliation?

Reconciliation is React's process of determining how the new UI tree
relates to the previous tree.

React considers:

-   Element type
-   Component identity
-   Keys
-   Props
-   State
-   Position in the tree

Example:

``` jsx
<h1>Hello</h1>
```

becomes:

``` jsx
<h1>Hi</h1>
```

React can keep the existing `<h1>` and update its text content.

------------------------------------------------------------------------

## 6. What are the Render Phase and Commit Phase?

### Render Phase

React:

-   Executes components.
-   Calculates the next UI.
-   Performs reconciliation.
-   Prepares work.

The render phase should be pure.

In concurrent rendering, render work can be interrupted, restarted, or
abandoned.

### Commit Phase

React:

-   Applies DOM mutations.
-   Updates refs.
-   Runs layout effects at the appropriate point.
-   Schedules passive effects.

Simplified model:

``` text
Update
  ↓
Render phase
  ↓
Reconciliation
  ↓
Commit phase
  ↓
DOM mutations
  ↓
useLayoutEffect
  ↓
Browser can paint
  ↓
useEffect generally runs after paint
```

> Do not treat effect timing as a universal browser-paint guarantee;
> React's scheduling has nuances.

------------------------------------------------------------------------

## 7. Why does a child component re-render when the parent renders?

When a parent renders, React normally evaluates its child elements
again.

``` jsx
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Child />
      <button onClick={() => setCount(count + 1)}>
        {count}
      </button>
    </>
  );
}
```

`Child` can render again even though it has no props.

Prevent unnecessary child work when appropriate:

``` jsx
const Child = React.memo(function Child() {
  return <h1>Hello</h1>;
});
```

------------------------------------------------------------------------

## 8. Rendering vs Re-rendering vs Mounting vs Remounting

### Rendering

The component function is evaluated to calculate UI.

### Initial render / Mount

The component appears in the tree for the first time.

### Update / Re-render

The component is evaluated again because of an update.

### Unmount

The component is removed from the tree.

### Remount

The previous component identity is removed and a new component identity
is created.

``` text
Mount → Update → Update → Unmount
```

A key change can cause:

``` text
Old component
    ↓
Unmount
    ↓
New component
    ↓
Mount
```

------------------------------------------------------------------------

## 9. Does React.memo stop rendering?

`React.memo` can skip rendering work for a memoized component when its
props are considered equal.

``` jsx
const User = React.memo(function User({ name }) {
  return <h1>{name}</h1>;
});
```

By default, React compares props using a shallow comparison based on
`Object.is`.

`React.memo` is not an absolute guarantee that a component will never
render.

A memoized component can still update because of:

-   Its own state
-   Context
-   Other relevant React mechanisms

------------------------------------------------------------------------

## 10. Difference between React.memo and useMemo

### React.memo

Memoizes a component's rendering based on props.

``` jsx
const User = React.memo(UserComponent);
```

### useMemo

Memoizes a calculated value.

``` jsx
const total = useMemo(() => calculateTotal(data), [data]);
```

Think:

``` text
React.memo → component output/render bailout
useMemo    → calculated value
```

------------------------------------------------------------------------

## 11. Difference between useMemo and useCallback

### useMemo

Returns a memoized value.

``` jsx
const sortedUsers = useMemo(
  () => sortUsers(users),
  [users]
);
```

### useCallback

Returns a memoized function reference.

``` jsx
const handleClick = useCallback(() => {
  console.log("clicked");
}, []);
```

Conceptually:

``` jsx
useCallback(fn, deps)
```

is similar to:

``` jsx
useMemo(() => fn, deps)
```

------------------------------------------------------------------------

## 12. Is React always faster than direct DOM manipulation?

No.

React provides:

-   Declarative UI
-   Reconciliation
-   Batching
-   Scheduling
-   Component composition
-   Predictable state-driven updates

It can reduce unnecessary DOM work, but React is not automatically
faster than carefully optimized direct DOM manipulation.

The real goal is:

> Minimize unnecessary computation and expensive DOM/layout/paint work
> while keeping the application maintainable.

------------------------------------------------------------------------

## 13. What is Concurrent Rendering?
Concurrent rendering allows React to prepare rendering work in a way
that can be scheduled, interrupted, restarted, or abandoned.

It improves responsiveness for expensive UI updates.

Related APIs include:

``` jsx
startTransition(...)
```

``` jsx
useTransition()
```

``` jsx
useDeferredValue(...)
```

Concurrent rendering does not mean multiple DOM versions are
simultaneously visible.

------------------------------------------------------------------------

## 14. How do you optimize React rendering in a large application?

Use profiling first, then optimize the actual bottleneck.

Common techniques:

-   Keep state close to where it is needed.
-   Use `React.memo` when it provides a real benefit.
-   Use `useMemo` for expensive calculations.
-   Use `useCallback` when stable function identity matters.
-   Split large Context providers.
-   Virtualize very large lists.
-   Use code splitting.
-   Use `React.lazy` and `Suspense`.
-   Debounce expensive input-driven work.
-   Avoid unnecessary object/function creation when it affects
    memoization.
-   Use stable keys.
-   Profile with React DevTools.

------------------------------------------------------------------------

## 15. How do you identify unnecessary re-renders?

Use:

-   React DevTools Profiler
-   React DevTools component inspection
-   Console logging during development
-   `why-did-you-render` when appropriate
-   Browser Performance tools
-   Performance marks
-   Production monitoring

Look for:

-   Unstable object props
-   Unstable array props
-   Unstable callback props
-   Large Context updates
-   Expensive calculations
-   Large lists
-   State placed too high in the component tree

Do not add `memo`, `useMemo`, and `useCallback` everywhere without
profiling.

------------------------------------------------------------------------

## 16. What is React Fiber?

Fiber is React's internal architecture for representing units of
rendering work.

A Fiber node stores information about a component or element and helps
React:

-   Track component identity
-   Track state and props
-   Build work incrementally
-   Schedule work
-   Prioritize updates
-   Support interruptible rendering
-   Reconcile changes

Simplified:

``` text
Update
  ↓
Fiber work
  ↓
Render/reconciliation
  ↓
Prepared result
  ↓
Commit
```

Fiber is one of the foundations that enables modern concurrent React
behavior.

------------------------------------------------------------------------

## 17. What happens when setState() is called?

A simplified flow is:

``` text
setState()
   ↓
Update is queued
   ↓
React schedules work
   ↓
Component renders
   ↓
Reconciliation
   ↓
Commit
   ↓
DOM/effects
```

Example:

``` jsx
setCount(count + 1);
```

React does not immediately mutate the DOM at the exact line where
`setCount` is called.

------------------------------------------------------------------------

## 18. Why do multiple setState calls behave differently?

``` jsx
setCount(count + 1);
setCount(count + 1);
```

Both expressions can use the same render snapshot of `count`.

If you need sequential updates:

``` jsx
setCount(c => c + 1);
setCount(c => c + 1);
```

The functional form uses the latest queued state value.

------------------------------------------------------------------------

## 19. What is Automatic Batching?
React 18 expanded automatic batching so multiple state updates can be
grouped into fewer renders in many asynchronous situations as well as
React event handlers.

``` jsx
setCount(c => c + 1);
setName("John");
```

React can process these together instead of rendering after each
individual setter.

Benefits:

-   Fewer renders
-   Less work
-   Better performance

------------------------------------------------------------------------

## 20. What is flushSync?

`flushSync` from `react-dom` can force React to flush updates
synchronously.

``` jsx
import { flushSync } from "react-dom";

flushSync(() => {
  setCount(c => c + 1);
});
```

Use it rarely.

Typical use case:

-   Code must immediately observe a DOM update after a state change.

It can reduce performance and interfere with React's normal scheduling.

------------------------------------------------------------------------

## 21. What is a rendering bailout?

A bailout means React can avoid unnecessary work because it determines
that some part of the tree does not need to be recalculated or
committed.

Examples include:

-   Same state value
-   Memoized component with equal props
-   Unchanged subtree in reconciliation
-   Stable component identity

Bailouts are an optimization, not something application code should
assume in every case.

------------------------------------------------------------------------

## 22. How does referential equality affect rendering?
Objects, arrays, and functions are compared by reference.

``` jsx
const user = {
  name: "John"
};
```

A new object is created on every render.

Therefore:

``` jsx
<Child user={user} />
```

can cause a memoized child to render because:

``` js
previousUser !== nextUser
```

If appropriate:

``` jsx
const user = useMemo(
  () => ({ name: "John" }),
  []
);
```

> Do not use `useMemo` merely to avoid creating a small object unless it
> solves a real rendering problem.

------------------------------------------------------------------------

## 23. What is Object.is and why is it important?

React uses `Object.is` semantics in several equality checks, including
default `React.memo` prop comparison and state bailout behavior.

Examples:

``` js
Object.is(10, 10); // true
Object.is({}, {}); // false
Object.is([], []); // false
```

This explains why new object/array references are considered different
even when their contents look identical.

------------------------------------------------------------------------

## 24. How do keys affect reconciliation?
Keys help React identify children across renders.

Good:

``` jsx
users.map(user => (
  <User key={user.id} user={user} />
))
```

Avoid using indexes as keys when list items can:

-   Be inserted
-   Be removed
-   Be reordered

``` jsx
users.map((user, index) => (
  <User key={index} user={user} />
))
```

A stable key helps React preserve the correct component identity and
state.

------------------------------------------------------------------------

## 25. Why can using array index as key cause bugs?

Consider:

``` text
Before:
0 → Alice
1 → Bob
2 → Charlie

After inserting David:
0 → David
1 → Alice
2 → Bob
3 → Charlie
```

If index is used as the key, React may associate existing component
state with the wrong data item.

This can cause:

-   Wrong input values
-   Wrong local state
-   Incorrect animations
-   Unexpected component reuse

Use stable IDs whenever possible.

------------------------------------------------------------------------

## 26. Why does changing a key reset component state?

Example:

``` jsx
<Form key={userId} />
```

When `userId` changes, React can treat the element as a different
identity.

Conceptually:

``` text
Old Form
   ↓
Unmount
   ↓
New Form
   ↓
Initial state
```

This can intentionally be used to reset a component.

------------------------------------------------------------------------

## 27. What is state as a snapshot?
React state represents the value associated with the current render.

``` jsx
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
    console.log(count);
  }

  return <button onClick={handleClick}>{count}</button>;
}
```

The `console.log` sees the `count` from the current render, not a
synchronously mutated variable.

This explains many React state and async bugs.

------------------------------------------------------------------------

## 28. What are stale closures?

A callback can capture values from the render in which it was created.

Example:

``` jsx
useEffect(() => {
  const timer = setInterval(() => {
    console.log(count);
  }, 1000);

  return () => clearInterval(timer);
}, []);
```

The callback can keep an older `count` value.

Possible solutions depend on the problem:

-   Correct effect dependencies
-   Functional state updates
-   `useRef` for mutable values when appropriate
-   Restructuring the effect

Example:

``` jsx
setCount(c => c + 1);
```

------------------------------------------------------------------------

## 29. Why does StrictMode sometimes render a component twice?

In development, `StrictMode` intentionally performs additional checks to
help detect:

-   Impure rendering
-   Missing cleanup
-   Unsafe side effects
-   Other development-time issues

``` jsx
<StrictMode>
  <App />
</StrictMode>
```

This behavior should not be interpreted as "React production always
renders twice."

------------------------------------------------------------------------

## 30. Does changing useRef cause a re-render?

No.

``` jsx
const countRef = useRef(0);

countRef.current++;
```

Changing `.current` does not schedule a render.

Compare:

``` jsx
const [count, setCount] = useState(0);

setCount(c => c + 1);
```

`useState` schedules rendering; `useRef` provides a mutable value that
survives renders.

------------------------------------------------------------------------

## 31. How does Context affect rendering?

When a Context provider's value changes, consumers that read that
context can update.

Example:

``` jsx
<AuthContext.Provider value={value}>
  <App />
</AuthContext.Provider>
```

Be careful with:

``` jsx
const value = {
  user,
  logout
};
```

A new object is created whenever the provider renders.

For appropriate cases:

``` jsx
const value = useMemo(
  () => ({ user, logout }),
  [user, logout]
);
```

Also consider splitting large contexts.

------------------------------------------------------------------------

## 32. Why should large Contexts be split?

### Problem

``` text
AppContext
 ├── User
 ├── Theme
 ├── Cart
 ├── Notifications
 └── Permissions
```

If the value changes frequently, many consumers may receive updates.

Better:

``` text
UserContext
ThemeContext
CartContext
NotificationContext
```

This gives more granular update boundaries.

------------------------------------------------------------------------

## 33. What is startTransition?

`startTransition` marks an update as non-urgent.

``` jsx
startTransition(() => {
  setSearchResults(results);
});
```

For example:

``` text
Urgent:
Typing into search input

Non-urgent:
Rendering a large filtered result list
```

React can prioritize the urgent interaction.

------------------------------------------------------------------------

## 34. What is useTransition?

`useTransition` gives you transition state and a function for starting
transition updates.

``` jsx
const [isPending, startTransition] = useTransition();

function handleSearch(value) {
  startTransition(() => {
    setResults(filterResults(value));
  });
}
```

You can use `isPending` to display UI feedback.

------------------------------------------------------------------------

## 35. What is useDeferredValue?

`useDeferredValue` lets a component use a deferred version of a value.

``` jsx
const deferredQuery = useDeferredValue(query);
```

Typical scenario:

``` text
User types quickly
     ↓
Input updates immediately
     ↓
Expensive result UI uses deferred query
```

It does not debounce the value by a fixed time.

It tells React that rendering the deferred value can be lower priority.

------------------------------------------------------------------------

## 36. startTransition vs useDeferredValue

### `startTransition`

Use when you control the state update:

``` jsx
startTransition(() => {
  setResults(results);
});
```

### `useDeferredValue`

Use when you receive/control a value and want a deferred version:

``` jsx
const deferredResults = useDeferredValue(results);
```

Think:

``` text
startTransition → mark update as non-urgent
useDeferredValue → consume a lower-priority version of a value
```

------------------------------------------------------------------------

## 37. What is Suspense?

`Suspense` allows React to display fallback UI while a child is not
ready.

``` jsx
<Suspense fallback={<Spinner />}>
  <Dashboard />
</Suspense>
```

It is commonly used with:

-   Code splitting
-   Lazy-loaded components
-   Framework-supported data fetching
-   Streaming/server rendering

Suspense is a rendering coordination mechanism, not simply a loading
spinner component.

------------------------------------------------------------------------

## 38. How does React.lazy affect rendering?

`React.lazy` loads a component dynamically.

``` jsx
const AdminPanel = React.lazy(
  () => import("./AdminPanel")
);
```

Use it with `Suspense`:

``` jsx
<Suspense fallback={<Loading />}>
  <AdminPanel />
</Suspense>
```

This supports code splitting and reduces initial JavaScript work.

------------------------------------------------------------------------

## 39. What are Error Boundaries?

Error boundaries catch rendering errors in descendant component trees
and show fallback UI.

Class component example:

``` jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

They do not replace normal error handling for every async operation or
event handler.

------------------------------------------------------------------------

## 40. How do you render very large lists efficiently?

### Problem

Rendering thousands of DOM nodes can cause:

-   Slow rendering
-   High memory usage
-   Expensive layout/paint
-   Poor scrolling performance

### Solution

Use virtualization/windowing.

Examples:

-   `react-window`
-   `react-virtualized`
-   Framework-specific virtualization solutions

Instead of rendering 10,000 rows, render only the rows currently needed.

------------------------------------------------------------------------

## 41. What is code splitting?

Code splitting divides JavaScript into smaller chunks that can be loaded
when needed.

Example:

``` jsx
const Reports = React.lazy(
  () => import("./Reports")
);
```

Benefits:

-   Smaller initial JavaScript
-   Faster initial loading
-   Load features on demand

------------------------------------------------------------------------

## 42. What is the React Profiler?

React DevTools Profiler helps identify:

-   Which components rendered
-   How often they rendered
-   Render duration
-   Expensive component trees
-   Performance regressions

Use profiling before optimizing.

A good process is:

``` text
Measure
  ↓
Find bottleneck
  ↓
Change implementation
  ↓
Measure again
```

------------------------------------------------------------------------


## 43. Client Rendering vs Server Rendering

### Client-side rendering

The browser receives JavaScript and React renders the UI on the client.

### Server-side rendering

The server generates HTML for the initial UI.

Benefits can include:

-   Faster initial content
-   Better SEO in appropriate applications
-   Better perceived performance

Modern React applications can combine server and client rendering.

------------------------------------------------------------------------

## 44. What is Hydration?

Hydration is the process where React attaches client-side behavior to
server-generated HTML.

Simplified:

``` text
Server
  ↓
HTML
  ↓
Browser displays HTML
  ↓
React loads
  ↓
Hydration
  ↓
Interactive application
```

Hydration expects the client and server output to be compatible.

------------------------------------------------------------------------

## 45. What causes hydration mismatch?

A hydration mismatch happens when the server-rendered output differs
from what React expects on the client.

Common causes:

``` jsx
<div>{Date.now()}</div>
```

or:

``` jsx
<div>{Math.random()}</div>
```

Other causes:

-   Browser-only APIs during render
-   Different data on server/client
-   Locale/timezone differences
-   Invalid HTML nesting
-   Conditional rendering based on `window`
-   Non-deterministic rendering

Better pattern:

``` jsx
useEffect(() => {
  // Browser-only logic
}, []);
```

when that logic truly belongs after hydration.

------------------------------------------------------------------------

## 46. What are React Server Components?

React Server Components allow some components to execute on the server
rather than being shipped as client JavaScript.

They can:

-   Reduce client JavaScript
-   Access server-side resources through supported application
    architecture
-   Keep server-only logic out of the browser bundle

A Server Component is different from SSR:

``` text
SSR
→ How HTML is generated

Server Components
→ Where component code executes
```

Frameworks such as Next.js build additional conventions around Server
Components.

------------------------------------------------------------------------

## 47. What is streaming rendering?

Streaming allows server-rendered content to be sent progressively
instead of waiting for the entire page to be ready.

Conceptually:

``` text
Server
 ↓
Shell HTML
 ↓
Important content
 ↓
More content as ready
 ↓
Client continues hydration/interaction
```

Streaming works particularly well with Suspense boundaries and modern
React frameworks.

------------------------------------------------------------------------


## 48. Search input becomes laggy with 10,000 results. What do you do?

I would:

1.  Profile the component.
2.  Separate urgent input updates from expensive result rendering.
3.  Use `startTransition` or `useDeferredValue`.
4.  Virtualize the result list.
5.  Avoid unnecessary calculations.
6.  Memoize expensive derived data only if profiling shows benefit.
7.  Debounce server requests when appropriate.

Example:

``` jsx
const deferredQuery = useDeferredValue(query);

const results = useMemo(
  () => expensiveSearch(deferredQuery),
  [deferredQuery]
);
```

------------------------------------------------------------------------

## 49. A child re-renders on every parent update. How do you debug it?

Check:

-   React DevTools Profiler
-   `React.memo`
-   Object props
-   Array props
-   Function props
-   Context
-   State placement

Example problem:

``` jsx
<Child config={{ theme: "dark" }} />
```

A new object is created on every parent render.

If necessary:

``` jsx
const config = useMemo(
  () => ({ theme: "dark" }),
  []
);
```

------------------------------------------------------------------------

## 50. React.memo is not preventing a child re-render. Why?

Possible reasons:

-   Props changed
-   Object/array reference changed
-   Function reference changed
-   Component consumes changed Context
-   Component has its own state update
-   Custom comparison is incorrect

Example:

``` jsx
<Child onClick={() => doSomething()} />
```

The function is recreated on every parent render.

Potential solution:

``` jsx
const onClick = useCallback(
  () => doSomething(),
  []
);
```

But only optimize when it actually matters.

------------------------------------------------------------------------

## 51. A form loses input state when list items reorder. What is wrong?

Likely an unstable key.

Bad:

``` jsx
items.map((item, index) => (
  <Input key={index} />
))
```

Better:

``` jsx
items.map(item => (
  <Input key={item.id} />
))
```

Stable keys preserve the correct component identity.

------------------------------------------------------------------------

## 52. A component unexpectedly resets its state. How do you investigate?

Check whether:

-   Its `key` changed.
-   Its element type changed.
-   Its position in the tree changed.
-   A parent conditionally removes it.
-   The component is actually being unmounted/remounted.

Example:

``` jsx
<Form key={userId} />
```

Changing `userId` intentionally creates a new identity.

------------------------------------------------------------------------

## 53. An API response causes the whole page to feel slow. What do you investigate?

Separate the problem into:

``` text
Network
  ↓
Data processing
  ↓
React render
  ↓
DOM commit
  ↓
Browser layout/paint
```

Then profile each stage.

Possible fixes:

-   Reduce data size
-   Paginate
-   Virtualize
-   Memoize expensive calculations
-   Split components
-   Move state closer to consumers
-   Defer non-urgent UI
-   Avoid unnecessary DOM nodes

------------------------------------------------------------------------

## 54. Context updates cause hundreds of components to render. How do you fix it?

I would:

1.  Profile the update.
2.  Split large Contexts.
3.  Keep frequently changing state separate.
4.  Stabilize provider values where appropriate.
5.  Move state closer to consumers.
6.  Consider an external store if the state model requires fine-grained
    subscriptions.

Do not blindly wrap the provider value in `useMemo`; first understand
which consumers actually need updates.

------------------------------------------------------------------------

## 55. The page freezes when rendering a huge table. What do you do?

Use:

-   Virtualization
-   Pagination
-   Incremental rendering
-   Memoized rows where useful
-   Stable keys
-   Smaller row components
-   Deferred non-critical updates

Most importantly, profile whether the bottleneck is:

-   JavaScript calculation
-   React rendering
-   DOM size
-   Layout
-   Paint

------------------------------------------------------------------------

## 56. A developer added useMemo everywhere. Is that good optimization?
No.

`useMemo` has its own overhead and complexity.

Use it when:

-   A calculation is expensive.
-   Referential stability matters.
-   Profiling shows a useful optimization.

Bad:

``` jsx
const name = useMemo(() => user.name, [user]);
```

If the calculation is trivial, `useMemo` usually adds unnecessary
complexity.

------------------------------------------------------------------------

## 57. Why is the UI responsive while a transition update is still pending?

Because React can prioritize urgent updates over transition work.

Example:

``` text
Typing
 ↓
Urgent
 ↓
Input stays responsive

Filtering huge result list
 ↓
Transition
 ↓
Can be interrupted/deprioritized
```

This is one of the practical benefits of concurrent rendering.

------------------------------------------------------------------------

## 58. A component works in development but hydration fails in production. What do you check?
Check for non-deterministic rendering:

``` jsx
Date.now()
Math.random()
new Date()
```

Also check:

-   Browser-only APIs
-   Different server/client data
-   Timezone/locale differences
-   Invalid HTML
-   Conditional `window` checks during render
-   Third-party libraries that assume browser APIs

The server and initial client render need compatible output.

------------------------------------------------------------------------

## 59. Why does a component appear to render twice in development?

First check whether `StrictMode` is enabled.

React development checks can intentionally invoke
rendering/effect-related logic more than once to detect bugs.

Do not immediately assume:

``` text
React is broken
```

Instead check:

-   StrictMode
-   Side effects inside render
-   Missing effect cleanup
-   State updates triggered during rendering

------------------------------------------------------------------------

## 60. How would you optimize a dashboard with 50 widgets?

I would:

1.  Profile the dashboard.
2.  Split widgets into independent components.
3.  Keep state local where possible.
4.  Avoid one global Context for everything.
5.  Lazy-load non-critical widgets.
6.  Use Suspense boundaries where appropriate.
7.  Memoize expensive widgets only when useful.
8.  Virtualize large tables.
9.  Defer non-critical rendering.
10. Reduce unnecessary data fetching.
11. Cache server data using the application's data layer.
12. Monitor real-user performance.

------------------------------------------------------------------------

## 61. A component performs an expensive calculation on every render. What do you do?

First verify the cost with profiling.

Then:

``` jsx
const result = useMemo(
  () => expensiveCalculation(data),
  [data]
);
```

Also consider whether the calculation can be:

-   Moved outside rendering
-   Cached elsewhere
-   Performed on the server
-   Incrementally computed
-   Avoided entirely

------------------------------------------------------------------------

## 62. Parent state changes but only one small section needs the state. How do you improve rendering?

Move the state closer to the component that needs it.

Bad:

``` text
App
 ├── Header
 ├── Sidebar
 ├── LargeDashboard
 └── SmallCounter
```

If `App` owns frequently changing counter state, the update may cause
unnecessary work.

Better:

``` text
App
 ├── Header
 ├── Sidebar
 ├── LargeDashboard
 └── Counter
      └── local state
```

This is called **state colocation**.

------------------------------------------------------------------------

## 63. What is state colocation?

State colocation means keeping state as close as practical to the
components that use it.

Benefits:

-   Smaller update scope
-   Less prop drilling
-   Fewer unnecessary renders
-   Easier maintenance

Do not move every state value to global state just because multiple
components exist.

------------------------------------------------------------------------

## 64. How would you debug a rendering performance regression after deployment?

I would:

``` text
1. Confirm regression
2. Identify affected route/component
3. Compare before/after profile
4. Check bundle size
5. Check render duration
6. Check network requests
7. Check DOM size
8. Check browser long tasks
9. Check hydration cost
10. Reproduce with production build
11. Fix bottleneck
12. Measure again
```

Use:

-   React Profiler
-   Browser Performance panel
-   Lighthouse
-   Real User Monitoring
-   Production telemetry

------------------------------------------------------------------------

## 65. What are common React rendering anti-patterns?

Common examples:

-   Mutating state directly
-   Unstable list keys
-   Putting all state in one global Context
-   Using `useMemo` everywhere
-   Using `useCallback` everywhere
-   Rendering huge lists without virtualization
-   Doing expensive calculations during every render
-   Triggering state updates during render
-   Performing side effects during render
-   Creating unnecessarily large component trees
-   Fetching duplicate data
-   Ignoring hydration warnings
-   Premature optimization

------------------------------------------------------------------------


## Rendering Lifecycle

``` text
State/Props/Context update
        ↓
     Schedule
        ↓
   Render Phase
        ↓
 Reconciliation/Fiber
        ↓
   Commit Phase
        ↓
 DOM mutations
        ↓
 Layout effects
        ↓
 Browser paint
        ↓
 Passive effects
```

## Main Optimization Tools

  Tool                 Main purpose
  -------------------- --------------------------------------------------
  `React.memo`         Avoid unnecessary child rendering based on props
  `useMemo`            Cache expensive calculated values
  `useCallback`        Preserve function identity
  `useRef`             Store mutable values without triggering render
  `useTransition`      Mark updates as non-urgent
  `startTransition`    Mark state updates as transitions
  `useDeferredValue`   Use a lower-priority version of a value
  `Suspense`           Coordinate loading/async rendering boundaries
  `React.lazy`         Code splitting
  Virtualization       Render only visible portions of huge lists
  Profiler             Find actual rendering bottlenecks


