# TypeScript & React – Interview Cheat Sheet

> Quick, clear definitions for Team Lead (9+ yrs) interview prep.

---

## 1. TypeScript Basics

### What is TypeScript?
A **typed superset of JavaScript** by Microsoft. Catches errors at compile time, not runtime.

### Basic Types
| Type | Example |
|------|---------|
| `boolean` | `let done: boolean = false` |
| `number` | `let age: number = 30` |
| `string` | `let name: string = "John"` |
| `array` | `let list: number[] = [1,2,3]` |
| `tuple` | `let x: [string, number] = ["hi", 10]` |
| `enum` | `enum Color { Red, Green }` |
| `any` | Disables type checking — **avoid** |
| `unknown` | Safe `any` — must narrow before use |
| `never` | Function that never returns (throws/infinite loop) |
| `void` | Function returns nothing useful |

### `any` vs `unknown` vs `never`
- **`any`** → No checking. Escape hatch. Avoid it.
- **`unknown`** → Must check type before using. Safe alternative to `any`.
- **`never`** → Impossible value. Used for exhaustive checks.

### `type` vs `interface`
| Feature | `interface` | `type` |
|---------|------------|--------|
| Object shapes | ✅ | ✅ |
| Declaration merging | ✅ | ❌ |
| Unions / Intersections | ❌ | ✅ |
| Mapped / Computed types | ❌ | ✅ |

**Rule:** `interface` for objects & classes. `type` for everything else.

### `const` Assertions
Locks values to their **literal types** and makes them `readonly`.
```ts
const roles = ["admin", "user"] as const;
type Role = (typeof roles)[number]; // "admin" | "user"
```

---

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

## 3. Generics

### What Are Generics?
**Type parameters** that let you write reusable, type-safe code.
```ts
function identity<T>(arg: T): T { return arg; }
```

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

## 6. Advanced Patterns

### Declaration Files (`.d.ts`)
Type-only files that describe JS libraries without implementations.

### Declaration Merging
Adding fields to an existing interface (e.g., extending Express `Request`).

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

*Good luck with your interview! 🚀*
