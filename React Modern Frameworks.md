# React & Modern Frameworks – Interview Deep Dive

---

## Q1: Explain React's Fiber Architecture. How does it enable concurrent rendering?

### The Problem Fiber Solved

```
React ≤15 (Stack Reconciler):
  
  Component Tree Update
  ├── Start reconciliation
  ├── Process Component A        ─┐
  ├── Process Component B         │  SYNCHRONOUS
  ├── Process Component C         │  Cannot be interrupted
  ├── Process Component D         │  Main thread blocked
  ├── Process Component E        ─┘
  └── Commit to DOM
  
  If this takes 100ms → UI frozen for 100ms
  User input during this time is DROPPED
  60fps requires < 16.6ms per frame
```

### What Fiber IS

A Fiber is a JavaScript object that represents a unit of work. Every React element has a corresponding Fiber node. Together, they form a Fiber tree — a mutable, linked-list work-in-progress tree that React can pause, resume, abort, and reuse.

```javascript
// Simplified Fiber node structure
const fiber = {
  // Identity
  tag: FunctionComponent,     // What type of component (Function, Class, Host, etc.)
  type: MyComponent,          // The actual function/class
  key: null,                  // Reconciliation key

  // Tree structure (linked list, NOT array of children)
  child: fiberChild,          // First child
  sibling: fiberSibling,      // Next sibling
  return: fiberParent,        // Parent fiber

  // Work
  pendingProps: { name: "Alice" },
  memoizedProps: { name: "Bob" },    // Props from last render
  memoizedState: { count: 0 },       // State from last render
  updateQueue: [...],                 // Pending state updates

  // Effects
  flags: Placement | Update,         // What needs to happen (bitmask)
  subtreeFlags: ...,                  // Aggregated child flags

  // Scheduling
  lanes: SyncLane | DefaultLane,     // Priority bitmask
  childLanes: ...,                   // Priority of children

  // Double buffering
  alternate: workInProgressFiber,    // Points to WIP or current version
};
```

### The Two-Phase Architecture

```
Phase 1: RENDER (Interruptible)
  "What changed? What needs updating?"
  
  ┌──────────────────────────────────────────────────┐
  │  Work Loop (processes one fiber at a time)        │
  │                                                    │
  │  while (workInProgress !== null && !shouldYield) { │
  │    workInProgress = performUnitOfWork(fiber);      │
  │  }                                                 │
  │                                                    │
  │  ① beginWork(fiber)  → Process this fiber          │
  │  ② If child exists   → Move to child               │
  │  ③ If no child       → completeWork(fiber)         │
  │  ④ If sibling exists → Move to sibling              │
  │  ⑤ If no sibling     → Return to parent            │
  │                                                    │
  │  Can PAUSE after any fiber and resume later        │
  │  Can ABORT if higher priority work arrives          │
  └──────────────────────────────────────────────────┘

Phase 2: COMMIT (Synchronous, uninterruptible)
  "Apply all changes to the real DOM"
  
  ┌──────────────────────────────────────────────────┐
  │  ① beforeMutation  → getSnapshotBeforeUpdate      │
  │  ② mutation        → DOM insertions, updates       │
  │  ③ layout          → componentDidMount/Update,     │
  │                       useLayoutEffect callbacks     │
  │                                                    │
  │  This phase is FAST because all work was            │
  │  pre-computed in the render phase                   │
  └──────────────────────────────────────────────────┘
```

### How Concurrent Rendering Works

```
Traditional (Synchronous):
  [=================RENDER=================][COMMIT]
  ← 100ms, UI blocked →

Concurrent (Time-sliced):
  [==RENDER==][yield][==RENDER==][yield][==RENDER==][COMMIT]
       5ms    input     5ms    paint     5ms
              event             frame
              
  Between slices, the browser can:
  - Handle user input (click, type)
  - Paint frames (maintain 60fps)  
  - Run other high-priority work
```

### Priority Lanes System

```javascript
// React 18+ uses a bitmask-based lane system for priorities
const SyncLane          = 0b0000000000000000000000000000001;  // Highest
const InputContinuousLane = 0b0000000000000000000000000000100;
const DefaultLane       = 0b0000000000000000000000000010000;
const TransitionLane1   = 0b0000000000000000000000001000000;
const IdleLane          = 0b0100000000000000000000000000000;  // Lowest

// How you trigger different priorities:

// Sync (urgent — blocks everything)
flushSync(() => setState(newValue));

// Default (normal — interruptible)
setState(newValue);

// Transition (low priority — can be interrupted by anything)
startTransition(() => setState(newValue));

// Deferred (even lower — rendered after everything else)
const deferredValue = useDeferredValue(value);
```

### Concurrent Features in Practice

```jsx
import { startTransition, useDeferredValue, useTransition } from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  
  function handleChange(e) {
    // URGENT: Update the input immediately (user sees their typing)
    setQuery(e.target.value);
    
    // LOW PRIORITY: Update search results (can be interrupted)
    startTransition(() => {
      setSearchResults(filterResults(e.target.value));
    });
  }
  
  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <SearchResults results={searchResults} />
    </div>
  );
}

// useDeferredValue — defer expensive re-renders
function ProductList({ products }) {
  const [filter, setFilter] = useState('');
  const deferredFilter = useDeferredValue(filter);
  // deferredFilter lags behind filter during rapid typing
  // React renders with old deferredFilter first (fast),
  // then re-renders with new value when free (slow but non-blocking)
  
  const filtered = useMemo(
    () => products.filter(p => p.name.includes(deferredFilter)),
    [products, deferredFilter]
  );
  
  return (
    <>
      <input value={filter} onChange={e => setFilter(e.target.value)} />
      <div style={{ opacity: filter !== deferredFilter ? 0.7 : 1 }}>
        {filtered.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </>
  );
}
```

### Double Buffering — The "Alternate" Trick

```
React maintains TWO fiber trees:

  Current Tree (on screen)          Work-In-Progress Tree (in memory)
  ┌─────────────┐                   ┌─────────────┐
  │    App       │ ◄── alternate ──► │    App       │
  │   ┌───┐     │                   │   ┌───┐     │
  │   │ A │     │                   │   │ A'│     │ ← modified
  │   └───┘     │                   │   └───┘     │
  │   ┌───┐     │                   │   ┌───┐     │
  │   │ B │     │                   │   │ B │     │ ← reused (no changes)
  │   └───┘     │                   │   └───┘     │
  └─────────────┘                   └─────────────┘

After commit: WIP tree becomes the current tree
Old current becomes the next WIP tree (recycled)
```

### Interview Tip
> "Fiber is fundamentally a reimplementation of the call stack. The old stack reconciler used the JavaScript call stack, which can't be paused. Fiber replaces it with a virtual stack using linked lists — each Fiber node is a 'stack frame' that React controls. This enables pausing in the middle of rendering, assigning priorities, and resuming later. The two-phase architecture (interruptible render + synchronous commit) is what makes concurrent features like `startTransition`, `useDeferredValue`, and Suspense possible."

---

## Q2: What are React Server Components? How do they differ from SSR and traditional client components?

### The Three Rendering Models

```
┌─────────────────────────────────────────────────────────────────┐
│                    Traditional CSR (Client-Side Rendering)       │
│                                                                  │
│  Server: Sends empty HTML + JS bundle                           │
│  Client: Downloads JS → Executes → Builds DOM → Fetches data   │
│                                                                  │
│  Timeline:                                                       │
│  [HTML]──[Download JS]──[Parse/Execute]──[Fetch Data]──[Render] │
│   ↑ blank                                               ↑ usable│
│   TTFB                                                   TTI    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SSR (Server-Side Rendering)                   │
│                                                                  │
│  Server: Renders HTML with data → Sends full HTML + JS bundle   │
│  Client: Shows HTML immediately → Downloads JS → Hydrates       │
│                                                                  │
│  Timeline:                                                       │
│  [Server Render]──[HTML]──[Download JS]──[Hydrate]              │
│                    ↑ visible              ↑ interactive          │
│                    FCP                    TTI                    │
│                                                                  │
│  Problem: Must download ALL JS and hydrate EVERYTHING           │
│           even if 80% of the page is static                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              RSC (React Server Components)                      │
│                                                                  │
│  Server: Renders Server Components into serialized format       │
│          Only Client Components need JS                          │
│  Client: Renders Server Component output (zero JS for them)     │
│          Only hydrates Client Components                         │
│                                                                  │
│  Timeline:                                                       │
│  [Server Render RSC]──[Stream HTML + RSC Payload]──[Hydrate     │
│                        ↑ visible                    client parts]│
│                        FCP                          ↑ interactive│
│                                                     TTI          │
│                                                                  │
│  KEY: Server Components send ZERO JavaScript to client          │
│       Only interactive parts (Client Components) ship JS        │
└─────────────────────────────────────────────────────────────────┘
```

### Server vs Client Components

```jsx
// ═══════════════════════════════════════════
// SERVER COMPONENT (default in Next.js App Router)
// File: app/products/page.tsx
// ═══════════════════════════════════════════

// ✅ Can do all of these:
import { db } from '@/lib/database';        // Direct database access
import { readFile } from 'fs/promises';      // File system access
import { headers, cookies } from 'next/headers';  // Request data

// ✅ Can use async/await at component level
async function ProductPage({ params }) {
  // Direct database query — no API route needed
  const product = await db.products.findById(params.id);
  
  // Read from file system
  const changelog = await readFile('./CHANGELOG.md', 'utf-8');
  
  // Access large libraries without sending them to client
  const { marked } = await import('marked');  // 50KB — stays on server
  const html = marked(changelog);
  
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      
      {/* Client Component — only THIS ships JavaScript */}
      <AddToCartButton productId={product.id} price={product.price} />
    </div>
  );
}

// ❌ Server Components CANNOT:
// - Use useState, useEffect, or any hooks with state/effects
// - Use browser APIs (window, document, localStorage)
// - Use event handlers (onClick, onChange)
// - Use Context (useContext)


// ═══════════════════════════════════════════
// CLIENT COMPONENT
// File: components/AddToCartButton.tsx
// ═══════════════════════════════════════════
'use client';  // ← This directive marks it as a Client Component

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';

export function AddToCartButton({ productId, price }) {
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();
  
  async function handleClick() {
    setLoading(true);
    await addItem(productId);
    setLoading(false);
  }
  
  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Adding...' : `Add to Cart — $${price}`}
    </button>
  );
}
```

