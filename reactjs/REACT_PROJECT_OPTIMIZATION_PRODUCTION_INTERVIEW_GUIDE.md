# React.js Project Optimization & Production Scenario Interview Guide

> **100+ senior-level React.js interview questions with answers, optimization techniques, debugging scenarios, production incidents, architecture decisions, and real-world examples.**
>
> Target audience: **Senior React.js / Full Stack Developers (5–10+ years)**

---

## Table of Contents

1. [React Performance Fundamentals](#1-react-performance-fundamentals)
2. [Rendering & Reconciliation](#2-rendering--reconciliation)
3. [Component Optimization](#3-component-optimization)
4. [State Management](#4-state-management)
5. [Hooks Optimization](#5-hooks-optimization)
6. [Network & API Optimization](#6-network--api-optimization)
7. [Bundle & Build Optimization](#7-bundle--build-optimization)
8. [Large Lists & Virtualization](#8-large-lists--virtualization)
9. [Images, Fonts & Static Assets](#9-images-fonts--static-assets)
10. [Caching](#10-caching)
11. [Production Architecture](#11-production-architecture)
12. [Security](#12-security)
13. [Testing & Quality](#13-testing--quality)
14. [Observability & Monitoring](#14-observability--monitoring)
15. [Real Production Scenarios](#15-real-production-scenarios)
16. [Advanced Interview Questions](#16-advanced-interview-questions)
17. [Rapid-Fire Questions](#17-rapid-fire-questions)
18. [Production Optimization Checklist](#18-production-optimization-checklist)

---

# 1. React Performance Fundamentals

## 1. What are the most important areas to optimize in a React application?

Focus on:

- unnecessary renders
- expensive calculations
- large component trees
- large JavaScript bundles
- unnecessary API requests
- large lists
- image/font size
- duplicated state
- excessive context updates
- memory leaks
- slow third-party libraries
- poor caching
- unnecessary hydration/work during startup

A useful optimization order is:

```text
Measure
  ↓
Identify bottleneck
  ↓
Fix the bottleneck
  ↓
Measure again
  ↓
Prevent regression
```

Do not optimize based only on assumptions.

---

## 2. How do you identify a React performance problem?

Use:

- React DevTools Profiler
- Chrome Performance panel
- Chrome Network panel
- Lighthouse
- Web Vitals
- bundle analyzers
- production monitoring
- API latency metrics
- memory snapshots

Example investigation:

```text
Page feels slow
    ↓
Check LCP
    ↓
Check network waterfall
    ↓
Check JS bundle
    ↓
Check React Profiler
    ↓
Check expensive renders
    ↓
Optimize only the bottleneck
```

---

## 3. What are Core Web Vitals?

The major user-centric metrics include:

- **LCP** — Largest Contentful Paint
- **INP** — Interaction to Next Paint
- **CLS** — Cumulative Layout Shift

Typical goals:

```text
LCP  → fast loading of main content
INP  → responsive interactions
CLS  → stable layout
```

---

## 4. What causes unnecessary React renders?

Common causes:

- parent re-render
- changing object references
- changing function references
- context value changes
- state updates
- Redux/store subscriptions
- unstable props
- changing keys
- derived state updates

Example:

```jsx
<User
  options={{ role: "admin" }}
/>
```

The object is recreated on every render.

Better:

```jsx
const options = useMemo(
  () => ({ role: "admin" }),
  []
);

<User options={options} />
```

But use memoization only when it provides measurable value.

---

## 5. Does every React re-render update the DOM?

No.

React may execute component functions again, but reconciliation determines whether the actual DOM needs changes.

```text
Component render
      ↓
React element tree
      ↓
Reconciliation
      ↓
Commit
      ↓
DOM updates only where required
```

A render is not automatically a DOM mutation.

---

## 6. What is the difference between render and commit?

### Render phase

React determines what the UI should look like.

### Commit phase

React applies required changes to the host environment, such as the browser DOM.

Interview answer:

> Rendering calculates the next UI. Commit applies the resulting changes.

---

## 7. Should every component use React.memo?

No.

`React.memo` is useful when:

- component renders frequently
- props usually remain stable
- rendering is expensive
- parent frequently re-renders

It can be unnecessary when:

- component is cheap
- props change frequently
- comparison cost exceeds rendering cost

---

## 8. What is the cost of React.memo?

React must compare props.

For primitive props this is usually cheap.

For large object structures or frequently changing references, memoization may not help.

The correct answer is:

> Measure before and after.

---

## 9. What is referential equality?

React commonly compares references.

```js
{} !== {}
[] !== []
```

Example:

```js
const a = { id: 1 };
const b = { id: 1 };

console.log(a === b); // false
```

This matters for:

- memoized components
- dependency arrays
- selectors
- context values

---

## 10. Why can inline objects cause performance issues?

Example:

```jsx
<Child config={{ theme: "dark" }} />
```

A new object is created each render.

If `Child` uses `React.memo`, the prop reference changes and the child may still render.

Possible optimization:

```jsx
const config = useMemo(
  () => ({ theme: "dark" }),
  []
);
```

Only do this when profiling shows a benefit.

---

# 2. Rendering & Reconciliation

## 11. What is reconciliation?

Reconciliation is React's process of comparing the previous element tree with the next one to determine what needs to change.

---

## 12. Why are keys important?

Keys help React identify list items across renders.

Bad:

```jsx
items.map((item, index) => (
  <Row key={index} item={item} />
))
```

Better:

```jsx
items.map(item => (
  <Row key={item.id} item={item} />
))
```

Stable keys are especially important when items can be inserted, removed, or reordered.

---

## 13. Why can using array indexes as keys cause bugs?

Suppose:

```text
A
B
C
```

Insert X at the beginning:

```text
X
A
B
C
```

Index keys make React associate old DOM/component state with different data.

This can cause:

- incorrect input values
- incorrect animations
- state appearing on the wrong row
- unnecessary remounting

---

## 14. What causes a component to remount?

Changing its identity can cause a remount.

Example:

```jsx
<User key={userId} />
```

When `userId` changes, React may treat it as a different component.

A remount resets local state and runs mount-related effects again.

---

## 15. How can you intentionally reset component state?

Use a changing key:

```jsx
<Form key={userId} userId={userId} />
```

When `userId` changes, the form can start with fresh state.

---

## 16. What is component composition and why does it help performance?

Instead of passing large state trees through many levels, use composition.

Example:

```jsx
function Layout({ sidebar, content }) {
  return (
    <>
      {sidebar}
      {content}
    </>
  );
}
```

This can reduce unnecessary coupling and simplify rendering boundaries.

---

## 17. How do you prevent a large parent from re-rendering the entire page?

Possible techniques:

- split components
- move state closer to consumers
- memoize expensive children
- use selectors
- avoid broad context updates
- use external stores where appropriate
- isolate frequently changing UI

---

## 18. What is state colocation?

Keep state as close as possible to the components that need it.

Bad:

```text
App
 └── Global state
      └── Everything
```

Better:

```text
App
 ├── Header
 ├── ProductPage
 │    └── ProductFilters state
 └── Footer
```

This reduces unnecessary update propagation.

---

# 3. Component Optimization

## 19. How would you optimize a dashboard with 50 widgets?

I would:

1. profile the dashboard
2. split widgets
3. lazy-load below-the-fold widgets
4. memoize expensive widgets
5. virtualize large tables
6. cache API results
7. batch requests where possible
8. avoid global state for local widget state
9. use stable props
10. load heavy charts only when needed

---

## 20. How do you optimize an expensive calculation?

Use memoization only when appropriate:

```jsx
const total = useMemo(() => {
  return calculateTotal(items);
}, [items]);
```

But first confirm `calculateTotal` is actually expensive.

---

## 21. When should you NOT use useMemo?

Avoid it for trivial calculations:

```jsx
const fullName = `${firstName} ${lastName}`;
```

`useMemo` itself has bookkeeping and dependency-comparison overhead.

---

## 22. When should you use useCallback?

Useful when:

- passing callbacks to memoized children
- callback identity matters
- callback is used as a dependency

Example:

```jsx
const handleDelete = useCallback((id) => {
  deleteUser(id);
}, [deleteUser]);
```

---

## 23. Does useCallback automatically improve performance?

No.

It stabilizes function identity. Performance improves only when that stability prevents meaningful work.

---

## 24. How would you optimize a reusable component library?

Focus on:

- tree-shaking
- small dependencies
- avoiding global CSS conflicts
- stable APIs
- accessibility
- bundle size
- SSR compatibility
- lazy loading heavy components
- avoiding unnecessary runtime code
- documentation and tests

---

## 25. How do you optimize a form with 100+ fields?

Use:

- field-level subscriptions
- uncontrolled inputs where appropriate
- field grouping
- lazy sections
- validation only when necessary
- debounced validation
- avoid storing every keystroke in global state
- virtualization for very large repeated sections

---

## 26. Why can controlled inputs become slow?

Every keystroke can trigger:

```text
Input
 ↓
state update
 ↓
component render
 ↓
child renders
```

If the component tree is huge, typing can become expensive.

Solutions:

- isolate form state
- memoize expensive sections
- use uncontrolled inputs where appropriate
- subscribe only to required fields
- defer non-critical UI updates

---

## 27. How do you optimize a search box?

Use debounce:

```js
const search = debounce((value) => {
  fetchResults(value);
}, 300);
```

Also:

- cancel stale requests
- cache previous searches
- avoid searching for every character
- show loading state
- handle race conditions

---

## 28. How do you prevent stale search responses?

Request A:

```text
search=react
```

Request B:

```text
search=react performance
```

If A returns after B, it must not overwrite B.

Use `AbortController`:

```js
const controller = new AbortController();

fetch(url, {
  signal: controller.signal
});

controller.abort();
```

Or use a data-fetching library that handles request lifecycle.

---

## 29. How do you optimize conditional rendering?

Avoid unnecessarily mounting expensive components.

Instead of:

```jsx
{showModal && <HugeChart />}
```

consider lazy loading:

```jsx
const HugeChart = lazy(() => import("./HugeChart"));
```

Then:

```jsx
<Suspense fallback={<Spinner />}>
  {showModal && <HugeChart />}
</Suspense>
```

---

## 30. How do you optimize modal-heavy applications?

Do not load every modal at initial startup.

Use:

- lazy loading
- code splitting
- mount only when opened
- shared modal infrastructure
- portal where appropriate

---

# 4. State Management

## 31. How do you decide between local state and global state?

Use local state for:

- modal visibility
- input state
- tabs
- temporary UI state

Use shared/global state for:

- authenticated user
- application-wide preferences
- shared workflow state
- cross-page business state

Avoid putting everything into Redux/context.

---

## 32. Why can Context API cause performance issues?

When the provider value changes, consumers subscribed to that context may re-render.

Bad:

```jsx
<AuthContext.Provider value={{
  user,
  login,
  logout
}}>
```

If the value object is recreated frequently, consumers can update unnecessarily.

Possible:

```jsx
const value = useMemo(
  () => ({ user, login, logout }),
  [user, login, logout]
);
```

Also split contexts by responsibility.

---

## 33. How would you optimize a large Context?

Split:

```text
AppContext
```

into:

```text
AuthContext
ThemeContext
CartContext
FeatureContext
```

Then components subscribe only to what they need.

---

## 34. Redux vs Context — when would you choose Redux?

Redux is useful when:

- many components need shared state
- updates are complex
- predictable state transitions matter
- debugging/time-travel tooling is valuable
- middleware is required
- selectors are important

Context is often enough for smaller shared concerns.

---

## 35. What is a selector?

A selector extracts the required state:

```js
const userName = useSelector(
  state => state.user.name
);
```

Good selector design can reduce unnecessary updates.

---

## 36. What is derived state?

State that can be calculated from existing state.

Bad:

```js
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [fullName, setFullName] = useState("");
```

Better:

```js
const fullName = `${firstName} ${lastName}`;
```

Do not duplicate derivable state.

---

## 37. How do you avoid state synchronization bugs?

Prefer a single source of truth.

Bad:

```text
API data
 ↓
Redux data
 ↓
component state
 ↓
derived state
```

This creates synchronization complexity.

Prefer:

```text
Server state → cache
UI state → local/global state
Derived values → calculate
```

---

## 38. Server state vs client state?

### Server state

- API data
- users
- products
- orders

Characteristics:

- asynchronous
- cacheable
- stale
- shared

### Client state

- modal
- selected tab
- temporary UI state

A dedicated server-state library can simplify caching, retries, invalidation, and synchronization.

---

# 5. Hooks Optimization

## 39. What are common useEffect performance problems?

Examples:

- effect runs on every render
- incorrect dependencies
- API call loops
- unnecessary subscriptions
- missing cleanup
- duplicated effects

Bad:

```jsx
useEffect(() => {
  fetchData();
});
```

This runs after every render.

---

## 40. How do you prevent an API request loop?

Incorrect:

```jsx
useEffect(() => {
  setUsers(data);
}, [users]);
```

If `setUsers` changes `users`, the effect can repeat.

Use the correct dependency source.

---

## 41. Why is cleanup important?

Cleanup prevents:

- memory leaks
- stale subscriptions
- duplicate event listeners
- timers running after unmount
- WebSocket leaks

Example:

```jsx
useEffect(() => {
  const handler = () => {};

  window.addEventListener("resize", handler);

  return () => {
    window.removeEventListener("resize", handler);
  };
}, []);
```

---

## 42. How do you optimize resize/scroll handlers?

Use throttling or `requestAnimationFrame`.

```js
const handleScroll = throttle(() => {
  // work
}, 100);
```

Avoid heavy synchronous work on every scroll event.

---

## 43. What is useDeferredValue useful for?

It can help keep urgent UI responsive while a non-urgent value updates.

Example scenario:

```text
Typing in search input
       ↓
Input must remain responsive
       ↓
Large result list can update later
```

---

## 44. What is startTransition useful for?

Use transitions for non-urgent updates.

```jsx
startTransition(() => {
  setSearchResults(results);
});
```

This helps React prioritize urgent interactions over less urgent rendering work.

---

## 45. useMemo vs useCallback?

```text
useMemo
→ memoizes a calculated value

useCallback
→ memoizes a function reference
```

Example:

```jsx
const total = useMemo(() => calculateTotal(items), [items]);

const onClick = useCallback(() => {
  save();
}, [save]);
```

---

# 6. Network & API Optimization

## 46. How do you reduce API calls?

Use:

- debounce
- caching
- request deduplication
- batching
- pagination
- prefetching
- conditional requests
- stale-while-revalidate
- normalized server state

---

## 47. How do you handle 10 APIs required for one page?

Avoid blindly firing all requests.

Evaluate:

```text
Can APIs run in parallel?
Can backend aggregate them?
Can data be prefetched?
Can responses be cached?
Can some requests be deferred?
```

Use:

```js
await Promise.all([
  fetchUsers(),
  fetchProducts(),
  fetchOrders()
]);
```

when the requests are independent.

---

## 48. When should APIs NOT use Promise.all?

If one request depends on another:

```text
getUser()
   ↓
getUserPermissions(userId)
```

Then they cannot run independently.

Also consider rate limits and backend capacity.

---

## 49. What is request deduplication?

If five components request:

```text
/users/123
```

at the same time, a data-fetching layer can reuse one in-flight request instead of sending five requests.

---

## 50. How do you handle API retries?

Retry transient failures such as:

- temporary network failures
- 429
- some 5xx errors

Use exponential backoff:

```text
1s
2s
4s
8s
```

Do not retry every error.

Avoid retry storms.

---

## 51. How do you handle a slow API?

Frontend options:

- loading skeleton
- timeout
- cancellation
- retry
- cached data
- optimistic UI
- pagination
- partial rendering

Backend options:

- indexing
- caching
- query optimization
- connection pooling
- horizontal scaling

---

## 52. What is optimistic UI?

Update UI before the server confirms.

Example:

```text
User clicks Like
 ↓
UI immediately shows liked
 ↓
API request
 ↓
Success → keep state
Failure → rollback
```

Use it when failure recovery is manageable.

---

## 53. How do you handle optimistic update failure?

Keep previous state:

```js
const previous = data;

updateUI();

try {
  await apiCall();
} catch {
  restore(previous);
}
```

Also show an actionable error.

---

## 54. How do you prevent race conditions in API requests?

Use:

- AbortController
- request IDs
- query libraries
- stale-response checks

Example:

```js
let requestId = 0;

async function search(value) {
  const id = ++requestId;

  const result = await api(value);

  if (id !== requestId) return;

  setResults(result);
}
```

---

# 7. Bundle & Build Optimization

## 55. What is code splitting?

Breaking one large JavaScript bundle into smaller chunks loaded when needed.

Example:

```jsx
const AdminPage = lazy(
  () => import("./AdminPage")
);
```

---

## 56. What is lazy loading?

Load code only when required.

Useful for:

- admin pages
- charts
- editors
- maps
- large modals
- rarely used features

---

## 57. What is tree shaking?

Removing unused exports from the production bundle.

It works best with module systems and libraries that support static analysis.

---

## 58. How do you find why a bundle is large?

Use a bundle analyzer.

Look for:

- duplicate dependencies
- large libraries
- unnecessary locale files
- polyfills
- chart libraries
- icon packages
- date libraries
- internal duplicate packages

---

## 59. How can lodash increase bundle size?

Importing the entire library may include unnecessary code.

Prefer targeted imports where your build setup benefits:

```js
import debounce from "lodash/debounce";
```

Also consider native/browser APIs where practical.

---

## 60. How do you optimize icon libraries?

Avoid importing an entire icon collection.

Prefer individual icons:

```js
import { Search } from "some-icon-library";
```

Verify the resulting production bundle.

---

## 61. What is route-level code splitting?

Each route/page loads its required code instead of shipping the entire application initially.

Example architecture:

```text
Home
 ├── home.chunk.js

Admin
 ├── admin.chunk.js

Reports
 ├── reports.chunk.js
```

---

## 62. How do you optimize third-party scripts?

Examples:

- analytics
- chat widgets
- A/B testing
- ads
- tracking

Strategies:

- load asynchronously
- defer non-critical scripts
- lazy load after interaction
- remove unused scripts
- measure their impact

---

## 63. What is the difference between development and production builds?

Production builds generally include:

- minification
- dead-code elimination
- optimized assets
- compressed output
- reduced development tooling

Never use development settings as the performance benchmark for production.

---

# 8. Large Lists & Virtualization

## 64. How do you render 100,000 records?

Do not render all 100,000 DOM nodes.

Use:

- server-side pagination
- virtualization
- infinite scrolling
- filtering
- sorting on the backend

---

## 65. What is virtualization?

Only render visible rows.

```text
100,000 records

Instead of:
DOM = 100,000 rows

Virtualization:
DOM = ~20–100 visible rows
```

---

## 66. Pagination vs virtualization?

### Pagination

Good for:

- backend APIs
- search results
- tables
- SEO-friendly pages

### Virtualization

Good for:

- large interactive lists
- long scrolling
- desktop data grids

They can be combined.

---

## 67. How do you optimize a large table?

Use:

- server-side pagination
- virtualization
- memoized rows
- stable keys
- column virtualization
- debounced filtering
- server-side sorting
- lazy-loaded cell components

---

## 68. Why can a large table freeze the browser?

Possible causes:

- thousands of DOM nodes
- expensive row calculations
- synchronous sorting
- expensive formatting
- repeated state updates

Move heavy work off the critical interaction path.

---

## 69. How do you handle infinite scrolling?

Consider:

- `IntersectionObserver`
- pagination cursor
- request cancellation
- deduplication
- loading boundaries
- maximum retained items
- virtualization

---

## 70. What happens if infinite scroll keeps all records in memory?

Memory can grow continuously.

For very large feeds:

```text
Fetch
 ↓
Render visible items
 ↓
Virtualize
 ↓
Release unnecessary DOM
```

---

# 9. Images, Fonts & Static Assets

## 71. How do images affect React performance?

Large images increase:

- network transfer
- decoding time
- memory usage
- LCP

Optimize:

- format
- dimensions
- compression
- lazy loading
- responsive sizes
- CDN delivery

---

## 72. Which image formats should you consider?

Modern formats include:

- WebP
- AVIF

Choose based on browser support, tooling, and image characteristics.

---

## 73. How do you lazy-load images?

```html
<img
  src="/product.webp"
  loading="lazy"
  alt="Product"
/>
```

Do not lazy-load the main above-the-fold image if it is critical to LCP.

---

## 74. How do you prevent layout shift from images?

Reserve dimensions:

```html
<img
  width="800"
  height="600"
  src="/image.webp"
  alt="..."
/>
```

Or use an aspect-ratio container.

---

## 75. How do fonts hurt performance?

Fonts can delay text rendering and cause layout changes.

Optimize:

- font subsets
- number of weights
- preload only critical fonts
- use `font-display`
- avoid unnecessary custom fonts

---

## 76. What is a CDN?

A Content Delivery Network serves static resources from geographically distributed edge locations.

Useful for:

- JS
- CSS
- images
- fonts
- videos

---

# 10. Caching

## 77. What should be cached in a React application?

Potentially:

- API responses
- static assets
- images
- route chunks
- configuration
- user preferences

Do not blindly cache sensitive or rapidly changing data.

---

## 78. Browser cache vs application cache?

### Browser/HTTP cache

Controlled by HTTP caching headers.

### Application cache

Managed by application/data-fetching logic.

Example:

```text
HTTP Cache
→ browser/CDN

Query Cache
→ application data

Local Storage
→ persistent client data
```

---

## 79. What is stale-while-revalidate?

Use cached data immediately while fetching fresh data in the background.

```text
Cached data
   ↓
Show immediately
   ↓
Fetch fresh data
   ↓
Update cache/UI
```

This provides fast perceived performance.

---

## 80. What should NOT be stored in localStorage?

Avoid storing sensitive credentials or secrets in localStorage because JavaScript-accessible storage is exposed to XSS.

Prefer secure cookie-based session designs where appropriate.

---

## 81. How do you cache API data?

A query cache can store:

```text
queryKey
data
timestamp
status
```

Then:

```text
Component A → fetch
Component B → reuse cached result
```

This reduces duplicate network calls.

---

## 82. What is cache invalidation?

When underlying data changes, cached data may become stale.

Strategies:

- TTL
- explicit invalidation
- mutation-triggered invalidation
- versioned keys
- stale-while-revalidate

---

# 11. Production Architecture

## 83. How would you structure a large React application?

A feature-oriented structure is often easier to scale:

```text
src/
├── app/
├── features/
│   ├── auth/
│   ├── users/
│   ├── products/
│   └── orders/
├── components/
├── hooks/
├── services/
├── lib/
├── routes/
├── store/
├── utils/
└── tests/
```

Avoid creating one huge `components/` folder containing the entire application.

---

## 84. What is feature-based architecture?

Group code by business capability:

```text
features/
  auth/
    components/
    hooks/
    services/
    tests/

  products/
    components/
    hooks/
    services/
    tests/
```

This improves ownership and maintainability.

---

## 85. How do you manage environment variables?

Separate:

```text
development
test
staging
production
```

Never expose server-only secrets to browser bundles.

Remember:

> Anything bundled into frontend JavaScript should be considered public.

---

## 86. How do you handle feature flags?

Use:

```text
Flag
 ↓
Evaluate
 ↓
Render feature
```

Benefits:

- gradual rollout
- A/B testing
- kill switches
- safer deployments

Do not allow flags to become permanent undocumented complexity.

---

## 87. How do you design a React app for millions of users?

Focus on:

- CDN
- caching
- code splitting
- optimized APIs
- pagination
- lazy loading
- observability
- error boundaries
- resilient backend
- horizontal scaling
- feature flags
- progressive rollout

Frontend scalability is also a backend and delivery problem.

---

## 88. How do you handle a production JavaScript error?

Use:

```text
Error
 ↓
Error boundary / global handler
 ↓
Monitoring
 ↓
Release/version
 ↓
Stack trace
 ↓
Source map
 ↓
Fix
 ↓
Regression test
```

Do not expose raw stack traces to users.

---

## 89. What is an Error Boundary?

An error boundary catches rendering-related errors in a subtree and displays fallback UI instead of crashing the entire UI tree.

Typical use:

```jsx
<ErrorBoundary fallback={<ErrorPage />}>
  <Checkout />
</ErrorBoundary>
```

Error boundaries do not replace general error handling for every asynchronous operation.

---

## 90. How do you make a React application resilient?

Use:

- error boundaries
- API timeouts
- retries with backoff
- graceful fallbacks
- cached data
- offline handling where appropriate
- feature flags
- monitoring
- progressive deployment

---

# 12. Security

## 91. How do you prevent XSS in React?

React escapes normal text interpolation.

Avoid unsafe HTML unless absolutely necessary.

If HTML must be rendered:

```jsx
dangerouslySetInnerHTML
```

must be used carefully with trusted/sanitized content.

Also use:

- Content Security Policy
- output encoding
- sanitization
- dependency updates

---

## 92. Is React automatically secure?

No.

React provides useful escaping behavior, but developers can introduce vulnerabilities through:

- unsafe HTML
- insecure dependencies
- bad URL handling
- DOM manipulation
- leaked secrets
- unsafe authentication storage

---

## 93. Where should authentication tokens be stored?

A secure design depends on the authentication model.

For browser applications, HttpOnly, Secure, appropriately scoped cookies are commonly preferred for session/refresh credentials because JavaScript cannot directly read HttpOnly cookies.

Protect against CSRF as appropriate.

---

## 94. What is CSRF?

Cross-Site Request Forgery tricks a browser into sending an authenticated request that the user did not intentionally initiate.

Mitigations can include:

- SameSite cookies
- CSRF tokens
- origin checks
- proper server-side authorization

---

## 95. What is CORS?

CORS controls which origins are allowed to make certain cross-origin browser requests.

It is a browser security mechanism, not authentication.

---

## 96. Should frontend authorization be trusted?

No.

Frontend authorization controls UI visibility.

Backend authorization must enforce permissions.

```text
Frontend
→ hide button

Backend
→ enforce permission
```

Never rely only on frontend checks.

---

# 13. Testing & Quality

## 97. What should you test in a React application?

Test:

- user behavior
- component behavior
- forms
- API states
- loading states
- error states
- accessibility
- critical business flows
- integration between components

---

## 98. Unit test vs integration test?

### Unit test

Tests a small isolated unit.

### Integration test

Tests multiple pieces working together.

For React applications, integration tests often provide more confidence for user-facing behavior.

---

## 99. What should not be tested?

Avoid testing implementation details such as:

```text
internal state variable names
private methods
exact internal component structure
```

Prefer:

```text
What does the user see?
What can the user do?
What result occurs?
```

---

## 100. How do you test loading/error/success states?

Example states:

```text
idle
loading
success
empty
error
```

Every important API-driven component should consider these states.

---

## 101. How do you prevent performance regressions?

Use:

- Lighthouse CI
- bundle-size budgets
- Web Vitals monitoring
- automated tests
- performance profiling
- production RUM

Example budget:

```text
Initial JS < defined threshold
LCP < target
INP < target
CLS < target
```

---

## 102. How do you test a large list?

Test:

- rendering
- pagination
- virtualization behavior
- keyboard navigation
- empty state
- loading state
- error state
- selection
- sorting/filtering

---

# 14. Observability & Monitoring

## 103. What should you monitor in production?

Frontend:

- JavaScript errors
- LCP
- INP
- CLS
- route load time
- API latency
- API error rate
- bundle size
- memory problems
- crash-free sessions

Backend:

- request latency
- CPU
- memory
- database latency
- error rate
- queue lag

---

## 104. What is Real User Monitoring?

RUM collects performance information from actual users.

It can answer:

```text
Which route is slow?
Which browser is slow?
Which country/region is slow?
Which release caused degradation?
```

---

## 105. How do you correlate frontend and backend errors?

Use a correlation/request ID.

```text
Browser
  ↓
X-Request-ID: abc-123
  ↓
API
  ↓
Database/logs
```

Then logs can be connected across services.

---

## 106. What should a frontend error log contain?

Useful fields:

```text
error message
stack
route
release/version
browser
OS
request/correlation ID
user-safe context
timestamp
```

Do not log secrets or sensitive personal information.

---

## 107. How do you debug a problem that happens only in production?

Process:

```text
1. Identify affected release
2. Check error monitoring
3. Check browser/device
4. Check route
5. Check API failures
6. Compare Web Vitals
7. Reproduce with production-like build
8. Add targeted logging
9. Roll back if necessary
10. Fix and add regression coverage
```

---

# 15. Real Production Scenarios

## 108. Production page became slow after deployment. What do you do?

First compare the current release with the previous release.

Check:

- bundle size
- LCP
- INP
- API latency
- React render profile
- third-party scripts
- network waterfall

If the regression is severe:

```text
Mitigate/rollback
    ↓
Identify root cause
    ↓
Fix
    ↓
Test
    ↓
Deploy gradually
```

---

## 109. API response is 2 seconds but UI takes 7 seconds. Why?

Possible causes:

- large JSON parsing
- expensive React rendering
- expensive calculations
- many child components
- image loading
- synchronous JavaScript
- layout/reflow
- third-party scripts

Do not assume the API is the only bottleneck.

---

## 110. React page has 5,000 components and scrolling is laggy. How do you debug?

Use React Profiler and Chrome Performance.

Check:

- render frequency
- expensive components
- DOM node count
- event handlers
- layout work
- list rendering

Likely solutions:

- virtualization
- component splitting
- memoization where justified
- reducing DOM nodes
- throttling events

---

## 111. Search page makes 20 requests when user types one word. How do you fix it?

Use:

```text
debounce
+
request cancellation
+
request deduplication
+
cache
```

Example:

```text
r
re
rea
reac
react
```

Instead of five API calls, wait until typing pauses.

---

## 112. Users report that search results sometimes show old data. Why?

Likely a race condition.

Example:

```text
Request A → slow
Request B → fast

B updates UI
A returns later
A overwrites UI
```

Fix with request cancellation or request sequencing.

---

## 113. Dashboard takes 10 seconds to load. What do you optimize first?

Measure first.

Check:

```text
HTML
 ↓
JS
 ↓
API waterfall
 ↓
Images
 ↓
React rendering
```

Potential improvements:

- parallel API requests
- server aggregation
- caching
- lazy widgets
- skeleton UI
- route code splitting
- defer non-critical charts

---

## 114. Users complain that typing in a form is laggy. What do you check?

Check:

- parent renders
- controlled input state
- validation
- expensive derived calculations
- global state updates
- large lists
- synchronous formatting

Then isolate input state and defer non-critical work.

---

## 115. A React component renders hundreds of times. Is that automatically a bug?

No.

Render count alone is not enough.

Ask:

```text
How expensive is each render?
Why does it render?
Does it cause DOM work?
Does it impact user experience?
```

A cheap render can be harmless.

---

## 116. Memory usage grows continuously after users stay on the page for 30 minutes. What do you check?

Look for:

- event listeners not removed
- timers
- WebSocket subscriptions
- retained closures
- growing arrays/caches
- detached DOM nodes
- subscriptions
- third-party libraries

Use Chrome heap snapshots.

---

## 117. WebSocket messages cause the page to freeze. Why?

Possible reason:

```text
1000 messages/sec
      ↓
1000 state updates
      ↓
1000 render cycles
```

Solutions:

- batch updates
- throttle UI updates
- buffer messages
- update only visible data
- move processing off the main thread where appropriate

---

## 118. A chart library adds 2 MB to the bundle. What do you do?

Ask:

- Is the chart required on initial load?
- Can it be lazy-loaded?
- Is a smaller library sufficient?
- Are unused chart modules included?
- Can the chart render only after interaction?

Example:

```jsx
const Chart = lazy(() => import("./Chart"));
```

---

## 119. Production CPU usage is high in the browser. How do you debug?

Use Chrome Performance.

Look for:

- long tasks
- JavaScript loops
- expensive rendering
- frequent events
- large JSON parsing
- excessive React work
- third-party scripts

---

## 120. What is a long task?

A long main-thread task blocks user interaction.

It can cause:

- input lag
- delayed clicks
- poor INP
- frozen UI

Break large synchronous work into smaller pieces or move appropriate computation away from the main thread.

---

## 121. How would you optimize a 1-million-row data export?

Do not generate the entire export in the browser.

Use:

```text
Frontend
  ↓
Request export job
  ↓
Backend worker
  ↓
Generate file
  ↓
Object storage
  ↓
Download URL
```

This avoids freezing the browser.

---

## 122. Production login page suddenly has a 5% error rate. What do you do?

Check:

1. frontend error rate
2. authentication API
3. HTTP status distribution
4. recent deployment
5. browser/device segmentation
6. token/session errors
7. backend logs
8. correlation IDs

If caused by a recent release:

```text
Rollback
→ investigate
→ fix
→ regression test
→ redeploy
```

---

## 123. CDN is fast but page is still slow. Why?

CDN only solves delivery of cached resources.

The bottleneck may be:

- JavaScript execution
- hydration
- API latency
- rendering
- image decoding
- third-party scripts
- main-thread blocking

---

## 124. Users on mobile devices report freezing but desktop is fine. Why?

Mobile devices have:

- slower CPUs
- less memory
- slower networks
- different browser behavior

Check:

- JavaScript execution
- DOM size
- image size
- bundle size
- long tasks
- memory

Optimize for real devices, not only high-end desktop hardware.

---

## 125. A page has good Lighthouse scores but users complain. Why?

Lab and field conditions differ.

Possible reasons:

- real devices are slower
- real network conditions differ
- specific users hit slow APIs
- third-party services fail
- geographic differences
- authenticated pages differ

Use RUM to understand real-user performance.

---

## 126. How do you handle a failed lazy-loaded chunk in production?

A deployment can cause stale clients to request chunks that no longer exist.

Handle:

- chunk load errors
- cache strategy
- deployment versioning
- graceful reload
- rollback

A common UX is:

```text
Chunk failed
 ↓
Show "New version available"
 ↓
Reload application
```

Avoid infinite reload loops.

---

## 127. Users see stale JavaScript after deployment. What can cause it?

Possible causes:

- browser cache
- CDN cache
- service worker
- incorrect cache headers
- asset naming/versioning

Use content-hashed assets and an appropriate caching strategy.

---

## 128. Service worker is serving an old application. How do you debug?

Check:

```text
Application
 → Service Workers
 → Cache Storage
```

Also inspect:

- registration
- update lifecycle
- cache version
- fetch handler
- deployment strategy

Be careful with aggressive caching.

---

## 129. React application works locally but is slow in production. Why?

Production differences include:

- CDN
- compression
- real APIs
- production data volume
- authentication
- third-party services
- network latency
- build configuration

Always test a production build locally:

```bash
npm run build
npm run preview
```

or the equivalent for your stack.

---

## 130. What would you do if a release increases bundle size by 40%?

Stop and investigate before blindly accepting it.

Check bundle analyzer for:

- new dependencies
- duplicate packages
- accidental imports
- locale files
- large libraries

Then:

```text
Remove
or
lazy-load
or
replace
or
split
```

---

## 131. How do you optimize a React e-commerce product page?

Priority:

```text
Product image → LCP
Product details → fast render
Price/availability → API
Reviews → lazy load
Recommendations → deferred
Analytics → async
```

Techniques:

- responsive images
- CDN
- cache product data
- lazy reviews
- lazy recommendations
- prefetch likely navigation
- optimized product JSON
- skeletons

---

## 132. How do you optimize an admin dashboard?

Use:

- route-level code splitting
- widget lazy loading
- server-side pagination
- cached queries
- virtualized tables
- deferred charts
- permission-based loading
- error boundaries per widget

---

## 133. How do you handle a component that depends on 4 APIs?

Classify dependencies:

```text
Independent:
A ─┐
B ─┼→ Promise.all

Dependent:
C → D
```

Cache stable responses and defer non-critical data.

---

## 134. How do you handle a failed API while other dashboard widgets succeed?

Do not fail the entire dashboard.

Use widget-level boundaries:

```text
Dashboard
├── Sales     ✅
├── Users     ❌ Retry
├── Orders    ✅
└── Revenue   ⏳
```

This is better resilience than one global failure screen.

---

## 135. What is graceful degradation?

If an optional feature fails, the core application remains usable.

Example:

```text
Recommendations unavailable
↓
Product page still works
```

---

# 16. Advanced Interview Questions

## 136. What is React concurrent rendering?

Modern React can prioritize and interrupt rendering work to keep interactions responsive.

The important interview concept is:

> React can schedule work based on priority instead of treating every update as equally urgent.

---

## 137. What is the main-thread bottleneck?

The browser main thread handles important work including:

- JavaScript
- DOM work
- style/layout
- painting coordination

Long synchronous tasks block user interaction.

---

## 138. How do you optimize CPU-heavy computation?

Options:

1. memoization
2. reduce algorithm complexity
3. pagination
4. incremental computation
5. Web Workers
6. server-side computation

Do not use memoization as a substitute for a bad algorithm.

---

## 139. When would you use a Web Worker?

Use when expensive computation can happen independently from UI interaction.

Examples:

- large data processing
- parsing
- encryption
- image processing
- complex calculations

Architecture:

```text
Main Thread
    ↕
Web Worker
```

---

## 140. What is hydration?

Hydration connects client-side React behavior to server-rendered HTML.

Hydration can be expensive if:

- page has huge component tree
- large JS bundle
- many interactive components

Reduce unnecessary client-side JavaScript where architecture permits.

---

## 141. How do you reduce hydration cost?

Depending on framework/architecture:

- reduce client components
- split routes
- lazy-load interactive sections
- reduce JavaScript
- render static content without unnecessary client behavior

---

## 142. What is progressive hydration?

The idea is to hydrate parts of an application incrementally rather than doing all client work immediately.

This is especially relevant in server-rendered architectures.

---

## 143. What is partial hydration?

Only selected interactive portions require client-side JavaScript.

The goal is to reduce unnecessary client work.

---

## 144. How do you optimize a React app with micro-frontends?

Consider:

- shared dependencies
- bundle duplication
- independent deployments
- routing
- authentication
- communication
- CSS isolation
- performance
- failure isolation

Do not use micro-frontends simply because the application is large.

---

## 145. What is the biggest risk of micro-frontends?

Duplicated dependencies and runtime complexity.

Example:

```text
App A → React 19
App B → React 19
App C → React 19

Potential duplicated runtime/bundles
```

Architecture must justify the operational complexity.

---

## 146. How do you design frontend observability?

Track:

```text
User action
 ↓
Route
 ↓
API request
 ↓
Backend request ID
 ↓
Database/service
```

This enables end-to-end debugging.

---

## 147. What is performance budget?

A defined limit for performance characteristics.

Example:

```text
Initial JS ≤ target
Images ≤ target
LCP ≤ target
INP ≤ target
CLS ≤ target
```

Budgets should be enforced in CI where practical.

---

## 148. What is progressive delivery?

Release changes gradually:

```text
Internal users
 ↓
1%
 ↓
10%
 ↓
25%
 ↓
50%
 ↓
100%
```

Use feature flags and monitoring.

---

## 149. What is a kill switch?

A feature flag that can quickly disable a problematic feature without rebuilding the entire application.

Useful during incidents.

---

## 150. How do you prevent a bad frontend deployment from affecting all users?

Use:

- CI tests
- preview environments
- feature flags
- canary releases
- monitoring
- automatic rollback
- staged rollout

---

# 17. Rapid-Fire Questions

## 151. Why is index key dangerous?

Because item identity can change when the list changes.

## 152. What is memoization?

Caching a computed value/result so repeated work can be avoided.

## 153. What is lazy loading?

Loading code/resource only when needed.

## 154. What is code splitting?

Dividing application code into independently loaded chunks.

## 155. What is tree shaking?

Removing unused code from production bundles.

## 156. What is virtualization?

Rendering only the visible portion of a large list.

## 157. What is debounce?

Wait for activity to stop before executing.

## 158. What is throttle?

Limit execution to a maximum frequency.

## 159. What is optimistic UI?

Update UI before server confirmation.

## 160. What is RUM?

Real User Monitoring.

## 161. What is CDN?

Distributed edge delivery for content.

## 162. What is LCP?

Largest Contentful Paint.

## 163. What is INP?

Interaction to Next Paint.

## 164. What is CLS?

Cumulative Layout Shift.

## 165. What is an Error Boundary?

A component-level rendering error containment mechanism.

## 166. What is a memory leak?

Memory that remains referenced and cannot be reclaimed despite no longer being needed.

## 167. What is request cancellation?

Stopping a request that is no longer useful.

## 168. What is cache invalidation?

Determining when cached data should no longer be considered valid.

## 169. What is state colocation?

Keeping state close to the components that use it.

## 170. What is server state?

Data owned by a backend and synchronized with the frontend.

---

# 18. Production Optimization Checklist

## Initial Load

- [ ] Measure LCP
- [ ] Measure INP
- [ ] Measure CLS
- [ ] Analyze JavaScript bundle
- [ ] Compress assets
- [ ] Optimize images
- [ ] Optimize fonts
- [ ] Remove unused dependencies
- [ ] Enable CDN
- [ ] Use caching
- [ ] Code split routes
- [ ] Lazy load non-critical features

## React Rendering

- [ ] Profile expensive components
- [ ] Avoid unnecessary state
- [ ] Colocate state
- [ ] Avoid unnecessary Context updates
- [ ] Use stable keys
- [ ] Memoize only when useful
- [ ] Avoid unnecessary effects
- [ ] Clean up subscriptions
- [ ] Optimize expensive calculations
- [ ] Use virtualization for large lists

## API

- [ ] Cache stable responses
- [ ] Deduplicate requests
- [ ] Debounce search
- [ ] Cancel stale requests
- [ ] Paginate large datasets
- [ ] Parallelize independent requests
- [ ] Retry transient failures carefully
- [ ] Use timeouts
- [ ] Handle partial failures

## Production Reliability

- [ ] Error boundaries
- [ ] Error monitoring
- [ ] RUM
- [ ] Correlation IDs
- [ ] Feature flags
- [ ] Canary deployments
- [ ] Rollback strategy
- [ ] Chunk-load failure handling
- [ ] Service-worker strategy
- [ ] Performance budgets

## Security

- [ ] Never trust frontend authorization
- [ ] Avoid unsafe HTML
- [ ] Sanitize untrusted HTML
- [ ] Use CSP where appropriate
- [ ] Protect authentication credentials
- [ ] Configure CORS correctly
- [ ] Protect against CSRF where applicable
- [ ] Audit dependencies
- [ ] Never expose server secrets in client bundles

---

# Senior Interview Answer Framework

When an interviewer gives you a production problem, answer using this structure:

```text
1. Clarify the symptom
2. Measure the problem
3. Identify the bottleneck
4. Explain possible root causes
5. Propose the least risky fix
6. Explain trade-offs
7. Deploy gradually
8. Monitor the result
9. Add regression protection
```

Example:

### Interviewer

> The React dashboard became slow after the latest deployment. What would you do?

### Strong answer

> First I would compare the current release against the previous release using real-user performance data and bundle analysis. I would check whether the regression is caused by JavaScript bundle size, API latency, React rendering, images, or third-party scripts. I would use the React Profiler and Chrome Performance panel to identify expensive rendering and long main-thread tasks. If the regression significantly affects users, I would roll back or disable the affected feature using a feature flag. After identifying the root cause, I would fix it, add a performance regression test or budget, deploy gradually, and monitor Web Vitals and error rates.

This answer demonstrates:

- debugging
- performance engineering
- production awareness
- incident management
- risk management
- observability

---

# Top 15 Scenarios You Must Practice

Before a senior React interview, be able to explain these without looking at notes:

1. React page suddenly becomes slow after deployment.
2. API is fast but UI is slow.
3. Search input sends hundreds of API requests.
4. Search results appear out of order.
5. Dashboard has 50 widgets.
6. Table contains 100,000 rows.
7. Browser memory continuously increases.
8. Mobile users experience freezes.
9. JavaScript bundle increased by 40%.
10. Lazy-loaded chunk fails after deployment.
11. Users receive stale application assets.
12. WebSocket causes excessive renders.
13. Production authentication starts failing.
14. One dashboard API fails but other widgets work.
15. Lighthouse is good but real users report poor performance.

---

# Final Interview Mindset

A senior React developer should not answer:

> "I will use `useMemo`."

A stronger answer is:

> "I will first profile the application, identify the expensive render or calculation, then choose the appropriate optimization. If memoization prevents meaningful repeated work, I will use it; otherwise I will avoid adding unnecessary complexity."

The key production mindset is:

```text
Don't guess.
   ↓
Measure.
   ↓
Find the bottleneck.
   ↓
Optimize.
   ↓
Measure again.
   ↓
Monitor production.
```

---

# Recommended Interview Preparation Order

```text
Level 1
React rendering
Hooks
State
Props
Context
Keys

        ↓

Level 2
React Profiler
Memoization
Code splitting
Lazy loading
Virtualization
Caching

        ↓

Level 3
Web Vitals
Bundle optimization
Network optimization
Memory leaks
Error boundaries
Security

        ↓

Level 4
Production debugging
Observability
Feature flags
Canary deployment
Rollback
Performance budgets

        ↓

Level 5
Architecture
Scalability
Micro-frontends
SSR/hydration
Web Workers
Advanced production incidents
```

---

## Interview Goal

You should be able to take any React production problem and explain:

```text
What is happening?
        ↓
Why is it happening?
        ↓
How will I prove it?
        ↓
How will I fix it?
        ↓
What are the trade-offs?
        ↓
How will I prevent it happening again?
```

That is the difference between a **React developer** and a **senior production-focused React engineer**.
