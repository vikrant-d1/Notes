# React Portals — Functional Component Examples

## What Are Portals?

Portals let you render a child component into a DOM node that exists **outside** the parent component's DOM hierarchy. This is useful when a parent has `overflow: hidden` or a restrictive `z-index`, but you need a child (like a modal) to visually "break out."

```jsx
import { createPortal } from 'react-dom';

createPortal(child, domNode);
```

---

## Setup

Add a second root element in your `index.html`:

```html
<body>
  <div id="root"></div>
  <div id="portal-root"></div>
</body>
```

---

## Example 1 — Basic Portal

```jsx
import { createPortal } from 'react-dom';

function MyPortal({ children }) {
  return createPortal(
    children,
    document.getElementById('portal-root')
  );
}

function App() {
  return (
    <div>
      <h1>My App</h1>
      <MyPortal>
        <p>This is rendered inside #portal-root, not #root!</p>
      </MyPortal>
    </div>
  );
}
```

---

## Example 2 — Modal Using a Portal

```jsx
import { useState } from 'react';
import { createPortal } from 'react-dom';

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return createPortal(
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>,
    document.getElementById('portal-root')
  );
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalStyle = {
  background: '#fff',
  padding: '2rem',
  borderRadius: '8px',
  minWidth: '300px',
};

function App() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div style={{ overflow: 'hidden', height: '200px' }}>
      <h1>App with overflow: hidden</h1>
      <button onClick={() => setShowModal(true)}>Open Modal</button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <h2>I broke out!</h2>
        <p>This modal renders outside the overflow-hidden parent.</p>
      </Modal>
    </div>
  );
}
```

---

## Example 3 — Tooltip Using a Portal

```jsx
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

function Tooltip({ targetRef, children }) {
  if (!targetRef.current) return null;

  const rect = targetRef.current.getBoundingClientRect();

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: rect.bottom + 8,
        left: rect.left,
        background: '#333',
        color: '#fff',
        padding: '6px 12px',
        borderRadius: '4px',
        fontSize: '14px',
      }}
    >
      {children}
    </div>,
    document.getElementById('portal-root')
  );
}

function App() {
  const [hovered, setHovered] = useState(false);
  const btnRef = useRef(null);

  return (
    <div>
      <button
        ref={btnRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        Hover me
      </button>

      {hovered && (
        <Tooltip targetRef={btnRef}>
          I'm a tooltip rendered via a portal!
        </Tooltip>
      )}
    </div>
  );
}
```

---

## Key Points

- **Event bubbling still works** — even though the portal DOM node lives elsewhere, React events bubble up through the React tree as usual.
- **Common use cases** — modals, tooltips, toasts/notifications, dropdown menus, and any UI that needs to escape `overflow: hidden` or `z-index` stacking contexts.
- **Modern import** — use `createPortal` from `react-dom`, not `ReactDOM.createPortal`.


# React Hooks 


---

## 1. useState

### Definition

`useState` is the fundamental state-management hook. It returns a stateful value and a setter function. On re-render, React preserves state identity as long as the component occupies the same position in the fiber tree.

### Signature

```ts
const [state, setState] = useState<T>(initialValue: T | (() => T));
```

### Key Internals (Interview Depth)

- State is stored on the **fiber node** in a linked-list of hooks (each call maps to a slot by call order — this is why hooks must not be called conditionally).
- `setState` enqueues an update object; React batches these by default in React 18+ (automatic batching across promises, timeouts, and native event handlers).
- If you pass the **same reference** (Object.is comparison), React bails out of the re-render.

### Example — Lazy Initializer & Functional Update

```tsx
function SearchFilter() {
  // Lazy initializer: runs ONLY on mount, not on every render
  const [filters, setFilters] = useState(() => {
    const saved = sessionStorage.getItem("filters");
    return saved ? JSON.parse(saved) : { query: "", category: "all" };
  });

  const updateQuery = (query: string) => {
    // Functional update — safe in concurrent mode, avoids stale closures
    setFilters((prev) => ({ ...prev, query }));
  };

  return <input value={filters.query} onChange={(e) => updateQuery(e.target.value)} />;
}
```

### Common Interview Gotchas

- **Stale closure**: Using `state` directly inside `setTimeout`/`setInterval` captures the value at render time. Use the functional updater `setState(prev => ...)` instead.
- **Object identity**: `setState({ ...obj })` always triggers re-render even if values are the same because a new reference is created.
- **Batching pre-React 18**: In legacy React, state updates inside `setTimeout` or native event listeners were NOT batched.

---

## 2. useEffect

### Definition

`useEffect` synchronizes a component with an external system (API calls, subscriptions, DOM manipulation, timers). It runs **after paint** (deferred), making it non-blocking for the browser's rendering pipeline.

### Signature

```ts
useEffect(setup: () => (void | (() => void)), dependencies?: any[]);
```

### Execution Model

| Dependency Array      | Behavior                                        |
|-----------------------|-------------------------------------------------|
| Omitted               | Runs after **every** render                     |
| `[]`                  | Runs once on mount; cleanup on unmount          |
| `[a, b]`             | Runs when `a` or `b` change (Object.is check)  |

### Example — Race Condition Handling with Cleanup

```tsx
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false; // cleanup flag to prevent setting state on stale request
    const controller = new AbortController();

    async function fetchUser() {
      try {
        const res = await fetch(`/api/users/${userId}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (!cancelled) setUser(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(err);
      }
    }

    fetchUser();

    return () => {
      cancelled = true;
      controller.abort(); // cancel in-flight request
    };
  }, [userId]);

  return user ? <h1>{user.name}</h1> : <p>Loading…</p>;
}
```

### Senior-Level Interview Points

- **useEffect is NOT `componentDidMount`**: It fires after paint, not before. For layout-critical work, use `useLayoutEffect`.
- **Strict Mode double-invocation**: In development, React 18 intentionally mounts → unmounts → remounts to surface missing cleanups. Your effect should be resilient to this.
- **Object/array deps**: Putting an object literal in deps causes infinite loops because a new reference is created every render. Destructure primitives or memoize.
- **Data fetching**: In production codebases, prefer a dedicated solution (React Query, SWR, or React's `use()` with Suspense) over raw `useEffect` for data fetching.

---

## 3. useLayoutEffect

### Definition

Identical API to `useEffect`, but fires **synchronously after DOM mutations and before the browser paints**. Use it when you need to read layout (dimensions, scroll positions) or make DOM changes that must be visible on the first frame (avoiding flicker).

### Signature

```ts
useLayoutEffect(setup: () => (void | (() => void)), dependencies?: any[]);
```

### Example — Positioning Without Flicker

```tsx
import React, { useLayoutEffect, useRef, useState } from "react";

