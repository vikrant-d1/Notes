# The Execution Context & Core Fundamentals — Notes

*Namaste JavaScript — by Akshay Saini*

---

## Everything Runs Inside an Execution Context

This is the most fundamental concept in JavaScript. **Everything** happens inside an **Execution Context**. Think of it as a big container — a box where your entire code is evaluated and run.

---

## Two Components of the Execution Context

Every Execution Context is made up of two parts:

### 1. Memory Component (Variable Environment)

This is the space where all variables and functions are stored as **key-value pairs**.

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

### 2. Code Component (Thread of Execution)

This is where your code is actually **executed — one line at a time**, in order. Once the memory is set up, JavaScript comes here and starts running each line sequentially.

```
Code Component
──────────────
Line 1 → execute
Line 2 → execute
Line 3 → execute
...
```

---

## Core Fundamentals

### JavaScript is Single-Threaded

JavaScript can only execute **one command at a time**. It doesn't run multiple things in parallel — it has just one thread of execution, handling one task before moving to the next.

### JavaScript is Synchronous

Commands are executed in a **specific order**. JavaScript moves to the next line **only after** the current line has completely finished executing. There's no skipping ahead or running things out of order.

> **In short:** JavaScript processes your code one line at a time, in sequence, and never moves forward until the current line is done.

---

## Key Takeaways

| Concept                | What to Remember                                                    |
| ---------------------- | ------------------------------------------------------------------- |
| Execution Context      | The container where all JavaScript code is evaluated and executed    |
| Memory Component       | Stores variables and functions as key-value pairs (Variable Environment) |
| Code Component         | Executes code line by line (Thread of Execution)                    |
| Single-Threaded        | Only one command runs at a time                                     |
| Synchronous            | Next line runs only after the current line finishes                 |



# JavaScript Hoisting — Clear Notes

---

## What is Hoisting?

Hoisting is JavaScript's default behavior of moving declarations to the top of their scope before code executes. In simple terms, it lets you use variables and functions *before* the line where you actually declared them — without crashing your program.

---

## How Does It Work? (The Two Phases)

JavaScript doesn't run your code immediately. It processes your file in two passes:

**Phase 1 — Memory Creation (before any code runs):**
JavaScript scans through your entire file and allocates memory for every variable and function it finds. Think of it as JavaScript "taking notes" on what exists before doing anything.

**Phase 2 — Code Execution (line by line):**
Now JavaScript goes back to the top and actually runs your code, one line at a time, using the memory it already set up.

---

## How Different Things Get Hoisted

### `var` Variables

During the memory phase, JavaScript reserves space for them but assigns the placeholder value `undefined`. So if you try to use a `var` variable before its declaration line, you won't get an error — you'll just get `undefined`, which can cause sneaky bugs.

```js
console.log(name); // undefined (no error, just not assigned yet)
var name = "Rahul";
```

### Function Declarations

These get fully hoisted. JavaScript stores the *entire* function body in memory during Phase 1. That's why you can call a function above the line where you wrote it, and it works perfectly.

```js
greet(); // works fine — prints "Hello!"

function greet() {
  console.log("Hello!");
}
```

### Arrow Functions (and Function Expressions)

These are assigned to variables, so JavaScript treats them like any other variable. The variable gets hoisted as `undefined`, but the function itself is *not* stored yet. Calling it early throws an error.

```js
greet(); // TypeError — greet is undefined, not a function

var greet = () => {
  console.log("Hello!");
};
```

---

## The Call Stack (How JavaScript Manages Execution)

The Call Stack is how JavaScript keeps track of "where am I right now?" It works like a stack of plates — last in, first out.

1. When your file starts running, JavaScript creates a **Global Execution Context** and pushes it onto the bottom of the stack.
2. Whenever a function is called, a new **Function Execution Context** is created and pushed on top.
3. When that function finishes, its context is popped off the stack, and JavaScript returns to wherever it left off.
4. This continues until everything is done and the global context is also removed.

---

## Quick Reference

| What You Declared       | Stored in Memory Phase | Can You Use It Early?         |
| ----------------------- | ---------------------- | ----------------------------- |
| `var` variable          | `undefined`            | Yes, but value is `undefined` |
| Function declaration    | Full function body     | Yes, works completely         |
| Arrow function / `const` / `let` | Not accessible | No — throws an error          |


# How Functions Work in JS & Variable Environment — Notes

*Namaste JavaScript — Episode 5 by Akshay Saini*

---

## Global Execution Context (GEC)

Whenever JavaScript runs any code, the very first thing it does is create a **Global Execution Context**. This context has two phases:

**Phase 1 — Memory Allocation:**
Before a single line of code runs, JavaScript scans the entire file and allocates memory. Variables are initialized to `undefined`, and function definitions are stored in full.

**Phase 2 — Code Execution:**
JavaScript goes back to the top and executes your code **synchronously** — one line at a time, in order.

---

## Function Invocation — A Mini World Is Born

When you call a function, JavaScript doesn't just jump into it. It creates a **brand-new Function Execution Context** — a completely independent environment with its own:

- **Local Memory** — for variables and parameters that belong only to that function.
- **Code Execution** — the function's body runs line by line within this context.

