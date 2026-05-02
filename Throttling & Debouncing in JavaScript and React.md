# Throttling & Debouncing in JavaScript and React

A comprehensive guide for interview preparation covering concepts, implementations, and real-world usage.

---

## Table of Contents

- [What is Debouncing?](#what-is-debouncing)
- [What is Throttling?](#what-is-throttling)
- [Key Differences](#key-differences)
- [JavaScript Implementations](#javascript-implementations)
- [React Implementations](#react-implementations)
- [Common Interview Questions](#common-interview-questions)

---

## What is Debouncing?

Debouncing ensures a function only executes **after a specified delay has passed since the last invocation**. If the event keeps firing, the timer resets each time.

**Analogy:** An elevator door that waits until nobody is entering before it closes. Every time someone walks in, the timer resets.

**Common Use Cases:**
- Search input (API call after user stops typing)
- Window resize calculations
- Form field validation
- Auto-saving a document

---

## What is Throttling?

Throttling ensures a function executes **at most once in a given time interval**, regardless of how many times the event fires.

**Analogy:** A metronome ticking at a fixed rate — no matter how fast you tap, it only clicks once per beat.

**Common Use Cases:**
- Scroll event handlers
- Mouse move / drag tracking
- Rate-limiting button clicks
- Infinite scroll loading
- Analytics event logging

---

## Key Differences

| Feature           | Debounce                              | Throttle                                  |
| ----------------- | ------------------------------------- | ----------------------------------------- |
| **When it fires** | After activity *stops*                | At regular intervals *during* activity    |
| **Guarantees**    | Only the last call matters            | Steady, predictable execution rate        |
| **Best for**      | Final value (search, resize end)      | Continuous updates (scroll, mousemove)    |
| **Missed calls**  | All intermediate calls are discarded  | Calls between intervals are skipped       |

---

## JavaScript Implementations

### Debounce Function

```js
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
```

**Usage:**

```js
const handleSearch = debounce((query) => {
  console.log("Searching for:", query);
  // Make API call here
}, 500);

document.getElementById("search").addEventListener("input", (e) => {
  handleSearch(e.target.value);
});

// User types "hello" quickly:
// Only ONE log → "Searching for: hello" (500ms after last keystroke)
```

### Debounce with Leading Edge (Immediate Mode)

Fires on the **first** call, then ignores subsequent calls until the pause.

```js
function debounce(fn, delay, immediate = false) {
  let timer;
  return function (...args) {
    const callNow = immediate && !timer;
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (!immediate) fn.apply(this, args);
    }, delay);
    if (callNow) fn.apply(this, args);
  };
}

// Usage: Prevent double-click on a submit button
const handleSubmit = debounce(() => {
  console.log("Form submitted!");
}, 1000, true);

submitButton.addEventListener("click", handleSubmit);
// First click → fires immediately
// Rapid clicks within 1s → all ignored
```

### Throttle Function

```js
function throttle(fn, limit) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}
```

**Usage:**

```js
const handleScroll = throttle(() => {
  console.log("Scroll Y:", window.scrollY);
}, 300);

window.addEventListener("scroll", handleScroll);

// Even if scroll fires 100 times/sec, logs only once every 300ms
```

### Throttle with Trailing Call

Ensures the **last** call is not lost, even if it falls between intervals.

```js
function throttle(fn, limit) {
  let lastCall = 0;
  let timer = null;

  return function (...args) {
    const now = Date.now();
    const remaining = limit - (now - lastCall);

    if (remaining <= 0) {
      clearTimeout(timer);
      timer = null;
      lastCall = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        lastCall = Date.now();
        timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}
```

---

## React Implementations

### Custom Hook: `useDebounce`

Debounces a **value** — perfect for search inputs.

```jsx
import { useState, useEffect } from "react";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer); // Cleanup on value change
  }, [value, delay]);

  return debouncedValue;
}
```

**Component Example — Debounced Search:**

```jsx
function SearchBar() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery) {
      console.log("Fetching results for:", debouncedQuery);
      // fetch(`/api/search?q=${debouncedQuery}`)
      //   .then(res => res.json())
      //   .then(data => setResults(data));
    }
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### Custom Hook: `useDebouncedCallback`

Debounces a **function** — useful when you need the callback itself.

```jsx
import { useRef, useCallback, useEffect } from "react";

function useDebouncedCallback(callback, delay) {
  const timerRef = useRef(null);
  const callbackRef = useRef(callback);

  // Always keep the latest callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return useCallback(
    (...args) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}
```

**Component Example — Debounced API Call:**

```jsx
function AutoSaveForm() {
  const [text, setText] = useState("");

  const saveToServer = useDebouncedCallback((content) => {
    console.log("Auto-saving:", content);
    // fetch('/api/save', { method: 'POST', body: JSON.stringify({ content }) })
  }, 1000);

  const handleChange = (e) => {
    setText(e.target.value);
    saveToServer(e.target.value);
  };

  return <textarea value={text} onChange={handleChange} />;
}
```

### Custom Hook: `useThrottle`

Throttles a **callback** — ideal for scroll and mouse events.

```jsx
import { useRef, useCallback, useEffect } from "react";

function useThrottle(callback, delay) {
  const lastCall = useRef(0);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args) => {
      const now = Date.now();
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        callbackRef.current(...args);
      }
    },
    [delay]
  );
}
```

**Component Example — Throttled Scroll Tracker:**

```jsx
function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0);

  const handleScroll = useThrottle(() => {
    setScrollY(window.scrollY);
  }, 200);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div>
      <div style={{ position: "fixed", top: 10, right: 10 }}>
        Scroll: {scrollY}px
      </div>
      <div style={{ height: "5000px" }}>Scroll down!</div>
    </div>
  );
}
```

### Custom Hook: `useThrottledValue`

Throttles a **value** — emits the latest value at a fixed rate.

```jsx
import { useState, useEffect, useRef } from "react";

