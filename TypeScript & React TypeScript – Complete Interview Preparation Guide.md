# TypeScript & React TypeScript – Complete Interview Preparation Guide

> **For:** Team Lead – Full Stack Development (9+ years experience)
> **Focus:** TypeScript Core + React with TypeScript

---

## PART 1: TypeScript Core Concepts

---

### 1. TypeScript Basics

**Q1: What is TypeScript and why use it over JavaScript?**
TypeScript is a statically typed superset of JavaScript developed by Microsoft. It compiles to plain JavaScript. Benefits include early error detection, better IDE support, improved refactoring, self-documenting code, and scalability for large codebases.

**Q2: What are the basic types in TypeScript?**
```typescript
let isDone: boolean = false;
let age: number = 30;
let name: string = "John";
let list: number[] = [1, 2, 3];
let tuple: [string, number] = ["hello", 10];
let anything: any = "could be anything";
let unknown: unknown = 4;
let nothing: void = undefined;
let neverReturn: never; // function that never returns
let nullVal: null = null;
let undefinedVal: undefined = undefined;
```

**Q3: What is the difference between `any`, `unknown`, and `never`?**
- `any` — disables type checking entirely; avoid in production code
- `unknown` — type-safe counterpart of `any`; must narrow the type before using
- `never` — represents values that never occur (e.g., function that always throws)

```typescript
// unknown requires type narrowing
function processValue(val: unknown) {
  if (typeof val === "string") {
    console.log(val.toUpperCase()); // ✅ Safe
  }
}

// never — exhaustive check
type Shape = "circle" | "square";
function getArea(shape: Shape): number {
  switch (shape) {
    case "circle": return Math.PI * 10;
    case "square": return 100;
    default:
      const _exhaustive: never = shape; // Error if a case is missed
      return _exhaustive;
  }
}
```

**Q4: Explain `type` vs `interface`. When to use which?**
```typescript
// Interface — extendable, declaration merging
interface User {
  name: string;
  age: number;
}
interface User {
  email: string; // Declaration merging — User now has all 3 fields
}

// Type — unions, intersections, mapped types, primitives
type ID = string | number;
type Status = "active" | "inactive";
type ReadonlyUser = Readonly<User>;
```

**Rule of thumb:** Use `interface` for object shapes and class contracts. Use `type` for unions, intersections, mapped types, and when you need computed types.

**Q5: What is `enum` in TypeScript? Explain numeric and string enums.**
```typescript
// Numeric enum
enum Direction {
  Up = 0,
  Down = 1,
  Left = 2,
  Right = 3,
}

// String enum
enum Status {
  Active = "ACTIVE",
  Inactive = "INACTIVE",
  Pending = "PENDING",
}

// const enum — inlined at compile time (better performance)
const enum Color {
  Red = "RED",
  Blue = "BLUE",
}
```

**Q6: What are `const assertions` and why are they useful?**
```typescript
// Without const assertion
const config = { url: "/api", method: "GET" };
// type: { url: string; method: string }

// With const assertion
const config = { url: "/api", method: "GET" } as const;
// type: { readonly url: "/api"; readonly method: "GET" }

// Useful for literal types
const ROLES = ["admin", "user", "guest"] as const;
type Role = (typeof ROLES)[number]; // "admin" | "user" | "guest"
```

---

### 2. Advanced Types

**Q7: What are Union and Intersection types?**
```typescript
// Union — either type
type StringOrNumber = string | number;

// Intersection — combine types
type Employee = { name: string; empId: number };
type Manager = { department: string };
type ManagerEmployee = Employee & Manager;

const mgr: ManagerEmployee = {
  name: "Alice",
  empId: 101,
  department: "Engineering",
};
```

**Q8: Explain Literal Types and Template Literal Types.**
```typescript
// Literal types
type Direction = "north" | "south" | "east" | "west";
type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;

// Template literal types
type EventName = "click" | "scroll" | "mousemove";
type EventHandler = `on${Capitalize<EventName>}`;
// "onClick" | "onScroll" | "onMousemove"

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type ApiRoute = `/api/${string}`;
```

