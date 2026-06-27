# JavaScript & TypeScript Deep Dive – Interview Answer Guide
---

## Q1: What is the Temporal Dead Zone in ES6+? How does it affect `let` and `const` declarations?

### Concept

The Temporal Dead Zone (TDZ) is the region of code between the start of a block scope and the point where a variable declared with `let` or `const` is actually initialized. Accessing the variable during this zone throws a `ReferenceError`.

### How It Works Under the Hood

```javascript
// HOISTING COMPARISON

// var — hoisted AND initialized with undefined
console.log(a); // undefined (no error)
var a = 10;

// let — hoisted but NOT initialized (TDZ)
console.log(b); // ❌ ReferenceError: Cannot access 'b' before initialization
let b = 20;

// const — same as let
console.log(c); // ❌ ReferenceError
const c = 30;
```

**What actually happens internally:**

```
Block enters scope
  ├── `let x` is hoisted (JS engine knows about it)
  ├── x is in TDZ ← accessing here = ReferenceError
  ├── ... more code in TDZ ...
  ├── let x = 10;  ← TDZ ends, x is initialized
  └── x is accessible normally
```
---



## Q4: Explain closures with a real-world use case. What are the memory implications of closures?

### Concept

A closure is a function that **remembers and has access to variables from its outer (enclosing) scope**, even after the outer function has finished executing. The inner function "closes over" those variables.

### How It Works

```javascript
function createCounter() {
  let count = 0; // This variable is "enclosed" in the closure

  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count,
  };
}

const counter = createCounter();
counter.increment(); // 1
counter.increment(); // 2
counter.getCount();  // 2

// count is NOT accessible from outside
// console.log(count); ← ReferenceError
```

**Why this works:** When `createCounter` returns, its execution context is normally garbage collected. But because the returned functions still reference `count`, the JS engine keeps `count` alive in memory.

### Real-World Use Cases

**1. Data Privacy / Encapsulation (Module Pattern)**
```javascript
function createAuthService() {
  let token = null;           // private
  let refreshToken = null;    // private
  const subscribers = [];     // private

  return {
    login: async (credentials) => {
      const res = await api.post("/login", credentials);
      token = res.data.token;
      refreshToken = res.data.refreshToken;
      subscribers.forEach((cb) => cb(true));
    },
    getToken: () => token,
    onAuthChange: (cb) => {
      subscribers.push(cb);
      return () => { // unsubscribe function — also a closure!
        const idx = subscribers.indexOf(cb);
        if (idx > -1) subscribers.splice(idx, 1);
      };
    },
    isAuthenticated: () => !!token,
  };
}

const auth = createAuthService();
// token and refreshToken are truly private — no way to access directly
```

**2. Function Factories**
```javascript
function createValidator(rules) {
  // rules is closed over
  return function validate(data) {
    const errors = {};
    for (const [field, rule] of Object.entries(rules)) {
      if (rule.required && !data[field]) {
        errors[field] = `${field} is required`;
      }
      if (rule.minLength && data[field]?.length < rule.minLength) {
        errors[field] = `${field} must be at least ${rule.minLength} chars`;
      }
    }
    return { valid: Object.keys(errors).length === 0, errors };
  };
}

const validateUser = createValidator({
  name: { required: true, minLength: 2 },
  email: { required: true },
});

validateUser({ name: "A", email: "" });
// { valid: false, errors: { name: "name must be at least 2 chars", email: "email is required" } }
```

**3. Memoization / Caching**
```javascript
function memoize(fn) {
  const cache = new Map(); // closed over — persists across calls

  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      console.log("Cache hit");
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const expensiveCalc = memoize((n) => {
  console.log("Computing...");
  return n * n;
});

expensiveCalc(5); // "Computing..." → 25
expensiveCalc(5); // "Cache hit" → 25 (no recomputation)
```

**4. React Hooks — useState is a closure**
```javascript
// Simplified useState implementation
function createState(initialValue) {
  let state = initialValue; // closed over

  function getState() {
    return state;
  }

  function setState(newValue) {
    state = typeof newValue === "function" ? newValue(state) : newValue;
    // trigger re-render...
  }

  return [getState, setState];
}
```

### Memory Implications

```javascript
// ❌ MEMORY LEAK — closure retains reference to large data
function processData() {
  const hugeArray = new Array(1_000_000).fill("data"); // 10MB+

  return function getLength() {
    return hugeArray.length; // Closure keeps hugeArray alive!
  };
}

const getLen = processData(); // hugeArray can NEVER be garbage collected

// ✅ FIX — only close over what you need
function processData() {
  const hugeArray = new Array(1_000_000).fill("data");
  const length = hugeArray.length; // Extract needed value

  return function getLength() {
    return length; // Only a number is retained, hugeArray can be GC'd
  };
}
```

```javascript
// ❌ COMMON LEAK — Event listeners with closures
function setupHandler() {
  const data = fetchHugeDataset();

  document.addEventListener("click", function handler() {
    console.log(data.summary); // data stays in memory forever
  });
  // handler is never removed → data is never freed
}

// ✅ FIX — cleanup
function setupHandler() {
  const data = fetchHugeDataset();

  const handler = () => console.log(data.summary);
  document.addEventListener("click", handler);

  return () => document.removeEventListener("click", handler); // cleanup
}
```

### Interview Tip
> "Every closure has a cost — it prevents garbage collection of closed-over variables. The rule of thumb: close over primitives or small references when possible, and always clean up closures in event listeners, intervals, and subscriptions. In React, this is exactly why useEffect returns a cleanup function."

---

## Q5: What are WeakMap, WeakSet, and WeakRef? When would you use each?

### Concept

These are "weak" collection types where references to objects **don't prevent garbage collection**. If no other reference to the object exists, it can be collected even if it's in a WeakMap/WeakSet.

### WeakMap

```javascript
// Keys MUST be objects; values can be anything
// Keys are held weakly — if key object is garbage collected, entry is auto-removed

// USE CASE 1: Private data for objects (without modifying the object)
const privateData = new WeakMap();

class User {
  constructor(name, password) {
    this.name = name;
    privateData.set(this, { password, loginAttempts: 0 }); // truly private
  }

  checkPassword(input) {
    const data = privateData.get(this);
    data.loginAttempts++;
    return data.password === input;
  }
}

const user = new User("Alice", "secret123");
user.checkPassword("wrong");   // false
// privateData is not accessible from outside
// When user is garbage collected, the private data is automatically freed

// USE CASE 2: Caching expensive computations
const computeCache = new WeakMap();

function expensiveOperation(obj) {
  if (computeCache.has(obj)) return computeCache.get(obj);

  const result = /* heavy computation on obj */ obj.data.reduce((a, b) => a + b, 0);
  computeCache.set(obj, result);
  return result;
}
// When obj is no longer referenced, cache entry is automatically cleaned up
// No manual cache invalidation needed!

// USE CASE 3: DOM element metadata
const elementData = new WeakMap();

function trackElement(el) {
  elementData.set(el, {
    clickCount: 0,
    firstSeen: Date.now(),
  });
}
// When DOM element is removed and GC'd, metadata is auto-cleaned
```

### WeakSet

