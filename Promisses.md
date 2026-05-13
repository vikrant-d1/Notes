# JavaScript Promises — Senior Developer Reference

> A concise, no-fluff guide covering internals, patterns, pitfalls, and real-world usage.

---

## 1. Promise Fundamentals

A Promise is a proxy for a value not yet known at creation time. It exists in one of three states:

| State | Description | Transition |
|-------|-------------|------------|
| **Pending** | Initial state, neither fulfilled nor rejected | → Fulfilled or Rejected |
| **Fulfilled** | Operation completed successfully | Terminal |
| **Rejected** | Operation failed | Terminal |

Once settled (fulfilled or rejected), a promise is **immutable** — it cannot change state again.

```js
const promise = new Promise((resolve, reject) => {
  // resolve(value) → fulfilled
  // reject(reason) → rejected
  // Only the FIRST call wins; subsequent calls are ignored
  resolve("first");
  resolve("second"); // ignored
  reject("error");   // ignored
});
```

### Microtask Queue

Promises always resolve **asynchronously** via the **microtask queue**, which has higher priority than the macrotask queue (setTimeout, setInterval).

```js
console.log("1 - sync");

setTimeout(() => console.log("2 - macrotask"), 0);

Promise.resolve().then(() => console.log("3 - microtask"));

console.log("4 - sync");

// Output: 1 - sync → 4 - sync → 3 - microtask → 2 - macrotask
```

---

## 2. The Four Static Combinator Methods

### 2.1 `Promise.all(iterable)`

Waits for **all** to resolve. **Short-circuits** on the first rejection.

```js
// ✅ All resolve
const [user, posts] = await Promise.all([
  fetchUser(1),
  fetchPosts(1)
]);

// ❌ One rejects — entire result is lost
Promise.all([
  Promise.resolve("A"),
  Promise.reject("B failed"),
  Promise.resolve("C")           // never awaited
]).catch(err => console.log(err)); // "B failed"
```

**Use when:** All results are required and partial data is useless (page load, transaction steps).

---

### 2.2 `Promise.allSettled(iterable)`

Waits for **all** to settle. **Never rejects.** Returns status objects.

```js
const results = await Promise.allSettled([
  sendEmail(user1),       // resolves
  sendEmail(user2),       // rejects
  sendEmail(user3)        // resolves
]);

// results:
// [
//   { status: "fulfilled", value: "sent" },
//   { status: "rejected",  reason: Error("invalid email") },
//   { status: "fulfilled", value: "sent" }
// ]

// Pattern: filter failures
const failed = results.filter(r => r.status === "rejected");
const succeeded = results.filter(r => r.status === "fulfilled");
```

**Use when:** You need results from every operation regardless of individual failures (batch processing, multi-API calls, bulk notifications).

---

### 2.3 `Promise.race(iterable)`

Returns the **first settled** promise — resolve or reject.

```js
// Timeout pattern
const fetchWithTimeout = (url, ms) => {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    )
  ]);
};

await fetchWithTimeout("/api/data", 5000);
```

**Use when:** You care about the fastest response regardless of outcome (timeouts, first-response-wins).

---

### 2.4 `Promise.any(iterable)`

Returns the **first resolved** promise. Ignores rejections unless **all** reject.

```js
// Fastest mirror wins
const data = await Promise.any([
  fetch("https://api-us.example.com/data"),
  fetch("https://api-eu.example.com/data"),
  fetch("https://api-asia.example.com/data")
]);

// All reject → AggregateError
Promise.any([
  Promise.reject("err1"),
  Promise.reject("err2")
]).catch(err => {
  console.log(err instanceof AggregateError); // true
  console.log(err.errors);                    // ["err1", "err2"]
});
```

**Use when:** You need the first success from redundant sources (CDN fallbacks, multi-region APIs).

---

### Combinator Cheat Sheet