### The RSC Wire Format (Payload)

```
When a Server Component renders, it produces a special
serialized format (NOT HTML) that React understands:

Server Component output (simplified):
{
  type: "div",
  props: {
    children: [
      { type: "h1", props: { children: "MacBook Pro" } },
      { type: "p", props: { children: "The most powerful..." } },
      {
        type: "$ClientReference",           // ← Client Component boundary
        module: "./AddToCartButton.js",     // ← JS module to load
        props: { productId: 1, price: 2499 }
      }
    ]
  }
}

This payload:
- Is streamable (can be sent in chunks)
- Contains NO JavaScript for server-rendered parts
- Contains references to Client Component bundles
- Can be cached and revalidated
```

### SSR vs RSC — Key Differences

```
                        SSR                     RSC
─────────────────────────────────────────────────────────────
Where rendered          Server                  Server
JS sent to client       ALL component JS        Only Client Components
Hydration needed        YES (entire page)       Only Client Components
Can access DB           Via API routes          Directly in component
Re-renders              Full page (getServerSideProps)   Granular (Server Actions)
Caching                 Page-level              Component-level
Streaming               With Suspense (React 18) Native
Component state         Lost on navigation*     Preserved (with RSC refetch)
Bundle size impact      None (all JS still sent) Significant reduction

* With client-side navigation, state is preserved in both
```

### Composition Pattern — Server + Client

```jsx
// ✅ CORRECT: Server Component wraps Client Component
// Server Components can pass serializable props to Client Components

// Server Component
async function Dashboard() {
  const metrics = await db.getMetrics();  // Server-only
  
  return (
    <div>
      {/* Static content — zero JS */}
      <h1>Dashboard</h1>
      <MetricsSummary data={metrics} />  {/* Also a Server Component */}
      
      {/* Interactive chart — Client Component gets only the data it needs */}
      <InteractiveChart data={metrics.chartData} />  {/* 'use client' */}
    </div>
  );
}

// ✅ CORRECT: Server Component as children of Client Component
function ClientLayout({ children }) {
  'use client';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <div className={sidebarOpen ? 'with-sidebar' : ''}>
      <button onClick={() => setSidebarOpen(!sidebarOpen)}>Toggle</button>
      {children}  {/* children can be Server Components! */}
    </div>
  );
}

// Usage
<ClientLayout>
  <ServerSideContent />  {/* This stays server-rendered */}
</ClientLayout>

// ❌ WRONG: Importing Server Component inside Client Component
'use client';
import ServerComponent from './ServerComponent';  // ❌ Becomes client component!

// ✅ CORRECT: Pass Server Component as prop/children
'use client';
function ClientWrapper({ serverContent }) {
  return <div className="fancy">{serverContent}</div>;
}
```

### Server Actions (React 19)

```jsx
// Server Component with Server Action
async function TodoList() {
  const todos = await db.todos.findAll();
  
  // Server Action — runs on server, called from client
  async function addTodo(formData) {
    'use server';  // ← This function runs on the SERVER
    const title = formData.get('title');
    await db.todos.create({ title });
    revalidatePath('/todos');  // Re-render Server Component
  }
  
  return (
    <div>
      <form action={addTodo}>
        <input name="title" />
        <button type="submit">Add</button>
      </form>
      <ul>
        {todos.map(todo => <li key={todo.id}>{todo.title}</li>)}
      </ul>
    </div>
  );
}
```

### Interview Tip
> "RSC is a paradigm shift — not just another rendering strategy. The mental model is: Server Components are the READ layer (fetch data, access backend, render static content with zero JS), and Client Components are the INTERACT layer (state, effects, event handlers). The boundary between them is the `'use client'` directive. This naturally leads to smaller bundles because server-only code and large libraries (markdown parsers, date libraries, database clients) never ship to the browser."

---

## Q3: Explain the reconciliation algorithm (diffing). What are its limitations and how do keys help?

### The Core Algorithm

React's reconciliation determines the minimum set of DOM operations needed to update the UI. A naive tree diff is O(n³) — React's heuristic algorithm is O(n).

### The Two Heuristic Rules

```
Rule 1: Different TYPES → tear down entire subtree and rebuild
Rule 2: Same TYPE → update props/attributes, recurse into children

These two rules reduce tree diffing from O(n³) to O(n)
```

### Rule 1: Different Element Types

```jsx
// BEFORE:
<div>
  <Counter />
</div>

// AFTER:
<section>  ← Different type (div → section)
  <Counter />
</section>

// React's action:
// 1. Destroy entire <div> subtree (including Counter's state)
// 2. Create new <section> subtree from scratch
// 3. Counter is unmounted and remounted — state is LOST

// Same applies to component types:
// BEFORE:
<UserCard user={alice} />

// AFTER:
<AdminCard user={alice} />  ← Different component type

// React unmounts UserCard entirely and mounts AdminCard
// Even if they render identical JSX
```

### Rule 2: Same Element Type — Diff Props

```jsx
// BEFORE:
<div className="old" style={{ color: 'red', fontSize: 14 }} />

// AFTER:
<div className="new" style={{ color: 'blue', fontSize: 14 }} />

// React's action:
// 1. Same type (div) → keep the DOM node
// 2. Update className: "old" → "new"
// 3. Update style.color: "red" → "blue"
// 4. style.fontSize unchanged → skip
// Only 2 DOM operations instead of destroying/recreating
```

### Children Reconciliation — Where Keys Matter

```jsx
// ═══════════════════════════════════════════
// WITHOUT KEYS — Index-based comparison
// ═══════════════════════════════════════════

// BEFORE:                    AFTER (prepend item):
// <ul>                       <ul>
//   <li>Alice</li>  [0]        <li>Zara</li>   [0]  ← React: "Alice→Zara" (update)
//   <li>Bob</li>    [1]        <li>Alice</li>  [1]  ← React: "Bob→Alice" (update)
//   <li>Carol</li>  [2]        <li>Bob</li>    [2]  ← React: "Carol→Bob" (update)
// </ul>                        <li>Carol</li>  [3]  ← React: NEW (insert)
//                            </ul>

// Result: React updates ALL THREE existing items + inserts one
// 4 DOM operations — terrible! It should be just 1 insert


// ═══════════════════════════════════════════
// WITH KEYS — Identity-based comparison
// ═══════════════════════════════════════════

// BEFORE:                        AFTER (prepend item):
// <ul>                           <ul>
//   <li key="a">Alice</li>        <li key="z">Zara</li>   ← NEW (insert)
//   <li key="b">Bob</li>          <li key="a">Alice</li>  ← MATCH (no change)
//   <li key="c">Carol</li>        <li key="b">Bob</li>    ← MATCH (no change)
// </ul>                           <li key="c">Carol</li>  ← MATCH (no change)
//                                </ul>

// Result: React inserts ONE new item, moves nothing
// 1 DOM operation — optimal!
```

### The Key-Based Reconciliation Algorithm

```
For a list of children with keys, React builds a Map:

Old children: { "a": <Alice/>, "b": <Bob/>, "c": <Carol/> }
New children: ["z", "a", "b", "c"]

Algorithm:
  1. Create Map of old children by key
  2. Walk through new children list:
     - "z" → not in old Map → CREATE new DOM node
     - "a" → found in old Map → REUSE, update if props changed
     - "b" → found in old Map → REUSE, update if props changed
     - "c" → found in old Map → REUSE, update if props changed
  3. Any old keys NOT in new list → DELETE those DOM nodes
  4. Determine minimum moves needed to achieve new order
```

### Why Array Index as Key is Dangerous

```jsx
// ❌ Using index as key
{items.map((item, index) => (
  <TodoItem key={index} item={item} />
))}

// Problem scenario: Delete item at index 1
// BEFORE:                          AFTER:
// key=0: { text: "Buy milk" }      key=0: { text: "Buy milk" }  ← same key, same item ✓
// key=1: { text: "Walk dog" }      key=1: { text: "Cook dinner" } ← same key, WRONG item!
// key=2: { text: "Cook dinner" }   (key=2 deleted)
//
// React thinks key=1 changed from "Walk dog" to "Cook dinner"
// Any state inside TodoItem (checkbox, input focus) is WRONG
// It shows the state of "Walk dog" but the text of "Cook dinner"

// ✅ Using stable unique ID
{items.map((item) => (
  <TodoItem key={item.id} item={item} />
))}
```

### Using Key to Force Remount

```jsx
// KEY TRICK: Change key to destroy and recreate a component
function App() {
  const [userId, setUserId] = useState(1);
  
  // When userId changes, key changes → Profile unmounts and remounts
  // All internal state (form inputs, scroll position) resets
  return <Profile key={userId} userId={userId} />;
  
  // Without key, React would UPDATE Profile (keeping stale state)
  // With key, React REPLACES Profile (clean state for new user)
}

// Another use case: reset a form
function FormPage() {
  const [formKey, setFormKey] = useState(0);
  
  return (
    <div>
      <ComplexForm key={formKey} />
      <button onClick={() => setFormKey(k => k + 1)}>
        Reset Form
      </button>
    </div>
  );
}
```

### Limitations of the Algorithm

