# TypeScript & React 

### Q3. What is the difference between `any`, `unknown`, and `never`?

- **any** — Disables type checking, allowing the value to be used and assigned almost anywhere.
- **unknown** — Represents an unknown value that must be type-checked or narrowed before use.
- **never** — Represents a value that can never occur, commonly used for functions that never return and exhaustive checks.


### What is Function Overloading in TypeScript?

Function overloading allows a function to accept different types or different numbers of arguments while providing type safety.

In TypeScript, we define multiple function signatures (overloads) and write only one implementation.

```javascript
function display(value: string): void;
function display(value: number): void;

function display(value: string | number): void {
  console.log(value);
}

display("Hello");
display(100);
```
### Does JavaScript Support Function Overloading?

No. JavaScript does not support function overloading. TypeScript provides it at compile time through multiple function signatures, but after compilation there is only one JavaScript function.



### Q: What is the role of `.d.ts` files?
`.d.ts` files are TypeScript declaration files that contain type information but no runtime JavaScript code.
They provide type safety and autocomplete for libraries or JavaScript code without exposing the original TypeScript source.

---

## Q: What is a `.map` File (Source Map)?

A **source map** (`.js.map`) is a JSON file that creates a **mapping between the compiled JS and the original TS source** — line by line, column by column.
It helps with debugging by showing the original .ts code instead of the compiled JavaScript.

Enable it in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "sourceMap": true
  }
}
```

This generates a `.js.map` file alongside every `.js` file in `dist/`.



## Q: What are Generic Functions in TypeScript and Why Use Them?

A **generic function** is a function that works with **any type** while still being **type-safe** — the type is determined at call time, not at definition time. Generics use a **type parameter** (conventionally `T`) as a placeholder.


### Real-World Examples

```ts
// 1. Generic array utility
function getFirst<T>(arr: T[]): T | undefined {
  return arr[0];
}

const first = getFirst([1, 2, 3]);   // number
const name  = getFirst(['a', 'b']);  // string

// 2. Generic API response wrapper
function wrapResponse<T>(data: T): { success: boolean; data: T } {
  return { success: true, data };
}

const res = wrapResponse({ id: 1, name: 'Vikrant' });
// res.data is inferred as { id: number; name: string }

// 3. Generic with constraint — T must have an 'id' property
function findById<T extends { id: number }>(items: T[], id: number): T | undefined {
  return items.find(item => item.id === id);
}

// 4. Multiple type parameters
function merge<T, U>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}

const merged = merge({ name: 'Vikrant' }, { age: 30 });
// merged is { name: string; age: number }

// 5. Generic async fetch (very common in production)
async function fetchData<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return res.json() as T;
}

interface User { id: number; name: string; }
const user = await fetchData<User>('/api/user/1');  // user is typed as User
```

## Q: What are Generic Interfaces in TypeScript and Why Use Them?

A **generic interface** defines a contract (shape) that works with **any type**, decided when the interface is used. They're the backbone of reusable, strongly-typed data structures and API contracts.


### Real-World Examples

```ts
// 1. API Response wrapper — used in almost every production codebase
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

// Strongly typed — data is User, not 'any'
const response: ApiResponse<User> = {
  data: { id: 1, name: 'Vikrant', email: 'v@example.com' },
  status: 200,
  message: 'OK',
  timestamp: new Date().toISOString(),
};

// 2. Paginated list response
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

const users: PaginatedResponse<User> = {
  items: [{ id: 1, name: 'Vikrant', email: 'v@example.com' }],
  total: 100,
  page: 1,
  pageSize: 10,
  hasNext: true,
};

// 3. Generic Repository pattern (very common in Node.js + TypeORM/Prisma)
interface Repository<T> {
  findById(id: number): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: number, data: Partial<T>): Promise<T>;
  delete(id: number): Promise<void>;
}

// Implement for a specific entity
class UserRepository implements Repository<User> {
  async findById(id: number): Promise<User | null> { /* ... */ return null; }
  async findAll(): Promise<User[]> { return []; }
  async create(data: Partial<User>): Promise<User> { /* ... */ return {} as User; }
  async update(id: number, data: Partial<User>): Promise<User> { /* ... */ return {} as User; }
  async delete(id: number): Promise<void> { /* ... */ }
}

