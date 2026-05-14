# Senior Developer Q&A — enableFE (9 Years Experience Level)

> **Project:** Composites One B2B E-Commerce Platform  
> **Stack:** Next.js 14, TypeScript, Redux Toolkit, Tailwind CSS, Contentstack CMS, OpenTelemetry  
> **Audience:** 9-year experienced frontend/fullstack developers  

---

## Table of Contents

1. [Next.js & React Architecture](#1-nextjs--react-architecture)
2. [State Management — Redux Toolkit](#2-state-management--redux-toolkit)
3. [API Layer & Axios Interceptors](#3-api-layer--axios-interceptors)
4. [TypeScript Patterns](#4-typescript-patterns)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Internationalization (i18n)](#6-internationalization-i18n)
7. [Performance Optimization](#7-performance-optimization)
8. [CMS Integration (Contentstack)](#8-cms-integration-contentstack)
9. [Observability — OpenTelemetry](#9-observability--opentelemetry)
10. [Feature Flags — OpenFeature](#10-feature-flags--openfeature)
11. [Testing Strategy](#11-testing-strategy)
12. [System Design Questions](#12-system-design-questions)
13. [Architecture Trade-offs & Decisions](#13-architecture-trade-offs--decisions)

---

## 1. Next.js & React Architecture

---

**Q1. This project uses Next.js App Router with route groups like `(auth)` and `(pages-with-common-header)`. What is the purpose of route groups and how do they differ from regular nested routes?**

**A:**  
Route groups (parentheses syntax) organize routes without affecting the URL path. `(auth)` and `(pages-with-common-header)` allow different layouts per section:
- `(auth)` routes get a minimal layout (no header/footer) for sign-in, sign-up flows.
- `(pages-with-common-header)` routes share a common shell (header/footer).
- The folder name in parentheses is excluded from the URL — `/app/(auth)/sign-in/page.tsx` maps to `/sign-in`, not `/(auth)/sign-in`.

This is critical for avoiding layout duplication without polluting the URL structure. Contrast with a regular folder `auth/sign-in` which would include `auth/` in the URL.

---

**Q2. The project uses dynamic `[lang]` routing for internationalization. How does Next.js App Router handle dynamic segments differently from Pages Router, and what are the implications for SSR and caching?**

**A:**  
In App Router, dynamic segments like `[lang]` cause all nested routes to be dynamic by default unless you use `generateStaticParams()` to pre-render at build time. Key implications:
- Without `generateStaticParams`, every request triggers a new server render.
- With it, Next.js generates one HTML file per locale (en-us, en-ca, fr-ca, etc.) at build time — this is Incremental Static Regeneration (ISR).
- The `[lang]` parameter flows as a prop into every layout and page without needing `useRouter()`.
- In Pages Router, you'd use `getStaticPaths` + `getStaticProps`, which is more explicit but less composable with nested layouts.

For this project with 7 locales, SSG with `generateStaticParams` for static-content pages and dynamic rendering for user-specific pages (cart, account) is the optimal hybrid strategy.

---

**Q3. Explain the significance of `"use client"` in this codebase. How do Server Components and Client Components split responsibilities, and what mistake do developers commonly make with this directive?**

**A:**  
- **Server Components** (default in App Router): run only on the server, can't use hooks, browser APIs, or event handlers. They can directly access databases, secrets, and reduce JS bundle size.
- **Client Components** (`"use client"`): run in the browser with full React interactivity (hooks, events, Redux).

In this project, components like `SignIn`, `Cart`, `OrderHistory` are all client components because they need state, effects, and event handlers. Layout wrappers can be server components passing props to client children.

**Common mistake:** Adding `"use client"` to a parent component unnecessarily makes its entire subtree client-side, including components that could remain server-only. The rule is to push `"use client"` as deep as possible — only to the interactive leaf components.

Another mistake: importing a client component into a server component is fine, but importing a server component into a client component silently downgrades the server component to a client component.

---

**Q4. The project uses a custom `ErrorBoundary` class component wrapping the app. Why is a class component still required for error boundaries in React 18, and what are the limitations of the current `error.tsx` approach in App Router?**

**A:**  
React's `componentDidCatch` and `getDerivedStateFromError` lifecycle methods have no functional component equivalent — this is a deliberate React decision because error recovery requires class-based lifecycle semantics. Functional components can't declare these.

In App Router, `error.tsx` files are React's built-in error boundary per route segment. However, they:
- Only catch errors thrown during rendering, not in event handlers or async code outside render.
- Don't catch errors in the root layout — for that, a `global-error.tsx` is needed.
- Are automatically `"use client"` components since they need to reset state.

A custom `ErrorBoundary` wrapping the entire app gives you more control over error logging (sending to OpenTelemetry in this case) and fallback UI logic.

---

**Q5. How does the `middleware.tsx` in this project work, and what are the performance considerations when running Next.js Middleware?**

**A:**  
The middleware runs at the Edge (before the request reaches the Next.js server) for every request matching the configured pattern. In this project it handles:
1. Language detection from cookies → sets locale cookie, redirects to localized URL.
2. Token validation → redirects unauthenticated users to sign-in.
3. Protected route enforcement.
4. Query parameter sanitization for product listing pages.
5. Media request rewriting (`/api/media` → external asset API).

**Performance considerations:**
- Middleware runs on every request, so it must be fast. Avoid heavy computation, external DB calls, or large imports — it runs in the Edge Runtime which has a limited Node.js API surface.
- Heavy auth validation (e.g., JWT signature verification) should be done here, not in each page component, to centralize the overhead.
- Use `matcher` config to scope middleware only to relevant routes, not static assets (`_next/static`, `favicon.ico`, etc.).
- Cold starts are minimal at the Edge but still exist — keep the middleware bundle small.

---

## 2. State Management — Redux Toolkit

---

**Q6. The project separates Redux async API calls into `redux/requests/` files rather than colocating them in slices. What are the architectural benefits and trade-offs of this pattern?**

**A:**  
**Benefits:**
- **Separation of concerns:** Slices define shape and reducers; requests define async side effects. You can test them independently.
- **Reusability:** A thunk in `requests/user.tsx` can be dispatched from multiple components without duplication.
- **Readability:** Slices remain focused on state transitions; business logic lives in one discoverable location.
- **Team scaling:** Different developers can work on request logic vs. UI state logic with fewer merge conflicts.

**Trade-offs:**
- **Indirection:** Debugging requires jumping between the slice, the request file, and the component — more cognitive overhead.
- **Boilerplate:** `createAsyncThunk` + `extraReducers` adds verbosity vs. a simple `useQuery` from React Query.
- **Over-globalization:** Not every API response needs to live in global Redux state. Component-local state or React Query for server state would reduce Redux's surface area.

For a B2B platform with shared state across many views (cart count, user role, notifications), global Redux is justified. For isolated page data, React Query would be leaner.

---

**Q7. Explain how `createAsyncThunk` handles the three states (pending/fulfilled/rejected) and how `extraReducers` maps them. What is the risk of not handling `rejected` in the slice?**

**A:**  
```ts
// Request file
export const getCompanyData = createAsyncThunk(
  'user/getCompanyData',
  async (payload, { rejectWithValue }) => {
    try {
      return await apiService().get('/company');
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);

// Slice extraReducers
builder
  .addCase(getCompanyData.pending, (state) => { state.loading = true; })
  .addCase(getCompanyData.fulfilled, (state, action) => {
    state.loading = false;
    state.company = action.payload;
  })
  .addCase(getCompanyData.rejected, (state, action) => {
    state.loading = false;
    state.error = action.payload; // rejectWithValue payload
  });
```

**Risk of missing `rejected`:** The `loading` flag stays `true` forever after a failed request, causing infinite spinners or stale data. The UI has no way to recover, show an error message, or retry. In production B2B apps, API errors are common (network, auth expiry, server errors) — unhandled rejections silently break UX.

---

**Q8. This project uses typed Redux hooks (`useAppDispatch`, `useAppSelector`). Why is this necessary and what problem does it solve over raw `useDispatch`/`useSelector`?**

**A:**  
```ts
// hooks.ts
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

Raw `useDispatch()` returns `Dispatch<AnyAction>` — TypeScript cannot infer which actions are valid, losing all type checking on dispatch calls. Raw `useSelector` requires you to manually annotate `state: RootState` every time.

With typed hooks:
- `useAppDispatch` knows the store's dispatch type, including thunk middleware — so dispatching async thunks works with proper types.
- `useAppSelector` auto-types the `state` parameter, giving IDE autocomplete for every slice property.
- Prevents bugs like dispatching wrong action types or accessing non-existent state properties.

This is a standard Redux Toolkit pattern recommended in the official docs and essential at scale.

---

**Q9. When would you choose Redux Toolkit's `RTK Query` over the custom `createAsyncThunk` + `axios` approach used in this project?**

**A:**  
**RTK Query advantages:**
- Automatic cache management, deduplication, background refetching.
- Built-in loading/error/success states without manual `extraReducers`.
- Automatic cache invalidation with tags.
- Polling support out of the box.
- Reduces 60-70% of boilerplate for standard CRUD operations.

**Current approach advantages:**
- Full control over request headers (the axios interceptors adding auth tokens, trace context, locale headers are critical here).
- Custom error handling (translating error codes to i18n messages).
- Fine-grained control over retry logic, cancellation, and request transformation.
- Easier to integrate with existing Axios-based infrastructure.

**When to migrate:** RTK Query fits well for read-heavy, cache-sensitive data (product catalog, CMS content). The current custom approach is better for write operations and requests requiring the complex interceptor chain. A hybrid approach — RTK Query for reads, custom thunks for writes — would be optimal for this project.

---

## 3. API Layer & Axios Interceptors

---

**Q10. The `apiService.ts` uses Axios interceptors for multiple cross-cutting concerns. Walk through what each interceptor does and explain why interceptors are better than manually adding these concerns in each request.**

**A:**  
The interceptors in `apiService.ts` handle:

**Request Interceptors:**
1. **Auth token injection** — Reads JWT from cookies, adds `Authorization: Bearer <token>` header.
2. **Impersonation header** — Adds CSR/employee impersonation token when present.
3. **Locale extraction** — Reads `lang` from URL path segments, adds to headers or query params.
4. **OpenTelemetry trace injection** — Injects W3C `traceparent` / `tracestate` headers for distributed tracing.

**Response Interceptors:**
1. **401 handling** — Auto-clears tokens, redirects to sign-in.
2. **Error code translation** — Maps API error codes (e.g., `ERR_INVALID_ITEM`) to translated i18n messages.
3. **Blob handling** — For PDF/CSV exports, sets correct response type without transformation.

**Why interceptors:**
- **DRY principle:** Without interceptors, 20+ request files would each need to manually add auth headers, trace context, and error handling — a maintenance nightmare.
- **Centralized updates:** Change the auth header name once in the interceptor; all requests update automatically.
- **Separation of concerns:** Business logic in thunks stays clean; infrastructure concerns live in one file.
- **Testability:** Mock the Axios instance once in tests rather than mocking every individual concern.

---

**Q11. The project has two separate API service instances: `apiService()` for the main API and `apiServiceCms()` for Contentstack. Why would you create separate Axios instances rather than using a single shared instance?**

**A:**  
Different backends have fundamentally different requirements:

| Concern | Main API | Contentstack CMS |
|---|---|---|
| Auth | Bearer JWT (user session) | API key (static credential) |
| Base URL | Backend microservice URL | Contentstack CDN |
| Error handling | Translate codes to i18n | CMS-specific error handling |
| Tracing | OpenTelemetry headers | Not needed |
| Response transform | Custom error mapping | CMS-specific data shape |

Sharing one instance would require conditionals throughout the interceptors (`if (isCmsRequest) { ... }`), making them messy and hard to test. Separate instances give clean, predictable behavior for each backend.

Also, Contentstack has its own SDK (`@contentstack/live-preview-utils`) with specific requirements — wrapping it in a dedicated service keeps the integration isolated.

---

**Q12. How would you handle request cancellation in this codebase for scenarios like rapid search input or navigating away from a page mid-fetch?**

**A:**  
Using Axios `CancelToken` (legacy) or the modern `AbortController`:

```ts
// In a custom hook or component
const controllerRef = useRef<AbortController | null>(null);

const fetchProducts = async (query: string) => {
  controllerRef.current?.abort(); // Cancel previous request
  controllerRef.current = new AbortController();
  
  try {
    const response = await apiService().get('/products', {
      params: { q: query },
      signal: controllerRef.current.signal,
    });
    dispatch(setProducts(response.data));
  } catch (err) {
    if (err.name !== 'AbortError') throw err; // Ignore cancellations
  }
};

useEffect(() => {
  return () => controllerRef.current?.abort(); // Cleanup on unmount
}, []);
```

For Redux Thunks, `createAsyncThunk` provides a `signal` in the thunk argument that propagates to the Axios call. The project's current `useDebounce` hook handles the rapid-input case — combining debounce + cancellation is the full solution for search.

---

## 4. TypeScript Patterns

---

**Q13. The project uses TypeScript strict mode. Name three common TypeScript issues that strict mode catches that non-strict mode would miss, with examples relevant to this codebase.**

**A:**

**1. `strictNullChecks` — null/undefined access:**
```ts
// Without strict: compiles fine
const user = getUser(); // returns User | null
console.log(user.email); // Runtime crash if user is null

// With strict: error at compile time
const user = getUser();
console.log(user?.email); // Must handle null explicitly
```

**2. `noImplicitAny` — untyped Redux selectors:**
```ts
// Without strict: silently infers `any`
const selectCompany = (state) => state.user.company; // `state` is any

// With strict: compile error forces explicit typing
const selectCompany = (state: RootState) => state.user.company;
```

**3. `strictFunctionTypes` — callback type mismatch:**
```ts
// Without strict: wrong event handler type passes silently
const handleClick = (e: MouseEvent) => e.target.value; // MouseEvent has no .value
button.addEventListener('click', handleClick); // Bug

// With strict: catches input vs mouse event mismatch at compile time
```

These three catch entire categories of runtime bugs that would only appear in production otherwise.

---

**Q14. How are TypeScript enums used in this project for role-based access, and what is a potential pitfall of numeric enums vs. string enums in a B2B application?**

**A:**  
The `enums.ts` file defines roles and statuses used across `rolePermissionMapping.ts` and the `withPermission` HOC.

**Numeric enum pitfall:**
```ts
enum UserRole { Admin = 0, Viewer = 1, Manager = 2 }
// If you insert a new role: Admin = 0, Guest = 1, Viewer = 2, Manager = 3
// All existing numeric comparisons in stored data (DB, cookies, API) break silently
```

**String enum advantage:**
```ts
enum UserRole { Admin = 'ADMIN', Viewer = 'VIEWER', Manager = 'MANAGER' }
// Stable across reordering, debuggable in network payloads, serializes safely to JSON
```

For a B2B platform where roles may be stored in JWTs, databases, or API responses, string enums are essential. A numeric enum mismatch between frontend and backend is an invisible authorization bug — a user could gain elevated permissions after a deployment.

---

**Q15. The project uses generics sparingly in utility functions. Give an example of where you would introduce a generic type to improve type safety in the Redux request layer.**

**A:**  
Currently, `createAsyncThunk` calls often return `any`. Adding generics:

```ts
// Before: loosely typed
export const fetchData = createAsyncThunk(
  'entity/fetch',
  async (id: string) => {
    const res = await apiService().get(`/entity/${id}`);
    return res.data; // inferred as `any`
  }
);

// After: fully typed with generics
export const fetchData = createAsyncThunk<
  Company,           // Return type (fulfilled)
  string,            // Argument type
  { rejectValue: ApiError } // Rejection type
>(
  'entity/fetch',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiService().get<Company>(`/entity/${id}`);
      return res.data; // typed as Company
    } catch (err) {
      return rejectWithValue(err.response.data as ApiError);
    }
  }
);
```

The slice's `extraReducers` then gets full type inference for `action.payload` — catching mismatches between API response shape and Redux state at compile time rather than runtime.

---

## 5. Authentication & Authorization

---

**Q16. Explain the multi-layer auth architecture in this project: cookie-based tokens, middleware enforcement, and role-based UI rendering. Where can security gaps occur?**

**A:**  
**Three layers:**

1. **Cookie layer:** JWT stored in secure cookie. The Axios interceptor reads it for every API request.
2. **Middleware layer:** `middleware.tsx` validates token presence on protected routes, redirecting to sign-in if absent. Runs at the Edge before any React rendering.
3. **UI layer:** `withPermission` HOC and `rolePermissionMapping.ts` control what UI elements render based on the user's role from the Redux store.

**Security gaps:**

- **Token validation depth:** Middleware only checks token *presence*, not *validity* (signature, expiry). A stale or forged token passes middleware. Full JWT verification at the Edge is computationally possible but should be balanced against performance.
- **Client-side role enforcement:** The `withPermission` HOC hides UI but doesn't protect the underlying API routes. A user inspecting Redux state could see their role and manually call APIs. **True authorization lives on the server/API, not the UI.**
- **Impersonation surface:** CSR impersonation headers in Axios could be exploited if the impersonation token isn't validated server-side on every request.
- **Token storage:** Cookies should be `HttpOnly` + `Secure` + `SameSite=Strict` to prevent XSS/CSRF. If not `HttpOnly`, JavaScript can steal the token.

---

**Q17. The project supports both OTP-based authentication and Microsoft SSO. What are the architectural considerations when integrating multiple auth providers?**

**A:**  
**Key considerations:**

1. **Unified token format:** Both auth flows must produce the same JWT structure that downstream services understand. The OTP path and SSO path should normalize to identical payloads (user ID, roles, company ID).

2. **Session lifecycle:** SSO tokens (from Microsoft MSAL) have their own expiry managed by Azure AD. The frontend must handle SSO token refresh separately from OTP session refresh.

3. **Redirect handling:** SSO uses OAuth2 redirect flows — the middleware must handle the callback URL (`/auth/callback`) differently from normal protected routes. Intercepting the redirect before token exchange would break the flow.

4. **State management during login:** OTP requires a multi-step flow (enter email → receive OTP → verify). This temporary state shouldn't pollute the main Redux store — a local `tempSlice` (which exists in this project) is the right pattern.

5. **Logout propagation:** SSO logout should invalidate both the local session and the Microsoft session (via `logout()` on the MSAL instance). OTP logout only clears the local cookie.

6. **Security:** Both flows must use PKCE for OAuth flows, and OTP should be rate-limited and time-limited (typically 5 minutes, 3 attempts).

---

**Q18. The `withPermission` HOC controls UI rendering based on roles. What are the trade-offs of a HOC vs. a custom hook vs. a `<PermissionGate>` component for this use case?**

**A:**

| Approach | Pros | Cons |
|---|---|---|
| **HOC (`withPermission`)** | Wraps entire components; clean at usage site | Composition hell with multiple HOCs; hard to debug; TypeScript generics are complex |
| **Custom Hook (`usePermission`)** | Flexible; composable; easy TypeScript | Logic in JSX (`{canEdit && <Button>}`); clutters render methods |
| **`<PermissionGate>` Component** | Declarative; readable JSX; easy to reason about | Slight over-abstraction for simple cases |

```tsx
// PermissionGate is most readable at scale:
<PermissionGate role={UserRole.Admin} fallback={<ReadOnlyView />}>
  <AdminPanel />
</PermissionGate>
```

For this project's scale (many role-gated features across account management, quotes, orders), a `PermissionGate` component is the most maintainable. HOCs are harder to compose when a component needs multiple permission checks. The custom hook wins for imperative logic (e.g., conditionally calling an API based on role).

---

## 6. Internationalization (i18n)

---

**Q19. The project handles 7 locales via dictionary JSON files and URL-based routing (`[lang]`). What are the trade-offs between this custom i18n approach and using a library like `next-intl` or `react-i18next`?**

**A:**  
**Custom dictionary approach (current):**
- Pros: Zero dependency, full control, no library overhead, simple to understand.
- Cons: No pluralization support, no interpolation helper, no lazy loading per locale (all 7 dictionaries bundled), no RTL support, manual maintenance of translation keys.

**`next-intl` (Next.js-optimized):**
- Pros: Built for App Router, per-route lazy loading, ICU message format (plurals, interpolation), type-safe keys, timezone handling.
- Cons: Adds dependency, migration cost.

**`react-i18next`:**
- Pros: Industry standard, massive ecosystem, namespaces for code splitting.
- Cons: Not optimized for App Router server components.

**For this project's scale (7 locales, B2B content-heavy), `next-intl` would be the upgrade path** because:
1. ICU pluralization matters for order quantities ("1 item" vs "5 items").
2. Type-safe translation keys prevent missing-key bugs at compile time.
3. Per-route lazy loading reduces initial bundle size.

---

**Q20. How does the current `getTranslation()` utility work, and what happens if a translation key is missing? How would you build a robust fallback system?**

**A:**  
The current approach reads from the locale dictionary JSON and returns the nested value by key path. If a key is missing, it typically returns `undefined` or an empty string, which renders as blank text in the UI — a silent failure invisible to users but confusing.

**Robust fallback system:**
```ts
function getTranslation(
  dict: Dictionary,
  key: string,
  fallbackLang: Dictionary = enUsDict,
  interpolations?: Record<string, string>
): string {
  const value = getNestedValue(dict, key) 
    ?? getNestedValue(fallbackLang, key) // Fallback to en-us
    ?? key; // Last resort: show the key itself (visible in UI, easy to catch in QA)
  
  // Interpolation: "Hello {name}" → "Hello John"
  return Object.entries(interpolations ?? {}).reduce(
    (str, [k, v]) => str.replace(`{${k}}`, v),
    value
  );
}
```

**Additional safeguards:**
- In development: throw an error for missing keys to catch them early.
- In production: log missing keys to the observability system (OpenTelemetry).
- TypeScript: generate a type from the en-us dictionary structure so accessing an invalid key is a compile error.

---

## 7. Performance Optimization

---

**Q21. This project uses Tailwind CSS with a custom `safelist` in `tailwind.config.ts`. Why is a safelist needed and what are the performance risks if it's configured too broadly?**

**A:**  
Tailwind's JIT compiler purges classes not found statically in source files. Dynamically constructed class names like:
```ts
const color = 'blue';
const className = `text-${color}-500`; // Purged! Not a static string
```

The `safelist` preserves classes that are computed at runtime. In this project, dynamic color tokens (`Skyline-Blue`, `Citrus`, etc.) used in marketing CMS content require safelisting.

**Performance risks of broad safelisting:**
- A regex pattern like `safelist: [{ pattern: /bg-.+/ }]` keeps ALL background color classes — thousands of CSS rules.
- This bloats the CSS bundle significantly, negating Tailwind's main advantage.
- For a B2B app where LCP and TTI matter, unnecessary CSS adds parse time.

**Best practice:** Be precise in safelists — list only the specific classes that are genuinely dynamic. For CMS-driven colors, maintain an explicit list of allowed values and validate CMS content against it.

---

**Q22. The project uses `useDebounce` for search input. Explain the implementation and where else in this B2B application debouncing or throttling would provide significant UX/performance benefits.**

**A:**  
```ts
// useDebounce.tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
```

**Other high-value debounce/throttle opportunities in this project:**

| Scenario | Technique | Reason |
|---|---|---|
| Product filter changes (price range slider) | Debounce (300ms) | Each slider move shouldn't fire an API call |
| Cart quantity input changes | Debounce (500ms) | User typing "100" sends 3 API calls without debounce |
| Window resize for responsive layout | Throttle (100ms) | ResizeObserver fires too frequently |
| Scroll events for sticky header | Throttle (16ms = 60fps) | Jank-free scroll performance |
| Address autocomplete | Debounce (400ms) | External geocoding API is expensive per call |
| Notification polling | Throttle/interval | Don't overwhelm the backend on tab focus |

Throttle is better than debounce when you need periodic updates (scroll, resize) — debounce for actions that should only fire after the user stops (search, quantity input).

---

**Q23. How would you optimize the initial load performance of the product listing page in this Next.js app, considering it uses Redux for state and fetches products from an API?**

**A:**  
**Strategy: Hybrid rendering with streaming**

1. **Server Component for initial data fetch:** Move the initial products fetch to a Server Component using `fetch()` with Next.js cache. This eliminates the client-side loading state entirely — HTML arrives with content.

2. **Streaming with Suspense:** Wrap slower parts (recommendations, filters) in `<Suspense>` boundaries. The page shell renders immediately; sections stream in.

3. **Route-level prefetching:** Use `<Link prefetch>` on the product category navigation so clicking a category has near-instant response.

4. **Image optimization:** The custom Brandfolder CDN image loader should generate WebP with proper `sizes` attribute. Lazy-load images below the fold with `loading="lazy"`.

5. **Redux hydration:** Instead of fetching in `useEffect` (causes waterfall), prefetch on the server and hydrate Redux store on mount using `preloadedState` in the store provider.

6. **URL-based filter state (`useFilterUrlSync`):** This already exists — it means filter state is in the URL and shareable/bookmarkable, which also enables proper server-side rendering of filtered results.

7. **Bundle splitting:** The product listing page should not import the checkout or account management components. Next.js does route-based splitting automatically, but verify with `@next/bundle-analyzer`.

---

## 8. CMS Integration (Contentstack)

---

**Q24. The project uses Contentstack with live preview (`@contentstack/live-preview-utils`). How does CMS live preview work technically, and what are the challenges of keeping it in sync with the production rendering path?**

**A:**  
**How live preview works:**
1. The content editor opens the CMS with a preview iframe pointing to the frontend with a special `live_preview` query param and a preview token.
2. `@contentstack/live-preview-utils` subscribes to `postMessage` events from the parent CMS window.
3. When an editor changes content, the SDK patches the in-memory content data and triggers a re-render without a page reload.
4. Visual overlay elements (Contentstack visual builder) highlight editable regions.

**Challenges:**
1. **Two rendering paths diverge:** The live preview uses client-side patching; production uses server-side CMS API. If the data transformation logic differs between them, editors see different results than users.
2. **Authentication:** Preview content requires CMS authentication; production content uses published API keys. Middleware must differentiate and not cache preview responses.
3. **Next.js App Router conflict:** Server Components can't subscribe to `postMessage`. The live preview SDK must run in Client Components, which limits which parts of the page can be "live-editable."
4. **Cache busting:** Next.js's `fetch` cache must be bypassed for preview mode (`{ cache: 'no-store' }` or revalidation on webhook).

---

**Q25. When should CMS content be fetched at build time (SSG) vs. request time (SSR) vs. client-side? How would you decide for each content type in this project?**

**A:**

| Content Type | Strategy | Reason |
|---|---|---|
| Marketing landing pages | SSG + ISR (revalidate: 3600) | Rarely changes; global CDN caching; no user personalization |
| Product catalog descriptions | SSG + ISR (revalidate: 600) | Changes infrequently; high traffic; SEO critical |
| Promotional banners | SSR or ISR (short TTL) | Can change same-day; needs freshness |
| User account content (order history, quotes) | No CMS | Pure API data, user-specific, can't be cached globally |
| Legal/compliance pages | SSG | Changes rarely; stability matters |
| Blog/knowledge base | SSG + ISR | SEO-driven; moderate update frequency |

**Decision framework:**
- **Is the content user-specific?** → API fetch, no CMS.
- **Is the content time-sensitive (promotions)?** → SSR or short ISR.
- **Is SEO critical?** → Must be SSG or SSR, never client-side only.
- **How frequently does it change?** → Set ISR `revalidate` to match the content update cadence.

---

## 9. Observability — OpenTelemetry

---

**Q26. The project uses OpenTelemetry with GCP Cloud Trace. Explain the distributed tracing model and how a trace flows from the frontend to the backend in this architecture.**

**A:**  
**Trace propagation flow:**

```
Browser → Next.js Server → Backend API → Microservices
   |            |               |              |
 span 1      span 2           span 3         span 4
   └──────────── Single Trace ID propagated via HTTP headers ──────────────┘
```

1. **Frontend instrumentation** (`instrumentation.ts`): Initializes the OpenTelemetry SDK, sets service name/version, configures the GCP trace exporter.

2. **Axios request interceptor:** Injects `traceparent` header (W3C format: `00-{traceId}-{spanId}-01`) into every API call. This links the frontend request to backend spans under the same trace.

3. **Backend:** When it receives `traceparent`, it creates a child span under the same trace, forwarding it to downstream services.

4. **GCP Cloud Trace:** All spans across services converge here, giving a complete waterfall view of a user action from button click to database query.

**Value for this B2B platform:**
- Identify which API calls are slow for specific customer segments.
- Correlate frontend errors (`4xx`, `5xx`) with backend service latency.
- Trace a quote generation request across quote service, pricing engine, and inventory checks.

---

**Q27. What is the difference between traces, metrics, and logs in OpenTelemetry, and which would you use to detect that the checkout funnel conversion rate is dropping?**

**A:**

| Signal | What it captures | Example in this project |
|---|---|---|
| **Traces** | Request flow across services with timing | A single checkout request through cart → payment → order creation |
| **Metrics** | Aggregated numerical measurements over time | `checkout_initiated_count`, `checkout_completed_count`, p99 latency |
| **Logs** | Discrete events with context | "Payment failed for order #12345: card declined" |

**For dropping checkout conversion:**
- **Metrics** are the detection signal: a counter `checkout_step_completed{step="payment"}` dropping relative to `checkout_step_completed{step="cart"}` indicates abandonment at payment.
- **Traces** are the investigation tool: once you know conversion dropped, trace individual failed checkouts to find the slow/erroring step.
- **Logs** give the specific error context: what error message, which user segment, what product.

The correct answer is: **metrics detect the problem, traces locate it, logs explain it.** All three signals complement each other — using only one gives incomplete observability.

---

## 10. Feature Flags — OpenFeature

---

**Q28. This project uses OpenFeature with a `flags.flagd.json` file. What is OpenFeature, why is it preferable to a homegrown feature flag system, and what are the limitations of file-based flags in production?**

**A:**  
**OpenFeature** is a vendor-neutral, CNCF-incubating standard for feature flag evaluation. It defines a common API so you can swap flag providers (LaunchDarkly, Unleash, flagd, Statsig) without changing application code.

**Advantages over homegrown:**
- Standard API means no lock-in; swap providers with a config change.
- Type-safe evaluation: `getBooleanValue`, `getStringValue`, `getNumberValue`, `getObjectValue`.
- Context-aware targeting (evaluate flags based on user ID, region, role) without building this logic yourself.
- React SDK (`@openfeature/react-sdk`) provides hooks: `useFlag('feature-name', false)`.

**Limitations of file-based flags (`flags.flagd.json`):**
1. **No real-time updates:** A code deployment is required to change a flag — defeating the purpose of feature flags (safe deployment without redeployment).
2. **No targeting:** Can't roll out to 10% of users or only Enterprise tier customers — file-based is binary on/off globally.
3. **No audit trail:** No record of who changed a flag and when.
4. **Frontend-only:** File is bundled into the client; flag values are visible in the source.

**Production upgrade path:** Connect OpenFeature to a remote provider (LaunchDarkly or self-hosted flagd server). The application code stays the same — only the provider registration changes.

---

## 11. Testing Strategy

---

**Q29. Given this codebase's architecture (Redux, Axios, Next.js App Router, Contentstack), describe a comprehensive testing strategy across unit, integration, and E2E layers.**

**A:**

**Unit Tests (Jest + React Testing Library):**
- Redux slices: test reducers with mock state and actions.
- Utility functions (`commonFunctions.ts`, `utilsFunctions.ts`): pure function input/output.
- Custom hooks: use `renderHook` from RTL, mock dependencies.
- Component rendering: test that components render correctly with given props, not implementation details.

**Integration Tests:**
- Redux thunks: use `redux-mock-store` or `msw` (Mock Service Worker) to intercept Axios calls and test the full dispatch → API call → state update flow without hitting real APIs.
- `msw` is preferred over Jest mocks for Axios because it intercepts at the network level — tests are more realistic.
- Middleware logic: test `middleware.tsx` with Next.js's `createMocks` or a test server.

**E2E Tests (Playwright or Cypress):**
- Critical user journeys: login → browse products → add to cart → checkout.
- Multi-locale: verify that switching to `fr-ca` renders French content.
- Role-based access: verify admin users see management panels; viewers don't.
- OTP flow: use seeded test accounts with known OTP codes.

**What NOT to test:**
- Third-party library behavior (Contentstack SDK, Redux internals).
- Implementation details (internal state variable names, component structure).
- Styles — visual regression testing (Chromatic/Percy) handles this separately.

---

**Q30. The project uses Husky with lint-staged for pre-commit hooks running ESLint and Prettier. What else would you add to the pre-commit pipeline for a B2B production application of this scale?**

**A:**

**Current:** ESLint + Prettier  
**Should add:**

1. **TypeScript type checking (`tsc --noEmit`):** ESLint catches style issues; `tsc` catches type errors. Many type bugs pass linting but fail compilation. Run on changed files only with `tsc --noEmit` in CI (too slow for pre-commit, but run in CI).

2. **Unit tests for changed files:** `jest --findRelatedTests` runs only tests related to staged files — fast and targeted.

3. **Import cycle detection:** Circular imports in Redux slices/utilities cause hard-to-debug runtime errors. `madge --circular` or ESLint `import/no-cycle` catches these.

4. **Secret scanning:** `git-secrets` or `detect-secrets` prevents committing API keys, tokens, or credentials.

5. **Bundle size check (CI only, not pre-commit):** `size-limit` or `@next/bundle-analyzer` to fail CI if a commit bloats a key bundle beyond a threshold.

6. **Accessibility lint:** `eslint-plugin-jsx-a11y` is already common with Tailwind setups — ensures ARIA attributes and semantic HTML in a B2B app used by diverse users.

---

## 12. System Design Questions

---

**Q31. [System Design] Design the notification system for this B2B platform. Users receive notifications for quote updates, order status changes, approval requests, and company letters. The current system polls on page load. How would you redesign it for real-time delivery at scale?**

**A:**

**Current (polling) limitations:** Stale notifications between page loads; unnecessary server load; poor UX for time-sensitive approvals.

**Redesigned architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                     Backend Services                         │
│  Quote Service → Event Bus → Notification Service            │
│  Order Service →     (Kafka/Pub-Sub)                         │
│  Approval Service →                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │  Notification Service │
              │  - Persist to DB     │
              │  - Push to WebSocket │
              │  - Send email/SMS    │
              └──────────┬──────────┘
                         │
         ┌───────────────▼───────────────┐
         │      WebSocket Gateway        │
         │  (connection per user session)│
         └───────────────┬───────────────┘
                         │
         ┌───────────────▼───────────────┐
         │         Frontend              │
         │  useNotificationSocket hook   │
         │  → Redux dispatch on message  │
         │  → Toast + badge update       │
         └───────────────────────────────┘
```

**Implementation details:**

**Frontend WebSocket hook:**
```ts
function useNotificationSocket(userId: string) {
  useEffect(() => {
    const ws = new WebSocket(`wss://api.composites.com/notifications?userId=${userId}`);
    ws.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      dispatch(addNotification(notification));
      dispatch(showToast({ message: notification.title, type: 'info' }));
    };
    ws.onclose = () => { /* reconnect with exponential backoff */ };
    return () => ws.close();
  }, [userId]);
}
```

**Fallback strategy:** If WebSocket fails (corporate firewall), fall back to Server-Sent Events (SSE), then long-polling. This is the progressive enhancement pattern for real-time.

**Scalability:**
- WebSocket connections are stateful — use a connection registry (Redis) so any server node can push to any user.
- Notification service stores unread count in Redis (O(1) lookup) and full history in PostgreSQL.
- For enterprise customers with hundreds of users, batch notifications by company rather than per-user fan-out.

---

**Q32. [System Design] The product catalog has thousands of SKUs with complex filtering (material type, dimensions, stock status, price range). Design the frontend architecture for the product listing page to handle filtering, sorting, pagination, and URL sharability at scale.**

**A:**

**Architecture: URL as Single Source of Truth**

The project already has `useFilterUrlSync` — this is the right foundation. Let me design the complete system:

```
URL State (canonical) ←→ React State (derived) ←→ API (server)
?material=fiberglass&minPrice=10&maxPrice=500&page=2&sort=price_asc
```

**State management approach:**

```ts
// Single hook manages filter state
function useProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse URL → typed filter object
  const filters = useMemo(() => parseFiltersFromURL(searchParams), [searchParams]);

  // Update filters → push to URL (causes server-side fetch via layout)
  const updateFilter = useCallback((key: FilterKey, value: FilterValue) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, String(value));
    params.set('page', '1'); // Reset pagination on filter change
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  return { filters, updateFilter };
}
```

**Data fetching strategy:**
- Filters in URL → Server Component receives as `searchParams` → fetch products server-side → no loading spinner on initial/filter change.
- Use `startTransition` for filter updates so the UI remains interactive during navigation.
- Optimistic updates for instantaneous feel: show filtered count before data arrives.

**Faceted search performance:**
- Fetch facet counts (e.g., "Fiberglass: 234 products") in a separate, cached query.
- Use Elasticsearch/Algolia on the backend for sub-100ms faceted search across thousands of SKUs.
- Debounce price range slider (300ms) before pushing to URL.

**Pagination:**
- Cursor-based pagination for API (`?after=<cursor>`) is more stable than offset — inserting a product mid-catalog doesn't shift pages.
- URL stores page number for bookmarkability: `?page=3`.

---

**Q33. [System Design] Design the cart and checkout system for this multi-company B2B platform. Consider that B2B carts differ significantly from B2C: quantity breaks, pricing tiers, credit terms, approval workflows, and multi-ship-to addresses.**

**A:**

**B2B Cart Requirements (different from B2C):**

| Feature | B2C | B2B (this project) |
|---|---|---|
| Pricing | Fixed retail | Negotiated contract pricing per company |
| Quantities | Any amount | Quantity breaks (100+ units = different price) |
| Payment | Credit card at checkout | Net 30/60/90 credit terms, purchase orders |
| Shipping | One address | Multiple ship-to locations per company |
| Approval | None | Manager approval for orders above threshold |
| Cart persistence | Session | Days/weeks (quotes become orders) |

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                      Cart Service                                │
│                                                                  │
│  CartState:                                                      │
│  - items: CartItem[] (productId, qty, unitPrice, extPrice)      │
│  - shipTo: ShipToLocation (from company profile)                │
│  - paymentMethod: CreditTerms | PO | CreditCard                 │
│  - approvalStatus: pending | approved | not_required            │
│  - pricingTier: ContractPricing (from customer master)          │
└────────────────────────┬─────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   Pricing Engine  Inventory Check  Approval Engine
   (contract rates, (real-time stock,  (threshold rules,
    quantity breaks)  allocation)       notification)
```

**Frontend state machine for checkout flow:**

```
[CART] → [ADDRESS_SELECTION] → [PRICING_REVIEW] → [PAYMENT_METHOD] 
       → [APPROVAL_REQUIRED?] → [SUBMITTED] → [CONFIRMED]
                 ↓ (if approval needed)
           [PENDING_APPROVAL] ← (manager receives notification)
                 ↓ (approved)
           [ORDER_CREATED]
```

Each step is a route segment: `/checkout/address`, `/checkout/payment`, `/checkout/review`. Checkout state lives in Redux with persistence to `sessionStorage` (not `localStorage` — clears on sign-out).

**Key technical decisions:**
- Cart is server-side (saved in DB per user/company) — surviving page refreshes and device switches.
- Price calculation happens on the server at every cart update — never trust client-calculated prices.
- Ship-to address drives tax calculation and lead time — update both on address change.
- Approval workflow integrates with the notification system (Q31) for real-time manager alerts.

---

**Q34. [System Design] This project serves multiple companies, each with different users, locations, and roles. Design a multi-tenancy model for the frontend data layer and API communication.**

**A:**

**Multi-tenancy scope:** Each company is a tenant. Users belong to a company. Company data (pricing, locations, users) is isolated.

**Frontend multi-tenancy model:**

```ts
// User context always carries tenant identity
interface AuthenticatedUser {
  userId: string;
  companyId: string;  // Tenant identifier
  role: UserRole;
  impersonatingCompanyId?: string; // CSR impersonation
}
```

**API isolation strategy:**
- Every API request includes `companyId` (from JWT claims, not from Redux state — can't be tampered with).
- The Axios interceptor already adds impersonation headers — this is the right place to also inject company context.
- Backend enforces company-scoped data access — frontend assumes this but doesn't rely on it for security.

**Cross-tenant scenarios:**
1. **Employee/CSR impersonation:** CSR logs in as themselves, then impersonates a customer company. Two identities in play — the CSR's own JWT + impersonation header for the target company. Middleware must differentiate and not cache impersonated responses.

2. **Multi-company users:** A user who belongs to multiple companies (e.g., a distributor managing several accounts). UI needs a company switcher — Redux stores `activeCompanyId` and refreshes all company-scoped data on switch.

3. **Data isolation in Redux:** Company-scoped Redux slices (cart, company profile, locations) must be cleared when switching companies, not just updated — stale data from Company A must not bleed into Company B's view.

**Caching strategy:**
- User-agnostic content (product catalog, CMS content): cached aggressively at CDN.
- Company-scoped content (pricing, locations): never CDN-cached; short server-side cache keyed by `companyId`.
- User-specific content (cart, order history): no caching; fresh per request.

---

**Q35. [System Design] The project generates PDFs and CSVs for orders, invoices, and purchase summaries using `html2canvas` + `jspdf` and `papaparse`. What are the architectural limitations of client-side document generation, and how would you redesign it for enterprise scale?**

**A:**

**Current client-side limitations:**

| Problem | Impact |
|---|---|
| Heavy libraries in bundle (`html2canvas` + `jspdf`) | +300KB to bundle size |
| Runs on user's device | Slow on low-powered machines; blocked by ad blockers |
| DOM-dependent (`html2canvas`) | Must render the full page to capture; fails for hidden data |
| Not accessible programmatically | Can't generate docs in background/batch |
| Inconsistent across browsers | Canvas rendering varies; fonts not embedded correctly |

**Redesigned server-side approach:**

```
Frontend Request          Backend PDF Service
     │                         │
     │  POST /api/documents    │
     │  { type: 'invoice',     │
     │    orderId: '12345' } ─►│
     │                         │  1. Fetch order data from DB
     │                         │  2. Render Handlebars/React template
     │                         │  3. Headless Chrome (Puppeteer) or
     │                         │     Typst/WeasyPrint → PDF
     │                         │  4. Store in GCS/S3 with TTL
     │◄────────────────────────│
     │  { documentUrl: '...' } │
     │                         │
     │  User downloads PDF     │
     │  directly from GCS      │
```

**Benefits:**
- Remove `html2canvas` and `jspdf` from bundle → significant size reduction.
- Consistent output regardless of user's browser/OS.
- Batch generation: generate 100 invoices overnight without a browser.
- PDF/A compliance for archival (required in some industries).
- Cacheable: same invoice doesn't regenerate on repeated downloads.

**For CSVs specifically:** Move to server-side streaming — the backend streams the CSV directly to the client (`Content-Type: text/csv; Content-Disposition: attachment`) without storing it. This handles millions of rows without memory issues.

---

## 13. Architecture Trade-offs & Decisions

---

**Q36. This project uses both `date-fns` and `moment`. This is a red flag in production codebases. Why is it a problem and what should be done?**

**A:**  
`moment.js` is ~300KB minified, non-tree-shakeable, and officially in maintenance mode. `date-fns` is modular, tree-shakeable, and modern. Having both in the project means:
- Users download both libraries (potentially +400KB total).
- Inconsistent date manipulation behavior (moment uses mutability, date-fns is immutable).
- Two sets of date formatting syntax for developers to remember.

**Resolution:**
1. Audit all `moment` usages: `grep -r "from 'moment'" src/`.
2. Replace with `date-fns` equivalents (`format`, `parseISO`, `differenceInDays`, etc.).
3. Remove `moment` from `package.json`.
4. Check `next/bundle-analyzer` output to confirm moment is eliminated.

The `dayjs` library (2KB, moment-compatible API) is also a migration option if moment's API is heavily used and a wholesale API change to date-fns is too costly.

---

**Q37. The project uses both SCSS (compiled by Grunt) and Tailwind CSS. Why is this a hybrid and what is the long-term maintenance strategy?**

**A:**  
This hybrid is a migration artifact — the project likely started with SCSS and is incrementally moving to Tailwind. Both coexist because:
- Legacy component styles in SCSS were too risky to rewrite all at once.
- Tailwind was adopted for new components without migrating old ones.

**Problems with the hybrid:**
- Developers must know two styling systems and when to use each.
- Tailwind classes and SCSS can conflict (specificity wars).
- Grunt adds a build step that's separate from Next.js — extra complexity, potential CI failures if Grunt is missed.
- Global SCSS (variables, mixins) duplicates Tailwind's design tokens — two sources of truth for colors, spacing.

**Long-term strategy:**
1. **Define the target state:** Tailwind-only (most common) or a CSS Modules + Tailwind hybrid.
2. **No new SCSS files:** All new components use Tailwind only.
3. **Incremental migration:** When touching a legacy SCSS component, migrate its styles to Tailwind.
4. **Share design tokens:** Replace SCSS variables with Tailwind theme values as the single source.
5. **Remove Grunt:** Once SCSS is eliminated, simplify the build pipeline.

---

**Q38. Final: How would you approach a performance audit of this application? Walk through the tools, metrics, and process you'd use, given that it's a B2B platform with authenticated pages.**

**A:**

**Phase 1 — Measurement (establish baseline):**
- **Lighthouse CI:** Integrate in CI pipeline; fail builds if Core Web Vitals regress. Use `--preset desktop` for B2B (primarily desktop users).
- **`@next/bundle-analyzer`:** Identify oversized chunks; look for duplicate dependencies (e.g., two date libraries).
- **Chrome DevTools Performance tab:** Record page load for product listing and checkout — identify long tasks, render-blocking resources.
- **Web Vitals in production:** Add `web-vitals` library to report LCP, FID/INP, CLS, TTFB to the analytics/telemetry stack. Real-user data trumps lab data.

**Phase 2 — Authenticated page specifics:**
- B2B apps are largely behind login — public Lighthouse won't capture the real experience.
- Use Playwright with authenticated sessions to run Lighthouse on protected pages.
- Monitor TTFB for authenticated routes — SSR with user-specific data fetching is often the culprit.

**Phase 3 — Key metrics for this app:**

| Metric | Target | Where to check |
|---|---|---|
| LCP (product listing) | < 2.5s | Lighthouse / RUM |
| INP (filter interaction) | < 200ms | Web Vitals |
| Bundle size (initial JS) | < 200KB compressed | Bundle analyzer |
| API response (product search) | < 500ms p95 | OpenTelemetry |
| Hydration time | < 1s | Performance tab |

**Phase 4 — Fixes prioritized by impact:**
1. Large bundle chunks → code split.
2. Slow API calls → add caching layer or optimize queries.
3. Client-side data fetching → move to Server Components.
4. Unoptimized images → ensure WebP + proper sizes.
5. Render-blocking scripts (GTM, Qualtrics) → defer/async.

---

*This document covers ~38 questions across React/Next.js, Redux, API architecture, TypeScript, auth, i18n, performance, CMS, observability, feature flags, and system design — appropriate for a 9-year experienced developer interview or technical onboarding.*
