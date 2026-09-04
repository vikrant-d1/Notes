# TypeScript — Missing Advanced Interview Questions & Answers

This README contains the **advanced TypeScript topics that were missing or not covered deeply enough** in the existing interview guide.

Focus: **Senior / Staff / Principal TypeScript interviews**, especially for Node.js, React, Next.js, API, and large-scale applications.

---

## 1. Structural Typing & Assignability

### Q1. What is structural typing in TypeScript?

**Answer:**

TypeScript is structurally typed, which means compatibility is based on the **shape of a type**, not its explicit name.

```ts
interface User {
  id: number;
  name: string;
}

const user = {
  id: 1,
  name: "Vikrant",
  email: "test@example.com"
};

const u: User = user; // OK
```

`user` has all properties required by `User`, so it is assignable.

---

### Q2. What is excess property checking?

**Answer:**

TypeScript performs additional checking when assigning a **fresh object literal** to a target type.

```ts
interface User {
  name: string;
}

const user: User = {
  name: "Vikrant",
  age: 30
};
// Error: Object literal may only specify known properties
```

But:

```ts
const data = {
  name: "Vikrant",
  age: 30
};

const user: User = data; // OK
```

This difference is called **excess property checking**.

---

## 2. Type Inference

### Q3. What is type inference?

**Answer:**

TypeScript automatically determines a value's type without requiring an explicit annotation.

```ts
const name = "Vikrant";
// string

const age = 30;
// number
```

Inference also works with function returns:

```ts
function getUser() {
  return {
    id: 1,
    name: "Vikrant"
  };
}

// inferred return type:
// { id: number; name: string }
```

---

### Q4. What is contextual typing?

**Answer:**

Contextual typing means TypeScript determines the type of an expression from the context where it is used.

```ts
const numbers = [1, 2, 3];

numbers.map((value) => {
  return value * 2;
});
```

TypeScript knows `value` is a `number` because `map()` expects a callback receiving an array element.

---

### Q5. What is literal widening?

**Answer:**

TypeScript may widen literal types to broader types.

```ts
let status = "active";
// string

const status2 = "active";
// "active"
```

`const` preserves the literal more often because the value cannot be reassigned.

Use `as const` when you want deep literal preservation:

```ts
const config = {
  environment: "production",
  retries: 3
} as const;
```

---

## 3. keyof, typeof & Indexed Access Types

### Q6. What does `keyof` do?

**Answer:**

`keyof` creates a union of the property names of a type.

```ts
interface User {
  id: number;
  name: string;
  email: string;
}

type UserKey = keyof User;
// "id" | "name" | "email"
```

---

### Q7. What is an indexed access type?

**Answer:**

It retrieves the type of a property from another type.

```ts
type UserName = User["name"];
// string

type UserValue = User[keyof User];
// string | number
```

This is extremely useful when building generic utilities.

---

### Q8. How do you create a type-safe property getter?

**Answer:**

Use `keyof` with an indexed access type.

```ts
function getValue<T, K extends keyof T>(
  obj: T,
  key: K
): T[K] {
  return obj[key];
}

const user = {
  id: 1,
  name: "Vikrant"
};

const name = getValue(user, "name");
// string

const id = getValue(user, "id");
// number
```

---

## 4. Conditional Types

### Q9. What is a distributive conditional type?

**Answer:**

A conditional type distributes over a union when the checked type is a naked type parameter.

```ts
type ToArray<T> =
  T extends unknown ? T[] : never;

type Result = ToArray<string | number>;
// string[] | number[]
```

TypeScript effectively evaluates:

```ts
string extends unknown ? string[] : never
|
number extends unknown ? number[] : never
```

---

### Q10. How do you prevent distributive behavior?

**Answer:**

Wrap the type parameter in a tuple.

```ts
type ToArray<T> =
  [T] extends [unknown] ? T[] : never;

type Result = ToArray<string | number>;
// (string | number)[]
```

This is a common advanced conditional-type interview question.

---

### Q11. What is the `infer` keyword?

**Answer:**

`infer` allows TypeScript to extract a type from another type.

```ts
type Element<T> =
  T extends (infer U)[]
    ? U
    : never;

type Result = Element<string[]>;
// string
```

Another example:

```ts
type PromiseValue<T> =
  T extends Promise<infer U>
    ? U
    : T;
```

---

## 5. Mapped Types & Key Remapping

### Q12. What are mapped types?

**Answer:**

Mapped types transform every property of an existing type.

```ts
type Optional<T> = {
  [K in keyof T]?: T[K];
};
```

Example:

```ts
interface User {
  id: number;
  name: string;
}

type PartialUser = Optional<User>;
```

---

### Q13. What is key remapping in mapped types?

**Answer:**

Key remapping allows you to create new property names using `as`.

```ts
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]:
    () => T[K];
};

interface User {
  name: string;
  age: number;
}

type UserGetters = Getters<User>;
```

Result:

```ts
{
  getName: () => string;
  getAge: () => number;
}
```

---

## 6. Recursive Types

### Q14. What is a recursive type?

**Answer:**

A recursive type references itself.

```ts
type TreeNode<T> = {
  value: T;
  children: TreeNode<T>[];
};
```

This is useful for:

- Trees
- Nested configuration
- JSON
- ASTs
- File systems

---

### Q15. How would you implement `DeepPartial<T>`?

**Answer:**

```ts
type DeepPartial<T> = {
  [K in keyof T]?:
    T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};
```

Example:

```ts
interface User {
  name: string;
  address: {
    city: string;
    country: string;
  };
}

type PartialUser = DeepPartial<User>;
```

Now nested properties are also optional.

---

## 7. `never`, `unknown`, `void`, and `undefined`

### Q16. What is the difference between `never` and `unknown`?

**Answer:**

`unknown` means:

> I have a value, but I don't know its type yet.

`never` means:

> This value can never exist.

```ts
function fail(): never {
  throw new Error("Failed");
}

function process(value: unknown) {
  if (typeof value === "string") {
    console.log(value.toUpperCase());
  }
}
```

`unknown` is safe because you must narrow it before using it.

---

### Q17. Why is `never` useful for exhaustive checking?

**Answer:**

It ensures all cases in a discriminated union are handled.

```ts
type Event =
  | { type: "login" }
  | { type: "logout" };

function handle(event: Event) {
  switch (event.type) {
    case "login":
      return;
    case "logout":
      return;
    default:
      const exhaustive: never = event;
      return exhaustive;
  }
}
```

If a new event type is added and not handled, TypeScript reports an error.

---

### Q18. What is the difference between `void` and `undefined`?

**Answer:**

`undefined` is an actual value.

`void` generally represents a function whose return value should not be used.

```ts
function log(): void {
  console.log("hello");
}
```

A function returning `undefined` is more specifically saying that the return value is `undefined`.

---

## 8. Type Assertions

### Q19. What is the difference between `as`, `as const`, and `satisfies`?

**Answer:**

### `as`

Tells TypeScript to treat a value as another type.

```ts
const user = data as User;
```

It does not perform runtime validation.

### `as const`

Preserves literal values and makes properties readonly.

```ts
const roles = ["admin", "user"] as const;
```

### `satisfies`

Checks that a value conforms to a type while preserving its more specific inferred type.

```ts
const config = {
  mode: "production",
  retries: 3
} satisfies {
  mode: string;
  retries: number;
};
```

---

### Q20. Why is `as unknown as Type` considered dangerous?

**Answer:**

It bypasses normal type compatibility checks.

```ts
const value = something as unknown as User;
```

This does not make `value` a real `User` at runtime.

Use runtime validation instead:

```ts
const user = UserSchema.parse(value);
```

---

## 9. Assertion Functions

### Q21. What is an assertion function?

**Answer:**

An assertion function tells TypeScript that a condition is guaranteed after the function returns.

```ts
function assertString(
  value: unknown
): asserts value is string {
  if (typeof value !== "string") {
    throw new Error("Expected string");
  }
}

function process(value: unknown) {
  assertString(value);

  value.toUpperCase();
}
```

The compiler understands that `value` is a string after `assertString()`.

---

## 10. Function Overloads & Variance

### Q22. When should you use function overloads instead of unions?

**Answer:**

Use overloads when the return type depends on the input type.

```ts
function parse(value: string): User;
function parse(value: Buffer): User;

function parse(value: string | Buffer): User {
  // implementation
}
```

A union is simpler when the return type does not depend on the input.