**Q9: What are Conditional Types?**
```typescript
type IsString<T> = T extends string ? "yes" : "no";

type A = IsString<string>;  // "yes"
type B = IsString<number>;  // "no"

// Practical example — extract return type
type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never;

type Fn = (x: number) => string;
type Result = ReturnOf<Fn>; // string
```

**Q10: Explain `infer` keyword in TypeScript.**
```typescript
// Extract element type from array
type ElementType<T> = T extends (infer U)[] ? U : never;
type A = ElementType<string[]>; // string

// Extract promise value
type UnwrapPromise<T> = T extends Promise<infer V> ? V : T;
type B = UnwrapPromise<Promise<number>>; // number

// Extract function parameters
type FirstParam<T> = T extends (first: infer P, ...args: any[]) => any ? P : never;
type C = FirstParam<(name: string, age: number) => void>; // string
```

**Q11: What are Mapped Types?**
```typescript
// Make all properties optional
type Partial<T> = { [K in keyof T]?: T[K] };

// Make all properties readonly
type Readonly<T> = { readonly [K in keyof T]: T[K] };

// Custom mapped type — make all values string
type Stringify<T> = { [K in keyof T]: string };

// Key remapping (TS 4.1+)
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface Person { name: string; age: number; }
type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number }
```

**Q12: Explain Discriminated Unions (Tagged Unions).**
```typescript
interface Circle {
  kind: "circle";
  radius: number;
}
interface Rectangle {
  kind: "rectangle";
  width: number;
  height: number;
}
interface Triangle {
  kind: "triangle";
  base: number;
  height: number;
}

type Shape = Circle | Rectangle | Triangle;

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return 0.5 * shape.base * shape.height;
  }
}
```

---

### 3. Generics

**Q13: What are Generics and why are they important?**
```typescript
// Without generics — loss of type info
function identity(arg: any): any { return arg; }

// With generics — preserves type
function identity<T>(arg: T): T { return arg; }

const num = identity<number>(42);    // number
const str = identity("hello");       // string (inferred)
```

**Q14: Explain Generic Constraints.**
```typescript
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(arg: T): T {
  console.log(arg.length);
  return arg;
}

logLength("hello");       // ✅ string has length
logLength([1, 2, 3]);     // ✅ array has length
logLength({ length: 5 }); // ✅ object with length
// logLength(42);          // ❌ number has no length

// keyof constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

**Q15: What are Generic Utility Types? Explain the most important ones.**
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// Partial<T> — all properties optional
type PartialUser = Partial<User>;

// Required<T> — all properties required
type RequiredUser = Required<PartialUser>;

// Pick<T, K> — select specific properties
type UserPreview = Pick<User, "id" | "name">;

// Omit<T, K> — exclude specific properties
type UserWithoutEmail = Omit<User, "email">;

// Record<K, T> — construct object type
type UserRoles = Record<string, "admin" | "user">;

// Exclude<T, U> — remove from union
type T1 = Exclude<"a" | "b" | "c", "a">; // "b" | "c"

// Extract<T, U> — extract from union
type T2 = Extract<"a" | "b" | "c", "a" | "f">; // "a"

// NonNullable<T>
type T3 = NonNullable<string | null | undefined>; // string

// ReturnType<T>
type T4 = ReturnType<() => string>; // string

// Parameters<T>
type T5 = Parameters<(a: number, b: string) => void>; // [number, string]
```

**Q16: Create a custom generic utility type — DeepPartial.**
```typescript
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

interface Config {
  database: {
    host: string;
    port: number;
    credentials: {
      username: string;
      password: string;
    };
  };
  server: {
    port: number;
  };
}

// All nested properties are now optional
const partial: DeepPartial<Config> = {
  database: {
    host: "localhost",
  },
};
```

---

### 4. Type Guards & Narrowing

**Q17: What are Type Guards? Explain different approaches.**
```typescript
// 1. typeof guard
function padLeft(value: string, padding: string | number) {
  if (typeof padding === "number") {
    return " ".repeat(padding) + value;
  }
  return padding + value;
}

// 2. instanceof guard
class Dog { bark() { return "woof"; } }
class Cat { meow() { return "meow"; } }

function speak(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark();
  } else {
    animal.meow();
  }
}

// 3. "in" operator guard
interface Fish { swim(): void; }
interface Bird { fly(): void; }

function move(animal: Fish | Bird) {
  if ("swim" in animal) {
    animal.swim();
  } else {
    animal.fly();
  }
}

// 4. Custom type guard (type predicate)
function isFish(animal: Fish | Bird): animal is Fish {
  return (animal as Fish).swim !== undefined;
}
```