// 4. Generic event emitter interface
interface EventMap {
  userCreated: User;
  userDeleted: { id: number };
}

interface TypedEventEmitter<T extends Record<string, unknown>> {
  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): void;
  emit<K extends keyof T>(event: K, data: T[K]): void;
}

// 5. Generic cache interface
interface Cache<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V, ttlMs?: number): void;
  delete(key: K): void;
  clear(): void;
}
```

## 2. Advanced Types

### Union & Intersection
- **Union (`|`)** → Value can be type A **or** B.
- **Intersection (`&`)** → Value must be type A **and** B.

### Conditional Types
```ts
type IsString<T> = T extends string ? "yes" : "no";
```
Think: **"if T is string, then yes, else no"**

### `infer` Keyword
Captures a type inside a conditional. Like a **type-level variable**.
```ts
type ElementOf<T> = T extends (infer U)[] ? U : never;
// ElementOf<string[]> → string
```

### Mapped Types
Transform every property of a type.
```ts
type Optional<T> = { [K in keyof T]?: T[K] };
```

### Discriminated Unions (Tagged Unions)
Each variant has a **shared literal field** (the "tag") that TypeScript uses to narrow.
```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; w: number; h: number };
```

### Template Literal Types
Build string types from other string types.
```ts
type Event = `on${Capitalize<"click" | "focus">}`; // "onClick" | "onFocus"
```
---

### Generic Constraints
Limit what `T` can be using `extends`.
```ts
function len<T extends { length: number }>(x: T) { return x.length; }
```

### Key Utility Types (Built-in)
| Utility | What It Does |
|---------|-------------|
| `Partial<T>` | All props optional |
| `Required<T>` | All props required |
| `Readonly<T>` | All props readonly |
| `Pick<T, K>` | Keep only keys K |
| `Omit<T, K>` | Remove keys K |
| `Record<K, V>` | Object with keys K, values V |
| `Exclude<U, E>` | Remove E from union U |
| `Extract<U, E>` | Keep only E from union U |
| `NonNullable<T>` | Remove null & undefined |
| `ReturnType<F>` | Return type of function F |
| `Parameters<F>` | Tuple of function params |
| `Awaited<T>` | Unwrap Promise recursively |

---

## 4. Type Guards & Narrowing

Ways to tell TypeScript **which type** a value actually is:

| Guard | When to Use |
|-------|------------|
| `typeof x === "string"` | Primitives |
| `x instanceof Dog` | Class instances |
| `"swim" in x` | Check property existence |
| Custom: `x is Fish` | Complex logic (type predicate) |

### `satisfies` (TS 4.9+)
Validates a value matches a type **without widening** it.
```ts
const palette = { red: [255,0,0], green: "#0f0" } satisfies Record<string, string | number[]>;
palette.green.toUpperCase(); // ✅ still knows it's string
```

---

## 5. Classes & OOP

### Access Modifiers
| Modifier | Scope |
|----------|-------|
| `public` | Everywhere (default) |
| `private` | Only inside the class |
| `protected` | Class + subclasses |
| `readonly` | Set once, never changed |

### Abstract Class vs Interface
- **Abstract class** → Can have implementation + abstract methods. Single inheritance.
- **Interface** → Pure contract. Multiple implementation.

---

### Decorators
Functions that modify classes/methods at design time. `@Logger`, `@Log`.

### Branded (Nominal) Types
Make structurally identical types **incompatible** using a phantom brand field.
```ts
type UserId = string & { __brand: "UserId" };
type OrderId = string & { __brand: "OrderId" };
// Can't mix them up!
```

### Variance
- **Covariant** (output) → Subtype OK where supertype expected.
- **Contravariant** (input) → Supertype OK where subtype expected.

---

## 7. Config & Tooling

### `strict: true` Enables
`strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `strictPropertyInitialization`, `noImplicitThis`, `strictBindCallApply`, `alwaysStrict`, `useUnknownInCatchVariables`.

**Always use `strict: true`.**

---

## 8. React + TypeScript — Components

### Typing Props
```tsx
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}</h1>;
}
```

### Typing Children
Use `React.ReactNode` — the most flexible option.

