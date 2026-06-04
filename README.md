# Javascript Important Questions Answers

## JavaScript Event Loop

The Event Loop is a mechanism in JavaScript that manages the execution of synchronous and asynchronous code. It continuously checks whether the Call Stack is empty and then moves pending tasks from queues to the Call Stack for execution.

Since JavaScript is single-threaded (it can execute only one task at a time), the Event Loop ensures that long-running asynchronous operations like timers, API calls, and user events do not block the application.

---

## Key Definitions

### Microtasks

Microtasks are high-priority asynchronous callbacks stored in the Microtask Queue. Examples include Promise callbacks (.then(), .catch(), .finally()), queueMicrotask(), and MutationObserver. The Event Loop executes all microtasks before processing any callback from the Callback Queue.

### Web APIs

Web APIs are browser-provided features that handle operations outside the JavaScript engine, such as timers, network requests, and DOM events. Examples include setTimeout, fetch, and event listeners. Once an operation completes, its callback is placed into the appropriate queue.

### Callback Queue (Task Queue)

The Callback Queue (also called the Task Queue or Macrotask Queue) stores asynchronous callbacks such as setTimeout, setInterval, and event-handler callbacks. These callbacks are executed only after the Call Stack is empty and all pending microtasks have been processed.

---

## Cross-Questions

### Q1. What does the Event Loop actually check before pushing a callback onto the Call Stack?
**Answer:** That the Call Stack is completely empty.

> The Event Loop's one job is to wait for the Call Stack to be *completely* empty — not just "less busy". Even a single synchronous frame on the stack blocks all queued callbacks.

---

### Q2. You have a resolved Promise callback and a `setTimeout(fn, 0)`. Which runs first and why?
**Answer:** The Promise callback, because microtasks are drained before the Callback Queue.

> Even `setTimeout(fn, 0)` goes to the Callback Queue. The Event Loop empties the entire MicroTask Queue first — so every resolved Promise runs before even a 0ms timer fires.

---

### Q3. What is "microtask starvation"?
**Answer:** When microtasks keep queuing new microtasks, preventing the Callback Queue from ever running.

> Because all microtasks must clear before any Callback Queue task runs, a microtask that queues another microtask (which queues another…) can starve the Callback Queue indefinitely — the page may even freeze.

---

### Q4. Where does the code inside a `setTimeout` actually "wait" while the timer counts down?
**Answer:** In the browser's Web API environment.

> The browser, not the JS engine, handles the timer. The callback is handed off to the Web API layer, which holds it until the timer expires — then moves it to the Callback Queue for the Event Loop to pick up.

---

### Q5. JavaScript is single-threaded. What makes asynchronous operations like `fetch()` possible without blocking?
**Answer:** The browser's Web APIs handle the work outside the JS engine, using the Event Loop to return results.

> The JS engine stays single-threaded, but the browser is multi-threaded. `fetch()`, timers, and DOM events all run in browser-managed APIs. Only the *callback* re-enters the JS engine via the Event Loop — so the main thread is never blocked waiting.

---

### Q6. Which of the following is *not* a source of microtasks?
- Promise.then() callbacks
- **`setTimeout` with 0ms delay** ✅ *(correct answer — this is NOT a microtask)*
- MutationObserver callbacks
- queueMicrotask()

> `setTimeout` — even at 0ms — goes to the regular Callback Queue, not the MicroTask Queue. `Promise.then`, `MutationObserver`, and `queueMicrotask()` all go to the MicroTask Queue and get priority treatment.

---