**Q18: What is the `satisfies` operator (TS 4.9+)?**
```typescript
type Colors = "red" | "green" | "blue";
type RGB = [number, number, number];

// satisfies validates type WITHOUT widening
const palette = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
} satisfies Record<Colors, string | RGB>;

// palette.green is still typed as string (not string | RGB)
palette.green.toUpperCase(); // ✅ Works!
```

---

### 5. Classes & OOP in TypeScript

**Q19: Explain access modifiers in TypeScript classes.**
```typescript
class Employee {
  public name: string;           // accessible everywhere
  private salary: number;        // accessible only within class
  protected department: string;  // accessible within class & subclasses
  readonly id: number;           // cannot be modified after init

  constructor(name: string, salary: number, dept: string, id: number) {
    this.name = name;
    this.salary = salary;
    this.department = dept;
    this.id = id;
  }
}

// Shorthand constructor
class Employee {
  constructor(
    public name: string,
    private salary: number,
    protected department: string,
    readonly id: number
  ) {}
}
```

**Q20: What are Abstract Classes vs Interfaces?**
```typescript
// Abstract class — can have implementation
abstract class Shape {
  abstract area(): number;         // must be implemented
  describe(): string {             // shared implementation
    return `This shape has area ${this.area()}`;
  }
}

class Circle extends Shape {
  constructor(private radius: number) { super(); }
  area(): number { return Math.PI * this.radius ** 2; }
}

// Interface — purely structural contract
interface Printable {
  print(): void;
}

// A class can implement multiple interfaces but extend only one class
class Report extends Shape implements Printable {
  area() { return 0; }
  print() { console.log(this.describe()); }
}
```

**Q21: Explain Generics in Classes.**
```typescript
class DataStore<T> {
  private items: T[] = [];

  add(item: T): void { this.items.push(item); }
  get(index: number): T { return this.items[index]; }
  getAll(): T[] { return [...this.items]; }
  remove(predicate: (item: T) => boolean): T[] {
    this.items = this.items.filter((item) => !predicate(item));
    return this.items;
  }
}

const userStore = new DataStore<{ id: number; name: string }>();
userStore.add({ id: 1, name: "Alice" });
```

---

### 6. Advanced Patterns & Techniques

**Q22: What are Declaration Files (.d.ts)?**
Declaration files provide type information for JavaScript libraries that don't have built-in types. They contain only type declarations without implementations.

```typescript
// globals.d.ts
declare const API_URL: string;
declare function fetchData(url: string): Promise<any>;

// For a JS module — types/mylib.d.ts
declare module "mylib" {
  export function doSomething(input: string): number;
  export interface Config {
    debug: boolean;
  }
}
```

**Q23: Explain Module Augmentation and Declaration Merging.**
```typescript
// Augmenting Express Request
declare module "express" {
  interface Request {
    user?: {
      id: string;
      role: string;
    };
  }
}

// Now you can use req.user in Express handlers
app.get("/profile", (req, res) => {
  console.log(req.user?.id); // ✅ TypeScript knows about this
});
```

**Q24: What are Decorators in TypeScript?**
```typescript
// Class decorator
function Logger(constructor: Function) {
  console.log(`Creating instance of ${constructor.name}`);
}

// Method decorator
function Log(target: any, key: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function (...args: any[]) {
    console.log(`Calling ${key} with`, args);
    return original.apply(this, args);
  };
}

@Logger
class UserService {
  @Log
  getUser(id: number) {
    return { id, name: "Alice" };
  }
}
```

**Q25: Explain Branded / Nominal Types.**
```typescript
// Problem: both are strings but semantically different
type UserId = string & { __brand: "UserId" };
type OrderId = string & { __brand: "OrderId" };

function createUserId(id: string): UserId {
  return id as UserId;
}
function createOrderId(id: string): OrderId {
  return id as OrderId;
}

function getUser(id: UserId) { /* ... */ }

const userId = createUserId("user_123");
const orderId = createOrderId("order_456");

getUser(userId);   // ✅
// getUser(orderId); // ❌ Type error!
```