---

### Q23. What is function parameter variance?

**Answer:**

Function parameters are primarily checked using **contravariance** under `strictFunctionTypes`.

Conceptually, a callback that can safely handle a broader input type can be used where a narrower input is expected.

This prevents unsafe callback assignments.

Enable:

```json
{
  "compilerOptions": {
    "strictFunctionTypes": true
  }
}
```

---

### Q24. What are covariance, contravariance, and invariance?

**Answer:**

- **Covariance** — output types can become more specific.
- **Contravariance** — input types can accept broader types.
- **Invariance** — neither substitution direction is safe.
- **Bivariance** — both directions are accepted in certain TypeScript cases.

These concepts are especially important for:

- Function callbacks
- Generic APIs
- React event handlers
- Collections
- Library design

---

## 11. Variadic Tuple Types

### Q25. What are variadic tuple types?

**Answer:**

They allow tuple types to be combined or manipulated using spreads.

```ts
type Concat<
  A extends unknown[],
  B extends unknown[]
> = [...A, ...B];

type Result = Concat<
  [string, number],
  [boolean]
>;

// [string, number, boolean]
```

They are useful for strongly typed:

- Function composition
- Middleware
- Event systems
- Utility functions

---

## 12. Advanced Tuples

### Q26. What tuple features should a senior TypeScript developer know?

**Answer:**

Know:

- Fixed-length tuples
- Optional tuple elements
- Rest tuple elements
- Named tuple elements
- Readonly tuples
- Variadic tuples

```ts
type User = [
  id: number,
  name: string,
  email?: string
];
```

---

## 13. `this` Typing

### Q27. How do you explicitly type `this` in a function?

**Answer:**

Use a special `this` parameter.

```ts
interface DB {
  query(this: DB, sql: string): void;
}
```

The `this` parameter is removed from the runtime function signature but provides compile-time checking.

---

### Q28. What is `ThisType<T>`?

**Answer:**

`ThisType<T>` provides contextual typing for `this` inside object literals.

It is useful for APIs that define methods through object configuration.

---

## 14. Module System

### Q29. What is the difference between CommonJS and ESM?

**Answer:**

CommonJS uses:

```ts
const fs = require("fs");
module.exports = {};
```

ESM uses:

```ts
import fs from "node:fs";
export {};
```

Modern Node.js applications commonly use ESM or explicitly configure CommonJS.

TypeScript configuration must align with the runtime module system.

---

### Q30. What is `moduleResolution`?

**Answer:**

It determines how TypeScript resolves imported modules.

Modern projects may use resolution strategies such as:

```json
{
  "compilerOptions": {
    "moduleResolution": "NodeNext"
  }
}
```

or:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

The correct option depends on whether the project runs through Node.js directly or a bundler.

---

### Q31. What is `verbatimModuleSyntax`?

**Answer:**

It makes TypeScript preserve import/export syntax more predictably and requires clear separation between type-only and runtime imports.

```ts
import type { User } from "./types";
import { createUser } from "./user";
```

This is particularly useful in modern ESM projects.

---

## 15. Advanced `tsconfig`

### Q32. What does `noUncheckedIndexedAccess` do?

**Answer:**

It adds `undefined` to indexed access where the value may not exist.

Without it:

```ts
const user = users[0];
// User
```

With it:

```ts
const user = users[0];
// User | undefined
```

This catches many real production bugs.

---

### Q33. What does `exactOptionalPropertyTypes` do?

**Answer:**

It distinguishes between a missing optional property and explicitly assigning `undefined`.

```ts
interface User {
  name?: string;
}
```

With `exactOptionalPropertyTypes`, these can be treated differently:

```ts
{}
```

and:

```ts
{ name: undefined }
```

This provides more precise modeling of APIs.

---

### Q34. What does `noImplicitOverride` do?

**Answer:**

It requires the `override` keyword when overriding a parent class method.

```ts
class Dog extends Animal {
  override speak() {
    console.log("woof");
  }
}
```

This protects against accidental method-name changes in base classes.

---

### Q35. Which advanced TypeScript compiler flags do you consider important?

**Answer:**

