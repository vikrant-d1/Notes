# NVIZ B2C Store — Senior Developer Interview Guide (9 Years Experience)

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Caching — How It Works](#2-caching--how-it-works)
3. [Project Structure Questions](#3-project-structure-questions)
4. [System Design Questions](#4-system-design-questions)
5. [Big Problems Solved](#5-big-problems-solved)
6. [Quick-Fire Questions](#6-quick-fire-questions)
7. [What You Would Improve](#7-what-you-would-improve)

---

## 1. Project Overview

### "Tell me about this project"

This is a **headless, white-label B2C e-commerce storefront** built on Next.js 16 (App Router) with React 19. It is a **multi-tenant capable** system — the same codebase runs as 3 different brand themes (`default`, `variant1`, `variant2`) by changing a single environment variable.

**Key facts to lead with:**

| Dimension | Detail |
|---|---|
| Framework | Next.js 16 (App Router) + React 19.2.1 |
| Commerce backend | BigCommerce (proxied via Next.js API routes) |
| CMS | Contentstack (primary) + Contentful (secondary) |
| Payment | Razorpay |
| Locales | `en-us`, `en-in`, `fr-ca` |
| Theme variants | `default`, `variant1`, `variant2` |
| TypeScript files | 391 |
| API routes | 27 |
| Custom hooks | 17 |
| Redux slices | 3 (auth, cart, wishlist) |

**One-line architectural summary:**  
The browser never talks to BigCommerce or the CMS directly. All external traffic is proxied through Next.js API routes, which keeps secrets server-side and makes the commerce backend swappable.

---

## 2. Caching — How It Works

The project has **4 distinct caching layers**, each solving a different problem.

---

### Layer 1: Next.js ISR — Server-Side Page Cache

```ts
// src/app/[lang]/(pages-with-common-header)/product/[id]/page.tsx
export const revalidate = 60
```

**What it does:**  
Product detail pages are statically generated at first request and cached on the CDN/edge for 60 seconds. After 60s, the next visitor triggers a **background regeneration** — the current visitor still gets the stale cached page instantly (stale-while-revalidate pattern).

**Why 60 seconds and not longer?**  
Product prices and inventory change frequently in a live store. 60s balances user speed with data freshness. A 24-hour cache would serve wrong prices.

**Why only product pages?**  
Cart, Checkout, My Account are fully user-specific — ISR doesn't apply. Homepage and product listing pages use dynamic rendering because filters and pagination change per request.

**Interview talking point:**  
ISR is the reason this storefront can handle 100k concurrent users without 100k backend calls. Every user hitting `/en-us/product/123` within the same 60s window gets served cached HTML from the edge.

---

### Layer 2: Axios Concurrency Queue — Silent Token Refresh Cache

This is the most sophisticated caching mechanism in the project.

```ts
// src/lib/api/axiosClient.ts
let isRefreshing = false
let failedQueue: {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}[] = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}
```

**The problem this solves:**  
When a user's access token expires, multiple concurrent API calls all get 401. Without this pattern, each would independently try to refresh the token — causing race conditions where multiple refresh calls fire simultaneously, auth cookies get overwritten in unpredictable order, and the session breaks.

**How it works step by step:**

```
Request A, B, C fire simultaneously
         ↓
All three get 401 (token expired)
         ↓
Request A: isRefreshing = false → sets isRefreshing = true → fires POST /auth/refresh
Request B: isRefreshing = true  → pushes { resolve, reject } into failedQueue
Request C: isRefreshing = true  → pushes { resolve, reject } into failedQueue
         ↓
Refresh succeeds → new access token received
         ↓
processQueue(null, newToken) → replays Request B and C with new token
         ↓
All three requests complete successfully
```

**On refresh failure:**
```
processQueue(error, null) → rejects B and C
deleteCookie(ACCESS_TOKEN)
deleteCookie(REFRESH_TOKEN)
window.location.href = "/auth"
```

**Why this is senior-level knowledge:**  
It solves the thundering herd problem on token expiry. A junior implementation would just add a simple `if (!isRefreshing)` guard — but without the queue, requests B and C would still silently fail instead of retrying.

---

### Layer 3: Redux In-Memory Cache — Client-Side State Cache

Redux serves as a client-side cache that prevents redundant API calls during navigation.

```ts
// src/store/slices/cartSlice.ts
export const selectCartCount = createSelector(selectCartItems, (items) =>
  items.reduce((total, item) => total + item.quantity, 0)
)
```

**What is cached:**

| Slice | Data Cached | Avoids |
|---|---|---|
| `cartSlice` | Items, cartId, summary (subtotal, grandTotal) | Refetching cart on every page navigation |
| `authSlice` | Access token, user profile | Re-login checks on every route change |
| `wishSlice` | Wishlist items | Refetching wishlist on every product card render |

**`createSelector` memoization:**  
`selectCartCount` only recomputes when `selectCartItems` output actually changes. Without memoization, every Redux state update (even an unrelated auth update) would recompute the cart count across every subscribed component. With 50+ components potentially subscribed, unmemoized selectors cause expensive cascading re-renders.

**Cart persistence strategy (cross-session caching):**

```
cartId stored in:
  ├── localStorage  (survives browser close, accessible in client JS)
  └── cookie        (accessible server-side in middleware and API routes)

On app mount:
  CartLoader component → reads cartId → GET /cart/{cartId} or /cart/mine
                       → dispatch(syncCartFromAPI({ items, summary }))
                       → Redux hydrated from real API data
```

This means a user who adds items to cart, closes the browser, and returns tomorrow still sees their cart — no login required for guests.

---

### Layer 4: Next.js Request Memoization — CMS Content Cache

```ts
// src/requests/contentStackrequest.ts
const responses = await apiService().get(`/contentstack/header?environment=${environment}&locale=${locale}`)
```

Next.js App Router automatically **deduplicates** `fetch` calls with the same URL within a single render pass. If the Header component and the Layout both request the same CMS header endpoint during one SSR cycle, the network call fires only once — the second call gets the memoized result.

**Practical impact:**  
CMS header/footer data is fetched in the root layout and potentially also in error boundaries and preview components. Without memoization, a single page render could hit Contentstack 3-4 times for the same data.

---

## 3. Project Structure Questions

### Q: "Why proxy BigCommerce through Next.js API routes instead of calling it directly from the frontend?"

**Three reasons:**

**1. Security**  
`BIGCOMMERCE_ACCESS_TOKEN` and `BIGCOMMERCE_STORE_HASH` are server-side environment variables — never exposed to the browser. Direct frontend calls would leak credentials in network requests.

**2. Backend portability**  
The proxy layer is the abstraction boundary. The project already mentions CommerceTools as an optional backend. Swapping commerce providers means updating API routes only — zero frontend component changes.

**3. Request augmentation**  
Proxies inject auth headers, validate cookies, run server-side business logic, and can add caching headers before forwarding to BigCommerce.

---

### Q: "Explain the route group architecture — what problem does `(pages-with-common-header)` solve?"

Next.js route groups (parentheses folders) share layouts without affecting the URL.

```
(auth)
  └── /en-us/auth          → bare layout, no header/footer
  └── /en-us/sign-up       → bare layout, no header/footer

(pages-with-common-header)
  └── /en-us/products      → layout with header + footer
  └── /en-us/cart          → layout with header + footer
  └── (sidebar)
        └── /en-us/my-account/my-orders  → header + footer + sidebar
```

Without route groups you would either duplicate the header in every page component, or create a flat structure that cannot express nested shared layouts.

---

### Q: "How does the theme variant system work technically?"

```ts
// src/config/componentThemes.ts
getSafeVariantTheme() // reads NEXT_PUBLIC_THEME_VARIANT env var
```

Every major page has a `themes/` subdirectory:

```
cart/
  themes/
    default/index.tsx
    variant1/index.tsx
  index.tsx           ← reads env var, conditionally renders theme
```

The parent `index.tsx`:
```ts
const variant = getSafeVariantTheme()
if (variant === "variant1") return <CartVariant1 />
return <CartDefault />
```

**This is a white-label deployment pattern.**  
Three completely different branded storefronts ship from the same codebase — same business logic (API calls, state management, validation), different UI layer. One env var change at deploy time, no code changes.

---

### Q: "Walk me through the i18n architecture — server vs client components."

**Server components** (pages, data fetching):
```ts
import { getDictionary } from "@/dictionaries"
const dict = getDictionary(lang) // lang from route param [lang]
const label = dict.product.addToCart
```

**Client components** (interactive UI):
```ts
import { useClientTranslation } from "@/hooks/useClientTranslation"
const t = useClientTranslation() // reads language cookie
const label = t("product.addToCart")
```

**Why two separate paths?**  
Server components cannot read cookies at render time the same way client components can. The `[lang]` route param is the source of truth for server rendering. The `language` cookie is set by middleware and is the source of truth for client-side translation — it avoids a hydration mismatch flash.

**Middleware role:**  
Before any page code runs, middleware validates the `[lang]` param. Invalid locale → defaults to `en-us`. This means page components can trust that `lang` is always valid.

---

### Q: "How does the analytics middleware work, and why put it in Redux instead of components?"

```ts
// src/store/middleware/analyticsMiddleware.ts
export const analyticsMiddleware: Middleware = (api) => (next) => (action: any) => {
  const previousState = api.getState()
  const result = next(action)

  if (action?.type === removeItem.type) {
    const removedItem = previousState?.cart?.items?.find(...)
    gaEvent({ event: AnalyticsEventName.RemoveFromCart, ... })
  }
  return result
}
```

**Why Redux middleware instead of component-level `gaEvent()` calls?**

1. **Decoupling** — UI components don't know about analytics. A `CartItem` component just dispatches `removeItem`. The middleware observes the action and fires GA4 independently.
2. **Access to previous state** — When `removeItem` fires, the item is about to be deleted from Redux. The middleware captures `previousState` before `next(action)` runs, so it still has access to the item's data (name, productId, quantity) for the GA event payload.
3. **Single source of truth** — Every cart mutation goes through Redux. Analytics cannot miss an event even if the same action is dispatched from 5 different components.

---

## 4. System Design Questions

### Q: "How would you scale this to 100k concurrent users?"

**What is already in place:**

1. **ISR** — Product pages cached at edge. 100k users hit the CDN, not the server.
2. **Static assets** — CSS bundles in `public/` served from edge CDN.
3. **Serverless API routes** — Auto-scale horizontally on Vercel/AWS Lambda.
4. **Client-side caching** — Redux prevents redundant API calls during navigation.

**What to add:**

```
1. Redis cache on API routes
   - Categories: cache 1 hour (changes rarely)
   - Currencies: cache 24 hours (changes daily)
   - Best sellers: cache 15 minutes

2. Response headers on read-only endpoints
   Cache-Control: public, s-maxage=300, stale-while-revalidate=60

3. Rate limiting middleware (per IP, per user)

4. Cart session in Redis instead of only localStorage
   - Enables server-side cart recovery
   - Supports SSR cart rendering without client hydration delay
```

---

### Q: "How does the authentication flow work end-to-end?"

```
1. User submits login form
         ↓
2. POST /api/auth/login (Next.js API route proxy)
         ↓
3. Backend returns { accessToken, refreshToken }
         ↓
4. API route sets httpOnly cookies:
   ACCESS_TOKEN  (short-lived, ~15 min)
   REFRESH_TOKEN (long-lived, ~7 days)
         ↓
5. Frontend: dispatch(setCredentials({ token, user }))
         ↓
6. Every subsequent API call:
   Axios request interceptor reads ACCESS_TOKEN cookie
   Adds Authorization: Bearer <token> header
         ↓
7. Token expires → 401 response
         ↓
8. Concurrency queue pattern fires (Layer 2 above)
         ↓
9. Refresh fails → clear cookies → redirect to /en-us/auth
```

**Middleware layer:**  
Before any protected page renders, `middleware.ts` reads the `ACCESS_TOKEN` cookie server-side. No token → redirect to `/auth`. This means the page component never even loads for unauthenticated users on protected routes.

---

### Q: "How does the cart work for guest vs. authenticated users?"

```
GUEST USER:
  Add to cart → POST /api/cart (create cart)
              → returns cartId
              → stored in localStorage + cookie
  Revisit     → CartLoader reads cartId → GET /cart/{cartId}
              → dispatch(syncCartFromAPI(...))

AUTHENTICATED USER:
  CartLoader  → GET /cart/mine (server resolves from auth token)
              → dispatch(syncCartFromAPI(...))

ON LOGIN (guest → authenticated):
  Server merges guest cartId items into user's account cart (BigCommerce)
  If currency changed → POST /api/bigcom/migrate-cart-currency

DATA NORMALIZATION:
  BigCommerce response shape (nested line_items.physical_items)
             ↓
  cartHelper.ts transforms to flat CartItem[] for Redux
             ↓
  dispatch(syncCartFromAPI({ items, cartId, summary }))
```

**Why `cartHelper.ts` matters:**  
If BigCommerce changes their API response shape, only `cartHelper.ts` needs updating — zero changes to Redux slices, components, or hooks.

---

### Q: "Context API vs Redux — how did you decide what goes where?"

| Concern | Storage | Reason |
|---|---|---|
| Cart | Redux | Needs persistence, async thunks, cross-component writes |
| Auth token + user | Redux | Needs persistence, complex async (refresh queue) |
| Wishlist | Redux | Needs async thunks, survives navigation |
| Toast notifications | Redux | Cross-component, dispatched from Axios interceptor |
| Currency | Context API | Single feature scope, no async, frequent reads/rare writes |

**Rule of thumb used in this project:**  
Redux for data that has async lifecycle, survives page navigation, or is written by many unrelated parts of the app. Context for isolated features where passing props is too verbose but Redux would be over-engineering.

---

## 5. Big Problems Solved

### Problem 1: Thundering Herd on Token Expiry

**Without the fix:**  
5 concurrent API calls expire token → 5 independent refresh requests → race condition → cookies overwritten in random order → broken session.

**Fix:**  
`failedQueue` concurrency queue in `axiosClient.ts`. Single refresh, all failing requests queued and replayed atomically.

**Code location:** [src/lib/api/axiosClient.ts](src/lib/api/axiosClient.ts) lines 60–199

---

### Problem 2: Cart Persistence Across Sessions

**Without the fix:**  
Guest user adds 3 items, closes browser → cart gone. User must start over.

**Fix:**  
`cartId` persisted in both `localStorage` (client, survives browser close) and `cookie` (server-side accessible). `CartLoader` hydrates Redux from API on every app mount using the persisted ID.

---

### Problem 3: White-Label Multi-Brand from One Codebase

**Without the fix:**  
3 separate Git branches for 3 clients → diverging codebases → 3x maintenance overhead → bug fixes need applying to all 3 branches.

**Fix:**  
Theme variant system. `NEXT_PUBLIC_THEME_VARIANT` env var at deploy time selects component variant. One codebase, one deployment pipeline, 3 brands.

---

### Problem 4: CMS-Driven Pages Without Breaking Type Safety

**Without the fix:**  
Marketing creates a new CMS module type → frontend crashes with "unknown component" error on live site.

**Fix:**  
`src/components/cms/registry.ts` maps CMS module type strings to React components. Unknown types fail gracefully (render nothing / fallback) without throwing. The `[...urlSlug]` catch-all route handles any URL the CMS team creates.

---

### Problem 5: SEO on a Dynamic React App

**Without the fix:**  
Client-side rendered product pages → Google sees empty HTML → products not indexed → no organic traffic.

**Fix:**  
Server components generate full `<Metadata>` and Schema.org JSON-LD at request time on the server. Browser receives fully-formed HTML. ISR means Google crawls cached static HTML that is always available.

```ts
// Product page — fully server-rendered metadata
export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getPdpProduct(id, lang)
  return {
    title: `${product.name} | E-Commerce Store`,
    openGraph: { images: [{ url: product.images[0] }] }
  }
}

// Schema.org structured data injected server-side
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pdpJsonLd) }} />
```

---

### Problem 6: Multi-Locale Routing Without Separate Deployments

**Without the fix:**  
3 separate deployments for 3 locales → tripled infra cost → currency/price sync issues across deployments.

**Fix:**  
`[lang]` route prefix + middleware validation + dictionary system. All data fetching passes `lang` as `x-locale` header. Currency derived from locale via `getCurrencyFromLocale()`. One deployment, one CDN, all locales.

---

## 6. Quick-Fire Questions

| Question | Answer |
|---|---|
| Why Redux Toolkit over plain Redux? | `createSlice` eliminates action/reducer boilerplate. Immer allows mutating syntax in reducers. `createSelector` memoization is built-in. |
| Why Formik + Yup instead of React Hook Form? | Yup schemas are composable and reusable across multiple forms (checkout address, profile, sign-up all share validation rules). |
| Why Grunt for CSS instead of Next.js built-in? | Tailwind + SCSS multi-step pipeline (compile → PostCSS → minify → rename) needs explicit task orchestration. Next.js CSS processing does not expose this level of control. |
| Why `createSelector` on `selectCartCount`? | Without memoization, cart count recalculates on every Redux state update — including unrelated auth/wishlist changes. With 50+ components potentially subscribed, that is expensive cascading re-renders on every action. |
| Why does the analytics middleware capture `previousState` before calling `next(action)`? | When `removeItem` dispatches, the item is about to be deleted. The middleware captures the state before the reducer runs so it still has the item's name, productId, and quantity to send to GA4. |
| What does `"use client"` boundary mean architecturally? | Everything above the boundary runs on the server (fast, SEO-friendly, no JS bundle cost). Everything below runs in the browser. The goal is to push the boundary as deep as possible — only leaf interactive components need `"use client"`. |
| How does Live Preview work? | Contentstack sends draft content to `@contentstack/live-preview-utils`. `LivePreviewInit` subscribes to preview events. Draft pages hit `/cms/page/${slug}?draft=true` with a preview secret instead of the published endpoint. |
| Why does `axiosClient` use a plain `axios.post` (not the interceptor-wrapped instance) for the refresh call? | To avoid infinite 401 loops. If the refresh endpoint itself returned 401 and used the interceptor-wrapped client, it would trigger another refresh attempt, creating an infinite loop. |
| What is the `x-magic-header` in axiosClient? | A shared secret header (`W7uLaZ4Z4bxOkdm6`) sent on every request. The backend likely validates this to reject requests not coming through the official frontend — basic request origin verification. |
| Why does `clearCart` also call `deleteCookie("cart_id")`? | Redux lives in memory. Cookies survive a page refresh. If only Redux was cleared, the cookie would still hold the old cartId and `CartLoader` would refetch the old (now server-deleted) cart on the next mount. |

---

## 7. What You Would Improve

These show senior-level critical thinking beyond just implementing features.

### 1. Redis Cache on Read-Heavy API Routes

Categories, currencies, and best-seller products are fetched on every page load but change at most once per day. Without a Redis cache, every page load fires a BigCommerce API call for this static data.

```ts
// Current: fresh BigCommerce call every time
const categories = await axiosClient.get("/bigcom/get_all_categories")

// Better: Redis with 1-hour TTL
const cached = await redis.get("categories")
if (cached) return JSON.parse(cached)
const fresh = await axiosClient.get("/bigcom/get_all_categories")
await redis.set("categories", JSON.stringify(fresh), "EX", 3600)
```

---

### 2. Optimistic UI for Cart Operations

Currently, adding to cart waits for the API response before updating the UI. Users see a spinner for 300–800ms on every cart interaction.

```ts
// Current: API-first, then Redux
await addLineItemToCart(lineItems, cartId)
dispatch(syncCartFromAPI(response))

// Better: Redux-first (optimistic), revert on failure
dispatch(addItem({ item, quantity }))       // instant UI update
try {
  await addLineItemToCart(lineItems, cartId)
} catch {
  dispatch(removeItem(item.id))             // revert on failure
  showToast("Failed to add item")
}
```

---

### 3. Token as Single Source of Truth

The access token currently lives in both a cookie (for the Axios interceptor) and Redux state (for auth guards). A refresh race could cause them to temporarily diverge — Redux says "logged in" but the cookie holds the old token.

**Fix:** Cookie is the single source of truth. Redux stores only the user profile (id, email, name). Auth guards read the cookie directly, not Redux token state.

---

### 4. Route-Level Error Boundaries

The global `src/app/error.tsx` catches all unhandled errors. A broken product page crashes the entire app shell including header and footer.

**Fix:** Add `error.tsx` files at the route segment level so a broken product page shows a product-specific error UI while the rest of the app stays functional.

---

### 5. Analytics Middleware Debouncing

If a user rapidly clicks the quantity increment button, the analytics middleware fires a `UpdateCartQuantity` GA4 event on every click. 10 rapid clicks = 10 GA events for one user action.

```ts
// Add debounce inside the middleware for quantity update actions
if (action?.type === incrementItem.type || action?.type === decrementItem.type) {
  clearTimeout(quantityDebounceTimer)
  quantityDebounceTimer = setTimeout(() => {
    gaEvent({ event: AnalyticsEventName.UpdateCartQuantity, ... })
  }, 500)
}
```

---

### 6. No Request Cancellation on Navigation

When a user navigates away from the product listing while filters are loading, the in-flight API requests complete and try to update state on an unmounted component tree. Adding `AbortController` to the product listing hooks would cancel in-flight requests on unmount.

---

*This guide is based on actual code analysis of the NVIZ B2C Store frontend codebase as of May 2026.*
