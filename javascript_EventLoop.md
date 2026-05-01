# React & JavaScript Interview Preparation Guide
## For 9+ Years Experience | Senior/Lead Level

---

# PART 1: JAVASCRIPT CORE CONCEPTS

---

## 1. Event Loop

JavaScript is single-threaded. The event loop is the mechanism that handles asynchronous operations.

### How It Works

```
┌──────────────────────────┐
│       Call Stack          │  ← Executes synchronous code
└──────────┬───────────────┘
           │ (empty?)
           ▼
┌──────────────────────────┐
│    Microtask Queue        │  ← Promises, queueMicrotask
│    (HIGH PRIORITY)        │     Drains completely first
└──────────┬───────────────┘
           │ (empty?)
           ▼
┌──────────────────────────┐
│    Macrotask Queue        │  ← setTimeout, setInterval,
│    (LOW PRIORITY)         │     DOM events, fetch callbacks
└──────────────────────────┘
```

### Example — Predict the Output

```js
console.log('1');

setTimeout(() => {
  console.log('2');
}, 0);

Promise.resolve().then(() => {
  console.log('3');
});

console.log('4');

// Output: 1, 4, 3, 2
// Why? Synchronous code runs first (1, 4),
// then microtask (Promise → 3),
// then macrotask (setTimeout → 2)
```

### Tricky Example — Nested Microtasks

```js
setTimeout(() => console.log('A'), 0);

Promise.resolve()
  .then(() => {
    console.log('B');
    Promise.resolve().then(() => console.log('C'));
  })
  .then(() => console.log('D'));

console.log('E');

// Output: E, B, C, D, A
// Microtasks created inside microtasks run
// before any macrotask
```

### Real-World Bug Scenario

```js
let data = null;

fetch('/api/users')
  .then(res => res.json())
  .then(result => { data = result; });

setTimeout(() => {
  console.log(data); // Might still be null!
  // setTimeout is macrotask, but fetch response
  // timing is unpredictable
}, 0);
```

---

## 2. Closures

A closure is a function bundled with its lexical scope — it "remembers" variables from its parent even after the parent has finished executing.

### Basic Example

```js
function createCounter() {
  let count = 0; // Private variable

  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count
  };
}

const counter = createCounter();
counter.increment(); // 1
counter.increment(); // 2
counter.decrement(); // 1
counter.getCount();  // 1

// count is completely private — no way to
// access it directly from outside
```

### Data Encapsulation / Module Pattern

```js
const UserModule = (function () {
  // Private variables
  let users = [];
  let nextId = 1;

  // Private function
  function validate(user) {
    return user.name && user.email;
  }

  // Public API
  return {
    addUser(name, email) {
      const user = { id: nextId++, name, email };
      if (!validate(user)) throw new Error('Invalid');
      users.push(user);
      return user;
    },
    getUsers() {
      return [...users]; // Return copy, not reference
    },
    findById(id) {
      return users.find(u => u.id === id);
    }
  };
})();

UserModule.addUser('Vikrant', 'vikrant@test.com');
UserModule.getUsers(); // [{ id: 1, name: 'Vikrant', ... }]
// users array and nextId are completely private
```

### Closure Pitfall — Loop Variable

```js
// BUG: All callbacks log 3
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 3, 3, 3 (var is function-scoped)

// FIX 1: Use let (block-scoped)
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 0, 1, 2

// FIX 2: Use closure (IIFE)
for (var i = 0; i < 3; i++) {
  (function (j) {
    setTimeout(() => console.log(j), 100);
  })(i);
}
// Output: 0, 1, 2
```

---

## 3. Hoisting & Temporal Dead Zone

### var vs let vs const

```js
// var — hoisted with undefined
console.log(a); // undefined
var a = 10;

// let — hoisted but in Temporal Dead Zone
console.log(b); // ReferenceError!
let b = 20;

// const — same as let, plus immutable binding
console.log(c); // ReferenceError!
const c = 30;
```

