# Next.js Interview Preparation

## 1. What is Next.js?

Next.js is a React framework built by Vercel that gives you everything you need to build fast, production-ready web applications. While React itself is a library for building UI components, Next.js adds the missing pieces on top of React: routing, server-side rendering, static site generation, API routes, image optimization, and much more — all configured and ready to use out of the box.



## 2. Rendering Strategies

### 2.1 CSR — Client-Side Rendering

**What it is:** The server sends a nearly empty HTML page with a JavaScript bundle. The browser downloads the JavaScript, runs it, and then builds the entire page on the user's device.


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


### 2.2 SSR — Server-Side Rendering

**What it is:** The server generates the full HTML page on every single request. The user receives a complete, ready-to-read page immediately. Then React "hydrates" the page on the client to make it interactive.

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



### 2.3 SSG — Static Site Generation

**What it is:** Pages are generated once at build time (when you run `next build`). The generated HTML files are stored and served directly by a CDN. No server-side computation happens at request time.


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

### 2.4 ISR — Incremental Static Regeneration

**What it is:** A hybrid approach that combines the speed of SSG with the freshness of SSR. Pages are statically generated at build time, but they automatically regenerate in the background after a specified time interval. Users always get a fast cached page, but the content stays reasonably fresh.

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


### 2.5 PPR — Partial Prerendering (Next.js 15+)

**What it is:** A rendering strategy that combines static and dynamic content in a single page. The static parts of the page (header, footer, layout) are pre-rendered and served instantly from the CDN. The dynamic parts (user-specific data, real-time content) are streamed in afterward using Suspense boundaries.

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


### The Golden Rule

Push `"use client"` as deep as possible in your component tree. Don't put it on a page — put it on the specific button, form, or interactive widget that actually needs it.

---




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