**Q26: What is Variance in TypeScript? Explain covariance and contravariance.**
```typescript
// Covariance — subtype can be used where supertype is expected (output position)
// Contravariance — supertype can be used where subtype is expected (input position)

interface Animal { name: string; }
interface Dog extends Animal { breed: string; }

// Covariant (return types)
type Producer<T> = () => T;
let produceDog: Producer<Dog> = () => ({ name: "Rex", breed: "Lab" });
let produceAnimal: Producer<Animal> = produceDog; // ✅ Dog extends Animal

// Contravariant (parameter types — strict mode)
type Consumer<T> = (item: T) => void;
let consumeAnimal: Consumer<Animal> = (a) => console.log(a.name);
let consumeDog: Consumer<Dog> = consumeAnimal; // ✅ in strict
```

**Q27: How does TypeScript handle Async/Await typing?**
```typescript
// Return type is automatically Promise<T>
async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
}

// Typed error handling
async function safeFetch<T>(url: string): Promise<[T, null] | [null, Error]> {
  try {
    const res = await fetch(url);
    const data: T = await res.json();
    return [data, null];
  } catch (err) {
    return [null, err instanceof Error ? err : new Error(String(err))];
  }
}

const [user, error] = await safeFetch<User>("/api/user/1");
if (error) console.error(error);
else console.log(user.name);
```

---

### 7. TypeScript Configuration & Tooling

**Q28: Explain important `tsconfig.json` options.**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**Q29: What does `strict: true` enable?**
It enables all strict type-checking options:
- `strictNullChecks` — null/undefined are separate types
- `strictFunctionTypes` — strict function parameter checking
- `strictBindCallApply` — strict bind/call/apply
- `strictPropertyInitialization` — class properties must be initialized
- `noImplicitAny` — error on implicit `any`
- `noImplicitThis` — error on implicit `this`
- `alwaysStrict` — emits "use strict"
- `useUnknownInCatchVariables` — catch variables are `unknown`

---

## PART 2: React with TypeScript

---

### 8. Component Typing

**Q30: How do you type Functional Components in React?**
```tsx
// Approach 1: Inline props type (PREFERRED)
function Greeting({ name, age }: { name: string; age: number }) {
  return <h1>Hello, {name}! You are {age}.</h1>;
}

// Approach 2: Separate interface
interface GreetingProps {
  name: string;
  age: number;
  greeting?: string; // optional prop
}

function Greeting({ name, age, greeting = "Hello" }: GreetingProps) {
  return <h1>{greeting}, {name}! You are {age}.</h1>;
}

// Approach 3: React.FC (less preferred but common)
const Greeting: React.FC<GreetingProps> = ({ name, age }) => {
  return <h1>Hello, {name}!</h1>;
};
```

**Q31: How do you type `children` in React TypeScript?**
```tsx
// Option 1: React.ReactNode (most flexible)
interface CardProps {
  title: string;
  children: React.ReactNode;
}

// Option 2: React.PropsWithChildren
type CardProps = React.PropsWithChildren<{ title: string }>;

// Option 3: Specific children type
interface ListProps {
  children: React.ReactElement<ListItemProps>[];
}

// Option 4: Render props pattern
interface DataFetcherProps<T> {
  url: string;
  children: (data: T, loading: boolean) => React.ReactNode;
}
```

**Q32: How do you type Props with Discriminated Unions?**
```tsx
// Button that behaves differently based on variant
type ButtonProps =
  | { variant: "link"; href: string; onClick?: never }
  | { variant: "button"; onClick: () => void; href?: never }
  | { variant: "submit"; formId: string; onClick?: never; href?: never };

function ActionButton(props: ButtonProps) {
  switch (props.variant) {
    case "link":
      return <a href={props.href}>Link</a>;
    case "button":
      return <button onClick={props.onClick}>Button</button>;
    case "submit":
      return <button type="submit" form={props.formId}>Submit</button>;
  }
}

// Usage
<ActionButton variant="link" href="/home" />
<ActionButton variant="button" onClick={() => alert("hi")} />
```

