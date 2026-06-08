# Node.js with TypeScript — Interview Questions & Answers
## Basic to Advanced | With Definitions & Cross-Questions | Senior/Lead Engineer Prep

---

## Table of Contents

1. [TypeScript Fundamentals](#1-typescript-fundamentals)
2. [TypeScript with Node.js Setup](#2-typescript-with-nodejs-setup)
3. [Types, Interfaces & Generics](#3-types-interfaces--generics)
4. [Modules & Namespaces](#4-modules--namespaces)
5. [Decorators & Metadata](#5-decorators--metadata)
6. [Node.js Core with TypeScript](#6-nodejs-core-with-typescript)
7. [Express + TypeScript](#7-express--typescript)
8. [Database Integration (TypeORM / Prisma)](#8-database-integration-typeorm--prisma)
9. [Error Handling & Custom Errors](#9-error-handling--custom-errors)
10. [Testing with TypeScript (Jest)](#10-testing-with-typescript-jest)
11. [Advanced Patterns & Design Principles](#11-advanced-patterns--design-principles)
12. [Performance, Scalability & Production](#12-performance-scalability--production)

---

## 1. TypeScript Fundamentals

---

### Q1. What is TypeScript? Why use it with Node.js?

#### 📖 Definition
TypeScript is an **open-source, statically typed superset of JavaScript** developed by Microsoft. It compiles ("transpiles") to plain JavaScript and can run anywhere JavaScript runs — browsers, Node.js, Deno, etc.

"Statically typed" means types are **checked at compile time**, before your code ever runs — unlike JavaScript which is dynamically typed and checks types only at runtime.

TypeScript adds:
- **Type annotations** (`name: string`)
- **Interfaces** and **type aliases**
- **Generics** for reusable type-safe code
- **Enums**
- **Decorators** (experimental / stage-3)
- **Access modifiers** (`public`, `private`, `protected`)
- **Abstract classes**
- Latest ECMAScript features (downcompiled to older targets)

#### ✅ Answer
```typescript
// Pure JavaScript — no type safety
function add(a, b) {
  return a + b;
}
add(1, "2"); // returns "12" — silent bug!

// TypeScript — error caught at compile time
function add(a: number, b: number): number {
  return a + b;
}
add(1, "2"); // ❌ TS Error: Argument of type 'string' is not assignable to 'number'
```

**Why TypeScript with Node.js?**
- Catch bugs before deploying — not after customer hits them
- IDE gives full autocomplete on your own functions and third-party libs
- Easier to refactor large codebases safely
- `@types/*` packages provide type info for most npm packages
- Team collaboration improves — types serve as documentation
- Strict null checks eliminate entire class of `Cannot read property of undefined` crashes

---

#### 🔁 Cross Questions

**CQ1.1 — TypeScript compiles to JavaScript. Does that mean it's slower than JavaScript?**
> No. TypeScript only adds compile-time overhead (the `tsc` step). The output is plain `.js` — there is no TypeScript runtime. Performance at execution time is identical.

**CQ1.2 — If TypeScript catches errors at compile time, can a TypeScript program still throw runtime errors?**
> Yes. TypeScript only checks types structurally — it cannot catch logical bugs, runtime data shape mismatches (e.g., API returns unexpected JSON), or errors from third-party code. That's why runtime validation (Zod, Joi) is still important alongside TypeScript.

**CQ1.3 — Is TypeScript a language or a tool?**
> Both. TypeScript is a language (a superset of JavaScript with additional syntax), and also a compiler toolchain (`tsc`). The language specification and the compiler are developed together by Microsoft.

**CQ1.4 — Can you use TypeScript in Node.js without compiling it every time?**
> Yes. Tools like `ts-node` and `ts-node-dev` execute TypeScript directly without a separate compile step — they compile on-the-fly in memory. For production, you always compile first with `tsc` and run the emitted `.js` files.

---

### Q2. What is `strict` mode in TypeScript? What flags does it enable?

#### 📖 Definition
`"strict": true` in `tsconfig.json` is a **master switch** that enables a collection of strict type-checking compiler flags all at once. It was introduced so developers don't have to enable each safety check individually.

Without `strict`, TypeScript is very lenient — it allows implicit `any`, optional property assumptions, etc. With `strict`, TypeScript behaves like a serious type-safe language.

#### ✅ Answer
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true
  }
}
```

Flags enabled by `"strict": true`:

| Flag | What it does |
|---|---|
| `strictNullChecks` | `null` and `undefined` are not assignable to other types unless explicitly typed |
| `noImplicitAny` | Variables cannot have an implicit `any` type — you must annotate |
| `strictFunctionTypes` | Function parameters are checked contravariantly |
| `strictBindCallApply` | `bind`, `call`, `apply` are checked strictly |
| `strictPropertyInitialization` | Class properties must be initialized in constructor |
| `noImplicitThis` | `this` in functions with unknown context is an error |
| `alwaysStrict` | Emits `"use strict"` in every output file |
| `useUnknownInCatchVariables` | Catch clause variable is `unknown` not `any` (TS 4.4+) |

```typescript
// Without strict — dangerous
function greet(user) { // implicit any
  console.log(user.name.toUpperCase()); // no error — could crash
}

// With strict
function greet(user: { name: string }): void {
  console.log(user.name.toUpperCase()); // safe, typed
}

// strictNullChecks example
let name: string = null; // ❌ Error with strict
let name: string | null = null; // ✅ Explicit null type
```

---

#### 🔁 Cross Questions

**CQ2.1 — Can you enable some strict flags but not all?**
> Yes. `"strict": true` is a shorthand. You can turn off individual flags even with strict enabled:
> ```json
> { "strict": true, "strictPropertyInitialization": false }
> ```
> This is common when migrating a large JavaScript codebase to TypeScript progressively.

**CQ2.2 — What happens if you don't use `strictNullChecks`?**
> Without it, `null` and `undefined` are assignable to every type. This means TypeScript won't warn you when you call `.toString()` on a potentially null value — one of the most common sources of runtime crashes.

**CQ2.3 — What is `noImplicitAny` and why is it important?**
> Without it, TypeScript silently assigns `any` to variables when it can't infer the type. With `noImplicitAny`, you must always annotate, which prevents entire functions from becoming type-unsafe without you noticing.

**CQ2.4 — Should you always start a new project with `"strict": true`?**
> Yes for new projects — always. For migrating existing JS/TS codebases, you enable strict incrementally (per file or per flag) to avoid hundreds of errors at once. The TypeScript compiler supports `// @ts-nocheck` at the file level and `// @ts-ignore` per line for temporary suppression during migration.

---

### Q3. What is the difference between `any`, `unknown`, and `never`?

#### 📖 Definitions

- **`any`** — Opts out of type checking entirely. A value of type `any` can be assigned to any other type and any operation on it is allowed. It's an escape hatch that effectively turns off TypeScript for that value.

- **`unknown`** — The type-safe counterpart to `any`. Like `any`, it can hold any value — but unlike `any`, you cannot perform operations on an `unknown` value without first narrowing its type with a type guard.

- **`never`** — Represents a value that **never occurs**. It is the bottom type — a subtype of every type. Used for functions that always throw, infinite loops, or exhaustive type checks.

#### ✅ Answer

```typescript
// ── any ──────────────────────────────────────────────
let data: any = JSON.parse('{"id": 1}');
data.toUpperCase();       // ✅ No TS error (but crashes at runtime if data is not a string)
data.nonExistentMethod(); // ✅ No TS error — dangerous!

const x: number = data;  // ✅ any is assignable to everything

// ── unknown ──────────────────────────────────────────
let result: unknown = JSON.parse('{"id": 1}');
result.toUpperCase();     // ❌ TS Error: Object is of type 'unknown'

// Must narrow before use
if (typeof result === 'string') {
  result.toUpperCase();   // ✅ narrowed to string
}
if (typeof result === 'object' && result !== null && 'id' in result) {
  console.log((result as { id: number }).id); // ✅ safe
}

// ── never ──────────────────────────────────────────
// 1. Function that never returns
function fail(msg: string): never {
  throw new Error(msg);
}

// 2. Infinite loop
function runForever(): never {
  while (true) {}
}

// 3. Exhaustive switch — TS enforces all cases are handled
type Status = 'pending' | 'active' | 'closed';

function handleStatus(s: Status): string {
  switch (s) {
    case 'pending': return 'Waiting';
    case 'active':  return 'Running';
    case 'closed':  return 'Done';
    default:
      const _check: never = s; // TS error if a new Status is added but not handled
      return _check;
  }
}
```

| | `any` | `unknown` | `never` |
|---|---|---|---|
| Accepts any value | ✅ | ✅ | ❌ |
| Requires type guard to use | ❌ | ✅ | — |
| Type-safe | ❌ | ✅ | ✅ |
| Assignable to other types | ✅ | ❌ | ✅ (subtype of all) |
| Use case | Legacy migration | API/external data | Exhaustive checks, throws |

---

#### 🔁 Cross Questions

**CQ3.1 — When is it acceptable to use `any`?**
> Legitimate uses of `any`:
> - Migrating a large JavaScript codebase to TypeScript progressively
> - Working with extremely dynamic runtime structures where typing is impractical
> - Third-party libraries with no type definitions at all
> But even then, prefer `unknown` and narrow it — use `any` as a last resort.

**CQ3.2 — Why is `unknown` safer than `any` for `try/catch` error handling?**
> In a catch block, the error could be anything — an `Error` object, a string, a number, a rejected promise value. Using `unknown` forces you to check what you have before calling `.message` on it, preventing runtime crashes.
> ```typescript
> try { ... }
> catch (err: unknown) {
>   if (err instanceof Error) console.error(err.message); // safe
> }
> ```

**CQ3.3 — What is the practical difference between `void` and `never` as return types?**
> - `void` — the function returns, but its return value is not meaningful (e.g., `() => console.log('hi')`)
> - `never` — the function **never returns at all** — it either throws unconditionally or loops forever
> A function that sometimes throws and sometimes returns normally has return type `void` or a value type — not `never`.

**CQ3.4 — Can `never` be used as a parameter type?**
> Yes, and it's useful for creating types that can't be called with any argument:
> ```typescript
> type NoArgs = (arg: never) => void; // can never be called with any value
> ```

---

### Q4. What is the difference between `type` and `interface`?

#### 📖 Definition
Both `type` and `interface` are ways to describe the **shape of an object** in TypeScript. They are largely interchangeable for object types, but have key differences in capabilities.

- **`interface`** — A named structural type for objects. Supports declaration merging and is preferred for public API contracts and class implementation.
- **`type` alias** — A name given to any type expression. More flexible — can represent primitives, unions, intersections, tuples, and computed types, not just object shapes.

#### ✅ Answer

```typescript
// ── interface ─────────────────────────────────────────
interface User {
  id: number;
  name: string;
}

// Declaration Merging — unique to interface
interface User {
  email: string; // merged: User now has id, name, email
}

// Extending
interface Admin extends User {
  role: 'admin' | 'superadmin';
}

// Class implementation
class AppUser implements User {
  id = 1;
  name = 'Vikrant';
  email = 'v@example.com';
}

// ── type alias ────────────────────────────────────────
type ID = string | number;             // union — only possible with type
type Nullable<T> = T | null;           // generic with union
type Point = [number, number];         // tuple

// Intersection (equivalent to interface extends)
type AdminUser = User & { role: 'admin' };

// Computed / mapped type — only possible with type
type ReadonlyUser = {
  readonly [K in keyof User]: User[K];
};

// Conditional type — only possible with type
type IsString<T> = T extends string ? true : false;
```

| Feature | `interface` | `type` |
|---|---|---|
| Object shape | ✅ | ✅ |
| Union types | ❌ | ✅ |
| Intersection | `extends` | `&` |
| Declaration merging | ✅ | ❌ |
| Class `implements` | ✅ | ✅ |
| Mapped / conditional types | ❌ | ✅ |
| Primitives, tuples | ❌ | ✅ |
| Recursive types | ✅ | ✅ (with some limits) |

**Rule of thumb:**
- Use `interface` for object shapes, public APIs, class contracts
- Use `type` for unions, primitives, mapped types, and computed type expressions

---

#### 🔁 Cross Questions

**CQ4.1 — What is declaration merging and when is it useful?**
> Declaration merging means you can declare the same `interface` name multiple times and TypeScript merges all declarations into one. This is heavily used for **module augmentation** — for example, adding custom properties to Express's `Request` object:
> ```typescript
> declare global {
>   namespace Express {
>     interface Request { user?: User; }
>   }
> }
> ```
> `type` cannot do this — redeclaring the same type name is an error.

**CQ4.2 — Can you use `type` with `implements` in a class?**
> Yes, a class can implement a `type` alias as long as it describes an object shape (not a union or primitive):
> ```typescript
> type Serializable = { serialize(): string };
> class MyModel implements Serializable {
>   serialize() { return JSON.stringify(this); }
> }
> ```

**CQ4.3 — Why does TypeScript documentation recommend `interface` over `type` for object types?**
> Interfaces produce better error messages because TypeScript can name them. They also support declaration merging for extensibility. However, this is a style guideline — both work equally well in most real-world scenarios.

**CQ4.4 — What is a structural type system? How does it affect `interface` vs `type`?**
> TypeScript uses structural typing ("duck typing") — if two types have the same shape, they are compatible regardless of their name. This means an object doesn't need to explicitly declare `implements MyInterface` — if it has all the required properties, TypeScript accepts it. Both `interface` and `type` participate equally in structural typing.

---

## 2. TypeScript with Node.js Setup

---

### Q5. How do you set up a Node.js + TypeScript project from scratch?

#### 📖 Definition
Setting up TypeScript in Node.js involves:
1. Installing TypeScript and Node.js type definitions
2. Generating a `tsconfig.json` to control compiler behavior
3. Configuring build and dev scripts in `package.json`
4. Organizing source (`src/`) and output (`dist/`) directories

#### ✅ Answer

```bash
# 1. Initialize project
mkdir my-app && cd my-app
npm init -y

# 2. Install TypeScript + Node.js types
npm install typescript ts-node ts-node-dev @types/node --save-dev

# 3. Generate tsconfig.json
npx tsc --init
```

**tsconfig.json (production-ready for Node.js):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true,
    "incremental": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

**package.json scripts:**
```json
{
  "scripts": {
    "build":      "tsc",
    "build:watch":"tsc --watch",
    "start":      "node dist/index.js",
    "dev":        "ts-node-dev --respawn --transpile-only src/index.ts",
    "type-check": "tsc --noEmit",
    "lint":       "eslint src --ext .ts"
  }
}
```

**Project structure:**
```
my-app/
├── src/
│   ├── index.ts       ← entry point
│   ├── app.ts         ← Express app
│   ├── routes/
│   ├── services/
│   └── types/
├── dist/              ← compiled output (gitignored)
├── tsconfig.json
└── package.json
```

---

#### 🔁 Cross Questions

**CQ5.1 — What is the difference between `ts-node`, `ts-node-dev`, and `nodemon` with `ts-node`?**
> - `ts-node` — Runs a TypeScript file once. No watching.
> - `ts-node-dev` — Like `nodemon` but TypeScript-native. Restarts only the changed modules (faster than full restart). Uses `--respawn` to restart the process.
> - `nodemon + ts-node` — `nodemon` watches files and restarts; `ts-node` handles TS execution. Works but slightly slower than `ts-node-dev`.
> For most projects, `ts-node-dev` is the preferred dev server.

**CQ5.2 — What does `--transpile-only` flag do in ts-node?**
> It skips type checking during `ts-node` execution — only transpiles (strips types). This makes startup significantly faster during development. Type errors are still caught by your editor and by running `tsc --noEmit` separately in CI.

**CQ5.3 — What is `esModuleInterop` and why is it needed?**
> CommonJS modules use `module.exports` while ES modules use `export default`. Without `esModuleInterop`, you'd have to write:
> ```typescript
> import * as express from 'express';
> ```
> With `esModuleInterop: true`, TypeScript generates interop helpers that let you write the natural:
> ```typescript
> import express from 'express';
> ```

**CQ5.4 — What is `skipLibCheck` and is it safe to use?**
> `skipLibCheck: true` skips type checking of all `.d.ts` declaration files (including those in `node_modules/@types`). It's safe and commonly used because:
> - Some `@types` packages have internal type errors that aren't your bug
> - It speeds up compilation significantly
> - You're not shipping those declaration files as your code

---

### Q6. What is `tsconfig.json`? Explain the most important compiler options.

#### 📖 Definition
`tsconfig.json` is the **TypeScript project configuration file**. It tells the TypeScript compiler:
- Which files to include/exclude
- How to compile them (target JS version, module system)
- What level of type checking to apply
- Where to put the output

#### ✅ Answer

```json
{
  "compilerOptions": {

    // ── Output ──────────────────────────────────────────
    "target": "ES2020",       // JS version to compile to. ES2020 supports async/await, optional chaining natively
    "module": "commonjs",     // Module system: 'commonjs' for Node.js, 'ESNext' for ESM
    "outDir": "./dist",        // Where compiled .js files go
    "rootDir": "./src",        // Root of source TypeScript files

    // ── Type Safety ──────────────────────────────────────
    "strict": true,            // Enable all strict checks (recommended always)
    "noUnusedLocals": true,    // Error on unused local variables
    "noUnusedParameters": true,// Error on unused function parameters
    "noImplicitReturns": true, // All code paths must return a value
    "noFallthroughCasesInSwitch": true, // No implicit fallthrough in switch

    // ── Module Resolution ────────────────────────────────
    "esModuleInterop": true,   // Allow default imports from CommonJS modules
    "resolveJsonModule": true, // Allow importing .json files
    "moduleResolution": "node",// Resolve modules like Node.js does

    // ── Developer Experience ─────────────────────────────
    "sourceMap": true,         // Generate .map files for debugging
    "declaration": true,       // Generate .d.ts files (for libraries)
    "skipLibCheck": true,      // Skip type checking of node_modules .d.ts files
    "incremental": true        // Cache build info for faster rebuilds
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

---

#### 🔁 Cross Questions

**CQ6.1 — What is the `target` option? What happens if you set it to `ES5`?**
> `target` controls which JavaScript syntax the TypeScript compiler outputs. Setting `"target": "ES5"` means TypeScript will downcompile modern syntax — `async/await` becomes `.then()` chains, arrow functions become regular functions, `const`/`let` become `var`. For Node.js 14+, `ES2020` is safe and produces cleaner output.

**CQ6.2 — What is `paths` option used for? Give an example.**
> `paths` defines import path aliases so you can avoid long relative imports like `../../../../services/user`:
> ```json
> {
>   "compilerOptions": {
>     "baseUrl": "./src",
>     "paths": {
>       "@services/*": ["services/*"],
>       "@models/*":   ["models/*"]
>     }
>   }
> }
> ```
> ```typescript
> import { UserService } from '@services/user.service'; // clean!
> ```
> Note: You also need `tsconfig-paths` or Webpack aliases to make runtime resolution work.

**CQ6.3 — What does `declaration: true` do and when do you need it?**
> It generates `.d.ts` type declaration files alongside your compiled `.js` files. This is needed when publishing a TypeScript package to npm — consumers of your package get full type information without needing your source `.ts` files.

**CQ6.4 — What is the difference between `include`, `exclude`, and `files` in tsconfig?**
> - `include` — glob patterns of files to compile. Default is all `.ts` files in the project.
> - `exclude` — files/folders to exclude even if matched by `include`. `node_modules` and `dist` should always be excluded.
> - `files` — explicit list of exact files to compile. Rarely used; prefer `include`.

---

## 3. Types, Interfaces & Generics

---

### Q7. What are Generics in TypeScript? Why are they important?

#### 📖 Definition
Generics are a way to write **reusable, type-safe code that works with multiple types** without sacrificing type information. Instead of using `any` (which loses type info), generics use **type parameters** — placeholders for types that are filled in when the code is used.

Think of generics as "type variables" — they capture the type used at call site and carry it through the function or class so TypeScript knows what type to expect at every step.

#### ✅ Answer

```typescript
// Without generics — forced to use any (loses type safety)
function identity(arg: any): any {
  return arg;
}
const val = identity(42); // val is any — TypeScript lost the type!

// With generics — type is preserved
function identity<T>(arg: T): T {
  return arg;
}
const val = identity(42);      // val: number ✅
const str = identity('hello'); // str: string ✅

// ── Generic Interface ─────────────────────────────────
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: Date;
}

interface User {
  id: number;
  name: string;
  email: string;
}

// Usage — T is filled in at use site
async function fetchUser(id: number): Promise<ApiResponse<User>> {
  const user = await db.findById(id);
  return { data: user, status: 200, message: 'OK', timestamp: new Date() };
}

const response = await fetchUser(1);
response.data.email; // ✅ TypeScript knows this is User.email

// ── Generic Class — Repository Pattern ───────────────
class Repository<T extends { id: number }> {
  private store: Map<number, T> = new Map();

  save(entity: T): T {
    this.store.set(entity.id, entity);
    return entity;
  }

  findById(id: number): T | undefined {
    return this.store.get(id);
  }

  findAll(): T[] {
    return Array.from(this.store.values());
  }
}

const userRepo = new Repository<User>();
const user = userRepo.findById(1); // User | undefined ✅

// ── Generic Constraints ────────────────────────────────
// T must have a .length property
function logLength<T extends { length: number }>(arg: T): T {
  console.log(`Length: ${arg.length}`);
  return arg;
}
logLength('hello');       // ✅ string has .length
logLength([1, 2, 3]);     // ✅ array has .length
logLength(42);            // ❌ number has no .length

// ── Multiple Type Parameters ───────────────────────────
function merge<T extends object, U extends object>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}
const merged = merge({ name: 'Vikrant' }, { age: 30 });
// merged: { name: string } & { age: number }
```

---

#### 🔁 Cross Questions

**CQ7.1 — What is the `extends` keyword in generics? How is it different from class `extends`?**
> In generics, `extends` is a **constraint** — it restricts which types can be passed as the type parameter. It does not mean inheritance.
> ```typescript
> function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
>   return obj[key]; // K must be a key of T — safe access
> }
> getProperty({ name: 'Vikrant', age: 30 }, 'name'); // ✅ returns string
> getProperty({ name: 'Vikrant' }, 'salary');          // ❌ 'salary' is not a key of T
> ```

**CQ7.2 — What is a generic default? When is it useful?**
> Generic defaults let you provide a fallback type when none is specified:
> ```typescript
> interface Pagination<T = Record<string, unknown>> {
>   data: T[];
>   page: number;
>   total: number;
> }
> // Without providing T, defaults to Record<string, unknown>
> const p: Pagination = { data: [], page: 1, total: 0 };
> ```

**CQ7.3 — Can you use generics in arrow functions in `.tsx` files?**
> Yes, but there's a syntax ambiguity — the `<T>` looks like a JSX tag. The fix:
> ```typescript
> // Add a trailing comma to disambiguate from JSX
> const identity = <T,>(arg: T): T => arg;
> ```

**CQ7.4 — What is `keyof` and how does it combine with generics?**
> `keyof T` produces a union of all keys of type `T`. Combined with generics, it enables type-safe property access:
> ```typescript
> function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
>   const result = {} as Pick<T, K>;
>   keys.forEach(k => result[k] = obj[k]);
>   return result;
> }
> const picked = pick({ id: 1, name: 'Vikrant', role: 'admin' }, ['id', 'name']);
> // picked: { id: number; name: string }
> ```

---

### Q8. What are Utility Types? Explain all common ones.

#### 📖 Definition
Utility types are **built-in generic types** provided by TypeScript that perform common type transformations. They are defined in TypeScript's standard library and available globally without any imports. They allow you to derive new types from existing ones without rewriting them.

#### ✅ Answer

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

// ── Partial<T> ─ All properties optional ──────────────
type UpdateUserDto = Partial<User>;
// { id?: number; name?: string; email?: string; ... }

async function updateUser(id: number, dto: Partial<User>): Promise<User> {
  return db.update(id, dto);
}

// ── Required<T> ─ All properties required ─────────────
type StrictUser = Required<User>; // removes all '?'

// ── Readonly<T> ─ Immutable ───────────────────────────
type ImmutableUser = Readonly<User>;
const u: ImmutableUser = { id: 1, name: 'Vikrant', email: '', password: '', role: 'user', createdAt: new Date() };
u.name = 'Bob'; // ❌ Error: Cannot assign to 'name'

// ── Pick<T, K> ─ Select specific keys ─────────────────
type PublicUser = Pick<User, 'id' | 'name' | 'email'>;
// Use for API responses — never expose password

// ── Omit<T, K> ─ Exclude specific keys ───────────────
type UserWithoutPassword = Omit<User, 'password'>;
type UserWithoutPasswordAndRole = Omit<User, 'password' | 'role'>;

// ── Record<K, V> ─ Key-value map ──────────────────────
type RolePermissions = Record<'user' | 'admin', string[]>;
const permissions: RolePermissions = {
  user:  ['read'],
  admin: ['read', 'write', 'delete'],
};

type UserCache = Record<number, User>; // userId -> User

// ── Exclude<T, U> ─ Remove from union ─────────────────
type Role = 'user' | 'admin' | 'superadmin';
type NonAdminRole = Exclude<Role, 'admin' | 'superadmin'>; // 'user'

// ── Extract<T, U> ─ Keep from union ───────────────────
type AdminRoles = Extract<Role, 'admin' | 'superadmin'>; // 'admin' | 'superadmin'

// ── NonNullable<T> ─ Remove null/undefined ─────────────
type MaybeUser = User | null | undefined;
type DefiniteUser = NonNullable<MaybeUser>; // User

// ── ReturnType<T> ─ Infer function return type ─────────
async function getUser(): Promise<User> {
  return {} as User;
}
type GetUserReturn = Awaited<ReturnType<typeof getUser>>; // User

// ── Parameters<T> ─ Infer parameter types ─────────────
function createUser(name: string, email: string, role: Role): User {
  return {} as User;
}
type CreateUserParams = Parameters<typeof createUser>;
// [name: string, email: string, role: Role]

// ── InstanceType<T> ─ Get class instance type ─────────
class UserService {
  findAll(): User[] { return []; }
}
type ServiceInstance = InstanceType<typeof UserService>;
// Same as writing UserService as a type

// ── Awaited<T> ─ Unwrap Promise (TS 4.5+) ─────────────
type PromiseUser = Promise<User>;
type ResolvedUser = Awaited<PromiseUser>; // User
```

---

#### 🔁 Cross Questions

**CQ8.1 — What is the difference between `Omit` and `Exclude`?**
> - `Omit<T, K>` works on **object types** — it removes keys from an object type
> - `Exclude<T, U>` works on **union types** — it removes members from a union
> ```typescript
> type A = Omit<{ a: 1; b: 2; c: 3 }, 'a'>;       // { b: 2; c: 3 }
> type B = Exclude<'a' | 'b' | 'c', 'a'>;           // 'b' | 'c'
> ```

**CQ8.2 — How do you make a type deeply readonly (not just top-level)?**
> The built-in `Readonly<T>` only makes top-level properties readonly. For deep immutability, you write a recursive utility type:
> ```typescript
> type DeepReadonly<T> = {
>   readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
> };
> ```

**CQ8.3 — What is `ReturnType` useful for in practice?**
> It's useful when you want to type something based on what a function returns, without repeating yourself:
> ```typescript
> function buildConfig() {
>   return { db: { host: 'localhost' }, port: 3000 };
> }
> type Config = ReturnType<typeof buildConfig>;
> // Config is inferred — you don't need to write a separate interface
> ```

**CQ8.4 — Can you combine utility types?**
> Yes, and it's common:
> ```typescript
> // Read-only partial — for PATCH request DTOs
> type PatchDto<T> = Readonly<Partial<T>>;
> 
> // Pick then make optional — for optional overrides
> type ThemeOverride = Partial<Pick<Theme, 'color' | 'fontSize'>>;
> ```

---

### Q9. What are Mapped Types and Conditional Types?

#### 📖 Definitions

- **Mapped Types** — Transform every property of an existing type by iterating over its keys with `[K in keyof T]`. All utility types like `Partial`, `Readonly`, `Record` are implemented using mapped types.

- **Conditional Types** — Choose between two types based on a condition using the syntax `T extends U ? X : Y`. This works at the type level, similar to a ternary at the value level. They enable advanced type logic and are the foundation of many utility types.

#### ✅ Answer

```typescript
// ── Mapped Types ──────────────────────────────────────

// Make all properties optional (like Partial)
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

// Make all properties nullable
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

// Make all properties writable (remove readonly)
type Mutable<T> = {
  -readonly [K in keyof T]: T[K]; // '-' removes the modifier
};

// Make all properties required (remove ?)
type MyRequired<T> = {
  [K in keyof T]-?: T[K]; // '-?' removes optional modifier
};

// Map to a different value type
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface User { name: string; age: number; }
type UserGetters = Getters<User>;
// { getName: () => string; getAge: () => number }

// ── Conditional Types ─────────────────────────────────

// Basic conditional type
type IsString<T> = T extends string ? 'yes' : 'no';
type A = IsString<string>; // 'yes'
type B = IsString<number>; // 'no'

// Distributed conditional types (distributive over unions)
type ToArray<T> = T extends any ? T[] : never;
type C = ToArray<string | number>; // string[] | number[]

// Unwrap Promise
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

// Extract return type
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// Flatten array type
type Flatten<T> = T extends (infer U)[] ? U : T;
type D = Flatten<string[]>; // string
type E = Flatten<number>;   // number (not an array, returns itself)

// Filter object keys by value type
type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

interface Form {
  name: string;
  age: number;
  email: string;
  isActive: boolean;
}
type StringKeys = KeysOfType<Form, string>; // 'name' | 'email'
```

---

#### 🔁 Cross Questions

**CQ9.1 — What is the `infer` keyword? Where can it be used?**
> `infer` is used **inside a conditional type** to capture (infer) a type from a pattern without having to specify it explicitly. It can only appear in the `extends` clause of a conditional type.
> ```typescript
> // Infer the element type of an array
> type ElementOf<T> = T extends Array<infer E> ? E : never;
> type N = ElementOf<number[]>; // number
>
> // Infer the first function argument
> type FirstArg<F> = F extends (first: infer A, ...rest: any[]) => any ? A : never;
> type FA = FirstArg<(x: string, y: number) => void>; // string
> ```

**CQ9.2 — What is remapping in mapped types (`as` keyword)?**
> TypeScript 4.1+ allows you to remap the key name in a mapped type using `as`:
> ```typescript
> type EventHandlers<T> = {
>   [K in keyof T as `on${Capitalize<string & K>}`]: (value: T[K]) => void;
> };
> interface State { count: number; name: string; }
> type Handlers = EventHandlers<State>;
> // { onCount: (value: number) => void; onName: (value: string) => void; }
> ```

**CQ9.3 — What does "distributive" mean for conditional types?**
> When a conditional type is applied to a union, it's applied to each member individually and the results are unioned. This is called distribution:
> ```typescript
> type Wrap<T> = T extends any ? { val: T } : never;
> type W = Wrap<string | number>; // { val: string } | { val: number }
> // NOT: { val: string | number }
> ```
> To prevent distribution, wrap in a tuple: `[T] extends [U]`

**CQ9.4 — How do you filter out `never` from a union type?**
> `never` is automatically removed from union types:
> ```typescript
> type WithNever = string | never | number; // string | number
> ```
> This is what makes conditional types that return `never` for unwanted cases work as filters.

---

## 4. Modules & Namespaces

---

### Q10. What is the difference between CommonJS and ES Modules in TypeScript?

#### 📖 Definition
**CommonJS (CJS)** is the original Node.js module system, using synchronous `require()` and `module.exports`. It was designed when Node.js was created, before the JavaScript standard had a module system.

**ES Modules (ESM)** is the official JavaScript standard module system, using `import`/`export`. It is asynchronous, statically analyzable (enabling tree-shaking), and now natively supported in modern Node.js (v12+).

TypeScript can compile to either system — controlled by the `"module"` option in `tsconfig.json`.

#### ✅ Answer

```typescript
// ── CommonJS (module: "commonjs") ─────────────────────
const express = require('express');
const { Router } = require('express');

module.exports = { MyClass };
module.exports.helper = function() {};

// ── ES Modules (module: "ESNext" or "ES2020") ─────────
import express from 'express';
import { Router } from 'express';
import type { Request, Response } from 'express'; // type-only import

export class MyClass {}
export default function helper() {}
export { helper as util }; // named re-export

// ── TypeScript with esModuleInterop ───────────────────
// tsconfig: "esModuleInterop": true, "module": "commonjs"

// Without esModuleInterop:
import * as express from 'express'; // required for CJS default

// With esModuleInterop:
import express from 'express'; // clean — works like ESM
```

| Feature | CommonJS | ES Modules |
|---|---|---|
| Syntax | `require` / `module.exports` | `import` / `export` |
| Loading | Synchronous (blocks) | Asynchronous |
| Static analysis | ❌ (dynamic `require`) | ✅ (static imports) |
| Tree-shaking | ❌ | ✅ |
| Top-level `await` | ❌ | ✅ |
| Node.js default | ✅ | Needs `"type": "module"` or `.mjs` |
| TypeScript config | `"module": "commonjs"` | `"module": "ESNext"` |

---

#### 🔁 Cross Questions

**CQ10.1 — How do you use ES Modules in Node.js TypeScript projects?**
> Set `"module": "NodeNext"` or `"module": "ESNext"` in tsconfig, and add `"type": "module"` in `package.json`. You also need to use `.js` extensions in imports (even for `.ts` files — TypeScript resolves them):
> ```typescript
> import { UserService } from './services/user.service.js'; // .js even for .ts files
> ```

**CQ10.2 — What is `import type` and when should you use it?**
> `import type` imports only the type — it is completely erased at compile time and leaves no runtime artifact. Use it when you only need the type for annotation, not the runtime value:
> ```typescript
> import type { Request, Response } from 'express'; // erased — no require('express') in output
> import { Router } from 'express';                  // kept — runtime value needed
> ```
> This improves performance (fewer imports at startup) and avoids circular dependency issues.

**CQ10.3 — What is module augmentation? Give a real-world Node.js example.**
> Module augmentation lets you add properties to types from external libraries using `declare module`:
> ```typescript
> // src/types/express.d.ts
> import { User } from '../models/User';
> declare global {
>   namespace Express {
>     interface Request {
>       user?: User;
>       requestId?: string;
>     }
>   }
> }
> ```
> Now `req.user` is typed throughout your application — TypeScript knows it's a `User`.

**CQ10.4 — What are ambient declarations (`.d.ts` files)?**
> `.d.ts` files contain only type information — no runtime code. They describe the shape of JavaScript values for TypeScript's type checker. Uses:
> - `@types/*` packages use `.d.ts` to type existing JS libraries
> - You generate `.d.ts` when publishing a TypeScript library
> - You write them to declare types for modules with no types at all (`declare module 'some-untyped-lib'`)

---

## 5. Decorators & Metadata

---

### Q11. What are Decorators in TypeScript? How are they used?

#### 📖 Definition
Decorators are a **special kind of function** that can be attached to class declarations, methods, accessors, properties, or parameters using the `@` symbol. They execute at **class definition time** (not at instantiation), and can observe, modify, or replace the target they are applied to.

Decorators are a stage-3 TC39 proposal. TypeScript supports them via `"experimentalDecorators": true` (legacy) or natively in TypeScript 5.0+ (TC39 stage-3 decorators). Frameworks like **NestJS** and **TypeORM** are built entirely around decorators.

#### ✅ Answer

```json
// tsconfig.json — enable decorators
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

```typescript
import 'reflect-metadata'; // needed for emitDecoratorMetadata

// ── Class Decorator ───────────────────────────────────
function Singleton<T extends new (...args: any[]) => {}>(Base: T) {
  let instance: InstanceType<T>;
  return class extends Base {
    constructor(...args: any[]) {
      if (instance) return instance;
      super(...args);
      instance = this as any;
    }
  };
}

@Singleton
class DatabaseConnection {
  private static count = 0;
  id = ++DatabaseConnection.count;
}

const db1 = new DatabaseConnection(); // id: 1
const db2 = new DatabaseConnection(); // id: 1 (same instance!)

// ── Method Decorator ──────────────────────────────────
function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = async function (...args: any[]) {
    console.log(`→ ${propertyKey}(${JSON.stringify(args)})`);
    const start = Date.now();
    const result = await originalMethod.apply(this, args);
    console.log(`← ${propertyKey} returned in ${Date.now() - start}ms`);
    return result;
  };
  return descriptor;
}

function Retry(times: number) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      for (let i = 0; i < times; i++) {
        try { return await original.apply(this, args); }
        catch (err) {
          if (i === times - 1) throw err;
          console.log(`Retry ${i + 1}/${times}`);
        }
      }
    };
  };
}

class UserService {
  @Log
  @Retry(3)
  async findUser(id: number) {
    return db.query('SELECT * FROM users WHERE id = $1', [id]);
  }
}

// ── Property Decorator ────────────────────────────────
function Validate(regex: RegExp) {
  return function (target: any, propertyKey: string) {
    let value: string;
    Object.defineProperty(target, propertyKey, {
      get: () => value,
      set: (v: string) => {
        if (!regex.test(v)) throw new Error(`${propertyKey} is invalid`);
        value = v;
      }
    });
  };
}

class Config {
  @Validate(/^\d+$/)
  port: string = '3000';
}

// ── Parameter Decorator ───────────────────────────────
function Param(target: any, methodName: string, paramIndex: number) {
  const existing = Reflect.getMetadata('params', target, methodName) || [];
  existing.push(paramIndex);
  Reflect.defineMetadata('params', existing, target, methodName);
}
```

---

#### 🔁 Cross Questions

**CQ11.1 — In what order do multiple decorators on a method execute?**
> Decorator factories are evaluated top-to-bottom, but the actual decorators execute **bottom-to-top** (like function composition):
> ```typescript
> @A  // evaluated 1st, applied 2nd
> @B  // evaluated 2nd, applied 1st
> method() {}
> ```
> This mirrors how function composition works: `A(B(method))`.

**CQ11.2 — What is `reflect-metadata` and why is it needed with decorators?**
> `reflect-metadata` is a polyfill for the `Reflect` metadata API. When `emitDecoratorMetadata: true` is set, TypeScript emits type information (like parameter types) as metadata on classes. Dependency injection frameworks like NestJS use this to automatically inject constructor dependencies — they read `Reflect.getMetadata('design:paramtypes', Target)` to know what types to inject.

**CQ11.3 — How does NestJS use decorators internally?**
> NestJS uses decorators to build its IoC container:
> - `@Controller('/users')` — stores route prefix metadata
> - `@Get('/:id')` — stores HTTP method + path metadata
> - `@Injectable()` — marks class as injectable, stores it in the DI container
> - `@InjectRepository(User)` — uses `Reflect` to inject the TypeORM repository
> At startup, NestJS reads all this metadata and wires the entire application graph automatically.

**CQ11.4 — What is the difference between TypeScript 4.x experimental decorators and TypeScript 5.0+ decorators?**
> TypeScript 5.0 implemented the TC39 stage-3 decorator proposal. Key differences:
> - New decorators don't need `experimentalDecorators: true`
> - New decorators have different function signatures (Context object instead of `(target, key, descriptor)`)
> - New decorators don't use `reflect-metadata` directly
> - NestJS and TypeORM still use the legacy `experimentalDecorators` style as of 2024

---

## 6. Node.js Core with TypeScript

---

### Q12. How do you type the EventEmitter in TypeScript?

#### 📖 Definition
Node.js's built-in `EventEmitter` is loosely typed — its `on`, `emit`, and `off` methods accept `string | symbol` for event names and `any[]` for arguments. In a TypeScript project, this means you lose all type safety when working with events.

Typed EventEmitter patterns restrict which events can be emitted/listened to and enforce the correct argument types for each event.

#### ✅ Answer

```typescript
import EventEmitter from 'events';

// ── Approach 1: Typed subclass ────────────────────────
interface AppEventMap {
  'user:created':  [userId: number, email: string];
  'user:deleted':  [userId: number];
  'error':         [error: Error];
  'ready':         [];
}

class TypedEmitter<Events extends Record<string, any[]>> extends EventEmitter {
  typedOn<K extends keyof Events & string>(
    event: K,
    listener: (...args: Events[K]) => void
  ): this {
    return super.on(event, listener as any);
  }

  typedEmit<K extends keyof Events & string>(
    event: K,
    ...args: Events[K]
  ): boolean {
    return super.emit(event, ...args);
  }

  typedOff<K extends keyof Events & string>(
    event: K,
    listener: (...args: Events[K]) => void
  ): this {
    return super.off(event, listener as any);
  }
}

class AppEventBus extends TypedEmitter<AppEventMap> {}

const bus = new AppEventBus();

bus.typedOn('user:created', (userId, email) => {
  // userId: number, email: string — fully typed!
  console.log(`New user ${userId}: ${email}`);
});

bus.typedEmit('user:created', 1, 'vikrant@example.com'); // ✅
bus.typedEmit('user:created', 'bad', 123);                // ❌ TS Error

// ── Approach 2: Use the 'eventemitter3' package ───────
// npm install eventemitter3 @types/eventemitter3
import EventEmitter3 from 'eventemitter3';

type MyEvents = {
  message: (text: string) => void;
  connect: () => void;
};

const emitter = new EventEmitter3<MyEvents>();
emitter.on('message', (text) => console.log(text)); // text: string ✅
```

---

#### 🔁 Cross Questions

**CQ12.1 — When would you use EventEmitter in a Node.js TypeScript application?**
> EventEmitter is useful for:
> - Decoupling modules — `UserService` emits `user:created`, `EmailService` listens without UserService knowing about EmailService
> - Real-time features with WebSocket — forwarding events from DB to clients
> - Internal pub/sub within a process — message bus pattern
> - Streaming — Node.js streams (`Readable`, `Writable`) are all EventEmitters

**CQ12.2 — What is a memory leak risk with EventEmitter?**
> Node.js warns if more than 10 listeners are registered on a single event (default `maxListeners`). This catches listener leaks — when you add a listener inside a loop or repeatedly without removing it. Fix:
> ```typescript
> emitter.setMaxListeners(20); // raise limit if legitimately needed
> emitter.once('event', handler); // auto-removes after first call
> emitter.removeListener('event', handler); // manual cleanup
> ```

**CQ12.3 — What is the difference between `on` and `once`?**
> - `on(event, listener)` — registers a **persistent** listener that fires every time the event is emitted
> - `once(event, listener)` — registers a listener that fires **only on the first emission** and then auto-removes itself

---

### Q13. How do you handle environment variables with TypeScript?

#### 📖 Definition
`process.env` in Node.js is typed as `NodeJS.ProcessEnv` which is `Record<string, string | undefined>`. Every environment variable is `string | undefined` because TypeScript can't know at compile time whether a variable is set at runtime. This requires runtime validation and type narrowing before use.

#### ✅ Answer

```typescript
// src/config/env.ts — Validated, typed config

// Method 1: Manual validation
const requireEnv = (key: string): string => {
  const val = process.env[key];
  if (val === undefined || val === '') {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  return val;
};

export const config = {
  NODE_ENV:   (process.env.NODE_ENV ?? 'development') as 'development' | 'production' | 'test',
  PORT:       parseInt(requireEnv('PORT'), 10),
  DB_URL:     requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRY: process.env.JWT_EXPIRY ?? '7d',
  REDIS_URL:  process.env.REDIS_URL,  // optional — string | undefined
} as const;

// Method 2: Zod schema validation (recommended)
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV:     z.enum(['development', 'production', 'test']).default('development'),
  PORT:         z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET:   z.string().min(32),
  REDIS_URL:    z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
// env.PORT is number (not string | undefined)
// env.NODE_ENV is 'development' | 'production' | 'test'

// Usage in your app
import { env } from './config/env';
app.listen(env.PORT); // ✅ TypeScript knows this is a number
```

---

#### 🔁 Cross Questions

**CQ13.1 — Why is `process.env.PORT` a `string` and not a `number`?**
> All environment variables are strings — this is a fundamental Unix/POSIX rule. When you set `PORT=3000` in your shell or `.env` file, the OS passes it as the string `"3000"`. You must parse it: `parseInt(process.env.PORT, 10)`.

**CQ13.2 — How do you load `.env` files in TypeScript Node.js projects?**
> Use `dotenv`:
> ```typescript
> import dotenv from 'dotenv';
> dotenv.config(); // loads .env into process.env
> // Must be called BEFORE importing anything that reads process.env
> ```
> In modern Node.js (v20.6+), you can use `node --env-file=.env` without dotenv.

**CQ13.3 — Should you commit `.env` files to version control?**
> No. `.env` contains secrets (DB passwords, API keys). It belongs in `.gitignore`. Commit a `.env.example` file showing which variables are needed (without values) so teammates know what to set.

---

## 7. Express + TypeScript

---

### Q14. How do you type Express routes, request, and response?

#### 📖 Definition
Express's `Request` and `Response` objects are generic — `Request<Params, ResBody, ReqBody, Query>`. TypeScript allows you to pass type arguments to these generics to get fully typed route handlers. Without typing, `req.body`, `req.params`, and `req.query` are all `any`.

#### ✅ Answer

```typescript
import express, { Request, Response, NextFunction } from 'express';

// ── Define types for each route ───────────────────────
interface CreateUserBody {
  name: string;
  email: string;
  password: string;
}

interface UserParams {
  id: string; // always string from URL
}

interface UserQuery {
  page?: string;
  limit?: string;
  search?: string;
}

interface UserResponse {
  id: number;
  name: string;
  email: string;
}

// ── Typed route handlers ───────────────────────────────
// Request<Params, ResponseBody, RequestBody, QueryString>
const createUser = async (
  req: Request<{}, UserResponse, CreateUserBody>,
  res: Response<UserResponse>,
  next: NextFunction
): Promise<void> => {
  const { name, email, password } = req.body; // typed! ✅
  try {
    const user = await UserService.create({ name, email, password });
    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    next(err); // pass to error handler
  }
};

const getUsers = async (
  req: Request<{}, UserResponse[], {}, UserQuery>,
  res: Response<UserResponse[]>
): Promise<void> => {
  const page = parseInt(req.query.page ?? '1', 10);
  const limit = parseInt(req.query.limit ?? '10', 10);
  const users = await UserService.findAll({ page, limit, search: req.query.search });
  res.json(users);
};

// ── Router ─────────────────────────────────────────────
const router = express.Router();
router.post('/', createUser);
router.get('/', getUsers);

// ── Async handler wrapper (avoid try/catch repetition) ─
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

const asyncHandler = (fn: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await UserService.findById(parseInt(req.params.id));
    if (!user) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(user);
  })
);
```

---

#### 🔁 Cross Questions

**CQ14.1 — How do you add custom properties to `req` (like `req.user`) in TypeScript?**
> Use module augmentation to extend Express's `Request` interface:
> ```typescript
> // src/types/express.d.ts
> import { User } from '../models/User';
> declare global {
>   namespace Express {
>     interface Request {
>       user?: User;
>       requestId?: string;
>     }
>   }
> }
> ```
> After this, `req.user` is typed as `User | undefined` everywhere.

**CQ14.2 — Why do Express route handlers return `void` and not `Promise<Response>`?**
> Express doesn't use the return value of handlers — it tracks whether a response was sent via `res.headersSent`. Returning `Promise<void>` (not `Promise<Response>`) prevents accidentally using the return value and correctly expresses that the function's side effect (calling `res.json()`, `res.send()`) is what matters.

**CQ14.3 — How do you type Express middleware?**
> Regular middleware has signature `(req, res, next) => void`. Error-handling middleware takes 4 parameters:
> ```typescript
> import { ErrorRequestHandler } from 'express';
> const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
>   res.status(500).json({ error: err.message });
> };
> // Express identifies error handlers by the 4-parameter signature
> ```

**CQ14.4 — How do you validate request bodies in a TypeScript-safe way?**
> Use Zod (best TypeScript integration) or Joi:
> ```typescript
> import { z } from 'zod';
> const CreateUserSchema = z.object({
>   name:  z.string().min(2),
>   email: z.string().email(),
>   password: z.string().min(8),
> });
> type CreateUserDto = z.infer<typeof CreateUserSchema>; // infers type from schema
>
> const validate = (schema: z.ZodSchema) =>
>   (req: Request, res: Response, next: NextFunction) => {
>     const result = schema.safeParse(req.body);
>     if (!result.success) {
>       res.status(422).json({ errors: result.error.format() });
>       return;
>     }
>     req.body = result.data; // sanitized and typed
>     next();
>   };
> ```

---

## 8. Database Integration

---

### Q15. How does TypeORM integrate with TypeScript?

#### 📖 Definition
TypeORM is an **Object-Relational Mapper (ORM)** designed specifically for TypeScript. It uses TypeScript decorators to define database entities (tables) as classes. TypeScript decorators describe columns, relationships, indexes, and constraints — bridging the gap between the database schema and your TypeScript types.

#### ✅ Answer

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, ManyToOne, Index, BeforeInsert
} from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false }) // not returned in queries by default
  password!: string;

  @Column({ type: 'enum', enum: ['user', 'admin'], default: 'user' })
  role!: 'user' | 'admin';

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Post, post => post.author, { cascade: true })
  posts!: Post[];

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 12);
  }
}

// ── Typed Repository ───────────────────────────────────
import { Repository, DataSource } from 'typeorm';

class UserRepository {
  private repo: Repository<User>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email },
      select: { id: true, email: true, password: true, role: true }
    });
  }

  async findAllActive(page: number, limit: number): Promise<[User[], number]> {
    return this.repo.findAndCount({
      where: { isActive: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async createUser(dto: Partial<User>): Promise<User> {
    const user = this.repo.create(dto);
    return this.repo.save(user);
  }
}
```