```
1. CROSS-LEVEL MOVES NOT DETECTED
   If a component moves from one subtree to another,
   React destroys it in the old position and creates a new
   instance in the new position. State is lost.

   <div>                    <section>
     <A />  ← moved ─────►   <A />  ← new instance (state lost)
   </div>                   </section>

2. DIFFERENT TYPES = FULL TEARDOWN
   Even if two components render identical output,
   changing the type destroys the entire subtree.
   
   <LoginButton />  →  <LogoutButton />
   // Full unmount + mount even if they render the same <button>

3. HEURISTIC CAN BE SUBOPTIMAL FOR REORDERING
   Without keys, reordering a list is O(n) updates.
   With keys, React does better but still may need O(n) moves
   in worst case (full reversal).

4. CHILDREN DIFFING IS LINEAR
   React compares children left-to-right. Prepending items
   is expensive without keys (every item appears "changed").
```

### Interview Tip
> "The reconciliation algorithm is built on a pragmatic bet: in practice, cross-level element moves are rare, and elements of different types usually produce different trees. These two heuristics reduce O(n³) to O(n), which is the only reason React is fast enough for real-time UIs. Keys exist because the algorithm can't determine element identity from position alone — they're not just an optimization, they're essential for correctness in dynamic lists."

---

## Q4: How does `useSyncExternalStore` work and when would you use it?

### The Problem It Solves

```
React 18's concurrent rendering can cause "tearing" — when different
parts of the UI show different versions of external state.

Timeline without useSyncExternalStore:
  
  Component A reads store → value: 1
  [REACT YIELDS TO BROWSER]           ← concurrent pause
  External store updates → value: 2    ← store changes during pause
  Component B reads store → value: 2   ← reads NEW value
  
  Result: Component A shows 1, Component B shows 2
  Both are on screen at the same time → TORN UI
```

### How useSyncExternalStore Works

```jsx
import { useSyncExternalStore } from 'react';

const value = useSyncExternalStore(
  subscribe,     // (callback) => unsubscribe — called when store changes
  getSnapshot,   // () => currentValue — must return immutable value
  getServerSnapshot  // () => serverValue — for SSR (optional)
);

// React guarantees:
// 1. The snapshot is consistent across all components in a render
// 2. If store changes during concurrent render, React will re-render
//    synchronously to prevent tearing
// 3. Subscribe is called once, React handles rerendering on changes
```

### Real-World Examples

```jsx
// ═══════════════════════════════════════════
// Example 1: Custom store (like a mini-Redux)
// ═══════════════════════════════════════════

function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState: () => state,
    setState: (updater) => {
      state = typeof updater === 'function' ? updater(state) : updater;
      listeners.forEach(listener => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const counterStore = createStore({ count: 0, name: 'Counter' });

// Hook to use the store
function useStore(store, selector) {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState())
  );
}

// Usage in components
function CounterDisplay() {
  const count = useStore(counterStore, state => state.count);
  return <p>Count: {count}</p>;
}

function CounterName() {
  const name = useStore(counterStore, state => state.name);
  return <p>Name: {name}</p>;
}


// ═══════════════════════════════════════════
// Example 2: Browser API subscriptions
// ═══════════════════════════════════════════

// Online status
function useOnlineStatus() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('online', callback);
      window.addEventListener('offline', callback);
      return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      };
    },
    () => navigator.onLine,
    () => true  // Server snapshot — assume online
  );
}

// Window dimensions
function useWindowSize() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('resize', callback);
      return () => window.removeEventListener('resize', callback);
    },
    () => ({ width: window.innerWidth, height: window.innerHeight }),
    () => ({ width: 1200, height: 800 })  // SSR default
  );
}

// Media query
function useMediaQuery(query) {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

// URL/History
function usePathname() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('popstate', callback);
      return () => window.removeEventListener('popstate', callback);
    },
    () => window.location.pathname,
    () => '/'
  );
}


// ═══════════════════════════════════════════
// Example 3: Third-party store integration
// ═══════════════════════════════════════════

// Integrating with a vanilla JS state management library
import { store } from 'some-vanilla-store';

function useVanillaStore(selector) {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getInitialState())
  );
}
```

### Snapshot Identity Warning

```jsx
// ❌ BAD — creates new object every time → infinite re-renders
function useStore(store) {
  return useSyncExternalStore(
    store.subscribe,
    () => ({ count: store.getState().count })  // New object every call!
  );
}

// ✅ GOOD — return the same reference if value hasn't changed
function useStore(store, selector) {
  const selectorRef = useRef(selector);
  const prevRef = useRef();
  
  return useSyncExternalStore(
    store.subscribe,
    () => {
      const next = selectorRef.current(store.getState());
      // Return previous if shallow-equal (same reference → no re-render)
      if (shallowEqual(prevRef.current, next)) return prevRef.current;
      prevRef.current = next;
      return next;
    }
  );
}

// This is exactly what Zustand, Redux, etc. do internally
```

### Interview Tip
> "`useSyncExternalStore` exists for one reason: concurrent rendering safety. Any state that lives outside React (vanilla stores, browser APIs, third-party libraries) can cause tearing in React 18+ because React may pause rendering mid-tree. This hook forces synchronous reading of external state, guaranteeing consistency. Libraries like Zustand, Redux Toolkit, and Valtio all use it internally. You'd use it directly when integrating any non-React state source — browser APIs, WebSocket state, shared workers, or custom stores."

---

## Q5: What is the difference between `useEffect`, `useLayoutEffect`, and `useInsertionEffect`?

### Timeline Visualization

```
User Action / State Change
        │
        ▼
  ┌─────────────────────┐
  │   React Renders      │  ← Calling your component function
  │   (in memory)        │     Computing new virtual DOM
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │  DOM Mutations       │  ← React applies changes to real DOM
  │  (synchronous)       │     insertions, updates, deletions
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │ useInsertionEffect   │  ← 1st: Inject CSS (before any DOM reading)
  │ (synchronous)        │     Used by CSS-in-JS libraries
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │  useLayoutEffect     │  ← 2nd: Read DOM measurements, apply sync changes
  │  (synchronous)       │     Runs BEFORE browser paints
  │                      │     Blocks visual update until complete
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │  Browser Paint       │  ← User sees the update
  │  (renders pixels)    │
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │  useEffect           │  ← 3rd: Side effects (async-safe)
  │  (asynchronous)      │     Runs AFTER browser paints
  │                      │     Does NOT block visual update
  └─────────────────────┘
```

### useEffect — Most Common (Non-Blocking)

```jsx
// Runs AFTER paint — doesn't block visual updates
// Use for: data fetching, subscriptions, analytics, non-visual side effects

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    let cancelled = false;
    
    async function fetchUser() {
      const res = await fetch(`/api/users/${userId}`);
      const data = await res.json();
      if (!cancelled) setUser(data);
    }
    
    fetchUser();
    
    return () => { cancelled = true; };  // Cleanup on unmount/re-run
  }, [userId]);
  
  // Other use cases:
  useEffect(() => {
    // Event listeners
    const handler = (e) => console.log(e);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  
  useEffect(() => {
    // Analytics
    analytics.track('page_view', { userId });
  }, [userId]);
  
  useEffect(() => {
    // Document title
    document.title = user ? `${user.name}'s Profile` : 'Loading...';
  }, [user]);
}
```

### useLayoutEffect — Synchronous Before Paint

```jsx
// Runs synchronously BEFORE browser paints
// Use for: DOM measurements, preventing visual flicker

// ═══════ Use Case 1: Tooltips / Popovers ═══════
function Tooltip({ anchorEl, children }) {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  useLayoutEffect(() => {
    if (!anchorEl || !tooltipRef.current) return;
    
    const anchorRect = anchorEl.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    setPosition({
      top: anchorRect.top - tooltipRect.height - 8,
      left: anchorRect.left + (anchorRect.width - tooltipRect.width) / 2,
    });
    // This runs BEFORE paint — user never sees tooltip in wrong position
  }, [anchorEl]);
  
  return (
    <div ref={tooltipRef} style={{ position: 'fixed', ...position }}>
      {children}
    </div>
  );
}

// ═══════ Use Case 2: Scroll restoration ═══════
function ChatMessages({ messages }) {
  const containerRef = useRef(null);
  
  useLayoutEffect(() => {
    // Scroll to bottom when new messages arrive
    // Must be useLayoutEffect to prevent flash of old scroll position
    const el = containerRef.current;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);
  
  return (
    <div ref={containerRef} style={{ overflow: 'auto', height: 400 }}>
      {messages.map(msg => <Message key={msg.id} {...msg} />)}
    </div>
  );
}

// ═══════ Use Case 3: Prevent flicker ═══════
function AnimatedElement({ isVisible }) {
  const ref = useRef(null);
  
  useLayoutEffect(() => {
    if (!ref.current) return;
    
    if (isVisible) {
      // Measure BEFORE paint, then animate
      const height = ref.current.scrollHeight;
      ref.current.style.height = '0px';
      // Force reflow
      ref.current.offsetHeight;
      ref.current.style.height = `${height}px`;
    }
  }, [isVisible]);
  
  return <div ref={ref}>{/* content */}</div>;
}
```

### useInsertionEffect — For CSS-in-JS Libraries

```jsx
// Runs BEFORE useLayoutEffect and BEFORE DOM is read
// Use for: Injecting <style> tags (CSS-in-JS only)
// You should almost NEVER use this directly

// This is what libraries like styled-components use internally:
function useCSS(rule) {
  useInsertionEffect(() => {
    const style = document.createElement('style');
    style.textContent = rule;
    document.head.appendChild(style);
    
    return () => document.head.removeChild(style);
  }, [rule]);
}

// WHY it exists:
// If a CSS-in-JS library injects styles in useLayoutEffect,
// the styles might not be ready when other useLayoutEffects
// try to read DOM measurements (getBoundingClientRect).
// useInsertionEffect guarantees styles are injected FIRST.
```

### Decision Framework

```
"Should I use useEffect or useLayoutEffect?"

Does it involve DOM measurement or visual sync?
  YES → useLayoutEffect
    - Reading element dimensions (getBoundingClientRect)
    - Scroll position management
    - Preventing visual flicker
    - Synchronous DOM mutations that must be invisible
    
  NO → useEffect
    - Data fetching
    - Event listeners
    - Analytics / logging
    - Timers / intervals
    - Subscriptions (WebSocket, etc.)
    - Document title changes

Am I building a CSS-in-JS library?
  YES → useInsertionEffect (for style injection only)
  NO → Never use useInsertionEffect

Rule of thumb:
  useEffect for 95% of cases
  useLayoutEffect for DOM measurement / flicker prevention
  useInsertionEffect only if you're authoring a CSS-in-JS library
```

### Interview Tip
> "The key insight is about the browser paint. `useEffect` runs after paint — the user might briefly see the pre-effect state. `useLayoutEffect` runs before paint — the user never sees the intermediate state. The trade-off is that `useLayoutEffect` blocks the paint, so long-running code there causes visible lag. For tooltips and popovers, I always use `useLayoutEffect` because users notice position jumps. For data fetching, `useEffect` is correct because you want the skeleton/loading state to appear immediately."

---

## Q6: How would you design a performant React app that renders 10,000+ rows of data?

### The Performance Problem

```
10,000 rows × ~10 DOM nodes per row = 100,000+ DOM nodes

Problems:
  - Initial render: 2-5 seconds
  - Each re-render: 500ms+ (thrashing)
  - Memory: 200MB+ DOM tree
  - Scrolling: Janky (browser painting 100K nodes)
  - User interaction: Unresponsive
```

### Strategy 1: Virtualization (Windowing)

Only render the visible rows + a small buffer. As the user scrolls, swap out rows.

```jsx
// Using @tanstack/react-virtual (most modern option)
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedList({ items }) {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,           // 10,000 items
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,        // Estimated row height (px)
    overscan: 10,                  // Render 10 extra rows above/below viewport
  });
  
  return (
    <div
      ref={parentRef}
      style={{ height: '600px', overflow: 'auto' }}
    >
      {/* Total scrollable height — makes scrollbar accurate */}
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <Row data={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
  
  // Result: Only ~20-30 DOM nodes exist at any time
  // Regardless of whether you have 10K or 10M rows
}
```

### Strategy 2: Virtualized Table with Sorting & Filtering

```jsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMemo, useState, useDeferredValue } from 'react';