export default function App() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!buttonRef.current || !boxRef.current) return;

    const btn = buttonRef.current.getBoundingClientRect();
    const box = boxRef.current.getBoundingClientRect();

    setCoords({
      top: btn.top - box.height - 10,
      left: btn.left + (btn.width - box.width) / 2,
    });
  }, []);

  return (
    <div style={{ padding: "100px" }}>
      <button ref={buttonRef}>Click Me</button>

      <div
        ref={boxRef}
        style={{
          position: "fixed",
          top: coords.top,
          left: coords.left,
          background: "blue",
          color: "white",
          padding: "10px",
        }}
      >
        Simple Box
      </div>
    </div>
  );
}
```

### When to Choose `useLayoutEffect` Over `useEffect`

| Scenario                                      | Hook              |
|-----------------------------------------------|-------------------|
| Measuring DOM elements for positioning        | `useLayoutEffect` |
| Preventing visual flicker on DOM mutation     | `useLayoutEffect` |
| Data fetching, subscriptions, logging         | `useEffect`       |
| Animating based on layout measurements        | `useLayoutEffect` |

### Gotcha

- `useLayoutEffect` blocks painting. Heavy computation here causes visible jank.
- On SSR, `useLayoutEffect` fires a warning because there is no DOM. Use `useEffect` or a conditional wrapper for SSR-safe code.

---

## 4. useMemo

### Definition

`useMemo` caches the **result** of an expensive computation between re-renders. React recomputes the value only when one of its dependencies changes.

### Signature

```ts
const memoizedValue = useMemo<T>(() => computeExpensiveValue(a, b), [a, b]);
```

### Example 

```tsx

export default function App() {
  const [numbers] = useState([1, 2, 3, 4, 5]);
  const [multiplier, setMultiplier] = useState(1);

  // Expensive calculation (simulated)
  const total = useMemo(() => {
    console.log("Calculating...");
    return numbers.reduce((sum, n) => sum + n * multiplier, 0);
  }, [numbers, multiplier]);

  return (
    <div style={{ padding: "40px" }}>
      <h2>Total: {total}</h2>

      <button onClick={() => setMultiplier(multiplier + 1)}>
        Increase Multiplier
      </button>
    </div>
  );
}
```

### Senior-Level Points

- **useMemo is a performance hint, not a guarantee**: React may discard cached values under memory pressure (React docs explicitly state this). Your code must work correctly without it.
- **Don't memoize everything**: Memoization has overhead (storing the previous value, comparing deps). For cheap computations, the overhead can exceed the savings.
- **Referential stability**: The primary use case at senior level is keeping object/array references stable to prevent unnecessary re-renders in child components wrapped in `React.memo`.
- **React Compiler (React 19+)**: The React Compiler (formerly React Forget) auto-memoizes, potentially making manual `useMemo` calls unnecessary in the future.

---

## 5. useRef

### Definition

`useRef` returns a mutable ref object (`{ current: T }`) that persists for the full lifetime of the component. Changing `.current` does **not** trigger a re-render. It serves two purposes: holding a reference to a DOM node and storing any mutable value that should survive re-renders without causing them.

### Signature

```ts
const ref = useRef<T>(initialValue: T);
```

### Example 1 — Imperative DOM Access

```tsx
function AutoFocusInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} placeholder="Focused on mount" />;
}
```

### Example 2 — Storing Previous Value (Instance Variable Pattern)

```tsx
function PriceTracker({ price }: { price: number }) {
  const prevPriceRef = useRef(price);

  useEffect(() => {
    prevPriceRef.current = price;
  }); // intentionally no deps — runs after every render

  const diff = price - prevPriceRef.current;

  return (
    <span>
      ${price} {diff > 0 ? "▲" : diff < 0 ? "▼" : "—"}
    </span>
  );
}
```

### Example 3 — Stable Callback Ref (for dynamic elements)

```tsx
function MeasuredList({ items }: { items: string[] }) {
  const [heights, setHeights] = useState<Record<string, number>>({});

  // Callback ref: called when element mounts/unmounts
  const measureRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setHeights((prev) => ({
        ...prev,
        [node.dataset.id!]: node.getBoundingClientRect().height,
      }));
    }
  }, []);

  return items.map((item) => (
    <div key={item} ref={measureRef} data-id={item}>
      {item}
    </div>
  ));
}
```

### Senior-Level Points

- **`useRef` vs `useState`**: Use `useRef` when you need a mutable container that doesn't trigger re-renders (timers, previous values, WebSocket instances, animation frame IDs).
- **Ref as instance variable**: `useRef` is the functional component equivalent of `this.instanceVar` in class components.
- **Callback refs**: For cases where you need to be notified when a ref attaches/detaches (dynamic lists, conditional rendering), use a callback ref instead of `useRef`.

---

## 6. useImperativeHandle

### Definition

`useImperativeHandle` customizes the instance value exposed to parent components when using `React.forwardRef`. It restricts the API surface of a ref, exposing only specific imperative methods instead of the entire DOM node.

### Signature

```ts
useImperativeHandle(ref, createHandle, dependencies?);
```

### Example — Exposing a Controlled API from a Complex Component

```tsx
interface ModalHandle {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
}