---

#### 🔁 Cross Questions

**CQ15.1 — What is the difference between `save()` and `insert()` in TypeORM?**
> - `save()` — checks if the entity exists (by primary key). If it does, it updates; if not, it inserts. Also triggers lifecycle hooks (`@BeforeInsert`, `@BeforeUpdate`). Slightly slower due to the existence check.
> - `insert()` — always inserts, no check. Faster for bulk inserts. Does NOT trigger lifecycle hooks.
> Use `save()` for single entity upserts; use `insert()` for bulk data loading.

**CQ15.2 — What is the `!` (definite assignment assertion) on TypeORM entity properties?**
> TypeORM entity properties like `id!: number` use `!` to tell TypeScript "I know this will be assigned, trust me." Without `!`, TypeScript's `strictPropertyInitialization` would error because `id` is not assigned in the constructor. TypeORM sets these values when it hydrates entities from the database.

**CQ15.3 — What is the N+1 query problem? How does TypeORM solve it?**
> N+1 occurs when you fetch N records and then execute 1 query for each to get related data (N+1 total queries). TypeORM solves it with `relations` option or `QueryBuilder` with `leftJoinAndSelect`:
> ```typescript
> // N+1 problem — avoid this
> const users = await userRepo.find(); // 1 query
> for (const user of users) {
>   user.posts = await postRepo.findBy({ authorId: user.id }); // N queries!
> }
>
> // ✅ Solution — load relations in one query
> const users = await userRepo.find({ relations: { posts: true } });
> ```