| Method | Resolves when | Rejects when | Short-circuits? |
|--------|--------------|-------------|----------------|
| `all` | All resolve | Any one rejects | Yes (on reject) |
| `allSettled` | All settle | Never | No |
| `race` | First settles (resolve) | First settles (reject) | Yes (first settle) |
| `any` | First resolves | All reject (`AggregateError`) | Yes (on resolve) |

---

## 3. Promise Chaining & Error Handling

### Chaining

Each `.then()` returns a **new promise**, enabling chaining:

```js
fetch("/api/user/1")
  .then(res => res.json())          // returns new promise
  .then(user => fetch(`/api/posts/${user.id}`))
  .then(res => res.json())
  .then(posts => console.log(posts))
  .catch(err => console.error(err)) // catches ANY error above
  .finally(() => hideLoader());      // always runs
```

### Error Propagation

Errors propagate down the chain until caught:

```js
Promise.resolve()
  .then(() => { throw new Error("step 1"); })
  .then(() => console.log("step 2"))   // SKIPPED
  .then(() => console.log("step 3"))   // SKIPPED
  .catch(err => {
    console.log(err.message);          // "step 1"
    return "recovered";                // chain continues
  })
  .then(val => console.log(val));      // "recovered"
```

### `.catch()` vs `.then(null, onRejected)`

```js
// These are NOT identical
promise.then(onFulfilled).catch(onRejected);
// ↑ catch handles errors from BOTH promise AND onFulfilled

promise.then(onFulfilled, onRejected);
// ↑ onRejected handles errors from promise ONLY, not from onFulfilled
```

---

## 4. async/await — Syntactic Sugar

### Basics

```js
// Promise-based
function getUser(id) {
  return fetch(`/api/users/${id}`)
    .then(res => res.json());
}

// async/await equivalent
async function getUser(id) {
  const res = await fetch(`/api/users/${id}`);
  return res.json(); // auto-wrapped in Promise.resolve()
}
```

### Error Handling Patterns

```js
// Pattern 1: try/catch
async function getData() {
  try {
    const res = await fetch("/api/data");
    return await res.json();
  } catch (err) {
    console.error("Failed:", err);
    return null;
  }
}

// Pattern 2: Tuple pattern (Go-style) — avoids nested try/catch
async function to(promise) {
  try {
    const data = await promise;
    return [null, data];
  } catch (err) {
    return [err, null];
  }
}

const [err, user] = await to(fetchUser(1));
if (err) return handleError(err);

const [err2, posts] = await to(fetchPosts(user.id));
if (err2) return handleError(err2);
```

### Top-Level Await

Available in ES modules (Node 14.8+ with `--harmony-top-level-await`, native in Node 16+):

```js
// config.mjs
const res = await fetch("/api/config");
export const config = await res.json();
```

---

## 5. Advanced Patterns

### 5.1 Sequential Execution

```js
// Process array items one by one
const urls = ["/api/1", "/api/2", "/api/3"];

// Using reduce
const results = await urls.reduce(async (accPromise, url) => {
  const acc = await accPromise;
  const res = await fetch(url);
  const data = await res.json();
  return [...acc, data];
}, Promise.resolve([]));

// Cleaner: for...of
const results = [];
for (const url of urls) {
  const res = await fetch(url);
  results.push(await res.json());
}
```

### 5.2 Concurrency Control (Batching)

```js
async function batchProcess(items, batchSize, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

// Process 100 items, 5 at a time
await batchProcess(userIds, 5, fetchUser);
```

### 5.3 Retry with Exponential Backoff

```js
async function retry(fn, { retries = 3, delay = 1000, factor = 2 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      const waitTime = delay * Math.pow(factor, attempt);
      await new Promise(r => setTimeout(r, waitTime));
    }
  }
}

const data = await retry(() => fetch("/flaky-api"), { retries: 3 });
```

### 5.4 Promisify (Callback → Promise)

```js
// Manual
function readFileAsync(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// Built-in (Node.js)
const { promisify } = require("util");
const readFile = promisify(fs.readFile);

// fs/promises (modern Node.js — preferred)
const { readFile } = require("fs/promises");
```

### 5.5 Deferred Pattern