---

### 9. Hooks with TypeScript

**Q33: How do you type `useState`?**
```tsx
// Auto-inferred
const [count, setCount] = useState(0); // number

// Explicit type needed for complex/nullable state
const [user, setUser] = useState<User | null>(null);

// Union state
type Status = "idle" | "loading" | "success" | "error";
const [status, setStatus] = useState<Status>("idle");

// Array state
const [items, setItems] = useState<string[]>([]);
```

**Q34: How do you type `useRef`?**
```tsx
// DOM reference (initially null, React manages it)
const inputRef = useRef<HTMLInputElement>(null);

// Later: inputRef.current?.focus();

// Mutable value (not managed by React)
const intervalRef = useRef<number | null>(null);
intervalRef.current = window.setInterval(() => {}, 1000);

// Key difference:
// useRef<T>(null)     → RefObject<T>    (readonly .current)
// useRef<T | null>(null) → MutableRefObject<T | null>
```

**Q35: How do you type `useReducer`?**
```tsx
interface State {
  count: number;
  error: string | null;
}

type Action =
  | { type: "increment" }
  | { type: "decrement" }
  | { type: "reset"; payload: number }
  | { type: "setError"; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "increment":
      return { ...state, count: state.count + 1 };
    case "decrement":
      return { ...state, count: state.count - 1 };
    case "reset":
      return { ...state, count: action.payload, error: null };
    case "setError":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

const [state, dispatch] = useReducer(reducer, { count: 0, error: null });
dispatch({ type: "increment" });
dispatch({ type: "reset", payload: 0 });
```

**Q36: How do you type `useContext`?**
```tsx
interface AuthContextType {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook with type safety
function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Provider
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const value: AuthContextType = {
    user,
    login: async (creds) => { /* ... */ },
    logout: () => setUser(null),
    isAuthenticated: user !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

**Q37: How do you type custom hooks?**
```tsx
// Hook with generic return
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: T = await res.json();
        setData(json);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, [url]);

  return { data, loading, error } as const;
}

// Usage
const { data, loading } = useFetch<User[]>("/api/users");
```

**Q38: How do you type `useCallback` and `useMemo`?**
```tsx
// useCallback — type is inferred from the function
const handleClick = useCallback((id: number) => {
  console.log(`Clicked ${id}`);
}, []);

// Explicit typing when needed
const handleSubmit = useCallback<(e: React.FormEvent) => void>((e) => {
  e.preventDefault();
}, []);

// useMemo — return type inferred
const expensiveValue = useMemo(() => {
  return items.filter((item) => item.active).map((item) => item.name);
}, [items]);

// Explicit
const sorted = useMemo<User[]>(() => {
  return [...users].sort((a, b) => a.name.localeCompare(b.name));
}, [users]);
```

---

### 10. Event Handling

**Q39: How do you type Event Handlers in React?**
```tsx
// Mouse events
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  console.log(e.currentTarget.name);
};

// Change events
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  console.log(e.target.value);
};

// Form events
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

// Keyboard events
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter") { /* ... */ }
};

// Focus events
const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {};

// Drag events
const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {};

// Inline typing
<input
  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
  onKeyDown={(e) => { /* auto-inferred when inline */ }}
/>
```

---

### 11. Advanced React + TypeScript Patterns

**Q40: How do you create Generic React Components?**
```tsx
interface TableProps<T> {
  data: T[];
  columns: {
    key: keyof T;
    header: string;
    render?: (value: T[keyof T], item: T) => React.ReactNode;
  }[];
  onRowClick?: (item: T) => void;
}