**CQ15.4 — When would you use Prisma over TypeORM?**
> - **Prisma** — Better type safety (auto-generated types from schema), simpler API, great for greenfield projects, better DX, excellent migration tooling
> - **TypeORM** — Better for decorator-heavy frameworks (NestJS has strong TypeORM integration), familiar ORM patterns, supports more database features
> For new TypeScript-first projects, Prisma is generally recommended for its superior type inference.

---

## 9. Error Handling & Custom Errors

---

### Q16. How do you create and use custom typed errors in TypeScript?

#### 📖 Definition
Custom error classes in TypeScript extend the built-in `Error` class to create a typed error hierarchy. This allows you to distinguish different error types in error handlers using `instanceof` checks, carry structured data with errors (like HTTP status codes, validation messages), and write type-safe error handling middleware.

#### ✅ Answer

```typescript
// ── Base error class ───────────────────────────────────
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(message: string, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.isOperational = isOperational;
    // Fix prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── Specific error types ───────────────────────────────
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  constructor(public readonly resource: string, id?: string | number) {
    super(id ? `${resource} with id '${id}' not found` : `${resource} not found`);
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 422;
  constructor(public readonly errors: Record<string, string[]>) {
    super('Validation failed');
  }
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  constructor(message = 'Authentication required') { super(message); }
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  constructor(message = 'Insufficient permissions') { super(message); }
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  constructor(resource: string, field: string) {
    super(`${resource} with this ${field} already exists`);
  }
}

export class ExternalServiceError extends AppError {
  readonly statusCode = 502;
  constructor(
    public readonly service: string,
    message: string,
    isOperational = true
  ) {
    super(`${service}: ${message}`, isOperational);
  }
}

// ── Usage in services ──────────────────────────────────
class UserService {
  async findById(id: number): Promise<User> {
    const user = await userRepo.findById(id);
    if (!user) throw new NotFoundError('User', id);
    return user;
  }

  async register(email: string, password: string): Promise<User> {
    const exists = await userRepo.findByEmail(email);
    if (exists) throw new ConflictError('User', 'email');
    return userRepo.create({ email, password });
  }
}

// ── Global error handler middleware ───────────────────
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Known operational errors
  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      status: 'error',
      message: err.message,
    };

    if (err instanceof ValidationError) {
      body.errors = err.errors;
    }
    if (err instanceof NotFoundError) {
      body.resource = err.resource;
    }

    res.status(err.statusCode).json(body);
    return;
  }

  // Unknown / programmer errors
  console.error('Unhandled error:', err);

  if (process.env.NODE_ENV === 'development') {
    res.status(500).json({
      status: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
    });
  } else {
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
```