This means a function's variables are entirely separate from the global ones, even if they share the same name.

```js
var x = 10;

function double() {
  var x = 20; // this 'x' lives in its own local memory, not the global one
  console.log(x); // 20
}

double();
console.log(x); // 10 — global 'x' is untouched
```

---

## The Call Stack — Traffic Controller of JavaScript

The **Call Stack** is the mechanism JavaScript uses to keep track of *where it currently is* in your code. Think of it as a stack of trays in a cafeteria — last in, first out.

### How It Works

1. When your program starts, the **Global Execution Context** is pushed onto the stack.
2. When a function is **invoked**, its new execution context is **pushed** on top of the stack.
3. When the function **finishes**, its context is **popped** off the stack and its local memory is deleted.
4. Control returns to whatever context is now on top (usually global, or a parent function).
5. When all code is done, the GEC itself is removed and the stack is empty.

---

## Step-by-Step Execution Flow

Here's how JavaScript processes a typical program behind the scenes:

### Step 1 — Memory Phase (Global)

JavaScript scans the global scope and allocates memory for all variables and function declarations.

| Identifier | Value Stored        |
| ---------- | ------------------- |
| `x`        | `undefined`         |
| `myFunc`   | *entire function body* |

### Step 2 — Execution Phase (Global)

- Global code runs line by line.
- Variables get their actual values assigned (e.g., `x = 1`).

### Step 3 — Function Call

- A function is invoked → a new Function Execution Context is created and **pushed** onto the Call Stack.
- Inside this context, the same two phases repeat: memory allocation for local variables, then execution of the function body.
- Local variables are resolved independently — they do **not** interfere with global variables of the same name.

### Step 4 — Function Completes

- The function's execution context is **popped** off the Call Stack.
- Its local memory is deleted.
- Control returns to the previous context (global or the calling function).

---

## Visualizing with the Browser Debugger

Akshay demonstrates all of this live in the browser's DevTools:

- **Call Stack panel** — You can watch execution contexts being pushed and popped in real time as functions are called and completed.
- **Scope panel** — Shows **Local Memory** and **Global Memory** side by side, proving they are separate environments.
- **Step-through execution** — Variables change state step by step: first `undefined` during memory phase, then their assigned values during execution phase.

> **Tip:** Open Chrome DevTools → Sources tab → add a breakpoint → step through your own code to see this in action.

---

## Key Takeaways

| Concept                  | What to Remember                                                     |
| ------------------------ | -------------------------------------------------------------------- |
| Global Execution Context | Created automatically when your script runs                          |
| Two Phases               | Memory first (allocate), then Execution (run line by line)           |
| Function Invocation      | Creates a new, independent execution context with its own local memory |
| Call Stack               | Tracks execution order — push on call, pop on finish                 |
| Variable Independence    | Local variables don't affect global ones, even with the same name    |
| After Function Ends      | Its context is popped off and local memory is completely deleted     |


# The Global Execution Context, `window` & `this` — Notes

*Namaste JavaScript — by Akshay Saini*

---

## Global Execution Context — Always Created

Even if your JavaScript file is **completely empty**, the JavaScript engine still creates a **Global Execution Context**. This is the foundation — everything in JavaScript runs inside an execution context, and the engine sets this up automatically without you writing a single line of code.

---

## The Global Object (`window`)

Along with the Global Execution Context, the engine automatically creates a **global object**. You don't ask for it — it just exists.

- In **browsers**, this global object is called `window`.
- In **Node.js**, it's called `global`.
- Every JavaScript environment has its own version, but the concept is the same.

```js
// In an empty file, you can still do this in a browser:
console.log(window); // logs the entire window object
```

---

## The `this` Keyword at Global Level

At the global level (outside any function), `this` points directly to the global object.

In a browser, that means:

```js
console.log(this);          // window object
console.log(this === window); // true
```

So at the global level, `this`, `window`, and the global object are all the **same thing**.

---

## Global Space & Accessibility

Any variable or function you create in the **global space** (i.e., not inside any function) gets attached to the global object and is accessible from anywhere in your code.

```js
var name = "Akshay";

console.log(name);        // "Akshay"
console.log(window.name);  // "Akshay" — same thing
console.log(this.name);    // "Akshay" — also the same
```

---

## Key Takeaways

| Concept                   | What to Remember                                                       |
| ------------------------- | ---------------------------------------------------------------------- |
| Empty JS file             | Still creates a Global Execution Context automatically                 |
| Global Object             | Created by the engine — called `window` in browsers, `global` in Node  |
| `this` at global level    | Points to the global object (`this === window` in browsers)            |
| Global Space              | Variables/functions declared globally attach to `window` and are accessible everywhere |
| Core Rule                 | Everything in JavaScript runs inside an execution context              |

# `undefined` vs `not defined` & Loosely Typed JS — Notes

*Namaste JavaScript — by Akshay Saini*

---

## `undefined` — A Special Placeholder

`undefined` is not just "nothing" — it's a **special keyword and value** in JavaScript with a specific purpose.