function DataTable({ columns, data }) {
  const [sortConfig, setSortConfig] = useState({ key: null, dir: 'asc' });
  const [filter, setFilter] = useState('');
  const deferredFilter = useDeferredValue(filter);  // Don't block typing
  
  // Memoize expensive operations
  const processedData = useMemo(() => {
    let result = data;
    
    // Filter
    if (deferredFilter) {
      const lower = deferredFilter.toLowerCase();
      result = result.filter(row =>
        columns.some(col =>
          String(row[col.key]).toLowerCase().includes(lower)
        )
      );
    }
    
    // Sort
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortConfig.dir === 'asc' ? cmp : -cmp;
      });
    }
    
    return result;
  }, [data, deferredFilter, sortConfig]);
  
  const parentRef = useRef(null);
  const virtualizer = useVirtualizer({
    count: processedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 15,
  });
  
  return (
    <div>
      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder={`Filter ${data.length.toLocaleString()} rows...`}
      />
      
      <div ref={parentRef} style={{ height: '80vh', overflow: 'auto' }}>
        {/* Sticky header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 1, background: 'white' }}>
          {columns.map(col => (
            <span
              key={col.key}
              onClick={() => setSortConfig(prev => ({
                key: col.key,
                dir: prev.key === col.key && prev.dir === 'asc' ? 'desc' : 'asc',
              }))}
            >
              {col.label} {sortConfig.key === col.key ? (sortConfig.dir === 'asc' ? '↑' : '↓') : ''}
            </span>
          ))}
        </div>
        
        {/* Virtualized body */}
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map(vRow => {
            const row = processedData[vRow.index];
            return (
              <div
                key={vRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  transform: `translateY(${vRow.start}px)`,
                  height: vRow.size,
                  width: '100%',
                }}
              >
                {columns.map(col => (
                  <span key={col.key}>{row[col.key]}</span>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      
      <p>{processedData.length.toLocaleString()} rows</p>
    </div>
  );
}
```

### Strategy 3: Web Workers for Heavy Computation

```jsx
// worker.ts — runs off main thread
self.onmessage = (e) => {
  const { data, filter, sort } = e.data;
  
  let result = data;
  
  if (filter) {
    result = result.filter(row =>
      Object.values(row).some(v =>
        String(v).toLowerCase().includes(filter.toLowerCase())
      )
    );
  }
  
  if (sort) {
    result.sort((a, b) => {
      const cmp = a[sort.key] < b[sort.key] ? -1 : 1;
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }
  
  self.postMessage(result);
};

// Component
function useWorkerFilter(data, filter, sort) {
  const [result, setResult] = useState(data);
  const workerRef = useRef(null);
  
  useEffect(() => {
    workerRef.current = new Worker(new URL('./worker.ts', import.meta.url));
    workerRef.current.onmessage = (e) => setResult(e.data);
    return () => workerRef.current?.terminate();
  }, []);
  
  useEffect(() => {
    workerRef.current?.postMessage({ data, filter, sort });
  }, [data, filter, sort]);
  
  return result;
}
```

### Strategy 4: CSS `content-visibility` (No JS Required)

```css
/* For non-virtualized lists — browser-native optimization */
.row {
  content-visibility: auto;
  contain-intrinsic-size: auto 48px;
  contain: strict;
}

/* Browser skips rendering off-screen rows entirely
   Works for up to ~5,000 rows before virtualization is needed */
```

### The Complete Performance Toolkit

```
Rows       Strategy
─────────────────────────────────────────────
< 100      No optimization needed
100-500    React.memo + useMemo for sort/filter
500-2000   content-visibility: auto (CSS only)
2000-50K   Virtualization (@tanstack/react-virtual)
50K-500K   Virtualization + Web Workers for processing
500K+      Server-side pagination + on-demand loading
```

### Interview Tip
> "For 10K+ rows, virtualization is non-negotiable. I use `@tanstack/react-virtual` because it supports variable row heights, horizontal virtualization, and grid layouts. The key optimizations on top of virtualization are: `useDeferredValue` for filter input so typing stays responsive, `useMemo` for sort/filter computation so it only re-runs when inputs change, and Web Workers to move heavy computation off the main thread entirely. For tables with complex cells, I add `React.memo` to row components with custom comparison to prevent unnecessary re-renders during scroll."

---

## Q7: Explain React's Suspense and how it works with data fetching, code splitting, and streaming SSR.

### What Suspense Actually Does

```
Suspense is React's mechanism for handling async operations declaratively.
When a component "suspends" (throws a Promise), Suspense catches it,
shows a fallback, and re-renders when the Promise resolves.

Under the hood:
  1. Component throws a Promise during render
  2. Nearest <Suspense> boundary catches it
  3. Fallback UI is shown
  4. When Promise resolves, React re-renders the component
  5. Component renders successfully with data
```

### 1. Code Splitting with React.lazy

```jsx
import { Suspense, lazy } from 'react';

// lazy() creates a component that loads its code on demand
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));
const Analytics = lazy(() => import('./Analytics'));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/dashboard" element={
          <Suspense fallback={<DashboardSkeleton />}>
            <Dashboard />
          </Suspense>
        } />
        <Route path="/settings" element={
          <Suspense fallback={<SettingsSkeleton />}>
            <Settings />
          </Suspense>
        } />
      </Routes>
    </Suspense>
  );
}

// Nested Suspense for granular loading states
function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />   {/* Loads chart library lazily */}
      </Suspense>
      
      <Suspense fallback={<TableSkeleton />}>
        <DataTable />      {/* Loads table library lazily */}
      </Suspense>
    </div>
  );
}
```

### 2. Data Fetching with Suspense

```jsx
// The "use" hook (React 19) — native Suspense data fetching
import { use, Suspense } from 'react';