For production applications:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitOverride": true,
  "noPropertyAccessFromIndexSignature": true,
  "useUnknownInCatchVariables": true,
  "verbatimModuleSyntax": true
}
```

The exact configuration should be adapted to the runtime and build system.

---

## 16. Declaration & Module Augmentation

### Q36. What is declaration merging?

**Answer:**

TypeScript can merge multiple declarations with the same name.

```ts
interface User {
  id: number;
}

interface User {
  name: string;
}
```

The resulting interface contains both:

```ts
interface User {
  id: number;
  name: string;
}
```

---

### Q37. What is module augmentation?

**Answer:**

It allows you to add types to an existing module.

A common Express example:

```ts
declare global {
  namespace Express {
    interface Request {
      user?: User;
      requestId: string;
    }
  }
}
```

Now middleware-added properties can be recognized throughout the application.

---

### Q38. What is the difference between `declare module` and module augmentation?

**Answer:**

`declare module` can describe an untyped module:

```ts
declare module "legacy-package" {
  export function run(): void;
}
```

Module augmentation extends declarations that already exist.

Use augmentation when you need to add functionality or fields to an existing library type.

---

## 17. Enum vs Union vs `as const`

### Q39. When would you use enum, union, or `as const`?

**Answer:**

### Union

```ts
type Status = "active" | "inactive";
```

Excellent when you only need compile-time types.

### `as const`

```ts
const STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive"
} as const;

type Status =
  typeof STATUS[keyof typeof STATUS];
```

Useful when you need both runtime values and a derived type.

### Enum

```ts
enum Status {
  Active = "active",
  Inactive = "inactive"
}
```

Useful when a runtime enum object is specifically desired, but many modern TypeScript codebases prefer unions or `as const`.

---

## 18. Object vs `{}` vs `object`

### Q40. What is the difference between `Object`, `{}`, `object`, and `Record<string, unknown>`?

**Answer:**

They are not interchangeable.

- `{}` accepts almost any non-nullish value.
- `object` means a non-primitive object.
- `Object` is generally discouraged as a broad type.
- `Record<string, unknown>` specifically represents an object with string keys.

For unknown object-shaped data, prefer:

```ts
Record<string, unknown>
```

when that accurately represents the contract.

---

## 19. Runtime vs Compile-Time

### Q41. Can TypeScript validate an API response at runtime?

**Answer:**

No.

TypeScript types disappear during compilation.

An API can return:

```json
{
  "id": "wrong-type"
}
```

even if TypeScript says:

```ts
interface User {
  id: number;
}
```

Use runtime validation:

```ts
const user = UserSchema.parse(response);
```

Libraries such as Zod can provide runtime validation and TypeScript inference.

---

### Q42. Why is `fetchData<T>()` alone not enough for API safety?

**Answer:**

This:

```ts
async function fetchData<T>(
  url: string
): Promise<T> {
  const response = await fetch(url);
  return response.json() as T;
}
```

only tells the compiler what you **claim** the server returned.

It does not validate the actual response.

A safer design is:

```ts
async function fetchData<T>(
  url: string,
  schema: ZodSchema<T>
): Promise<T> {
  const response = await fetch(url);
  const data = await response.json();

  return schema.parse(data);
}
```

---

## 20. TypeScript Performance

### Q43. Why can TypeScript compilation become slow?

**Answer:**

Common causes include:

- Very large unions
- Deep recursive types
- Complex conditional types
- Huge mapped types
- Excessive generic instantiation
- Large dependency graphs
- Large monorepos
- Repeated type computation

---

### Q44. How would you diagnose a slow TypeScript build?

**Answer:**

Start with:

```bash
tsc --extendedDiagnostics
```

For deeper compiler investigation, use TypeScript tracing options such as:

```bash
tsc --generateTrace trace
```

Then identify:

- Slow files
- Large type instantiations
- Dependency bottlenecks
- Expensive library declarations

---

### Q45. How do you improve TypeScript performance in a large monorepo?

**Answer:**

Use:

1. Project references
2. `composite`
3. Incremental builds
4. Clear package boundaries
5. Smaller dependency graphs
6. Avoid excessively complex types
7. Avoid unnecessary recursive conditional types
8. Consider `skipLibCheck` where appropriate
9. Separate build and type-check pipelines when useful

Example:

```json
{
  "compilerOptions": {
    "composite": true,
    "incremental": true
  }
}
```

---

## 21. Project References

### Q46. What are TypeScript project references?

**Answer:**

Project references allow a large TypeScript codebase to be split into independently compiled projects.

Example:

```json
{
  "references": [
    { "path": "./packages/types" },
    { "path": "./packages/api" },
    { "path": "./packages/web" }
  ]
}
```

They improve:

- Build performance
- Dependency boundaries
- Incremental compilation
- Monorepo scalability

---

## 22. TypeScript Build Tools

### Q47. Does `tsc` only transpile TypeScript?

**Answer:**

`tsc` can type-check and emit JavaScript.

Other tools may transpile without type-checking:

| Tool | Type-checking | Transpilation |
|---|---|---|
| `tsc` | Yes | Yes |
| `esbuild` | No | Yes |
| SWC | No | Yes |
| Babel | No | Yes |
| `tsx` | No full type-check | Yes |

A production CI pipeline should normally have a dedicated type-check step:

```bash
tsc --noEmit
```

---

## 23. Node.js TypeScript

### Q48. What Node.js types should a senior TypeScript developer know?

**Answer:**

Important Node types include:

```ts
NodeJS.ProcessEnv
NodeJS.Timeout
Buffer
NodeJS.ReadableStream
NodeJS.WritableStream
```

Also understand typing for:

- `fs`
- `http`
- `EventEmitter`
- Streams
- `worker_threads`
- `child_process`
- `AbortController`
- Web Streams

Install Node types when required:

```bash
npm install -D @types/node
```

---

## 24. Senior Scenario Questions

### Q49. Your API response type is correct but production receives invalid data. What do you do?

**Answer:**

I would not trust TypeScript types at the runtime boundary.

I would:

1. Define a runtime schema.
2. Validate the response.
3. Reject malformed data.
4. Log the validation failure.
5. Add monitoring.
6. Fix the upstream API contract.
7. Add contract/integration tests.

---

### Q50. Your 500k-line TypeScript monorepo takes 10 minutes to type-check. What is your approach?

**Answer:**

I would:

1. Measure first with compiler diagnostics.
2. Identify expensive packages/types.
3. Introduce project references.
4. Enable incremental compilation.
5. Reduce dependency graph size.
6. Simplify recursive/conditional types.
7. Review generated declaration files.
8. Separate package builds.
9. Use CI caching.
10. Avoid hiding problems by simply disabling strict checking.

---

### Q51. A developer uses `any` for every third-party API response. How would you fix it?

**Answer:**

I would replace the boundary with:

```ts
unknown
```

then validate:

```ts
const data: unknown = await response.json();

