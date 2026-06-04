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


# JavaScript Closures

Imagine you write a function inside another function. Normally, once the outer function finishes, all its variables are gone. But with a closure, the inner function **holds on** to those variables — even after the outer function is done.

> Think of it like a backpack. When an inner function is created, it packs up the variables from its surroundings and carries them wherever it goes.

A closure is a function **bundled together with its lexical environment** — meaning it remembers the scope (variables, references) where it was born, not where it is called.

```js
function outer() {
  let count = 0;
  return function inner() {
    count++;
    console.log(count);
  };
}

const increment = outer();
increment(); // 1
increment(); // 2
increment(); // 3
```

`outer()` has finished running — but `inner` still remembers `count`. That's a closure.

---

## Key Concepts

### What a closure remembers

A closure does **not** copy the value of a variable — it keeps a **live reference** to it. So if the variable changes in the outer scope before the closure runs, the closure sees the updated value.

```js
function makeGreeter() {
  let name = "Alice";
  return function greet() {
    console.log("Hello, " + name);
  };
}

const greet = makeGreeter();
greet(); // Hello, Alice
```

### Lexical Environment

Every function in JS has access to the scope where it was **written** (not where it is called). This is called the lexical environment. Even after the parent function's execution context is removed from the call stack, the inner function keeps this environment alive.

### Persistent State

Because closures remember their outer variables, they can **store data across multiple calls** — without using global variables. This is the foundation of patterns like:

- **Module pattern** — hide private variables, expose only what's needed
- **Currying** — split a function with many arguments into smaller reusable pieces
- **Memoization** — remember previous results to avoid repeating expensive work

---

## What Makes Up a Closure?

| Part | What it is |
|---|---|
| Inner function | The function that "closes over" the outer scope |
| Lexical environment | All the variables and references from the outer scope |
| Reference (not copy) | The closure holds a live link to variables, not a snapshot |

---

## Memory and Closures

Closures are powerful but come with a cost. Because the inner function holds a reference to the outer scope, those variables **cannot be garbage collected** as long as the closure exists.

This means:
- Variables in the outer scope **stay in memory** even after the parent function finishes
- If closures are created in large numbers (e.g. inside loops) without cleanup, **memory can accumulate**
- Always release closures you no longer need by setting them to `null`

---

## Cross-Questions

### Q1. What is a closure in simple terms?
**Answer:** A closure is an inner function that remembers the variables of its outer function, even after the outer function has finished running.

> It's not magic — JS functions simply carry their lexical environment with them wherever they go.

---

### Q2. Does a closure store the value or the reference of an outer variable?
**Answer:** The reference — not just the value at the time of creation.

> This means if the outer variable changes before the closure executes, the closure will see the **updated** value, not the original one.

---

### Q3. Can a closure access variables after the outer function's execution context is gone?
**Answer:** Yes — that's the whole point of closures.

> Even after the parent function is removed from the call stack, the inner function keeps the lexical environment alive in memory.

---

### Q4. Why do closures cause memory concerns?
**Answer:** Because the variables in the outer scope cannot be garbage collected as long as the closure holds a reference to them.

> If many closures are created and not released, memory keeps accumulating. Always set unused closures to `null` to allow garbage collection.

---

### Q5. What is the difference between a closure and a regular function?
**Answer:** A regular function only accesses its own local variables and globals. A closure also accesses variables from the scope where it was **defined**, even if that scope no longer exists on the call stack.

---

### Q6. How do closures enable the module pattern?
**Answer:** By keeping certain variables private (only accessible inside the closure) and returning only the functions you want to expose publicly.

```js
function counter() {
  let count = 0; // private — not accessible outside
  return {
    increment() { count++; },
    getCount() { return count; }
  };
}

const c = counter();
c.increment();
console.log(c.getCount()); // 1
console.log(c.count);      // undefined — hidden!
```

---

### Q7. What happens when a loop creates closures — a classic trap?

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// Prints: 3, 3, 3 — not 0, 1, 2
```

**Answer:** Because `var` is function-scoped, all three closures share the **same reference** to `i`. By the time the callbacks run, the loop has finished and `i` is 3.

**Fix:** Use `let` (block-scoped) so each iteration gets its own `i`.

```js
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// Prints: 0, 1, 2 ✅
```

---