// Create a promise OUTSIDE the component (or in a parent)
async function fetchUser(id) {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

function UserProfile({ userPromise }) {
  // `use` suspends the component until the promise resolves
  const user = use(userPromise);
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

function App() {
  const [userId, setUserId] = useState(1);
  
  // Promise is created here — component below suspends until it resolves
  const userPromise = fetchUser(userId);
  
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}

// With TanStack Query (most common pattern)
function UserList() {
  const { data: users } = useSuspenseQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
  // No loading check needed — Suspense handles it
  // `users` is GUARANTEED to exist here
  
  return (
    <ul>
      {users.map(u => <li key={u.id}>{u.name}</li>)}
    </ul>
  );
}

// Wrap with Suspense
<Suspense fallback={<UserListSkeleton />}>
  <UserList />
</Suspense>
```

### 3. Streaming SSR with Suspense

```jsx
// Next.js App Router / React 18 streaming SSR

// Server component with async data
async function ProductPage({ params }) {
  // This data loads immediately
  const product = await db.products.findById(params.id);
  
  return (
    <div>
      {/* Sent immediately in first HTML chunk */}
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      
      {/* STREAMED later — browser shows fallback first */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews productId={params.id} />
      </Suspense>
      
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations category={product.category} />
      </Suspense>
    </div>
  );
}

// How streaming works:
//
// Browser receives HTML in chunks:
//
// Chunk 1 (immediate):
//   <h1>MacBook Pro</h1>
//   <p>The most powerful...</p>
//   <div id="reviews-fallback">Loading reviews...</div>
//   <div id="recs-fallback">Loading recommendations...</div>
//
// Chunk 2 (when Reviews data is ready):
//   <script>
//     // Replace #reviews-fallback with actual content
//     $RC("reviews-fallback", "<div>★★★★★ Great product...</div>")
//   </script>
//
// Chunk 3 (when Recommendations data is ready):
//   <script>
//     $RC("recs-fallback", "<div>You might also like...</div>")
//   </script>
//
// Each chunk hydrates independently!
```

### Suspense Boundaries Strategy

```jsx
// ═══════ NESTED SUSPENSE = PROGRESSIVE LOADING ═══════

function DashboardPage() {
  return (
    // Outer boundary — catches everything if inner boundaries haven't loaded
    <Suspense fallback={<FullPageSkeleton />}>
      
      {/* Header loads first */}
      <Header />
      
      <div className="grid">
        {/* Each widget has its own loading state */}
        <Suspense fallback={<WidgetSkeleton />}>
          <RevenueWidget />
        </Suspense>
        
        <Suspense fallback={<WidgetSkeleton />}>
          <UsersWidget />
        </Suspense>
        
        <Suspense fallback={<WidgetSkeleton />}>
          <OrdersWidget />
        </Suspense>
      </div>
      
    </Suspense>
  );
}

// Loading sequence:
// 1. Full page skeleton appears
// 2. Header renders (fast)
// 3. Revenue widget appears (API responds first)
// 4. Users widget appears
// 5. Orders widget appears last
//
// Each widget loads independently — no waterfall!


// ═══════ SuspenseList (experimental) — COORDINATED LOADING ═══════
<SuspenseList revealOrder="forwards" tail="collapsed">
  <Suspense fallback={<Skeleton />}><Section1 /></Suspense>
  <Suspense fallback={<Skeleton />}><Section2 /></Suspense>
  <Suspense fallback={<Skeleton />}><Section3 /></Suspense>
</SuspenseList>
// Sections appear top-to-bottom in order,
// even if Section3 loads before Section1
```

### Error Boundaries + Suspense

```jsx
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary
      fallback={<ErrorPage />}
      onError={(error) => logToService(error)}
    >
      <Suspense fallback={<AppSkeleton />}>
        <MainContent />
      </Suspense>
    </ErrorBoundary>
  );
}

// If MainContent's data fetch fails:
// 1. Promise rejects
// 2. React turns rejection into an error
// 3. ErrorBoundary catches it
// 4. ErrorPage is shown

// Per-component error handling:
<ErrorBoundary fallback={<WidgetError />}>
  <Suspense fallback={<WidgetSkeleton />}>
    <RevenueWidget />
  </Suspense>
</ErrorBoundary>
```

### Interview Tip
> "Suspense is React's answer to three async problems: code splitting (lazy), data fetching (use/useSuspenseQuery), and streaming SSR. The key insight is that Suspense boundaries are like try/catch for async — they catch thrown Promises and show fallback UI. In streaming SSR, each Suspense boundary creates an independent streaming chunk, so slow data doesn't block fast content. I structure boundaries granularly: outer boundary for catastrophic failures, inner boundaries per widget/section for progressive loading."

---

## Q8: How do you decide between React Context, Redux, Zustand, Jotai, or Recoil for state management?

### The Decision Framework

```
                    ┌───────────────────────────┐
                    │  What kind of state?       │
                    └──────────┬────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                 ▼
        UI/Local State    Shared Client     Server/Async
        (form inputs,     State (auth,      State (API data,
         toggles,         theme, cart,       cache, sync)
         modals)          notifications)
              │                │                 │
              ▼                ▼                 ▼
         useState /       See decision         TanStack Query
         useReducer       tree below           or SWR
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                 ▼
         Small/Simple    Medium/Complex    Large/Enterprise
         (2-3 consumers,  (10+ consumers,  (50+ components,
          rarely changes)  frequent updates) complex flows,
              │                │              team of 10+)
              ▼                ▼                 ▼
         React Context    Zustand / Jotai    Redux Toolkit
```

### React Context — When and Why

```jsx
// ✅ GOOD FOR: Infrequently changing, widely-needed values
//   - Theme (light/dark)
//   - Authentication state
//   - Locale/i18n
//   - Feature flags

// ❌ BAD FOR: Frequently changing state (causes re-renders of ALL consumers)

// THE PROBLEM:
const AppContext = createContext();

function Provider({ children }) {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  return (
    <AppContext.Provider value={{ theme, user, notifications, setTheme, setUser }}>
      {children}
    </AppContext.Provider>
  );
}

// When notifications change (frequently), EVERY component that
// consumes AppContext re-renders — even if they only use theme

// ✅ FIX: Split into separate contexts
const ThemeContext = createContext();       // Rarely changes
const AuthContext = createContext();        // Changes on login/logout
const NotificationContext = createContext(); // Changes frequently
// Now notification updates only re-render notification consumers
```

### Zustand — The Sweet Spot

```jsx
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';

// ✅ GOOD FOR:
//   - Medium complexity apps
//   - Teams that want simplicity
//   - When you need selectors without re-render overhead
//   - When you want persistence/devtools without boilerplate

const useStore = create(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        // State
        cart: [],
        total: 0,
        
        // Actions
        addItem: (item) => set(state => {
          const cart = [...state.cart, item];
          return { cart, total: cart.reduce((sum, i) => sum + i.price, 0) };
        }),
        
        removeItem: (id) => set(state => {
          const cart = state.cart.filter(i => i.id !== id);
          return { cart, total: cart.reduce((sum, i) => sum + i.price, 0) };
        }),
        
        // Computed (using get)
        getItemCount: () => get().cart.length,
      })),
      { name: 'cart-store' }  // persist to localStorage
    )
  )
);

// Usage — selector prevents re-render unless selected state changes
function CartCount() {
  const count = useStore(state => state.cart.length);
  // Only re-renders when cart.length changes, not when total changes
  return <span>{count}</span>;
}

function CartTotal() {
  const total = useStore(state => state.total);
  return <span>${total}</span>;
}

// WHY Zustand over Context:
// 1. Built-in selectors → granular re-renders
// 2. No Provider wrapper needed
// 3. Works outside React (vanilla JS)
// 4. Tiny bundle (1KB)
// 5. Middleware ecosystem (devtools, persist, immer)
```

### Jotai — Atomic State

```jsx
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

// ✅ GOOD FOR:
//   - Component-level state that needs to be shared
//   - Derived/computed state
//   - When state relationships form a graph (not a tree)
//   - Fine-grained reactivity (like signals)

// Primitive atoms
const countAtom = atom(0);
const nameAtom = atom('Alice');
const darkModeAtom = atom(false);

// Derived atom (computed from other atoms)
const doubleCountAtom = atom(get => get(countAtom) * 2);

// Async derived atom
const userAtom = atom(async (get) => {
  const id = get(userIdAtom);
  const res = await fetch(`/api/users/${id}`);
  return res.json();
});

// Writable derived atom
const uppercaseNameAtom = atom(
  (get) => get(nameAtom).toUpperCase(),          // read
  (get, set, newName) => set(nameAtom, newName)  // write
);

// Usage — each atom subscription is independent
function Counter() {
  const [count, setCount] = useAtom(countAtom);
  // Only re-renders when countAtom changes
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

function DisplayName() {
  const name = useAtomValue(uppercaseNameAtom);
  // Only re-renders when nameAtom changes
  return <p>{name}</p>;
}

// WHY Jotai:
// 1. Bottom-up state management (atoms compose)
// 2. No store definition — atoms are the store
// 3. Built-in async support
// 4. No selectors needed — each atom is its own selector
// 5. Works perfectly with Suspense
```

### Redux Toolkit — Enterprise Scale

```jsx
// ✅ GOOD FOR:
//   - Large teams (20+ developers)
//   - Complex state logic (workflows, undo/redo)
//   - When you need strict unidirectional data flow
//   - When debugging time-travel is essential
//   - When you have complex async workflows (RTK Query, sagas)

import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// RTK Query — handles caching, dedup, polling, optimistic updates
const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['User', 'Post'],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => '/users',
      providesTags: ['User'],
    }),
    createUser: builder.mutation({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['User'],  // Auto-refetch users list
    }),
  }),
});

// WHY Redux Toolkit:
// 1. Enforced patterns → consistency across large teams
// 2. Redux DevTools → time-travel debugging
// 3. RTK Query → eliminates most data fetching boilerplate
// 4. Middleware → logging, analytics, side effects
// 5. Ecosystem → proven at scale (Meta, Amazon, etc.)
```

### Comparison Table

```
Feature          Context   Zustand   Jotai    Redux TK
──────────────────────────────────────────────────────
Bundle size      0 KB      ~1 KB     ~3 KB    ~11 KB
Boilerplate      Low       Very Low  Very Low Medium
Learning curve   Easy      Easy      Easy     Moderate
Selector support No*       Yes       Built-in Yes
DevTools         No        Yes       Yes      Excellent
Middleware       No        Yes       Yes      Extensive
SSR support      Yes       Yes       Yes      Yes
TypeScript       Good      Excellent Excellent Excellent
Async support    Manual    Manual    Built-in RTK Query
Re-render scope  Broad**   Granular  Granular Granular
Team scale       Small     Small-Med Small-Med Large
Persistence      Manual    Middleware Atoms    Middleware

* Context re-renders all consumers on any change
** Unless split into multiple contexts
```

### Interview Tip
> "My decision framework: First, separate server state (use TanStack Query) from client state. For client state: if it's only needed by a few nearby components, use useState/useReducer. If it's needed widely but changes rarely (theme, auth), React Context is fine. For frequently-changing shared state, I choose Zustand for most projects — it has the best simplicity-to-power ratio. I'd only reach for Redux Toolkit if the team is large (15+) and we need strict patterns, RTK Query, and time-travel debugging. Jotai is my pick when state is highly granular and interconnected — like complex form builders or canvas applications."

---

## Q9: How would you migrate a large class-component codebase to hooks without regressions?

### Migration Strategy

```
Phase 1: Foundation (Week 1-2)
  ├── Set up testing infrastructure
  ├── Enable strict mode warnings
  └── Create shared hooks library

Phase 2: Bottom-Up Migration (Ongoing)
  ├── Migrate leaf components first (no children)
  ├── Move up the tree gradually
  └── Keep class → hook adapters at boundaries

Phase 3: Complex Patterns (As needed)
  ├── HOCs → Custom hooks
  ├── Render props → Custom hooks
  └── Class lifecycle → useEffect patterns

Phase 4: Cleanup
  ├── Remove adapter layers
  ├── Remove unused class utilities
  └── Update documentation