const Modal = forwardRef<ModalHandle, { children: ReactNode }>((props, ref) => {
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      open() {
        setVisible(true);
        dialogRef.current?.showModal();
      },
      close() {
        dialogRef.current?.close();
        setVisible(false);
      },
      isOpen: () => visible,
    }),
    [visible]
  );

  return (
    <dialog ref={dialogRef}>
      {props.children}
      <button onClick={() => ref && "current" in ref && ref.current?.close()}>
        Close
      </button>
    </dialog>
  );
});

// Parent usage:
function App() {
  const modalRef = useRef<ModalHandle>(null);
  return (
    <>
      <button onClick={() => modalRef.current?.open()}>Open</button>
      <Modal ref={modalRef}>
        <p>Modal content</p>
      </Modal>
    </>
  );
}
```

### Senior-Level Points

- **Principle of least privilege**: Expose the minimum imperative API. Avoid leaking the raw DOM node.
- **React 19 change**: `forwardRef` is no longer required. Refs can be passed as a regular prop, and `useImperativeHandle` works with the ref prop directly.
- **Use sparingly**: Imperative handles are an escape hatch. Prefer declarative props/state whenever possible.

---

## 7. useTransition

### Definition

`useTransition` lets you mark a state update as **non-urgent** (a "transition"), allowing React to keep the UI responsive by interrupting the transition render if a more urgent update (like typing) arrives. Part of React 18's concurrent rendering model.

### Signature

```ts
const [isPending, startTransition] = useTransition();
```

### Example — Keeping Input Responsive During Heavy Filtering

```tsx
function ProductSearch({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value); // urgent: update input immediately

    startTransition(() => {
      // non-urgent: can be interrupted, won't block the input
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(value.toLowerCase()) ||
          p.tags.some((t) => t.includes(value))
      );
      setFilteredProducts(filtered);
    });
  };

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <ProductList products={filteredProducts} />
    </div>
  );
}
```

### Senior-Level Points

- **Not the same as debouncing**: Debounce delays execution. `startTransition` runs immediately but at a lower priority — React may interrupt and restart it.
- **Works with Suspense**: Transitions keep showing the current UI (instead of a fallback) while the new content loads.
- **`isPending`**: Use it to show a loading indicator without hiding the current content.
- **Cannot wrap async code directly**: The callback passed to `startTransition` must be synchronous. The state update inside it is what gets marked as a transition.

---

## 8. useDeferredValue

### Definition

`useDeferredValue` accepts a value and returns a "deferred" copy of it that lags behind during urgent updates. It tells React: "it's okay if this value is stale for a moment while you handle more urgent work." It is the value-level counterpart to `useTransition`.

### Signature

```ts
const deferredValue = useDeferredValue(value: T);
```

### Example — Deferred Search Results with Visual Feedback

```tsx
function SearchResults({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  const results = useMemo(
    () => heavySearchComputation(deferredQuery),
    [deferredQuery]
  );

  return (
    <div style={{ opacity: isStale ? 0.6 : 1, transition: "opacity 0.2s" }}>
      {results.map((r) => (
        <ResultCard key={r.id} data={r} />
      ))}
    </div>
  );
}
```

### `useTransition` vs `useDeferredValue`

| Aspect               | `useTransition`                              | `useDeferredValue`                        |
|-----------------------|----------------------------------------------|-------------------------------------------|
| Controls              | The **state update** itself                  | A **derived value**                       |
| You need              | Access to the `setState` call                | Just the value (can't control the setter) |
| Use when              | You own the state update                     | You receive a prop that changes often     |

---

## 9. useId

### Definition

`useId` generates a unique, stable, SSR-safe identifier string. It guarantees that the same ID is produced on both server and client, avoiding hydration mismatches.

### Signature

```ts
const id = useId();
```

### Example — Accessible Form with Matching Labels

```tsx
function FormField({ label, type = "text" }: { label: string; type?: string }) {
  const id = useId();
  const errorId = `${id}-error`;

  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={!!error}
      />
      {error && (
        <span id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
```

### Senior-Level Points

- **Not for list keys**: `useId` is for DOM id attributes, not for `key` props.
- **SSR hydration safe**: Unlike `Math.random()` or incrementing counters, `useId` produces deterministic IDs that match between server and client.
- **Multiple IDs**: Call `useId()` once and derive multiple related IDs by appending suffixes (e.g., `${id}-label`, `${id}-error`).

---

## 10. useSyncExternalStore

### Definition

`useSyncExternalStore` subscribes a component to an **external store** (anything outside React's state model — browser APIs, third-party state managers, global variables). It guarantees consistency even during concurrent rendering by forcing synchronous reads.

### Signature

```ts
const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?);
```

### Example — Online Status Hook

```tsx
function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    // subscribe: register listener, return unsubscribe
    (callback) => {
      window.addEventListener("online", callback);
      window.addEventListener("offline", callback);
      return () => {
        window.removeEventListener("online", callback);
        window.removeEventListener("offline", callback);
      };
    },
    // getSnapshot: returns current value (must return same ref if unchanged)
    () => navigator.onLine,
    // getServerSnapshot: SSR fallback
    () => true
  );
}

function StatusBanner() {
  const isOnline = useOnlineStatus();
  return isOnline ? null : <div className="offline-banner">You are offline</div>;
}
```

### Example — Subscribing to a Redux-like Store

```tsx
const store = createStore(rootReducer);

function useStoreSelector<T>(selector: (state: RootState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState())
  );
}