function Table<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
}: TableProps<T>) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col.key)}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, i) => (
          <tr key={i} onClick={() => onRowClick?.(item)}>
            {columns.map((col) => (
              <td key={String(col.key)}>
                {col.render
                  ? col.render(item[col.key], item)
                  : String(item[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Usage — T is inferred from data
<Table
  data={users}
  columns={[
    { key: "name", header: "Name" },
    { key: "age", header: "Age" },
    { key: "email", header: "Email", render: (v) => <a href={`mailto:${v}`}>{String(v)}</a> },
  ]}
  onRowClick={(user) => console.log(user.name)}
/>
```

**Q41: How do you type Higher-Order Components (HOCs)?**
```tsx
interface WithLoadingProps {
  loading: boolean;
}

function withLoading<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithLoadingComponent(props: P & WithLoadingProps) {
    const { loading, ...restProps } = props;

    if (loading) return <div>Loading...</div>;
    return <WrappedComponent {...(restProps as P)} />;
  };
}

// Usage
interface UserListProps {
  users: User[];
}

const UserList: React.FC<UserListProps> = ({ users }) => (
  <ul>{users.map((u) => <li key={u.id}>{u.name}</li>)}</ul>
);

const UserListWithLoading = withLoading(UserList);
<UserListWithLoading users={users} loading={isLoading} />
```

**Q42: How do you type Render Props pattern?**
```tsx
interface RenderProps<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface DataFetcherProps<T> {
  url: string;
  children: (props: RenderProps<T | null>) => React.ReactNode;
}

function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(() => { /* ... */ }, [url]);

  return <>{children({ data, loading, error, refetch })}</>;
}

// Usage
<DataFetcher<User[]> url="/api/users">
  {({ data, loading }) =>
    loading ? <Spinner /> : <UserList users={data ?? []} />
  }
</DataFetcher>
```

**Q43: Explain the Polymorphic Component Pattern (`as` prop).**
```tsx
type PolymorphicProps<E extends React.ElementType, P = {}> = P &
  Omit<React.ComponentPropsWithoutRef<E>, keyof P> & {
    as?: E;
  };

type TextProps<E extends React.ElementType> = PolymorphicProps<
  E,
  { color?: "primary" | "secondary"; size?: "sm" | "md" | "lg" }
>;

function Text<E extends React.ElementType = "span">({
  as,
  color = "primary",
  size = "md",
  children,
  ...restProps
}: TextProps<E>) {
  const Component = as || "span";
  return <Component {...restProps}>{children}</Component>;
}

// Usage
<Text>Default span</Text>
<Text as="h1" size="lg">Heading</Text>
<Text as="a" href="/home" color="secondary">Link</Text>
```

**Q44: How do you type Forwarded Refs?**
```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => (
    <div>
      <label>{label}</label>
      <input ref={ref} {...props} />
      {error && <span>{error}</span>}
    </div>
  )
);

Input.displayName = "Input";

// Usage
const inputRef = useRef<HTMLInputElement>(null);
<Input ref={inputRef} label="Email" type="email" />
```

---

### 12. State Management with TypeScript

**Q45: How do you type Redux Toolkit with TypeScript?**
```tsx
import { createSlice, PayloadAction, configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

// Slice
interface TodoState {
  items: Todo[];
  filter: "all" | "active" | "completed";
  loading: boolean;
}

const initialState: TodoState = {
  items: [],
  filter: "all",
  loading: false,
};

const todoSlice = createSlice({
  name: "todos",
  initialState,
  reducers: {
    addTodo: (state, action: PayloadAction<string>) => {
      state.items.push({ id: Date.now(), text: action.payload, done: false });
    },
    toggleTodo: (state, action: PayloadAction<number>) => {
      const todo = state.items.find((t) => t.id === action.payload);
      if (todo) todo.done = !todo.done;
    },
    setFilter: (state, action: PayloadAction<TodoState["filter"]>) => {
      state.filter = action.payload;
    },
  },
});

// Store
const store = configureStore({
  reducer: { todos: todoSlice.reducer },
});

// Typed hooks
type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Usage in component
function TodoList() {
  const todos = useAppSelector((state) => state.todos.items);
  const dispatch = useAppDispatch();

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id} onClick={() => dispatch(todoSlice.actions.toggleTodo(todo.id))}>
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
```

**Q46: How do you type Zustand store?**
```tsx
import { create } from "zustand";

interface BearState {
  bears: number;
  increase: (by: number) => void;
  reset: () => void;
  fetchBears: () => Promise<void>;
}

const useBearStore = create<BearState>((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
  reset: () => set({ bears: 0 }),
  fetchBears: async () => {
    const response = await fetch("/api/bears");
    const data = await response.json();
    set({ bears: data.count });
  },
}));

// Usage
function BearCounter() {
  const bears = useBearStore((state) => state.bears);
  const increase = useBearStore((state) => state.increase);
  return <button onClick={() => increase(1)}>Bears: {bears}</button>;
}
```

---

### 13. API Integration & Data Fetching

**Q47: How do you type API responses and Axios interceptors?**
```tsx
// Typed API response
interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

// Typed API service
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

// Typed interceptor
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Typed API functions
async function getUsers(): Promise<ApiResponse<User[]>> {
  const { data } = await api.get<ApiResponse<User[]>>("/users");
  return data;
}

async function createUser(payload: Omit<User, "id">): Promise<ApiResponse<User>> {
  const { data } = await api.post<ApiResponse<User>>("/users", payload);
  return data;
}
```

**Q48: How do you type React Query (TanStack Query)?**
```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Typed query
function useUsers() {
  return useQuery<User[], Error>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });
}

// Typed mutation
function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation<User, Error, Omit<User, "id">>({
    mutationFn: async (newUser) => {
      const res = await fetch("/api/users", {
        method: "POST",
        body: JSON.stringify(newUser),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// Usage
function UserPage() {
  const { data: users, isLoading, error } = useUsers();
  const createUser = useCreateUser();

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {users?.map((u) => <UserCard key={u.id} user={u} />)}
      <button onClick={() => createUser.mutate({ name: "New", email: "new@test.com" })}>
        Add User
      </button>
    </div>
  );
}
```

---

### 14. Forms & Validation

**Q49: How do you type React Hook Form?**
```tsx
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Zod schema
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  age: z.number().min(18, "Must be 18+").max(120),
  role: z.enum(["admin", "user", "editor"]),
  bio: z.string().optional(),
});

// Infer type from schema
type UserFormData = z.infer<typeof userSchema>;

function UserForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      age: 18,
      role: "user",
    },
  });

  const onSubmit: SubmitHandler<UserFormData> = async (data) => {
    await createUser(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name")} />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register("email")} />
      {errors.email && <span>{errors.email.message}</span>}

      <input {...register("age", { valueAsNumber: true })} type="number" />
      {errors.age && <span>{errors.age.message}</span>}

      <select {...register("role")}>
        <option value="user">User</option>
        <option value="admin">Admin</option>
        <option value="editor">Editor</option>
      </select>

      <button type="submit" disabled={isSubmitting}>Submit</button>
    </form>
  );
}
```

---

### 15. Testing with TypeScript

**Q50: How do you type tests in React Testing Library?**
```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Typed render helper
function renderWithProviders(
  ui: React.ReactElement,
  options?: { initialState?: Partial<RootState> }
) {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: options?.initialState,
  });

  return {
    ...render(<Provider store={store}>{ui}</Provider>),
    store,
  };
}