```

### Rule #1: Add Tests Before Migrating

```jsx
// Before touching ANY class component, write integration tests
// Test behavior, not implementation

import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Test the class component FIRST (baseline)
describe('UserProfile', () => {
  it('loads and displays user data', async () => {
    render(<UserProfile userId="123" />);
    
    // Loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    // Loaded state
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });
  
  it('handles error state', async () => {
    server.use(rest.get('/api/users/:id', (req, res, ctx) => 
      res(ctx.status(500))
    ));
    
    render(<UserProfile userId="123" />);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
  
  it('refetches when userId changes', async () => {
    const { rerender } = render(<UserProfile userId="123" />);
    await waitFor(() => expect(screen.getByText('Alice')));
    
    rerender(<UserProfile userId="456" />);
    await waitFor(() => expect(screen.getByText('Bob')));
  });
});

// SAME tests run against the migrated functional component
// If they pass → migration is correct
```

### Pattern: Class Component → Functional Component

```jsx
// ═══════ BEFORE: Class Component ═══════
class UserProfile extends React.Component {
  state = {
    user: null,
    loading: true,
    error: null,
  };
  
  componentDidMount() {
    this.fetchUser();
  }
  
  componentDidUpdate(prevProps) {
    if (prevProps.userId !== this.props.userId) {
      this.fetchUser();
    }
  }
  
  componentWillUnmount() {
    this.abortController?.abort();
  }
  
  async fetchUser() {
    this.abortController = new AbortController();
    this.setState({ loading: true, error: null });
    
    try {
      const res = await fetch(`/api/users/${this.props.userId}`, {
        signal: this.abortController.signal,
      });
      const user = await res.json();
      this.setState({ user, loading: false });
    } catch (err) {
      if (err.name !== 'AbortError') {
        this.setState({ error: err.message, loading: false });
      }
    }
  }
  
  render() {
    const { user, loading, error } = this.state;
    if (loading) return <Spinner />;
    if (error) return <Error message={error} />;
    return <div>{user.name}</div>;
  }
}


// ═══════ AFTER: Functional Component with Custom Hook ═══════

// Step 1: Extract reusable logic into a custom hook
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    
    fetch(url, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setLoading(false);
        }
      });
    
    return () => controller.abort();
  }, [url]);
  
  return { data, loading, error };
}

// Step 2: Simple functional component
function UserProfile({ userId }) {
  const { data: user, loading, error } = useFetch(`/api/users/${userId}`);
  
  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  return <div>{user.name}</div>;
}
```

### Lifecycle Method Mapping

```
Class Method                    →  Hook Equivalent
──────────────────────────────────────────────────────────────────
constructor(props)              →  useState(initialState) or
                                   function body (runs every render)

componentDidMount               →  useEffect(() => { ... }, [])

componentDidUpdate(prevProps)   →  useEffect(() => { ... }, [dep])
                                   + useRef for "previous value" comparison

componentWillUnmount            →  useEffect cleanup: return () => { ... }

shouldComponentUpdate           →  React.memo(Component, areEqual)

getDerivedStateFromProps        →  Update state during render
                                   (call setState in function body conditionally)

getSnapshotBeforeUpdate         →  useLayoutEffect (partial equivalent)

componentDidCatch /             →  No hook equivalent — keep class ErrorBoundary
  static getDerivedStateFromError   or use react-error-boundary library

forceUpdate                     →  useReducer hack:
                                   const [, forceUpdate] = useReducer(x => x + 1, 0)
```

### Migrating HOCs to Custom Hooks

```jsx
// ═══════ BEFORE: HOC Pattern ═══════
function withAuth(WrappedComponent) {
  return class extends React.Component {
    state = { user: null, loading: true };
    
    componentDidMount() {
      authService.getUser().then(user => 
        this.setState({ user, loading: false })
      );
    }
    
    render() {
      if (this.state.loading) return <Spinner />;
      if (!this.state.user) return <Redirect to="/login" />;
      return <WrappedComponent {...this.props} user={this.state.user} />;
    }
  };
}

const ProtectedDashboard = withAuth(Dashboard);


// ═══════ AFTER: Custom Hook ═══════
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    authService.getUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);
  
  return { user, loading, isAuthenticated: !!user };
}

function ProtectedRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
}

// Usage — much clearer than HOC wrapping
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

### Gradual Migration — Interop Layer

```jsx
// Class component can use hook logic via a wrapper
function withHook(Component, useHookFn) {
  return function WrappedComponent(props) {
    const hookData = useHookFn(props);
    return <Component {...props} {...hookData} />;
  };
}

// Use this to incrementally add hook-based logic to class components
// without fully rewriting them
const EnhancedClassComponent = withHook(
  MyClassComponent,
  (props) => {
    const theme = useTheme();
    const { data } = useQuery(['user', props.id], fetchUser);
    return { theme, userData: data };
  }
);
```

### Interview Tip
> "The key to a successful migration is: test first, migrate bottom-up, and never rush. I write behavioral tests for each class component before touching it — then the same tests validate the functional version. I migrate leaf components first because they have no class-component children to worry about. For the transition period, I use interop wrappers so class components can consume hook-based logic. Error boundaries stay as class components because there's no hook equivalent. The biggest win isn't hooks themselves — it's extracting shared logic into custom hooks that are testable and composable."

---

## Q10: Explain the Compiler in React 19 (React Forget). How does it eliminate the need for `useMemo` and `useCallback`?

### The Problem React Compiler Solves

```jsx
// ═══════ WITHOUT COMPILER ═══════
// Developers must manually optimize re-renders

function ProductList({ products, onSelect }) {
  // ❌ Without memoization — creates new array every render
  const sorted = products.sort((a, b) => a.price - b.price);
  
  // ❌ Without useCallback — creates new function every render
  const handleClick = (id) => {
    analytics.track('click', id);
    onSelect(id);
  };
  
  return sorted.map(p => (
    // ❌ Without React.memo — ProductCard re-renders even if props unchanged
    <ProductCard key={p.id} product={p} onClick={() => handleClick(p.id)} />
  ));
}

// ✅ Manual optimization (what devs do today)
function ProductList({ products, onSelect }) {
  const sorted = useMemo(
    () => [...products].sort((a, b) => a.price - b.price),
    [products]
  );
  
  const handleClick = useCallback((id) => {
    analytics.track('click', id);
    onSelect(id);
  }, [onSelect]);
  
  return sorted.map(p => (
    <MemoizedProductCard key={p.id} product={p} onClick={handleClick} />
  ));
}

const MemoizedProductCard = React.memo(ProductCard);

// Problems with manual optimization:
// 1. Easy to forget (performance cliff)
// 2. Easy to get wrong (stale closures from wrong deps)
// 3. Adds visual noise to code
// 4. Devs spend time on memoization instead of features
// 5. Over-memoization wastes memory
```

### How React Compiler Works

```
React Compiler (formerly "React Forget") is a BUILD-TIME compiler
that automatically adds memoization to your components.

Source Code (what you write):
  function ProductList({ products, onSelect }) {
    const sorted = products.sort((a, b) => a.price - b.price);
    const handleClick = (id) => onSelect(id);
    return sorted.map(p => <ProductCard key={p.id} onClick={handleClick} />);
  }

Compiled Output (what runs):
  function ProductList({ products, onSelect }) {
    // Compiler auto-inserts memoization
    const $ = useMemoCache(4);  // Internal cache slots
    
    let sorted;
    if ($[0] !== products) {
      sorted = products.sort((a, b) => a.price - b.price);
      $[0] = products;
      $[1] = sorted;
    } else {
      sorted = $[1];
    }
    
    let handleClick;
    if ($[2] !== onSelect) {
      handleClick = (id) => onSelect(id);
      $[2] = onSelect;
      $[3] = handleClick;
    } else {
      handleClick = $[3];
    }
    
    // Return is also memoized based on dependencies
    return sorted.map(p => <ProductCard key={p.id} onClick={handleClick} />);
  }
```

### What the Compiler Understands

```javascript
// The compiler performs STATIC ANALYSIS to understand:

// 1. DEPENDENCY TRACKING — what values does each expression depend on?
const filtered = items.filter(i => i.active);
// Depends on: items (and the identity of items)

// 2. PURITY ANALYSIS — is this expression free of side effects?
const total = prices.reduce((a, b) => a + b, 0);  // ✅ Pure
fetchData();  // ❌ Side effect — compiler won't memoize

// 3. REFERENTIAL STABILITY — when should a new reference be created?
const style = { color: 'red' };  // New object every render → compiler caches it
const handler = () => setState(x);  // New function every render → compiler caches it

// 4. COMPONENT BOUNDARIES — auto-memo for child components
<ChildComponent data={data} />
// Compiler determines if ChildComponent needs re-rendering
// based on whether its props have changed
```

### Rules of React — What the Compiler Enforces

```jsx
// The compiler relies on "Rules of React" — violations break it

// RULE 1: Components must be pure during rendering
// ✅ OK
function Good({ items }) {
  const filtered = items.filter(i => i.active);  // Pure computation
  return <List items={filtered} />;
}

// ❌ BAD — side effect during render
function Bad({ items }) {
  globalCounter++;  // Mutation during render — compiler can't optimize
  return <List items={items} />;
}

// RULE 2: Props and state are immutable
// ✅ OK
function Good() {
  const [items, setItems] = useState([]);
  setItems([...items, newItem]);  // New array
}

// ❌ BAD — mutating props/state
function Bad({ items }) {
  items.push(newItem);  // Mutating prop — compiler assumes immutability
}

// RULE 3: Hooks follow the rules of hooks
// ✅ Called at top level, same order every render
// ❌ No hooks in conditions, loops, or nested functions

// The compiler adds an ESLint plugin to catch violations:
// eslint-plugin-react-compiler
```

### Migration Path