function CartCount() {
  const count = useStoreSelector((s) => s.cart.items.length);
  return <span>Cart ({count})</span>;
}
```

### Senior-Level Points

- **Tearing prevention**: In concurrent mode, React may render parts of a tree at different times. Without `useSyncExternalStore`, reading from an external mutable source can lead to "tearing" — different components seeing different snapshots of the same store.
- **`getSnapshot` must return a cached value**: If it returns a new object every time, the component will re-render infinitely. Use referential equality.
- **Replaced `useSubscription`**: This hook supersedes the old `use-subscription` package and the legacy `store.subscribe` pattern.
- **Library authors**: This is the recommended hook for state library authors (Zustand, Jotai, Redux) to integrate with concurrent features.

---

## 11. useDebugValue

### Definition

`useDebugValue` displays a label in React DevTools next to a custom hook. It is a **development-only** hook with zero runtime cost in production.

### Signature

```ts
useDebugValue(value: any, format?: (value: any) => any);
```

### Example — Custom Hook with DevTools Label

```tsx
function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  // Shown in DevTools: "Auth: john@example.com" or "Auth: Not logged in"
  useDebugValue(user, (u) => (u ? `Auth: ${u.email}` : "Auth: Not logged in"));

  const login = async (credentials: Credentials) => { /* ... */ };
  const logout = async () => { /* ... */ };

  return { user, login, logout };
}
```

### Senior-Level Points

- **Lazy formatting**: The second argument (formatter) is called only when DevTools is inspecting the hook, avoiding unnecessary computation in production.
- **Only inside custom hooks**: Using `useDebugValue` inside a regular component does nothing.
- **Don't overuse**: Only add it to shared/reusable custom hooks in libraries or design systems. Not needed for one-off hooks.

---

## 12. useInsertionEffect (React 18+)

### Definition

`useInsertionEffect` fires **synchronously before any DOM mutations**. It is designed exclusively for **CSS-in-JS libraries** to inject `<style>` tags at the right time — before `useLayoutEffect` reads layout.

### Signature

```ts
useInsertionEffect(setup: () => (void | (() => void)), dependencies?);
```

### Execution Order

```
useInsertionEffect  →  DOM mutations  →  useLayoutEffect  →  browser paint  →  useEffect
```

### Example — CSS-in-JS Style Injection

```tsx
// This is how a CSS-in-JS library might use it internally
let styleSheet: CSSStyleSheet | null = null;

function useCSS(rule: string): string {
  const className = useMemo(() => `css-${hashString(rule)}`, [rule]);

  useInsertionEffect(() => {
    if (!styleSheet) {
      const style = document.createElement("style");
      document.head.appendChild(style);
      styleSheet = style.sheet!;
    }
    const index = styleSheet.insertRule(`.${className} { ${rule} }`);
    return () => styleSheet?.deleteRule(index);
  }, [rule, className]);

  return className;
}

// Usage in a component:
function StyledBox() {
  const className = useCSS("background: coral; padding: 16px; border-radius: 8px;");
  return <div className={className}>Styled!</div>;
}
```

### Senior-Level Points

- **Not for application code**: This hook is for library authors building CSS-in-JS solutions (Styled Components, Emotion, etc.). Application developers should never need it.
- **No access to refs**: Since it fires before DOM mutations, refs are not yet attached.
- **Cannot update state**: Calling `setState` inside `useInsertionEffect` is not supported.

---

## 13. use (React 19+)

### Definition

`use` is a new React API (not technically a hook — it can be called conditionally) that lets you read the value of a **Promise** or a **Context** directly during render. When given a Promise, it integrates with Suspense to handle the loading state.

### Signature

```ts
const value = use(resource: Promise<T> | Context<T>);
```

### Example — Reading a Promise with Suspense

```tsx
// The promise must be created OUTSIDE the component (or cached)
async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // suspends until resolved

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

