# Namaste JavaScript — Complete Notes

*By Akshay Saini | Notes compiled for revision & interview prep*

---

## Table of Contents

1. [The Execution Context & Core Fundamentals](#1-the-execution-context--core-fundamentals)
2. [JavaScript Hoisting](#2-javascript-hoisting)
3. [How Functions Work & Variable Environment](#3-how-functions-work--variable-environment)
4. [The Global Execution Context, `window` & `this`](#4-the-global-execution-context-window--this)
5. [`undefined` vs `not defined` & Loosely Typed JS](#5-undefined-vs-not-defined--loosely-typed-js)
6. [Scope, Lexical Environment & Scope Chain](#6-scope-lexical-environment--scope-chain)
7. [`let`, `const` & the Temporal Dead Zone](#7-let-const--the-temporal-dead-zone)
8. [Block Scope & Shadowing](#8-block-scope--shadowing)
9. [Closures](#9-closures)
10. [`setTimeout` + Closures](#10-settimeout--closures)
11. [Function Definitions & Types](#11-function-definitions--types)
12. [First-Class Functions, Parameters & Arguments](#12-first-class-functions-parameters--arguments)
13. [Callback Functions](#13-callback-functions)
14. [Asynchronous JavaScript & Event Listeners](#14-asynchronous-javascript--event-listeners)
15. [The JavaScript Runtime & Event Loop](#15-the-javascript-runtime--event-loop)
16. [JS Engine Architecture](#16-js-engine-architecture)
17. [`setTimeout` — Trust Issues](#17-settimeout--trust-issues)
18. [Higher-Order Functions](#18-higher-order-functions)
19. [`map()`, `filter()`, `reduce()`](#19-map-filter-reduce)
20. [Callbacks — Problems at Scale](#20-callbacks--problems-at-scale)
21. [Promises](#21-promises)
22. [Creating & Consuming Promises](#22-creating--consuming-promises)
23. [Promise APIs](#23-promise-apis)
24. [The `this` Keyword](#24-the-this-keyword)

---

## 1. The Execution Context & Core Fundamentals

This is the most fundamental concept in JavaScript. **Everything** happens inside an **Execution Context**. Think of it as a big container — a box where your entire code is evaluated and run.

### Two Components of the Execution Context

**1. Memory Component (Variable Environment)**

The space where all variables and functions are stored as **key-value pairs**.

```
Memory
──────────────
key       : value
──────────────
a         : 10
b         : undefined
myFunc    : { ...function code }
```

Before any code runs, JavaScript scans your file and fills this memory with identifiers and their initial values.

**2. Code Component (Thread of Execution)**

This is where your code is actually **executed — one line at a time**, in order. Once the memory is set up, JavaScript comes here and starts running each line sequentially.

### JavaScript is Single-Threaded

JavaScript can only execute **one command at a time**. It doesn't run multiple things in parallel — it has just one thread of execution, handling one task before moving to the next.

### JavaScript is Synchronous

Commands are executed in a **specific order**. JavaScript moves to the next line **only after** the current line has completely finished executing.

> **In short:** JavaScript processes your code one line at a time, in sequence, and never moves forward until the current line is done.

| Concept                | What to Remember                                                    |
| ---------------------- | ------------------------------------------------------------------- |
| Execution Context      | The container where all JavaScript code is evaluated and executed    |
| Memory Component       | Stores variables and functions as key-value pairs                   |
| Code Component         | Executes code line by line (Thread of Execution)                    |
| Single-Threaded        | Only one command runs at a time                                     |
| Synchronous            | Next line runs only after the current line finishes                 |

---

## 2. JavaScript Hoisting

Hoisting is JavaScript's default behavior of moving declarations to the top of their scope before code executes. It lets you use variables and functions *before* the line where you actually declared them.

### How Does It Work? (The Two Phases)

**Phase 1 — Memory Creation (before any code runs):**
JavaScript scans through your entire file and allocates memory for every variable and function it finds.

**Phase 2 — Code Execution (line by line):**
Now JavaScript goes back to the top and actually runs your code, one line at a time, using the memory it already set up.

### `var` Variables

During the memory phase, JavaScript reserves space but assigns the placeholder value `undefined`.

```js
console.log(name); // undefined (no error, just not assigned yet)
var name = "Rahul";
```

### Function Declarations

These get fully hoisted. JavaScript stores the *entire* function body in memory during Phase 1.

```js
greet(); // works fine — prints "Hello!"

function greet() {
  console.log("Hello!");
}
```

### Arrow Functions (and Function Expressions)

These are assigned to variables, so the variable gets hoisted as `undefined`, but the function itself is *not* stored yet.

```js
greet(); // TypeError — greet is undefined, not a function

var greet = () => {
  console.log("Hello!");
};
```

### The Call Stack

The Call Stack keeps track of "where am I right now?" — last in, first out.

1. When your file starts running, the **Global Execution Context** is pushed onto the bottom of the stack.
2. Whenever a function is called, a new **Function Execution Context** is pushed on top.
3. When that function finishes, its context is popped off.
4. This continues until everything is done and the global context is also removed.

| What You Declared                  | Stored in Memory Phase | Can You Use It Early?         |
| ---------------------------------- | ---------------------- | ----------------------------- |
| `var` variable                     | `undefined`            | Yes, but value is `undefined` |
| Function declaration               | Full function body     | Yes, works completely         |
| Arrow function / `const` / `let`   | Not accessible         | No — throws an error          |

---

## 3. How Functions Work & Variable Environment

### Global Execution Context (GEC)

Whenever JavaScript runs any code, the very first thing it does is create a **Global Execution Context** with two phases:

**Phase 1 — Memory Allocation:** Variables are initialized to `undefined`, and function definitions are stored in full.

**Phase 2 — Code Execution:** JavaScript executes your code **synchronously** — one line at a time, in order.

### Function Invocation — A Mini World Is Born

When you call a function, JavaScript creates a **brand-new Function Execution Context** — a completely independent environment with its own:

- **Local Memory** — for variables and parameters that belong only to that function.
- **Code Execution** — the function's body runs line by line within this context.

```js
var x = 10;

function double() {
  var x = 20; // this 'x' lives in its own local memory, not the global one
  console.log(x); // 20
}

double();
console.log(x); // 10 — global 'x' is untouched
```

### The Call Stack — Traffic Controller

1. When your program starts, the **Global Execution Context** is pushed onto the stack.
2. When a function is **invoked**, its new execution context is **pushed** on top.
3. When the function **finishes**, its context is **popped** off and its local memory is deleted.
4. Control returns to whatever context is now on top.
5. When all code is done, the GEC itself is removed and the stack is empty.

| Concept                  | What to Remember                                                     |
| ------------------------ | -------------------------------------------------------------------- |
| Global Execution Context | Created automatically when your script runs                          |
| Two Phases               | Memory first (allocate), then Execution (run line by line)           |
| Function Invocation      | Creates a new, independent execution context with its own local memory |
| Call Stack               | Tracks execution order — push on call, pop on finish                 |
| Variable Independence    | Local variables don't affect global ones, even with the same name    |

---

## 4. The Global Execution Context, `window` & `this`

Even if your JavaScript file is **completely empty**, the JavaScript engine still creates a **Global Execution Context**.

### The Global Object (`window`)

Along with the GEC, the engine automatically creates a **global object**.

- In **browsers**, this is `window`.
- In **Node.js**, it's `global`.

```js
console.log(window); // logs the entire window object
```

### The `this` Keyword at Global Level

At the global level, `this` points directly to the global object.

```js
console.log(this);            // window object
console.log(this === window); // true
```

### Global Space & Accessibility

Any variable or function created in the **global space** gets attached to the global object and is accessible from anywhere.

```js
var name = "Akshay";

console.log(name);         // "Akshay"
console.log(window.name);  // "Akshay" — same thing
console.log(this.name);    // "Akshay" — also the same
```

| Concept                | What to Remember                                                       |
| ---------------------- | ---------------------------------------------------------------------- |
| Empty JS file          | Still creates a Global Execution Context automatically                 |
| Global Object          | Called `window` in browsers, `global` in Node                          |
| `this` at global level | Points to the global object (`this === window` in browsers)            |
| Global Space           | Variables/functions declared globally attach to `window`               |

---

## 5. `undefined` vs `not defined` & Loosely Typed JS

### `undefined` — A Special Placeholder

During the **memory allocation phase**, the JavaScript engine assigns all declared variables the placeholder value `undefined`.

```js
console.log(a); // undefined — declared but no value assigned yet
var a = 10;
console.log(a); // 10 — now it has a value
```

**In simple terms:** `undefined` means "I know this variable exists, but it doesn't have a value yet."

### `not defined` — It Doesn't Exist at All

This occurs when you try to access a variable that was **never declared** — JavaScript throws a **ReferenceError**.

```js
console.log(b); // ReferenceError: b is not defined
```

| Scenario      | What Happens                         | Meaning                                  |
| ------------- | ------------------------------------ | ---------------------------------------- |
| `undefined`   | Variable declared but not assigned   | "Exists in memory, waiting for a value"  |
| `not defined` | Variable was never declared          | "Doesn't exist at all" → ReferenceError  |

### JavaScript is a Loosely Typed Language

A single variable can hold a number, then a string, then a boolean — JavaScript won't complain.

```js
var x = 10;       // number
x = "hello";      // now it's a string
x = true;         // now it's a boolean
```

### Best Practice: Never Assign `undefined` Manually

Let `undefined` serve its natural purpose as a system-generated placeholder. If you want to intentionally mark a variable as "empty," use `null` instead.

```js
// ❌ Bad
var a = undefined;

// ✅ Good
var a;             // undefined naturally
var b = null;      // intentionally empty
```

---

## 6. Scope, Lexical Environment & Scope Chain

### What is Scope?

Scope determines **where** a variable or function can be accessed in your code.

```js
function greet() {
  var message = "Hello";
  console.log(message); // ✅ accessible
}

console.log(message); // ❌ ReferenceError — outside the scope
```

### The Lexical Environment

A **Lexical Environment** is created every time an execution context is created. It consists of:

1. **Local memory** — variables and functions declared in that context.
2. **A reference to the parent's lexical environment** — a link pointing outward.

The word **"lexical"** means "where the code is physically written." If function `C` is written inside function `A`, then `C` is *lexically* inside `A`.

The global scope's parent reference points to `null`.

### The Scope Chain

When JavaScript needs a variable, it looks in the **local memory** first. If not found, it follows the parent reference to the outer lexical environment, then the next one, all the way up to the global scope. This chain of lookups is the **Scope Chain**.

If the variable isn't found even after reaching `null`, JavaScript throws a **ReferenceError**.

```
C's local memory → A's local memory → Global memory → null (ReferenceError)
```

---

## 7. `let`, `const` & the Temporal Dead Zone

### Hoisting — But Different

Variables declared with `let` and `const` **are hoisted**, but stored in a **separate memory space** (not on the global object). They remain **uninitialized** until the code reaches their declaration line.

```js
console.log(a); // ReferenceError — a is in the TDZ
let a = 10;
```

### Temporal Dead Zone (TDZ)

The TDZ is the period between the **start of the scope** and the **line where the variable is initialized**. Accessing the variable during this window throws a ReferenceError.

### Not Attached to `window`

```js
var a = 10;
let b = 20;

console.log(window.a); // 10
console.log(window.b); // undefined
```

### Redeclaration Rules

`let` and `const` do **not** allow redeclaration in the same scope → SyntaxError.

### Error Types Summary

| Error          | When It Happens                                              | Example                          |
| -------------- | ------------------------------------------------------------ | -------------------------------- |
| SyntaxError    | Invalid syntax or redeclaring `let`/`const` in the same scope | `let x = 1; let x = 2;`         |
| ReferenceError | Accessing a variable not in scope or still in the TDZ        | `console.log(a); let a = 5;`    |
| TypeError      | Reassigning a `const` variable                               | `const x = 1; x = 2;`           |

### Best Practices

- Use **`const`** by default.
- Use **`let`** only when the value needs to change.
- Always **declare variables at the top** of their scope to avoid the TDZ.

---

## 8. Block Scope & Shadowing

### What is a Block?

A block is a pair of curly braces `{}` that groups multiple statements into one unit — needed wherever JavaScript expects a single statement (e.g., `if`, `for`, `while`).

### How Block Scope Works

- `let` and `const` are **block-scoped** — not accessible outside the block.
- `var` is **not block-scoped** — hoisted to the nearest function or global scope.

```js
{
  var a = 10;
  let b = 20;
  const c = 30;
}

console.log(a); // 10 — var ignores the block
console.log(b); // ❌ ReferenceError
console.log(c); // ❌ ReferenceError
```

### Shadowing

When a variable inside a block has the **same name** as one in an outer scope, the inner variable "shadows" the outer one.

With `var`, shadowing **modifies** the outer value (same memory). With `let`/`const`, they maintain **separate memory** — the outer value stays untouched.

```js
let y = 100;
{
  let y = 10;        // shadows but does NOT affect outer 'y'
  console.log(y);    // 10
}
console.log(y);      // 100 — untouched
```

### Illegal Shadowing

You **cannot** shadow a `let` variable with `var` in an inner scope (SyntaxError). But you **can** shadow a `var` with `let`.

---

## 9. Closures

### What is a Closure?

A closure is a **function bundled together with its lexical environment**. A function **remembers** the variables from its outer scope, even when it's executed somewhere else entirely.

```js
function outer() {
  var count = 0;

  function inner() {
    count++;
    console.log(count);
  }

  return inner;
}

var counter = outer(); // outer() finishes, but...
counter(); // 1 — inner still remembers 'count'
counter(); // 2 — and keeps updating it
```

### Why Does This Work?

When `inner` is returned from `outer`, it carries a **reference** to the variables in its original lexical environment — not a copy of the value, but the actual reference.

### What About Garbage Collection?

Closures **prevent** garbage collection of outer variables — because the returned function still holds a reference to them, they stay alive in memory.

### Common Use Cases

- **Module Design Pattern** — private variables, exposing only what's needed.
- **Currying** — partially applying functions with preset arguments.
- **Function Once** — ensuring a function runs only a single time.
- **Data Encapsulation** — hiding internal state from the outside.

---

## 10. `setTimeout` + Closures

### The Problem with `var` in Loops

```js
for (var i = 1; i <= 5; i++) {
  setTimeout(function () {
    console.log(i);
  }, i * 1000);
}
// Output: 6, 6, 6, 6, 6 — all share the same reference to 'i'
```

### Solution 1: Use `let`

`let` is block-scoped — every iteration creates a **brand-new copy** of `i`.

```js
for (let i = 1; i <= 5; i++) {
  setTimeout(function () {
    console.log(i);
  }, i * 1000);
}
// Output: 1, 2, 3, 4, 5 ✅
```

### Solution 2: Closure Wrapping (When Forced to Use `var`)

```js
for (var i = 1; i <= 5; i++) {
  (function (j) {
    setTimeout(function () {
      console.log(j);
    }, j * 1000);
  })(i);
}
// Output: 1, 2, 3, 4, 5 ✅
```

---

## 11. Function Definitions & Types

### Function Statement (Declaration)

Fully hoisted — can be called before they appear in the code.

```js
greet(); // ✅ works
function greet() { console.log("Hello!"); }
```

### Function Expression

Treated as a variable — assigned `undefined` during hoisting. Calling it early throws a TypeError.

```js
greet(); // ❌ TypeError
var greet = function () { console.log("Hello!"); };
```

### Anonymous Function

A function without a name — must be used in an expression context.

```js
var sayHi = function () { console.log("Hi!"); };
```

### Named Function Expression

A function expression where the function has a name. That name is only accessible **inside** the function itself.

```js
var greet = function hello() {
  console.log(hello); // ✅ accessible inside
};
console.log(hello);   // ❌ ReferenceError — not outside
```

---

## 12. First-Class Functions, Parameters & Arguments

### Parameters vs Arguments

- **Parameters** — the labels in the function definition.
- **Arguments** — the actual values passed when calling.

```js
function add(a, b) { return a + b; }  // a, b = parameters
add(3, 5);                             // 3, 5 = arguments
```

### First-Class Functions

Functions can be assigned to variables, passed as arguments, and returned from functions. This makes callbacks, closures, and functional programming possible.

```js
function run(fn) { console.log(fn()); }
function greet() { return "Hello!"; }
run(greet); // "Hello!"
```

---

## 13. Callback Functions

A callback is a function **passed into another function** to be executed later.

```js
function doSomething(callback) {
  console.log("Working...");
  callback();
}

doSomething(function () {
  console.log("Done!");
});
```

---

## 14. Asynchronous JavaScript & Event Listeners

### Blocking the Main Thread

Since there's only one call stack, any heavy code will **freeze the entire page**. Always use asynchronous operations to avoid blocking.

### Event Listeners & Closures

Event listeners are a classic use of callbacks — and they often form **closures**, maintaining access to outer variables.

```js
function setupCounter() {
  var count = 0;
  document.getElementById("btn").addEventListener("click", function () {
    count++; // closure — remembers 'count'
    console.log("Clicked", count, "times");
  });
}
```

### Memory Warning

Event listeners are heavy — they hold closures in memory. Remove them when no longer needed to prevent memory leaks.

---

## 15. The JavaScript Runtime & Event Loop

### Components

| Component           | Role                                                          |
| ------------------- | ------------------------------------------------------------- |
| **Call Stack**       | Where all code execution happens, one frame at a time         |
| **Web APIs**         | Browser-provided features — `setTimeout`, `fetch`, DOM events |
| **Callback Queue**   | Holds callbacks from timers, events, waiting to run           |
| **Microtask Queue**  | Higher-priority queue for Promises and MutationObserver       |
| **Event Loop**       | Monitors the Call Stack — pushes queued tasks when it's empty |

### How It All Connects

1. Your code runs on the **Call Stack**.
2. Async calls (like `setTimeout`) are handed off to the browser's **Web API**.
3. Once complete, the callback moves to the **Callback Queue**.
4. The **Event Loop** checks: "Is the Call Stack empty?" If yes, it pushes the callback onto the stack.
5. The callback finally executes.

### Microtask Queue vs Callback Queue

The **Microtask Queue** has **higher priority**. The Event Loop always empties it before touching the Callback Queue.

- **Microtask Queue:** Promises (`.then`, `.catch`, `.finally`), MutationObserver
- **Callback Queue:** `setTimeout`, `setInterval`, DOM events

### Starvation

If the Microtask Queue keeps adding new tasks endlessly, the Callback Queue **never gets a chance** to execute — this is **task starvation**.

---

## 16. JS Engine Architecture

### The Three Steps

1. **Parsing** — A Syntax Parser generates an **Abstract Syntax Tree (AST)**.
2. **Compilation** — The AST is converted into machine-executable code.
3. **Execution** — The code runs on the Call Stack with access to the Memory Heap.

### JIT Compilation (Just-In-Time)

Modern engines use **both** an Interpreter (fast startup, line by line) and a Compiler (optimizes hot code paths in the background). This makes JavaScript a **JIT-compiled language** in practice.

### Memory Management

- **Memory Heap** — where variables and functions are stored.
- **Garbage Collector** — uses algorithms like **Mark & Sweep** to free unreachable memory.

### Google's V8 Engine

V8 powers **Chrome** and **Node.js**. It uses an interpreter (Ignition) and optimizing compilers (TurboFan) to make JavaScript run as fast as possible.

---

## 17. `setTimeout` — Trust Issues

### The Delay is a Minimum, Not a Guarantee

If the Call Stack is busy, the callback must wait even longer than the specified delay.

```js
console.log("Start");
setTimeout(() => console.log("Timer done"), 5000);
// If this loop takes 10 seconds, callback runs after ~10s, not 5s
for (let i = 0; i < 10000000000; i++) {}
console.log("End");
```

### `setTimeout(fn, 0)` — Not Instant

Even with 0ms, the callback still goes through Web API → Callback Queue → Event Loop and must wait for the Call Stack to clear.

```js
console.log("1");
setTimeout(() => console.log("2"), 0);
console.log("3");
// Output: 1, 3, 2
```

---

## 18. Higher-Order Functions

A **Higher-Order Function** either takes another function as an argument or returns a function.

```js
function operate(arr, logic) {
  let result = [];
  for (let i = 0; i < arr.length; i++) {
    result.push(logic(arr[i]));
  }
  return result;
}

const doubled = operate([1, 2, 3], (x) => x * 2); // [2, 4, 6]
```

### The DRY Principle

Don't Repeat Yourself. Extract varying logic into small functions and pass them to a single higher-order function — modular, reusable, and testable.

---

## 19. `map()`, `filter()`, `reduce()`

### `Array.map()`

Transforms every element → returns a **new array**.

```js
const nums = [1, 2, 3, 4];
const doubled = nums.map((x) => x * 2);        // [2, 4, 6, 8]
const binary = nums.map((x) => x.toString(2));  // ["1", "10", "11", "100"]
```

### `Array.filter()`

Keeps elements matching a condition → returns a **new array**.

```js
const nums = [1, 2, 3, 4, 5, 6];
const evens = nums.filter((x) => x % 2 === 0);  // [2, 4, 6]
```

### `Array.reduce()`

Collapses an array into a **single value** — takes an `accumulator` and `current` value.

```js
const nums = [1, 2, 3, 4];

// Sum
const sum = nums.reduce((acc, cur) => acc + cur, 0); // 10

// Maximum
const max = nums.reduce((acc, cur) => (cur > acc ? cur : acc), -Infinity); // 4

// Frequency map
const ages = [25, 30, 25, 40, 30, 25];
const freq = ages.reduce((acc, cur) => {
  acc[cur] = (acc[cur] || 0) + 1;
  return acc;
}, {}); // { 25: 3, 30: 2, 40: 1 }
```

### Chaining

```js
const users = [
  { name: "Akshay", age: 26 },
  { name: "Donald", age: 75 },
  { name: "Elon", age: 50 },
];

const result = users.filter((u) => u.age > 30).map((u) => u.name);
// ["Donald", "Elon"]
```

### Writing a `map` Polyfill

```js
Array.prototype.myMap = function (callback) {
  let result = [];
  for (let i = 0; i < this.length; i++) {
    result.push(callback(this[i], i, this));
  }
  return result;
};

[1, 2, 3].myMap((x) => x * 10); // [10, 20, 30]
```

---

## 20. Callbacks — Problems at Scale

### Callback Hell (Pyramid of Doom)

Deeply nested callbacks → unreadable, unmaintainable pyramid.

```js
createOrder(cart, function () {
  proceedToPayment(order, function () {
    showOrderSummary(payment, function () {
      updateWallet(summary, function () {
        // nightmare
      });
    });
  });
});
```

### Inversion of Control

Passing a callback to an external API = **handing over control**. You're blindly trusting that the API will call your function, call it only once, and handle errors correctly. You have no guarantees.

---

## 21. Promises

### Why Promises Exist

Instead of *passing* a callback (losing control), Promises let us *attach* a callback to a returned object. We retain control.

```js
// ❌ Callback — we lose control
createOrder(cart, function (order) { proceedToPayment(order); });

// ✅ Promise — we retain control
const orderPromise = createOrder(cart);
orderPromise.then(function (order) { proceedToPayment(order); });
```

### What is a Promise?

> **Interview answer:** "A Promise is an object representing the eventual completion of an asynchronous operation."

### Three States

| State         | Meaning                                      |
| ------------- | -------------------------------------------- |
| **Pending**   | Initial state — operation hasn't finished yet |
| **Fulfilled** | Operation completed successfully              |
| **Rejected**  | Operation failed                              |

Once settled, a Promise is **immutable** — the result cannot be changed.

---

## 22. Creating & Consuming Promises

### Creating

```js
const promise = new Promise(function (resolve, reject) {
  const success = true;
  if (success) resolve("Order created!");
  else reject("Something went wrong");
});
```

### Consuming

```js
promise
  .then((result) => console.log(result))   // success
  .catch((error) => console.log(error));   // failure
```

### Promise Chaining

Chain `.then()` blocks vertically. Always **return** the value or next promise so data flows down.

```js
createOrder(cart)
  .then((order) => { return proceedToPayment(order); })
  .then((payment) => { return showOrderSummary(payment); })
  .then((summary) => { return updateWallet(summary); })
  .catch((error) => { console.log("Something failed:", error); });
```

### Strategic `.catch()` Placement

`.catch()` handles errors for **all steps above it**. Place at the end for global handling, or in the middle to catch specific steps while letting the rest continue.

---

## 23. Promise APIs

### `Promise.all()`

Waits for **all** to succeed. Fails fast on first rejection.

```js
Promise.all([p1, p2, p3])
  .then((results) => console.log(results))
  .catch((err) => console.log(err));
```

### `Promise.allSettled()`

Waits for **all** to finish (success or failure). Returns status objects. The safest option.

```js
Promise.allSettled([p1, p2, p3]).then((results) => console.log(results));
// [{ status: "fulfilled", value: ... }, { status: "rejected", reason: ... }]
```

### `Promise.race()`

Returns the **first to settle** — whether success or failure.

### `Promise.any()`

Returns the **first success**. AggregateError only if all fail.

### Quick Comparison

| API                    | Waits For       | On Failure                    | Returns                |
| ---------------------- | --------------- | ----------------------------- | ---------------------- |
| `Promise.all()`        | All to succeed  | Fails fast on first rejection | Array of values        |
| `Promise.allSettled()` | All to finish   | Never short-circuits          | Array of status objects |
| `Promise.race()`       | First to settle | Returns it even if rejection  | Single value/error     |
| `Promise.any()`        | First success   | AggregateError if all fail    | Single value           |

### Key Terminology

- **Settled** — finished (fulfilled or rejected)
- **Fulfilled** — resolved successfully
- **Rejected** — failed
- **AggregateError** — all rejection reasons (used by `Promise.any`)

---

## 24. The `this` Keyword

The value of `this` depends entirely on **where** and **how** it's used.

### In the Global Scope

`this` refers to the global object — `window` in browsers, `global` in Node.js.

### Inside a Regular Function

| Mode            | Value of `this`                                       |
| --------------- | ----------------------------------------------------- |
| Non-strict mode | Global object (`window`) — due to "this substitution" |
| Strict mode     | `undefined`                                           |

### Inside Object Methods

`this` refers to the object itself.

```js
const user = {
  name: "Akshay",
  greet: function () { console.log(this.name); }, // "Akshay"
};
```

### `call`, `apply`, `bind`

Override `this` to reuse functions across different objects.

```js
function greet() { console.log("Hello, " + this.name); }
greet.call({ name: "Akshay" });  // "Hello, Akshay"
greet.call({ name: "Elon" });    // "Hello, Elon"
```

### Arrow Functions — No Own `this`

Arrow functions inherit `this` from their **enclosing lexical scope**.

```js
const user = {
  name: "Akshay",
  greet: function () {
    const inner = () => { console.log(this.name); }; // "Akshay"
    inner();
  },
};
```

### In DOM Event Handlers

`this` refers to the **HTML element** that triggered the event.

### `this` Summary

| Context                    | Value of `this`                            |
| -------------------------- | ------------------------------------------ |
| Global scope               | Global object (`window` / `global`)        |
| Function (non-strict)      | Global object (this substitution)          |
| Function (strict)          | `undefined`                                |
| Object method              | The object itself                          |
| `call` / `apply` / `bind`  | Whatever you explicitly pass               |
| Arrow function             | Inherited from enclosing lexical scope     |
| DOM event handler          | The HTML element that triggered the event  |

---

## Master Summary — All Topics

| #  | Topic                      | One-Line Takeaway                                                              |
| -- | -------------------------- | ------------------------------------------------------------------------------ |
| 1  | Execution Context          | The container where all JS code is evaluated and executed                      |
| 2  | Hoisting                   | Declarations are moved to the top of their scope before execution              |
| 3  | Functions & Variable Env   | Each function invocation creates its own independent execution context         |
| 4  | GEC, `window`, `this`      | Created automatically — `this === window` at global level                      |
| 5  | `undefined` vs `not defined` | `undefined` = declared, no value; `not defined` = never declared             |
| 6  | Scope & Scope Chain        | Chain of lookups from local → parent → global → null                          |
| 7  | `let`, `const`, TDZ        | Hoisted but uninitialized — accessing before declaration throws ReferenceError |
| 8  | Block Scope & Shadowing    | `let`/`const` confined to `{}`; `var` is not                                  |
| 9  | Closures                   | A function remembers its outer scope even after the parent returns             |
| 10 | `setTimeout` + Closures    | Use `let` or closure wrapping to fix the classic loop problem                  |
| 11 | Function Types             | Declaration (hoisted) vs Expression (`undefined` until assignment)             |
| 12 | First-Class Functions      | Functions can be values, arguments, and return values                          |
| 13 | Callbacks                  | Functions passed to run later — essential for async                            |
| 14 | Async JS & Event Listeners | Use async patterns to avoid blocking the single-threaded main thread           |
| 15 | Runtime & Event Loop       | Pushes queued callbacks to the Call Stack when it's empty                      |
| 16 | JS Engine                  | Parsing → Compilation (JIT) → Execution with garbage collection               |
| 17 | `setTimeout` Trust Issues  | The delay is a minimum wait, not a guarantee                                   |
| 18 | Higher-Order Functions     | Takes a function as argument or returns one                                    |
| 19 | `map`, `filter`, `reduce`  | Transform, filter, or collapse arrays — chain them for expressive code         |
| 20 | Callback Problems          | Callback Hell + Inversion of Control = why we need Promises                    |
| 21 | Promises                   | An object representing eventual completion — we retain control                 |
| 22 | Creating & Chaining        | Always `return` in `.then()` — use `.catch()` strategically                    |
| 23 | Promise APIs               | `all` (fail-fast), `allSettled` (safest), `race` (fastest), `any` (first win)  |
| 24 | `this` Keyword             | Depends on context — global, function, method, arrow, or DOM handler           |