During the **memory allocation phase**, before any code runs, the JavaScript engine scans your code and reserves space for all declared variables. Since it doesn't know what value they'll hold yet, it assigns them the placeholder value `undefined`.

```js
console.log(a); // undefined — declared but no value assigned yet
var a = 10;
console.log(a); // 10 — now it has a value
```

**In simple terms:** `undefined` means "I know this variable exists, but it doesn't have a value yet."

---

## `not defined` — It Doesn't Exist at All

This is completely different from `undefined`. A `not defined` error occurs when you try to access a variable that was **never declared** anywhere in your code.

Since the JavaScript engine never allocated any memory for it, it has no idea what you're referring to — and throws a **ReferenceError**.

```js
console.log(b); // ReferenceError: b is not defined
// 'b' was never declared with var, let, or const
```

---

## Quick Comparison

| Scenario          | What Happens                        | Meaning                              |
| ----------------- | ----------------------------------- | ------------------------------------ |
| `undefined`       | Variable is declared but not assigned | "Exists in memory, waiting for a value" |
| `not defined`     | Variable was never declared          | "Doesn't exist at all" → ReferenceError |

---

## JavaScript is a Loosely Typed Language

JavaScript does **not** require you to specify a data type when declaring a variable. A single variable can hold a number, then a string, then a boolean — JavaScript won't complain.

```js
var x = 10;       // number
x = "hello";      // now it's a string
x = true;         // now it's a boolean
// all perfectly valid in JavaScript
```

This makes JavaScript very **flexible**, but it also means you need to be careful about what type of value a variable holds at any given point.

---

## Best Practice: Never Assign `undefined` Manually

While it's technically possible to write `a = undefined`, this is **bad practice**. The value `undefined` is meant to be a system-generated placeholder — it tells you that JavaScript allocated memory but hasn't assigned a value yet.

```js
// ❌ Bad — don't do this
var a = undefined;

// ✅ Good — let JavaScript handle undefined on its own
var a;
console.log(a); // undefined (naturally)
```

If you want to intentionally mark a variable as "empty" or "no value," use `null` instead — that's what it's designed for.

---

## Key Takeaways

| Concept              | What to Remember                                                       |
| -------------------- | ---------------------------------------------------------------------- |
| `undefined`          | System-assigned placeholder — variable exists but has no value yet     |
| `not defined`        | Variable was never declared — causes a ReferenceError                  |
| Loosely Typed        | Variables can hold any data type and be reassigned freely              |
| Don't assign `undefined` | Let it stay as a natural placeholder; use `null` for intentional emptiness |


# Scope, Closures & Everything In Between — Notes

*Namaste JavaScript — by Akshay Saini*

---

## 1. What is Scope?

Scope determines **where** a variable or function can be accessed in your code. When you ask "is this variable in scope?", you're really asking "can I use this variable here?"

```js
function greet() {
  var message = "Hello";
  console.log(message); // ✅ accessible — inside the same scope
}

console.log(message); // ❌ ReferenceError — outside the scope
```

---

## 2. The Lexical Environment

A **Lexical Environment** is created every time an execution context is created. It's made up of two things:

1. **Local memory** — the variables and functions declared in that context.
2. **A reference to the parent's lexical environment** — a link pointing outward.

The word **"lexical"** means "where the code is physically written." If function `C` is written inside function `A`, then `C` is *lexically* inside `A` — and `C` gets access to `A`'s variables through this parent reference.

The global scope's parent reference points to `null` — there's nothing above it.

```
function A() {
  var x = 10;

  function C() {
    console.log(x); // finds 'x' through parent reference → A's memory
  }

  C();
}
```

---

## 3. The Scope Chain

When JavaScript needs a variable, it first looks in the **local memory**. If it's not there, it follows the parent reference to the outer lexical environment, then to the next one, and so on — all the way up to the global scope.

This chain of lookups is called the **Scope Chain**.

If the variable isn't found even after reaching `null` (the end of the chain), JavaScript throws a **ReferenceError: variable is not defined**.

```
C's local memory → A's local memory → Global memory → null (ReferenceError)
```

---

## 4. `let`, `const` & the Temporal Dead Zone

### Hoisting — But Different

Variables declared with `let` and `const` **are hoisted**, but they are stored in a **separate memory space** (not on the global object). They remain **uninitialized** until the code reaches their declaration line.

```js
console.log(a); // ReferenceError — a is in the TDZ
let a = 10;
```

### Temporal Dead Zone (TDZ)

The TDZ is the period between the **start of the scope** and the **line where the variable is initialized**. Accessing the variable during this window throws a ReferenceError.

```
{                    // ← TDZ for 'x' starts here
  // ...any code here cannot access 'x'
  let x = 5;        // ← TDZ ends here, 'x' is now usable
}
```

### Not Attached to `window`

Unlike `var`, variables declared with `let` and `const` are **not** attached to the `window` object.

```js
var a = 10;
let b = 20;

console.log(window.a); // 10
console.log(window.b); // undefined
```

### Redeclaration Rules

`let` and `const` **do not** allow redeclaration in the same scope — doing so throws a SyntaxError.

```js
let x = 10;
let x = 20; // ❌ SyntaxError: Identifier 'x' has already been declared
```