```javascript
// Can only store objects (no primitives)
// No size property, no iteration

// USE CASE 1: Track if an object has been processed
const processed = new WeakSet();

function processNode(node) {
  if (processed.has(node)) return; // already handled
  processed.add(node);

  // do work...
  node.children?.forEach(processNode);
}
// Prevents infinite loops in graph/tree traversal
// Auto-cleaned when nodes are removed

// USE CASE 2: Mark objects (branding)
const validated = new WeakSet();

function validate(user) {
  if (!user.name || !user.email) throw new Error("Invalid");
  validated.add(user);
  return user;
}

function save(user) {
  if (!validated.has(user)) throw new Error("Must validate first");
  // save to DB...
}
```

### WeakRef (ES2021)

```javascript
// Holds a weak reference to an object — doesn't prevent GC
// Must call .deref() to access the object (returns undefined if GC'd)

// USE CASE: Cache with automatic eviction
class Cache {
  #cache = new Map();

  set(key, value) {
    this.#cache.set(key, new WeakRef(value));
  }

  get(key) {
    const ref = this.#cache.get(key);
    if (!ref) return undefined;

    const value = ref.deref();
    if (value === undefined) {
      // Object was garbage collected — clean up the entry
      this.#cache.delete(key);
      return undefined;
    }
    return value;
  }
}

// USE CASE 2: FinalizationRegistry — cleanup when object is GC'd
const registry = new FinalizationRegistry((heldValue) => {
  console.log(`Object associated with "${heldValue}" was garbage collected`);
  // Clean up external resources (file handles, network connections, etc.)
});

function createConnection(url) {
  const conn = new Connection(url);
  registry.register(conn, url); // url is the "held value" passed to callback
  return conn;
}
```

### Comparison Table

| Feature | Map | WeakMap | Set | WeakSet |
|---|---|---|---|---|
| Key types | Any | Objects only | Any | Objects only |
| GC of entries | No | Yes (auto) | No | Yes (auto) |
| Iterable | Yes | No | Yes | No |
| `.size` | Yes | No | Yes | No |
| Use case | General storage | Private data, caching | Unique values | Object tracking |

### Interview Tip
> "WeakMap is my go-to for associating metadata with objects without causing memory leaks — especially for DOM elements and cached computations. The key insight is that you're saying 'I want to associate data with this object, but I don't want my association to keep the object alive.' Regular Maps would cause leaks in the same scenario."

---

## Q6: How does `this` binding work in arrow functions vs regular functions vs class methods?

### The Four Rules of `this` Binding

```javascript
// RULE 1: Default Binding — standalone function call
function showThis() {
  console.log(this);
}
showThis(); // window (browser) / global (Node) — in strict mode: undefined

// RULE 2: Implicit Binding — called as method on object
const obj = {
  name: "Alice",
  greet() {
    console.log(this.name);
  },
};
obj.greet(); // "Alice" — this = obj

// RULE 3: Explicit Binding — call, apply, bind
function greet(greeting) {
  console.log(`${greeting}, ${this.name}`);
}
greet.call({ name: "Bob" }, "Hello");    // "Hello, Bob"
greet.apply({ name: "Bob" }, ["Hello"]); // "Hello, Bob"
const bound = greet.bind({ name: "Bob" });
bound("Hello"); // "Hello, Bob"

// RULE 4: new Binding — constructor call
function Person(name) {
  this.name = name; // this = newly created object
}
const p = new Person("Charlie"); // this = p
```

### Arrow Functions — Lexical `this`

```javascript
// Arrow functions do NOT have their own `this`
// They inherit `this` from the enclosing scope at DEFINITION time

const obj = {
  name: "Alice",
  
  // Regular method — `this` depends on how it's called
  regularMethod() {
    console.log(this.name); // "Alice" — called on obj
    
    // Problem: nested function loses `this`
    setTimeout(function () {
      console.log(this.name); // undefined — `this` is window/global
    }, 100);
    
    // Solution: arrow function inherits `this` from regularMethod
    setTimeout(() => {
      console.log(this.name); // "Alice" — lexical `this`
    }, 100);
  },

  // ⚠️ Arrow method — DON'T DO THIS
  arrowMethod: () => {
    console.log(this.name); // undefined — `this` is outer scope (module/window)
  },
};
```

### Class Methods — The Binding Problem

```javascript
class Button {
  constructor(label) {
    this.label = label;
  }

  // Method on prototype
  handleClick() {
    console.log(`Clicked: ${this.label}`);
  }

  // Arrow function as class field — bound to instance
  handleClickArrow = () => {
    console.log(`Clicked: ${this.label}`);
  };
}

const btn = new Button("Submit");

// Direct call — works fine
btn.handleClick(); // "Clicked: Submit"

// Passed as callback — PROBLEM
const handler = btn.handleClick;
handler(); // ❌ "Clicked: undefined" — `this` is lost

// Three solutions:

// Solution 1: Arrow function class field (most common in React)
const handler1 = btn.handleClickArrow;
handler1(); // ✅ "Clicked: Submit"

// Solution 2: Bind in constructor
class Button2 {
  constructor(label) {
    this.label = label;
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick() {
    console.log(`Clicked: ${this.label}`);
  }
}

// Solution 3: Bind at call site
element.addEventListener("click", btn.handleClick.bind(btn));
```

### The Complete Picture — `this` Precedence

```
Priority (highest to lowest):
  1. new binding       → new Foo()           → this = new object
  2. Explicit binding  → call/apply/bind     → this = specified object
  3. Implicit binding  → obj.method()        → this = obj
  4. Default binding   → standalone call     → this = window (or undefined in strict)

Arrow functions: IGNORE all of the above. this = enclosing scope's this. Period.
```

### Tricky Interview Scenario

```javascript
const obj = {
  value: 42,
  getValue: function () {
    return this.value;
  },
  getValueArrow: () => {
    return this.value;
  },
  nested: {
    value: 100,
    getValue: function () {
      return this.value;
    },
  },
};

console.log(obj.getValue());          // 42 — this = obj
console.log(obj.getValueArrow());     // undefined — this = outer scope
console.log(obj.nested.getValue());   // 100 — this = obj.nested

const extracted = obj.getValue;
console.log(extracted());             // undefined — this = window/global

const { getValue } = obj;
console.log(getValue());             // undefined — same as above (destructuring extracts)
```

### Interview Tip
> "The simplest mental model: regular functions — `this` depends on HOW it's called (left of the dot). Arrow functions — `this` depends on WHERE it's defined (lexical scope). In React class components, we used to bind in constructors; with hooks and function components, this problem largely disappears since we use closures instead of `this`."

---

## Q7: Explain generators and iterators. How would you use them to handle large data streams?

### Iterators — The Protocol

```javascript
// Any object is iterable if it has [Symbol.iterator]() that returns
// an object with a next() method returning { value, done }

const range = {
  from: 1,
  to: 5,
  [Symbol.iterator]() {
    let current = this.from;
    const last = this.to;
    return {
      next() {
        return current <= last
          ? { value: current++, done: false }
          : { value: undefined, done: true };
      },
    };
  },
};

for (const num of range) {
  console.log(num); // 1, 2, 3, 4, 5
}

// Spread also works
console.log([...range]); // [1, 2, 3, 4, 5]
```

### Generators — Simplified Iterator Creation