### Function Hoisting

```js
// Function declarations are fully hoisted
greet(); // "Hello!" — works fine
function greet() {
  console.log('Hello!');
}

// Function expressions are NOT fully hoisted
sayHi(); // TypeError: sayHi is not a function
var sayHi = function () {
  console.log('Hi!');
};
```

### Temporal Dead Zone Explained

```js
let x = 'outer';

function example() {
  // TDZ starts here for inner x
  console.log(x); // ReferenceError! Not 'outer'
  // JavaScript knows x is declared below,
  // so it doesn't look at outer scope
  let x = 'inner'; // TDZ ends here
}
```

---

## 4. Prototypal Inheritance

### How It Works

```js
const animal = {
  speak() {
    return `${this.name} makes a sound`;
  }
};

const dog = Object.create(animal);
dog.name = 'Rex';
dog.bark = function () {
  return `${this.name} barks!`;
};

dog.speak(); // "Rex makes a sound" (inherited)
dog.bark();  // "Rex barks!" (own method)
```

### Prototype Chain

```js
const base = {
  type: 'base',
  describe() {
    return `I am ${this.type}`;
  }
};

const child = Object.create(base);
child.type = 'child';

const grandchild = Object.create(child);
grandchild.type = 'grandchild';

grandchild.describe(); // "I am grandchild"
// Looks up: grandchild → child → base → found describe()
```

### Extending Safely (Library Pattern)

```js
function createPlugin(baseMethods) {
  const proto = Object.create(baseMethods);

  return {
    extend(name, fn) {
      if (proto[name]) {
        throw new Error(`Method ${name} already exists`);
      }
      proto[name] = fn;
      return this;
    },
    create(config) {
      const instance = Object.create(proto);
      Object.assign(instance, config);
      return instance;
    }
  };
}

const myPlugin = createPlugin({
  init() { console.log('initialized'); },
  destroy() { console.log('destroyed'); }
});

myPlugin.extend('render', function () {
  console.log(`Rendering: ${this.name}`);
});

const widget = myPlugin.create({ name: 'Dashboard' });
widget.render();  // "Rendering: Dashboard"
widget.init();    // "initialized"
```

---

## 5. call, apply, bind

### Differences

```js
const person = {
  name: 'Vikrant',
  greet(city, country) {
    return `Hi, I'm ${this.name} from ${city}, ${country}`;
  }
};

const other = { name: 'Rahul' };

// call — invokes immediately, args individually
person.greet.call(other, 'Delhi', 'India');
// "Hi, I'm Rahul from Delhi, India"

// apply — invokes immediately, args as array
person.greet.apply(other, ['Delhi', 'India']);
// "Hi, I'm Rahul from Delhi, India"

// bind — returns new function, does NOT invoke
const boundGreet = person.greet.bind(other, 'Delhi', 'India');
boundGreet(); // "Hi, I'm Rahul from Delhi, India"
```

### Real-World bind Use Case — Event Handlers

```js
class Logger {
  constructor(prefix) {
    this.prefix = prefix;
    // Without bind, 'this' would be the button element
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event) {
    console.log(`${this.prefix}: ${event.target.id} clicked`);
  }

  attach(buttonId) {
    document.getElementById(buttonId)
      .addEventListener('click', this.handleClick);
  }
}
```

### Polyfill for bind (Interview Favourite)

```js
Function.prototype.myBind = function (context, ...args) {
  const fn = this;
  return function (...newArgs) {
    return fn.apply(context, [...args, ...newArgs]);
  };
};

const bound = person.greet.myBind(other, 'Mumbai');
bound('India'); // "Hi, I'm Rahul from Mumbai, India"
```

---

## 6. Promises & Async/Await

### Promise States

```
Pending → Fulfilled (resolved)
       → Rejected (error)
