# React Hooks — Complete Senior Interview Guide

> Complete React Hooks interview preparation from React 16 → React 19, including the hooks already covered in the source guide, the missing hooks, real-project scenarios, practical examples, troubleshooting questions, and senior-level cross questions.

## What was missing in the original file?

The original guide covered 17 hook/API sections, but its own Hook Selection Matrix also listed two hooks that did not have dedicated sections:

1. `useDebugValue`
2. `useInsertionEffect`

This README adds both in full and expands **every hook/API into a practical project scenario + code example + interview Q&A**. The original guide also ends with senior-level questions around hook ordering, conditional hooks, `use()`, and transition/deferred-value selection. fileciteturn0file0L459-L499

---

# Table of Contents

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
14. [use](#14-use-react-19)
15. [useOptimistic](#15-useoptimistic-react-19)
16. [useActionState](#16-useactionstate-react-19)
17. [useFormStatus](#17-useformstatus-react-19)
18. [useDebugValue](#18-usedebugvalue)
19. [useInsertionEffect](#19-useinsertioneffect)
20. [Custom Hooks](#20-custom-hooks)
21. [Real Project Hook Scenarios](#21-real-project-hook-scenarios)
22. [Hook Selection Matrix](#22-hook-selection-matrix)
23. [Senior Cross Questions](#23-senior-cross-questions)
24. [Production Mistakes](#24-production-mistakes)
25. [Quick Interview Revision](#25-quick-interview-revision)

---

### Custom UseApi hook with debouncing and abort controller.
```typescript
import { useCallback, useEffect, useRef, useState } from "react";

export function useApi(debounceMs = 500) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);
  const controllerRef = useRef(null);

  const cancel = useCallback(() => {
    // Cancel debounce timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Abort previous API request
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  const execute = useCallback(
    (url, options = {}) => {
      // Cancel previous timer/request
      cancel();

      setLoading(true);
      setError(null);

      // Debounce
      timerRef.current = setTimeout(async () => {
        const controller = new AbortController();

        controllerRef.current = controller;

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
          }

          const result = await response.json();

          setData(result);
        } catch (err) {
          // Ignore AbortController error
          if (err.name === "AbortError") {
            return;
          }

          setError(err.message || "Something went wrong");
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      }, debounceMs);
    },
    [cancel, debounceMs]
  );

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    data,
    loading,
    error,
    execute,
    cancel,
  };
}

// use


import { useState } from "react";
import { useApi } from "./useApi";

function UserSearch() {
  const [search, setSearch] = useState("");

  const {
    data,
    loading,
    error,
  } = useApi(500);

  const handleSearch = (e) => {
    const value = e.target.value;

    setSearch(value);

    if (!value.trim()) {
      return;
    }

    execute(
      `https://api.example.com/users?search=${value}`
    );
  };

  return (
    <div>
      <input
        value={search}
        onChange={handleSearch}
        placeholder="Search users..."
      />

      {loading && <p>Loading...</p>}

      {error && <p>{error}</p>}

      {data?.map((user) => (
        <div key={user.id}>
          {user.name}
        </div>
      ))}
    </div>
  );
}

export default UserSearch;
```

# 1. useState

## Definition

`useState` adds component-level state.

```tsx
const [state, setState] = useState(initialValue);
```

## Real Project Scenario — Shopping Cart

A product page needs to maintain quantity without making an API request for every click.

```tsx
"use client";

import { useState } from "react";

export function QuantitySelector() {
  const [quantity, setQuantity] = useState(1);

  const increase = () => {
    setQuantity(prev => prev + 1);
  };

  const decrease = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  return (
    <div>
      <button onClick={decrease}>-</button>
      <span>{quantity}</span>
      <button onClick={increase}>+</button>
    </div>
  );
}
```

### Why functional updates?

This is safer when multiple updates can happen before React renders again:

```tsx
setQuantity(prev => prev + 1);
setQuantity(prev => prev + 1);
```

Both updates operate on the latest queued state.

## Real Scenario — Lazy Initialization

```tsx
const [cart, setCart] = useState(() => {
  const saved = localStorage.getItem("cart");
  return saved ? JSON.parse(saved) : [];
});
```

Use lazy initialization when calculating the initial value is expensive.

## Interview Q&A

### Q: What is a stale closure?

A callback can capture the state value from the render in which it was created.

```tsx
setTimeout(() => {
  console.log(count);
}, 1000);
```

For state updates based on previous state:

```tsx
setCount(prev => prev + 1);
```

### Q: Why does this sometimes fail?

```tsx
setCount(count + 1);
setCount(count + 1);
```

Both updates may calculate from the same render value.

Prefer:

```tsx
setCount(prev => prev + 1);
setCount(prev => prev + 1);
```

### Q: When should you use `useState` instead of `useReducer`?

Use `useState` for small, independent state. Use `useReducer` when many related state transitions become difficult to manage.

### Q: Does setting the same primitive value always cause a visible re-render?

React can bail out when the new state is `Object.is` equal to the current state.

---

# 2. useEffect

## Definition

`useEffect` synchronizes a component with an external system such as an API, timer, subscription, browser event, or WebSocket.

```tsx
useEffect(() => {
  // setup

  return () => {
    // cleanup
  };
}, [dependencies]);
```

## Real Project Scenario — Product API

```tsx
"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
};

export function Products({ category }: { category: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/products?category=${encodeURIComponent(category)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const data = await response.json();
        setProducts(data);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error(error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => controller.abort();
  }, [category]);

  return <div>{loading ? "Loading..." : products.length}</div>;
}
```

## Real Project Scenario — WebSocket

```tsx
useEffect(() => {
  const socket = new WebSocket("wss://example.com/orders");

  socket.onmessage = event => {
    const order = JSON.parse(event.data);
    console.log("Order update", order);
  };

  return () => {
    socket.close();
  };
}, []);
```

## Common Production Bug — Race Condition

User searches:

```text
phone
```

then quickly searches:

```text
iphone
```

The older request can finish after the newer request and overwrite correct results.

Use `AbortController` or a request ID.

## Interview Q&A

### Q: Why is cleanup important?

It prevents subscriptions, timers, sockets, and event listeners from surviving after the component no longer needs them.

### Q: Why does Strict Mode appear to run an effect twice in development?

React development behavior intentionally exposes effects that are not correctly cleaned up.

### Q: Why can this cause repeated execution?

```tsx
useEffect(() => {
  setUser({ name: "Vikrant" });
}, [{ id: 1 }]);
```

The object dependency is recreated on every render.

### Q: When should you NOT use `useEffect`?

Do not use it just to calculate derived data:

```tsx
// Avoid
useEffect(() => {
  setFullName(firstName + " " + lastName);
}, [firstName, lastName]);
```

Prefer:

```tsx
const fullName = `${firstName} ${lastName}`;
```

---

# 3. useLayoutEffect

## Definition

`useLayoutEffect` runs after DOM mutations but before the browser paints.

Use it when a DOM measurement or mutation must happen before the user sees the frame.

## Real Project Scenario — Tooltip Position

```tsx
"use client";

import { useLayoutEffect, useRef, useState } from "react";

export function Tooltip() {
  const targetRef = useRef<HTMLButtonElement>(null);
  const [top, setTop] = useState(0);

  useLayoutEffect(() => {
    if (!targetRef.current) return;

    const rect = targetRef.current.getBoundingClientRect();
    setTop(rect.bottom + 8);
  }, []);

  return (
    <>
      <button ref={targetRef}>Hover me</button>
      <div style={{ position: "fixed", top }}>
        Tooltip
      </div>
    </>
  );
}
```

## Interview Q&A

### Q: `useEffect` or `useLayoutEffect` for API calls?

Normally `useEffect`.

### Q: When should you use `useLayoutEffect`?

DOM measurement, layout synchronization, or preventing a visible layout jump.

### Q: Why can it hurt performance?

It runs before paint, so expensive work can delay the first visible frame.

### Q: What is the SSR concern?

There is no browser DOM during server rendering. In frameworks such as Next.js, browser-only layout code should be isolated appropriately.

---

# 4. useMemo

## Definition

`useMemo` caches a calculated value between renders.

```tsx
const result = useMemo(() => expensiveCalculation(data), [data]);
```

## Real Project Scenario — Large Product Filter

```tsx
const filteredProducts = useMemo(() => {
  return products
    .filter(product => product.category === category)
    .filter(product =>
      product.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.price - b.price);
}, [products, category, search]);
```

## Referential Stability Scenario

```tsx
const options = useMemo(
  () => ({
    page,
    pageSize: 20,
    sort: "price",
  }),
  [page]
);

return <ProductTable options={options} />;
```

This can matter when the child is memoized.

## Interview Q&A

### Q: Is `useMemo` required for correctness?

No. It is a performance optimization.

### Q: Should every calculation use `useMemo`?

No. Memoization itself has overhead and adds complexity.

### Q: What comparison is used for dependencies?

React compares dependencies using `Object.is`.

### Q: What is a common misuse?

```tsx
const value = useMemo(() => count + 1, [count]);
```

For a trivial calculation, memoization is usually unnecessary.

---

# 5. useCallback

## Definition

`useCallback` memoizes a function reference.

```tsx
const handleSave = useCallback(() => {
  saveUser(userId);
}, [userId]);
```

## Real Project Scenario — Memoized Table Row

```tsx
const UserRow = React.memo(function UserRow({
  user,
  onDelete,
}: {
  user: User;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      {user.name}
      <button onClick={() => onDelete(user.id)}>Delete</button>
    </div>
  );
});

function UserList({ users }: { users: User[] }) {
  const deleteUser = useCallback((id: string) => {
    console.log("Delete", id);
  }, []);

  return users.map(user => (
    <UserRow key={user.id} user={user} onDelete={deleteUser} />
  ));
}
```

## Interview Q&A

### Q: Why does `React.memo` make `useCallback` more useful?

Because a memoized child can skip rendering when its props are referentially equal.

### Q: Can `useCallback` create stale data?

Yes.

```tsx
const submit = useCallback(() => {
  api.save(form);
}, []); // form is stale
```

Use:

```tsx
const submit = useCallback(() => {
  api.save(form);
}, [form]);
```

### Q: Is `useCallback` always a performance optimization?

No. It can add memory and comparison overhead.

---

# 6. useRef

## Definition

`useRef` stores a mutable value that survives renders without causing a render when `.current` changes.

```tsx
const ref = useRef(initialValue);
```

## Real Project Scenario — Focus Input

```tsx
const inputRef = useRef<HTMLInputElement>(null);

function focusSearch() {
  inputRef.current?.focus();
}

return (
  <>
    <input ref={inputRef} />
    <button onClick={focusSearch}>Focus</button>
  </>
);
```

## Real Project Scenario — Store Timer

```tsx
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

function startTimer() {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
  }

  timerRef.current = setTimeout(() => {
    console.log("Done");
  }, 1000);
}

useEffect(() => {
  return () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };
}, []);
```

## Real Project Scenario — Previous Value

```tsx
const previousSearch = useRef(search);

useEffect(() => {
  previousSearch.current = search;
}, [search]);

console.log("Previous:", previousSearch.current);
```

## Interview Q&A

### Q: State vs ref?

| State | Ref |
|---|---|
| Updating causes render | Updating `.current` does not |
| Drives UI | Stores mutable data |
| React manages updates | Developer manages mutation |

### Q: When should a ref NOT be used?

Do not use refs as a replacement for state when the value must appear in the UI.

---

# 7. useContext

## Definition

`useContext` reads the nearest matching context value.

## Real Project Scenario — Authentication

```tsx
type AuthContextValue = {
  user: User | null;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}
```

Provider:

```tsx
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, logout }),
    [user, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

## Production Scenario

Good context candidates:

- Authentication
- Theme
- Locale
- Feature configuration

Poor candidate:

- Mouse position updating 60 times per second
- Very large frequently changing application state

For high-frequency state, consider more specialized state management.

## Interview Q&A

### Q: Why can context cause re-renders?

When the provider value changes, consumers reading that context can update.

### Q: How can you reduce unnecessary renders?

Split contexts by responsibility and keep provider values stable when appropriate.

---

# 8. useReducer

## Definition

`useReducer` centralizes complex state transitions.

```tsx
const [state, dispatch] = useReducer(reducer, initialState);
```

## Real Project Scenario — Checkout State

```tsx
type State = {
  step: number;
  loading: boolean;
  error: string | null;
};

type Action =
  | { type: "NEXT_STEP" }
  | { type: "PREVIOUS_STEP" }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_ERROR"; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "NEXT_STEP":
      return { ...state, step: state.step + 1 };

    case "PREVIOUS_STEP":
      return { ...state, step: Math.max(1, state.step - 1) };

    case "SUBMIT_START":
      return { ...state, loading: true, error: null };

    case "SUBMIT_SUCCESS":
      return { ...state, loading: false };

    case "SUBMIT_ERROR":
      return { ...state, loading: false, error: action.error };

    default:
      return state;
  }
}
```

Dispatch:

```tsx
dispatch({ type: "NEXT_STEP" });
dispatch({ type: "SUBMIT_START" });
```

## Interview Q&A

### Q: Why is a reducer easier to test?

It is a pure function:

```tsx
expect(
  reducer(initialState, { type: "NEXT_STEP" })
).toEqual({
  ...initialState,
  step: 2,
});
```

### Q: Should a reducer make an API request?

No. Keep reducers pure.

### Q: When does `useReducer` become a better choice?

When multiple state variables change together or when transitions have meaningful actions.

---

# 9. useTransition

## Definition

`useTransition` marks state updates as non-urgent.

```tsx
const [isPending, startTransition] = useTransition();
```

## Real Project Scenario — Large Search Results

```tsx
const [query, setQuery] = useState("");
const [results, setResults] = useState<Product[]>([]);
const [isPending, startTransition] = useTransition();

function handleSearch(value: string) {
  setQuery(value);

  startTransition(() => {
    setResults(expensiveFilter(products, value));
  });
}
```

Typing remains urgent while rendering the expensive result list is lower priority.

## Interview Q&A

### Q: Transition vs debounce?

**Debounce** waits before executing.

**Transition** allows React to prioritize rendering work differently.

They solve different problems.

### Q: What does `isPending` mean?

It indicates that the transition work is pending.

### Q: Can the transition work be interrupted?

Yes. React can prioritize more urgent updates.

---

# 10. useDeferredValue

## Definition

`useDeferredValue` creates a deferred version of a value.

```tsx
const deferredQuery = useDeferredValue(query);
```

## Real Project Scenario — Search Component

```tsx
function SearchResults({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(
    () => expensiveSearch(deferredQuery),
    [deferredQuery]
  );

  const isStale = query !== deferredQuery;

  return (
    <div style={{ opacity: isStale ? 0.5 : 1 }}>
      <Results data={results} />
    </div>
  );
}
```

## Interview Q&A

### Q: `useTransition` vs `useDeferredValue`?

Use `useTransition` when you control the state update.

Use `useDeferredValue` when you receive the changing value and want to defer consuming it.

---

# 11. useId

## Definition

`useId` generates stable IDs that work with server rendering and hydration.

```tsx
const id = useId();
```

## Real Project Scenario — Accessible Form

```tsx
function EmailField() {
  const id = useId();

  return (
    <div>
      <label htmlFor={`${id}-email`}>Email</label>

      <input
        id={`${id}-email`}
        aria-describedby={`${id}-help`}
      />

      <small id={`${id}-help`}>
        We will never share your email.
      </small>
    </div>
  );
}
```

## Interview Q&A

### Q: Can `useId` be used as a list key?

No.

```tsx
items.map(item => (
  <Row key={item.id} />
))
```

Use a stable identifier from your data.

### Q: Why not `Math.random()`?

Random values can differ between server and client and create hydration problems.

---

# 12. useSyncExternalStore

## Definition

`useSyncExternalStore` safely subscribes React to state that exists outside React.

```tsx
const value = useSyncExternalStore(
  subscribe,
  getSnapshot,
  getServerSnapshot
);
```

## Real Project Scenario — Browser Online Status

```tsx
function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);

  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

function useOnlineStatus() {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
}
```

Usage:

```tsx
function Status() {
  const online = useOnlineStatus();

  return <p>{online ? "Online" : "Offline"}</p>;
}
```

## Real Project Scenario — External Store

This hook is useful when integrating a store or browser API that exists independently of React.

## Interview Q&A

### Q: What problem does it solve?

It gives React a consistent subscription/snapshot model for external mutable state, especially under concurrent rendering.

### Q: What happens if `getSnapshot()` returns a new object every time?

React can continuously detect changes. Snapshot results should be cached/stable when the underlying value has not changed.

---

# 13. useImperativeHandle

## Definition

`useImperativeHandle` customizes the API exposed through a ref.

## Real Project Scenario — Video Player

```tsx
import {
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";

type VideoPlayerHandle = {
  play: () => void;
  pause: () => void;
};

const VideoPlayer = forwardRef<VideoPlayerHandle>(function VideoPlayer(
  _props,
  ref
) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(ref, () => ({
    play() {
      void videoRef.current?.play();
    },
    pause() {
      videoRef.current?.pause();
    },
  }), []);

  return <video ref={videoRef} src="/movie.mp4" />;
});
```

Parent:

```tsx
const playerRef = useRef<VideoPlayerHandle>(null);

playerRef.current?.play();
playerRef.current?.pause();
```

## Why this is useful

The parent gets:

```text
play()
pause()
```

instead of direct access to the entire DOM implementation.

## Interview Q&A

### Q: When should you avoid it?

When normal props/state can express the same behavior.

### Q: What design principle applies?

Expose the smallest useful imperative API.

---

# 14. use (React 19)

## Definition

React's `use()` API can read a Promise or Context value during render.

```tsx
const value = use(resource);
```

Unlike traditional hooks, `use()` can be used conditionally and in loops.

## Real Project Scenario — Promise + Suspense

```tsx
import { Suspense, use } from "react";

const userPromise = fetch("/api/user").then(res => res.json());

function UserProfile() {
  const user = use(userPromise);

  return <h1>{user.name}</h1>;
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <UserProfile />
    </Suspense>
  );
}
```

The Promise should be stable/cached rather than recreated on every render.

## Conditional Context Example

```tsx
function Component({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return null;
  }

  const theme = use(ThemeContext);

  return <div className={theme}>Hello</div>;
}
```

## Interview Q&A

### Q: Is `use()` a normal hook?

No. It is a React API with different calling rules.

### Q: Can it be conditional?

Yes.

### Q: What happens with a new Promise every render?

It can repeatedly suspend because React receives a different Promise.

---

# 15. useOptimistic (React 19)

## Definition

`useOptimistic` allows the UI to show an expected result immediately while an async operation is in progress.

```tsx
const [optimisticState, addOptimistic] =
  useOptimistic(state, updateFn);
```

## Real Project Scenario — Like Button

```tsx
"use client";

import { useOptimistic, useState } from "react";

export function LikeButton({
  initialLiked,
}: {
  initialLiked: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);

  const [optimisticLiked, setOptimisticLiked] = useOptimistic(
    liked,
    (_current, next: boolean) => next
  );

  async function toggleLike() {
    const next = !liked;

    setOptimisticLiked(next);

    try {
      const response = await fetch("/api/like", {
        method: "POST",
        body: JSON.stringify({ liked: next }),
      });

      if (!response.ok) {
        throw new Error("Like failed");
      }

      setLiked(next);
    } catch {
      // Actual state remains unchanged, allowing the optimistic state
      // to reconcile back to the server-confirmed value.
    }
  }

  return (
    <button onClick={toggleLike}>
      {optimisticLiked ? "♥ Liked" : "♡ Like"}
    </button>
  );
}
```

## Real Project Scenarios

- Like/unlike
- Add comment
- Mark notification read
- Toggle todo completion
- Remove item from UI before server confirmation

## Interview Q&A

### Q: Why use optimistic UI?

The user sees immediate feedback instead of waiting for network latency.

### Q: What happens if the server rejects the operation?

The UI can reconcile with the actual server-confirmed state.

### Q: Should every API operation be optimistic?

No. It is best when failure is recoverable and the expected result is highly predictable.

---

# 16. useActionState (React 19)

## Definition

`useActionState` manages the result of an action and its pending state.

```tsx
const [state, formAction, isPending] =
  useActionState(action, initialState);
```

## Real Project Scenario — Registration Form

```tsx
"use client";

import { useActionState } from "react";

type FormState = {
  success: boolean;
  message: string;
};

const initialState: FormState = {
  success: false,
  message: "",
};

async function register(
  previousState: FormState,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") ?? "");

  if (!email.includes("@")) {
    return {
      success: false,
      message: "Invalid email",
    };
  }

  // Call server/API here.

  return {
    success: true,
    message: "Registration successful",
  };
}

export function RegisterForm() {
  const [state, formAction, isPending] =
    useActionState(register, initialState);

  return (
    <form action={formAction}>
      <input name="email" />

      <button disabled={isPending}>
        {isPending ? "Registering..." : "Register"}
      </button>

      <p>{state.message}</p>
    </form>
  );
}
```

## Interview Q&A

### Q: What problem does it solve?

It reduces the repeated pattern of maintaining:

```text
loading
success
error
response
```

with multiple pieces of state.

### Q: What was it previously called?

It was previously known as `useFormState`.

---

# 17. useFormStatus (React 19)

## Definition

`useFormStatus` reads submission status from a parent form.

It is imported from `react-dom`.

```tsx
import { useFormStatus } from "react-dom";
```

## Real Project Scenario — Reusable Submit Button

```tsx
"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save"}
    </button>
  );
}
```

Use it inside a form:

```tsx
<form action={formAction}>
  <input name="name" />
  <SubmitButton />
</form>
```

## Important Interview Question

### Q: Why can't I call `useFormStatus()` in the same component that renders the form?

Because it reads the status of the nearest parent form. The status-reading component must be a descendant of that form.

---

# 18. useDebugValue

## Why it was missing

The original Hook Selection Matrix listed `useDebugValue`, but the document did not provide a dedicated section for it. fileciteturn0file0L461-L478

## Definition

`useDebugValue` adds a label for a custom hook in React DevTools.

```tsx
useDebugValue(value);
```

It is mainly useful for **custom hook debugging**, not application rendering.

## Real Project Scenario — useOnlineStatus

```tsx
import {
  useDebugValue,
  useSyncExternalStore,
} from "react";

function useOnlineStatus() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  );

  useDebugValue(online ? "Online" : "Offline");

  return online;
}
```

React DevTools can show something like:

```text
useOnlineStatus: Online
```

## Formatter Example

```tsx
useDebugValue(user, user => {
  return user ? `User: ${user.name}` : "Logged out";
});
```

The formatter can avoid unnecessary formatting work until DevTools needs the value.

## Interview Q&A

### Q: Does `useDebugValue` affect the UI?

No. It is for developer tooling.

### Q: Should every custom hook use it?

No. Use it when the custom hook's internal state would otherwise be difficult to understand in DevTools.

### Q: Is it important for application performance?

It should not be used as a rendering mechanism. Keep it focused on debugging.

---

# 19. useInsertionEffect

## Why it was missing

The original guide included `useInsertionEffect` in its final Hook Selection Matrix and in the effect execution-order question, but it did not have a dedicated section. fileciteturn0file0L476-L488

## Definition

`useInsertionEffect` is intended primarily for libraries that need to inject styles before layout effects run.

```tsx
useInsertionEffect(() => {
  // insert styles
}, [dependencies]);
```

## Real Project Scenario — CSS-in-JS Library

A CSS-in-JS library may dynamically create a style rule before layout measurement happens.

Conceptually:

```tsx
function useDynamicStyle(cssText: string) {
  useInsertionEffect(() => {
    const style = document.createElement("style");

    style.textContent = cssText;

    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, [cssText]);
}
```

## Important

Application developers normally should **not** reach for `useInsertionEffect` for ordinary DOM work.

Prefer:

```text
useEffect
```

or:

```text
useLayoutEffect
```

depending on whether the work must happen before paint.

## Interview Q&A

### Q: Why does React provide `useInsertionEffect`?

Primarily to support CSS-in-JS and similar libraries that need to inject styles at the right point in React's commit process.

### Q: Can I use it for normal DOM measurements?

No. `useLayoutEffect` is the normal choice for layout measurement.

### Q: Where does it run in the effect sequence?

Conceptually:

```text
useInsertionEffect
      ↓
DOM mutations
      ↓
useLayoutEffect
      ↓
Browser paint
      ↓
useEffect
```

The original guide explicitly identifies this ordering. fileciteturn0file0L485-L488

---

# 20. Custom Hooks

## Definition

A custom hook is a reusable function that composes React hooks.

```tsx
function useSomething() {
  // hooks
}
```

Custom hooks are one of the most important practical topics for senior React interviews.

## Real Project Scenario — useDebounce

```tsx
import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

Usage:

```tsx
const debouncedSearch = useDebounce(search, 400);

useEffect(() => {
  if (!debouncedSearch) return;

  searchProducts(debouncedSearch);
}, [debouncedSearch]);
```

## Real Project Scenario — usePrevious

```tsx
function usePrevious<T>(value: T) {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
```

## Real Project Scenario — useLocalStorage

```tsx
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    const stored = localStorage.getItem(key);

    return stored
      ? JSON.parse(stored)
      : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

## Interview Q&A

### Q: What makes a good custom hook?

It should encapsulate reusable behavior rather than simply hide arbitrary component code.

### Q: Can custom hooks share state automatically?

No. Calling the same custom hook from two components normally creates separate hook state for each component.

### Q: Can a custom hook call another custom hook?

Yes.

```tsx
function useUserProfile() {
  const auth = useAuth();
  const data = useUserQuery(auth.userId);

  return data;
}
```

---

# 21. Real Project Hook Scenarios

## Scenario 1 — E-commerce Search

### Problem

Typing into a search box causes an expensive product list to re-render.

### Solution

Combine:

```text
useState
useDeferredValue
useMemo
React.memo
```

Example:

```tsx
const [query, setQuery] = useState("");
const deferredQuery = useDeferredValue(query);

const results = useMemo(
  () => searchProducts(products, deferredQuery),
  [products, deferredQuery]
);
```

---

## Scenario 2 — Login Form

Use:

```text
useState / useReducer
useActionState
useFormStatus
```

For a modern React form:

```tsx
const [state, action, pending] =
  useActionState(loginAction, initialState);
```

Then a child submit button can use:

```tsx
const { pending } = useFormStatus();
```

---

## Scenario 3 — Authentication Context

Use:

```text
useContext
useReducer
useMemo
useCallback
```

Architecture:

```text
AuthProvider
   |
   +-- state
   +-- dispatch
   +-- login()
   +-- logout()
   |
   +-- useAuth()
```

---

## Scenario 4 — Shopping Cart

Use:

```text
useReducer
useContext
useMemo
```

Example actions:

```tsx
dispatch({
  type: "ADD_ITEM",
  product,
});

dispatch({
  type: "REMOVE_ITEM",
  productId,
});

dispatch({
  type: "UPDATE_QUANTITY",
  productId,
  quantity: 3,
});
```

---

## Scenario 5 — WebSocket Notifications

Use:

```text
useEffect
useRef
useReducer
```

```tsx
const socketRef = useRef<WebSocket | null>(null);

useEffect(() => {
  const socket = new WebSocket(url);
  socketRef.current = socket;

  socket.onmessage = event => {
    dispatch({
      type: "MESSAGE_RECEIVED",
      payload: JSON.parse(event.data),
    });
  };

  return () => {
    socket.close();
    socketRef.current = null;
  };
}, [url]);
```

---

## Scenario 6 — Modal Component

Use:

```text
useRef
useImperativeHandle
```

Expose:

```tsx
modalRef.current?.open();
modalRef.current?.close();
```

Only expose the operations the parent needs.

---

## Scenario 7 — Analytics Tracking

Use:

```text
useEffect
```

```tsx
useEffect(() => {
  analytics.track("ProductViewed", {
    productId,
  });
}, [productId]);
```

Do not put analytics side effects inside render.

---

## Scenario 8 — Previous Route / Previous Value

Use:

```text
useRef
useEffect
```

```tsx
const previousRoute = usePrevious(route);

useEffect(() => {
  if (previousRoute !== route) {
    analytics.track("RouteChanged", {
      from: previousRoute,
      to: route,
    });
  }
}, [route, previousRoute]);
```

---

## Scenario 9 — Large Dashboard

Problem:

```text
10 charts
50 filters
large tables
frequent state changes
```

Potential tools:

```text
useMemo
useCallback
useTransition
useDeferredValue
useReducer
```

Do not blindly add all five. Profile first.

---

## Scenario 10 — External Browser State

Examples:

```text
online/offline
media query
browser storage subscription
external state store
```

Use:

```text
useSyncExternalStore
```

instead of manually reinventing subscription logic in every component.

---

## Scenario 11 — Optimistic Todo

```tsx
const [optimisticTodos, addOptimisticTodo] =
  useOptimistic(todos, (current, newTodo) => [
    ...current,
    newTodo,
  ]);
```

Immediately show the todo, then reconcile with server state.

---

## Scenario 12 — SSR Accessible Form

Use:

```text
useId
```

```tsx
const id = useId();

<label htmlFor={id}>Password</label>
<input id={id} />
```

This is safer for SSR/hydration than generating random IDs during render.

---

# 22. Hook Selection Matrix

| Requirement | Recommended API |
|---|---|
| Simple local state | `useState` |
| Complex related state | `useReducer` |
| External side effect | `useEffect` |
| DOM measurement before paint | `useLayoutEffect` |
| CSS-in-JS style injection | `useInsertionEffect` |
| Cache expensive calculation | `useMemo` |
| Stable callback reference | `useCallback` |
| DOM reference | `useRef` |
| Mutable value without render | `useRef` |
| Shared tree state | `useContext` |
| Non-urgent update | `useTransition` |
| Defer received value | `useDeferredValue` |
| Stable SSR ID | `useId` |
| External store subscription | `useSyncExternalStore` |
| Custom imperative API | `useImperativeHandle` |
| Read Promise/Context in render | `use` |
| Optimistic UI | `useOptimistic` |
| Form action state | `useActionState` |
| Parent form status | `useFormStatus` |
| Custom hook DevTools label | `useDebugValue` |
| Reusable behavior | Custom Hook |

The original document's matrix included all of these selection categories, including the two hooks that were missing dedicated sections. fileciteturn0file0L459-L481

---

# 23. Senior Cross Questions

## Q1. Why can't hooks be called conditionally?

React associates hook state with the order in which hooks are called.

Bad:

```tsx
if (loggedIn) {
  useEffect(() => {
    // ...
  }, []);
}
```

Good:

```tsx
useEffect(() => {
  if (!loggedIn) return;

  // ...
}, [loggedIn]);
```

---

## Q2. What is the difference between `useMemo` and `useCallback`?

```text
useMemo     -> caches a value
useCallback -> caches a function reference
```

Conceptually:

```tsx
useCallback(fn, deps)
```

is similar to:

```tsx
useMemo(() => fn, deps)
```

---

## Q3. What is the difference between `useEffect` and `useLayoutEffect`?

```text
useEffect
    -> after paint / non-layout synchronization

useLayoutEffect
    -> before paint / layout-sensitive work
```

Use the least blocking option that solves the problem.

---

## Q4. What is the difference between `useRef` and `useState`?

```text
useState
    -> update causes React render

useRef
    -> mutation does not cause React render
```

---

## Q5. Why is this dependency dangerous?

```tsx
useEffect(() => {
  // ...
}, [{ page, sort }]);
```

Because `{ page, sort }` is a new object on every render.

Prefer:

```tsx
useEffect(() => {
  // ...
}, [page, sort]);
```

---

## Q6. Why can this cause a stale closure?

```tsx
const save = useCallback(() => {
  api.save(user);
}, []);
```

`user` is not in the dependency list.

Better:

```tsx
const save = useCallback(() => {
  api.save(user);
}, [user]);
```

---

## Q7. When should you use `useReducer`?

When state transitions are complex or multiple values change together.

---

## Q8. When should you use context?

When many components need the same relatively stable value.

Examples:

```text
theme
locale
auth
feature configuration
```

---

## Q9. How do you optimize a context provider?

Possible techniques:

```text
split contexts
memoize provider values
memoize callbacks
move rapidly changing state elsewhere
```

---

## Q10. What is tearing?

Tearing is an inconsistent view of external mutable state where different parts of a concurrent render can observe different snapshots.

`useSyncExternalStore` provides a React-compatible subscription/snapshot mechanism.

---

## Q11. What is optimistic UI?

Show the expected successful result immediately, then reconcile with the server.

Examples:

```text
Like
Unlike
Todo completion
Mark read
Add comment
Delete item
```

---

## Q12. What is the difference between transition and debounce?

```text
Debounce
    -> waits before starting work

Transition
    -> tells React the update is non-urgent
```

They can sometimes be used together.

---

## Q13. When should you use `useDeferredValue`?

When a frequently changing value is received by a component and you want the expensive consumer to lag behind the urgent value.

---

## Q14. Can `useId` replace database IDs?

No.

`useId` is for DOM/accessibility IDs, not business identity.

---

## Q15. What is `useDebugValue` for?

Developer tooling for custom hooks.

It should not be used as application state or rendering logic.

---

## Q16. What is `useInsertionEffect` for?

Primarily style injection by libraries such as CSS-in-JS systems.

---

## Q17. Why should reducers be pure?

Predictability, testing, replayability, and reliable state transitions.

Avoid:

```tsx
function reducer(state, action) {
  fetch("/api");
  return state;
}
```

---

## Q18. Why should you not create a Promise during every render with `use()`?

A new Promise can cause React to suspend on a new resource repeatedly.

Cache or otherwise stabilize the async resource.

---

## Q19. Why does `useFormStatus` need to be inside the form?

It reads status from the nearest parent form.

---

## Q20. What is a custom hook?

A function beginning with `use` that composes hooks to package reusable stateful behavior.

---

# 24. Production Mistakes

## Mistake 1 — Using `useEffect` for derived state

Bad:

```tsx
useEffect(() => {
  setTotal(price * quantity);
}, [price, quantity]);
```

Better:

```tsx
const total = price * quantity;
```

---

## Mistake 2 — Missing effect cleanup

Bad:

```tsx
useEffect(() => {
  window.addEventListener("resize", handleResize);
}, []);
```

Better:

```tsx
useEffect(() => {
  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, []);
```

---

## Mistake 3 — Unnecessary `useMemo`

Do not write:

```tsx
const result = useMemo(() => a + b, [a, b]);
```

unless there is a meaningful performance reason.

---

## Mistake 4 — Unnecessary `useCallback`

Not every function needs memoization.

Use it when referential stability provides a measurable or architectural benefit.

---

## Mistake 5 — Using refs for UI state

Bad:

```tsx
const loading = useRef(false);
```

If the UI must react to `loading`, use state.

---

## Mistake 6 — Huge context provider

Putting the entire application state into one context can make updates expensive and difficult to reason about.

Split by responsibility when necessary.

---

## Mistake 7 — API request directly in render

Never:

```tsx
function Component() {
  fetch("/api/users");

  return <div />;
}
```

Render should remain free of uncontrolled side effects.

---

## Mistake 8 — Missing request cancellation

For rapidly changing requests, use cancellation or request identity checks.

```tsx
const controller = new AbortController();

fetch(url, {
  signal: controller.signal,
});
```

---

## Mistake 9 — Ignoring SSR

Browser-only objects:

```tsx
window
document
localStorage
navigator
```

must be handled appropriately in SSR applications.

---

## Mistake 10 — Using `useId` for keys

Bad:

```tsx
items.map(item => (
  <Row key={useId()} />
));
```

Use:

```tsx
items.map(item => (
  <Row key={item.id} />
));
```

---

# 25. Quick Interview Revision

## State

```text
useState
useReducer
```

## Side Effects

```text
useEffect
useLayoutEffect
useInsertionEffect
```

## Performance

```text
useMemo
useCallback
useTransition
useDeferredValue
```

## References / Imperative APIs

```text
useRef
useImperativeHandle
```

## Shared / External State

```text
useContext
useSyncExternalStore
```

## React 19

```text
use
useOptimistic
useActionState
useFormStatus
```

## Developer Tooling

```text
useDebugValue
```

## Accessibility / SSR

```text
useId
```

## Reusable Architecture

```text
Custom Hooks
```

---

# Final Senior-Level Rule

Do not answer a senior React interview question only with:

> "I know the syntax."

A stronger answer follows this structure:

```text
1. What problem does the hook solve?
2. When should I use it?
3. When should I NOT use it?
4. What are the performance implications?
5. What happens during re-render?
6. What happens during unmount/cleanup?
7. What happens with SSR/hydration?
8. What production bug can it prevent?
9. Show a real project example.
10. Explain an alternative and why you chose this hook.
```

For example:

> "I would use `useDeferredValue` when I don't own the state update but need an expensive child to consume a lagging version of the value. If I own the state setter, I would consider `useTransition` instead. For a search page, I would combine the deferred value with memoized filtering and profiling rather than blindly adding memoization."

That style demonstrates **architecture + React internals + production judgment**, rather than syntax memorization.