### Error Types Summary

| Error          | When It Happens                                              | Example                              |
| -------------- | ------------------------------------------------------------ | ------------------------------------ |
| SyntaxError    | Invalid syntax or redeclaring `let`/`const` in the same scope | `let x = 1; let x = 2;`             |
| ReferenceError | Accessing a variable not in scope or still in the TDZ        | `console.log(a); let a = 5;`        |
| TypeError      | Reassigning a `const` variable                               | `const x = 1; x = 2;`              |

### Best Practices

- Use **`const`** by default — prevents accidental reassignment.
- Use **`let`** only when the value needs to change.
- Always **declare variables at the top** of their scope to avoid the TDZ.

---

## 5. Block Scope

### What is a Block?

A block is a pair of curly braces `{}` that groups multiple statements into one unit. You need them wherever JavaScript expects a single statement — like after `if`, `for`, or `while`.

```js
if (true) {
  // this block groups multiple statements into one
  let a = 10;
  console.log(a);
}
```

### How Block Scope Works

- `let` and `const` are **block-scoped** — they live in a separate memory space tied to that block and are **not accessible outside** it.
- `var` is **not block-scoped** — it gets hoisted to the nearest function or global scope.

```js
{
  var a = 10;
  let b = 20;
  const c = 30;
}

console.log(a); // 10 — var ignores the block
console.log(b); // ❌ ReferenceError — let is block-scoped
console.log(c); // ❌ ReferenceError — const is block-scoped
```

---

## 6. Shadowing

Shadowing happens when a variable declared **inside a block** has the **same name** as one in an outer scope. The inner variable "shadows" the outer one within that block.

```js
var x = 100;

{
  var x = 10; // shadows AND modifies the outer 'x' (same memory)
  console.log(x); // 10
}

console.log(x); // 10 — outer value is changed too!
```

With `let` and `const`, shadowing is **safe** — they maintain separate memory locations:

```js
let y = 100;

{
  let y = 10; // shadows but does NOT affect the outer 'y'
  console.log(y); // 10
}

console.log(y); // 100 — outer value is untouched
```

### Illegal Shadowing

You **cannot** shadow a `let` variable with `var` in an inner scope — this throws a SyntaxError.

```js
let a = 10;

{
  var a = 20; // ❌ SyntaxError — illegal shadowing
}
```

But you **can** shadow a `var` with `let`:

```js
var a = 10;

{
  let a = 20; // ✅ this is perfectly fine
}
```

### Lexical Block Scope

Block scopes follow the same **scope chain** rules as functions. If a variable isn't found in the current block, JavaScript looks in the outer block, then the next one, all the way up to global scope.

---

## 7. Closures

### What is a Closure?

A closure is a **function bundled together with its lexical environment**. In simpler terms, a function **remembers** the variables from its outer scope, even when it's executed somewhere else entirely.

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

When `inner` is returned from `outer`, it doesn't just carry its own code — it carries a **reference** to the variables in its original lexical environment. It holds onto `count`, not a copy of its value, but the actual reference.

### What About Garbage Collection?

Normally, when a function finishes executing, its local variables are cleaned up by the garbage collector. But closures **prevent** this — because the returned function still holds a reference to those variables, they stay alive in memory.

### Common Use Cases

- **Module Design Pattern** — creating private variables and exposing only what's needed.
- **Currying** — partially applying functions with preset arguments.
- **Function Once** — ensuring a function can only run a single time.
- **Data Encapsulation** — managing internal state while keeping it hidden from the outside.

---

## 8. `setTimeout` + Closures (The Classic Interview Problem)

### How `setTimeout` Works

JavaScript **does not wait** for `setTimeout` to finish. It moves on to the next line immediately. The callback is stored separately and fired only after the timer expires. Since callbacks are created inside a function, they form a **closure** — carrying a reference to their surrounding variables.

### The Problem with `var` in Loops

```js
for (var i = 1; i <= 5; i++) {
  setTimeout(function () {
    console.log(i);
  }, i * 1000);
}

// Output: 6, 6, 6, 6, 6 (not 1, 2, 3, 4, 5)
```

All five callbacks share the **same reference** to `i`. By the time they execute, the loop has finished and `i` is already `6`.

### Solution 1: Use `let`

`let` is block-scoped, so every iteration creates a **brand-new copy** of `i`. Each closure captures its own unique value.

```js
for (let i = 1; i <= 5; i++) {
  setTimeout(function () {
    console.log(i);
  }, i * 1000);
}

// Output: 1, 2, 3, 4, 5 ✅
```

### Solution 2: Closure Wrapping (When Forced to Use `var`)

Wrap `setTimeout` inside another function. Passing `i` as an argument creates a **new scope** with a fresh copy of the value for each iteration.

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

## Master Summary