```javascript
// babel.config.js or next.config.js
module.exports = {
  experimental: {
    reactCompiler: true,
  },
};

// Gradual adoption with directive (like 'use client')
// Only compile specific components:
function MyComponent() {
  'use memo';  // Opt-in this component to the compiler
  // ... component code
}

// Or opt-out specific components:
function LegacyComponent() {
  'use no memo';  // Skip compiler for this component
  // ... code that violates Rules of React
}
```

### What You Can Remove After Compiler

```jsx
// BEFORE (manual optimization):
const MemoizedChild = React.memo(ChildComponent);

function Parent({ data }) {
  const processed = useMemo(() => expensiveCalc(data), [data]);
  const handler = useCallback((id) => doSomething(id), []);
  
  return <MemoizedChild data={processed} onClick={handler} />;
}

// AFTER (with compiler — same performance, cleaner code):
function Parent({ data }) {
  const processed = expensiveCalc(data);
  const handler = (id) => doSomething(id);
  
  return <ChildComponent data={processed} onClick={handler} />;
}

// The compiler automatically:
// 1. Memoizes `processed` (caches based on `data`)
// 2. Memoizes `handler` (caches based on closure deps)
// 3. Memoizes the JSX element (skips re-render if props unchanged)
```

### Interview Tip
> "React Compiler is a paradigm shift — it moves optimization from runtime developer decisions to build-time compiler analysis. Instead of developers guessing WHERE to put useMemo and useCallback (and often getting it wrong), the compiler analyzes data flow and automatically caches every expression, function, and JSX element based on its actual dependencies. The trade-off is that your code must follow the Rules of React (pure renders, immutable state) — but those are rules you should follow anyway. It's like moving from manual memory management (C) to garbage collection (Java) — the machine does it better than humans."

---

## Q11: How would you compare React, Vue 3, Svelte, and Solid.js in terms of reactivity models and performance?

### Reactivity Models at a Glance

```
React:      PULL-based | Virtual DOM diffing | "Tell me what changed" (setState)
Vue 3:      PUSH-based | Proxy-tracked dependencies | Auto-detects changes  
Svelte:     COMPILE-time | No runtime reactivity | Compiler generates DOM updates
Solid.js:   PUSH-based | Fine-grained signals | No Virtual DOM, direct DOM updates
```

### React — Schedule and Diff

```jsx
// React's model: Components are functions. Call them again to get new output.
// Then diff old vs new output to find minimum DOM updates.

function Counter() {
  const [count, setCount] = useState(0);
  
  // When setCount is called:
  // 1. React schedules a re-render
  // 2. Counter() function is called AGAIN (entire function body re-runs)
  // 3. New JSX is compared to previous JSX (virtual DOM diff)
  // 4. Only actual DOM differences are applied
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <ExpensiveChild />  {/* Re-renders too unless memoized! */}
    </div>
  );
}

// TRADE-OFFS:
// ✅ Simple mental model (function → JSX)
// ✅ Concurrent rendering (Fiber can pause/resume)
// ✅ Ecosystem maturity
// ❌ Overhead of diffing (virtual DOM comparison)
// ❌ Must manually optimize (useMemo, memo) — or use compiler
// ❌ Entire component re-runs on any state change
```

### Vue 3 — Proxy-Based Reactive Tracking

```javascript
// Vue's model: Wrap state in reactive Proxy. Track which template
// expressions read which state. Only re-run affected expressions.

import { ref, computed, watchEffect, reactive } from 'vue';

// Reactive primitives
const count = ref(0);
const name = ref('Alice');

// Reactive objects (Proxy-wrapped)
const state = reactive({
  items: [],
  filter: '',
});

// Computed (auto-tracked dependency)
const doubleCount = computed(() => count.value * 2);
// Vue automatically knows: doubleCount depends on count
// Only re-runs when count changes

// How it works under the hood:
// 1. Template/render function runs → accesses count.value
// 2. Proxy's "get" trap records: "this render depends on count"
// 3. When count changes → Proxy's "set" trap fires
// 4. Vue re-runs ONLY the parts of the template that use count
// 5. Patches DOM directly (virtual DOM diff but scoped)

// TRADE-OFFS:
// ✅ Fine-grained tracking (only affected parts update)
// ✅ No manual memoization needed
// ✅ Intuitive reactive model
// ❌ Proxy overhead for every property access
// ❌ .value unwrapping for refs
// ❌ Reactive system has edge cases (deeply nested, Map/Set)
```

### Svelte — Compiler-Based Reactivity

```svelte
<!-- Svelte's model: The COMPILER transforms your code into
     imperative DOM update instructions. No runtime framework. -->

<script>
  let count = 0;       // Just a variable — Svelte tracks assignments
  let name = 'Alice';
  
  // Reactive declaration (re-runs when dependencies change)
  $: doubled = count * 2;
  $: console.log(`Count is ${count}`);
  
  function increment() {
    count += 1;  // Simple assignment triggers update
  }
</script>

<p>Count: {count}</p>
<p>Doubled: {doubled}</p>
<button on:click={increment}>+</button>

<!--
  Compiler output (simplified):
  
  function increment() {
    count += 1;
    $$invalidate('count', count);  // Compiler-inserted
  }
  
  // Update function (compiler-generated)
  function update() {
    if (changed.count) {
      set_text(p1_text, count);          // Direct DOM update
      doubled = count * 2;               // Recompute derived
      set_text(p2_text, doubled);        // Direct DOM update
    }
  }
  
  No virtual DOM. No diffing. Direct DOM manipulation.
-->

<!-- TRADE-OFFS: -->
<!-- ✅ Smallest bundle size (no runtime framework) -->
<!-- ✅ Fastest initial load -->
<!-- ✅ No virtual DOM overhead -->
<!-- ✅ Truly reactive (assignments trigger updates) -->
<!-- ❌ Compiler-specific syntax ($:, special stores) -->
<!-- ❌ Smaller ecosystem -->
<!-- ❌ Can't do runtime component creation as easily -->
```

### Solid.js — Fine-Grained Signals (No Virtual DOM)

```jsx
// Solid's model: Signals + fine-grained DOM updates.
// Components run ONCE. Only signal subscriptions update.

import { createSignal, createMemo, createEffect, Show, For } from 'solid-js';

function Counter() {
  const [count, setCount] = createSignal(0);
  const doubled = createMemo(() => count() * 2);
  
  // This console.log only runs when count changes
  createEffect(() => {
    console.log(`Count is ${count()}`);
  });
  
  // THE KEY DIFFERENCE:
  // This function body runs ONLY ONCE (not on every update)
  // Only the {count()} expression updates in the DOM
  
  return (
    <div>
      <p>Count: {count()}</p>        {/* Only this text node updates */}
      <p>Doubled: {doubled()}</p>    {/* Only this text node updates */}
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <ExpensiveChild />             {/* NEVER re-runs (not reactive) */}
    </div>
  );
}

// How it works:
// 1. Component function runs ONCE → creates real DOM
// 2. Signal access (count()) creates a subscription
// 3. When signal changes, ONLY the subscribed DOM node updates
// 4. No diffing, no component re-execution, no virtual DOM

// TRADE-OFFS:
// ✅ Fastest update performance (direct DOM, no diffing)
// ✅ No memo/callback needed (signals are inherently memoized)
// ✅ Components run once (no unnecessary work)
// ✅ JSX syntax (familiar to React developers)
// ❌ Different mental model (signals, not re-render)
// ❌ Can't destructure props (breaks reactivity)
// ❌ Smaller ecosystem
// ❌ No concurrent rendering (React-specific)
```

### Performance Comparison

```
Benchmark: JS Framework Benchmark (thousands of operations)

Operation         React    Vue 3    Svelte   Solid
──────────────────────────────────────────────────
Create 1K rows    ~45ms    ~38ms    ~35ms    ~32ms
Update 1K rows    ~40ms    ~25ms    ~15ms    ~12ms
Partial update    ~35ms    ~15ms    ~10ms    ~8ms
Select row        ~5ms     ~3ms     ~2ms     ~1ms
Swap rows         ~35ms    ~20ms    ~12ms    ~10ms
Remove row        ~30ms    ~18ms    ~12ms    ~10ms
Create 10K rows   ~450ms   ~380ms   ~350ms   ~310ms
Memory usage      Higher   Medium   Lower    Lowest

Startup (bundle):
  React 18:     ~42KB gzipped (react + react-dom)
  Vue 3:        ~33KB gzipped
  Svelte:       ~2KB gzipped (just the compiled output)
  Solid:        ~7KB gzipped
```

### When to Choose What

```
Choose REACT when:
  - Large team, need ecosystem maturity
  - Need concurrent rendering (real-time collaborative)
  - React Native is needed
  - Existing React codebase
  - Server Components / RSC architecture

Choose VUE 3 when:
  - Team values simplicity + power balance
  - Template-based development preferred
  - Need excellent documentation
  - Building admin panels, dashboards
  - Nuxt for full-stack

Choose SVELTE when:
  - Performance is critical (edge computing, embedded)
  - Bundle size matters (widget, embed)
  - Team is small, values DX
  - SvelteKit for full-stack
  - Building interactive content / animations

Choose SOLID when:
  - Maximum runtime performance needed
  - Fine-grained reactivity without compromises
  - Team comfortable with signal-based mental model
  - Building performance-critical interactive UIs
  - SolidStart for full-stack
```

### Interview Tip
> "The fundamental difference is the granularity of updates. React re-runs entire component functions and diffs virtual DOM. Vue tracks dependencies at the expression level within templates. Svelte eliminates the runtime entirely — the compiler generates surgical DOM updates. Solid uses signals for truly fine-grained updates where only the specific text node or attribute changes. Each approach trades off between developer experience, ecosystem, and performance. React's advantage isn't raw performance — it's concurrent rendering and ecosystem. For most apps, React is 'fast enough,' and the developer experience and tooling outweigh the microsecond differences."

---

## Q12: What are Islands Architecture and Partial Hydration? How do frameworks like Astro and Qwik implement them?

### The Hydration Problem