```javascript
// function* creates a generator function
// yield pauses execution and returns a value
// Calling next() resumes from where it paused

function* numberGenerator() {
  console.log("Start");
  yield 1;
  console.log("After first yield");
  yield 2;
  console.log("After second yield");
  yield 3;
  console.log("End");
}

const gen = numberGenerator();
gen.next(); // { value: 1, done: false } — logs "Start"
gen.next(); // { value: 2, done: false } — logs "After first yield"
gen.next(); // { value: 3, done: false } — logs "After second yield"
gen.next(); // { value: undefined, done: true } — logs "End"
```

### Infinite Sequences (Lazy Evaluation)

```javascript
// Generate infinite IDs — memory efficient because values are produced on demand
function* idGenerator(prefix = "ID") {
  let id = 1;
  while (true) {
    yield `${prefix}-${id++}`;
  }
}

const ids = idGenerator("USER");
ids.next().value; // "USER-1"
ids.next().value; // "USER-2"
// Can go forever without using memory for all values

// Fibonacci — infinite but only one value in memory at a time
function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

// Take first 10
function take(gen, n) {
  const result = [];
  for (const val of gen) {
    result.push(val);
    if (result.length >= n) break;
  }
  return result;
}

take(fibonacci(), 10); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

### Handling Large Data Streams

```javascript
// Processing a massive file line by line without loading entire file
async function* readLines(filePath) {
  const fileStream = fs.createReadStream(filePath, { encoding: "utf-8" });
  let leftover = "";

  for await (const chunk of fileStream) {
    const lines = (leftover + chunk).split("\n");
    leftover = lines.pop(); // last element might be incomplete

    for (const line of lines) {
      yield line;
    }
  }
  if (leftover) yield leftover;
}

// Process a 10GB log file with constant memory
async function analyzeLog(filePath) {
  let errorCount = 0;

  for await (const line of readLines(filePath)) {
    if (line.includes("ERROR")) errorCount++;
  }

  return errorCount;
}
```

### Paginated API Fetching

```javascript
async function* fetchAllPages(baseUrl) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${baseUrl}?page=${page}&limit=100`);
    const data = await response.json();

    for (const item of data.results) {
      yield item; // yield one item at a time
    }

    hasMore = data.hasNextPage;
    page++;
  }
}

// Consumer processes items one by one — never loads all pages into memory
for await (const user of fetchAllPages("/api/users")) {
  await processUser(user);
}
```

### Generator Pipeline (Composable Data Processing)

```javascript
function* filter(iterable, predicate) {
  for (const item of iterable) {
    if (predicate(item)) yield item;
  }
}

function* map(iterable, transform) {
  for (const item of iterable) {
    yield transform(item);
  }
}

function* take(iterable, n) {
  let count = 0;
  for (const item of iterable) {
    if (count >= n) return;
    yield item;
    count++;
  }
}

// Composable pipeline — processes 1 item at a time through entire chain
const numbers = function* () {
  let i = 0;
  while (true) yield i++;
};

const result = [
  ...take(
    map(
      filter(numbers(), (n) => n % 2 === 0),  // even numbers
      (n) => n * n                              // square them
    ),
    5                                           // take first 5
  ),
];
// [0, 4, 16, 36, 64] — only generated 10 numbers total, not infinite
```

### Interview Tip
> "Generators are perfect for lazy evaluation — they produce values on demand rather than computing everything upfront. This makes them ideal for paginated APIs, large file processing, and infinite sequences. The key advantage over arrays is constant memory usage regardless of dataset size."

---

## Q8: What is the difference between `Promise.all`, `Promise.allSettled`, `Promise.race`, and `Promise.any`? When would you pick one over another?

### Quick Comparison

```
Promise.all         → Wait for ALL to succeed. Fail fast on first rejection.
Promise.allSettled  → Wait for ALL to complete (success or failure). Never rejects.
Promise.race        → Return first to settle (success OR failure).
Promise.any         → Return first to succeed. Fail only if ALL reject.
```

### Promise.all — "All must succeed"

```javascript
// ✅ Resolves with array of results when ALL promises resolve
// ❌ Rejects immediately when ANY promise rejects

// USE CASE: Parallel fetching where ALL data is required
async function loadDashboard(userId) {
  try {
    const [user, orders, notifications] = await Promise.all([
      fetchUser(userId),
      fetchOrders(userId),
      fetchNotifications(userId),
    ]);
    // All three succeeded — render dashboard
    return { user, orders, notifications };
  } catch (error) {
    // ANY one failed — handle error
    // Note: other promises keep running but results are discarded
    throw new Error(`Dashboard load failed: ${error.message}`);
  }
}
```

### Promise.allSettled — "Give me everything, success or failure"

```javascript
// Always resolves with array of { status, value/reason } objects
// NEVER rejects

// USE CASE: Independent operations where partial success is acceptable
async function sendBulkNotifications(users) {
  const results = await Promise.allSettled(
    users.map((user) =>
      sendEmail(user.email).then(() => ({ userId: user.id, sent: true }))
    )
  );

  const succeeded = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);
  const failed = results
    .filter((r) => r.status === "rejected")
    .map((r) => r.reason);

  console.log(`Sent: ${succeeded.length}, Failed: ${failed.length}`);
  return { succeeded, failed };
}

// USE CASE: Graceful degradation
async function loadPageWithFallbacks() {
  const results = await Promise.allSettled([
    fetchMainContent(),        // critical
    fetchRecommendations(),    // nice to have
    fetchAds(),                // nice to have
  ]);

  return {
    content: results[0].status === "fulfilled" ? results[0].value : null,
    recommendations: results[1].status === "fulfilled" ? results[1].value : [],
    ads: results[2].status === "fulfilled" ? results[2].value : [],
  };
}
```

### Promise.race — "First to finish wins (success or failure)"

```javascript
// Resolves/rejects with the first promise that settles

// USE CASE 1: Timeout pattern
function fetchWithTimeout(url, timeoutMs = 5000) {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeoutMs)
    ),
  ]);
}

// USE CASE 2: Use fastest available resource
async function fetchFromFastestCDN(path) {
  return Promise.race([
    fetch(`https://cdn1.example.com${path}`),
    fetch(`https://cdn2.example.com${path}`),
    fetch(`https://cdn3.example.com${path}`),
  ]);
  // First response wins — but if the first to respond is a 500 error,
  // you get that error (race doesn't care about success/failure)
}
```

### Promise.any — "First to succeed wins"

```javascript
// Resolves with the first fulfilled promise
// Only rejects if ALL promises reject (AggregateError)

// USE CASE: Redundant sources — need at least one to work
async function fetchFromMirrors(path) {
  try {
    const data = await Promise.any([
      fetch(`https://mirror1.example.com${path}`),
      fetch(`https://mirror2.example.com${path}`),
      fetch(`https://mirror3.example.com${path}`),
    ]);
    return data;
  } catch (err) {
    // AggregateError — ALL mirrors failed
    console.error("All mirrors failed:", err.errors);
    throw err;
  }
}