| Concept              | One-Line Takeaway                                                              |
| -------------------- | ------------------------------------------------------------------------------ |
| Scope                | Where a variable is accessible in your code                                    |
| Lexical Environment  | Local memory + reference to parent's environment                               |
| Scope Chain          | The chain of lookups from local → parent → global → null                       |
| TDZ                  | The gap between hoisting and initialization for `let`/`const`                  |
| Block Scope          | `let` and `const` are confined to `{}`; `var` is not                           |
| Shadowing            | Inner variable with the same name hides the outer one within that block        |
| Illegal Shadowing    | Cannot shadow `let` with `var` — but can shadow `var` with `let`               |
| Closure              | A function that remembers its outer scope variables even after the parent returns |
| setTimeout + var     | All callbacks share one `i` — use `let` or closure wrapping to fix             |

# Functions, Async JS, Event Loop & Higher-Order Functions — Notes

*Namaste JavaScript — by Akshay Saini*

---

## 1. Function Definitions

### Function Statement (Declaration)

The standard way of creating a function. These are **fully hoisted** — you can call them before they appear in your code.

```js
greet(); // ✅ works — hoisted

function greet() {
  console.log("Hello!");
}
```

### Function Expression

A function assigned to a variable. JavaScript treats it like a variable, so it's assigned `undefined` during hoisting. Calling it early throws a TypeError.

```js
greet(); // ❌ TypeError — greet is undefined

var greet = function () {
  console.log("Hello!");
};
```

### Anonymous Function

A function **without a name**. These can't exist on their own — they must be used in an expression context (assigned to a variable, passed as an argument, etc.).

```js
var sayHi = function () {
  console.log("Hi!");
};
```

### Named Function Expression

A function expression where the function has a name. That name is only accessible **inside** the function itself, not in the outer scope.

```js
var greet = function hello() {
  console.log(hello); // ✅ accessible inside
};

console.log(hello); // ❌ ReferenceError — not accessible outside
```

---

## 2. Parameters vs Arguments

- **Parameters** — the labels/placeholders in the function definition.
- **Arguments** — the actual values you pass when calling the function.

```js
function add(a, b) {   // a, b are parameters
  return a + b;
}

add(3, 5);              // 3, 5 are arguments
```

---

## 3. First-Class Functions

Functions in JavaScript are **first-class citizens**, meaning they can be:

- Assigned to variables
- Passed as arguments to other functions
- Returned from functions

This is the foundation that makes callbacks, closures, and functional programming possible.

```js
function greet() { return "Hello!"; }

function run(fn) {
  console.log(fn()); // function passed as an argument
}

run(greet); // "Hello!"
```

---

## 4. Callback Functions

A callback is a function **passed into another function** to be executed later — after a task finishes or an event occurs.

```js
function doSomething(callback) {
  console.log("Working...");
  callback();
}

doSomething(function () {
  console.log("Done!"); // executed after "Working..."
});
```

---

## 5. Asynchronous JavaScript

JavaScript is **single-threaded** — it has one call stack and does one thing at a time. So how does it handle timers, network requests, and user interactions without freezing?

The answer: **callbacks + Web APIs + the Event Loop**.

### Blocking the Main Thread

Since there's only one call stack, any heavy or long-running code will **freeze the entire page**. Always use asynchronous operations to avoid blocking.

```js
// ❌ Bad — blocks everything for ~10 seconds
for (let i = 0; i < 10000000000; i++) {}

// ✅ Good — use async patterns instead
setTimeout(() => console.log("Done"), 1000);
```

---

## 6. Event Listeners & Closures

Event listeners are a classic use of callbacks. The function you attach **waits** until the user interacts (click, hover, keypress, etc.).

Event listeners often form **closures**, maintaining access to outer variables:

```js
function setupCounter() {
  var count = 0;

  document.getElementById("btn").addEventListener("click", function () {
    count++; // closure — remembers 'count' from outer scope
    console.log("Clicked", count, "times");
  });
}
```

### Memory Warning

Event listeners are **heavy** because they hold closures in memory. If you have many listeners on a page, remove them when no longer needed to prevent memory leaks.

---

## 7. The JavaScript Runtime — The Big Picture

### Components

| Component         | Role                                                              |
| ----------------- | ----------------------------------------------------------------- |
| **Call Stack**     | Where all code execution happens, one frame at a time             |
| **Web APIs**       | Browser-provided features — `setTimeout`, `fetch`, DOM events     |
| **Callback Queue** | Holds callbacks from timers, events, etc., waiting to run         |
| **Microtask Queue** | Higher-priority queue for Promises and MutationObserver           |
| **Event Loop**     | Monitors the Call Stack — pushes queued tasks in when it's empty  |

### How It All Connects

1. Your code runs on the **Call Stack**.
2. When you call something like `setTimeout`, the browser's **Web API** takes over and manages the timer.
3. Once the timer expires, the callback is pushed to the **Callback Queue**.
4. The **Event Loop** checks: "Is the Call Stack empty?" If yes, it pushes the callback from the queue onto the stack.
5. The callback finally executes.

### Microtask Queue vs Callback Queue

The **Microtask Queue** has **higher priority**. The Event Loop always empties the Microtask Queue before touching the Callback Queue.

- **Microtask Queue** handles: Promises (`.then`, `.catch`, `.finally`), MutationObserver
- **Callback Queue** handles: `setTimeout`, `setInterval`, DOM events

### Starvation