---

#### 🔁 Cross Questions

**CQ16.1 — Why do you need `Object.setPrototypeOf(this, new.target.prototype)` in custom errors?**
> When you extend built-in classes like `Error` in TypeScript compiled to ES5, the prototype chain gets broken — `instanceof` checks fail. `Object.setPrototypeOf(this, new.target.prototype)` restores the correct prototype chain so `err instanceof NotFoundError` works as expected. This is only needed when compiling to ES5; for ES2015+ targets it's automatic.

**CQ16.2 — What is the difference between operational errors and programmer errors?**
> - **Operational errors** — expected runtime errors from external factors: user sends invalid input, DB record not found, network request fails. These are `isOperational: true`. You can recover from them and send a meaningful response.
> - **Programmer errors** — bugs in your code: accessing property on undefined, wrong function arguments, logic errors. These are unexpected and often unrecoverable. In production, the best strategy is to log them and restart the process (use PM2 or Kubernetes).

**CQ16.3 — Should you use `try/catch` in every service method or centralize error handling?**
> Centralize. Use a global Express error handler + `asyncHandler` wrapper. In services, throw typed errors — let them bubble up to the error handler. Only use local `try/catch` when you need to handle a specific error in a specific way (retry, fallback value).

**CQ16.4 — How do you handle async errors in Express without try/catch everywhere?**
> Wrap route handlers with `asyncHandler` — it catches promise rejections and passes them to `next(err)`:
> ```typescript
> const asyncHandler = (fn: AsyncHandler) => (req, res, next) =>
>   Promise.resolve(fn(req, res, next)).catch(next);
>
> router.get('/:id', asyncHandler(async (req, res) => {
>   const user = await userService.findById(+req.params.id); // throws NotFoundError
>   res.json(user);
> }));
> // NotFoundError is caught and passed to error handler automatically
> ```

