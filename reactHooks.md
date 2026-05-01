# React Context API Example

## 📌 Definition

**Context API** in React allows you to share data (state) across components without passing props manually at every level (also called "prop drilling").

It is mainly used for **global state management** like themes, authentication, language, etc.

---

## 🧩 Example: Theme Context

```tsx
'use client';
import { createContext, useContext } from 'react';

const ThemeContext = createContext('light');

function ChildComponent() {
  const theme = useContext(ThemeContext);

  return (
    <div className={theme}>
      This is use context api theme here.
    </div>
  );
}

function App() {
  return (
    <>
      <ThemeContext.Provider value='dark'>
        <ChildComponent />
      </ThemeContext.Provider>
    </>
  );
}
```

# React `useCallback` Hook

## Definition

`useCallback` is a React hook that **memoizes a function**, returning the same function reference between re-renders unless its dependencies change. It prevents unnecessary re-creation of functions on every render, which is useful for optimizing performance — especially when passing callbacks to child components wrapped in `React.memo`.

### Syntax

```jsx
const memoizedFn = useCallback(fn, [dependencies]);
```

| Parameter        | Description                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| `fn`             | The function you want to memoize.                                           |
| `[dependencies]` | An array of values that, when changed, cause the function to be re-created. |

---

## Why Use `useCallback`?

In React, every time a component re-renders, all functions defined inside it are **re-created**. This means child components receiving those functions as props will also re-render — even if the function logic hasn't changed. `useCallback` solves this by keeping the **same function reference** across renders.

---

## Code Examples

### 1. Basic Usage

```jsx
import { useState, useCallback } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => {
    setCount((prev) => prev + 1);
  }, []);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

Here, `increment` keeps the same reference across renders because the dependency array is empty (`[]`).

---

### 2. With Dependencies

```jsx
import { useState, useCallback } from "react";

function Greeting() {
  const [name, setName] = useState("Alice");

  const greet = useCallback(() => {
    alert(`Hello, ${name}!`);
  }, [name]);

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={greet}>Greet</button>
    </div>
  );
}
```

`greet` is re-created **only when `name` changes**, not on every render.

---

### 3. Preventing Unnecessary Child Re-renders

```jsx
import { useState, useCallback, memo } from "react";

const ExpensiveList = memo(({ onItemClick }) => {
  console.log("ExpensiveList rendered");
  const items = ["Apple", "Banana", "Cherry"];

  return (
    <ul>
      {items.map((item) => (
        <li key={item} onClick={() => onItemClick(item)}>
          {item}
        </li>
      ))}
    </ul>
  );
});

function App() {
  const [count, setCount] = useState(0);

  const handleItemClick = useCallback((item) => {
    console.log(`Clicked: ${item}`);
  }, []);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Re-render Parent</button>
      <ExpensiveList onItemClick={handleItemClick} />
    </div>
  );
}
```

Without `useCallback`, clicking the button would re-render `ExpensiveList` every time — even though `onItemClick` logic hasn't changed. With `useCallback`, the memoized child skips re-rendering.

---

### 4. Using with `useEffect`

```jsx
import { useState, useCallback, useEffect } from "react";

function SearchResults({ query }) {
  const [results, setResults] = useState([]);

  const fetchResults = useCallback(async () => {
    const res = await fetch(`https://api.example.com/search?q=${query}`);
    const data = await res.json();
    setResults(data);
  }, [query]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return (
    <ul>
      {results.map((r) => (
        <li key={r.id}>{r.title}</li>
      ))}
    </ul>
  );
}
```

`fetchResults` is stable unless `query` changes, preventing the `useEffect` from firing on every render.

---

## When NOT to Use `useCallback`

- **Simple components** — If the component tree is small, the overhead of memoization isn't worth it.
- **Functions not passed as props** — If the function is only used inside the same component and doesn't trigger child re-renders, memoizing it adds complexity for no benefit.
- **Premature optimization** — Profile first. Use `useCallback` when you've identified an actual performance issue.

---

## `useCallback` vs `useMemo`

| Hook          | Memoizes        | Returns            |
| ------------- | --------------- | ------------------ |
| `useCallback` | A **function**  | The same function  |
| `useMemo`     | A **value**     | A computed result  |

They are related — `useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`.

---

## Quick Reference

```jsx
// Memoize a function with no dependencies (created once)
const handleClick = useCallback(() => { /* ... */ }, []);

// Memoize a function that depends on `id`
const handleDelete = useCallback((e) => {
  deleteItem(id);
}, [id]);

// Equivalent useMemo form
const handleClick = useMemo(() => () => { /* ... */ }, []);
```