### Discriminated Union Props
```tsx
type BtnProps =
  | { variant: "link"; href: string }
  | { variant: "button"; onClick: () => void };
```
TypeScript narrows props based on `variant`.

---

## 9. Hooks Typing

| Hook | How to Type |
|------|------------|
| `useState` | `useState<User \| null>(null)` |
| `useRef` (DOM) | `useRef<HTMLInputElement>(null)` |
| `useRef` (mutable) | `useRef<number \| null>(null)` |
| `useReducer` | Type `State` + `Action` union → pass to reducer |
| `useContext` | `createContext<T \| undefined>(undefined)` + guard hook |
| `useCallback` | Inferred; or `useCallback<(e: FormEvent) => void>(...)` |
| `useMemo` | Return type inferred; or `useMemo<User[]>(...)` |

### Custom Hook Pattern
```tsx
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // ... fetch logic
  return { data, loading, error } as const;
}
```

---

## 10. Event Handling

| Event | Type |
|-------|------|
| Click | `React.MouseEvent<HTMLButtonElement>` |
| Change | `React.ChangeEvent<HTMLInputElement>` |
| Submit | `React.FormEvent<HTMLFormElement>` |
| Key | `React.KeyboardEvent<HTMLInputElement>` |
| Focus | `React.FocusEvent<HTMLInputElement>` |

---

## 11. Advanced React Patterns

### Generic Components
Components that accept a type parameter (e.g., `<Table<User>>`).

### HOC (Higher-Order Component)
A function that takes a component and returns an enhanced one. Type both input and injected props.

### Render Props
Pass a **function as children** that receives data and returns JSX.

### Polymorphic `as` Prop
Let a component render as **any HTML element** while keeping correct props.
```tsx
<Text as="a" href="/home">Link</Text>
<Text as="h1">Heading</Text>
```

### `forwardRef`
```tsx
const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <input ref={ref} {...props} />
));
```

---

## 12. State Management

### Redux Toolkit
- Type `State`, `Action` with `PayloadAction<T>`.
- Create typed hooks: `useAppDispatch`, `useAppSelector`.
- `RootState = ReturnType<typeof store.getState>`.

### Zustand
```tsx
const useStore = create<StoreType>((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
}));
```

---

## 13. Data Fetching

### React Query (TanStack Query)
```tsx
useQuery<User[], Error>({ queryKey: ["users"], queryFn: fetchUsers });
useMutation<User, Error, NewUserPayload>({ mutationFn: createUser });
```

### Typed Axios
Generic response wrappers: `ApiResponse<T>` with `data`, `message`, `pagination`.

---

## 14. Forms

### React Hook Form + Zod
1. Define Zod schema.
2. Infer type: `type FormData = z.infer<typeof schema>`.
3. Pass to `useForm<FormData>({ resolver: zodResolver(schema) })`.

**Result:** Runtime validation + compile-time types from a single source of truth.

---

## 15. Testing

- Use `render`, `screen`, `userEvent` from Testing Library.
- Type mock functions: `vi.fn<[ParamTypes], ReturnType>()`.
- Create typed `renderWithProviders` helper for Redux tests.

---

## 16. Performance Patterns

| Pattern | Typing |
|---------|--------|
| `React.memo` | `React.memo<Props>(Component, areEqual?)` |
| `React.lazy` | `React.lazy<ComponentType<Props>>(() => import(...))` |
| Custom comparison | `(prev: Props, next: Props) => boolean` |

---

## 17. Quick-Fire Answers

| Question | One-Line Answer |
|----------|----------------|
| `keyof` | Union of all property names of a type |
| `typeof` (type context) | Extracts type from a runtime value |
| Index signature | `{ [key: string]: number }` — dynamic keys |
| `Readonly` vs `ReadonlyArray` | Readonly props vs no-mutate array |
| `Awaited<T>` | Unwraps nested Promises |
| `undefined` vs `void` | `void` = no useful return; `undefined` = specific value |

---

## 18. Migration & Leadership

### JS → TS Migration Strategy
1. Rename `.js` → `.ts` incrementally.
2. Start `strict: false`, enable flags one by one.
3. Prioritize shared modules & API layers first.
4. Block new `.js` files in CI.

### Enforcing Best Practices
ESLint + `@typescript-eslint`, strict tsconfig, pre-commit hooks, CI type checks, shared utility types, code review guidelines.