// Typed test
describe("UserForm", () => {
  it("submits form data correctly", async () => {
    const mockSubmit = vi.fn<[UserFormData], void>();
    render(<UserForm onSubmit={mockSubmit} />);

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/name/i), "Alice");
    await user.type(screen.getByLabelText(/email/i), "alice@test.com");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Alice",
          email: "alice@test.com",
        })
      );
    });
  });
});
```

---

### 16. Performance & Optimization

**Q51: How does TypeScript help with React performance patterns?**
```tsx
// Typed React.memo with generic
function memo<T extends object>(
  Component: React.FC<T>,
  areEqual?: (prev: T, next: T) => boolean
) {
  return React.memo(Component, areEqual);
}

// Typed lazy loading
const Dashboard = React.lazy<React.ComponentType<DashboardProps>>(
  () => import("./Dashboard")
);

// Typed React.memo with custom comparison
interface ExpensiveListProps {
  items: Item[];
  onItemClick: (id: number) => void;
}

const ExpensiveList = React.memo<ExpensiveListProps>(
  ({ items, onItemClick }) => (
    <ul>
      {items.map((item) => (
        <li key={item.id} onClick={() => onItemClick(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  ),
  (prev, next) => {
    return (
      prev.items.length === next.items.length &&
      prev.items.every((item, i) => item.id === next.items[i].id)
    );
  }
);
```

---

### 17. Routing with TypeScript

**Q52: How do you type React Router v6?**
```tsx
import {
  createBrowserRouter,
  RouterProvider,
  useParams,
  useSearchParams,
  useNavigate,
  LoaderFunctionArgs,
} from "react-router-dom";

// Typed params
function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") as "profile" | "settings" | null;

  return <div>User: {userId}, Tab: {tab}</div>;
}

// Typed loader
interface UserLoaderData { user: User; posts: Post[]; }

async function userLoader({ params }: LoaderFunctionArgs): Promise<UserLoaderData> {
  const [user, posts] = await Promise.all([
    fetchUser(params.userId!),
    fetchPosts(params.userId!),
  ]);
  return { user, posts };
}

// Typed router config
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "users/:userId", element: <UserProfile />, loader: userLoader },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
```

---

### 18. Quick-Fire Interview Questions

**Q53:** What is the difference between `type` and `interface`?
→ Interfaces support declaration merging and `extends`; types support unions, intersections, mapped types, and computed keys.

**Q54:** What is `keyof` operator?
→ Produces a union of all property names of a type: `keyof User` → `"id" | "name" | "email"`.

**Q55:** What is `typeof` in type context?
→ Extracts the type of a value: `const config = {...}; type Config = typeof config;`

**Q56:** What are Index Signatures?
→ `{ [key: string]: number }` — allows any string key with number values.

**Q57:** What is the `Readonly` utility and `ReadonlyArray`?
→ Makes all properties readonly; `ReadonlyArray<T>` prevents push/pop/splice on arrays.

**Q58:** What is `Awaited<T>`?
→ Recursively unwraps Promise types: `Awaited<Promise<Promise<string>>>` → `string`.

**Q59:** Can you use `string` enums as object keys?
→ Yes, using `Record<MyEnum, ValueType>` or mapped types.

**Q60:** What is the difference between `undefined` and `void`?
→ `void` means a function doesn't return a useful value (may return undefined). `undefined` is a specific value.

---

### 19. Scenario-Based / Leadership Questions

**Q61: How would you migrate a large JavaScript codebase to TypeScript?**
1. Add TypeScript incrementally — rename `.js` to `.ts` file by file
2. Start with `strict: false`, enable strict checks one by one
3. Use `// @ts-ignore` or `any` temporarily for complex areas
4. Prioritize shared modules, utilities, and API layers first
5. Add `.d.ts` files for third-party JS without types
6. Set up CI to ensure no new `.js` files are added
7. Track progress with a migration dashboard

**Q62: How do you enforce TypeScript best practices in a team?**
- ESLint with `@typescript-eslint` plugin
- Strict `tsconfig.json` shared across the monorepo
- Pre-commit hooks (Husky + lint-staged)
- CI checks that block on type errors
- Shared utility types library
- Code review guidelines for TypeScript patterns
- Regular knowledge-sharing sessions

**Q63: How do you handle third-party libraries without TypeScript types?**
1. Check DefinitelyTyped: `npm i -D @types/libraryname`
2. If unavailable, create a local `.d.ts` declaration file
3. Use `declare module "library"` for quick untyped escape hatch
4. Contribute types back to DefinitelyTyped if possible

---

### 20. Common Mistakes to Avoid

| Mistake | Better Approach |
|---|---|
| Using `any` everywhere | Use `unknown` + type guards |
| `as` type assertions | Use type narrowing instead |
| Not using `strict: true` | Always enable strict mode |
| Ignoring `null`/`undefined` | Use optional chaining `?.` and nullish coalescing `??` |
| Over-engineering types | Keep types simple; extract when reused |
| Not typing API responses | Create shared API response interfaces |
| Using `React.FC` blindly | Prefer direct function with typed props |
| Not using discriminated unions | Model state with tagged unions |
| Mutable state objects | Use `Readonly<T>` and `as const` |
| Ignoring generic constraints | Always constrain generics appropriately |

---

> **Tip:** Practice typing real-world patterns — API layers, form handling, state management, and component libraries. Interviewers at the Team Lead level expect you to explain **when and why** to use a pattern, not just the syntax.

Good luck with your interview! 🚀