---

## 10. Testing with TypeScript (Jest)

---

### Q17. How do you set up and write tests with Jest + TypeScript?

#### 📖 Definition
Jest is the most popular JavaScript/TypeScript testing framework. `ts-jest` is a Jest transformer that compiles TypeScript before running tests, giving you full type checking in test files. Tests should follow the **AAA pattern**: Arrange (set up data), Act (call the function), Assert (verify result).

#### ✅ Answer

```bash
npm install --save-dev jest ts-jest @types/jest
```

```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.spec.ts', '**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts'],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      diagnostics: true,
    },
  },
};

export default config;
```

```typescript
// src/services/__tests__/user.service.test.ts
import { UserService } from '../user.service';
import { UserRepository } from '../../repositories/user.repository';
import { NotFoundError, ConflictError } from '../../errors';

// Mock the repository module
jest.mock('../../repositories/user.repository');

describe('UserService', () => {
  let service: UserService;
  let mockRepo: jest.Mocked<UserRepository>;

  const mockUser = {
    id: 1,
    name: 'Vikrant',
    email: 'vikrant@example.com',
    role: 'user' as const,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<UserRepository>;
    service = new UserService(mockRepo);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(mockRepo.findById).toHaveBeenCalledWith(1);
      expect(mockRepo.findById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundError when user not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(NotFoundError);
      await expect(service.findById(99)).rejects.toThrow("User with id '99' not found");
    });
  });

  describe('register', () => {
    it('should throw ConflictError when email already exists', async () => {
      mockRepo.findByEmail.mockResolvedValue(mockUser);
      await expect(service.register('vikrant@example.com', 'pass123'))
        .rejects.toThrow(ConflictError);
    });

    it('should create and return user when email is unique', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(mockUser);
      const result = await service.register('new@example.com', 'pass123');
      expect(result).toEqual(mockUser);
      expect(mockRepo.create).toHaveBeenCalledWith({ email: 'new@example.com', password: 'pass123' });
    });
  });
});
```

