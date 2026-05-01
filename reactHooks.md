# React Context API Example

## 📌 Definition

**Context API** in React allows you to share data (state) across components without passing props manually at every level (also called "prop drilling").

It is mainly used for **global state management** like themes, authentication, language, etc.

---

## 🧩 Example: Theme Context

```tsx
'use client';
import { createContext, useContext } from 'react';

const ThemeContext = createContext('light');

function ChildComponent() {
  const theme = useContext(ThemeContext);

  return (
    <div className={theme}>
      This is use context api theme here.
    </div>
  );
}

function App() {
  return (
    <>
      <ThemeContext.Provider value='dark'>
        <ChildComponent />
      </ThemeContext.Provider>
    </>
  );
}
