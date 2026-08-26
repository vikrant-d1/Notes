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