---

#### 🔁 Cross Questions

**CQ17.1 — What is the difference between `jest.fn()`, `jest.spyOn()`, and `jest.mock()`?**
> - `jest.fn()` — Creates a standalone mock function with no implementation
> - `jest.spyOn(obj, 'method')` — Wraps an existing object's method so you can spy on calls while optionally keeping the original implementation
> - `jest.mock('module')` — Replaces an entire module with auto-mocked version. All exports become `jest.fn()`. Use for replacing dependencies like repositories, HTTP clients, etc.

**CQ17.2 — What is `jest.Mocked<T>` type?**
> `jest.Mocked<T>` transforms all methods of type `T` into `jest.MockedFunction<...>`, which gives you access to `.mockResolvedValue()`, `.mockReturnValue()`, `.mockImplementation()`, etc. while keeping full type safety:
> ```typescript
> const mockRepo: jest.Mocked<UserRepository> = {
>   findById: jest.fn(),
>   save: jest.fn(),
> };
> mockRepo.findById.mockResolvedValue(user); // ✅ typed
> ```

**CQ17.3 — How do you test Express routes with TypeScript?**
> Use `supertest` for integration testing HTTP routes:
> ```typescript
> import request from 'supertest';
> import app from '../app';
>
> describe('POST /api/users', () => {
>   it('should return 201 with created user', async () => {
>     const response = await request(app)
>       .post('/api/users')
>       .send({ name: 'Vikrant', email: 'v@test.com', password: 'secret123' });
>
>     expect(response.status).toBe(201);
>     expect(response.body).toMatchObject({ name: 'Vikrant', email: 'v@test.com' });
>     expect(response.body).not.toHaveProperty('password');
>   });
> });
> ```

**CQ17.4 — What is `beforeEach` vs `beforeAll`? When to use each?**
> - `beforeEach` — runs before **every test** in the `describe` block. Use for resetting state, clearing mocks. Keep tests independent.
> - `beforeAll` — runs once before all tests in the block. Use for expensive setup: DB connection, starting a test server. Must not set mutable state that tests modify.

---

## 11. Advanced Patterns & Design Principles

---

### Q18. How do you implement Dependency Injection in TypeScript?

#### 📖 Definition
Dependency Injection (DI) is a design pattern where a class **receives its dependencies** from the outside rather than creating them internally. This:
- Inverts control (IoC — Inversion of Control)
- Makes code testable (easy to swap real dependencies for mocks)
- Makes dependencies explicit (visible in constructor)
- Decouples classes from specific implementations

In TypeScript, DI is typically done via constructor injection combined with interfaces.

#### ✅ Answer

