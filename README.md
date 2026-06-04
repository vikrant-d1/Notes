# Javascript Important Questions Answers

## JavaScript Event Loop

The JavaScript Event Loop is the runtime mechanism that keeps a single-threaded language non-blocking. Since JS can only do one thing at a time (one call stack), the Event Loop acts as a coordinator — it watches the call stack and two queues, and decides what runs next.

When async work (a timer, a network request, a click) finishes, its callback lands in a queue. The Event Loop waits for the call stack to be completely empty, then feeds the next callback in. The **Microtask Queue** (Promises, MutationObserver) gets cleared entirely before the **Callback Queue** (setTimeout, events) gets even one turn — that's the priority rule.

---

## Key Definitions

### Event Loop
The monitor that bridges synchronous JS (Call Stack) with async callbacks (queues). It pushes callbacks only when the stack is empty.

### Microtasks
High-priority callbacks (Promises, MutationObserver) that live in the MicroTask Queue — always drained before the Callback Queue gets a turn.

### Web APIs
Browser-provided superpowers (timers, fetch, DOM events) that run outside the JS engine, accessible via the `window` object.

### Callback Queue
The waiting room for lower-priority async callbacks (setTimeout, event listeners) — processed one-by-one only after microtasks are clear.

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

