# Advanced Promise & Async Patterns in JavaScript / Node.js

A practical guide to **Promises, async/await, concurrency, retries, timeouts, cancellation, error handling, and production patterns** for JavaScript and Node.js.

---

## Table of Contents

1. [Promise Basics](#1-promise-basics)
2. [Promise States](#2-promise-states)
3. [async/await](#3-asyncawait)
4. [Promise.all](#4-promiseall)
5. [Promise.allSettled](#5-promiseallsettled)
6. [Promise.race](#6-promiserace)
7. [Promise.any](#7-promiseany)
8. [Sequential vs Parallel Execution](#8-sequential-vs-parallel-execution)
9. [Async map Mistake](#9-async-map-mistake)
10. [Controlled Concurrency](#10-controlled-concurrency)
11. [Retry Pattern](#11-retry-pattern)
12. [Exponential Backoff](#12-exponential-backoff)
13. [Timeout Pattern](#13-timeout-pattern)
14. [AbortController](#14-abortcontroller)
15. [Error Handling](#15-error-handling)
16. [Promise Chaining](#16-promise-chaining)
17. [Promise Constructor Anti-Pattern](#17-promise-constructor-anti-pattern)
18. [Async Functions Return Promises](#18-async-functions-return-promises)
19. [Await and the Event Loop](#19-await-and-the-event-loop)
20. [Async Loops](#20-async-loops)
21. [Parallel API Calls](#21-parallel-api-calls)
22. [Fail-Fast vs Partial Success](#22-fail-fast-vs-partial-success)
23. [Retry + Timeout](#23-retry--timeout)
24. [Concurrency + Retry](#24-concurrency--retry)
25. [Worker Pool Pattern](#25-worker-pool-pattern)
26. [Production API Example](#26-production-api-example)
27. [Common Mistakes](#27-common-mistakes)
28. [Interview Questions](#28-interview-questions)
29. [Senior-Level Scenarios](#29-senior-level-scenarios)
30. [Quick Cheat Sheet](#30-quick-cheat-sheet)

---

# 1. Promise Basics

A Promise represents the eventual result of an asynchronous operation.

```js
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve("Success");
  }, 1000);
});
```

Consume it:

```js
promise
  .then(result => {
    console.log(result);
  })
  .catch(error => {
    console.error(error);
  });
```

---

# 2. Promise States

A Promise has three states:

```text
Pending
   |
   +------> Fulfilled
   |
   +------> Rejected
```

### Pending

Operation is still running.

### Fulfilled

Operation completed successfully.

### Rejected

Operation failed.

Example:

```js
const promise = new Promise((resolve, reject) => {
  const success = true;

  if (success) {
    resolve("Success");
  } else {
    reject(new Error("Something went wrong"));
  }
});
```

---

# 3. async/await

`async/await` provides a cleaner way to work with Promises.

```js
async function getUser() {
  const user = await fetchUser();

  return user;
}
```

Error handling:

```js
async function getUser() {
  try {
    const user = await fetchUser();

    return user;
  } catch (error) {
    console.error(error);
  }
}
```

Important:

> `await` pauses the current async function, not the entire Node.js event loop.

---

# 4. Promise.all

Use `Promise.all()` when multiple operations are independent and **all results are required**.

```js
const [users, products, orders] = await Promise.all([
  getUsers(),
  getProducts(),
  getOrders()
]);
```

Instead of:

```js
const users = await getUsers();
const products = await getProducts();
const orders = await getOrders();
```

The second approach is sequential.

### Promise.all behavior

```text
Promise 1 ──────── Success
Promise 2 ───── Error
Promise 3 ──────── Success

                ↓

          Promise.all()
                ↓
              Reject
```

`Promise.all()` is **fail-fast**.

If one Promise rejects, the entire operation rejects.

---

# 5. Promise.allSettled

Use `Promise.allSettled()` when you want the result of **every operation**, regardless of success or failure.

```js
const results = await Promise.allSettled([
  sendEmail(),
  sendSMS(),
  sendPushNotification()
]);
```

Example result:

```js
[
  {
    status: "fulfilled",
    value: "Email sent"
  },
  {
    status: "rejected",
    reason: Error("SMS failed")
  },
  {
    status: "fulfilled",
    value: "Push sent"
  }
]
```

### Use cases

- Notifications
- Bulk processing
- Reports
- Multiple independent APIs
- Background jobs

---

# 6. Promise.race

`Promise.race()` returns the result of the first Promise to **settle**.

```js
const result = await Promise.race([
  server1(),
  server2(),
  server3()
]);
```

Important:

> `race()` means first fulfilled OR rejected Promise.

Example:

```text
Server 1 → 500ms → Success
Server 2 → 100ms → Error
Server 3 → 300ms → Success

Promise.race()
       ↓
     Error
```

The error wins because it settled first.

---

# 7. Promise.any

`Promise.any()` returns the first **successful** Promise.

```js
const result = await Promise.any([
  server1(),
  server2(),
  server3()
]);
```

Example:

```text
Server 1 → Error
Server 2 → Error
Server 3 → Success

Promise.any()
     ↓
Server 3 result
```

If all Promises fail:

```js
try {
  await Promise.any([
    server1(),
    server2(),
    server3()
  ]);
} catch (error) {
  console.log(error instanceof AggregateError);
}
```

---

# 8. Sequential vs Parallel Execution

## Sequential

```js
const user = await getUser();

const orders = await getOrders();

const payments = await getPayments();
```

Execution:

```text
getUser
   ↓
getOrders
   ↓
getPayments
```

Total time is approximately:

```text
100ms + 200ms + 300ms = 600ms
```

---

## Parallel

If operations are independent:

```js
const [user, orders, payments] = await Promise.all([
  getUser(),
  getOrders(),
  getPayments()
]);
```

Execution:

```text
getUser       ──────┐
getOrders     ──────┤
getPayments   ──────┤
                    ↓
                  Result
```

Total time is approximately:

```text
max(100, 200, 300) = 300ms
```

---

# 9. Async map Mistake

A common mistake:

```js
const users = await users.map(async user => {
  return getUser(user.id);
});
```

This does NOT give you the users.

It gives:

```js
[
  Promise,
  Promise,
  Promise
]
```

### Correct

```js
const users = await Promise.all(
  userIds.map(id => getUser(id))
);
```

This is one of the most common JavaScript interview questions.

---

# 10. Controlled Concurrency

Using:

```js
await Promise.all(
  users.map(user => sendEmail(user))
);
```

with 10,000 users can create thousands of concurrent operations.

This can overload:

- Database
- External API
- Redis
- SMTP server
- CPU
- Network

Instead, limit concurrency.

```js
async function processWithLimit(items, limit, fn) {
  const results = [];

  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;

      results[currentIndex] = await fn(
        items[currentIndex]
      );
    }
  }

  const workers = Array.from(
    { length: limit },
    () => worker()
  );

  await Promise.all(workers);

  return results;
}
```

Usage:

```js
const results = await processWithLimit(
  users,
  5,
  sendEmail
);
```

Now only five operations are active at a time.

```text
Concurrency = 5

Worker 1 → User 1
Worker 2 → User 2
Worker 3 → User 3
Worker 4 → User 4
Worker 5 → User 5

When one finishes:

Worker 1 → User 6
```

---

# 11. Retry Pattern

Temporary failures should sometimes be retried.

```js
async function retry(fn, retries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      console.log(`Attempt ${attempt} failed`);
    }
  }

  throw lastError;
}
```

Usage:

```js
const user = await retry(
  () => fetchUser(),
  3
);
```

---

# 12. Exponential Backoff

Retrying immediately can overload an already struggling service.

Use exponential backoff:

```js
async function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
```

```js
async function retry(
  fn,
  retries = 3
) {
  let lastError;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const delay = 2 ** attempt * 1000;

      await sleep(delay);
    }
  }

  throw lastError;
}
```

Retry schedule:

```text
Attempt 1 → 1 second
Attempt 2 → 2 seconds
Attempt 3 → 4 seconds
```

---

# 13. Timeout Pattern

An external service shouldn't be allowed to hang forever.

Basic timeout:

```js
function timeout(promise, ms) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error("Request timeout"));
    }, ms);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]);
}
```

Usage:

```js
const result = await timeout(
  fetchUser(),
  3000
);
```

After three seconds:

```text
API Request
    |
    | 3 seconds
    ↓
Timeout
    |
    ↓
Error
```

However, `Promise.race()` does not cancel the original operation.

For actual cancellation, use `AbortController`.

---

# 14. AbortController

Modern Node.js APIs such as `fetch()` support cancellation.

```js
const controller = new AbortController();

const timeoutId = setTimeout(() => {
  controller.abort();
}, 3000);

try {
  const response = await fetch(
    "https://api.example.com/users",
    {
      signal: controller.signal
    }
  );

  const data = await response.json();

  console.log(data);
} catch (error) {
  console.error(error);
} finally {
  clearTimeout(timeoutId);
}
```

### Why use AbortController?

Because timeout alone:

```js
Promise.race(...)
```

only stops waiting for the Promise.

It does not necessarily stop the underlying operation.

`AbortController` can signal cancellation to APIs that support it.

---

# 15. Error Handling

Standard approach:

```js
async function handler() {
  try {
    const user = await getUser();

    return user;
  } catch (error) {
    console.error(error);

    throw error;
  }
}
```

For Express:

```js
app.get("/users", async (req, res, next) => {
  try {
    const users = await getUsers();

    res.json(users);
  } catch (error) {
    next(error);
  }
});
```

---

# 16. Promise Chaining

Promises can be chained:

```js
getUser()
  .then(user => getOrders(user.id))
  .then(orders => getPayment(orders[0].id))
  .then(payment => {
    console.log(payment);
  })
  .catch(error => {
    console.error(error);
  });
```

Modern version:

```js
try {
  const user = await getUser();

  const orders = await getOrders(user.id);

  const payment = await getPayment(
    orders[0].id
  );

  console.log(payment);
} catch (error) {
  console.error(error);
}
```

---

# 17. Promise Constructor Anti-Pattern

Avoid unnecessary Promise wrapping.

### Bad

```js
function getUser() {
  return new Promise(async (resolve, reject) => {
    const user = await db.getUser();

    resolve(user);
  });
}
```

Problems:

- Unnecessary Promise
- `async` Promise executor is an anti-pattern
- Error handling becomes more complicated

### Good

```js
async function getUser() {
  return db.getUser();
}
```

Or simply:

```js
function getUser() {
  return db.getUser();
}
```

if `db.getUser()` already returns a Promise.

---

# 18. Async Functions Return Promises

This:

```js
async function getValue() {
  return 100;
}
```

is effectively:

```js
function getValue() {
  return Promise.resolve(100);
}
```

Therefore:

```js
const value = getValue();

console.log(value);
```

prints a Promise.

Use:

```js
const value = await getValue();
```

---

# 19. Await and the Event Loop

Consider:

```js
async function main() {
  console.log("A");

  await fetchData();

  console.log("B");
}

main();

console.log("C");
```

Output:

```text
A
C
B
```

Why?

```text
main()
  |
  ├── console.log("A")
  |
  ├── await fetchData()
  |
  └── function suspends

main execution continues
  |
  └── console.log("C")

fetchData completes
  |
  └── main resumes
          |
          └── console.log("B")
```

`await` does not block the Node.js event loop.

---

# 20. Async Loops

## Sequential processing

```js
for (const user of users) {
  await sendEmail(user);
}
```

Use when:

- Order matters
- API has rate limits
- Each operation depends on the previous one
- You intentionally want one operation at a time

---

## Parallel processing

```js
await Promise.all(
  users.map(user => sendEmail(user))
);
```

Use when:

- Operations are independent
- Concurrency is acceptable
- You need maximum throughput

---

## Controlled concurrency

```js
await processWithLimit(
  users,
  10,
  sendEmail
);
```

Use for large workloads.

---

# 21. Parallel API Calls

Imagine:

```text
GET /dashboard
```

You need:

```text
User
Orders
Recommendations
Notifications
```

Bad:

```js
const user = await getUser();

const orders = await getOrders();

const recommendations =
  await getRecommendations();

const notifications =
  await getNotifications();
```

Better:

```js
const [
  user,
  orders,
  recommendations,
  notifications
] = await Promise.all([
  getUser(),
  getOrders(),
  getRecommendations(),
  getNotifications()
]);
```

This can significantly reduce API latency.

---

# 22. Fail-Fast vs Partial Success

## Promise.all

Use when every operation is required.

```js
await Promise.all([
  getUser(),
  getOrders(),
  getPayment()
]);
```

If one fails:

```text
User       → Success
Orders     → Error
Payment    → Success

Result → Error
```

---

## Promise.allSettled

Use when partial results are acceptable.

```js
const results = await Promise.allSettled([
  getUser(),
  getOrders(),
  getRecommendations()
]);
```

Now you can process successful and failed operations independently.

---

# 23. Retry + Timeout

A production API call often needs both retry and timeout.

```js
async function fetchWithRetry(
  fn,
  retries = 3,
  timeoutMs = 3000
) {
  let lastError;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await timeout(
        fn(),
        timeoutMs
      );
    } catch (error) {
      lastError = error;

      console.log(
        `Attempt ${attempt + 1} failed`
      );
    }
  }

  throw lastError;
}
```

Usage:

```js
const user = await fetchWithRetry(
  () => fetchUser(),
  3,
  3000
);
```

Production improvements:

- Exponential backoff
- Jitter
- AbortController
- Retry only transient errors
- Maximum retry limit
- Logging
- Metrics

---

# 24. Concurrency + Retry

Bulk processing often requires both.

Example:

```js
await processWithLimit(
  users,
  10,
  user =>
    retry(
      () => sendEmail(user),
      3
    )
);
```

Architecture:

```text
             1000 Users
                  |
                  ↓
          Concurrency Limit
                  |
          ┌───────┼───────┐
          ↓       ↓       ↓
       Worker   Worker   Worker
          |       |       |
        Retry   Retry   Retry
          |       |       |
          ↓       ↓       ↓
        Email   Email   Email
```

This is much safer than:

```js
Promise.all(
  users.map(user =>
    retry(() => sendEmail(user))
  )
);
```

for very large datasets.

---

# 25. Worker Pool Pattern

For CPU-heavy work, Promises alone are not enough.

Example:

```js
const { Worker } = require("worker_threads");
```

CPU-intensive operations include:

- Image processing
- Large JSON transformation
- Encryption
- Compression
- Complex calculations
- Fibonacci
- Data processing

Example:

```js
function runWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      "./worker.js",
      {
        workerData: data
      }
    );

    worker.once("message", resolve);

    worker.once("error", reject);

    worker.once("exit", code => {
      if (code !== 0) {
        reject(
          new Error(
            `Worker exited with code ${code}`
          )
        );
      }
    });
  });
}
```

Then:

```js
const result = await runWorker(40);

console.log(result);
```

Important:

> Promises manage asynchronous control flow. They do not make CPU-heavy JavaScript execution run on another thread.

For CPU-heavy work, consider:

```text
Main Thread
     |
     ↓
Worker Threads
     |
     ├── CPU Task 1
     ├── CPU Task 2
     └── CPU Task 3
```

---

# 26. Production API Example

Suppose your API needs to load:

```text
User
Orders
Recommendations
Notifications
```

Implementation:

```js
async function getDashboard(userId) {
  const [
    user,
    orders,
    recommendations,
    notifications
  ] = await Promise.all([
    getUser(userId),
    getOrders(userId),
    getRecommendations(userId),
    getNotifications(userId)
  ]);

  return {
    user,
    orders,
    recommendations,
    notifications
  };
}
```

But suppose recommendations are non-critical.

Then:

```js
async function getDashboard(userId) {
  const [
    user,
    orders,
    recommendations,
    notifications
  ] = await Promise.allSettled([
    getUser(userId),
    getOrders(userId),
    getRecommendations(userId),
    getNotifications(userId)
  ]);

  return {
    user,
    orders,
    recommendations,
    notifications
  };
}
```

In real applications, you would map the `allSettled()` results into an appropriate API response instead of exposing raw Promise result objects.

---

# 27. Common Mistakes

## Mistake 1 — Sequential calls unnecessarily

```js
const a = await getA();
const b = await getB();
const c = await getC();
```

If independent:

```js
const [a, b, c] = await Promise.all([
  getA(),
  getB(),
  getC()
]);
```

---

## Mistake 2 — Async map

```js
const result = users.map(async user => {
  return getUser(user.id);
});
```

Correct:

```js
const result = await Promise.all(
  users.map(user => getUser(user.id))
);
```

---

## Mistake 3 — Unlimited concurrency

```js
await Promise.all(
  hugeArray.map(processItem)
);
```

For large workloads, use a concurrency limit.

---

## Mistake 4 — Retry everything

Don't retry:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
```

Usually retry transient failures such as:

```text
408 Request Timeout
429 Too Many Requests
500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
504 Gateway Timeout
```

The exact retry policy depends on the API and operation.

---

## Mistake 5 — Retrying non-idempotent operations blindly

Be careful retrying:

```http
POST /payments
```

A retry could potentially create duplicate side effects.

For critical operations, use:

```text
Idempotency Key
```

or an equivalent deduplication mechanism.

---

## Mistake 6 — Promise.race as real cancellation

```js
await Promise.race([
  fetchData(),
  timeoutPromise
]);
```

This doesn't automatically cancel `fetchData()`.

Use `AbortController` when cancellation is supported.

---

# 28. Interview Questions

## Basic

### Q1. What is a Promise?

A Promise represents the eventual completion or failure of an asynchronous operation.

---

### Q2. What are the states of a Promise?

```text
Pending
Fulfilled
Rejected
```

---

### Q3. What does async do?

An `async` function always returns a Promise.

---

### Q4. What does await do?

It pauses execution of the current async function until the awaited Promise settles.

It does not block the entire Node.js event loop.

---

# 29. Advanced Interview Questions

### Q5. Difference between Promise.all and Promise.allSettled?

| Feature | Promise.all | Promise.allSettled |
|---|---|---|
| Waits for all | Yes | Yes |
| Fails fast | Yes | No |
| Returns failures | Rejects | Yes |
| Partial results | No | Yes |
| Use case | All required | Partial success |

---

### Q6. Difference between race and any?

| Feature | race | any |
|---|---|---|
| First fulfilled | Yes | Yes |
| First rejected can win | Yes | No |
| All rejected | Rejects | AggregateError |
| Main use | First settlement | First success |

---

### Q7. Why shouldn't we use Promise.all for 100,000 records?

Because it can create excessive concurrent operations and overload:

- Memory
- Database
- APIs
- Network
- Connection pools

Use controlled concurrency.

---

### Q8. How would you implement retry?

Use:

```text
Retry
+
Exponential Backoff
+
Jitter
+
Maximum Attempts
+
Error Classification
```

---

### Q9. How do you timeout an API request?

Prefer:

```js
AbortController
```

for APIs that support cancellation.

---

### Q10. Does await block Node.js?

No.

It suspends the current async function while Node.js can continue processing other work.

---

# 30. Senior-Level Scenarios

## Scenario 1

> Your API calls five external services. One service takes 10 seconds.

Answer:

```text
1. Identify independent calls
2. Execute them concurrently
3. Add timeouts
4. Use AbortController
5. Retry transient failures
6. Add exponential backoff
7. Add jitter
8. Use allSettled for non-critical dependencies
9. Add metrics/tracing
10. Define fallback behavior
```

---

## Scenario 2

> You need to send emails to 1 million users.

Don't do:

```js
await Promise.all(
  users.map(sendEmail)
);
```

Instead:

```text
Database
   ↓
Batch records
   ↓
Queue
   ↓
Workers
   ↓
Concurrency limit
   ↓
Email Provider
   ↓
Retry failed messages
```

For very large workloads, use a job queue such as BullMQ or another queue system rather than keeping everything inside one HTTP request.

---

## Scenario 3

> Three replicas provide the same data. One is slow.

Possible approach:

```js
const result = await Promise.any([
  server1(),
  server2(),
  server3()
]);
```

This returns the first successful response.

For production, also consider:

- Timeouts
- Cancellation
- Health checks
- Load balancing
- Observability

---

## Scenario 4

> One optional API fails but the main API should still return.

Use:

```js
const results = await Promise.allSettled([
  getUser(),
  getOrders(),
  getRecommendations()
]);
```

Then provide a fallback for recommendations.

---

# 31. Promise Decision Guide

```text
Need multiple operations?
          |
          ↓
Are they independent?
      /          \
    No            Yes
    |              |
Sequential       Need all?
                   |
              ┌────┴────┐
             Yes       No
              |         |
        Promise.all   Partial?
                       |
                 Promise.allSettled

Need first settlement?
        |
        ↓
   Promise.race

Need first success?
        |
        ↓
   Promise.any

Huge number of tasks?
        |
        ↓
Controlled concurrency

Temporary failure?
        |
        ↓
Retry + Backoff

Need cancellation?
        |
        ↓
AbortController

CPU-heavy operation?
        |
        ↓
Worker Threads
```

---

# 32. Quick Cheat Sheet

| Requirement | Pattern |
|---|---|
| Run independent tasks together | `Promise.all()` |
| Collect success + failure | `Promise.allSettled()` |
| First settled result | `Promise.race()` |
| First successful result | `Promise.any()` |
| Sequential execution | `for...of + await` |
| Large number of tasks | Controlled concurrency |
| Temporary failures | Retry |
| Retry safely | Exponential backoff + jitter |
| Cancel request | `AbortController` |
| Timeout request | `AbortController` + timer |
| CPU-heavy work | Worker Threads |
| Optional dependency | `allSettled()` / fallback |
| Multiple replicas | `Promise.any()` |
| Required dependencies | `Promise.all()` |

---

# 33. Key Rules to Remember

```text
1. Independent operations → Promise.all()

2. Partial success acceptable → Promise.allSettled()

3. First settlement → Promise.race()

4. First success → Promise.any()

5. Don't blindly Promise.all() huge arrays

6. Use controlled concurrency for bulk work

7. Retry only appropriate transient failures

8. Use exponential backoff + jitter

9. Use AbortController for cancellation

10. async map → Promise.all(map(...))

11. Don't unnecessarily wrap Promises

12. await doesn't block the Node.js event loop

13. Promises don't create new threads

14. CPU-heavy work → Worker Threads

15. Always consider idempotency before retrying side effects
```

---

# 34. Practice Tasks

### Beginner

1. Create a Promise that resolves after 2 seconds.
2. Create a Promise that rejects after 2 seconds.
3. Convert Promise chaining to async/await.
4. Implement `Promise.all()` manually.
5. Explain the difference between `Promise.race()` and `Promise.any()`.

### Intermediate

6. Implement retry logic.
7. Implement exponential backoff.
8. Implement timeout.
9. Process 100 users sequentially.
10. Process 100 users in parallel.
11. Process 100 users with maximum concurrency of 5.

### Advanced

12. Build a retry + timeout utility.
13. Add exponential backoff + jitter.
14. Add AbortController.
15. Build a concurrency limiter.
16. Build a worker pool using Worker Threads.
17. Build an API aggregator using `Promise.allSettled()`.
18. Build a multi-server request using `Promise.any()`.
19. Design a bulk email processing system.
20. Design a resilient external API client.

---

# 35. Final Interview Mental Model

When you see an async problem, ask these questions:

```text
1. Are operations independent?
          ↓
      Promise.all

2. Can some operations fail?
          ↓
      Promise.allSettled

3. Do I need the first successful response?
          ↓
      Promise.any

4. Do I need the first settlement?
          ↓
      Promise.race

5. Are there thousands of operations?
          ↓
      Concurrency limit

6. Can the dependency temporarily fail?
          ↓
      Retry

7. How should retries wait?
          ↓
      Exponential backoff + jitter

8. Can the request hang?
          ↓
      Timeout

9. Can the operation be cancelled?
          ↓
      AbortController

10. Is the work CPU-heavy?
          ↓
      Worker Threads
```

**The most important production principle:**

> Don't ask only "How do I make this async?" Ask **"How much concurrency can my system safely handle, what happens when a dependency fails, and how do I cancel or recover from slow operations?"**