### Missing Types for Libraries
1. `npm i -D @types/libname` (DefinitelyTyped).
2. If none → create local `.d.ts` file.
3. Quick escape: `declare module "lib"`.

---

## 19. Common Mistakes

| ❌ Don't | ✅ Do |
|----------|------|
| Use `any` everywhere | Use `unknown` + type guards |
| Use `as` assertions | Use type narrowing |
| Skip `strict: true` | Always enable strict |
| Ignore null/undefined | Use `?.` and `??` |
| Over-engineer types | Keep simple; extract when reused |
| Leave APIs untyped | Create shared response interfaces |
| Use `React.FC` blindly | Prefer typed function props |

---



## PART 2 — React + TypeScript

---

### 7. Component Typing

| Pattern | Definition |
|---------|-----------|
| **Inline props** | `function Btn({ label }: { label: string })` — preferred |
| **`React.ReactNode`** | Most flexible children type |
| **Discriminated union props** | Different props per `variant` — TS narrows automatically |
| **Polymorphic `as` prop** | Component renders as any element with correct props |
| **`forwardRef`** | `React.forwardRef<HTMLInputElement, Props>((props, ref) => ...)` |
| **Generic component** | `function Table<T>({ data }: { data: T[] })` — type-safe for any data |

### 8. Hooks Typing

| Hook | How to Type |
|------|------------|
| `useState` | `useState<User \| null>(null)` |
| `useRef` (DOM) | `useRef<HTMLInputElement>(null)` → `RefObject` (readonly) |
| `useRef` (mutable) | `useRef<number \| null>(null)` → `MutableRefObject` |
| `useReducer` | `State` + `Action` discriminated union |
| `useContext` | `createContext<T \| undefined>(undefined)` + throw-if-undefined hook |
| `useCallback` | Inferred, or `useCallback<(e: FormEvent) => void>(...)` |
| `useMemo` | Return type inferred |

### 9. Event Types

| Event | Type |
|-------|------|
| Click | `React.MouseEvent<HTMLButtonElement>` |
| Change | `React.ChangeEvent<HTMLInputElement>` |
| Submit | `React.FormEvent<HTMLFormElement>` |
| Key | `React.KeyboardEvent` |
| Focus | `React.FocusEvent` |

### 10. Advanced React Patterns

| Pattern | Definition |
|---------|-----------|
| **HOC** | Function that takes component, returns enhanced component. Type both input & injected props. |
| **Render Props** | Pass function-as-children that receives data, returns JSX. |
| **Compound Components** | Parent shares state via context; children consume it. |
| **React.memo** | `React.memo<Props>(Component, areEqual?)` — skip re-render if props unchanged |
| **React.lazy** | `React.lazy(() => import("./Comp"))` — code-split at component level |

### 11. State Management (Typed)

| Library | Key Typing Pattern |
|---------|-------------------|
| **Redux Toolkit** | `PayloadAction<T>`, typed hooks via `RootState` & `AppDispatch` |
| **Zustand** | `create<StoreInterface>((set) => ({...}))` |
| **React Query** | `useQuery<Data, Error>`, `useMutation<Result, Error, Variables>` |
| **React Hook Form + Zod** | `z.infer<typeof schema>` → single source of truth for runtime + compile-time |

---

## PART 3 — Next.js with TypeScript

---

### 12. Next.js Core Concepts

| Concept | Definition |
|---------|-----------|
| **App Router** | New routing system using `app/` directory. Supports layouts, loading states, server components. |
| **Pages Router** | Legacy `pages/` directory routing. Still common in production. |
| **Server Components** | Render on server, zero client JS. Default in App Router. |
| **Client Components** | `"use client"` directive. Handle interactivity, browser APIs, state. |
| **SSR** | HTML generated per-request on server. `getServerSideProps` (pages) or async component (app). |
| **SSG** | HTML generated at build time. `getStaticProps` + `getStaticPaths`. |
| **ISR** | Static pages that revalidate in background after N seconds. |
| **CSR** | Minimal HTML shell → JS renders on client. Traditional SPA. |
| **Server Actions** | Async functions that run on server, called from client forms/buttons. |
| **Middleware** | Runs before request completes — auth, redirects, logging. `middleware.ts` at root. |
| **Edge vs Node Runtime** | Edge = low latency, sandbox limits. Node = full APIs, heavier compute. |