// USE CASE: Feature detection — try multiple approaches
async function getLocation() {
  return Promise.any([
    getGPSLocation(),           // most accurate but slow
    getIPBasedLocation(),       // fast but less accurate
    getCachedLocation(),        // instant but might be stale
  ]);
  // Returns whichever succeeds first
}
```

### Decision Matrix

| Scenario | Method |
|---|---|
| Load all required data in parallel | `Promise.all` |
| Send bulk operations, report partial results | `Promise.allSettled` |
| Add timeout to a promise | `Promise.race` |
| Try multiple sources, take fastest success | `Promise.any` |
| All must succeed, fail fast | `Promise.all` |
| Need all results regardless of outcome | `Promise.allSettled` |
| First response wins (even if error) | `Promise.race` |
| First successful response wins | `Promise.any` |

### Interview Tip
> "The simplest way to remember: `all` = AND logic (all must pass), `any` = OR logic (one must pass), `race` = first to finish regardless, `allSettled` = wait for everything and report. In production, I use `allSettled` more than most developers expect — it's essential for batch operations where partial failures shouldn't crash the whole flow."

---

## Q9: How does the JavaScript garbage collector work? What patterns cause memory leaks in frontend apps?

### How Garbage Collection Works

JavaScript uses **automatic garbage collection** — the engine periodically frees memory that is no longer reachable.

**Mark-and-Sweep Algorithm (used by all modern engines):**

```
Step 1: Start from "roots" (global object, current call stack, etc.)
Step 2: "Mark" all objects reachable from roots by following references
Step 3: "Sweep" — free memory of all unmarked (unreachable) objects

     roots
      │
      ├── window.app ──► { data: [...] }  ← MARKED (reachable)
      │                       │
      │                       └──► { name: "Alice" }  ← MARKED
      │
      └── stack frame ──► localVar  ← MARKED
      
      Orphaned: { old: "data" }  ← NOT MARKED → freed
```

**Generational Collection (V8 Engine):**
- **Young Generation (Nursery)** — short-lived objects; collected frequently with "Scavenge" (fast)
- **Old Generation** — objects that survived multiple young GC cycles; collected less often with "Mark-Sweep-Compact" (slower)
- Most objects die young (90%+), so focusing on young gen is efficient

### Common Memory Leak Patterns in Frontend Apps

**1. Forgotten Event Listeners**
```javascript
// ❌ LEAK — listener keeps component's closure alive
function setupTracking() {
  const analyticsData = fetchLargeDataset(); // 10MB

  window.addEventListener("scroll", () => {
    trackScroll(analyticsData); // analyticsData can never be GC'd
  });
}

// ✅ FIX — remove listener when done
function setupTracking() {
  const analyticsData = fetchLargeDataset();

  const handler = () => trackScroll(analyticsData);
  window.addEventListener("scroll", handler);

  return () => window.removeEventListener("scroll", handler); // cleanup
}
```

**2. Forgotten Timers and Intervals**
```javascript
// ❌ LEAK — interval keeps reference alive forever
function startPolling(component) {
  setInterval(() => {
    component.update(fetchData()); // component can never be GC'd
  }, 5000);
}

// ✅ FIX — store and clear
function startPolling(component) {
  const id = setInterval(() => {
    component.update(fetchData());
  }, 5000);
  return () => clearInterval(id);
}
```

**3. Detached DOM Nodes**
```javascript
// ❌ LEAK — JS still references removed DOM node
let detachedNode;

function createList() {
  const list = document.createElement("ul");
  document.body.appendChild(list);
  detachedNode = list; // global reference
}

function removeList() {
  document.body.removeChild(detachedNode);
  // DOM node removed from tree but detachedNode still points to it
  // The node and its children stay in memory!
}

// ✅ FIX
function removeList() {
  document.body.removeChild(detachedNode);
  detachedNode = null; // release the reference
}
```

**4. Closures Retaining Large Scopes**
```javascript
// ❌ LEAK — closure retains entire scope
function processFile(file) {
  const rawData = readFile(file);          // 50MB
  const parsedData = parse(rawData);       // 20MB
  const summary = summarize(parsedData);   // 1KB

  return function getSummary() {
    return summary;
    // JS engine MAY keep rawData and parsedData alive
    // because they're in the same closure scope
  };
}

// ✅ FIX — isolate the closure
function processFile(file) {
  const summary = (() => {
    const rawData = readFile(file);
    const parsedData = parse(rawData);
    return summarize(parsedData);
  })(); // rawData and parsedData are GC'd after IIFE

  return function getSummary() {
    return summary; // only 1KB retained
  };
}
```

**5. React-Specific Leaks**
```javascript
// ❌ LEAK — missing cleanup in useEffect
function UserStatus({ userId }) {
  const [status, setStatus] = useState("offline");

  useEffect(() => {
    const ws = new WebSocket(`/ws/status/${userId}`);
    ws.onmessage = (e) => setStatus(e.data);
    // No cleanup! WebSocket stays open when component unmounts
    // setStatus on unmounted component = memory leak
  }, [userId]);
}

// ✅ FIX
useEffect(() => {
  let isMounted = true;
  const ws = new WebSocket(`/ws/status/${userId}`);

  ws.onmessage = (e) => {
    if (isMounted) setStatus(e.data);
  };

  return () => {
    isMounted = false;
    ws.close();
  };
}, [userId]);
```

**6. Growing Collections**
```javascript
// ❌ LEAK — Map grows forever
const cache = new Map();

function getCachedUser(id) {
  if (!cache.has(id)) {
    cache.set(id, fetchUser(id)); // never evicted
  }
  return cache.get(id);
}

// ✅ FIX — LRU cache or WeakMap
class LRUCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  get(key) {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value); // move to end (most recent)
    return value;
  }
  set(key, value) {
    this.cache.delete(key);
    this.cache.set(key, value);
    if (this.cache.size > this.maxSize) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
  }
}
```

### How to Detect Memory Leaks

```
Chrome DevTools:
  1. Performance Monitor → Watch JS Heap Size over time
  2. Memory tab → Take heap snapshots → Compare
  3. Performance tab → Record → Check memory timeline

Look for:
  - JS Heap size growing continuously
  - Detached DOM trees in heap snapshots
  - Growing array/map sizes in allocation timeline
```

### Interview Tip
> "The five most common frontend memory leaks I've seen in production: forgotten event listeners, uncleaned intervals, closures holding large objects, React useEffect without cleanup, and ever-growing caches. I always audit these in code reviews, and for critical apps, I set up automated heap snapshot comparisons in CI."

---

## Q10: How would you implement a debounce and throttle function from scratch? What are the edge cases?

### Debounce — "Wait until user stops"

Delays execution until a quiet period (no more calls for N ms).

```javascript
function debounce(fn, delay, options = {}) {
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;
  const { leading = false, trailing = true, maxWait = null } = options;
  let lastCallTime = 0;

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;
    const now = Date.now();

    // Leading edge — execute immediately on first call
    if (leading && timeoutId === null) {
      fn.apply(lastThis, lastArgs);
    }

    // maxWait — ensure function runs at least every maxWait ms
    if (maxWait !== null && now - lastCallTime >= maxWait) {
      fn.apply(lastThis, lastArgs);
      lastCallTime = now;
    }

    // Clear existing timer and set new one
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      if (trailing && !(leading && timeoutId === null)) {
        fn.apply(lastThis, lastArgs);
      }
      timeoutId = null;
      lastCallTime = Date.now();
    }, delay);

    lastCallTime = lastCallTime || now;
  }

  // Cancel pending execution
  debounced.cancel = () => {
    clearTimeout(timeoutId);
    timeoutId = null;
    lastArgs = null;
    lastThis = null;
  };

  // Execute immediately if pending
  debounced.flush = () => {
    if (timeoutId !== null) {
      fn.apply(lastThis, lastArgs);
      debounced.cancel();
    }
  };

  return debounced;
}