If the Microtask Queue keeps adding new tasks endlessly, the Callback Queue **never gets a chance** to execute. This is called **task starvation**.

---

## 8. JS Engine Architecture

### The Three Steps

1. **Parsing** — A Syntax Parser reads your code and generates an **Abstract Syntax Tree (AST)**.
2. **Compilation** — The AST is converted into machine-executable code.
3. **Execution** — The code runs on the Call Stack with access to the Memory Heap.

### JIT Compilation (Just-In-Time)

Modern engines don't purely interpret or purely compile. They use **both**:

- The **Interpreter** starts executing code quickly, line by line.
- The **Compiler** optimizes hot code paths in the background for better performance.

This makes JavaScript a **JIT-compiled language** in practice.

### Memory Management

- **Memory Heap** — where variables and functions are stored.
- **Garbage Collector** — automatically frees memory using algorithms like **Mark & Sweep** when data is no longer reachable.

### Google's V8 Engine

V8 powers **Chrome** and **Node.js**. It uses a sophisticated parser, an interpreter (Ignition), and optimizing compilers (TurboFan) to make JavaScript run as fast as possible.

---

## 9. `setTimeout` — Trust Issues

### The Delay is a Minimum, Not a Guarantee

The delay you pass to `setTimeout` is the **minimum** time the callback will wait. If the Call Stack is busy (e.g., running a heavy loop), the callback must wait even longer.

```js
console.log("Start");

setTimeout(function () {
  console.log("Timer done"); // waits for the stack to be completely empty
}, 5000);

// If this loop takes 10 seconds, the callback runs after ~10s, not 5s
for (let i = 0; i < 10000000000; i++) {}

console.log("End");
```

### `setTimeout(fn, 0)` — Not Instant

Even with a 0ms delay, the callback **does not** execute immediately. It still goes through the Web API → Callback Queue → Event Loop cycle and must wait for the current Call Stack to clear.

```js
console.log("1");
setTimeout(() => console.log("2"), 0);
console.log("3");

// Output: 1, 3, 2 — the 0ms callback still waits
```

---

## 10. Higher-Order Functions

A **Higher-Order Function** is a function that either:

- **Takes** another function as an argument, or
- **Returns** a function

This is possible because functions are first-class citizens in JavaScript.

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

Don't Repeat Yourself. Instead of writing separate loops for area, circumference, and diameter — extract the varying logic into small functions and pass them to a single higher-order function. This makes code **modular, reusable, and testable**.

---

## 11. `map()`, `filter()`, `reduce()`

### `Array.map()`

Transforms every element of an array and returns a **new array**.

```js
const nums = [1, 2, 3, 4];

const doubled = nums.map((x) => x * 2);        // [2, 4, 6, 8]
const binary = nums.map((x) => x.toString(2));  // ["1", "10", "11", "100"]
```

### `Array.filter()`

Filters elements based on a condition and returns a **new array** with only the matching items.

```js
const nums = [1, 2, 3, 4, 5, 6];

const evens = nums.filter((x) => x % 2 === 0);       // [2, 4, 6]
const greaterThan3 = nums.filter((x) => x > 3);      // [4, 5, 6]
```

### `Array.reduce()`

Reduces an entire array down to a **single value** — a sum, a max, an object, anything.

Takes two parameters: an **accumulator** (the running result) and the **current** value.

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

You can combine these methods together for powerful one-liners:

```js
const users = [
  { name: "Akshay", age: 26 },
  { name: "Donald", age: 75 },
  { name: "Elon", age: 50 },
];

// Get names of users older than 30
const result = users
  .filter((u) => u.age > 30)
  .map((u) => u.name);
// ["Donald", "Elon"]
```

### Writing a `map` Polyfill

Understanding how `map` works under the hood — you can add your own version to `Array.prototype`:

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

## Master Summary

| Topic                    | One-Line Takeaway                                                              |
| ------------------------ | ------------------------------------------------------------------------------ |
| Function Declaration     | Fully hoisted — can be called before its line                                  |
| Function Expression      | Treated as a variable — `undefined` until the assignment line                  |
| First-Class Functions    | Functions can be values, arguments, and return values                          |
| Callback                 | A function passed to another function, executed later                          |
| Call Stack               | Single-threaded — one thing at a time                                          |
| Web APIs                 | Browser features that handle async work outside the main thread                |
| Event Loop               | Pushes queued callbacks to the Call Stack when it's empty                       |
| Microtask Queue          | Higher priority than Callback Queue — handles Promises                         |
| JIT Compilation          | Modern engines interpret + compile for speed and optimization                  |
| `setTimeout` trust issue | The delay is a minimum wait, not a guarantee                                   |
| `setTimeout(fn, 0)`      | Still async — goes through the queue, doesn't run immediately                  |
| Higher-Order Function    | Takes a function as argument or returns one                                    |
| `map()`                  | Transforms every element → returns new array                                   |
| `filter()`               | Keeps elements matching a condition → returns new array                        |
| `reduce()`               | Collapses an array into a single value                                         |
| Chaining                 | Combine `map`, `filter`, `reduce` for clean, expressive data transformations   |


# Callbacks, Promises & the `this` Keyword — Notes