function useThrottledValue(value, limit) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdate = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastUpdate.current;

    if (elapsed >= limit) {
      lastUpdate.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastUpdate.current = Date.now();
        setThrottledValue(value);
      }, limit - elapsed);

      return () => clearTimeout(timer);
    }
  }, [value, limit]);

  return throttledValue;
}
```

---

## Common Interview Questions

### Q1: When would you pick debounce over throttle?

**Debounce** when you care about the **final value** and don't need intermediate updates. Example: a search bar where only the finished query matters.

**Throttle** when you need **regular updates during continuous activity**. Example: updating a progress bar on scroll.

### Q2: What happens if the component unmounts while a debounced timer is pending?

Without cleanup, the callback fires on an unmounted component, causing a memory leak and the React warning "Can't perform a state update on an unmounted component." Always return a cleanup function from `useEffect` or clear the timer in the hook.

### Q3: Why use `useRef` for the timer instead of `useState`?

Updating state causes a re-render. The timer ID is an internal implementation detail, not something the UI depends on. Storing it in a `ref` avoids unnecessary re-renders.

### Q4: Can you debounce with a leading AND trailing edge?

Yes. Fire immediately on the first call (leading), then also fire once more after the delay expires (trailing) if any calls came in during the wait:

```js
function debounce(fn, delay) {
  let timer;
  let lastArgs = null;

  return function (...args) {
    if (!timer) {
      fn.apply(this, args); // Leading edge
    }
    lastArgs = args;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (lastArgs) fn.apply(this, lastArgs); // Trailing edge
      timer = null;
      lastArgs = null;
    }, delay);
  };
}
```

### Q5: What libraries offer debounce/throttle?

- **Lodash** — `_.debounce()` and `_.throttle()` with leading/trailing options
- **use-debounce** — React-specific hooks (`useDebounce`, `useDebouncedCallback`)
- **ahooks** — Collection of React hooks including `useThrottle` and `useDebounce`

### Q6: How does `requestAnimationFrame` compare to throttle?

`requestAnimationFrame` (rAF) is a browser-native way to throttle to ~60fps (≈16ms). It's ideal for visual/animation updates. Use `throttle` when you need a custom interval or for non-visual tasks.

```js
let ticking = false;
window.addEventListener("scroll", () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateUI(); // Runs at ~60fps
      ticking = false;
    });
    ticking = true;
  }
});
```

---

> **Tip for interviews:** Be ready to write `debounce` and `throttle` from scratch on a whiteboard. Interviewers often ask you to implement one, explain the difference, then adapt it (add leading edge, add cancel, convert to a React hook).