```
Traditional SSR + Hydration:

Server: Renders full HTML → sends to browser
Browser: 
  1. Shows HTML immediately (fast First Paint)
  2. Downloads ALL JavaScript for ALL components
  3. Hydrates EVERYTHING — re-creates React tree, attaches event listeners
  4. Page becomes interactive

PROBLEM:
  - 95% of a blog page is static text → needs ZERO JavaScript
  - But traditional hydration downloads and executes JS for EVERYTHING
  - A 200KB article page ships 500KB+ JS just to hydrate a newsletter form
  
  This is "full hydration" — the JS cost scales with PAGE SIZE,
  not with INTERACTIVITY
```

### Islands Architecture (Astro)

```
Islands Architecture:

  ┌─────────────────────────────────────────────────────┐
  │                Static HTML (no JS)                   │
  │                                                     │
  │  ┌──────────┐                    ┌──────────┐      │
  │  │ 🏝 Island │                    │ 🏝 Island │      │
  │  │ (Search) │                    │ (Cart)   │      │
  │  │ React    │                    │ React    │      │
  │  │ hydrated │                    │ hydrated │      │
  │  └──────────┘                    └──────────┘      │
  │                                                     │
  │  Static content... no JS needed for this...         │
  │                                                     │
  │  ┌─────────────────────┐                            │
  │  │ 🏝 Island            │                            │
  │  │ (Comments section)  │                            │
  │  │ Vue                 │                            │
  │  │ hydrated on visible │                            │
  │  └─────────────────────┘                            │
  │                                                     │
  │  More static content...                             │
  └─────────────────────────────────────────────────────┘

KEY:
  - The "sea" is static HTML (zero JS)
  - "Islands" are interactive components (each hydrated independently)
  - Each island can use a DIFFERENT framework
  - Islands can hydrate on different triggers (load, visible, idle, click)
```

### Astro Implementation

```astro
---
// Astro component (runs on server only, zero JS shipped)
// page.astro

import Header from '../components/Header.astro';     // Static — no JS
import SearchBar from '../components/SearchBar.jsx';  // React island
import Comments from '../components/Comments.vue';    // Vue island
import Newsletter from '../components/Newsletter.svelte'; // Svelte island

const posts = await fetch('/api/posts').then(r => r.json());
---

<html>
<body>
  <!-- Static — zero JavaScript -->
  <Header />
  
  <h1>Blog Post Title</h1>
  <p>This is static content rendered at build time...</p>
  <p>No JavaScript is loaded for any of this text.</p>
  
  <!-- Interactive Island — hydrates immediately -->
  <SearchBar client:load />
  
  <!-- Interactive Island — hydrates when visible (scroll into view) -->
  <Comments client:visible postId={post.id} />
  
  <!-- Interactive Island — hydrates when browser is idle -->
  <Newsletter client:idle />
  
  <!-- Interactive Island — hydrates only on CLICK (zero JS until interaction) -->
  <LikeButton client:only="react" />
  
  <!-- More static content — zero JS -->
  <footer>
    <p>Copyright 2024</p>
  </footer>
</body>
</html>

<!--
  Hydration Directives:
  
  client:load      → Hydrate immediately on page load (highest priority)
  client:idle      → Hydrate when browser is idle (requestIdleCallback)
  client:visible   → Hydrate when element enters viewport (IntersectionObserver)
  client:media     → Hydrate when media query matches
  client:only      → Client-side render only (no SSR HTML)
  
  No directive = Static — ZERO JavaScript shipped
-->
```

### Result: Massive Performance Improvement

```
Traditional Next.js blog page:
  HTML: 50KB
  JavaScript: 300KB (React + hydration for everything)
  TTI: 3.2s
  
Same page with Astro Islands:
  HTML: 50KB
  JavaScript: 15KB (only interactive components)
  TTI: 0.8s
  
  JS reduction: 95%
  TTI improvement: 4x
```

### Qwik — Resumability (Beyond Islands)

```
Qwik takes a completely different approach: RESUMABILITY

Traditional Hydration:
  Server renders HTML → Client downloads JS → Re-executes component tree
  → Rebuilds event listeners → Interactive
  
  The problem: Hydration is REPLAYING what the server already did

Qwik's Resumability:
  Server renders HTML + serializes state/listeners → Client loads page
  → NO re-execution → Listeners are lazy-loaded on first interaction
  → Interactive IMMEDIATELY

  No hydration step at all — the app "resumes" where the server left off
```

```jsx
// Qwik component
import { component$, useSignal, $ } from '@builder.io/qwik';

export const Counter = component$(() => {
  const count = useSignal(0);
  
  // The $ suffix tells Qwik this function is lazy-loadable
  const increment = $(() => {
    count.value++;
  });
  
  return (
    <div>
      <p>Count: {count.value}</p>
      <button onClick$={increment}>+</button>
    </div>
  );
});

// What Qwik generates in HTML:
// <button on:click="counter_increment_abc123.js#increment">+</button>
//
// The click handler JavaScript is NOT downloaded until the button is clicked
// When clicked:
// 1. Qwik loads counter_increment_abc123.js (tiny chunk)
// 2. Executes the increment function
// 3. Updates the DOM
//
// Before the click: ZERO JavaScript executed
// This is "O(1) startup" — time-to-interactive doesn't scale with app size
```

### Qwik vs Astro vs Traditional

```
                    Traditional    Astro          Qwik
                    (Next/Remix)   (Islands)      (Resumable)
────────────────────────────────────────────────────────────
Initial JS          All            Islands only   Near zero
Hydration           Full page      Per island     None (resumable)
TTI scaling         O(n) page      O(n) islands   O(1) constant
MPA/SPA             SPA            MPA (default)  SPA
Framework mixing    No             Yes            No (Qwik only)
State serialization No             Per island     Full app state
Event handlers      All loaded     Per island     Lazy per handler
Best for            Complex SPAs   Content sites  Any (performance)
```

### Partial Hydration Strategies

```
1. PROGRESSIVE HYDRATION (React 18 Selective Hydration)
   - Suspense boundaries can hydrate independently
   - User interaction on a boundary → prioritize its hydration
   - Still downloads all JS, just prioritizes execution order

2. ISLAND HYDRATION (Astro)
   - Only ship JS for interactive "islands"
   - Static parts are pure HTML — zero JS
   - Each island hydrates independently
   - Different frameworks per island

3. RESUMABILITY (Qwik)
   - No hydration at all — serialize everything
   - Lazy-load handlers on first interaction
   - O(1) startup time regardless of app complexity

4. STREAMING + SELECTIVE HYDRATION (React 18)
   - Stream HTML in chunks (Suspense boundaries)
   - Hydrate chunks independently
   - Prioritize hydration of interacted elements

5. PARTIAL PRERENDERING (Next.js 14+)
   - Static shell rendered at build time
   - Dynamic holes filled at request time (streaming)
   - Combines static + dynamic in one response
```

### Implementation Decision Guide

```
Building a...

Content-heavy site (blog, docs, marketing):
  → Astro (minimal JS, island architecture)
  
E-commerce with mixed static/dynamic:
  → Next.js with PPR (Partial Prerendering)
  → Or Astro with React islands for interactive parts

Complex dashboard / SPA:
  → Next.js App Router (RSC + Suspense streaming)
  → Or Qwik (if TTI is critical)

Widget / embed:
  → Astro island or Svelte (smallest bundle)

Mobile-first, slow networks:
  → Qwik (O(1) startup, lazy everything)
  → Or Astro (minimal JS)
```

### Interview Tip
> "The evolution is: CSR → SSR → SSR+Hydration → Islands → Resumability. Each step reduces the JavaScript cost. Traditional hydration's problem is that it scales with page size — a 100-component page downloads and executes JS for all 100, even if only 3 are interactive. Islands architecture (Astro) solves this by only hydrating interactive components. Qwik goes further with resumability — zero hydration, lazy-load everything. For a team lead decision: Astro for content sites, Next.js App Router for complex apps, and Qwik when startup performance is the top priority."

---

## Quick Reference Cheat Sheet

| # | Topic | Key One-Liner |
|---|---|---|
| 1 | Fiber Architecture | Virtual call stack with linked-list fibers — enables pausing, prioritizing, and resuming render work |
| 2 | Server Components | Server = READ layer (zero JS), Client = INTERACT layer; boundary is `'use client'` |
| 3 | Reconciliation | Two heuristics (type check + key matching) reduce O(n³) tree diff to O(n) |
| 4 | useSyncExternalStore | Prevents tearing — guarantees consistent reads from external stores during concurrent renders |
| 5 | Effect Hooks | useInsertionEffect → useLayoutEffect → Paint → useEffect (insertion, measurement, side effects) |
| 6 | Large Lists | Virtualization (@tanstack/react-virtual) + useDeferredValue + Web Workers |
| 7 | Suspense | try/catch for async — catches thrown Promises, shows fallback, streams HTML chunks |
| 8 | State Management | Context for rare changes, Zustand for most apps, Redux TK for large teams, TanStack Query for server state |
| 9 | Class → Hooks | Test first, migrate bottom-up, use interop wrappers at boundaries, keep ErrorBoundary as class |
| 10 | React Compiler | Build-time auto-memoization — eliminates manual useMemo/useCallback via static analysis |
| 11 | Framework Comparison | React = VDOM diff, Vue = Proxy tracking, Svelte = compiled, Solid = signals + direct DOM |
| 12 | Islands & Resumability | Islands (Astro) = JS only for interactive parts; Resumability (Qwik) = zero hydration, O(1) startup |

---

> **Team Lead Tip:** At the leadership level, framework choice is a business decision, not just a technical one. Consider: team expertise (hiring pool), ecosystem maturity (libraries, tools), long-term maintenance, and alignment with product requirements. React wins on ecosystem and hiring. Vue wins on developer satisfaction. Svelte/Solid win on performance. Astro/Qwik win on content-heavy sites. The best choice depends on context — and being able to articulate that reasoning is what separates a senior developer from a team lead.