// Usage
const searchAPI = debounce(
  (query) => fetch(`/api/search?q=${query}`),
  300,
  { leading: false, trailing: true }
);

input.addEventListener("input", (e) => searchAPI(e.target.value));

// Cleanup on unmount
// searchAPI.cancel();
```

### Throttle — "Execute at most once per N ms"

Guarantees function runs at most once per interval.

```javascript
function throttle(fn, interval, options = {}) {
  let lastExecutionTime = 0;
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;
  const { leading = true, trailing = true } = options;

  function throttled(...args) {
    const now = Date.now();
    lastArgs = args;
    lastThis = this;

    const elapsed = now - lastExecutionTime;

    // Leading edge
    if (leading && elapsed >= interval) {
      fn.apply(lastThis, lastArgs);
      lastExecutionTime = now;
      return;
    }

    // Trailing edge — schedule execution at end of interval
    if (trailing && !timeoutId) {
      timeoutId = setTimeout(() => {
        fn.apply(lastThis, lastArgs);
        lastExecutionTime = Date.now();
        timeoutId = null;
      }, interval - elapsed);
    }
  }

  throttled.cancel = () => {
    clearTimeout(timeoutId);
    timeoutId = null;
    lastArgs = null;
    lastThis = null;
    lastExecutionTime = 0;
  };

  return throttled;
}

// Usage
const handleScroll = throttle(() => {
  console.log("Scroll position:", window.scrollY);
}, 200);

window.addEventListener("scroll", handleScroll);
```

### Edge Cases to Handle

```javascript
// 1. Preserving `this` context
const obj = {
  value: 42,
  debouncedLog: debounce(function () {
    console.log(this.value); // Must be 42, not undefined
  }, 100),
};

// 2. Returning values (for async debounce)
function debounceAsync(fn, delay) {
  let timeoutId;
  return function (...args) {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const result = await fn.apply(this, args);
        resolve(result);
      }, delay);
    });
  };
}

// 3. Cancel on component unmount (React)
useEffect(() => {
  const debouncedSearch = debounce(search, 300);
  inputRef.current?.addEventListener("input", debouncedSearch);

  return () => {
    debouncedSearch.cancel(); // Prevent execution after unmount
    inputRef.current?.removeEventListener("input", debouncedSearch);
  };
}, []);

// 4. First call should execute immediately (leading: true)
// Last call should always execute (trailing: true)
// Both can be true simultaneously

// 5. Rapid calls should not stack timers (clear previous timeout)
```

### When to Use Which

| Scenario | Use |
|---|---|
| Search input / autocomplete | Debounce (300ms) |
| Window resize handler | Debounce (150ms) |
| Scroll position tracking | Throttle (100-200ms) |
| Button click (prevent double-submit) | Debounce (leading: true, trailing: false) |
| API rate limiting | Throttle |
| Infinite scroll (load more) | Throttle (200ms) |
| Form auto-save | Debounce (1000ms) |
| Mouse move tracking | Throttle (50ms) |

### Interview Tip
> "The key difference: debounce waits for silence — it resets the timer on every call. Throttle guarantees a maximum frequency — it executes at regular intervals regardless of how many calls happen. For search inputs, debounce is better because you only want to search after the user stops typing. For scroll handlers, throttle is better because you want regular updates while scrolling."

---

## Q11: Explain `Proxy` and `Reflect` in JavaScript. How are they used in libraries like Vue 3's reactivity system?

### Proxy — Intercept Object Operations

```javascript
// Proxy wraps an object and intercepts fundamental operations
// (get, set, delete, has, keys, function calls, etc.)

const handler = {
  get(target, property, receiver) {
    console.log(`Reading "${property}"`);
    return Reflect.get(target, property, receiver);
  },
  set(target, property, value, receiver) {
    console.log(`Setting "${property}" = ${value}`);
    return Reflect.set(target, property, value, receiver);
  },
  deleteProperty(target, property) {
    console.log(`Deleting "${property}"`);
    return Reflect.deleteProperty(target, property);
  },
};

const user = new Proxy({ name: "Alice", age: 30 }, handler);

user.name;          // logs: Reading "name" → "Alice"
user.age = 31;      // logs: Setting "age" = 31
delete user.name;   // logs: Deleting "name"
```

### Reflect — Clean Object Operation API

```javascript
// Reflect provides methods for every Proxy trap
// It's the "proper" way to perform default operations inside handlers

// Without Reflect (old way)
Reflect.get(target, "name");            // vs target["name"]
Reflect.set(target, "name", "Bob");     // vs target["name"] = "Bob"
Reflect.has(target, "name");            // vs "name" in target
Reflect.deleteProperty(target, "name"); // vs delete target["name"]
Reflect.ownKeys(target);               // vs Object.keys(target)

// Why use Reflect?
// 1. Returns boolean for success/failure (set, defineProperty, etc.)
// 2. Properly handles prototype chain (receiver parameter)
// 3. Maps 1:1 with Proxy traps — consistent API
```

### Practical Use Cases

**1. Validation Layer**
```javascript
function createValidated(obj, schema) {
  return new Proxy(obj, {
    set(target, prop, value) {
      const validator = schema[prop];
      if (validator && !validator(value)) {
        throw new TypeError(`Invalid value for "${prop}": ${value}`);
      }
      return Reflect.set(target, prop, value);
    },
  });
}

const user = createValidated(
  { name: "", age: 0 },
  {
    name: (v) => typeof v === "string" && v.length > 0,
    age: (v) => typeof v === "number" && v >= 0 && v <= 150,
  }
);

user.name = "Alice"; // ✅
user.age = -5;       // ❌ TypeError: Invalid value for "age": -5
```

**2. Auto-Logging / Debugging**
```javascript
function withLogging(obj, label = "Object") {
  return new Proxy(obj, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function") {
        return function (...args) {
          console.log(`${label}.${prop}(${args.join(", ")})`);
          const result = value.apply(this, args);
          console.log(`  → returned:`, result);
          return result;
        };
      }
      return value;
    },
  });
}

const api = withLogging({
  fetchUser: (id) => ({ id, name: "Alice" }),
}, "API");