const user = UserSchema.parse(data);
```

For libraries without types:

1. Check for `@types/package`.
2. Create a local `.d.ts` declaration if needed.
3. Use module augmentation when extending an existing library.
4. Avoid `any` unless there is a documented reason.

---

### Q52. Your team has hundreds of `as` assertions. How would you reduce them?

**Answer:**

I would categorize them:

- Legitimate assertions
- Missing type definitions
- Poor API boundaries
- Missing narrowing
- Unsafe runtime data
- Incorrect generic design

Then replace them with:

- Type guards
- Assertion functions
- Generics
- `unknown`
- Runtime schemas
- Better domain types
- `satisfies`

The goal is not blindly removing every assertion; it is eliminating **unnecessary and unsafe assertions**.

---

### Q53. How would you design a type-safe middleware pipeline?

**Answer:**

Use generic input/output context types.

```ts
type Middleware<In, Out> =
  (ctx: In) => Out | Promise<Out>;

function compose<A, B, C>(
  first: Middleware<A, B>,
  second: Middleware<B, C>
): Middleware<A, C> {
  return async (ctx) => {
    return second(await first(ctx));
  };
}
```

This allows each middleware to transform the context while preserving type safety.

---

### Q54. How would you design end-to-end type safety for React + Node.js?

**Answer:**

I would use:

```text
API Contract
     ↓
Runtime Schema
     ↓
Server Validation
     ↓
Shared Types
     ↓
Typed Client
     ↓
React Components
```

Possible approaches:

- OpenAPI + generated TypeScript
- GraphQL code generation
- tRPC
- ts-rest
- Zod-based contracts

The important point is that **compile-time types and runtime validation solve different problems**.

---