# React Rendering 

## 1. What is Rendering in React?

### Answer

Rendering is the process where React executes a component function to
determine what the UI should look like.

When a component renders:

-   React calls the component function.
-   Creates a new Virtual DOM.
-   Compares it with the previous Virtual DOM (Reconciliation).
-   Updates only the changed nodes in the Real DOM during the Commit
    phase.

> **Note:** A render does **not** mean the browser DOM is updated every
> time.

------------------------------------------------------------------------

## 2. What causes a component to re-render?

### Answer

A component re-renders when:

-   State changes (`useState`, `useReducer`)
-   Props change
-   Context value changes
-   Parent component re-renders
-   Force update (Class Components)

### Example

``` jsx
const [count, setCount] = useState(0);

setCount(count + 1);
```

Calling `setCount()` schedules a new render.

------------------------------------------------------------------------

## 3. Does React re-render the whole page?

### Answer

**No.**

React re-executes the component function, but only updates the DOM
elements that actually changed.

### Example

``` jsx
<App>
  <Header />
  <Counter />
</App>
```

If `Counter` state changes:

-   App renders
-   Counter renders
-   Header may also render unless memoized

React updates only the changed DOM nodes.

------------------------------------------------------------------------

## 4. What is Virtual DOM?

### Answer

Virtual DOM is a lightweight JavaScript representation of the Real DOM.

When state changes:

-   React creates a new Virtual DOM.
-   Compares it with the previous Virtual DOM.
-   Finds the difference.
-   Updates only the changed elements in the Real DOM.

This minimizes expensive DOM operations.

------------------------------------------------------------------------

## 5. What is Reconciliation?

### Answer

Reconciliation is the algorithm React uses to compare the previous
Virtual DOM with the new Virtual DOM and determine the minimum DOM
updates.

### Example

**Old**

``` html
<h1>Hello</h1>
```

**New**

``` html
<h1>Hi</h1>
```

React updates only the text node instead of recreating the `<h1>`
element.

------------------------------------------------------------------------

## 6. What are the Render Phase and Commit Phase?

### Answer

### Render Phase

-   Component functions execute.
-   React builds a new Virtual DOM.
-   Pure calculation only.
-   Can be interrupted in Concurrent React.

### Commit Phase

-   React updates the Real DOM.
-   Runs `useLayoutEffect`.
-   Browser paints.
-   Then runs `useEffect`.

------------------------------------------------------------------------

## 7. Why does a child component re-render when the parent renders?

### Answer

Whenever a parent renders, React executes all child components by
default.

### Example

``` jsx
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Child />
      <button onClick={() => setCount(count + 1)}>
        Click
      </button>
    </>
  );
}
```

Even though `Child` has no props, it renders again because its parent
rendered.

### Prevent unnecessary renders

``` jsx
const Child = React.memo(() => {
  return <h1>Hello</h1>;
});
```

------------------------------------------------------------------------

## 8. Difference between Rendering and Re-rendering

### Rendering

-   Happens when the component mounts.
-   Component executes for the first time.

### Re-rendering

-   Happens after state, props, or context changes.
-   Component executes again.

------------------------------------------------------------------------

## 9. Does React.memo stop rendering?

### Answer

**No.**

`React.memo` skips rendering only when props haven't changed.

``` jsx
const Child = React.memo(({ name }) => {
  console.log("Rendered");
  return <h1>{name}</h1>;
});
```

If `name` remains the same, React skips rendering.

------------------------------------------------------------------------

## 10. Difference between useMemo and React.memo

### React.memo

-   Memoizes an entire component.
-   Prevents unnecessary component renders.

``` jsx
const User = React.memo(UserComponent);
```

### useMemo

-   Memoizes a computed value.
-   Prevents expensive recalculations.

``` jsx
const total = useMemo(() => calculateTotal(data), [data]);
```

------------------------------------------------------------------------

## 11. Difference between useMemo and useCallback

### useMemo

Returns a cached value.

``` jsx
const sorted = useMemo(() => sortUsers(users), [users]);
```

### useCallback

Returns a cached function.

``` jsx
const handleClick = useCallback(() => {
  console.log("clicked");
}, []);
```

------------------------------------------------------------------------

## 12. Why is React faster than manipulating the DOM directly?

### Answer

React minimizes expensive DOM operations by:

-   Using the Virtual DOM
-   Performing reconciliation
-   Updating only changed DOM nodes
-   Batching state updates
-   Prioritizing rendering in Concurrent React

------------------------------------------------------------------------

## 13. What is Concurrent Rendering?

### Answer

Concurrent Rendering (introduced in React 18) allows React to prepare
multiple versions of the UI and prioritize updates.

### Benefits

-   Interruptible rendering
-   Better responsiveness
-   Smoother user experience
-   Time slicing for long rendering work

Features like `startTransition` and `useDeferredValue` are built on
Concurrent Rendering.

------------------------------------------------------------------------

## 14. How do you optimize React rendering in a large application?

### Answer

-   `React.memo` for stable child components
-   `useMemo` for expensive calculations
-   `useCallback` for stable function references
-   Proper state placement
-   List virtualization (`react-window`, `react-virtualized`)
-   Code splitting using `React.lazy` and `Suspense`
-   Debouncing or throttling
-   Stable `key` props
-   React DevTools Profiler

------------------------------------------------------------------------

## 15. How do you identify unnecessary re-renders?

### Answer

I use:

-   React DevTools Profiler
-   `console.log()` during development
-   `why-did-you-render`
-   Checking unstable props (objects, arrays, functions)
-   Verifying whether `React.memo`, `useMemo`, or `useCallback` improves
    performance