api.fetchUser(1);
// API.fetchUser(1)
//   → returned: { id: 1, name: "Alice" }
```

**3. Negative Array Indexing**
```javascript
function negativeArray(arr) {
  return new Proxy(arr, {
    get(target, prop, receiver) {
      const index = Number(prop);
      if (!isNaN(index) && index < 0) {
        return Reflect.get(target, target.length + index, receiver);
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

const arr = negativeArray([1, 2, 3, 4, 5]);
arr[-1]; // 5
arr[-2]; // 4
```

### How Vue 3 Uses Proxy for Reactivity

```javascript
// Simplified Vue 3 reactivity system

let activeEffect = null;

function reactive(target) {
  const depsMap = new Map(); // prop → Set of effects

  return new Proxy(target, {
    get(target, prop, receiver) {
      // TRACK — register current effect as dependency
      if (activeEffect) {
        if (!depsMap.has(prop)) depsMap.set(prop, new Set());
        depsMap.get(prop).add(activeEffect);
      }
      return Reflect.get(target, prop, receiver);
    },

    set(target, prop, value, receiver) {
      const result = Reflect.set(target, prop, value, receiver);
      // TRIGGER — notify all effects that depend on this prop
      if (depsMap.has(prop)) {
        depsMap.get(prop).forEach((effect) => effect());
      }
      return result;
    },
  });
}

function watchEffect(fn) {
  activeEffect = fn;
  fn(); // Run once to collect dependencies (trigger get traps)
  activeEffect = null;
}

// Usage
const state = reactive({ count: 0, name: "Vue" });

watchEffect(() => {
  // This function auto-tracks state.count as a dependency
  console.log(`Count: ${state.count}`);
});

state.count++; // Automatically logs: "Count: 1"
state.count++; // Automatically logs: "Count: 2"

// Vue 2 used Object.defineProperty (couldn't detect new properties or array mutations)
// Vue 3's Proxy approach handles ALL operations transparently
```

### Why Vue 3 Switched from Object.defineProperty to Proxy

| Feature | Object.defineProperty (Vue 2) | Proxy (Vue 3) |
|---|---|---|
| New property detection | ❌ Need `Vue.set()` | ✅ Automatic |
| Array index mutation | ❌ Not detected | ✅ Detected |
| Property deletion | ❌ Need `Vue.delete()` | ✅ `deleteProperty` trap |
| Performance | Slower (walk all props at init) | Faster (lazy — only on access) |
| Nested objects | Must recursively define at init | Can lazily proxy on access |

### Interview Tip
> "Proxy is one of the most powerful metaprogramming features in JS. Vue 3's reactivity system is the best real-world example — when you access `state.count` inside a `watchEffect`, the Proxy's get trap tracks it as a dependency. When `state.count` changes, the set trap triggers all dependent effects. It's elegant because reactivity becomes invisible to the developer."

---

## Q12: What are decorators in TypeScript? How do you use them in a production codebase?

### Concept

Decorators are special declarations that attach metadata or modify behavior of classes, methods, properties, or parameters. They use the `@expression` syntax.

### Types of Decorators

```typescript
// Enable in tsconfig.json: "experimentalDecorators": true

// 1. CLASS DECORATOR
function Logger(logString: string) {
  return function (constructor: Function) {
    console.log(`${logString}: ${constructor.name}`);
  };
}

@Logger("Logging")
class Person {
  constructor(public name: string) {}
}
// Logs: "Logging: Person"

// 2. METHOD DECORATOR
function Measure(target: any, key: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = performance.now();
    const result = await original.apply(this, args);
    const end = performance.now();
    console.log(`${key} took ${(end - start).toFixed(2)}ms`);
    return result;
  };
}

class UserService {
  @Measure
  async fetchUsers() {
    return await fetch("/api/users");
  }
}
// Logs: "fetchUsers took 234.56ms"

// 3. PROPERTY DECORATOR
function MinLength(min: number) {
  return function (target: any, propertyKey: string) {
    let value: string;
    Object.defineProperty(target, propertyKey, {
      get: () => value,
      set: (newValue: string) => {
        if (newValue.length < min) {
          throw new Error(`${propertyKey} must be at least ${min} characters`);
        }
        value = newValue;
      },
    });
  };
}

class User {
  @MinLength(2)
  name: string;
}

// 4. PARAMETER DECORATOR
function Required(target: any, key: string, index: number) {
  const requiredParams: number[] = Reflect.getMetadata("required", target, key) || [];
  requiredParams.push(index);
  Reflect.defineMetadata("required", requiredParams, target, key);
}
```

### Production Use Cases

```typescript
// CACHING DECORATOR
function Cache(ttlSeconds: number = 60) {
  const cache = new Map<string, { value: any; expiry: number }>();

  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${key}:${JSON.stringify(args)}`;
      const cached = cache.get(cacheKey);

      if (cached && Date.now() < cached.expiry) {
        return cached.value;
      }

      const result = await original.apply(this, args);
      cache.set(cacheKey, { value: result, expiry: Date.now() + ttlSeconds * 1000 });
      return result;
    };
  };
}

// RETRY DECORATOR
function Retry(attempts: number = 3, delayMs: number = 1000) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      for (let i = 0; i < attempts; i++) {
        try {
          return await original.apply(this, args);
        } catch (error) {
          if (i === attempts - 1) throw error;
          await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
        }
      }
    };
  };
}

// AUTHORIZE DECORATOR
function Authorize(roles: string[]) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const user = this.getCurrentUser();
      if (!roles.includes(user.role)) {
        throw new ForbiddenError(`Requires role: ${roles.join(", ")}`);
      }
      return original.apply(this, args);
    };
  };
}

// COMBINED IN A SERVICE
class OrderService {
  @Authorize(["admin", "manager"])
  @Retry(3, 500)
  @Cache(300)
  @Measure
  async getOrders(status: string) {
    return await this.orderRepo.findByStatus(status);
  }
}
// Decorators execute bottom-up: Measure → Cache → Retry → Authorize
```

### NestJS (Framework That Heavily Uses Decorators)

```typescript
// NestJS — the most popular decorator-based Node.js framework

@Controller("/users")
@UseGuards(AuthGuard)
class UserController {
  constructor(private userService: UserService) {}

  @Get("/:id")
  @UseInterceptors(CacheInterceptor)
  async getUser(@Param("id") id: string): Promise<User> {
    return this.userService.findById(id);
  }

  @Post("/")
  @Roles("admin")
  async createUser(@Body() dto: CreateUserDto): Promise<User> {
    return this.userService.create(dto);
  }
}
```

### Interview Tip
> "In production, I use decorators most heavily with NestJS — for routing, guards, interceptors, and validation. For custom decorators, the most valuable patterns are caching, retry logic, authorization, and performance measurement. The key principle is cross-cutting concerns: if the same logic applies to multiple methods, a decorator is cleaner than repeating the boilerplate."

---

## Q13: How do you design and enforce strict TypeScript types across a large monorepo? What strategies do you use for shared types?

### Architecture Strategy

```
monorepo/
├── packages/
│   ├── types/                    ← Shared type definitions
│   │   ├── src/
│   │   │   ├── api.ts            ← API request/response types
│   │   │   ├── models.ts         ← Domain models
│   │   │   ├── common.ts         ← Utilities (Result, Pagination, etc.)
│   │   │   └── index.ts          ← Public API barrel file
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── frontend/                 ← React app
│   │   ├── tsconfig.json         ← extends shared config
│   │   └── src/
│   │
│   ├── backend/                  ← Node.js API
│   │   ├── tsconfig.json         ← extends shared config
│   │   └── src/
│   │
│   └── shared-utils/             ← Shared business logic
│       ├── tsconfig.json
│       └── src/
│
├── tsconfig.base.json            ← Strictest settings (all packages inherit)
├── .eslintrc.js                  ← TypeScript-specific ESLint rules
└── turbo.json / nx.json          ← Monorepo build orchestration
```

### 1. Strict Base TSConfig

```json
// tsconfig.base.json — ALL packages extend this
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true
  }
}

// packages/frontend/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {
      "@myorg/types": ["../types/src"],
      "@myorg/shared": ["../shared-utils/src"]
    }
  },
  "include": ["src"],
  "references": [
    { "path": "../types" },
    { "path": "../shared-utils" }
  ]
}
```

### 2. Shared Types Package

```typescript
// packages/types/src/models.ts

// Domain models used by both frontend and backend
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string; // ISO 8601 (not Date — serializable across network)
}

export type UserRole = "admin" | "editor" | "viewer";

// API contracts — single source of truth
export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNextPage: boolean;
  };
}

// API endpoint types — used to type both fetch calls AND route handlers
export interface ApiEndpoints {
  "GET /users": {
    query: { page?: number; role?: UserRole };
    response: PaginatedResponse<User>;
  };
  "GET /users/:id": {
    params: { id: string };
    response: ApiResponse<User>;
  };
  "POST /users": {
    body: CreateUserDto;
    response: ApiResponse<User>;
  };
}

export type CreateUserDto = Omit<User, "id" | "createdAt">;
```

### 3. ESLint Enforcement

```javascript
// .eslintrc.js
module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/strict-type-checked",
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-return": "error",
    "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/naming-convention": [
      "error",
      { selector: "interface", format: ["PascalCase"] },
      { selector: "typeAlias", format: ["PascalCase"] },
      { selector: "enum", format: ["PascalCase"] },
    ],
  },
};
```

### 4. CI Pipeline Enforcement

```yaml
# .github/workflows/typecheck.yml
type-check:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: npm ci
    - run: npx tsc --noEmit                      # Type check all packages
    - run: npx eslint . --ext .ts,.tsx            # Lint
    - run: npx publint packages/types             # Validate package exports
    - run: npx knip                               # Find unused exports/types
```

### 5. Strategies for Type Sharing

```typescript
// Strategy 1: Contract-driven development
// Define API types first, then implement frontend + backend

// Strategy 2: Zod schemas as single source of truth
import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "editor", "viewer"]),
});

export type User = z.infer<typeof UserSchema>;
// Same schema used for:
//  - TypeScript type (infer)
//  - Runtime validation on backend (parse)
//  - Form validation on frontend (zodResolver)

// Strategy 3: Codegen from API spec
// OpenAPI spec → types generated with openapi-typescript
// GraphQL schema → types generated with graphql-codegen
```

### Interview Tip
> "The key to maintaining type safety across a monorepo is having ONE source of truth for shared types, strict compiler settings inherited by all packages, and CI enforcement that blocks merges on type errors. I prefer Zod schemas as the single source because they give you both compile-time types and runtime validation from the same definition."

---

## Q14: Explain conditional types, mapped types, and template literal types in TypeScript with practical examples.

### Conditional Types

```typescript
// Basic syntax: T extends U ? X : Y

// Example 1: Flatten arrays
type Flatten<T> = T extends Array<infer Item> ? Item : T;

type A = Flatten<string[]>;    // string
type B = Flatten<number>;      // number

// Example 2: Unwrap promises (recursively)
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

type C = Awaited<Promise<Promise<string>>>; // string

// Example 3: Function return types based on input
type ApiResult<T extends "user" | "post"> = T extends "user"
  ? { id: number; name: string; email: string }
  : { id: number; title: string; body: string };

function fetchData<T extends "user" | "post">(type: T): Promise<ApiResult<T>> {
  return fetch(`/api/${type}`).then((r) => r.json());
}

const user = await fetchData("user");   // { id, name, email }
const post = await fetchData("post");   // { id, title, body }

// Example 4: Distributive conditional types
type ToArray<T> = T extends any ? T[] : never;

type D = ToArray<string | number>; // string[] | number[]
// NOT (string | number)[] — distribution applies to each union member

// To prevent distribution, wrap in tuple:
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;
type E = ToArrayNonDist<string | number>; // (string | number)[]
```

### Mapped Types

```typescript
// Syntax: { [K in keyof T]: ... }

// Example 1: Make all properties nullable
type Nullable<T> = { [K in keyof T]: T[K] | null };

interface User { name: string; age: number; }
type NullableUser = Nullable<User>;
// { name: string | null; age: number | null }

// Example 2: Create getters
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = Getters<User>;
// { getName: () => string; getAge: () => number }

// Example 3: Filter properties by type
type OnlyStrings<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

interface Config {
  host: string;
  port: number;
  name: string;
  debug: boolean;
}

type StringConfig = OnlyStrings<Config>;
// { host: string; name: string }

// Example 4: Create event map from actions
type Actions = {
  addUser: { name: string; email: string };
  removeUser: { id: number };
  updateUser: { id: number; data: Partial<User> };
};

type ActionHandlers = {
  [K in keyof Actions as `on${Capitalize<string & K>}`]: (
    payload: Actions[K]
  ) => void;
};
// {
//   onAddUser: (payload: { name: string; email: string }) => void;
//   onRemoveUser: (payload: { id: number }) => void;
//   onUpdateUser: (payload: { id: number; data: Partial<User> }) => void;
// }

// Example 5: Deep readonly
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};
```

### Template Literal Types

```typescript
// Combine string literal types with template syntax

// Example 1: Event names
type EventType = "click" | "focus" | "blur";
type EventHandler = `on${Capitalize<EventType>}`;
// "onClick" | "onFocus" | "onBlur"

// Example 2: CSS properties
type CSSUnit = "px" | "rem" | "em" | "%";
type CSSValue = `${number}${CSSUnit}`;

const width: CSSValue = "100px";    // ✅
const height: CSSValue = "2.5rem";  // ✅
// const bad: CSSValue = "100";     // ❌

// Example 3: Route parameters
type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<`/${Rest}`>
    : T extends `${string}:${infer Param}`
      ? Param
      : never;

type Params = ExtractParams<"/users/:userId/posts/:postId">;
// "userId" | "postId"

// Example 4: Dot-notation path types (for nested object access)
type Path<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${Prefix}${K}` | Path<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

interface FormData {
  user: {
    name: string;
    address: {
      city: string;
      zip: string;
    };
  };
  age: number;
}

type FormPaths = Path<FormData>;
// "user" | "user.name" | "user.address" | "user.address.city" | "user.address.zip" | "age"

// Example 5: SQL-like query builder types
type SelectFields<T> = `SELECT ${keyof T & string} FROM ${string}`;
type Query = SelectFields<User>; // "SELECT name FROM ..." | "SELECT age FROM ..." | ...
```

### Combining All Three (Real-World)

```typescript
// Type-safe API client that combines all three concepts

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type ApiRoutes = {
  "GET /users": { response: User[]; query: { page: number } };
  "GET /users/:id": { response: User; params: { id: string } };
  "POST /users": { response: User; body: CreateUserDto };
  "PUT /users/:id": { response: User; params: { id: string }; body: UpdateUserDto };
  "DELETE /users/:id": { response: void; params: { id: string } };
};

// Extract method and path from route key
type RouteMethod<T extends string> = T extends `${infer M} ${string}` ? M : never;
type RoutePath<T extends string> = T extends `${string} ${infer P}` ? P : never;

// Type-safe fetch
async function apiCall<K extends keyof ApiRoutes>(
  route: K,
  options?: Omit<ApiRoutes[K], "response">
): Promise<ApiRoutes[K]["response"]> {
  // implementation...
}

// Fully type-safe API calls
const users = await apiCall("GET /users", { query: { page: 1 } });
const user = await apiCall("GET /users/:id", { params: { id: "123" } });
await apiCall("POST /users", { body: { name: "Alice", email: "a@b.com" } });
```

### Interview Tip
> "These three features together enable building type-safe DSLs within TypeScript. The most practical application I use daily is type-safe API clients — where the route definition auto-generates the correct request/response types. This eliminates an entire category of bugs where frontend and backend type expectations diverge."

---

## Q15: What is type narrowing and how does it improve code safety?

### Concept

Type narrowing is TypeScript's ability to refine a broad type to a more specific type within a code block, based on runtime checks. The compiler tracks these checks and narrows the type automatically.

### All Narrowing Techniques

**1. typeof Guard**
```typescript
function processValue(value: string | number | boolean) {
  if (typeof value === "string") {
    // TypeScript knows: value is string
    console.log(value.toUpperCase());
  } else if (typeof value === "number") {
    // TypeScript knows: value is number
    console.log(value.toFixed(2));
  } else {
    // TypeScript knows: value is boolean
    console.log(value ? "yes" : "no");
  }
}
```

**2. Truthiness Narrowing**
```typescript
function greet(name: string | null | undefined) {
  if (name) {
    // name is string (null and undefined are falsy)
    console.log(`Hello, ${name.toUpperCase()}`);
  }

  // ⚠️ Caveat: 0, "", NaN are also falsy
  function processCount(count: number | null) {
    if (count) {
      // ❌ This excludes 0, which might be valid
    }
    if (count !== null) {
      // ✅ Better — only excludes null
    }
  }
}
```

**3. Equality Narrowing**
```typescript
function compare(a: string | number, b: string | boolean) {
  if (a === b) {
    // Only common type is string
    // a: string, b: string
    console.log(a.toUpperCase());
  }
}

function handle(value: string | null) {
  if (value !== null) {
    // value: string
  }

  // Works with switch too
  switch (value) {
    case null:
      // value: null
      break;
    default:
      // value: string
      break;
  }
}
```

**4. `in` Operator Narrowing**
```typescript
interface Fish { swim(): void; scales: number }
interface Bird { fly(): void; wingspan: number }

function move(animal: Fish | Bird) {
  if ("swim" in animal) {
    // animal: Fish
    animal.swim();
    console.log(animal.scales);
  } else {
    // animal: Bird
    animal.fly();
    console.log(animal.wingspan);
  }
}
```

**5. instanceof Narrowing**
```typescript
function handleError(error: unknown) {
  if (error instanceof TypeError) {
    console.log(error.message); // TypeScript knows it's TypeError
  } else if (error instanceof RangeError) {
    console.log(error.message); // RangeError
  } else if (error instanceof Error) {
    console.log(error.message); // generic Error
  } else {
    console.log(String(error));  // completely unknown
  }
}
```

**6. Discriminated Union Narrowing (Most Powerful)**
```typescript
type Result<T> =
  | { status: "success"; data: T }
  | { status: "error"; error: Error }
  | { status: "loading" };

function handleResult(result: Result<User>) {
  switch (result.status) {
    case "success":
      // result: { status: "success"; data: User }
      console.log(result.data.name);
      break;
    case "error":
      // result: { status: "error"; error: Error }
      console.log(result.error.message);
      break;
    case "loading":
      // result: { status: "loading" }
      console.log("Loading...");
      break;
  }
}

// React state management with discriminated unions
type FetchState<T> =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "success"; data: T; updatedAt: Date }
  | { phase: "error"; error: Error; retryCount: number };

function UserProfile({ state }: { state: FetchState<User> }) {
  switch (state.phase) {
    case "idle":
      return <p>Click to load</p>;
    case "loading":
      return <Spinner />;
    case "success":
      return <p>{state.data.name}</p>;     // ✅ TypeScript knows data exists
    case "error":
      return <p>Error: {state.error.message} (retries: {state.retryCount})</p>;
  }
}
```

**7. Custom Type Guards (User-Defined)**
```typescript
// Type predicate: `paramName is Type`
function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "email" in value &&
    typeof (value as User).name === "string"
  );
}

function processApiResponse(data: unknown) {
  if (isUser(data)) {
    // data: User — fully narrowed
    console.log(data.name, data.email);
  }
}

// Assertion function (TS 3.7+)
function assertIsUser(value: unknown): asserts value is User {
  if (!isUser(value)) {
    throw new Error("Not a valid User object");
  }
}

function handleData(data: unknown) {
  assertIsUser(data);
  // After this line, data is User — no if/else needed
  console.log(data.name);
}
```

**8. Exhaustive Checking with `never`**
```typescript
type Shape = "circle" | "square" | "triangle";

function getArea(shape: Shape): number {
  switch (shape) {
    case "circle":
      return Math.PI * 100;
    case "square":
      return 100;
    case "triangle":
      return 50;
    default:
      // If someone adds a new shape to the union but forgets to handle it here,
      // TypeScript will error because the new shape can't be assigned to `never`
      const _exhaustive: never = shape;
      throw new Error(`Unhandled shape: ${_exhaustive}`);
  }
}
```

### How Narrowing Improves Code Safety

```typescript
// WITHOUT narrowing — unsafe, verbose, error-prone
function processUser(user: User | null) {
  const name = (user as User).name; // ❌ Unsafe cast — crashes if null
  console.log(name.toUpperCase());  // 💥 Runtime error if user is null
}

// WITH narrowing — safe, clean, compiler-verified
function processUser(user: User | null) {
  if (!user) {
    console.log("No user provided");
    return;
  }
  // TypeScript GUARANTEES user is not null from this point
  console.log(user.name.toUpperCase()); // ✅ 100% safe
}
```

### Real-World React Pattern

```typescript
// Type-safe event handling with narrowing
function handleFormElement(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  const target = e.target;

  if (target instanceof HTMLInputElement) {
    if (target.type === "checkbox") {
      console.log("Checkbox:", target.checked);
    } else if (target.type === "file") {
      console.log("Files:", target.files);
    } else {
      console.log("Input:", target.value);
    }
  } else if (target instanceof HTMLSelectElement) {
    console.log("Selected:", target.selectedOptions);
  } else {
    console.log("Textarea:", target.value);
  }
}
```

### Interview Tip
> "Type narrowing is what makes TypeScript's type system practical rather than just theoretical. The compiler acts as a proof assistant — it verifies that you've handled all cases before letting you access type-specific properties. The most powerful pattern is discriminated unions with exhaustive checking using `never`, because adding a new variant to the union causes compile errors everywhere it's not handled — the compiler literally finds bugs for you."

---



---

> **Final Tip:** At the Team Lead level, interviewers don't just want to hear WHAT these features are — they want to hear HOW you've used them in production, WHEN to use (and not use) them, and how you'd TEACH them to your team. Pair every answer with a real scenario from your experience.