```typescript
// ── 1. Define contracts via interfaces ────────────────
interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: Partial<User>): Promise<User>;
}

interface IEmailService {
  sendWelcome(email: string, name: string): Promise<void>;
}

interface IPasswordService {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}

// ── 2. Implement contracts ─────────────────────────────
class PostgresUserRepository implements IUserRepository {
  async findById(id: number): Promise<User | null> {
    return db.query('SELECT * FROM users WHERE id = $1', [id]).then(r => r[0] ?? null);
  }
  async findByEmail(email: string): Promise<User | null> {
    return db.query('SELECT * FROM users WHERE email = $1', [email]).then(r => r[0] ?? null);
  }
  async save(user: Partial<User>): Promise<User> {
    return db.query('INSERT INTO users (...) VALUES (...) RETURNING *', [user]);
  }
}

class BcryptPasswordService implements IPasswordService {
  async hash(plain: string): Promise<string> { return bcrypt.hash(plain, 12); }
  async compare(plain: string, hashed: string): Promise<boolean> { return bcrypt.compare(plain, hashed); }
}

// ── 3. Service depends on interfaces ──────────────────
class AuthService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly emailService: IEmailService,
  ) {}

  async register(email: string, password: string, name: string): Promise<User> {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new ConflictError('User', 'email');

    const hashed = await this.passwordService.hash(password);
    const user = await this.userRepo.save({ email, password: hashed, name });
    await this.emailService.sendWelcome(email, name);
    return user;
  }

  async login(email: string, password: string): Promise<User> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new UnauthorizedError('Invalid credentials');
    const valid = await this.passwordService.compare(password, user.password);
    if (!valid) throw new UnauthorizedError('Invalid credentials');
    return user;
  }
}

// ── 4. Composition root (wire everything together) ────
// src/index.ts
const userRepo = new PostgresUserRepository();
const passwordService = new BcryptPasswordService();
const emailService = new SendGridEmailService();
const authService = new AuthService(userRepo, passwordService, emailService);

// ── 5. Testing — inject mocks ──────────────────────────
const mockRepo: IUserRepository = {
  findById: jest.fn().mockResolvedValue(null),
  findByEmail: jest.fn().mockResolvedValue(null),
  save: jest.fn().mockResolvedValue({ id: 1 }),
};
const mockPassword: IPasswordService = {
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(true),
};
const mockEmail: IEmailService = {
  sendWelcome: jest.fn().mockResolvedValue(undefined),
};
const testAuthService = new AuthService(mockRepo, mockPassword, mockEmail);
```

---

#### 🔁 Cross Questions

**CQ18.1 — What is the difference between DI and a Service Locator?**
> - **DI** — Dependencies are **pushed in** via constructor/method injection. Dependencies are explicit and visible.
> - **Service Locator** — Code **pulls** dependencies from a central registry (`Container.get('UserService')`). Dependencies are hidden and harder to trace.
> DI is preferred — it makes dependencies explicit, making code easier to test and reason about.

**CQ18.2 — Should every class use an interface? What about simple utility classes?**
> Use interfaces where substitution matters — where you'd want to swap implementations (real DB vs in-memory, real email vs log-only). Pure utility classes (string formatters, date helpers) with no external dependencies don't need interfaces — the overhead isn't worth it.

**CQ18.3 — How does NestJS implement DI with TypeScript decorators?**
> NestJS uses `reflect-metadata` to read constructor parameter types at runtime. When you mark a class `@Injectable()`, NestJS registers it in its IoC container. When another class injects it, NestJS reads the type metadata (`Reflect.getMetadata('design:paramtypes', Target)`), looks up the registered instance, and injects it. This is constructor injection done automatically via decorators.

**CQ18.4 — What is the `tsyringe` library for TypeScript DI?**
> `tsyringe` is a lightweight DI container by Microsoft for TypeScript. It uses decorators:
> ```typescript
> import { injectable, inject, container } from 'tsyringe';
> @injectable()
> class UserService {
>   constructor(@inject('IUserRepository') private repo: IUserRepository) {}
> }
> container.registerSingleton<IUserRepository>('IUserRepository', PostgresUserRepository);
> const service = container.resolve(UserService); // auto-injected
> ```

---

### Q19. Explain SOLID principles in the context of TypeScript Node.js.

#### 📖 Definition
SOLID is a set of five design principles for writing maintainable, extensible object-oriented code. Each letter represents one principle. TypeScript's type system makes SOLID principles easier to apply and enforce.

#### ✅ Answer

```typescript
// ── S: Single Responsibility Principle ────────────────
// BAD: UserService does too many things
class BadUserService {
  async register(email: string) { /* ... */ }
  async sendEmail(to: string) { /* ... */ }   // not user's job
  async generatePDF(userId: number) { /* ... */ } // not user's job
}

// GOOD: Each class has one reason to change
class UserService {
  async register(email: string): Promise<User> { /* ... */ return {} as User; }
}
class EmailService {
  async send(to: string, subject: string): Promise<void> { /* ... */ }
}

// ── O: Open/Closed Principle ──────────────────────────
// Open for extension, closed for modification
interface PaymentProcessor {
  process(amount: number): Promise<string>;
}

class StripeProcessor implements PaymentProcessor {
  async process(amount: number): Promise<string> { return 'stripe_txn_123'; }
}
class PayPalProcessor implements PaymentProcessor {
  async process(amount: number): Promise<string> { return 'paypal_txn_456'; }
}

// PaymentService doesn't change when new processors are added
class PaymentService {
  constructor(private processor: PaymentProcessor) {}
  async pay(amount: number): Promise<string> {
    return this.processor.process(amount);
  }
}

// ── L: Liskov Substitution Principle ──────────────────
// Subtypes must be usable wherever parent types are expected
abstract class Animal {
  abstract makeSound(): string;
  describe(): string { return `I make this sound: ${this.makeSound()}`; }
}

class Dog extends Animal {
  makeSound() { return 'Woof'; }
}

class Cat extends Animal {
  makeSound() { return 'Meow'; }
}

function describeAnimals(animals: Animal[]): void {
  animals.forEach(a => console.log(a.describe())); // works for Dog or Cat
}

// ── I: Interface Segregation Principle ────────────────
// Don't force clients to depend on methods they don't use

// BAD: One fat interface
interface IFatRepository {
  find(): Promise<User[]>;
  findById(id: number): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: number): Promise<void>;
  bulkImport(users: User[]): Promise<void>; // not all clients need this
  exportToCSV(): Promise<string>;           // not all clients need this
}

// GOOD: Split by client needs
interface IUserReader {
  find(): Promise<User[]>;
  findById(id: number): Promise<User | null>;
}
interface IUserWriter {
  save(user: User): Promise<User>;
  delete(id: number): Promise<void>;
}
interface IUserBulkOps {
  bulkImport(users: User[]): Promise<void>;
  exportToCSV(): Promise<string>;
}

// ── D: Dependency Inversion Principle ────────────────
// High-level modules should not depend on low-level modules.
// Both should depend on abstractions.

// BAD: High-level service depends on concrete implementation
class BadOrderService {
  private repo = new MySQLOrderRepository(); // concrete — tightly coupled!
  async getOrder(id: number) { return this.repo.findById(id); }
}

// GOOD: Depend on abstraction
interface IOrderRepository {
  findById(id: number): Promise<Order | null>;
}

class OrderService {
  constructor(private repo: IOrderRepository) {} // abstraction — loosely coupled ✅
  async getOrder(id: number): Promise<Order> {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundError('Order', id);
    return order;
  }
}
```

---

#### 🔁 Cross Questions

**CQ19.1 — Which SOLID principle does DI directly implement?**
> DI primarily implements the **Dependency Inversion Principle (D)** — high-level modules depend on abstractions (interfaces), not concrete implementations. It also supports **Open/Closed** by making it easy to swap implementations without modifying the high-level code.

**CQ19.2 — Can you over-apply SOLID? When is it premature?**
> Yes. Creating an interface for every class, or splitting every responsibility into tiny classes, leads to over-engineering. SOLID is most valuable when:
> - Multiple implementations exist or are anticipated
> - Code is shared across teams
> - Unit testing is a priority
> For small internal utilities or scripts, SOLID adds complexity without benefit.

**CQ19.3 — How does TypeScript's structural typing affect LSP?**
> TypeScript uses structural typing — classes don't need to explicitly declare `implements` to satisfy an interface. This makes LSP easier to achieve: any object with the right shape can substitute for a type, even without explicit inheritance.

---

## 12. Performance, Scalability & Production

---

### Q20. How do you implement Worker Threads in TypeScript?

#### 📖 Definition
Node.js is single-threaded — CPU-intensive operations block the event loop, making the server unresponsive to other requests. **Worker Threads** (Node.js 10.5+) allow you to run JavaScript in parallel on separate OS threads, sharing memory via `SharedArrayBuffer` or communicating via message passing. Unlike `child_process`, worker threads share the same process memory.

#### ✅ Answer

```typescript
// src/workers/fibonacci.worker.ts
import { workerData, parentPort, isMainThread } from 'worker_threads';

if (!isMainThread) {
  function fibonacci(n: number): number {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }

  const { n } = workerData as { n: number };
  const result = fibonacci(n);
  parentPort?.postMessage({ result });
}

// ── Worker pool for TypeScript ─────────────────────────
import { Worker } from 'worker_threads';
import path from 'path';

interface WorkerTask<T, R> {
  data: T;
  resolve: (value: R) => void;
  reject: (reason: Error) => void;
}

class WorkerPool<T, R> {
  private workers: Worker[] = [];
  private queue: WorkerTask<T, R>[] = [];
  private idleWorkers: Worker[] = [];

  constructor(
    private readonly workerFile: string,
    private readonly poolSize: number
  ) {
    this.initialize();
  }

  private initialize(): void {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerFile);
      this.idleWorkers.push(worker);
    }
  }

  run(data: T): Promise<R> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask<T, R> = { data, resolve, reject };
      const worker = this.idleWorkers.pop();
      if (worker) {
        this.executeTask(worker, task);
      } else {
        this.queue.push(task);
      }
    });
  }

  private executeTask(worker: Worker, task: WorkerTask<T, R>): void {
    worker.once('message', (result: R) => {
      task.resolve(result);
      const next = this.queue.shift();
      if (next) {
        this.executeTask(worker, next);
      } else {
        this.idleWorkers.push(worker);
      }
    });
    worker.once('error', task.reject);
    worker.postMessage(task.data);
  }

  async shutdown(): Promise<void> {
    await Promise.all(this.workers.map(w => w.terminate()));
  }
}

// Usage
const pool = new WorkerPool<{ n: number }, { result: number }>(
  path.resolve(__dirname, 'workers/fibonacci.worker.js'),
  4 // 4 threads
);

const results = await Promise.all([
  pool.run({ n: 40 }),
  pool.run({ n: 41 }),
  pool.run({ n: 42 }),
]);
```

---

#### 🔁 Cross Questions