```

### Callback Hell vs Promises vs Async/Await

```js
// CALLBACK HELL
getUser(userId, (user) => {
  getOrders(user.id, (orders) => {
    getOrderDetails(orders[0].id, (details) => {
      console.log(details); // Deeply nested
    });
  });
});

// PROMISES — flat chain
getUser(userId)
  .then(user => getOrders(user.id))
  .then(orders => getOrderDetails(orders[0].id))
  .then(details => console.log(details))
  .catch(err => console.error(err))
  .finally(() => console.log('Done'));

// ASYNC/AWAIT — synchronous-looking
async function fetchDetails(userId) {
  try {
    const user = await getUser(userId);
    const orders = await getOrders(user.id);
    const details = await getOrderDetails(orders[0].id);
    console.log(details);
  } catch (err) {
    console.error(err);
  } finally {
    console.log('Done');
  }
}
```

### When to Prefer .then() Over async/await

```js
// Parallel execution — .then() is cleaner
Promise.all([
  fetch('/api/users'),
  fetch('/api/products'),
  fetch('/api/orders')
]).then(([users, products, orders]) => {
  // All resolved simultaneously
});

// Sequential with async/await (slower!)
async function sequential() {
  const users = await fetch('/api/users');     // waits
  const products = await fetch('/api/products'); // waits
  const orders = await fetch('/api/orders');     // waits
  // Each waits for the previous — unnecessary!
}

// Parallel with async/await (correct)
async function parallel() {
  const [users, products, orders] = await Promise.all([
    fetch('/api/users'),
    fetch('/api/products'),
    fetch('/api/orders')
  ]);
}
```

### Promise.allSettled vs Promise.all

```js
// Promise.all — fails fast, rejects if ANY promise rejects
Promise.all([p1, p2, p3]).catch(err => {
  // If p2 rejects, you lose p1 and p3 results
});

// Promise.allSettled — waits for ALL, never rejects
Promise.allSettled([p1, p2, p3]).then(results => {
  results.forEach(r => {
    if (r.status === 'fulfilled') console.log(r.value);
    if (r.status === 'rejected') console.log(r.reason);
  });
});
```

---

## 7. Loops in JavaScript

### Types & When to Use Each

```js
const fruits = ['apple', 'banana', 'cherry'];

// for — when you need index control or early exit
for (let i = 0; i < fruits.length; i++) {
  if (fruits[i] === 'banana') break; // Can break
  console.log(fruits[i]);
}

// for...of — iterating values (arrays, strings, maps)
for (const fruit of fruits) {
  if (fruit === 'banana') break; // Can break
  console.log(fruit);
}

// for...in — iterating object keys
const user = { name: 'Vikrant', age: 30 };
for (const key in user) {
  if (user.hasOwnProperty(key)) { // Filter inherited
    console.log(`${key}: ${user[key]}`);
  }
}

// forEach — array method, CANNOT break
fruits.forEach((fruit, index) => {
  console.log(`${index}: ${fruit}`);
  // return here only skips current iteration
  // break/continue don't work
});

// while — unknown iteration count
let attempts = 0;
while (attempts < 3) {
  const success = tryConnection();
  if (success) break;
  attempts++;
}

// do...while — guarantees at least one execution
let input;
do {
  input = getInput();
} while (!isValid(input));
```

### Performance Comparison

```js
// Fastest → Slowest (generally):
// 1. for loop (classic)
// 2. for...of
// 3. while
// 4. forEach
// 5. for...in (slowest — checks prototype chain)

// For large datasets (10k+ items), prefer
// for or for...of over forEach
```

---

## 8. Web Workers (Offloading Heavy Computation)

### Why?

JavaScript is single-threaded. Heavy computation blocks the UI. Web Workers run code on a separate thread.

### Worker File (worker.js)

```js
// This runs on a separate thread
self.onmessage = function (event) {
  const { data, sortField, filterTerm } = event.data;

  // Heavy computation here — won't block UI
  let result = data.filter(item =>
    item.name.toLowerCase().includes(filterTerm.toLowerCase())
  );

  result.sort((a, b) =>
    a[sortField] > b[sortField] ? 1 : -1
  );

  // Send result back to main thread
  self.postMessage(result);
};
```

### Main Thread (React Component)

```jsx
import { useState, useEffect, useRef } from 'react';

