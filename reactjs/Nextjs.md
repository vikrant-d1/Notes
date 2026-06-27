# Next.js Interview Preparation


## Table of Contents

1. [What is Next.js?](#1-what-is-nextjs)
2. [Rendering Strategies — Definitions, Benefits & Drawbacks](#2-rendering-strategies)
3. [Scenario-Based Rendering — Which One to Pick and Why](#3-scenario-based-rendering)
4. [Server Components vs Client Components](#4-server-components-vs-client-components)
5. [App Router vs Pages Router](#5-app-router-vs-pages-router)
6. [Next.js 14 vs 15 vs 16 — What Changed](#6-nextjs-14-vs-15-vs-16)
7. [Caching in Next.js — How It Changed Across Versions](#7-caching-in-nextjs)
8. [Data Fetching Patterns](#8-data-fetching-patterns)
9. [Routing & Navigation](#9-routing-and-navigation)
10. [Middleware](#10-middleware)
11. [Server Actions](#11-server-actions)
12. [Image & Font Optimization](#12-image-and-font-optimization)
13. [Authentication Patterns](#13-authentication-patterns)
14. [SEO in Next.js](#14-seo-in-nextjs)
15. [Performance Optimization](#15-performance-optimization)
16. [Deployment & Self-Hosting](#16-deployment-and-self-hosting)
17. [Most Asked Interview Questions with Answers](#17-most-asked-interview-questions-with-answers)

---

## 1. What is Next.js?

Next.js is a React framework built by Vercel that gives you everything you need to build fast, production-ready web applications. While React itself is a library for building UI components, Next.js adds the missing pieces on top of React: routing, server-side rendering, static site generation, API routes, image optimization, and much more — all configured and ready to use out of the box.

**In simple words:** React tells you *how to build components*. Next.js tells you *how to build the whole application* — from the first page load to deployment.

### Why Use Next.js Instead of Plain React?

| Problem with Plain React (CRA) | How Next.js Solves It |
|--------------------------------|----------------------|
| No built-in routing | File-based routing — create a file, get a route |
| Client-side rendering only (bad for SEO) | Multiple rendering strategies — SSR, SSG, ISR, CSR |
| No server-side capabilities | Built-in API routes and Server Components |
| Manual code splitting | Automatic code splitting per page |
| No image optimization | Built-in `<Image>` component with lazy loading and format conversion |
| Manual SEO setup | Built-in metadata API for titles, descriptions, Open Graph |
| Complex deployment configuration | One-command deploy to Vercel, or self-host with Node.js |

---

## 2. Rendering Strategies — Definitions, Benefits & Drawbacks

This is the most important section for interviews. Next.js gives you multiple ways to render a page. Each has a specific use case, and interviewers love asking about the trade-offs.

---

### 2.1 CSR — Client-Side Rendering

**What it is:** The server sends a nearly empty HTML page with a JavaScript bundle. The browser downloads the JavaScript, runs it, and then builds the entire page on the user's device.

**How it works:**
1. User requests a page.
2. Server sends a blank HTML shell + a large JS file.
3. Browser downloads and executes JS.
4. JS fetches data from APIs.
5. Page finally appears.

**When it happens in Next.js:** When you use `"use client"` components that fetch data with `useEffect` and `useState`, or use libraries like React Query on the client side.

```tsx
"use client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/stats").then(res => res.json()).then(setData);
  }, []);

  if (!data) return <p>Loading...</p>;
  return <div>{data.totalUsers} users</div>;
}
```

**Benefits:**
- Rich interactivity — the page can respond instantly to user actions after the initial load.
- Low server cost — the server does very little work; it just serves static files.
- Great for private, behind-login pages where SEO doesn't matter (dashboards, admin panels).
- Smooth SPA (Single Page Application) navigation — no full page reloads.

**Drawbacks:**
- Bad for SEO — search engine crawlers see an empty page because content is built by JavaScript.
- Slow initial load — the user stares at a blank screen or spinner while JS downloads and executes.
- Large JavaScript bundle sent to the browser — affects mobile users on slow networks.
- Content depends on the user's device speed — slow phones = slow pages.
- Layout shift — content pops in after JavaScript runs, causing visual jumps.

---

### 2.2 SSR — Server-Side Rendering

**What it is:** The server generates the full HTML page on every single request. The user receives a complete, ready-to-read page immediately. Then React "hydrates" the page on the client to make it interactive.

**How it works:**
1. User requests a page.
2. Server fetches data, runs the React component, builds complete HTML.
3. Server sends the fully rendered HTML to the browser.
4. Browser shows the page immediately (user can read it).
5. JavaScript loads and "hydrates" the page (now it's interactive — buttons work, forms submit).

**When it happens in Next.js:**
- **App Router:** Any async Server Component that reads request-specific data (cookies, headers, search params) is SSR by default.
- **Pages Router:** Using `getServerSideProps`.

```tsx
// App Router — SSR happens automatically
export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetch(`https://api.example.com/products/${params.id}`, {
    cache: "no-store"  // tells Next.js: don't cache, fetch fresh every time
  }).then(res => res.json());

  return <div>{product.name} — ₹{product.price}</div>;
}
```

```tsx
// Pages Router — explicit SSR
export async function getServerSideProps(context) {
  const res = await fetch(`https://api.example.com/products/${context.params.id}`);
  const product = await res.json();
  return { props: { product } };
}
```

**Benefits:**
- Great for SEO — crawlers receive fully rendered HTML with all the content.
- Fast first paint — the user sees content immediately, no waiting for JavaScript.
- Always fresh data — every request gets the latest data from the server/database.
- Works on slow devices — the heavy work is done by the server, not the user's phone.
- Good for personalized content — each user can get different data (based on cookies, auth, location).

**Drawbacks:**
- Slower Time to First Byte (TTFB) — the server must finish all data fetching and rendering before sending anything.
- Higher server cost — every page visit runs server-side code and makes API/database calls.
- Cannot be cached on a CDN easily — each request is unique.
- Server becomes a bottleneck under high traffic — if 10,000 users hit the page at once, the server must render 10,000 times.
- Hydration cost — even though the user sees HTML quickly, the page isn't interactive until JS loads and hydrates.

---

### 2.3 SSG — Static Site Generation

**What it is:** Pages are generated once at build time (when you run `next build`). The generated HTML files are stored and served directly by a CDN. No server-side computation happens at request time.

**How it works:**
1. During `next build`, Next.js fetches data and generates HTML for each page.
2. The HTML files are deployed to a CDN (like Vercel, Cloudflare, AWS).
3. When a user requests a page, the CDN serves the pre-built HTML instantly.
4. No server-side processing, no database calls, no waiting.

**When it happens in Next.js:**
- **App Router:** Any Server Component that doesn't read request-specific data and uses only cached/static data.
- **Pages Router:** Using `getStaticProps` (and `getStaticPaths` for dynamic routes).

```tsx
// Pages Router — SSG
export async function getStaticProps() {
  const posts = await fetch("https://api.example.com/posts").then(r => r.json());
  return { props: { posts } };
}

// For dynamic routes like /blog/[slug]
export async function getStaticPaths() {
  const posts = await fetch("https://api.example.com/posts").then(r => r.json());
  return {
    paths: posts.map(p => ({ params: { slug: p.slug } })),
    fallback: false, // 404 for unknown slugs
  };
}
```

**Benefits:**
- Fastest possible page load — CDN serves pre-built HTML in milliseconds.
- Cheapest to host — static files on a CDN cost almost nothing, even at massive scale.
- Perfect SEO — full HTML is ready before the user or crawler arrives.
- Infinitely scalable — a CDN can serve millions of users without breaking a sweat.
- Most secure — no server running, no database exposed, nothing to hack at request time.

**Drawbacks:**
- Data becomes stale — the page shows whatever data existed when you last ran `next build`.
- Requires a rebuild to update content — if you change a blog post, you must rebuild and redeploy.
- Build time grows with page count — 10,000 product pages = long build times.
- Not suitable for personalized or user-specific content — everyone sees the same page.
- Not suitable for frequently changing data (stock prices, live scores).

---

### 2.4 ISR — Incremental Static Regeneration

**What it is:** A hybrid approach that combines the speed of SSG with the freshness of SSR. Pages are statically generated at build time, but they automatically regenerate in the background after a specified time interval. Users always get a fast cached page, but the content stays reasonably fresh.

**How it works:**
1. Page is generated at build time (like SSG).
2. CDN serves the cached page instantly to users.
3. After the revalidation interval (e.g., 60 seconds), the next request triggers a background regeneration.
4. The old page is served to the current user (still fast).
5. The new page replaces the old one for future users.

**When it happens in Next.js:**
- **App Router:** Using `revalidate` option in fetch or the page/layout config.
- **Pages Router:** Using `revalidate` in `getStaticProps`.

```tsx
// App Router — ISR with 60-second revalidation
async function getProducts() {
  const res = await fetch("https://api.example.com/products", {
    next: { revalidate: 60 }  // regenerate every 60 seconds
  });
  return res.json();
}

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductList products={products} />;
}
```

```tsx
// Pages Router — ISR
export async function getStaticProps() {
  const products = await fetch("https://api.example.com/products").then(r => r.json());
  return {
    props: { products },
    revalidate: 60, // regenerate every 60 seconds
  };
}
```

**Benefits:**
- Fast like SSG — users get a cached page from the CDN instantly.
- Fresh data without rebuilding — pages update automatically in the background.
- Scalable — CDN serves the cached version; the server only regenerates occasionally.
- No build-time bottleneck — new pages can be generated on-demand (with `fallback: "blocking"`).
- Great balance of speed and freshness for most content-driven sites.

**Drawbacks:**
- Data can be up to N seconds stale — if `revalidate: 60`, a user might see data that's up to 60 seconds old.
- The first user after the interval gets the old page (regeneration happens in the background).
- Complex to debug — "why is my page showing old data?" is a common developer frustration.
- Not suitable for real-time data — if data changes every second, ISR still shows stale content.
- On-demand revalidation adds complexity — you need webhook/API integration to trigger it.

---

### 2.5 PPR — Partial Prerendering (Next.js 15+)

**What it is:** A rendering strategy that combines static and dynamic content in a single page. The static parts of the page (header, footer, layout) are pre-rendered and served instantly from the CDN. The dynamic parts (user-specific data, real-time content) are streamed in afterward using Suspense boundaries.

**How it works:**
1. At build time, Next.js generates the static shell of the page.
2. When a user requests the page, the CDN serves the static shell instantly.
3. The dynamic parts (wrapped in `<Suspense>`) are rendered on the server and streamed to the browser.
4. The browser fills in the dynamic sections as they arrive — no full-page reload.

```tsx
import { Suspense } from "react";

export default function ProductPage({ params }) {
  return (
    <div>
      {/* This part is static — served from CDN instantly */}
      <Header />
      <ProductInfo id={params.id} />

      {/* This part is dynamic — streamed after */}
      <Suspense fallback={<p>Loading reviews...</p>}>
        <UserReviews productId={params.id} />
      </Suspense>

      <Suspense fallback={<p>Loading recommendations...</p>}>
        <PersonalizedRecommendations />
      </Suspense>

      <Footer />
    </div>
  );
}
```

**Benefits:**
- Best of both worlds — instant static shell + fresh dynamic content.
- Great perceived performance — users see the page structure immediately while dynamic data loads.
- Excellent for SEO — the static shell is fully crawlable.
- Reduces server load — only the dynamic parts require server-side work, not the entire page.
- No full-page loading spinner — content appears progressively.

**Drawbacks:**
- Relatively new — still maturing, limited community examples and debugging resources.
- Requires careful Suspense boundary planning — you need to think about what's static vs dynamic.
- Adds architectural complexity — developers must understand streaming and Suspense deeply.
- Not all hosting providers fully support streaming — some platforms may not serve partial content correctly.

---

### 2.6 Streaming SSR

**What it is:** Instead of waiting for the entire page to be ready before sending it, the server sends HTML in chunks as each part finishes rendering. Sections wrapped in `<Suspense>` show a fallback first, then the actual content streams in when it's ready.

```tsx
import { Suspense } from "react";

export default async function Page() {
  return (
    <div>
      <h1>Dashboard</h1>

      <Suspense fallback={<SkeletonChart />}>
        <RevenueChart />  {/* Takes 2 seconds to fetch */}
      </Suspense>

      <Suspense fallback={<SkeletonTable />}>
        <RecentOrders />  {/* Takes 500ms to fetch */}
      </Suspense>
    </div>
  );
}
```

**Benefits:**
- Faster TTFB — the server starts sending HTML immediately without waiting for all data.
- Progressive loading — fast sections appear first, slow sections appear as they become ready.
- Better user experience — users see content filling in instead of a blank screen.

**Drawbacks:**
- Requires Suspense boundaries — you must plan what shows loading states and what doesn't.
- Harder to test and debug — content appears in unpredictable order depending on data fetch speeds.
- Not supported everywhere — some CDN/proxy setups buffer the entire response, breaking streaming.

---

## 3. Scenario-Based Rendering — Which One to Pick and Why

This is what interviewers actually want to hear. They describe a project and ask: "What rendering strategy would you use and why?"

---

### Scenario 1: Marketing/Landing Page

**Project:** A company homepage with hero section, features, testimonials, and pricing.

**Best Choice: SSG (Static Site Generation)**

**Why:** The content rarely changes (maybe once a week or month). SSG generates the page at build time, and it's served from a CDN in milliseconds. It's the fastest and cheapest option. SEO is perfect because the full HTML is ready for crawlers.

**Why not SSR?** Unnecessary server cost for content that doesn't change per request.
**Why not CSR?** SEO would suffer — Google would see a blank page.

---

### Scenario 2: E-Commerce Product Listing Page

**Project:** A product listing page showing hundreds of products with prices and availability that change multiple times per day.

**Best Choice: ISR (Incremental Static Regeneration) with 60–300 second revalidation**

**Why:** Products don't change every second, but they do change multiple times a day. ISR gives you CDN speed (instant page loads) while automatically refreshing the data every few minutes. When a product price changes, the page updates within the revalidation window without a rebuild.

**Alternative:** On-demand revalidation — when the admin updates a product in the CMS, the CMS sends a webhook to Next.js that triggers immediate regeneration of that specific page.

---

### Scenario 3: User Dashboard (After Login)

**Project:** A dashboard showing the logged-in user's orders, profile, notifications, and analytics.

**Best Choice: SSR + Streaming (or CSR for some sections)**

**Why:** Every user sees different data, so you can't use SSG or ISR (they generate the same page for everyone). SSR renders the page on the server with the user's data and sends it to the browser. Streaming lets you show the dashboard layout immediately while individual data sections load progressively.

**Why not pure CSR?** CSR would show a blank page or spinner first. SSR gives the user content faster and works better on slow devices.

---

### Scenario 4: Blog or Documentation Site

**Project:** A blog with 500 articles that update occasionally.

**Best Choice: SSG with On-Demand Revalidation**

**Why:** Blog posts are written once and rarely edited. SSG generates all 500 pages at build time. When an author publishes or edits a post, a webhook triggers on-demand revalidation for just that one page — no full rebuild needed.

**Why not ISR with time-based revalidation?** A blog post doesn't change every 60 seconds. Time-based ISR would waste server resources checking for changes that aren't happening.

---

### Scenario 5: Social Media Feed (Twitter/Instagram-like)

**Project:** A real-time feed showing posts from people you follow, with likes, comments, and new posts appearing instantly.

**Best Choice: SSR for initial load + CSR for real-time updates**

**Why:** The initial feed is rendered on the server (SSR) so the user sees content immediately. After the page loads, client-side code takes over — WebSockets or polling update the feed in real-time. New posts, likes, and comments appear without a page reload.

**Why not pure SSR?** Real-time updates require JavaScript on the client side to listen for changes and update the UI instantly.

---

### Scenario 6: News Website Homepage

**Project:** A homepage showing breaking news, trending stories, and category sections. Content updates frequently throughout the day.

**Best Choice: PPR (Partial Prerendering) or ISR with short revalidation**

**Why with PPR:** The header, navigation, footer, and category layout are static (they don't change). The actual news stories are dynamic. PPR serves the static shell instantly from the CDN and streams in the latest stories. This gives the fastest perceived loading while keeping content fresh.

**Why with ISR:** If PPR isn't available, ISR with a 30–60 second revalidation ensures the homepage updates automatically without requiring a rebuild.

---

### Scenario 7: Internal Admin Panel / CRM

**Project:** An internal tool for employees to manage customers, orders, and inventory. Not public-facing.

**Best Choice: CSR (Client-Side Rendering)**

**Why:** SEO is irrelevant (it's behind a login, not indexed by search engines). The interface is highly interactive with forms, tables, filters, and modals that respond to user input instantly. CSR keeps the server cost low and gives a fast, SPA-like experience.

**Why not SSR?** The overhead of server rendering on every page transition is unnecessary for an internal tool where initial load speed isn't critical.

---

### Scenario 8: Multi-Language, Multi-Region E-Commerce

**Project:** An international e-commerce site serving users in 20 countries with localized content, pricing, and availability.

**Best Choice: SSR with Edge Runtime**

**Why:** Each user sees different prices, currency, language, and product availability based on their region. SSR handles this by reading the user's location (from headers or cookies) and rendering the correct localized version. Running SSR at the Edge (close to the user) keeps latency low across all regions.

**Why not SSG?** You'd need to generate separate static pages for every combination of product × language × region — potentially millions of pages. Not practical.

---

### Quick Decision Flowchart

```
Does the page need SEO?
├── NO → Is it highly interactive?
│         ├── YES → CSR (dashboards, admin panels)
│         └── NO  → CSR or SSR (depends on complexity)
│
└── YES → Does content change per user/request?
          ├── YES → SSR (personalized, authenticated pages)
          │         Consider Streaming if page has slow data sources
          │
          └── NO  → How often does content change?
                    ├── Rarely (weekly/monthly) → SSG
                    ├── Sometimes (daily) → ISR (revalidate: 3600)
                    ├── Often (hourly) → ISR (revalidate: 60)
                    └── Mixed static + dynamic → PPR
```

---

## 4. Server Components vs Client Components

### Server Components (Default in App Router)

**What they are:** Components that run ONLY on the server. Their code never reaches the browser. They can directly access databases, read files, and call internal APIs without exposing secrets.

**Key traits:**
- No `useState`, `useEffect`, or any browser hooks.
- No event handlers (`onClick`, `onChange`).
- Can use `async/await` directly in the component.
- Can import server-only packages (`fs`, database clients).
- Send zero JavaScript to the browser — only the rendered HTML.

```tsx
// This is a Server Component (default in App Router)
import { db } from "@/lib/database";

export default async function UserList() {
  const users = await db.users.findMany(); // Direct DB access — safe, never exposed
  return (
    <ul>
      {users.map(u => <li key={u.id}>{u.name}</li>)}
    </ul>
  );
}
```

### Client Components

**What they are:** Components that run in the browser. They handle interactivity — state, effects, event handlers, and browser APIs. Marked with `"use client"` at the top of the file.

```tsx
"use client";
import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

### When to Use Which

| Use Server Component When | Use Client Component When |
|--------------------------|--------------------------|
| Fetching data from DB or API | Handling user interactions (clicks, input, forms) |
| Displaying static or read-only content | Using React hooks (`useState`, `useEffect`, `useRef`) |
| Accessing backend resources (DB, file system) | Using browser APIs (localStorage, window, navigator) |
| Keeping secrets safe (API keys, tokens) | Real-time updates (WebSockets, polling) |
| Reducing JavaScript sent to browser | Animations and transitions |

### The Golden Rule

Push `"use client"` as deep as possible in your component tree. Don't put it on a page — put it on the specific button, form, or interactive widget that actually needs it.

---

## 5. App Router vs Pages Router

| Feature | Pages Router (`pages/`) | App Router (`app/`) |
|---------|------------------------|---------------------|
| Introduced in | Next.js 1 (original) | Next.js 13 (2022) |
| Default Components | Client Components | Server Components |
| Data Fetching | `getServerSideProps`, `getStaticProps`, `getStaticPaths` | `async/await` directly in components, `fetch` with cache options |
| Layouts | Manual — wrap each page, re-renders on navigation | Built-in nested `layout.tsx` — persists across navigations, no re-render |
| Loading States | Manual implementation | Built-in `loading.tsx` with Suspense |
| Error Handling | Custom `_error.tsx` page | Built-in `error.tsx` with error boundaries per route segment |
| Streaming | Limited support | Full streaming with Suspense |
| Metadata/SEO | Manual `<Head>` component | Built-in `metadata` export and `generateMetadata()` function |
| Route Groups | Not supported | `(groupName)` folders — organize without affecting URL |
| Parallel Routes | Not supported | `@slot` folders — render multiple pages in the same layout |
| Intercepting Routes | Not supported | `(..)` convention — modal patterns |

**Which to use?** The App Router is the recommended approach for all new projects. The Pages Router is still fully supported and works fine for existing apps, but new features (PPR, Server Components, streaming) are only available in the App Router.

---

## 6. Next.js 14 vs 15 vs 16 — What Changed

### Next.js 14 (October 2023)

| Feature | Detail |
|---------|--------|
| React Version | React 18 |
| Bundler | Turbopack in beta (dev only) — had to opt in manually |
| Server Actions | Became stable — no longer experimental |
| Caching | Aggressive by default — `fetch()`, GET handlers, and client navigations were all cached automatically |
| Partial Prerendering | Experimental preview — not production-ready |
| Request APIs | Synchronous — `params`, `searchParams`, `cookies()`, `headers()` were all sync |
| Metadata API | Stable |
| App Router | Stable and recommended for new projects |

### Next.js 15 (October 2024)

| Feature | What Changed from 14 |
|---------|---------------------|
| React Version | React 19 RC — new hooks, improved Suspense, Actions API |
| Bundler | Turbopack stable for dev, beta for production builds — much faster |
| Caching (Breaking Change) | No longer cached by default — `fetch()`, GET handlers, and client navigations are now uncached unless you explicitly opt in. This was one of the biggest complaints about v14. |
| Request APIs (Breaking Change) | Now async — `params`, `searchParams`, `cookies()`, `headers()` must be `await`ed |
| Partial Prerendering | Stable — combine static and dynamic content in one page |
| `next/after` API | New — run code after the response finishes streaming (analytics, logging) |
| `<Form>` Component | New built-in form component with client-side navigation support |
| Hydration Errors | Much better error messages with source code location |
| Turbopack Dev | 5-10x faster Fast Refresh during development |
| `next/image` | Better AVIF support and optimizations |
| Security | Enhanced Server Actions security |
| Minimum Node.js | 18.18 (was 18.17) |

### Next.js 16 (October 2025)

| Feature | What Changed from 15 |
|---------|---------------------|
| React Version | React 19.2 — View Transitions, `useEffectEvent()`, `<Activity/>` |
| Bundler | Turbopack is now the DEFAULT bundler — Webpack fully replaced |
| Turbopack Speed | Up to 10x faster Fast Refresh, 2-5x faster production builds |
| Cache Components (`"use cache"`) | New caching model — explicit and opt-in using `"use cache"` directive. Replaces the confusing implicit caching of v13-14. |
| React Compiler | Stable — automatic memoization, no more manual `useMemo`/`useCallback` |
| `proxy.ts` | New — replaces `middleware.ts` for network-level concerns (auth, redirects) |
| Devtools MCP | AI-assisted debugging via Model Context Protocol |
| Enhanced Routing | Optimized navigation and prefetching — 50% less network transfer for shared layouts |
| Build Adapters API | Alpha — create custom adapters for different hosting platforms |
| Caching APIs | New `updateTag()`, `refresh()`, refined `revalidateTag()` |
| Breaking Changes | Async params enforced, `next/image` default changes, AMP support removed |
| File System Caching | Beta — persists Turbopack cache across restarts for even faster startup |

### Side-by-Side Comparison

| Feature | Next.js 14 | Next.js 15 | Next.js 16 |
|---------|-----------|-----------|-----------|
| React | 18 | 19 RC | 19.2 |
| Bundler | Webpack (Turbopack beta) | Turbopack (stable dev) | Turbopack (default everywhere) |
| Build Speed | Baseline | 2-3x faster | 2-5x faster |
| Caching Default | Cached by default | Uncached by default | Explicit `"use cache"` |
| `params` / `searchParams` | Sync | Async (breaking) | Async (enforced) |
| Partial Prerendering | Experimental | Stable | Stable + Cache Components |
| Server Actions | Stable | Enhanced + secure | Enhanced + forms |
| React Compiler | Not available | Experimental | Stable |
| Middleware | `middleware.ts` | `middleware.ts` | `proxy.ts` (new) |

### What This Means for Interviews

When an interviewer asks "What changed between Next.js 14 and 15?", the top 3 answers are:

1. **Caching flipped** — In 14, everything was cached by default (developers complained). In 15, nothing is cached by default — you must opt in.
2. **Request APIs became async** — `params`, `searchParams`, `cookies()`, and `headers()` must now be `await`ed. This is a breaking change that affects every dynamic page.
3. **Turbopack stabilized** — Development builds became 5-10x faster.

When they ask "What about Next.js 16?", the top 3 are:

1. **Cache Components with `"use cache"`** — A completely new, explicit caching model.
2. **Turbopack is the default** — Webpack is gone.
3. **React Compiler is stable** — Automatic memoization, no more manual `useMemo`/`useCallback`.

---

## 7. Caching in Next.js — How It Changed Across Versions

Caching is the single most confusing topic in Next.js and the most asked about in interviews.

### The Timeline of Confusion and Clarity

**Next.js 13-14 (The Confusing Era):**
Everything was cached aggressively by default. `fetch()` results, GET route handlers, and even client-side page navigations were all cached. Developers were constantly confused: "Why is my page showing old data?" The framework was too opinionated about caching.

**Next.js 15 (The Correction):**
Caching was turned off by default. Nothing is cached unless you explicitly say so. Developers now have full control. You opt in with `fetch("...", { next: { revalidate: 60 } })` or `export const revalidate = 60`.

**Next.js 16 (The New Model):**
Introduced `"use cache"` directive — a new programming model where you explicitly mark what should be cached.

```tsx
// Next.js 16 — explicit caching with "use cache"
"use cache";

export default async function ProductPage() {
  const products = await fetch("https://api.example.com/products").then(r => r.json());
  return <ProductList products={products} />;
}
```

### Four Layers of Caching in Next.js

| Layer | What It Caches | Where |
|-------|---------------|-------|
| **Request Memoization** | Duplicate `fetch()` calls in the same render pass — if 3 components fetch the same URL, only 1 actual request is made | Server, per-request |
| **Data Cache** | `fetch()` response data — persists across requests and deployments | Server |
| **Full Route Cache** | Complete HTML and RSC payload of statically rendered routes | Server / CDN |
| **Router Cache** | Previously visited pages stored in the browser for instant back/forward navigation | Client (browser) |

---

## 8. Data Fetching Patterns

### In Server Components (Recommended)

```tsx
// Direct async/await — simplest pattern
export default async function UsersPage() {
  const users = await fetch("https://api.example.com/users").then(r => r.json());
  return <UserList users={users} />;
}
```

### Parallel Data Fetching

When you need data from multiple sources, fetch them in parallel to avoid waterfall delays.

```tsx
export default async function DashboardPage() {
  // Both start at the same time — no waterfall
  const [users, orders, revenue] = await Promise.all([
    fetch("/api/users").then(r => r.json()),
    fetch("/api/orders").then(r => r.json()),
    fetch("/api/revenue").then(r => r.json()),
  ]);

  return (
    <div>
      <UserCount count={users.length} />
      <OrderTable orders={orders} />
      <RevenueChart data={revenue} />
    </div>
  );
}
```

### Sequential vs Parallel — When It Matters

| Pattern | Use When | Example |
|---------|----------|---------|
| Sequential | Second fetch depends on first fetch's result | Fetch user → then fetch user's orders |
| Parallel | Fetches are independent of each other | Fetch users AND orders AND revenue at the same time |

---

## 9. Routing and Navigation

### File-Based Routing (App Router)

| File/Folder | What It Does |
|-------------|-------------|
| `app/page.tsx` | Home page (`/`) |
| `app/about/page.tsx` | About page (`/about`) |
| `app/blog/[slug]/page.tsx` | Dynamic route (`/blog/my-first-post`) |
| `app/shop/[...slug]/page.tsx` | Catch-all route (`/shop/men/shoes/nike`) |
| `app/layout.tsx` | Shared layout that wraps child pages — persists across navigations |
| `app/loading.tsx` | Loading UI shown via Suspense while page loads |
| `app/error.tsx` | Error boundary UI for handling runtime errors |
| `app/not-found.tsx` | Custom 404 page |
| `app/(marketing)/page.tsx` | Route group — organizes code without affecting URL |
| `app/@modal/page.tsx` | Parallel route — render multiple pages in the same layout |

### Navigation

```tsx
// Link component — client-side navigation, prefetches on hover
import Link from "next/link";
<Link href="/about">About</Link>

// Programmatic navigation
"use client";
import { useRouter } from "next/navigation";
const router = useRouter();
router.push("/dashboard");
router.replace("/login"); // no back button
router.refresh();         // re-fetch server component data
```

---

## 10. Middleware

**What it is:** Code that runs BEFORE a request is completed. It sits between the user's request and your page/API route. Used for authentication, redirects, rate limiting, A/B testing, and localization.

```tsx
// middleware.ts (at the project root)
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token");

  // If not logged in, redirect to login page
  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
```

**Note:** In Next.js 16, `proxy.ts` is introduced as a clearer alternative for network-boundary concerns.

---

## 11. Server Actions

**What they are:** Async functions that run on the server but can be called directly from client components — no need to create a separate API route for simple mutations.

```tsx
// app/actions.ts
"use server";

export async function addToCart(productId: string) {
  const session = await getSession();
  await db.cart.add({ userId: session.userId, productId });
  revalidatePath("/cart");
}
```

```tsx
// app/product/[id]/page.tsx — calling from a client component
"use client";
import { addToCart } from "@/app/actions";

export default function AddToCartButton({ productId }: { productId: string }) {
  return (
    <button onClick={() => addToCart(productId)}>
      Add to Cart
    </button>
  );
}
```

**Benefits:** No need for separate API routes for mutations. Type-safe end-to-end. Progressive enhancement — works even without JavaScript on the client (when used with `<form action={...}>`).

**When to use:** Form submissions, database mutations, cart updates, toggles — any action that writes data.

**When NOT to use:** Complex APIs consumed by external services, webhooks, or non-Next.js clients. Use Route Handlers (`app/api/`) for those.

---

## 12. Image and Font Optimization

### `next/image`

The `<Image>` component automatically optimizes images: lazy loading, responsive sizing, format conversion (WebP/AVIF), and preventing layout shift.

```tsx
import Image from "next/image";

<Image
  src="/hero.jpg"
  alt="Hero banner"
  width={1200}
  height={600}
  priority  // loads immediately for above-the-fold images
/>
```

### `next/font`

Loads fonts at build time, hosts them locally (no external requests), and eliminates layout shift.

```tsx
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });

export default function Layout({ children }) {
  return <body className={inter.className}>{children}</body>;
}
```

---

## 13. Authentication Patterns

| Pattern | How It Works | Best For |
|---------|-------------|----------|
| **Middleware + Cookie** | Check auth cookie in middleware; redirect to login if missing | Most apps |
| **Server Component check** | Read session in Server Component; show different UI for logged-in vs logged-out | Content that varies by auth state |
| **Server Action validation** | Validate session inside Server Actions before performing mutations | Protecting write operations |
| **Third-party (NextAuth / Auth.js)** | Full auth library with providers (Google, GitHub, credentials) | Apps needing OAuth, social login |

---

## 14. SEO in Next.js

### Static Metadata

```tsx
// app/about/page.tsx
export const metadata = {
  title: "About Us — MyApp",
  description: "Learn about our company and team.",
  openGraph: {
    title: "About Us",
    description: "Learn about our company.",
    images: ["/og-about.png"],
  },
};
```

### Dynamic Metadata

```tsx
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { images: [post.coverImage] },
  };
}
```

### Sitemap and Robots

```tsx
// app/sitemap.ts
export default async function sitemap() {
  const posts = await getAllPosts();
  return posts.map(post => ({
    url: `https://mysite.com/blog/${post.slug}`,
    lastModified: post.updatedAt,
  }));
}

// app/robots.ts
export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://mysite.com/sitemap.xml",
  };
}
```

---

## 15. Performance Optimization

| Technique | What It Does |
|-----------|-------------|
| **Use Server Components** | Reduces JavaScript sent to browser — only interactive parts ship JS |
| **Dynamic imports** | `dynamic(() => import("./HeavyChart"), { ssr: false })` — lazy-load components |
| **Image optimization** | Use `<Image>` for automatic lazy loading, WebP/AVIF, and responsive sizing |
| **Font optimization** | Use `next/font` to self-host fonts and eliminate layout shift |
| **Route groups** | Organize code without adding URL segments — keeps bundles clean |
| **Parallel fetching** | `Promise.all()` for independent data fetches — avoid waterfalls |
| **Streaming with Suspense** | Show content progressively as it becomes ready |
| **Caching** | Cache fetch responses, full routes, and use CDN for static content |
| **Bundle analysis** | `@next/bundle-analyzer` to find what's making your JS bundles large |
| **Avoid barrel files** | Don't re-export everything from `index.ts` — it pulls in unused code |

---

## 16. Deployment and Self-Hosting

| Platform | How | Notes |
|----------|-----|-------|
| **Vercel** | `git push` — auto-deploys | Zero config, built for Next.js, serverless by default |
| **Node.js server** | `next build` → `next start` | Full feature support, requires a running server |
| **Docker** | Multi-stage Dockerfile with `standalone` output | Production-ready, portable |
| **Static export** | `output: "export"` in `next.config.js` | No server features (no SSR, API routes, middleware) |

### Standalone Output (for Docker)

```js
// next.config.js
module.exports = {
  output: "standalone", // creates a minimal self-contained build
};
```

---

## 17. Most Asked Interview Questions with Answers

---

### Q1: What is the difference between SSR, SSG, ISR, and CSR?

**Answer:** These are four ways to generate and deliver a page. SSR builds the page on the server for every request — good for personalized, fresh content. SSG builds the page once at build time — fastest delivery, best for static content. ISR is a mix — pages are static but regenerate automatically after a time interval. CSR sends an empty page and JavaScript builds everything in the browser — good for private, interactive dashboards.

The key trade-off is between **freshness** (how up-to-date the data is) and **speed** (how fast the page loads). SSG is fastest but stale. SSR is freshest but slowest. ISR is the middle ground. CSR is fast after initial load but bad for SEO.

---

### Q2: What are Server Components and why do they matter?

**Answer:** Server Components are React components that run only on the server. They never ship JavaScript to the browser. This matters because it drastically reduces the amount of JS the user's browser has to download and execute. They can also directly access databases and secret keys without exposing them. The result is faster page loads, better security, and simpler code. Client Components are used only for interactive parts — state, effects, event handlers.

---

### Q3: How does caching work in Next.js 15?

**Answer:** Next.js 15 changed caching to be opt-in instead of automatic. In version 14, `fetch()` responses and GET handlers were cached by default, which confused many developers. In version 15, nothing is cached unless you explicitly configure it using `{ next: { revalidate: N } }` in fetch options or by exporting `revalidate` from the page config. There are four caching layers: request memoization (deduplicates same-render fetches), data cache (persists fetch responses), full route cache (caches static HTML), and router cache (client-side page cache).

---

### Q4: What is Partial Prerendering (PPR)?

**Answer:** PPR is a rendering strategy that splits a single page into static and dynamic parts. The static parts (layout, header, footer) are pre-rendered at build time and served from a CDN instantly. The dynamic parts (user data, recommendations) are streamed in later using Suspense. The user sees the page skeleton immediately while dynamic content loads. It's the best of SSG and SSR combined.

---

### Q5: What is the difference between `app/` router and `pages/` router?

**Answer:** The `pages/` router is the original routing system where every file becomes a route and all components are Client Components by default. Data fetching uses `getServerSideProps` and `getStaticProps`. The `app/` router (Next.js 13+) uses Server Components by default, supports nested layouts, built-in loading and error states, streaming, Suspense, and parallel routes. The `app/` router is recommended for all new projects.

---

### Q6: What is `middleware.ts` and when would you use it?

**Answer:** Middleware is code that runs before every request reaches your page or API route. It sits at the network layer and can redirect users, rewrite URLs, set headers, or check authentication. Common use cases: redirect unauthenticated users to login, A/B testing by rewriting to different page versions, adding security headers, and locale detection for internationalization.

---

### Q7: What are Server Actions?

**Answer:** Server Actions are async functions marked with `"use server"` that run on the server but can be called directly from client components. They replace the need to create separate API routes for simple data mutations like form submissions, adding items to a cart, or toggling a setting. They're type-safe, support progressive enhancement (work without JavaScript), and can trigger revalidation after completing.

---

### Q8: How do you handle SEO in Next.js?

**Answer:** Next.js provides a built-in Metadata API. You can export a static `metadata` object from any page for fixed titles and descriptions, or use `generateMetadata()` function for dynamic metadata that depends on data (like a blog post title). You can also generate `sitemap.xml` and `robots.txt` programmatically by creating `sitemap.ts` and `robots.ts` files in the `app/` directory. Using Server Components ensures search engines see fully rendered HTML.

---

### Q9: Explain the waterfall problem in data fetching and how to fix it.

**Answer:** A waterfall happens when data fetches are sequential — fetch A starts, waits to finish, then fetch B starts, waits to finish, then fetch C starts. Total time = A + B + C. If each takes 1 second, the page takes 3 seconds.

The fix is parallel fetching using `Promise.all()`. All three fetches start at the same time. Total time = longest single fetch (1 second). For independent data sources, always fetch in parallel.

For cases where sequential is unavoidable (fetch B depends on fetch A's result), use Streaming with Suspense — show the parts that are ready while slower parts load.

---

### Q10: What is hydration and what is a hydration error?

**Answer:** Hydration is the process where React runs on the client side and attaches event listeners and interactivity to the HTML that was rendered on the server. The client-side React must produce the exact same HTML as the server. If there's a mismatch — for example, the server renders a date in one format but the client renders it differently — React throws a hydration error.

Common causes: using `Date.now()` or `Math.random()` in render, using browser-only APIs like `window` during server render, or different data between server and client. The fix is to ensure the component produces identical HTML on both server and client, or use `useEffect` for browser-only values.

---

### Q11: What is `revalidatePath` and `revalidateTag`?

**Answer:** These are functions for on-demand cache invalidation. `revalidatePath("/products")` tells Next.js to regenerate the `/products` page the next time it's requested. `revalidateTag("products")` invalidates all fetch calls tagged with `"products"`. They're typically called inside Server Actions or API route handlers after a mutation (creating, updating, or deleting data) to ensure users see fresh content.

---

### Q12: How do you handle loading and error states in the App Router?

**Answer:** The App Router has built-in conventions. Create a `loading.tsx` file in any route folder — it automatically wraps the page in a Suspense boundary and shows while the page loads. Create an `error.tsx` file — it wraps the page in an error boundary and shows when an uncaught error occurs. Create `not-found.tsx` for 404 pages. These work at every level of the route tree, so you can have different loading and error UIs for different sections.

---

### Q13: What is the difference between `redirect()` and `router.push()`?

**Answer:** `redirect()` is a server-side function — it runs in Server Components, Server Actions, or Route Handlers and sends an HTTP redirect response. The user's browser navigates to the new URL with a proper HTTP status code (307 or 308). `router.push()` is a client-side function — it runs in Client Components (using `useRouter()` hook) and performs a client-side navigation without a full page reload. Use `redirect()` for auth redirects and server-side logic. Use `router.push()` for in-app navigation triggered by user actions.

---

### Q14: How would you optimize a slow Next.js application?

**Answer:**
1. Identify the bottleneck — use Vercel Analytics, Lighthouse, or the Next.js profiler.
2. Move data fetching to Server Components to reduce client-side JavaScript.
3. Parallel fetch independent data with `Promise.all()`.
4. Use Streaming and Suspense for pages with slow data sources.
5. Optimize images with `<Image>` and fonts with `next/font`.
6. Lazy-load heavy Client Components with `dynamic()`.
7. Add proper caching — ISR or fetch-level revalidation.
8. Analyze bundle size with `@next/bundle-analyzer` and remove unused dependencies.
9. Use Edge Runtime for latency-sensitive routes.
10. Avoid unnecessary Client Components — every `"use client"` adds JS to the bundle.

---

### Q15: Can you explain Route Groups, Parallel Routes, and Intercepting Routes?

**Answer:**

**Route Groups `(folder)`:** Folders wrapped in parentheses organize your code without affecting the URL. `app/(marketing)/about/page.tsx` still renders at `/about`, not `/marketing/about`. Useful for separating marketing pages from dashboard pages while sharing different layouts.

**Parallel Routes `@slot`:** Let you render multiple pages simultaneously in the same layout. For example, `@dashboard` and `@analytics` slots can each render independent content within a shared layout. Useful for split-view UIs or dashboards with independently loading sections.

**Intercepting Routes `(..)` `(.)` `(...)`:** Let you "intercept" a navigation and show a different view (like a modal) while keeping the URL updated. For example, clicking a photo in a gallery shows a modal overlay, but if you share that URL, it shows the full photo page. Instagram and Twitter use this pattern.

---

> **Interview Tip:** At the senior level, never just name a rendering strategy. Always explain the trade-off: what do you gain, what do you give up, and why is that trade-off acceptable for the given scenario. That's what separates a senior answer from a junior one.