**CQ20.1 — When should you use Worker Threads vs Child Processes?**
> - **Worker Threads** — CPU-intensive tasks (image processing, encryption, large JSON parse) that need to share memory or communicate frequently. Lower overhead than processes.
> - **Child Processes** (`child_process.fork()`) — Running a completely separate Node.js script, or using external programs. Complete isolation — a crash in a child process doesn't affect the parent.
> - **Cluster** — Multiple Node.js processes sharing the same port for horizontal scaling on multi-core machines.

**CQ20.2 — What is `SharedArrayBuffer` in Worker Threads?**
> `SharedArrayBuffer` is memory that is truly shared between the main thread and worker threads — no copying, no serialization. Multiple threads can read/write the same memory. This requires `Atomics` for safe concurrent access:
> ```typescript
> const shared = new SharedArrayBuffer(4);
> const view = new Int32Array(shared);
> Atomics.add(view, 0, 1); // thread-safe increment
> ```

**CQ20.3 — How does TypeScript compilation affect Worker Threads?**
> Workers reference compiled `.js` files, not `.ts` files. So when running with `ts-node`, the worker path must point to the transpiled output or use `ts-node/esm` format. A common approach is to detect if you're running under ts-node and adjust the path:
> ```typescript
> const workerFile = __filename.endsWith('.ts')
>   ? path.resolve(__dirname, 'worker.ts')   // ts-node
>   : path.resolve(__dirname, 'worker.js');  // compiled
> ```

---

### Q21. How do you implement graceful shutdown in a TypeScript Node.js app?

#### 📖 Definition
Graceful shutdown means **cleanly stopping** a Node.js application when it receives a termination signal (SIGTERM, SIGINT). Instead of abruptly killing the process, the app:
1. Stops accepting new connections
2. Waits for in-flight requests to complete
3. Closes database connections and other resources
4. Exits cleanly

This is critical in containerized environments (Docker, Kubernetes) where pods are frequently restarted.

#### ✅ Answer

```typescript
// src/graceful-shutdown.ts
import http from 'http';

interface ShutdownDependency {
  name: string;
  close: () => Promise<void>;
}

class GracefulShutdown {
  private isShuttingDown = false;
  private readonly dependencies: ShutdownDependency[] = [];

  constructor(
    private readonly server: http.Server,
    private readonly timeoutMs: number = 30_000
  ) {}

  addDependency(dep: ShutdownDependency): this {
    this.dependencies.push(dep);
    return this;
  }

  register(): void {
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    signals.forEach(signal => process.on(signal, () => this.shutdown(signal)));

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      this.shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection:', reason);
      this.shutdown('unhandledRejection');
    });
  }

  private async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    console.log(`\n[Shutdown] Signal: ${signal}. Initiating graceful shutdown...`);

    const timer = setTimeout(() => {
      console.error('[Shutdown] Timeout exceeded. Force exiting.');
      process.exit(1);
    }, this.timeoutMs);

    try {
      // Stop accepting new HTTP connections
      await new Promise<void>((resolve, reject) =>
        this.server.close(err => err ? reject(err) : resolve())
      );
      console.log('[Shutdown] HTTP server closed');

      // Close all dependencies in order
      for (const dep of this.dependencies) {
        await dep.close();
        console.log(`[Shutdown] ${dep.name} closed`);
      }

      clearTimeout(timer);
      console.log('[Shutdown] Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      console.error('[Shutdown] Error during shutdown:', err);
      clearTimeout(timer);
      process.exit(1);
    }
  }
}

// Usage — src/index.ts
import { DataSource } from 'typeorm';
import { createClient } from 'redis';

const server = app.listen(config.PORT, () =>
  console.log(`Server running on port ${config.PORT}`)
);

const shutdown = new GracefulShutdown(server, 30_000)
  .addDependency({
    name: 'Database',
    close: () => AppDataSource.destroy(),
  })
  .addDependency({
    name: 'Redis',
    close: () => redisClient.quit(),
  });

shutdown.register();
```

---

#### 🔁 Cross Questions

**CQ21.1 — What is SIGTERM vs SIGINT?**
> - `SIGTERM` — Sent by Kubernetes, Docker, PM2, and OS process managers to request graceful shutdown. This is the standard "please stop" signal.
> - `SIGINT` — Sent when you press Ctrl+C in the terminal. Also triggers graceful shutdown.
> - `SIGUSR2` — Used by PM2's graceful reload feature.

**CQ21.2 — What is the difference between `uncaughtException` and `unhandledRejection`?**
> - `uncaughtException` — A synchronous error was thrown but not caught anywhere in the call stack
> - `unhandledRejection` — A Promise was rejected but no `.catch()` handler was attached
> Both indicate serious bugs. The correct response is: log the error, initiate graceful shutdown, and restart (PM2/Kubernetes will restart the container). **Never just log and continue** — the app is in an unknown state.

**CQ21.3 — How does Kubernetes handle graceful shutdown?**
> Kubernetes sends `SIGTERM` when terminating a pod, then waits `terminationGracePeriodSeconds` (default 30s) before sending `SIGKILL`. Your app must complete shutdown within that window. For long-running requests, increase the grace period and set the server's `keepAliveTimeout` appropriately.

---

### Q22. How do you structure a large production TypeScript Node.js project?

#### 📖 Definition
A well-structured project separates concerns into layers, making code easy to navigate, test, and maintain. The common patterns are **layered architecture** (Controller → Service → Repository) or **Clean Architecture** / **Hexagonal Architecture** for complex domains.

#### ✅ Answer

```
src/
├── config/
│   ├── database.ts        # TypeORM/Prisma data source
│   ├── env.ts             # Zod-validated env variables
│   ├── logger.ts          # Winston/Pino logger setup
│   └── redis.ts           # Redis client
│
├── controllers/           # HTTP layer — parse req, call service, send res
│   ├── user.controller.ts
│   └── auth.controller.ts
│
├── services/              # Business logic — orchestrates repositories
│   ├── user.service.ts
│   └── auth.service.ts
│
├── repositories/          # Data access — all DB queries live here
│   ├── user.repository.ts
│   └── base.repository.ts
│
├── models/ (or entities/) # TypeORM entities / Prisma generated types
│   └── user.entity.ts
│
├── middleware/            # Express middleware
│   ├── auth.middleware.ts
│   ├── validate.middleware.ts
│   ├── rate-limit.ts
│   └── error-handler.ts
│
├── routes/                # Route definitions — wires controllers + middleware
│   ├── user.routes.ts
│   ├── auth.routes.ts
│   └── index.ts           # mounts all routers
│
├── schemas/               # Zod validation schemas (input DTOs)
│   └── user.schema.ts
│
├── types/                 # Shared TypeScript types
│   ├── express.d.ts       # Module augmentation for Request
│   └── index.ts
│
├── errors/                # Custom error classes
│   └── index.ts
│
├── utils/                 # Pure utility functions
│   ├── async-handler.ts
│   ├── jwt.ts
│   └── pagination.ts
│
├── workers/               # Worker thread scripts
│   └── image-processor.worker.ts
│
├── app.ts                 # Express app — middleware, routes, no listen()
└── index.ts               # Entry point — starts server, graceful shutdown
```

**Layer communication rules:**
- `Controller` → calls `Service` only. Never calls Repository directly.
- `Service` → calls `Repository` and other `Services`. No HTTP knowledge.
- `Repository` → calls DB only. Returns domain objects.
- `Middleware` → cross-cutting concerns only. No business logic.

---

#### 🔁 Cross Questions

**CQ22.1 — Should controllers contain any business logic?**
> No. Controllers are HTTP adapters — their job is to extract data from the request, call the appropriate service method, and format the response. Business rules (validations, calculations, orchestration) belong in services. This keeps services testable without HTTP.

**CQ22.2 — What is the difference between DTO and Entity?**
> - **Entity** — represents a database row; tied to the persistence layer (has `@Column`, `@PrimaryGeneratedColumn` decorators or Prisma model)
> - **DTO (Data Transfer Object)** — represents data flowing in/out of your API; used for validation and shaping requests/responses. It has no persistence concerns.
> ```typescript
> // Entity — database shape
> @Entity() class User { @PrimaryGeneratedColumn() id!: number; }
> // DTO — API shape
> class CreateUserDto { name!: string; email!: string; }
> ```

**CQ22.3 — When would you choose Clean Architecture over layered architecture?**
> Clean Architecture is worth the complexity when:
> - The domain logic is complex enough to justify protecting it from infrastructure concerns
> - You need to support multiple delivery mechanisms (HTTP API, CLI, message queue)
> - You want to defer infrastructure decisions (DB, framework) as long as possible
> For most CRUD APIs, simple layered architecture (Controller/Service/Repository) is sufficient.

---

## Quick Reference Cheat Sheet

```typescript
// ── Common TypeScript patterns for Node.js ─────────────────

// 1. Async route handler wrapper
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => (req: Request, res: Response, next: NextFunction): void => {
  fn(req, res, next).catch(next);
};

// 2. Type-safe env access
const requireEnv = (key: string): string => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env: ${key}`);
  return v;
};

// 3. Assertion function (type guard that throws)
function assertDefined<T>(val: T | null | undefined, msg: string): asserts val is T {
  if (val == null) throw new Error(msg);
}

// 4. Deep Partial type
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 5. Typed Object.keys
function typedKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

// 6. Exhaustive switch
function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}

// 7. Sleep utility (typed)
const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

// 8. Retry wrapper
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === retries - 1) throw err;
      await sleep(delayMs * (i + 1)); // exponential backoff
    }
  }
  throw new Error('unreachable');
}

// 9. Paginated result type
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

function paginate<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);
  return { data, total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
}

// 10. Type guard builder
function isType<T>(value: unknown, keys: (keyof T)[]): value is T {
  return typeof value === 'object' && value !== null &&
    keys.every(k => k in (value as object));
}
```

---

*22 main questions | 60+ cross-questions | Basic → Advanced | Node.js + TypeScript | Senior/Lead Engineer Prep*

> **Topics covered:** TypeScript fundamentals, strict mode, `any`/`unknown`/`never`, `type` vs `interface`, project setup, `tsconfig.json`, Generics, Utility Types, Mapped/Conditional Types, `infer`, CommonJS vs ESM, Module Augmentation, Decorators, Typed EventEmitter, Environment Variables, Express typing, TypeORM/Prisma, Custom Errors, Jest testing, Dependency Injection, SOLID Principles, Worker Threads, Graceful Shutdown, Project Structure