### 13. Next.js TypeScript Typing

```ts
// Typed page props (App Router)
export default async function UserPage({ params }: { params: { id: string } }) {
  const user = await getUser(params.id);
  return <Profile user={user} />;
}

// Typed API route (App Router)
import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest) {
  const data = await fetchData();
  return NextResponse.json(data);
}

// Typed middleware
import { NextRequest, NextResponse } from "next/server";
export function middleware(req: NextRequest) {
  const token = req.cookies.get("token");
  if (!token) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

// Typed Server Action
"use server";
export async function createPost(formData: FormData): Promise<{ success: boolean }> {
  const title = formData.get("title") as string;
  await db.posts.create({ title });
  return { success: true };
}
```

---

## PART 4 — Node.js with TypeScript

---

### 14. Node.js Core Concepts

| Concept | Definition |
|---------|-----------|
| **Event Loop** | Single-threaded loop that handles async I/O via callbacks/promises. |
| **Non-blocking I/O** | Operations don't block the main thread — use callbacks/promises for results. |
| **Streams** | Process data in chunks (readable, writable, transform, duplex). Memory-efficient. |
| **Cluster Module** | Fork multiple worker processes to use all CPU cores. |
| **Worker Threads** | True parallelism for CPU-intensive tasks without forking a process. |
| **Event Emitter** | Pub/sub pattern — `emitter.on("event", handler)`. Core of Node architecture. |

### 15. Node.js TypeScript Typing

```ts
// Typed Express app
import express, { Request, Response, NextFunction } from "express";

interface TypedRequest<B = {}, Q = {}> extends Request {
  body: B;
  query: Q & Record<string, string>;
}

app.post("/users", async (req: TypedRequest<{ name: string; email: string }>, res: Response) => {
  const { name, email } = req.body; // fully typed
  const user = await createUser({ name, email });
  res.json(user);
});

// Typed error-handling middleware
interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction) {
  res.status(err.statusCode || 500).json({ message: err.message });
}

// Typed environment variables
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]),
});
const env = envSchema.parse(process.env);
// env.PORT is number, env.DATABASE_URL is string — fully typed!
```

---

## PART 5 — Scenario-Based Questions (Staff/Principal Level)

---

### S1: Design a type-safe API layer

**Scenario:** You're building an API client shared across React, Next.js, and Node.js services. How do you ensure end-to-end type safety?