```js
function createDeferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// Usage: resolve a promise from outside
const { promise, resolve } = createDeferred();
setTimeout(() => resolve("done"), 2000);
const result = await promise; // "done"

// Built-in (modern): Promise.withResolvers() — ES2024
const { promise, resolve, reject } = Promise.withResolvers();
```

### 5.6 Cancellable Promises with AbortController

```js
async function fetchWithCancel(url) {
  const controller = new AbortController();

  const promise = fetch(url, { signal: controller.signal })
    .then(res => res.json());

  return { promise, cancel: () => controller.abort() };
}

const { promise, cancel } = fetchWithCancel("/api/data");
setTimeout(cancel, 3000); // cancel after 3 seconds

try {
  const data = await promise;
} catch (err) {
  if (err.name === "AbortError") console.log("Request cancelled");
}
```

---

## 6. Common Pitfalls

### ❌ Forgetting to return in `.then()`

```js
// BUG: second .then() receives undefined
fetch("/api")
  .then(res => { res.json(); })   // missing return!
  .then(data => console.log(data)); // undefined

// FIX
fetch("/api")
  .then(res => res.json())
  .then(data => console.log(data));
```

### ❌ Creating promises inside async functions unnecessarily

```js
// BAD — unnecessary Promise wrapper
async function getUser(id) {
  return new Promise((resolve) => {
    const user = await db.findUser(id); // SyntaxError: can't await here
    resolve(user);
  });
}

// GOOD
async function getUser(id) {
  return db.findUser(id);
}
```

### ❌ Unhandled promise rejections

```js
// BAD — silent failure
async function riskyOperation() {
  const data = await fetch("/api"); // if this throws, unhandled rejection
}
riskyOperation(); // no .catch(), no try/catch

// GOOD
riskyOperation().catch(console.error);

// Node.js global handler
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
  // Log to monitoring service
});
```

### ❌ Sequential await when parallel is possible

```js
// SLOW — sequential (total: ~2 seconds)
const user = await fetchUser();    // 1 sec
const posts = await fetchPosts();  // 1 sec

// FAST — parallel (total: ~1 second)
const [user, posts] = await Promise.all([
  fetchUser(),
  fetchPosts()
]);
```

### ❌ `forEach` doesn't await

```js
// BUG — fires all at once, doesn't await
items.forEach(async (item) => {
  await processItem(item); // not actually sequential
});
console.log("done"); // runs BEFORE processing finishes

// FIX — use for...of for sequential
for (const item of items) {
  await processItem(item);
}
console.log("done"); // runs after all items processed
```

---

## 7. Promise.withResolvers() — ES2024

A cleaner version of the deferred pattern, now built into the language:

```js
const { promise, resolve, reject } = Promise.withResolvers();

// Equivalent to:
// let resolve, reject;
// const promise = new Promise((res, rej) => { resolve = res; reject = rej; });

// Real-world: event-to-promise bridge
function waitForEvent(emitter, event) {
  const { promise, resolve, reject } = Promise.withResolvers();
  emitter.once(event, resolve);
  emitter.once("error", reject);
  return promise;
}

const data = await waitForEvent(stream, "data");
```

---

## 8. Interview-Ready Quick Reference

```
Q: What is the event loop order?
A: Call stack → Microtasks (Promises, queueMicrotask) → Macrotasks (setTimeout, I/O)

Q: Is async function return value always a promise?
A: Yes. Even `async function f() { return 42; }` returns `Promise<42>`.

Q: Can a settled promise change state?
A: No. Once fulfilled or rejected, it's immutable.

Q: What happens if you await a non-promise?
A: It's wrapped in Promise.resolve(value) and resolved immediately.

Q: Promise.resolve() vs new Promise(resolve => resolve())?
A: Promise.resolve(value) — if value is a thenable, adopts its state.
   If value is already a Promise, returns it as-is (no wrapping).
   new Promise(resolve => resolve(value)) — always creates a NEW promise.
```

---

*Last updated: May 2026 | Covers ES2024+ features*