function DataList({ data }) {
  const [result, setResult] = useState([]);
  const [filter, setFilter] = useState('');
  const workerRef = useRef(null);

  useEffect(() => {
    // Create worker
    workerRef.current = new Worker('/worker.js');

    // Listen for results
    workerRef.current.onmessage = (event) => {
      setResult(event.data);
    };

    // Cleanup on unmount
    return () => workerRef.current.terminate();
  }, []);

  useEffect(() => {
    // Send data to worker for processing
    workerRef.current.postMessage({
      data,
      sortField: 'name',
      filterTerm: filter
    });
  }, [data, filter]);

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter..."
      />
      <ul>
        {result.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### When to Use Web Workers

- Sorting/filtering large datasets (5000+ items)
- Image processing or canvas manipulation
- Complex calculations (encryption, parsing)
- Data transformation or CSV/JSON processing

### When NOT to Use Web Workers

- Simple operations that take < 50ms
- Tasks that need direct DOM access (workers can't touch the DOM)
- Small datasets where overhead exceeds benefit

---

# PART 2: REACT CONCEPTS

---

## 9. React Performance Optimization

### Diagnostic Tools

1. **React DevTools Profiler** — shows which components re-render and why
2. **Chrome Performance Tab** — flame charts for JS execution
3. **Lighthouse** — Core Web Vitals (LCP, FID, CLS)
4. **React.StrictMode** — catches side effects in development

### Preventing Unnecessary Re-renders

```jsx
import { memo, useMemo, useCallback, useState } from 'react';

// 1. React.memo — skip re-render if props unchanged
const ExpensiveList = memo(function ExpensiveList({ items, onSelect }) {
  console.log('ExpensiveList rendered');
  return (
    <ul>
      {items.map(item => (
        <li key={item.id} onClick={() => onSelect(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
});

// 2. Parent component with proper memoization
function App() {
  const [count, setCount] = useState(0);
  const [items] = useState([
    { id: 1, name: 'Apple' },
    { id: 2, name: 'Banana' }
  ]);

  // useCallback — memoize function reference
  const handleSelect = useCallback((id) => {
    console.log('Selected:', id);
  }, []); // stable reference

  // useMemo — memoize computed values
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [items]);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      {/* ExpensiveList won't re-render when count changes */}
      <ExpensiveList items={sortedItems} onSelect={handleSelect} />
    </div>
  );
}
```

### When NOT to Memoize

```jsx
// DON'T memoize simple components
// The comparison cost > re-render cost
const SimpleLabel = memo(({ text }) => <span>{text}</span>);
// ❌ Overhead of shallow comparison not worth it

// DON'T useCallback for functions not passed as props
function App() {
  // ❌ Unnecessary — not passed to child
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return <button onClick={handleClick}>Click</button>;
}

// DO memoize when:
// ✅ Component receives complex props and re-renders often
// ✅ Function is passed to a memoized child component
// ✅ Expensive computation runs on every render
```

---

## 10. React Portals

### Rendering Outside Parent DOM

```jsx
import { createPortal } from 'react-dom';

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff',
        padding: '2rem',
        borderRadius: '8px'
      }}>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>,
    document.getElementById('portal-root')
  );
}

// Usage
function App() {
  const [show, setShow] = useState(false);

  return (
    <div style={{ overflow: 'hidden' }}>
      <button onClick={() => setShow(true)}>Open</button>
      <Modal isOpen={show} onClose={() => setShow(false)}>
        <h2>I escape overflow:hidden!</h2>
      </Modal>
    </div>
  );
}
```

### Key Point

Events still bubble through the React tree, not the DOM tree. So a click inside a portal still triggers onClick handlers on React parent components.

---

## 11. useEffect vs useLayoutEffect

### Timing Difference

```
Render → DOM Updated → useLayoutEffect → Browser Paint → useEffect
         (synchronous)                    (asynchronous)
```

### useEffect (Default — 95% of cases)

```jsx
useEffect(() => {
  // Runs AFTER browser paints
  // Use for: data fetching, subscriptions, logging
  fetchData();

  return () => cleanup();
}, [dependency]);
```

### useLayoutEffect (Rare — DOM measurements)

```jsx
function Tooltip({ targetRef }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    // Runs BEFORE browser paints
    // Prevents visual flicker when measuring DOM
    const rect = targetRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      left: rect.left
    });
  }, [targetRef]);

  return (
    <div style={{
      position: 'fixed',
      top: position.top,
      left: position.left
    }}>
      Tooltip content
    </div>
  );
}
```

### When to Use useLayoutEffect

- Measuring DOM elements (width, height, position)
- Preventing visual flicker from DOM mutations
- Synchronizing DOM state before paint
- Animations that depend on layout measurements

### Warning

useLayoutEffect blocks the browser paint. Overusing it causes performance issues. Always prefer useEffect unless you see visual flickering.

---

## 12. State Management — Context vs Redux

### When to Use Context

```jsx
// Simple theme/auth/locale that changes infrequently
const ThemeContext = createContext('light');

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const value = useMemo(() => ({
    theme,
    toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light')
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  return useContext(ThemeContext);
}
```

### Context Pitfall — Unnecessary Re-renders

```jsx
// ❌ BAD: Every consumer re-renders on ANY state change
function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState([]);

  return (
    <AppContext.Provider value={{
      user, setUser, theme, setTheme,
      notifications, setNotifications
    }}>
      {children}
    </AppContext.Provider>
  );
}

// ✅ GOOD: Split into separate contexts
function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}
```

### When to Use Redux

- Large application with complex state interactions
- State shared across many components at different tree levels
- Frequent state updates that cause Context performance issues
- Need for middleware (logging, async, undo/redo)
- Team needs predictable state debugging (Redux DevTools)

### Redux Toolkit (Modern Redux)

```jsx
import { createSlice, configureStore } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], total: 0 },
  reducers: {
    addItem(state, action) {
      state.items.push(action.payload);
      state.total += action.payload.price;
    },
    removeItem(state, action) {
      const index = state.items.findIndex(
        i => i.id === action.payload
      );
      if (index !== -1) {
        state.total -= state.items[index].price;
        state.items.splice(index, 1);
      }
    }
  }
});

const store = configureStore({
  reducer: { cart: cartSlice.reducer }
});

export const { addItem, removeItem } = cartSlice.actions;
```

---

## 13. Controlled vs Uncontrolled Components

### Controlled — React Manages the Value

```jsx
function ControlledInput() {
  const [value, setValue] = useState('');

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
  // React is the "single source of truth"
}
```

### Uncontrolled — DOM Manages the Value

```jsx
function UncontrolledInput() {
  const inputRef = useRef(null);

  const handleSubmit = () => {
    console.log(inputRef.current.value);
  };

  return (
    <div>
      <input ref={inputRef} defaultValue="hello" />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
  // DOM holds the value, React reads it when needed
}
```

### When to Choose Uncontrolled

- File inputs (`<input type="file" />` — always uncontrolled)
- Third-party DOM libraries (video players, rich text editors)
- Performance-critical forms with many fields where you only need values on submit
- Integration with non-React code

---

## 14. Debouncing & Throttling

### Debouncing — Wait Until User Stops

```jsx
import { useState, useEffect, useCallback } from 'react';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancel previous timer on new keystroke
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
function SearchComponent() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      fetch(`/api/search?q=${debouncedQuery}`)
        .then(res => res.json())
        .then(data => setResults(data));
    }
  }, [debouncedQuery]); // Only fires 300ms after user stops typing

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### Throttling — Execute at Most Once Per Interval

```jsx
function useThrottle(value, interval) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdated = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();

    if (now >= lastUpdated.current + interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval);

      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}

// Use throttling for: scroll events, resize events,
// mousemove tracking, real-time analytics
```

---

## 15. Virtualization / Windowing (Large Lists)

### Using Intersection Observer

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';

function InfiniteList() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef(null);

  const lastItemRef = useCallback((node) => {
    if (loading) return;

    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage(prev => prev + 1);
      }
    });

    if (node) observerRef.current.observe(node);
  }, [loading]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/items?page=${page}&limit=20`)
      .then(res => res.json())
      .then(data => {
        setItems(prev => [...prev, ...data]);
        setLoading(false);
      });
  }, [page]);

  return (
    <ul>
      {items.map((item, index) => (
        <li
          key={item.id}
          ref={index === items.length - 1 ? lastItemRef : null}
        >
          {item.name}
        </li>
      ))}
      {loading && <li>Loading...</li>}
    </ul>
  );
}
```

---

## 16. React Hook Form (Form Handling)

### Basic Usage

```jsx
import { useForm } from 'react-hook-form';

function RegistrationForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const userType = watch('userType');

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('name', { required: 'Name is required' })}
        placeholder="Name"
      />
      {errors.name && <span>{errors.name.message}</span>}

      <select {...register('userType')}>
        <option value="personal">Personal</option>
        <option value="business">Business</option>
      </select>

      {/* Conditional field based on previous selection */}
      {userType === 'business' && (
        <input
          {...register('companyName', {
            required: 'Company name required for business'
          })}
          placeholder="Company Name"
        />
      )}

      <button type="submit">Register</button>
    </form>
  );
}
```

### Why React Hook Form Over Formik?

- Fewer re-renders (uses uncontrolled inputs internally)
- Smaller bundle size
- Better TypeScript support
- Built-in validation with less boilerplate

---

## 17. Custom Hooks

### Reusable Data Fetching Hook

```jsx
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(url, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Cleanup: abort on unmount or URL change
    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}

// Usage
function UserProfile({ userId }) {
  const { data: user, loading, error } = useFetch(
    `/api/users/${userId}`
  );

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  return <h1>{user.name}</h1>;
}
```

### Local Storage Hook

```jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

// Usage
const [theme, setTheme] = useLocalStorage('theme', 'light');
```

---

## 18. Error Boundaries

### Class Component (Only Way)

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to monitoring service
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

// Usage — wrap around risky components
function App() {
  return (
    <ErrorBoundary fallback={<p>Dashboard failed to load</p>}>
      <Dashboard />
    </ErrorBoundary>
  );
}
```

### Important Limitations

Error boundaries do NOT catch errors in event handlers, async code (setTimeout, Promises), or server-side rendering. Use try/catch for those.

---

## 19. React Lazy Loading & Code Splitting

```jsx
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const UserProfile = lazy(() => import('./UserProfile'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/profile" element={<UserProfile />} />
      </Routes>
    </Suspense>
  );
}
```

---

## 20. Key Interview Tips for 9+ Years

1. **Lead with WHY, not WHAT** — Don't just describe a technique; explain why you'd choose it over alternatives.

2. **Mention trade-offs** — Every solution has downsides. Acknowledging them shows maturity.

3. **Use real examples** — "In my last project, we had..." is more powerful than textbook definitions.

4. **Think about scale** — At your level, answers should consider team size, codebase growth, and maintenance.

5. **Don't over-engineer** — Sometimes the simplest solution is the best. Say so when it's true.

6. **Admit gaps honestly** — "I haven't used that in production but here's my understanding..." is better than guessing.

7. **Ask clarifying questions** — Senior developers don't just answer; they understand the problem first.