**Answer:**
- Define shared types in a **monorepo package** (`@company/types`).
- Use Zod schemas as the **single source of truth** — derive TS types with `z.infer`.
- Validate responses at runtime (API can lie; types alone can't catch that).
- Use generics for the fetch wrapper: `async function api<T>(url: string): Promise<T>`.
- Consider **tRPC** or **ts-rest** for contract-first API typing that auto-syncs client ↔ server.

---

### S2: Typing a plugin/middleware system

**Scenario:** Design a type-safe middleware chain where each middleware can add properties to the context object.

**Answer:**
```ts
type Middleware<In, Out> = (ctx: In) => Out | Promise<Out>;

function compose<A, B, C>(m1: Middleware<A, B>, m2: Middleware<B, C>): Middleware<A, C> {
  return async (ctx) => m2(await m1(ctx));
}

// Each middleware extends the context — types chain automatically
const withAuth = (ctx: { req: Request }) => ({ ...ctx, userId: "123" });
const withDb = (ctx: { userId: string }) => ({ ...ctx, db: getDb() });

const handler = compose(withAuth, withDb);
// handler input: { req: Request }
// handler output: { req: Request; userId: string; db: Db }
```

---

### S3: Fixing a massive `any` infestation

**Scenario:** You inherit a 200k-line codebase with 3000+ `any` usages. What's your strategy?

**Answer:**
1. **Audit** — Run `tsc --noEmit | grep "any"` and categorize: API boundaries, third-party libs, lazy shortcuts.
2. **Prioritize** — Fix shared modules, API layers, and utils first (highest blast radius).
3. **Enable incrementally** — Turn on `noImplicitAny` per-package in a monorepo, or use `// @ts-strict` comments.
4. **Automate** — Add ESLint rule `@typescript-eslint/no-explicit-any` as **warning** → gradually promote to **error**.
5. **Track** — Dashboard showing `any` count per package. Celebrate wins.
6. **CI gate** — No new `any` allowed. Existing ones tracked via baseline.

---

### S4: Server Component vs Client Component boundary

**Scenario:** In a Next.js App Router project, how do you decide where to draw the server/client boundary? How does TypeScript help?

**Answer:**
- **Default to Server Components** — zero client JS, direct DB/API access.
- **Push `"use client"` as deep as possible** — only wrap the interactive leaf (button, form, dropdown), not the page.
- TypeScript helps: Server components can use server-only types (`db`, `fs`). If you accidentally import a server module in a client component, the build fails.
- Use the `server-only` package — importing it in a client component gives a compile error.
- Type pattern: separate `ServerProps` (can include non-serializable types like `Date`) from `ClientProps` (must be serializable / JSON-safe).

---

### S5: Type-safe environment variables across Node.js / Next.js

**Scenario:** Environment variables are stringly typed and runtime-only. How do you make them type-safe?

**Answer:**
```ts
// env.ts — single source of truth
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
```
- **Fails fast at startup** if any variable is missing or wrong type.
- **Autocomplete** everywhere: `env.DATABASE_URL` is `string`, `env.PORT` is `number`.
- Works in Next.js, Node.js, and testing — import from one place.

---

### S6: Recursive / deeply nested types

**Scenario:** Design a type for a permission system where permissions can be nested groups.

**Answer:**
```ts
type Permission =
  | { type: "action"; action: string }
  | { type: "group"; name: string; children: Permission[] };

// DeepReadonly for immutable permission trees
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

const permissions: DeepReadonly<Permission> = {
  type: "group",
  name: "admin",
  children: [
    { type: "action", action: "users.create" },
    { type: "group", name: "billing", children: [
      { type: "action", action: "invoices.read" },
    ]},
  ],
};
```

---

### S7: Typing a multi-tenant SaaS backend

**Scenario:** Each API request belongs to a tenant. How do you enforce tenant context throughout the call stack?

**Answer:**
- Use **branded types** so `TenantId` can't be confused with `UserId`:
  ```ts
  type TenantId = string & { __brand: "TenantId" };
  ```
- Inject `TenantContext` at middleware level, pass through generics:
  ```ts
  interface TenantContext { tenantId: TenantId; dbSchema: string; }
  ```
- **Never accept raw `string`** for tenant — always require `TenantId`.
- All DB queries take `TenantContext` as first param — compiler enforces you can't forget it.

---

### S8: Handling third-party SDK without types

**Scenario:** You must integrate a vendor SDK that ships no TypeScript types and has no `@types/` package.

**Answer:**
1. Create `types/vendor-sdk.d.ts`:
   ```ts
   declare module "vendor-sdk" {
     export function init(config: { apiKey: string }): void;
     export function track(event: string, data?: Record<string, unknown>): void;
   }
   ```
2. Start with **minimal types** covering only what you actually use.
3. **Gradually expand** as you use more features.
4. Wrap the SDK in your own **typed adapter** — isolate untyped code to one file.
5. Contribute types to DefinitelyTyped when stable.

---

### S9: Type-safe feature flags

**Scenario:** Design a feature flag system where TypeScript ensures you never check a non-existent flag.

**Answer:**
```ts
const FLAGS = {
  newDashboard: { default: false },
  betaSearch: { default: true },
  darkMode: { default: false },
} as const;

type FlagName = keyof typeof FLAGS;

function isEnabled(flag: FlagName): boolean {
  return getRemoteFlag(flag) ?? FLAGS[flag].default;
}

isEnabled("newDashboard"); // ✅
isEnabled("typoFlag");     // ❌ compile error
```

---

### S10: Typing a complex form with dynamic fields

**Scenario:** A form where sections are added/removed dynamically (e.g., invoice line items). How do you keep it type-safe?

**Answer:**
- Use **Zod + React Hook Form** with `useFieldArray`:
  ```ts
  const invoiceSchema = z.object({
    customer: z.string(),
    items: z.array(z.object({
      description: z.string(),
      quantity: z.coerce.number().min(1),
      price: z.coerce.number().min(0),
    })).min(1, "At least one item"),
    notes: z.string().optional(),
  });

  type InvoiceForm = z.infer<typeof invoiceSchema>;
  ```
- `useFieldArray<InvoiceForm, "items">` — fully typed append/remove/swap.
- Zod validates at runtime; TypeScript validates at compile time — **both from one schema**.

---

### S11: Designing type-safe event bus / pub-sub

**Scenario:** Multiple services communicate via events. How do you ensure producers and consumers agree on event shapes?

**Answer:**
```ts
// Shared event map — single source of truth
interface EventMap {
  "user.created": { userId: string; email: string };
  "order.placed": { orderId: string; total: number };
  "payment.failed": { orderId: string; reason: string };
}

// Typed emitter
class TypedEmitter {
  on<K extends keyof EventMap>(event: K, handler: (data: EventMap[K]) => void): void { /* ... */ }
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void { /* ... */ }
}

const bus = new TypedEmitter();
bus.emit("user.created", { userId: "1", email: "a@b.com" }); // ✅
bus.emit("user.created", { orderId: "1" });                   // ❌ compile error
```

---

### S12: SSR data fetching with type safety (Next.js)

**Scenario:** A Next.js page fetches data from multiple APIs. How do you type the entire flow?

**Answer:**
```ts
// Shared types
interface Product { id: string; name: string; price: number; }
interface Review { id: string; rating: number; comment: string; }

// Server component (App Router) — types flow naturally
export default async function ProductPage({ params }: { params: { id: string } }) {
  const [product, reviews] = await Promise.all([
    fetchJson<Product>(`/api/products/${params.id}`),
    fetchJson<Review[]>(`/api/products/${params.id}/reviews`),
  ]);

  return <ProductDetail product={product} reviews={reviews} />;
}

// Generic fetch helper with runtime validation
async function fetchJson<T>(url: string, schema?: z.ZodType<T>): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return schema ? schema.parse(data) : data as T;
}
```

---

### S13: Monorepo type sharing strategy

**Scenario:** You have a monorepo with a Next.js frontend, Node.js API, and shared mobile app. How do you share types?

**Answer:**
1. **Shared package** — `packages/types/` or `packages/shared/` with its own `tsconfig.json`.
2. **Export Zod schemas + inferred types** — runtime validation + compile-time types.
3. **API contract package** — define request/response types per endpoint.
4. Use **TypeScript project references** (`composite: true`) for incremental builds.
5. **Turborepo/Nx** for build orchestration — types package builds first, consumers depend on it.
6. Consider **tRPC** — auto-generates client types from server router definition. Zero manual syncing.

---

### S14: Typing a database layer (Prisma/Drizzle)

**Scenario:** How do you maintain type safety from database schema to API response?

**Answer:**
- **Prisma**: Schema generates types automatically. `Prisma.UserCreateInput`, `Prisma.UserSelect`.
- **Drizzle**: Schema-as-code in TypeScript — types derived from table definitions.
- Pattern: **DB type → Service type → API response type** using `Pick`, `Omit`, and transforms.
  ```ts
  // DB model (generated)
  type UserRow = { id: string; name: string; passwordHash: string; createdAt: Date };

  // API response (derived — never expose passwordHash)
  type UserResponse = Omit<UserRow, "passwordHash"> & { createdAt: string };
  ```
- **Never return raw DB types to clients** — always map through a typed transformer.

---

### S15: Error handling strategy

**Scenario:** Design a type-safe error handling system across your full-stack app.

**Answer:**
```ts
// Result type — forces handling both success and failure
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Typed app errors
class AppError extends Error {
  constructor(
    public code: "NOT_FOUND" | "UNAUTHORIZED" | "VALIDATION" | "INTERNAL",
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

// Usage
async function getUser(id: string): Promise<Result<User, AppError>> {
  const user = await db.users.find(id);
  if (!user) return { success: false, error: new AppError("NOT_FOUND", 404, "User not found") };
  return { success: true, data: user };
}

// Consumer MUST check success before accessing data
const result = await getUser("123");
if (!result.success) {
  // result.error is AppError — fully typed
  return res.status(result.error.statusCode).json({ message: result.error.message });
}
// result.data is User — fully typed
```

---



