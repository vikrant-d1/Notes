# React Testing Interview Preparation

A comprehensive interview-preparation guide for **React + TypeScript + Jest + React Testing Library + MSW + Playwright**.

This README is designed for **mid-level to senior React developers** and covers testing fundamentals, practical implementation, real-world scenarios, debugging, architecture, CI/CD, and interview questions.

---

## Table of Contents

1. [Testing Philosophy](#1-testing-philosophy)
2. [Testing Pyramid](#2-testing-pyramid)
3. [Tooling](#3-tooling)
4. [Project Setup](#4-project-setup)
5. [Jest Fundamentals](#5-jest-fundamentals)
6. [React Testing Library](#6-react-testing-library)
7. [What Should You Test?](#7-what-should-you-test)
8. [Component Testing](#8-component-testing)
9. [User Interactions](#9-user-interactions)
10. [Forms and Validation](#10-forms-and-validation)
11. [Async Testing](#11-async-testing)
12. [API Testing with MSW](#12-api-testing-with-msw)
13. [Mocking](#13-mocking)
14. [Timers and Browser APIs](#14-timers-and-browser-apis)
15. [Hooks Testing](#15-hooks-testing)
16. [Context Testing](#16-context-testing)
17. [Redux Testing](#17-redux-testing)
18. [React Query Testing](#18-react-query-testing)
19. [Routing Testing](#19-routing-testing)
20. [Authentication Testing](#20-authentication-testing)
21. [Error and Loading States](#21-error-and-loading-states)
22. [Accessibility Testing](#22-accessibility-testing)
23. [Snapshot Testing](#23-snapshot-testing)
24. [Integration Testing](#24-integration-testing)
25. [E2E Testing with Playwright](#25-e2e-testing-with-playwright)
26. [React Server Components and Next.js](#26-react-server-components-and-nextjs)
27. [Test Coverage](#27-test-coverage)
28. [Flaky Tests](#28-flaky-tests)
29. [Testing Performance](#29-testing-performance)
30. [CI/CD Testing](#30-cicd-testing)
31. [Test Architecture](#31-test-architecture)
32. [Security Testing](#32-security-testing)
33. [Real-World Scenarios](#33-real-world-scenarios)
34. [Senior-Level Interview Questions](#34-senior-level-interview-questions)
35. [Practical Coding Questions](#35-practical-coding-questions)
36. [Common Mistakes](#36-common-mistakes)
37. [Interview Cheat Sheet](#37-interview-cheat-sheet)
38. [Final Checklist](#38-final-checklist)

---

# 1. Testing Philosophy

The goal of frontend testing is not to test implementation details.

The goal is to verify that:

> **The application behaves correctly from the user's perspective.**

Prefer:

```tsx
screen.getByRole("button", { name: /submit/i })
```

over:

```tsx
container.querySelector(".submit-button")
```

Prefer testing:

```text
User clicks Login
        ↓
Form validates
        ↓
API request happens
        ↓
Success state appears
```

rather than testing:

```text
setState() was called
```

### Testing principles

- Test behavior, not implementation.
- Prefer user-visible outcomes.
- Test important business logic.
- Keep tests deterministic.
- Avoid unnecessary mocks.
- Use integration tests for component collaboration.
- Use E2E tests for critical user journeys.
- Keep unit tests fast.
- Treat accessibility as part of quality.
- Test failure paths, not only happy paths.

---

# 2. Testing Pyramid

```text
                 /\
                /  \
               / E2E\
              /------\
             /Integr. \
            /----------\
           / Unit Tests \
          /--------------\
```

Typical strategy:

| Test | Speed | Scope | Example |
|---|---:|---|---|
| Unit | Very fast | Function/hook | `calculateTotal()` |
| Component | Fast | Component | Login form |
| Integration | Medium | Multiple components/services | Checkout |
| E2E | Slow | Entire application | Login → Checkout |
| Visual | Medium/slow | UI appearance | Screenshot comparison |

A healthy application normally has **many unit/component tests, fewer integration tests, and a smaller number of critical E2E tests**.

---

# 3. Tooling

Recommended stack:

```text
React
TypeScript
Jest
React Testing Library
@testing-library/user-event
@testing-library/jest-dom
MSW
Playwright
eslint-plugin-testing-library
eslint-plugin-jest-dom
```

### What each tool does

| Tool | Purpose |
|---|---|
| Jest | Test runner, assertions, mocks, coverage |
| React Testing Library | Render and query React UI |
| user-event | Simulate realistic user interactions |
| jest-dom | DOM-specific assertions |
| MSW | Mock network requests |
| Playwright | Browser/E2E testing |
| TypeScript | Compile-time safety |

---

# 4. Project Setup

Example structure:

```text
src/
├── components/
│   ├── LoginForm.tsx
│   └── LoginForm.test.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useAuth.test.ts
├── services/
│   └── userService.ts
├── pages/
├── test/
│   ├── setup.ts
│   ├── server.ts
│   └── handlers.ts
└── utils/
    └── formatCurrency.ts

e2e/
├── login.spec.ts
└── checkout.spec.ts
```

Example Jest setup:

```ts
// jest.config.ts
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
  ],
};

export default config;
```

Setup file:

```ts
import "@testing-library/jest-dom";
```

---

# 5. Jest Fundamentals

## 5.1 `describe`

Groups related tests.

```ts
describe("formatCurrency", () => {
  // tests
});
```

## 5.2 `test` / `it`

```ts
test("formats INR currency", () => {
  expect(formatCurrency(1000)).toBe("₹1,000");
});
```

## 5.3 Assertions

```ts
expect(value).toBe(10);

expect(value).toEqual({
  id: 1,
  name: "John",
});

expect(array).toContain("React");

expect(element).toBeInTheDocument();

expect(button).toBeDisabled();
```

## 5.4 `beforeEach`

```ts
beforeEach(() => {
  jest.clearAllMocks();
});
```

## 5.5 `afterEach`

```ts
afterEach(() => {
  cleanup();
});
```

## 5.6 `beforeAll` / `afterAll`

Use for expensive global setup/cleanup.

---

# 6. React Testing Library

Basic component test:

```tsx
import { render, screen } from "@testing-library/react";
import { LoginForm } from "./LoginForm";

test("renders login form", () => {
  render(<LoginForm />);

  expect(
    screen.getByRole("heading", { name: /login/i })
  ).toBeInTheDocument();
});
```

## Query priority

Prefer:

1. `getByRole`
2. `getByLabelText`
3. `getByPlaceholderText`
4. `getByText`
5. `getByDisplayValue`
6. `getByTestId`

Example:

```ts
screen.getByRole("button", { name: /login/i });
```

Avoid:

```ts
screen.getByTestId("login-button");
```

unless there is no better semantic query.

---

# 7. What Should You Test?

For a component ask:

### Rendering

- Does important UI render?
- Does conditional UI render?
- Are default values correct?

### Interaction

- Does clicking work?
- Does typing work?
- Does keyboard interaction work?

### State

- Does state change correctly?
- Are loading states displayed?
- Are errors displayed?

### API

- Does request happen?
- Is success handled?
- Is failure handled?

### Accessibility

- Can users find controls by role?
- Are form controls labelled?
- Is keyboard navigation supported?

### Edge cases

- Empty data
- Large data
- Invalid input
- Network failure
- Slow response
- Missing optional values

---

# 8. Component Testing

Example:

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <>
      <span aria-label="count">{count}</span>

      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </>
  );
}
```

Test:

```tsx
test("increments count", async () => {
  const user = userEvent.setup();

  render(<Counter />);

  expect(screen.getByLabelText("count")).toHaveTextContent("0");

  await user.click(
    screen.getByRole("button", { name: /increment/i })
  );

  expect(screen.getByLabelText("count")).toHaveTextContent("1");
});
```

### Important interview point

Do not test:

```ts
expect(setCount).toHaveBeenCalled();
```

Test the visible result:

```ts
expect(screen.getByText("1")).toBeInTheDocument();
```

---

# 9. User Interactions

Use `userEvent` instead of manually dispatching DOM events.

```ts
const user = userEvent.setup();

await user.click(button);

await user.type(input, "john@example.com");

await user.clear(input);

await user.selectOptions(select, "india");

await user.keyboard("{Enter}");
```

Example:

```tsx
test("user can enter email", async () => {
  const user = userEvent.setup();

  render(<LoginForm />);

  const input = screen.getByLabelText(/email/i);

  await user.type(input, "john@example.com");

  expect(input).toHaveValue("john@example.com");
});
```

---

# 10. Forms and Validation

Test:

- Required fields
- Invalid email
- Password rules
- Error messages
- Submit button
- Successful submission
- Server validation
- Disabled state

Example:

```tsx
test("shows validation error", async () => {
  const user = userEvent.setup();

  render(<LoginForm />);

  await user.click(
    screen.getByRole("button", { name: /login/i })
  );

  expect(
    await screen.findByText(/email is required/i)
  ).toBeInTheDocument();
});
```

### Important

Test validation from the user's perspective.

Do not only test:

```ts
expect(validateEmail("abc")).toBe(false);
```

Also test the actual form behavior.

---

# 11. Async Testing

Common async operations:

- API calls
- `useEffect`
- Promise resolution
- Lazy loading
- React Query
- Debounced search

Use:

```ts
findBy...
```

for elements that appear asynchronously.

```ts
expect(
  await screen.findByText(/welcome john/i)
).toBeInTheDocument();
```

Use:

```ts
waitFor(...)
```

when waiting for an assertion/state transition.

```ts
await waitFor(() => {
  expect(mockFn).toHaveBeenCalled();
});
```

### `getBy` vs `queryBy` vs `findBy`

| Query | Use |
|---|---|
| `getBy` | Element must exist immediately |
| `queryBy` | Element may not exist |
| `findBy` | Element appears asynchronously |

Example:

```ts
screen.getByText("Loading");

screen.queryByText("Error");

await screen.findByText("Success");
```

---

# 12. API Testing with MSW

Mock network requests at the network boundary.

Example handler:

```ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/users", () => {
    return HttpResponse.json([
      {
        id: 1,
        name: "John",
      },
    ]);
  }),
];
```

Server:

```ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

Setup:

```ts
beforeAll(() => server.listen());

afterEach(() => server.resetHandlers());

afterAll(() => server.close());
```

### Error response

```ts
server.use(
  http.get("/api/users", () => {
    return new HttpResponse(null, {
      status: 500,
    });
  })
);
```

Then test:

```ts
test("shows API error", async () => {
  render(<Users />);

  expect(
    await screen.findByText(/something went wrong/i)
  ).toBeInTheDocument();
});
```

### Why MSW?

Instead of mocking:

```ts
jest.mock("./userService");
```

you can test the real application behavior while controlling the network boundary.

---

# 13. Mocking

## Mock a function

```ts
const callback = jest.fn();

callback("hello");

expect(callback).toHaveBeenCalledWith("hello");
```

## Mock module

```ts
jest.mock("./analytics");
```

## Mock implementation

```ts
const mockFetch = jest.fn();

mockFetch.mockResolvedValue({
  data: [],
});
```

## Mock return value

```ts
jest
  .spyOn(Math, "random")
  .mockReturnValue(0.5);
```

### Mock only when necessary

Over-mocking creates tests that can pass while the real application is broken.

---

# 14. Timers and Browser APIs

## Fake timers

```ts
jest.useFakeTimers();

jest.advanceTimersByTime(1000);

jest.useRealTimers();
```

Useful for:

- Debounce
- Throttle
- Polling
- Countdown
- Auto logout
- Toast timeout

Example:

```ts
jest.useFakeTimers();

render(<AutoLogout />);

jest.advanceTimersByTime(60_000);

expect(screen.getByText(/session expired/i))
  .toBeInTheDocument();

jest.useRealTimers();
```

## Mock localStorage

```ts
localStorage.setItem("token", "abc");

expect(localStorage.getItem("token"))
  .toBe("abc");
```

## Mock matchMedia

Some UI libraries require:

```ts
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

---

# 15. Hooks Testing

Prefer testing hooks through the component that uses them.

Example:

```tsx
function UserProfile() {
  const { user } = useAuth();

  return <div>{user?.name}</div>;
}
```

Test:

```tsx
render(<UserProfile />);

expect(screen.getByText("John")).toBeInTheDocument();
```

For custom hooks where isolated testing is valuable, a hook-rendering utility can be used.

### Test:

- Initial state
- State transitions
- Async behavior
- Cleanup
- Dependencies
- Error states
- Side effects

### Important senior question

**Why shouldn't every custom hook be tested in isolation?**

Because the hook's actual contract is often its effect on the component and user-visible behavior. Isolated tests can over-focus on implementation.

---

# 16. Context Testing

Example:

```tsx
<AuthProvider>
  <Dashboard />
</AuthProvider>
```

Test the consumer through the provider.

```tsx
render(
  <AuthProvider>
    <Dashboard />
  </AuthProvider>
);

expect(
  screen.getByText(/welcome john/i)
).toBeInTheDocument();
```

Test:

- Default context
- Provider values
- Login/logout
- Permission changes
- Missing provider behavior

Create reusable test providers:

```tsx
function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      {ui}
    </AuthProvider>
  );
}
```

---

# 17. Redux Testing

Test Redux primarily through behavior.

Prefer:

```text
UI
 ↓
dispatch
 ↓
Redux
 ↓
selector
 ↓
UI
```

rather than testing every internal implementation detail.

Example:

```tsx
renderWithProviders(<Cart />);

await user.click(
  screen.getByRole("button", { name: /add to cart/i })
);

expect(
  screen.getByText("1 item")
).toBeInTheDocument();
```

### Test:

- Reducers for complex pure logic
- Selectors
- Async thunks
- Middleware where important
- UI + store integration

Avoid mocking the entire Redux store unnecessarily.

---

# 18. React Query Testing

Test:

- Loading
- Success
- Error
- Retry
- Refetch
- Cache behavior
- Mutation success/failure
- Optimistic updates

Use a fresh `QueryClient` per test.

```tsx
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}
```

Then:

```tsx
render(
  <QueryClientProvider client={createTestQueryClient()}>
    <Users />
  </QueryClientProvider>
);
```

Use MSW to control the server.

---

# 19. Routing Testing

Test:

- Navigation
- Protected routes
- Query parameters
- Route parameters
- Redirects
- 404
- Back/forward behavior

Example:

```tsx
expect(
  screen.getByRole("heading", {
    name: /dashboard/i,
  })
).toBeInTheDocument();
```

For navigation:

```ts
await user.click(
  screen.getByRole("link", { name: /profile/i })
);

expect(
  screen.getByRole("heading", { name: /profile/i })
).toBeInTheDocument();
```

---

# 20. Authentication Testing

Important scenarios:

### Login success

```text
Enter credentials
      ↓
POST /login
      ↓
Token/session created
      ↓
Redirect dashboard
```

### Login failure

```text
Invalid credentials
      ↓
401
      ↓
Error shown
      ↓
User remains on login
```

### Token expiration

```text
API → 401
     ↓
Refresh token
     ↓
Retry request
```

### Logout

Test:

- Session removed
- Protected data inaccessible
- Redirect to login
- Cache cleared if applicable

### Security

Do not put real production credentials/tokens in tests.

---

# 21. Error and Loading States

Every important API component should consider:

```text
Loading
Success
Empty
Error
Retry
```

Example:

```tsx
if (loading) return <Spinner />;

if (error) return <ErrorMessage />;

if (!users.length) return <EmptyState />;

return <UserList users={users} />;
```

Tests:

```ts
expect(screen.getByRole("status")).toBeInTheDocument();

expect(await screen.findByText("John"))
  .toBeInTheDocument();

expect(await screen.findByText(/no users/i))
  .toBeInTheDocument();

expect(await screen.findByText(/failed/i))
  .toBeInTheDocument();
```

---

# 22. Accessibility Testing

Testing should include accessibility.

Use semantic HTML:

```tsx
<button>Save</button>
```

rather than:

```tsx
<div onClick={save}>Save</div>
```

Test roles:

```ts
screen.getByRole("button", {
  name: /save/i,
});
```

Forms:

```ts
screen.getByLabelText(/email/i);
```

Consider integrating `jest-axe` for automated accessibility checks.

Example:

```ts
const { container } = render(<LoginForm />);

const results = await axe(container);

expect(results).toHaveNoViolations();
```

### Accessibility scenarios

- Keyboard navigation
- Focus management
- Labels
- Button names
- Error announcements
- Dialog accessibility
- ARIA attributes
- Color-independent meaning

---

# 23. Snapshot Testing

Example:

```ts
expect(container.firstChild)
  .toMatchSnapshot();
```

### Good use cases

- Stable generated UI
- Small presentational components
- Serialized structures

### Bad use cases

Avoid giant snapshots that nobody reviews.

Snapshot tests should not replace behavior tests.

Interview answer:

> Snapshot testing detects unexpected structural changes, but it does not prove that the UI behaves correctly.

---

# 24. Integration Testing

Integration testing verifies multiple pieces working together.

Example:

```text
LoginForm
   ↓
Auth Context
   ↓
API
   ↓
Session state
   ↓
Dashboard
```

A strong integration test can verify:

```text
User enters email/password
        ↓
Clicks Login
        ↓
MSW responds 200
        ↓
Auth state changes
        ↓
Dashboard appears
```

This often provides more confidence than many isolated mocks.

---

# 25. E2E Testing with Playwright

Playwright tests the real application in a browser.

Example:

```ts
import { test, expect } from "@playwright/test";

test("user can login", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill(
    "john@example.com"
  );

  await page.getByLabel("Password").fill(
    "password123"
  );

  await page.getByRole("button", {
    name: /login/i,
  }).click();

  await expect(
    page.getByRole("heading", {
      name: /dashboard/i,
    })
  ).toBeVisible();
});
```

### E2E scenarios

- Login
- Logout
- Checkout
- Payment
- Search
- File upload
- Multi-step forms
- Permissions
- Critical navigation
- Error recovery

### Avoid

Hundreds of E2E tests for every tiny UI detail.

---

# 26. React Server Components and Next.js

For Next.js applications, distinguish:

```text
Server Component
Client Component
Route Handler
Server Action
API
Browser
```

Test business behavior at the appropriate boundary.

### Server-side concerns

- Data fetching
- Authorization
- Redirects
- Server actions
- Serialization
- Error handling

### Client-side concerns

- Interaction
- State
- Browser APIs
- Accessibility

### E2E

Use Playwright for critical flows involving the actual Next.js application.

---

# 27. Test Coverage

Run:

```bash
npm test -- --coverage
```

Typical metrics:

```text
Statements
Branches
Functions
Lines
```

Do not blindly target:

```text
100% coverage
```

Instead target meaningful coverage of:

- Business logic
- Critical flows
- Error paths
- Security-sensitive behavior
- Important edge cases

### Branch coverage matters

This:

```ts
if (user) {
  return user.name;
}

return "Guest";
```

requires tests for both branches.

---

# 28. Flaky Tests

A flaky test sometimes passes and sometimes fails without code changes.

Common causes:

- Race conditions
- Arbitrary `setTimeout`
- Shared state
- Tests depending on order
- Network calls
- Date/time
- Random values
- Uncleaned mocks
- Async assertions missing `await`

Bad:

```ts
setTimeout(() => {
  expect(...);
}, 1000);
```

Better:

```ts
expect(
  await screen.findByText("Success")
).toBeInTheDocument();
```

### Debugging checklist

```text
1. Reproduce locally
2. Run test repeatedly
3. Check async boundaries
4. Remove arbitrary delays
5. Reset mocks
6. Isolate shared state
7. Check timers
8. Check network mocks
9. Check timezone/date assumptions
10. Run in CI-like environment
```

---

# 29. Testing Performance

Large test suites become slow because of:

- Too many E2E tests
- Heavy setup
- Excessive rendering
- Huge snapshots
- Unnecessary module mocks
- Real network dependencies
- Shared global state

### Improve performance

- Keep unit tests small.
- Use MSW instead of real APIs.
- Avoid unnecessary browser tests.
- Parallelize independent tests.
- Reuse setup safely.
- Split test projects.
- Run focused tests during development.

---

# 30. CI/CD Testing

Typical pipeline:

```text
Install
  ↓
Lint
  ↓
TypeScript
  ↓
Unit tests
  ↓
Integration tests
  ↓
Build
  ↓
E2E
  ↓
Deploy
```

Example:

```yaml
name: test

on:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --coverage
      - run: npm run build
```

For Playwright:

```bash
npx playwright install --with-deps
npx playwright test
```

---

# 31. Test Architecture

Recommended structure:

```text
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx
├── features/
│   └── checkout/
│       ├── Checkout.tsx
│       ├── Checkout.test.tsx
│       └── checkout.handlers.ts
├── test/
│   ├── setup.ts
│   ├── server.ts
│   ├── handlers.ts
│   └── render.tsx
└── utils/

e2e/
├── auth.spec.ts
├── checkout.spec.ts
└── search.spec.ts
```

Create a custom render helper:

```tsx
export function renderWithProviders(
  ui: React.ReactElement
) {
  return render(
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          {ui}
        </MemoryRouter>
      </QueryClientProvider>
    </AuthProvider>
  );
}
```

This avoids repeating provider setup.

---

# 32. Security Testing

Frontend tests should verify security-related behavior such as:

- Unauthorized users cannot access protected UI.
- Expired sessions redirect correctly.
- Dangerous HTML is not rendered unsafely.
- Sensitive information is not displayed.
- Logout removes access.
- Permission-based UI is correct.
- Error messages do not leak secrets.
- XSS-sensitive inputs are handled safely.

Example:

```tsx
expect(
  screen.queryByText(/internal secret/i)
).not.toBeInTheDocument();
```

Do not treat frontend tests as a replacement for backend security testing.

---

# 33. Real-World Scenarios

## Scenario 1: Login API returns 500

**Question:** How would you test it?

**Answer:**

Use MSW to return HTTP 500 and verify:

- Loading disappears.
- Error message appears.
- User remains on login.
- Retry is available if supported.
- Password is not unexpectedly cleared unless designed that way.

---

## Scenario 2: API takes 5 seconds

Test:

```text
Loading shown
        ↓
No success UI yet
        ↓
Response arrives
        ↓
Success UI
```

Use a controlled MSW response rather than `sleep()`.

---

## Scenario 3: Search API fires on every keystroke

Requirement:

> Search only after 300ms debounce.

Test:

```text
Type "react"
↓
Only one API request
↓
Request happens after debounce
```

Use fake timers carefully.

---

## Scenario 4: Search returns no results

Verify:

```text
Search
 ↓
200 []
 ↓
"No results found"
```

---

## Scenario 5: User double-clicks submit

Verify:

```text
First click → request
Second click → ignored
```

Assert that the request handler is invoked only once.

---

## Scenario 6: Token expires during request

Test:

```text
GET /profile → 401
       ↓
POST /refresh
       ↓
GET /profile again
       ↓
Profile shown
```

Also test refresh failure:

```text
401
 ↓
refresh fails
 ↓
logout
 ↓
login page
```

---

## Scenario 7: User has admin role

Test:

```text
Admin → Delete button visible
User  → Delete button hidden
```

Also test backend authorization separately.

---

## Scenario 8: Empty shopping cart

Verify:

```text
Cart opened
 ↓
No products
 ↓
Empty state
 ↓
Continue Shopping
```

---

## Scenario 9: Checkout payment fails

Test:

```text
Checkout
 ↓
Payment API → 402/500
 ↓
Payment error
 ↓
Order not shown as successful
 ↓
Retry available
```

---

## Scenario 10: Optimistic update fails

Example:

```text
User likes post
 ↓
UI immediately shows liked
 ↓
API fails
 ↓
UI rolls back
 ↓
Error appears
```

This is an important senior-level testing scenario.

---

## Scenario 11: File upload fails

Test:

- Unsupported type
- File too large
- Network failure
- Upload progress
- Retry
- Successful upload

---

## Scenario 12: Pagination

Test:

```text
Page 1
 ↓
Next
 ↓
Page 2
 ↓
Previous
 ↓
Page 1
```

Also:

- First page disables previous.
- Last page disables next.
- Loading state.
- Empty page.

---

## Scenario 13: Infinite scroll

Test:

```text
Initial data
 ↓
Scroll
 ↓
Next API request
 ↓
Items appended
```

Verify duplicates are not added.

---

## Scenario 14: Modal

Test:

- Opens
- Closes
- Escape closes
- Close button works
- Focus management
- Background interaction is prevented
- Correct accessible name

---

## Scenario 15: Toast notification

Test:

```text
Action
 ↓
Toast appears
 ↓
Toast disappears after configured duration
```

Use fake timers rather than waiting real time.

---

## Scenario 16: Permission-based UI

Given:

```ts
permissions = ["READ_USERS"];
```

Verify:

```text
Users page → visible
Delete → hidden
```

---

## Scenario 17: Feature flag

Test both:

```text
featureFlag = true
featureFlag = false
```

Verify the correct UI.

---

## Scenario 18: Date-dependent UI

Avoid relying on the real current date.

Mock time:

```ts
jest.useFakeTimers();

jest.setSystemTime(
  new Date("2026-01-01")
);
```

Then test predictable behavior.

---

## Scenario 19: Timezone bug

Test a date near midnight:

```text
2026-01-01 23:30 UTC
```

Verify the displayed date for the expected timezone.

Do not assume the CI server uses the developer's timezone.

---

## Scenario 20: Race condition

Example:

```text
Search "re"
  ↓
Request A

Search "react"
  ↓
Request B

B returns first
A returns later
```

Verify stale response A does not overwrite B.

---

## Scenario 21: Component crashes

Use an Error Boundary.

Test:

```text
Child throws
 ↓
Error Boundary catches
 ↓
Fallback UI appears
```

---

## Scenario 22: Network goes offline

Test:

```text
Network unavailable
 ↓
Offline UI
 ↓
Retry
 ↓
Network restored
 ↓
Data loads
```

---

## Scenario 23: React Query retry

Test:

```text
Request fails
 ↓
Retry
 ↓
Request succeeds
 ↓
UI displayed
```

Also test when retry should stop.

---

## Scenario 24: Cache invalidation

Example:

```text
Get users
 ↓
Cache

Create user
 ↓
Mutation succeeds
 ↓
Users query invalidated
 ↓
New user appears
```

---

## Scenario 25: Multiple components share state

Example:

```text
Header cart count
       ↑
       |
Cart state
       |
       ↓
Cart page
```

Test the user behavior rather than testing state internals.

---

## Scenario 26: Accessibility regression

A button changes from:

```html
<button>Save</button>
```

to:

```html
<div>Save</div>
```

A good semantic query should catch the regression:

```ts
screen.getByRole("button", {
  name: /save/i,
});
```

---

## Scenario 27: Slow API + navigation

Test:

```text
Page A loading
 ↓
Navigate Page B
 ↓
A request resolves
```

Verify Page A does not update Page B incorrectly.

---

## Scenario 28: Component unmount during request

Test that async completion does not cause invalid state updates or unexpected UI changes after unmount.

---

## Scenario 29: Retry button

Test:

```text
API fails
 ↓
Error shown
 ↓
Click Retry
 ↓
API succeeds
 ↓
Content shown
```

---

## Scenario 30: Duplicate requests

If one user action should make one API call:

```ts
expect(requestMock).toHaveBeenCalledTimes(1);
```

But avoid asserting implementation details unless the request count itself is a business requirement.

---

## Scenario 31: Permission changes while user is on page

Test:

```text
Admin
 ↓
Delete visible

Permission revoked
 ↓
Delete disappears
```

---

## Scenario 32: Browser back button

E2E test:

```text
Home
 ↓
Products
 ↓
Product Details
 ↓
Back
 ↓
Products
```

---

## Scenario 33: Refresh after login

Test that the application restores the expected authenticated state after browser refresh when the product design supports persistence.

---

## Scenario 34: Logout in another tab

If cross-tab synchronization is supported, test storage events or the chosen synchronization mechanism.

---

## Scenario 35: Large list

Test:

- Rendering correctness
- Pagination/virtualization
- User interaction
- Performance-sensitive behavior

Do not make tests depend on thousands of unnecessary DOM nodes unless that is what you are explicitly testing.

---

## Scenario 36: Third-party payment SDK

Do not call the real payment provider in unit/integration tests.

Mock the external boundary and test:

```text
Checkout
 ↓
SDK initialized
 ↓
Payment initiated
 ↓
Success/failure handled
```

Use sandbox/E2E environments for higher-level verification.

---

## Scenario 37: WebSocket updates

Test:

```text
Initial state
 ↓
WebSocket event
 ↓
UI updates
```

Also test:

- Disconnect
- Reconnect
- Duplicate event
- Cleanup on unmount

---

## Scenario 38: Polling

Test:

```text
Initial request
 ↓
Timer
 ↓
Second request
 ↓
Timer
 ↓
Third request
```

Use fake timers.

---

## Scenario 39: Drag and drop

Test the actual user-visible outcome:

```text
Drag item
 ↓
Drop into column
 ↓
Item appears in new column
```

Avoid testing only low-level event calls.

---

## Scenario 40: Keyboard-only user

Test:

```text
Tab
 ↓
Enter
 ↓
Dialog
 ↓
Escape
```

This catches many accessibility regressions.

---

# 34. Senior-Level Interview Questions

## Q1. Why React Testing Library instead of Enzyme?

React Testing Library encourages testing from the user's perspective and reduces dependence on React component implementation details.

---

## Q2. What is the difference between unit and integration testing?

**Unit testing** isolates a small unit.

**Integration testing** verifies multiple units working together.

Example:

```text
Unit:
validateEmail()

Integration:
LoginForm + Auth + API
```

---

## Q3. When would you use MSW?

When testing application behavior involving network requests while keeping the real request layer intact.

---

## Q4. Why prefer `userEvent` over `fireEvent`?

`userEvent` models realistic user interactions and often triggers the sequence of DOM events a real user interaction causes.

---

## Q5. Why avoid testing implementation details?

Because implementation can change without changing user-visible behavior. Tests should ideally survive refactoring.

---

## Q6. `getByRole` vs `getByTestId`?

`getByRole` verifies semantic accessibility and user-visible behavior.

`data-testid` is a fallback when no useful semantic query exists.

---

## Q7. When should you use `waitFor`?

When waiting for an asynchronous assertion or state transition that doesn't map cleanly to a `findBy...` query.

---

## Q8. How do you test API failures?

Mock the network response using MSW and verify the UI's error behavior.

---

## Q9. How do you test debounce?

Use fake timers and assert the request occurs after the debounce interval, not on every keystroke.

---

## Q10. How do you reduce flaky tests?

Remove arbitrary delays, control time/network/randomness, isolate state, await asynchronous operations, and reset mocks between tests.

---

## Q11. Should every component have a test?

No. Test important behavior and risk. Tiny components with no meaningful behavior may not need dedicated tests.

---

## Q12. Should you aim for 100% coverage?

No. Coverage is a signal, not proof of quality. Meaningful branch and behavior coverage matter more.

---

## Q13. What is a good E2E test?

A critical user journey that provides high confidence in the complete system.

Examples:

- Login
- Checkout
- Payment
- Account creation

---

## Q14. What should not be mocked?

Avoid mocking everything. Do not mock the component under test or internal implementation simply to make assertions easier.

---

## Q15. How do you test Redux?

Use real store configuration for integration tests and test reducers/selectors directly when their logic is sufficiently complex.

---

## Q16. How do you test React Query?

Use a fresh QueryClient per test and MSW for network behavior.

---

## Q17. How do you test authentication?

Test success, failure, expiration, refresh, logout, protected routes, permissions, and persistence behavior.

---

## Q18. How do you test accessibility?

Use semantic queries, keyboard interaction tests, and optionally automated tools such as axe.

---

## Q19. How do you debug a test that passes locally but fails in CI?

Check:

```text
Timezone
Locale
Node version
Browser version
Environment variables
Race conditions
Test order
Network mocks
Timers
Filesystem assumptions
```

---

## Q20. How do you test race conditions?

Control asynchronous responses and intentionally resolve them in different orders.

---

# 35. Practical Coding Questions

## Coding Question 1

Write a test for:

```tsx
<button onClick={handleSave}>
  Save
</button>
```

Expected:

```ts
await user.click(
  screen.getByRole("button", {
    name: /save/i,
  })
);

expect(handleSave).toHaveBeenCalled();
```

---

## Coding Question 2

Test a loading state.

```ts
render(<Users />);

expect(
  screen.getByRole("status")
).toBeInTheDocument();
```

---

## Coding Question 3

Test async success.

```ts
expect(
  await screen.findByText("John")
).toBeInTheDocument();
```

---

## Coding Question 4

Test missing element.

```ts
expect(
  screen.queryByText("Admin")
).not.toBeInTheDocument();
```

---

## Coding Question 5

Test button disabled state.

```ts
expect(
  screen.getByRole("button", {
    name: /submit/i,
  })
).toBeDisabled();
```

---

## Coding Question 6

Test checkbox.

```ts
const checkbox = screen.getByRole("checkbox");

await user.click(checkbox);

expect(checkbox).toBeChecked();
```

---

## Coding Question 7

Test select.

```ts
await user.selectOptions(
  screen.getByRole("combobox"),
  "india"
);

expect(
  screen.getByRole("combobox")
).toHaveValue("india");
```

---

## Coding Question 8

Test API error with MSW.

```ts
server.use(
  http.get("/api/users", () => {
    return new HttpResponse(null, {
      status: 500,
    });
  })
);

render(<Users />);

expect(
  await screen.findByText(/failed/i)
).toBeInTheDocument();
```

---

# 36. Common Mistakes

## Mistake 1: Testing implementation details

Bad:

```ts
expect(component.state.count).toBe(1);
```

Better:

```ts
expect(screen.getByText("1")).toBeInTheDocument();
```

---

## Mistake 2: Too many snapshots

Large snapshots become difficult to review.

---

## Mistake 3: Arbitrary sleeps

Bad:

```ts
await new Promise(resolve =>
  setTimeout(resolve, 2000)
);
```

Use deterministic async utilities.

---

## Mistake 4: Testing only happy paths

Always test:

```text
Success
Error
Empty
Loading
Edge cases
```

---

## Mistake 5: Mocking every dependency

Too many mocks can make tests unrealistic.

---

## Mistake 6: Shared mutable state

Each test should be isolated.

---

## Mistake 7: Not resetting mocks

Use:

```ts
afterEach(() => {
  jest.clearAllMocks();
});
```

or appropriate reset/restore behavior depending on the mock strategy.

---

## Mistake 8: Using `getByTestId` everywhere

Prefer semantic queries.

---

## Mistake 9: Testing implementation-specific CSS

Avoid tests such as:

```ts
expect(element).toHaveClass("text-red-500");
```

unless the class itself represents meaningful behavior.

---

## Mistake 10: Only unit testing

A large suite of unit tests does not prove that the application works end-to-end.

---

# 37. Interview Cheat Sheet

## Queries

```ts
getByRole()
getByLabelText()
getByText()
getByPlaceholderText()
getByTestId()

queryBy...

findBy...
```

## User interaction

```ts
const user = userEvent.setup();

await user.click();
await user.type();
await user.clear();
await user.keyboard();
await user.selectOptions();
```

## Assertions

```ts
toBeInTheDocument()
toBeVisible()
toBeDisabled()
toBeEnabled()
toBeChecked()
toHaveValue()
toHaveTextContent()
toHaveAttribute()
toHaveBeenCalled()
toHaveBeenCalledWith()
```

## Async

```ts
await screen.findBy...
await waitFor(...)
```

## Jest

```ts
jest.fn()
jest.mock()
jest.spyOn()
jest.useFakeTimers()
jest.advanceTimersByTime()
jest.setSystemTime()
```

## MSW

```text
http.get()
http.post()
HttpResponse.json()
server.use()
server.resetHandlers()
```

## Playwright

```ts
page.goto()
page.getByRole()
page.getByLabel()
locator()
expect().toBeVisible()
expect().toHaveText()
```

---

# 38. Final Checklist

Before a senior React testing interview, be able to explain and implement:

### Fundamentals

- [ ] Testing pyramid
- [ ] Unit vs integration vs E2E
- [ ] Jest
- [ ] React Testing Library
- [ ] `getBy` vs `queryBy` vs `findBy`
- [ ] `userEvent`
- [ ] jest-dom

### React

- [ ] Component testing
- [ ] Hooks
- [ ] Context
- [ ] Forms
- [ ] Conditional rendering
- [ ] Error boundaries
- [ ] Lazy loading
- [ ] Suspense

### State

- [ ] Redux
- [ ] Context
- [ ] React Query
- [ ] Cache invalidation
- [ ] Optimistic updates

### API

- [ ] MSW
- [ ] Success
- [ ] 400
- [ ] 401
- [ ] 403
- [ ] 404
- [ ] 500
- [ ] Timeout
- [ ] Retry
- [ ] Network failure

### Advanced

- [ ] Mocking
- [ ] Fake timers
- [ ] Race conditions
- [ ] Debounce
- [ ] Throttle
- [ ] WebSockets
- [ ] Polling
- [ ] File upload
- [ ] Accessibility
- [ ] Performance
- [ ] Flaky tests

### E2E

- [ ] Playwright
- [ ] Login
- [ ] Checkout
- [ ] Payment
- [ ] Search
- [ ] Permissions
- [ ] Navigation
- [ ] Browser storage

### CI/CD

- [ ] GitHub Actions
- [ ] Coverage
- [ ] Parallel tests
- [ ] Test artifacts
- [ ] Playwright reports
- [ ] Debugging CI failures

---

# Recommended Interview Strategy

For each testing question, answer using this structure:

```text
1. Explain the concept
2. Explain why it matters
3. Show a small code example
4. Explain the real-world scenario
5. Explain edge cases
6. Explain common mistakes
```

Example:

> **Question:** How do you test an API failure?

Strong senior answer:

```text
I prefer mocking the network boundary with MSW rather than mocking
the service module. I configure the handler to return a 500 response,
render the component, wait for the error state, and verify the user-visible
error and retry behavior. I also test loading, success, empty, timeout,
and authentication failure cases.
```

---

# Senior-Level Mental Model

When designing tests, think:

```text
                    USER
                      |
                      v
                UI / Browser
                      |
                      v
              React Components
                      |
          +-----------+-----------+
          |                       |
          v                       v
       State                    Hooks
          |                       |
          +-----------+-----------+
                      |
                      v
                   API
                      |
                      v
                 Backend
```

Test each boundary appropriately:

```text
Pure business logic → Unit test

Component behavior → React Testing Library

Component + state + API → Integration test

Network behavior → MSW

Critical user journey → Playwright

Accessibility → RTL + axe

Performance → Dedicated performance tests

Security → Frontend + backend security testing
```

The key senior-level principle is:

> **Use the highest-level test that gives useful confidence without making the suite unnecessarily slow or brittle.**
