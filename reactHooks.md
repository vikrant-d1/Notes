# React Hooks — `useContext` & `useReducer`

---

## Table of Contents

1. [useContext](#usecontext)
   - [Definition](#definition)
   - [How It Works](#how-it-works)
   - [Code Examples](#usecontext-code-examples)
2. [useReducer](#usereducer)
   - [Definition](#definition-1)
   - [How It Works](#how-it-works-1)
   - [Code Examples](#usereducer-code-examples)
3. [Combining useContext + useReducer](#combining-usecontext--usereducer)

---

# useContext

## Definition

`useContext` is a React hook that lets you **read and consume values from a Context** without wrapping components in a `Consumer`. It solves the **prop drilling** problem — where you pass data through many intermediate components that don't actually need it — by providing a way to share values globally across a component tree.

### Syntax

```jsx
const value = useContext(SomeContext);
```

| Parameter     | Description                                                        |
| ------------- | ------------------------------------------------------------------ |
| `SomeContext` | The context object created with `React.createContext(defaultValue)` |

**Returns:** The current context value, determined by the nearest `<SomeContext.Provider>` above the calling component in the tree.

---

## How It Works

1. **Create** a context with `createContext()`.
2. **Provide** a value by wrapping a part of the tree with `<Context.Provider value={...}>`.
3. **Consume** the value in any descendant component using `useContext(Context)`.

```
App (Provider)
 ├── Header
 │    └── UserGreeting  ← useContext(UserContext) ✅
 ├── Sidebar
 │    └── UserAvatar    ← useContext(UserContext) ✅
 └── Footer
```

No props passed through `Header` or `Sidebar` — descendants access the value directly.

---

## useContext Code Examples

### 1. Basic Usage — Theme Toggle

```jsx
import { createContext, useContext, useState } from "react";

// Step 1: Create a Context
const ThemeContext = createContext("light");

// Step 2: Consumer Component
function ThemedButton() {
  const theme = useContext(ThemeContext);

  const styles = {
    backgroundColor: theme === "dark" ? "#333" : "#fff",
    color: theme === "dark" ? "#fff" : "#333",
    padding: "10px 20px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
  };

  return <button style={styles}>I am {theme} themed</button>;
}

// Step 3: Provider in Parent
function App() {
  const [theme, setTheme] = useState("light");

  return (
    <ThemeContext.Provider value={theme}>
      <ThemedButton />
      <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
        Toggle Theme
      </button>
    </ThemeContext.Provider>
  );
}
```

`ThemedButton` reads the current theme **without receiving it as a prop**.

---

### 2. Sharing User Authentication State

```jsx
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

// Custom hook for cleaner access
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (username) => setUser({ name: username });
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Consumer Components
function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav>
      {user ? (
        <span>
          Welcome, {user.name}! <button onClick={logout}>Logout</button>
        </span>
      ) : (
        <span>Please log in.</span>
      )}
    </nav>
  );
}

function LoginPage() {
  const { login } = useAuth();

  return <button onClick={() => login("Alice")}>Login as Alice</button>;
}

// App
function App() {
  return (
    <AuthProvider>
      <Navbar />
      <LoginPage />
    </AuthProvider>
  );
}
```

Any component inside `<AuthProvider>` can call `useAuth()` to access or modify the authentication state.

---

### 3. Multi-Language / i18n Support

```jsx
import { createContext, useContext, useState } from "react";

const translations = {
  en: { greeting: "Hello", farewell: "Goodbye" },
  es: { greeting: "Hola", farewell: "Adiós" },
  fr: { greeting: "Bonjour", farewell: "Au revoir" },
};

const LanguageContext = createContext();

function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

function Greeting() {
  const { t } = useContext(LanguageContext);
  return <h1>{t.greeting}!</h1>;
}

function LanguageSwitcher() {
  const { lang, setLang } = useContext(LanguageContext);

  return (
    <select value={lang} onChange={(e) => setLang(e.target.value)}>
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="fr">Français</option>
    </select>
  );
}

function App() {
  return (
    <LanguageProvider>
      <LanguageSwitcher />
      <Greeting />
    </LanguageProvider>
  );
}
```

---

### When NOT to Use `useContext`

- **Frequently changing values** (e.g., mouse position, scroll offset) — every consumer re-renders on every change.
- **Data needed by only 1–2 components** — regular props are simpler.
- **Complex state logic** — pair `useContext` with `useReducer` instead of stuffing logic into the provider (see the combined example below).

---

---

# useReducer

## Definition

`useReducer` is a React hook for managing **complex state logic**. It works like `useState` but uses a **reducer function** — a pure function that takes the current state and an action, then returns a new state. It is inspired by the Redux pattern and is ideal when the next state depends on the previous one, or when multiple related state values need to update together.

### Syntax

```jsx
const [state, dispatch] = useReducer(reducer, initialState, init?);
```

| Parameter      | Description                                                              |
| -------------- | ------------------------------------------------------------------------ |
| `reducer`      | A function `(state, action) => newState` that computes the next state.   |
| `initialState` | The starting value of the state.                                         |
| `init`         | *(Optional)* A lazy initializer function: `(initialState) => computed`.  |

**Returns:** `[state, dispatch]` — the current state and a function to send actions to the reducer.

---

## How It Works

```
Component dispatches an action
        │
        ▼
┌──────────────────────┐
│   reducer(state, action)   │
│   → returns new state      │
└──────────────────────┘
        │
        ▼
Component re-renders with new state
```

An **action** is typically an object with a `type` property (and optional payload):

```jsx
dispatch({ type: "INCREMENT" });
dispatch({ type: "ADD_TODO", payload: { text: "Learn hooks" } });
```

---

## useReducer Code Examples

### 1. Basic Counter

```jsx
import { useReducer } from "react";

const initialState = { count: 0 };

function reducer(state, action) {
  switch (action.type) {
    case "INCREMENT":
      return { count: state.count + 1 };
    case "DECREMENT":
      return { count: state.count - 1 };
    case "RESET":
      return initialState;
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div>
      <h2>Count: {state.count}</h2>
      <button onClick={() => dispatch({ type: "INCREMENT" })}>+</button>
      <button onClick={() => dispatch({ type: "DECREMENT" })}>−</button>
      <button onClick={() => dispatch({ type: "RESET" })}>Reset</button>
    </div>
  );
}
```

---

### 2. Todo List

```jsx
import { useReducer, useState } from "react";

const initialTodos = [];

function todoReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return [
        ...state,
        { id: Date.now(), text: action.payload, completed: false },
      ];
    case "TOGGLE":
      return state.map((todo) =>
        todo.id === action.payload
          ? { ...todo, completed: !todo.completed }
          : todo
      );
    case "DELETE":
      return state.filter((todo) => todo.id !== action.payload);
    case "CLEAR_COMPLETED":
      return state.filter((todo) => !todo.completed);
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

function TodoApp() {
  const [todos, dispatch] = useReducer(todoReducer, initialTodos);
  const [text, setText] = useState("");

  const handleAdd = () => {
    if (text.trim()) {
      dispatch({ type: "ADD", payload: text.trim() });
      setText("");
    }
  };

  return (
    <div>
      <h2>Todo List ({todos.filter((t) => !t.completed).length} remaining)</h2>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        placeholder="Add a todo..."
      />
      <button onClick={handleAdd}>Add</button>

      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <span
              onClick={() => dispatch({ type: "TOGGLE", payload: todo.id })}
              style={{
                textDecoration: todo.completed ? "line-through" : "none",
                cursor: "pointer",
              }}
            >
              {todo.text}
            </span>
            <button
              onClick={() => dispatch({ type: "DELETE", payload: todo.id })}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <button onClick={() => dispatch({ type: "CLEAR_COMPLETED" })}>
        Clear Completed
      </button>
    </div>
  );
}
```

---

### 3. Form with Multiple Fields

```jsx
import { useReducer } from "react";

const initialForm = {
  name: "",
  email: "",
  age: "",
  errors: {},
};

function formReducer(state, action) {
  switch (action.type) {
    case "UPDATE_FIELD":
      return {
        ...state,
        [action.field]: action.value,
        errors: { ...state.errors, [action.field]: "" },
      };
    case "SET_ERRORS":
      return { ...state, errors: action.payload };
    case "RESET":
      return initialForm;
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

function RegistrationForm() {
  const [state, dispatch] = useReducer(formReducer, initialForm);

  const validate = () => {
    const errors = {};
    if (!state.name) errors.name = "Name is required";
    if (!state.email.includes("@")) errors.email = "Invalid email";
    if (Number(state.age) < 18) errors.age = "Must be 18 or older";
    return errors;
  };

  const handleSubmit = () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      dispatch({ type: "SET_ERRORS", payload: errors });
    } else {
      alert(`Submitted: ${state.name}, ${state.email}, age ${state.age}`);
      dispatch({ type: "RESET" });
    }
  };

  return (
    <div>
      <h2>Registration</h2>

      <input
        placeholder="Name"
        value={state.name}
        onChange={(e) =>
          dispatch({ type: "UPDATE_FIELD", field: "name", value: e.target.value })
        }
      />
      {state.errors.name && <p style={{ color: "red" }}>{state.errors.name}</p>}

      <input
        placeholder="Email"
        value={state.email}
        onChange={(e) =>
          dispatch({ type: "UPDATE_FIELD", field: "email", value: e.target.value })
        }
      />
      {state.errors.email && <p style={{ color: "red" }}>{state.errors.email}</p>}

      <input
        placeholder="Age"
        type="number"
        value={state.age}
        onChange={(e) =>
          dispatch({ type: "UPDATE_FIELD", field: "age", value: e.target.value })
        }
      />
      {state.errors.age && <p style={{ color: "red" }}>{state.errors.age}</p>}

      <button onClick={handleSubmit}>Submit</button>
      <button onClick={() => dispatch({ type: "RESET" })}>Reset</button>
    </div>
  );
}
```

Using `useReducer` here keeps all form state transitions in one place instead of managing three separate `useState` calls.

---

### 4. Lazy Initialization

```jsx
import { useReducer } from "react";

function init(initialCount) {
  // Expensive computation or data loading
  return { count: initialCount };
}

function reducer(state, action) {
  switch (action.type) {
    case "INCREMENT":
      return { count: state.count + 1 };
    case "RESET":
      return init(action.payload);
    default:
      throw new Error();
  }
}

function Counter({ initialCount = 0 }) {
  const [state, dispatch] = useReducer(reducer, initialCount, init);

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: "INCREMENT" })}>+</button>
      <button onClick={() => dispatch({ type: "RESET", payload: initialCount })}>
        Reset
      </button>
    </div>
  );
}
```

The third argument (`init`) lets you **lazily compute** the initial state — useful when it involves expensive work.

---

### `useState` vs `useReducer`

| Feature             | `useState`                         | `useReducer`                              |
| ------------------- | ---------------------------------- | ----------------------------------------- |
| Best for            | Simple, independent values         | Complex or related state                  |
| Update style        | Direct setter `setState(newVal)`   | Dispatch actions `dispatch({ type })` |
| State transitions   | Inline                             | Centralized in a reducer function         |
| Testability         | Harder to test in isolation        | Reducer is a pure function — easy to test |
| Boilerplate         | Minimal                            | More setup, but scales better             |

---

---

# Combining `useContext` + `useReducer`

This is a powerful pattern for **app-wide state management** without external libraries. `useReducer` handles the state logic, and `useContext` makes it accessible everywhere.

```jsx
import { createContext, useContext, useReducer } from "react";

// --- Context & Reducer Setup ---

const CartContext = createContext();

const initialState = { items: [], totalPrice: 0 };

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.id === action.payload.id);
      let updatedItems;
      if (existing) {
        updatedItems = state.items.map((i) =>
          i.id === action.payload.id ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        updatedItems = [...state.items, { ...action.payload, qty: 1 }];
      }
      return {
        items: updatedItems,
        totalPrice: updatedItems.reduce((sum, i) => sum + i.price * i.qty, 0),
      };
    }
    case "REMOVE_ITEM": {
      const updatedItems = state.items.filter((i) => i.id !== action.payload);
      return {
        items: updatedItems,
        totalPrice: updatedItems.reduce((sum, i) => sum + i.price * i.qty, 0),
      };
    }
    case "CLEAR_CART":
      return initialState;
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

// --- Provider Component ---

function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

// --- Custom Hook ---

function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}

// --- Consumer Components ---

function ProductList() {
  const { dispatch } = useCart();

  const products = [
    { id: 1, name: "Laptop", price: 999 },
    { id: 2, name: "Phone", price: 699 },
    { id: 3, name: "Headphones", price: 199 },
  ];

  return (
    <div>
      <h2>Products</h2>
      {products.map((p) => (
        <div key={p.id}>
          <span>
            {p.name} — ${p.price}
          </span>
          <button onClick={() => dispatch({ type: "ADD_ITEM", payload: p })}>
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
}

function Cart() {
  const { state, dispatch } = useCart();

  return (
    <div>
      <h2>Cart ({state.items.length} items)</h2>
      {state.items.map((item) => (
        <div key={item.id}>
          <span>
            {item.name} × {item.qty} — ${item.price * item.qty}
          </span>
          <button
            onClick={() => dispatch({ type: "REMOVE_ITEM", payload: item.id })}
          >
            Remove
          </button>
        </div>
      ))}
      <h3>Total: ${state.totalPrice}</h3>
      <button onClick={() => dispatch({ type: "CLEAR_CART" })}>
        Clear Cart
      </button>
    </div>
  );
}

// --- App ---

function App() {
  return (
    <CartProvider>
      <ProductList />
      <Cart />
    </CartProvider>
  );
}
```

This gives you a **mini Redux-like setup** using only built-in React hooks — no extra dependencies needed.

# React `useCallback` Hook

## Definition

`useCallback` is a React hook that **memoizes a function**, returning the same function reference between re-renders unless its dependencies change. It prevents unnecessary re-creation of functions on every render, which is useful for optimizing performance — especially when passing callbacks to child components wrapped in `React.memo`.

### Syntax

```jsx
const memoizedFn = useCallback(fn, [dependencies]);
```

| Parameter        | Description                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| `fn`             | The function you want to memoize.                                           |
| `[dependencies]` | An array of values that, when changed, cause the function to be re-created. |

---

## Why Use `useCallback`?

In React, every time a component re-renders, all functions defined inside it are **re-created**. This means child components receiving those functions as props will also re-render — even if the function logic hasn't changed. `useCallback` solves this by keeping the **same function reference** across renders.

---

## Code Examples

### 1. Basic Usage

```jsx
import { useState, useCallback } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => {
    setCount((prev) => prev + 1);
  }, []);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

Here, `increment` keeps the same reference across renders because the dependency array is empty (`[]`).

---

### 2. With Dependencies

```jsx
import { useState, useCallback } from "react";

function Greeting() {
  const [name, setName] = useState("Alice");

  const greet = useCallback(() => {
    alert(`Hello, ${name}!`);
  }, [name]);

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={greet}>Greet</button>
    </div>
  );
}
```

`greet` is re-created **only when `name` changes**, not on every render.

---

### 3. Preventing Unnecessary Child Re-renders

```jsx
import { useState, useCallback, memo } from "react";

const ExpensiveList = memo(({ onItemClick }) => {
  console.log("ExpensiveList rendered");
  const items = ["Apple", "Banana", "Cherry"];

  return (
    <ul>
      {items.map((item) => (
        <li key={item} onClick={() => onItemClick(item)}>
          {item}
        </li>
      ))}
    </ul>
  );
});

function App() {
  const [count, setCount] = useState(0);

  const handleItemClick = useCallback((item) => {
    console.log(`Clicked: ${item}`);
  }, []);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Re-render Parent</button>
      <ExpensiveList onItemClick={handleItemClick} />
    </div>
  );
}
```

Without `useCallback`, clicking the button would re-render `ExpensiveList` every time — even though `onItemClick` logic hasn't changed. With `useCallback`, the memoized child skips re-rendering.

---

### 4. Using with `useEffect`

```jsx
import { useState, useCallback, useEffect } from "react";

function SearchResults({ query }) {
  const [results, setResults] = useState([]);

  const fetchResults = useCallback(async () => {
    const res = await fetch(`https://api.example.com/search?q=${query}`);
    const data = await res.json();
    setResults(data);
  }, [query]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return (
    <ul>
      {results.map((r) => (
        <li key={r.id}>{r.title}</li>
      ))}
    </ul>
  );
}
```

`fetchResults` is stable unless `query` changes, preventing the `useEffect` from firing on every render.

---

## When NOT to Use `useCallback`

- **Simple components** — If the component tree is small, the overhead of memoization isn't worth it.
- **Functions not passed as props** — If the function is only used inside the same component and doesn't trigger child re-renders, memoizing it adds complexity for no benefit.
- **Premature optimization** — Profile first. Use `useCallback` when you've identified an actual performance issue.

---

## `useCallback` vs `useMemo`

| Hook          | Memoizes        | Returns            |
| ------------- | --------------- | ------------------ |
| `useCallback` | A **function**  | The same function  |
| `useMemo`     | A **value**     | A computed result  |

They are related — `useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`.

---

## Quick Reference

```jsx
// Memoize a function with no dependencies (created once)
const handleClick = useCallback(() => { /* ... */ }, []);

// Memoize a function that depends on `id`
const handleDelete = useCallback((e) => {
  deleteItem(id);
}, [id]);

// Equivalent useMemo form
const handleClick = useMemo(() => () => { /* ... */ }, []);
```