*Namaste JavaScript — by Akshay Saini*

---

## 1. The Role of Callbacks in Async JavaScript

JavaScript is single-threaded and doesn't wait for tasks to finish. Callbacks let us say "run this code *later*" — after a timer, an API response, or another operation completes.

```js
setTimeout(function () {
  console.log("This runs after 2 seconds");
}, 2000);
```

### Managing Dependencies

Callbacks help enforce order — one operation waits for another to finish before executing.

```js
createOrder(cart, function () {
  proceedToPayment(order); // only runs after order is created
});
```

---

## 2. Problems with Callbacks

### Callback Hell (Pyramid of Doom)

When multiple async operations depend on each other, callbacks get **deeply nested**, growing horizontally into an unreadable pyramid.

```js
createOrder(cart, function () {
  proceedToPayment(order, function () {
    showOrderSummary(payment, function () {
      updateWallet(summary, function () {
        // nightmare to read, debug, and maintain
      });
    });
  });
});
```

### Inversion of Control

When you pass a callback to an external API, you **hand over control** of your program's execution. You're blindly trusting that the API will:

- Call your function at all
- Call it only **once**
- Handle errors correctly

If that external code has bugs or behaves unexpectedly, your code pays the price — and you have no way to enforce guarantees.

> Understanding these two problems is the prerequisite for learning Promises.

---

## 3. Promises — The Solution

### Why Promises Exist

Instead of *passing* a callback to an external function (losing control), Promises let us *attach* a callback to a returned object. We retain control of our own code.

```js
// ❌ Callback approach — we lose control
createOrder(cart, function (order) {
  proceedToPayment(order);
});

// ✅ Promise approach — we retain control
const orderPromise = createOrder(cart);
orderPromise.then(function (order) {
  proceedToPayment(order);
});
```

### What is a Promise?

> **Interview answer:** "A Promise is an object representing the eventual completion of an asynchronous operation."

### Three States of a Promise

| State         | Meaning                                      |
| ------------- | -------------------------------------------- |
| **Pending**   | Initial state — operation hasn't finished yet |
| **Fulfilled** | Operation completed successfully              |
| **Rejected**  | Operation failed                              |

Once a Promise is settled (fulfilled or rejected), it is **immutable** — the result cannot be changed. This makes Promises a reliable way to pass data around.

---

## 4. Creating Promises

Promises are created using the `new Promise` constructor, which takes a function with two parameters: `resolve` (for success) and `reject` (for failure).

```js
const promise = new Promise(function (resolve, reject) {
  // simulate async work
  const success = true;

  if (success) {
    resolve("Order created!"); // triggers .then()
  } else {
    reject("Something went wrong"); // triggers .catch()
  }
});
```

Once resolved or rejected, a Promise **cannot be changed** — calling `resolve` or `reject` again has no effect.

---

## 5. Consuming Promises

### `.then()` — Handle Success

```js
promise.then(function (result) {
  console.log(result); // "Order created!"
});
```

### `.catch()` — Handle Errors Gracefully

```js
promise.catch(function (error) {
  console.log(error); // prevents crash, shows friendly message
});
```

### Promise Chaining — Goodbye Callback Hell

Chain `.then()` blocks **vertically** instead of nesting callbacks horizontally. The key rule: always **return** the value or next promise so data flows down the chain.

```js
createOrder(cart)
  .then(function (order) {
    return proceedToPayment(order); // return is critical
  })
  .then(function (payment) {
    return showOrderSummary(payment);
  })
  .then(function (summary) {
    return updateWallet(summary);
  })
  .catch(function (error) {
    console.log("Something failed:", error);
  });
```

### Strategic `.catch()` Placement

- `.catch()` handles errors for **all steps above it** in the chain.
- Place it at the end for global error handling, or in the middle to catch errors from specific steps while letting the rest of the chain continue.

```js
createOrder(cart)
  .then((order) => proceedToPayment(order))
  .catch((err) => console.log("Order/payment failed:", err)) // catches above
  .then((summary) => updateWallet(summary)); // still runs even if above failed
```

---

## 6. Promise APIs — Handling Multiple Promises

### `Promise.all()`

Waits for **all** promises to succeed. Returns an array of results. If **any one** fails, it immediately rejects with that error (**fail-fast**).

```js
Promise.all([p1, p2, p3])
  .then((results) => console.log(results))    // [res1, res2, res3]
  .catch((err) => console.log("Failed:", err)); // first failure
```

**Use when:** You need all results and can't proceed if any one fails.

### `Promise.allSettled()`

Waits for **all** promises to finish, regardless of success or failure. Returns an array of objects with `status` and `value`/`reason`.

```js
Promise.allSettled([p1, p2, p3]).then((results) => console.log(results));
// [
//   { status: "fulfilled", value: "res1" },
//   { status: "rejected", reason: "error" },
//   { status: "fulfilled", value: "res3" }
// ]
```

**Use when:** You want results from everything, even partial failures. The safest option.

### `Promise.race()`

Returns the result of the **first promise to settle** — whether it succeeds or fails. All others are ignored.