// Parent wraps in Suspense
function App() {
  const [userId, setUserId] = useState("1");
  const userPromise = useMemo(() => fetchUser(userId), [userId]);

  return (
    <Suspense fallback={<Spinner />}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

### Example — Conditional Context Reading

```tsx
function StatusMessage({ isAdmin }: { isAdmin: boolean }) {
  // Unlike useContext, `use` CAN be called conditionally
  if (isAdmin) {
    const adminData = use(AdminContext);
    return <p>Admin panel: {adminData.stats}</p>;
  }
  return <p>Welcome, user</p>;
}
```

### Senior-Level Points

- **Not a hook**: `use` breaks the rules-of-hooks intentionally — it can be called inside conditionals and loops.
- **Promise caching is critical**: If you pass a new Promise on every render, the component will suspend infinitely. The Promise must be cached or created outside the render path.
- **Replaces `useContext` for context**: `use(SomeContext)` is the modern replacement for `useContext(SomeContext)`, with the added benefit of conditional calling.
- **Error handling**: Use an Error Boundary above the Suspense boundary to catch rejected promises.

---

## 14. useActionState (React 19+)

### Definition

`useActionState` (formerly `useFormState`) manages form action state and pending status. It's designed for the new React form actions pattern and works with both client and server actions.

### Signature

```ts
const [state, formAction, isPending] = useActionState(action, initialState, permalink?);
```

### Example — Form with Server Action Handling

```tsx
async function submitFeedback(
  prevState: { message: string; success: boolean },
  formData: FormData
) {
  const text = formData.get("feedback") as string;

  if (text.length < 10) {
    return { message: "Feedback must be at least 10 characters.", success: false };
  }

  await saveFeedback(text); // server call
  return { message: "Thank you for your feedback!", success: true };
}

function FeedbackForm() {
  const [state, action, isPending] = useActionState(submitFeedback, {
    message: "",
    success: false,
  });

  return (
    <form action={action}>
      <textarea name="feedback" required disabled={isPending} />
      <button type="submit" disabled={isPending}>
        {isPending ? "Submitting…" : "Submit"}
      </button>
      {state.message && (
        <p style={{ color: state.success ? "green" : "red" }}>{state.message}</p>
      )}
    </form>
  );
}
```

### Senior-Level Points

- **Progressive enhancement**: When used with server actions and a `permalink`, the form works even before JavaScript loads.
- **Replaces manual `isPending` + `useEffect` + `useState`**: Consolidates the common form submission pattern into a single hook.
- **Renamed from `useFormState`**: Was renamed in React 19 RC to better reflect its broader applicability beyond forms.

---

## 15. useOptimistic (React 19+)

### Definition

`useOptimistic` provides a way to optimistically update the UI while an async action is in progress. The optimistic value automatically reverts to the actual value when the action completes.

### Signature

```ts
const [optimisticValue, addOptimistic] = useOptimistic(actualValue, updateFn?);
```

### Example — Optimistic Like Button

```tsx
function LikeButton({ postId, likes, hasLiked }: Props) {
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    { count: likes, liked: hasLiked },
    (current, newLiked: boolean) => ({
      count: newLiked ? current.count + 1 : current.count - 1,
      liked: newLiked,
    })
  );

  async function toggleLike() {
    const newLiked = !optimisticLikes.liked;
    addOptimisticLike(newLiked); // instant UI update

    // If this fails, React reverts to the real `likes` and `hasLiked` props
    await fetch(`/api/posts/${postId}/like`, {
      method: newLiked ? "POST" : "DELETE",
    });
  }

  return (
    <button onClick={toggleLike}>
      {optimisticLikes.liked ? "❤️" : "🤍"} {optimisticLikes.count}
    </button>
  );
}
```

### Senior-Level Points

- **Automatic rollback**: If the parent re-renders with the same actual value (indicating failure), the optimistic state reverts automatically.
- **Works with transitions and form actions**: Designed to integrate with `startTransition` and `useActionState`.
- **Replaces manual optimistic patterns**: No more manual try/catch/rollback state management.

---

## 16. useFormStatus (React 19+ / react-dom)

### Definition

`useFormStatus` gives a child component information about the parent `<form>`'s submission status. It must be called from a component rendered **inside** a `<form>`.

### Signature

```ts
const { pending, data, method, action } = useFormStatus();
```

### Example — Reusable Submit Button

```tsx
import { useFormStatus } from "react-dom";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Submitting…" : children}
    </button>
  );
}

// Usage inside a form
function ContactForm() {
  return (
    <form action={submitContactAction}>
      <input name="email" type="email" required />
      <textarea name="message" required />
      <SubmitButton>Send Message</SubmitButton> {/* Reads form status */}
    </form>
  );
}
```

### Senior-Level Points

- **Must be a child of `<form>`**: Calling it in the same component that renders the `<form>` won't work — it reads from the nearest parent form.
- **`data` property**: Gives access to the `FormData` being submitted, enabling contextual loading states.
- **Part of `react-dom`**, not `react`: Import from `react-dom` since it's tied to DOM form behavior.

---



# useContext

## Definition

`useContext` is a React hook that lets you **read and consume values from a Context** without wrapping components in a `Consumer`. It solves the **prop drilling** problem — where you pass data through many intermediate components that don't actually need it — by providing a way to share values globally across a component tree.

### Syntax

```jsx
const value = useContext(SomeContext);
```

| Parameter     | Description                                                        |
| ------------- | ------------------------------------------------------------------ |
| `SomeContext` | The context object created with `React.createContext(defaultValue)` |

**Returns:** The current context value, determined by the nearest `<SomeContext.Provider>` above the calling component in the tree.

---

## How It Works

1. **Create** a context with `createContext()`.
2. **Provide** a value by wrapping a part of the tree with `<Context.Provider value={...}>`.
3. **Consume** the value in any descendant component using `useContext(Context)`.

```
App (Provider)
 ├── Header
 │    └── UserGreeting  ← useContext(UserContext) ✅
 ├── Sidebar
 │    └── UserAvatar    ← useContext(UserContext) ✅
 └── Footer
```

No props passed through `Header` or `Sidebar` — descendants access the value directly.

---

## useContext Code Examples

### 1. Basic Usage — Theme Toggle

```jsx
import { createContext, useContext, useState } from "react";

// Step 1: Create a Context
const ThemeContext = createContext("light");

// Step 2: Consumer Component
function ThemedButton() {
  const theme = useContext(ThemeContext);

  const styles = {
    backgroundColor: theme === "dark" ? "#333" : "#fff",
    color: theme === "dark" ? "#fff" : "#333",
    padding: "10px 20px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
  };

  return <button style={styles}>I am {theme} themed</button>;
}

// Step 3: Provider in Parent
function App() {
  const [theme, setTheme] = useState("light");

  return (
    <ThemeContext.Provider value={theme}>
      <ThemedButton />
      <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
        Toggle Theme
      </button>
    </ThemeContext.Provider>
  );
}
```

`ThemedButton` reads the current theme **without receiving it as a prop**.

---

### 2. Sharing User Authentication State

```jsx
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

// Custom hook for cleaner access
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (username) => setUser({ name: username });
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Consumer Components
function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav>
      {user ? (
        <span>
          Welcome, {user.name}! <button onClick={logout}>Logout</button>
        </span>
      ) : (
        <span>Please log in.</span>
      )}
    </nav>
  );
}

function LoginPage() {
  const { login } = useAuth();

  return <button onClick={() => login("Alice")}>Login as Alice</button>;
}

// App
function App() {
  return (
    <AuthProvider>
      <Navbar />
      <LoginPage />
    </AuthProvider>
  );
}
```

Any component inside `<AuthProvider>` can call `useAuth()` to access or modify the authentication state.

---

### 3. Multi-Language / i18n Support

```jsx
import { createContext, useContext, useState } from "react";

const translations = {
  en: { greeting: "Hello", farewell: "Goodbye" },
  es: { greeting: "Hola", farewell: "Adiós" },
  fr: { greeting: "Bonjour", farewell: "Au revoir" },
};

const LanguageContext = createContext();

function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

function Greeting() {
  const { t } = useContext(LanguageContext);
  return <h1>{t.greeting}!</h1>;
}

function LanguageSwitcher() {
  const { lang, setLang } = useContext(LanguageContext);

  return (
    <select value={lang} onChange={(e) => setLang(e.target.value)}>
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="fr">Français</option>
    </select>
  );
}

function App() {
  return (
    <LanguageProvider>
      <LanguageSwitcher />
      <Greeting />
    </LanguageProvider>
  );
}
```

---

### When NOT to Use `useContext`

- **Frequently changing values** (e.g., mouse position, scroll offset) — every consumer re-renders on every change.
- **Data needed by only 1–2 components** — regular props are simpler.
- **Complex state logic** — pair `useContext` with `useReducer` instead of stuffing logic into the provider (see the combined example below).

---

---

# useReducer

## Definition

`useReducer` is a React hook for managing **complex state logic**. It works like `useState` but uses a **reducer function** — a pure function that takes the current state and an action, then returns a new state. It is inspired by the Redux pattern and is ideal when the next state depends on the previous one, or when multiple related state values need to update together.

### Syntax

```jsx
const [state, dispatch] = useReducer(reducer, initialState, init?);
```

| Parameter      | Description                                                              |
| -------------- | ------------------------------------------------------------------------ |
| `reducer`      | A function `(state, action) => newState` that computes the next state.   |
| `initialState` | The starting value of the state.                                         |
| `init`         | *(Optional)* A lazy initializer function: `(initialState) => computed`.  |

**Returns:** `[state, dispatch]` — the current state and a function to send actions to the reducer.

---

## How It Works

```
Component dispatches an action
        │
        ▼
┌──────────────────────┐
│   reducer(state, action)   │
│   → returns new state      │
└──────────────────────┘
        │
        ▼
Component re-renders with new state
```

An **action** is typically an object with a `type` property (and optional payload):

```jsx
dispatch({ type: "INCREMENT" });
dispatch({ type: "ADD_TODO", payload: { text: "Learn hooks" } });
```

---

## useReducer Code Examples

### 1. Basic Counter

```jsx
import { useReducer } from "react";

const initialState = { count: 0 };

function reducer(state, action) {
  switch (action.type) {
    case "INCREMENT":
      return { count: state.count + 1 };
    case "DECREMENT":
      return { count: state.count - 1 };
    case "RESET":
      return initialState;
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div>
      <h2>Count: {state.count}</h2>
      <button onClick={() => dispatch({ type: "INCREMENT" })}>+</button>
      <button onClick={() => dispatch({ type: "DECREMENT" })}>−</button>
      <button onClick={() => dispatch({ type: "RESET" })}>Reset</button>
    </div>
  );
}
```

---

### 2. Todo List

```jsx
import { useReducer, useState } from "react";

const initialTodos = [];

function todoReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return [
        ...state,
        { id: Date.now(), text: action.payload, completed: false },
      ];
    case "TOGGLE":
      return state.map((todo) =>
        todo.id === action.payload
          ? { ...todo, completed: !todo.completed }
          : todo
      );
    case "DELETE":
      return state.filter((todo) => todo.id !== action.payload);
    case "CLEAR_COMPLETED":
      return state.filter((todo) => !todo.completed);
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

function TodoApp() {
  const [todos, dispatch] = useReducer(todoReducer, initialTodos);
  const [text, setText] = useState("");

  const handleAdd = () => {
    if (text.trim()) {
      dispatch({ type: "ADD", payload: text.trim() });
      setText("");
    }
  };

  return (
    <div>
      <h2>Todo List ({todos.filter((t) => !t.completed).length} remaining)</h2>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        placeholder="Add a todo..."
      />
      <button onClick={handleAdd}>Add</button>

      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <span
              onClick={() => dispatch({ type: "TOGGLE", payload: todo.id })}
              style={{
                textDecoration: todo.completed ? "line-through" : "none",
                cursor: "pointer",
              }}
            >
              {todo.text}
            </span>
            <button
              onClick={() => dispatch({ type: "DELETE", payload: todo.id })}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <button onClick={() => dispatch({ type: "CLEAR_COMPLETED" })}>
        Clear Completed
      </button>
    </div>
  );
}
```

---

### 3. Form with Multiple Fields

```jsx
import { useReducer } from "react";

const initialForm = {
  name: "",
  email: "",
  age: "",
  errors: {},
};

function formReducer(state, action) {
  switch (action.type) {
    case "UPDATE_FIELD":
      return {
        ...state,
        [action.field]: action.value,
        errors: { ...state.errors, [action.field]: "" },
      };
    case "SET_ERRORS":
      return { ...state, errors: action.payload };
    case "RESET":
      return initialForm;
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

function RegistrationForm() {
  const [state, dispatch] = useReducer(formReducer, initialForm);

  const validate = () => {
    const errors = {};
    if (!state.name) errors.name = "Name is required";
    if (!state.email.includes("@")) errors.email = "Invalid email";
    if (Number(state.age) < 18) errors.age = "Must be 18 or older";
    return errors;
  };

  const handleSubmit = () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      dispatch({ type: "SET_ERRORS", payload: errors });
    } else {
      alert(`Submitted: ${state.name}, ${state.email}, age ${state.age}`);
      dispatch({ type: "RESET" });
    }
  };

  return (
    <div>
      <h2>Registration</h2>

      <input
        placeholder="Name"
        value={state.name}
        onChange={(e) =>
          dispatch({ type: "UPDATE_FIELD", field: "name", value: e.target.value })
        }
      />
      {state.errors.name && <p style={{ color: "red" }}>{state.errors.name}</p>}

      <input
        placeholder="Email"
        value={state.email}
        onChange={(e) =>
          dispatch({ type: "UPDATE_FIELD", field: "email", value: e.target.value })
        }
      />
      {state.errors.email && <p style={{ color: "red" }}>{state.errors.email}</p>}

      <input
        placeholder="Age"
        type="number"
        value={state.age}
        onChange={(e) =>
          dispatch({ type: "UPDATE_FIELD", field: "age", value: e.target.value })
        }
      />
      {state.errors.age && <p style={{ color: "red" }}>{state.errors.age}</p>}

      <button onClick={handleSubmit}>Submit</button>
      <button onClick={() => dispatch({ type: "RESET" })}>Reset</button>
    </div>
  );
}
```

Using `useReducer` here keeps all form state transitions in one place instead of managing three separate `useState` calls.

---

### 4. Lazy Initialization

```jsx
import { useReducer } from "react";

function init(initialCount) {
  // Expensive computation or data loading
  return { count: initialCount };
}

function reducer(state, action) {
  switch (action.type) {
    case "INCREMENT":
      return { count: state.count + 1 };
    case "RESET":
      return init(action.payload);
    default:
      throw new Error();
  }
}

function Counter({ initialCount = 0 }) {
  const [state, dispatch] = useReducer(reducer, initialCount, init);

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: "INCREMENT" })}>+</button>
      <button onClick={() => dispatch({ type: "RESET", payload: initialCount })}>
        Reset
      </button>
    </div>
  );
}
```

The third argument (`init`) lets you **lazily compute** the initial state — useful when it involves expensive work.

---

### `useState` vs `useReducer`

| Feature             | `useState`                         | `useReducer`                              |
| ------------------- | ---------------------------------- | ----------------------------------------- |
| Best for            | Simple, independent values         | Complex or related state                  |
| Update style        | Direct setter `setState(newVal)`   | Dispatch actions `dispatch({ type })` |
| State transitions   | Inline                             | Centralized in a reducer function         |
| Testability         | Harder to test in isolation        | Reducer is a pure function — easy to test |
| Boilerplate         | Minimal                            | More setup, but scales better             |

---

---

# Combining `useContext` + `useReducer`

This is a powerful pattern for **app-wide state management** without external libraries. `useReducer` handles the state logic, and `useContext` makes it accessible everywhere.

```jsx
import { createContext, useContext, useReducer } from "react";

// --- Context & Reducer Setup ---

const CartContext = createContext();

const initialState = { items: [], totalPrice: 0 };

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.id === action.payload.id);
      let updatedItems;
      if (existing) {
        updatedItems = state.items.map((i) =>
          i.id === action.payload.id ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        updatedItems = [...state.items, { ...action.payload, qty: 1 }];
      }
      return {
        items: updatedItems,
        totalPrice: updatedItems.reduce((sum, i) => sum + i.price * i.qty, 0),
      };
    }
    case "REMOVE_ITEM": {
      const updatedItems = state.items.filter((i) => i.id !== action.payload);
      return {
        items: updatedItems,
        totalPrice: updatedItems.reduce((sum, i) => sum + i.price * i.qty, 0),
      };
    }
    case "CLEAR_CART":
      return initialState;
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

// --- Provider Component ---

function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

// --- Custom Hook ---

function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}

// --- Consumer Components ---

function ProductList() {
  const { dispatch } = useCart();

  const products = [
    { id: 1, name: "Laptop", price: 999 },
    { id: 2, name: "Phone", price: 699 },
    { id: 3, name: "Headphones", price: 199 },
  ];

  return (
    <div>
      <h2>Products</h2>
      {products.map((p) => (
        <div key={p.id}>
          <span>
            {p.name} — ${p.price}
          </span>
          <button onClick={() => dispatch({ type: "ADD_ITEM", payload: p })}>
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
}

function Cart() {
  const { state, dispatch } = useCart();

  return (
    <div>
      <h2>Cart ({state.items.length} items)</h2>
      {state.items.map((item) => (
        <div key={item.id}>
          <span>
            {item.name} × {item.qty} — ${item.price * item.qty}
          </span>
          <button
            onClick={() => dispatch({ type: "REMOVE_ITEM", payload: item.id })}
          >
            Remove
          </button>
        </div>
      ))}
      <h3>Total: ${state.totalPrice}</h3>
      <button onClick={() => dispatch({ type: "CLEAR_CART" })}>
        Clear Cart
      </button>
    </div>
  );
}

// --- App ---

function App() {
  return (
    <CartProvider>
      <ProductList />
      <Cart />
    </CartProvider>
  );
}
```

This gives you a **mini Redux-like setup** using only built-in React hooks — no extra dependencies needed.

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


## Quick Reference — Hook Selection Matrix

| Need                                          | Hook                    |
|-----------------------------------------------|-------------------------|
| Component-level state                         | `useState`              |
| Side effects after render                     | `useEffect`             |
| DOM measurement before paint                  | `useLayoutEffect`       |
| Expensive computation caching                 | `useMemo`               |
| DOM refs or mutable instance variables        | `useRef`                |
| Expose imperative API via ref                 | `useImperativeHandle`   |
| Mark non-urgent updates                       | `useTransition`         |
| Defer a frequently-changing value             | `useDeferredValue`      |
| SSR-safe unique IDs                           | `useId`                 |
| Subscribe to external store (concurrent-safe) | `useSyncExternalStore`  |
| DevTools labels for custom hooks              | `useDebugValue`         |
| CSS-in-JS style injection                     | `useInsertionEffect`    |
| Read Promise/Context in render                | `use`                   |
| Form action state + pending                   | `useActionState`        |
| Optimistic UI updates                         | `useOptimistic`         |
| Parent form submission status                 | `useFormStatus`         |

---

## Common Interview Questions (Senior Level)

**Q: What is the order of execution of useInsertionEffect, useLayoutEffect, and useEffect?**
`useInsertionEffect` → DOM mutations → `useLayoutEffect` → browser paint → `useEffect`. This order ensures CSS-in-JS styles are injected before layout is read, which is read before async side effects run.

**Q: How does React determine if a `useMemo` dependency has changed?**
React uses `Object.is` for comparison (same as `===` except `Object.is(NaN, NaN)` is `true` and `Object.is(+0, -0)` is `false`). This means object/array references must be stable or they will trigger recomputation every render.

**Q: Why can't hooks be called conditionally?**
React identifies hooks by their **call order** in the fiber's hook linked list. If a hook is skipped conditionally, subsequent hooks shift positions, mapping to the wrong slot and corrupting state.

**Q: What problem does `useSyncExternalStore` solve that `useEffect` + `useState` doesn't?**
It prevents "tearing" — a concurrent rendering issue where different parts of the component tree read different snapshots of the same external store because React yields between renders.

**Q: How is `use()` different from all other hooks?**
`use` can be called inside conditionals and loops, breaking the rules of hooks. This is because it's an API, not a hook — it doesn't allocate a slot in the hook linked list. It integrates with Suspense for promises and can replace `useContext` for context reading.

**Q: When would you use `useTransition` vs `useDeferredValue`?**
Use `useTransition` when you own the state setter and want to mark the update as non-urgent. Use `useDeferredValue` when you receive a value as a prop and can't control when it updates — you defer its consumption instead.

---

*Prepared for senior React engineer interviews — covers React 18 and React 19 hooks.*

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

# Web Workers in React — Practical Examples

## The Problem

JavaScript is single-threaded. When you process a massive dataset (sorting, filtering, parsing), the main thread gets blocked and your UI freezes.

```jsx
// ❌ BAD — This blocks the UI
function App() {
  const [result, setResult] = useState([]);

  const handleClick = () => {
    // Sorting 50,000 items freezes the UI
    const sorted = hugeArray.sort((a, b) => {
      // expensive comparison logic
      return a.score - b.score;
    });
    setResult(sorted);
  };

  return <button onClick={handleClick}>Sort Data</button>;
}
```

---

## The Solution: Web Workers

Web Workers run JavaScript on a **separate thread**, keeping your UI responsive.

---

## Step 1 — Create the Worker File

Create a file called `sort.worker.js` in your `public` folder:

```js
// public/sort.worker.js

// This runs on a SEPARATE thread
self.onmessage = function (event) {
  const data = event.data;

  // Heavy computation happens here — UI won't freeze
  const sorted = data.sort((a, b) => a.score - b.score);

  // Send the result back to the main thread
  self.postMessage(sorted);
};
```

---

## Step 2 — Use the Worker in Your React Component

```jsx
import { useState, useRef, useEffect } from "react";

function App() {
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const workerRef = useRef(null);

  useEffect(() => {
    // Create the worker
    workerRef.current = new Worker("/sort.worker.js");

    // Listen for results from the worker
    workerRef.current.onmessage = (event) => {
      setResult(event.data);
      setLoading(false);
    };

    // Handle errors
    workerRef.current.onerror = (error) => {
      console.error("Worker error:", error);
      setLoading(false);
    };

    // Cleanup: terminate worker when component unmounts
    return () => {
      workerRef.current.terminate();
    };
  }, []);

  const handleSort = () => {
    setLoading(true);

    // Generate 50,000 items
    const hugeArray = Array.from({ length: 50000 }, (_, i) => ({
      id: i,
      score: Math.random() * 10000,
      name: `Item ${i}`,
    }));

    // Send data to the worker — this does NOT block the UI
    workerRef.current.postMessage(hugeArray);
  };

  return (
    <div>
      <button onClick={handleSort} disabled={loading}>
        {loading ? "Sorting..." : "Sort 50,000 Items"}
      </button>
      <p>UI stays responsive while sorting!</p>
      <p>Sorted items: {result.length}</p>
    </div>
  );
}

export default App;
```

---

## Step 3 — Custom Hook for Reusability

```jsx
import { useState, useRef, useEffect, useCallback } from "react";

function useWebWorker(workerPath) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const workerRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker(workerPath);

    workerRef.current.onmessage = (event) => {
      setResult(event.data);
      setLoading(false);
    };

    workerRef.current.onerror = (err) => {
      setError(err.message);
      setLoading(false);
    };

    return () => workerRef.current.terminate();
  }, [workerPath]);

  const run = useCallback((data) => {
    setLoading(true);
    setError(null);
    workerRef.current.postMessage(data);
  }, []);

  return { result, loading, error, run };
}

// Usage
function App() {
  const { result, loading, error, run } = useWebWorker("/sort.worker.js");

  const handleSort = () => {
    const data = Array.from({ length: 50000 }, () => ({
      score: Math.random() * 10000,
    }));
    run(data);
  };

  return (
    <div>
      <button onClick={handleSort} disabled={loading}>
        {loading ? "Processing..." : "Sort Data"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {result && <p>Sorted {result.length} items</p>}
    </div>
  );
}
```

---

## How It Works — Visual Flow

```
Main Thread (UI)              Worker Thread (Background)
─────────────────             ──────────────────────────
                              
1. User clicks button
2. postMessage(data)  ──────► 3. Receives data
                              4. Processes (sort/filter)
   UI stays responsive        5. Heavy computation...
   User can scroll, click     6. Done!
                      ◄────── 7. postMessage(result)
8. onmessage fires
9. Update state
10. Re-render with result
```

---

## When to Use Web Workers

| Use Web Workers For                  | Don't Use For                     |
|--------------------------------------|-----------------------------------|
| Sorting/filtering large datasets     | Simple state updates              |
| Complex calculations                 | Small array operations            |
| Data parsing (CSV, JSON)             | API calls (use async/await)       |
| Image processing                     | DOM manipulation (no DOM access)  |
| Search indexing                      | Tiny computations                 |

---

## Key Limitations

- Workers **cannot access the DOM** — they can only process data and send results back.
- Data is **copied** between threads via structured cloning, not shared. For very large data, use `Transferable` objects to avoid copying overhead.
- There's startup overhead, so don't use workers for trivial tasks.
- Each worker is a separate file (unless using inline blob workers).

---

## Bonus — Inline Worker (No Separate File)

```jsx
function createInlineWorker(fn) {
  const blob = new Blob(
    [`self.onmessage = function(e) { self.postMessage((${fn.toString()})(e.data)); }`],
    { type: "application/javascript" }
  );
  return new Worker(URL.createObjectURL(blob));
}

// Usage — no separate file needed
const worker = createInlineWorker((data) => {
  return data.sort((a, b) => a.score - b.score);
});

worker.postMessage(hugeArray);
worker.onmessage = (e) => console.log("Sorted:", e.data);
```