```js
Promise.race([p1, p2, p3])
  .then((winner) => console.log(winner))  // fastest result
  .catch((err) => console.log(err));       // if fastest was a rejection
```

**Use when:** You only care about the fastest response.

### `Promise.any()`

Waits for the **first successful** promise. Ignores rejections — unless **all** promises fail, in which case it throws an `AggregateError`.

```js
Promise.any([p1, p2, p3])
  .then((first) => console.log(first))      // first success
  .catch((err) => console.log(err.errors));  // all errors if everything failed
```

**Use when:** You want the first success and don't care about failures along the way.

### Quick Comparison

| API                   | Waits For         | On Failure                            | Returns              |
| --------------------- | ----------------- | ------------------------------------- | -------------------- |
| `Promise.all()`       | All to succeed    | Fails fast on first rejection         | Array of values      |
| `Promise.allSettled()`| All to finish     | Never short-circuits                  | Array of status objects |
| `Promise.race()`      | First to settle   | Returns it even if it's a rejection   | Single value/error   |
| `Promise.any()`       | First success     | AggregateError if all fail            | Single value         |

### Key Terminology

- **Settled** — the promise has finished (either fulfilled or rejected)
- **Fulfilled** — resolved successfully
- **Rejected** — failed
- **AggregateError** — an error containing all individual rejection reasons (used by `Promise.any`)

---

## 7. The `this` Keyword

The value of `this` depends entirely on **where** and **how** it's used. It's one of the trickiest parts of JavaScript.

### In the Global Scope

`this` refers to the **global object** — `window` in browsers, `global` in Node.js.

```js
console.log(this); // window (in browser)
```

### Inside a Regular Function

The value depends on **strict mode**:

| Mode            | Value of `this`                                   |
| --------------- | ------------------------------------------------- |
| Non-strict mode | Global object (`window`) — due to "this substitution" |
| Strict mode     | `undefined`                                       |

```js
"use strict";

function showThis() {
  console.log(this); // undefined
}

showThis();
```

It also depends on **how** the function is called:

```js
function showThis() {
  console.log(this);
}

showThis();        // window (non-strict) or undefined (strict)
window.showThis(); // window — called as a method of window
```

### Inside Object Methods

When a function is a **method** of an object, `this` refers to the object itself.

```js
const user = {
  name: "Akshay",
  greet: function () {
    console.log(this.name); // "Akshay" — this = user object
  },
};

user.greet();
```

### Sharing Methods with `call`, `apply`, `bind`

These methods let you **override** the value of `this`, making it possible to reuse functions across different objects.

```js
const user1 = { name: "Akshay" };
const user2 = { name: "Elon" };

function greet() {
  console.log("Hello, " + this.name);
}

greet.call(user1);  // "Hello, Akshay" — this = user1
greet.call(user2);  // "Hello, Elon"   — this = user2
```

### Arrow Functions — No Own `this`

Arrow functions **do not** have their own `this` binding. They inherit `this` from their **enclosing lexical scope** — wherever they are physically written in the code.

```js
const user = {
  name: "Akshay",
  greet: function () {
    const inner = () => {
      console.log(this.name); // "Akshay" — inherits 'this' from greet()
    };
    inner();
  },
};

user.greet();
```

### In DOM Event Handlers

In an event handler, `this` refers to the **HTML element** that triggered the event.

```js
document.getElementById("btn").addEventListener("click", function () {
  console.log(this); // the <button> element itself
});
```

### `this` Summary

| Context               | Value of `this`                                |
| --------------------- | ---------------------------------------------- |
| Global scope          | Global object (`window` / `global`)            |
| Function (non-strict) | Global object (this substitution)              |
| Function (strict)     | `undefined`                                    |
| Object method         | The object itself                              |
| `call` / `apply` / `bind` | Whatever you explicitly pass                |
| Arrow function        | Inherited from enclosing lexical scope         |
| DOM event handler     | The HTML element that triggered the event      |

---

## Master Summary

| Topic                  | One-Line Takeaway                                                              |
| ---------------------- | ------------------------------------------------------------------------------ |
| Callbacks              | Functions passed to run later — essential for async, but risky at scale        |
| Callback Hell          | Deeply nested callbacks → unreadable pyramid of doom                           |
| Inversion of Control   | Passing a callback = handing over control to external code                     |
| Promise                | An object representing eventual completion of an async operation               |
| Promise States         | Pending → Fulfilled or Rejected (immutable once settled)                       |
| `.then()` / `.catch()` | Attach success/error handlers to a promise                                     |
| Promise Chaining       | Sequential async steps, vertically — always `return` in each `.then()`         |
| `Promise.all()`        | All must succeed — fail-fast on first rejection                                |
| `Promise.allSettled()` | Wait for everything — safest option                                            |
| `Promise.race()`       | First to settle wins (success or failure)                                      |
| `Promise.any()`        | First success wins — AggregateError only if all fail                           |
| `this` in global       | Global object (`window`)                                                       |
| `this` in functions    | Depends on strict mode and how it's called                                     |
| `this` in methods      | The object the method belongs to                                               |
| `this` in arrows       | Inherited from enclosing lexical scope — no own binding                        |

