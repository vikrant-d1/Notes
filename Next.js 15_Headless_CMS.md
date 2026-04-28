# Interview Preparation Guide: Senior Frontend Developer (Next.js 15 + Headless CMS)

---

## 1. Next.js 15 — What's New (Top Interview Topic)

### 1.1 Breaking Changes You MUST Know

**Async Request APIs (Biggest Breaking Change)**

In Next.js 15, all request-time APIs now return Promises instead of values. This is the most critical change to understand:

```tsx

// ✅ Next.js 15 (NEW — all async)
import { cookies, headers, draftMode } from 'next/headers';

const cookieStore = await cookies();
const token = cookieStore.get('token');

const headersList = await headers();
const referer = headersList.get('referer');

// ✅ NEW: params must be awaited
export default async function Page({ params }) {
  const { slug } = await params;
  return <h1>{slug}</h1>;
}

// ✅ In Client Components — use React.use() instead of await
'use client';
import { use } from 'react';

export default function Page({ params }) {
  const { slug } = use(params);
  return <h1>{slug}</h1>;
}
```

**All affected APIs:**
- `cookies()` — now returns `Promise`
- `headers()` — now returns `Promise`
- `draftMode()` — now returns `Promise`
- `params` — in `layout.js`, `page.js`, `route.js`, `default.js`, metadata files
- `searchParams` — in `page.js`

**Why this matters:** This change enables Next.js to prepare non-request-specific parts of a page ahead of time (prerendering), improving performance. Only when you `await` these APIs does the framework know the component needs request-time data.

**Migration tool:**
```bash
npx @next/codemod@canary next-async-request-api .
```

---

**Caching Defaults Changed (Second Biggest Breaking Change)**

Next.js 15 flips caching from "cached by default" to "uncached by default":

```tsx


// ✅ Next.js 15: fetch is NOT cached by default
const data = await fetch('https://api.example.com/data');
// This is now equivalent to: { cache: 'no-store' }

// To opt INTO caching in Next.js 15:
const data = await fetch('https://api.example.com/data', {
  cache: 'force-cache',
});

// Or use time-based revalidation:
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 3600 }, // Cache for 1 hour
});
```

**GET Route Handlers — also uncached by default now:**
```tsx
// Next.js 14: GET handlers were cached by default
// Next.js 15: GET handlers are NOT cached by default

// To opt into caching:
export const dynamic = 'force-static';

export async function GET() {
  const data = await getDataFromCMS();
  return Response.json(data);
}
```

**Client Router Cache — also uncached now:**
- Page components are no longer cached on the client by default
- `staleTime` for dynamic pages defaults to 0 (was 30 seconds)
- Layouts and loading states are still cached and reused

To restore old behavior:
```js
// next.config.js
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,  // restore 30-second client cache
      static: 180,
    },
  },
};
```

---

### 1.2 React 19 Support

Next.js 15 ships with React 19. Key new hooks:

**`useActionState` (replaces deprecated `useFormState`):**
```tsx
'use client';
import { useActionState } from 'react';
import { submitForm } from './actions';

function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitForm, {
    message: '',
  });

  return (
    <form action={formAction}>
      <input name="email" type="email" />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Sending...' : 'Submit'}
      </button>
      {state.message && <p>{state.message}</p>}
    </form>
  );
}
```

**`useFormStatus` — now includes `data`, `method`, `action`:**
```tsx
'use client';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}
```

**`useOptimistic` — for optimistic UI updates:**
```tsx
'use client';
import { useOptimistic } from 'react';

function TodoList({ todos, addTodoAction }) {
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (state, newTodo) => [...state, { ...newTodo, pending: true }]
  );

  return (
    <form action={async (formData) => {
      const title = formData.get('title');
      addOptimistic({ title, id: Date.now() });
      await addTodoAction(formData);
    }}>
      <input name="title" />
      <button type="submit">Add</button>
      {optimisticTodos.map(todo => (
        <li key={todo.id} style={{ opacity: todo.pending ? 0.5 : 1 }}>
          {todo.title}
        </li>
      ))}
    </form>
  );
}
```

**React Compiler (Experimental):**
- Automatically optimizes re-renders — no manual `useMemo`/`useCallback` needed
- Enable in `next.config.js`:
```js
const nextConfig = {
  experimental: {
    reactCompiler: true,
  },
};
```

---

### 1.3 Turbopack Dev (Stable)

Turbopack is now the stable default dev bundler in Next.js 15:

```bash
next dev --turbo
```

**Performance gains:**
- Up to 76.7% faster local server startup
- Up to 96.3% faster code updates with Fast Refresh
- Up to 45.8% faster initial route compilation

**Interview angle:** "In our project, switching to Turbopack reduced dev server startup from ~8 seconds to under 2 seconds, significantly improving developer productivity across the team."

---

### 1.4 Partial Prerendering (PPR) — Experimental

PPR combines static and dynamic rendering in a single route. This is the future of Next.js rendering:

```tsx
// app/product/[id]/page.tsx
import { Suspense } from 'react';

export const experimental_ppr = true; // Enable per-route

export default async function ProductPage({ params }) {
  const { id } = await params;

  return (
    <div>
      {/* Static shell — prerendered at build time */}
      <Header />
      <ProductDetails id={id} />

      {/* Dynamic — streamed at request time */}
      <Suspense fallback={<PriceSkeleton />}>
        <LivePrice id={id} />
      </Suspense>

      <Suspense fallback={<ReviewsSkeleton />}>
        <UserReviews id={id} />
      </Suspense>
    </div>
  );
}
```

**How it works:**
1. At build time, Next.js prerenders a static HTML shell with Suspense fallbacks
2. At request time, the shell is served instantly from CDN
3. Dynamic portions are streamed in parallel as they become ready

**Why PPR matters for CMS sites:** Marketing pages can have static CMS content (hero, features) with dynamic personalized sections (recommendations, pricing) — all in one route, with instant initial load.

---

### 1.5 Enhanced `<Form>` Component (`next/form`)

New component that enhances HTML forms with client-side navigation:

```tsx
import Form from 'next/form';

function SearchBar() {
  return (
    <Form action="/search">
      <input name="q" placeholder="Search..." />
      <button type="submit">Search</button>
    </Form>
  );
}
// On submit: navigates to /search?q=... using client-side navigation
// Prefetches the /search route layout and loading state
// No full page reload!
```

---

### 1.6 `unstable_after` API

Execute code after the response finishes streaming — perfect for analytics, logging:

```tsx
import { unstable_after as after } from 'next/server';

export default async function Page() {
  const data = await fetchCMSContent();

  after(() => {
    // Runs AFTER the response is sent to the user
    analytics.track('page_view', { page: 'home' });
    logger.info('Home page rendered');
  });

  return <HomePage data={data} />;
}
```

---

### 1.7 Server Actions Security Improvements

```tsx
// app/actions.ts
'use server';

// ✅ USED in the app — gets a secure, non-deterministic ID
export async function updateUser(formData: FormData) {
  // action logic
}


**Key improvements:**
- Unused Server Actions are eliminated from the client bundle
- Action IDs are now unguessable and non-deterministic
- IDs are recalculated between builds for enhanced security

---

### 1.8 Other Notable Next.js 15 Changes

**`instrumentation.js` — Now Stable:**
```tsx
// instrumentation.ts
export async function register() {
  // Initialize monitoring, OpenTelemetry, etc.
}

export async function onRequestError(err, request, context) {
  // Report errors to Sentry, Datadog, etc.
  await fetch('https://monitoring.example.com/errors', {
    method: 'POST',
    body: JSON.stringify({ message: err.message, request, context }),
  });
}
```

**TypeScript `next.config.ts` support:**
```tsx
// next.config.ts — TypeScript config is now natively supported!
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.contentstack.io' },
    ],
  },
};

export default nextConfig;
```

**Self-hosting improvements:** More control over `Cache-Control` headers when self-hosting (not on Vercel).

**ESLint 9 support:** Backward-compatible with ESLint 8.

**Static Route Indicator:** Visual indicator during development showing which routes are static vs dynamic.

**Stable config renames:**
- `experimental.bundlePagesExternals` → `bundlePagesRouterDependencies`
- `experimental.serverComponentsExternalPackages` → `serverExternalPackages`

---

## 2. Rendering Strategies in Next.js 15 (Interview Deep Dive)

### 2.1 Complete Rendering Strategy Comparison

| Strategy | When HTML is Generated | Data Freshness | Use Case | Next.js 15 API |
|----------|----------------------|----------------|----------|---------------|
| **SSG** | Build time | Stale until rebuild | Blog posts, docs | `generateStaticParams()` |
| **ISR** | Build time + background | Configurable staleness | Product pages, CMS content | `fetch({ next: { revalidate: 60 } })` |
| **SSR** | Every request | Always fresh | Dashboards, auth pages | `fetch({ cache: 'no-store' })` or using `cookies()`/`headers()` |
| **PPR** | Shell at build, dynamic at request | Mixed | Pages with static + dynamic parts | `experimental_ppr = true` + `<Suspense>` |
| **CSR** | Client-side | Depends on fetching | Interactive widgets, real-time data | `'use client'` + SWR/React Query |

### 2.2 App Router Data Fetching in Next.js 15

```tsx
// STATIC — Cached at build time
async function StaticContent() {
  const data = await fetch('https://cms.example.com/api/posts', {
    cache: 'force-cache', // Explicitly opt into caching (NOT default in v15!)
  });
  return <PostList posts={await data.json()} />;
}

// ISR — Revalidate every 60 seconds
async function ISRContent() {
  const data = await fetch('https://cms.example.com/api/posts', {
    next: { revalidate: 60 },
  });
  return <PostList posts={await data.json()} />;
}

// DYNAMIC — Fresh on every request
async function DynamicContent() {
  const data = await fetch('https://cms.example.com/api/posts');
  // No cache option = uncached by default in v15
  return <PostList posts={await data.json()} />;
}

// ON-DEMAND REVALIDATION via tags
async function TaggedContent() {
  const data = await fetch('https://cms.example.com/api/posts', {
    next: { tags: ['blog-posts'] },
  });
  return <PostList posts={await data.json()} />;
}

// API Route to trigger revalidation (called by CMS webhook)
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  const { tag, secret } = await request.json();
  if (secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  revalidateTag(tag);
  return Response.json({ revalidated: true });
}
```

### 2.3 Server Components vs Client Components

```tsx
// Server Component (default in App Router) — runs ONLY on the server
// ✅ Can: fetch data, access backend resources, keep secrets safe
// ❌ Cannot: use hooks (useState, useEffect), handle events, use browser APIs

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = await cms.getEntry('blog_post', slug); // Direct CMS call
  return (
    <article>
      <h1>{post.title}</h1>
      <RichTextRenderer content={post.body} />
      {/* Client component for interactivity */}
      <LikeButton postId={post.uid} initialCount={post.likes} />
    </article>
  );
}

// Client Component — runs on client AND server (for hydration)
'use client';
import { useState, useOptimistic } from 'react';

function LikeButton({ postId, initialCount }) {
  const [count, setCount] = useState(initialCount);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      ❤️ {count}
    </button>
  );
}
```

---

## 3. Headless CMS Architecture

### 3.1 What is Headless CMS?

A CMS that provides content via APIs (REST/GraphQL) with no built-in frontend. The "head" (presentation layer) is decoupled, allowing any frontend framework to consume the content.

**Traditional vs Headless:**

| Aspect | Traditional (WordPress) | Headless (Contentstack) |
|--------|------------------------|------------------------|
| Frontend | Tightly coupled (PHP templates) | Decoupled (any framework) |
| Content Delivery | Server-rendered HTML | API (REST/GraphQL) |
| Flexibility | Limited to CMS themes | Full control over UI |
| Omnichannel | Difficult | Native (web, mobile, IoT) |
| Scalability | Vertical (server) | Horizontal (CDN + API) |

### 3.2 Contentstack Integration with Next.js 15

```tsx
// lib/contentstack.ts
import Contentstack from 'contentstack';

const Stack = Contentstack.Stack({
  api_key: process.env.CS_API_KEY!,
  delivery_token: process.env.CS_DELIVERY_TOKEN!,
  environment: process.env.CS_ENVIRONMENT!,
});

export async function getBlogPosts() {
  const result = await Stack.ContentType('blog_post')
    .Query()
    .language('en-us')
    .includeReference(['author', 'category'])
    .toJSON()
    .find();
  return result[0]; // array of entries
}

export async function getEntry(contentType: string, slug: string) {
  const result = await Stack.ContentType(contentType)
    .Query()
    .where('url', `/${slug}`)
    .includeReference(['author', 'category'])
    .toJSON()
    .findOne();
  return result;
}
```

**Using with Next.js 15 App Router:**
```tsx
// app/blog/[slug]/page.tsx
import { getEntry } from '@/lib/contentstack';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map(post => ({ slug: post.url.replace('/', '') }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params; // ← Next.js 15: must await params
  const post = await getEntry('blog_post', slug);
  if (!post) return {};
  return {
    title: post.seo?.title || post.title,
    description: post.seo?.description,
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params; // ← Next.js 15: must await params
  const post = await getEntry('blog_post', slug);
  if (!post) notFound();
  return <Article post={post} />;
}
```

### 3.3 Content Modeling Best Practices

- Design content types around content purpose, not page layout
- Use references over embedding for reusable content (authors, categories)
- Use modular blocks for flexible page builders
- Plan for localization from the start
- Keep content types granular — a "Page" type with modular blocks beats "Homepage", "About Page" types
- Version content independently from code

### 3.4 CMS-Driven Component Mapping

```tsx
const componentMap: Record<string, React.ComponentType<any>> = {
  hero_banner: HeroBanner,
  feature_grid: FeatureGrid,
  testimonial_slider: TestimonialSlider,
  cta_section: CTASection,
  rich_text_block: RichTextBlock,
};

function DynamicPage({ blocks }) {
  return (
    <>
      {blocks.map((block, index) => {
        const Component = componentMap[block._content_type_uid];
        if (!Component) return null;
        return <Component key={index} {...block} />;
      })}
    </>
  );
}
```

### 3.5 Preview & Draft Mode in Next.js 15

```tsx
// app/api/preview/route.ts
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');

  if (secret !== process.env.PREVIEW_SECRET) {
    return new Response('Invalid token', { status: 401 });
  }

  const draft = await draftMode(); // ← Next.js 15: must await
  draft.enable();
  redirect(`/blog/${slug}`);
}

// In the page component
import { draftMode } from 'next/headers';

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const { isEnabled: isPreview } = await draftMode(); // ← await in v15

  const post = await getEntry('blog_post', slug, {
    preview: isPreview, // Fetch draft content when preview is on
  });

  return (
    <>
      {isPreview && <PreviewBanner />}
      <Article post={post} />
    </>
  );
}
```

---

## 4. Component Architecture

### 4.1 Atomic Design for CMS-Driven Sites

- **Atoms:** Button, Input, Label, Icon
- **Molecules:** SearchBar, Card, NavItem
- **Organisms:** Header, Footer, HeroSection, BlogGrid
- **Templates:** Page layouts combining organisms
- **Pages:** Templates with CMS data

### 4.2 TypeScript Patterns

```tsx
// Derive types from CMS content types
interface BlogPost {
  uid: string;
  title: string;
  url: string;
  body: RichTextContent;
  author: Reference<Author>;
  category: Reference<Category>[];
  featured_image: Asset;
  publish_date: string;
  locale: string;
}

interface Asset {
  uid: string;
  url: string;
  title: string;
  dimension: { width: number; height: number };
}

type Reference<T> = T & { _content_type_uid: string };

// Generic, type-safe data fetcher
async function fetchEntry<T>(contentType: string, slug: string): Promise<T | null> {
  try {
    const result = await Stack.ContentType(contentType)
      .Query().where('url', `/${slug}`).toJSON().findOne();
    return result as T;
  } catch {
    return null;
  }
}
```

---

## 5. Performance & Core Web Vitals

### 5.1 Metrics to Know

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP (Largest Contentful Paint) | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| INP (Interaction to Next Paint) | ≤ 200ms | ≤ 500ms | > 500ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | > 0.25 |

### 5.2 Next.js 15 Specific Optimizations

**Use ISR + On-Demand Revalidation for CMS content:**
```tsx
// Webhook from CMS triggers tag-based revalidation
// This is faster than time-based revalidation and ensures freshness
const data = await fetch(cmsUrl, { next: { tags: ['homepage'] } });

// On CMS publish → POST /api/revalidate → revalidateTag('homepage')
```

**Image optimization with CMS:**
```tsx
import Image from 'next/image';

// next.config.ts — allow CMS image domains
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.contentstack.io' },
    ],
  },
};

// Component
<Image
  src={post.featured_image.url}
  alt={post.featured_image.title}
  width={800}
  height={400}
  priority // For above-the-fold images (disables lazy loading)
  sizes="(max-width: 768px) 100vw, 800px"
/>
```

**Code Splitting with `next/dynamic`:**
```tsx
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('../components/Chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Only load on client
});
```

**Turbopack for faster dev builds** (stable in v15):
```bash
next dev --turbo
```

---

## 6. SEO in Next.js 15

```tsx
// App Router Metadata API
import type { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params; // ← await in v15
  const post = await getEntry('blog_post', slug);
  return {
    title: post.seo_title || post.title,
    description: post.meta_description,
    openGraph: {
      title: post.title,
      images: [{ url: post.featured_image.url }],
      type: 'article',
    },
    alternates: {
      canonical: `https://example.com/blog/${slug}`,
    },
  };
}
```

**SEO Checklist:** Dynamic `sitemap.xml` from CMS, structured data (JSON-LD), proper heading hierarchy, canonical URLs, `hreflang` for localized content, robots.txt blocking preview/draft pages.

---

## 7. Accessibility (WCAG)

**Key requirements:** Alt text, 4.5:1 color contrast, full keyboard navigation, skip nav links, ARIA roles where semantic HTML falls short, focus management in modals/drawers.

**Testing:** axe DevTools, Lighthouse, NVDA/VoiceOver, `jest-axe`.

---

## 8. CI/CD & Deployment

**Vercel (Primary for Next.js):** Git-based deploys, PR preview environments, native ISR support, Edge Functions for middleware.

**CMS Webhook → Revalidation Pipeline:**
```
CMS Publish Event → Webhook → /api/revalidate → revalidateTag('blog') → Updated page
```

**GitHub Actions example:**
```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run build
```

---

## 9. Likely Interview Questions (Next.js 15 Updated)

### Q: What are the major breaking changes in Next.js 15?

**A:** Two main breaking changes. First, all request-time APIs are now async — `cookies()`, `headers()`, `draftMode()`, `params`, and `searchParams` all return Promises. This enables Next.js to prerender parts of a page that don't depend on request data, which is foundational for Partial Prerendering. Second, caching defaults flipped — `fetch()` and GET Route Handlers are no longer cached by default. You must explicitly opt in with `cache: 'force-cache'` or `next: { revalidate: N }`. This aligns with developer expectations — most people were surprised by the old implicit caching.

### Q: How would you migrate a Next.js 14 app to 15?

**A:** I'd start by running the codemod: `npx @next/codemod@canary next-async-request-api .` — this automatically converts synchronous API usage to async. Then I'd audit any `fetch()` calls that relied on implicit caching and add explicit `cache: 'force-cache'` or `revalidate` where needed. I'd check for the `@next-codemod-error` comments left by the codemod for cases needing manual intervention. Finally, I'd update `useFormState` to `useActionState` for React 19 compatibility, and test thoroughly since the caching behavior change can cause unexpected fresh fetches.

### Q: How does Partial Prerendering work and when would you use it?

**A:** PPR lets you combine static and dynamic content in one route. At build time, Next.js creates a static HTML shell. Dynamic sections wrapped in `<Suspense>` are left as holes with fallback UI. At request time, the shell is served instantly from CDN while dynamic parts stream in parallel. For a CMS site, I'd use this for product pages — the CMS-driven description and images are static, while pricing, inventory, and personalized recommendations are dynamic. You get CDN speed for the shell with fresh data streamed in.

### Q: How do you handle caching with a headless CMS in Next.js 15?

**A:** Since v15 doesn't cache by default, I'd set up a layered strategy. For CMS content, I use `fetch` with `next: { tags: ['content-type-name'] }` for tag-based revalidation. The CMS webhook calls our `/api/revalidate` route on publish events, which triggers `revalidateTag()`. This gives us CDN-cached pages that update within seconds of content changes. For truly dynamic sections like personalization, I let them stay uncached. For global content (header, footer), I use `cache: 'force-cache'` since those change rarely.

### Q: Explain the difference between Server Components and Client Components in Next.js 15.

**A:** Server Components are the default — they run only on the server, can directly access databases and CMS APIs, and ship zero JavaScript to the client. Client Components (marked with `'use client'`) are needed for interactivity: hooks like `useState`, event handlers, browser APIs. The key mental model: start everything as Server Components, and only add `'use client'` at the boundary where interactivity begins. In Next.js 15 specifically, Server Components can use `await params` and `await cookies()` directly, while Client Components must use `React.use()` for these.

---

## 10. Study Priority Checklist

**Must-know (will definitely be asked):**
- [ ] Next.js 15 breaking changes (async APIs + caching defaults)
- [ ] SSR vs SSG vs ISR vs PPR — when to use each with CMS
- [ ] Headless CMS integration patterns (Contentstack/Contentful)
- [ ] Server Components vs Client Components
- [ ] Core Web Vitals optimization
- [ ] TypeScript in React (generics, utility types)

**Should-know (very likely):**
- [ ] React 19 hooks (`useActionState`, `useOptimistic`, `useFormStatus`)
- [ ] Content modeling and modular blocks
- [ ] On-demand revalidation with CMS webhooks
- [ ] Preview/Draft mode implementation in v15
- [ ] Image optimization with CMS images

**Differentiators (will set you apart):**
- [ ] Partial Prerendering architecture
- [ ] `unstable_after` API for post-response tasks
- [ ] Turbopack development workflow
- [ ] Server Actions security model
- [ ] `instrumentation.ts` for observability
- [ ] React Compiler (experimental)

---

## 11. Quick Reference

| Category | Tools |
|----------|-------|
| Styling | Tailwind CSS, CSS Modules, styled-components |
| State | React Context, Zustand, Jotai |
| Data Fetching | SWR, TanStack Query (client-side) |
| Testing | Jest, React Testing Library, Playwright |
| CMS SDKs | contentstack, contentful, @strapi/sdk |
| Monitoring | Sentry, Vercel Analytics, OpenTelemetry |
| CI/CD | GitHub Actions, Vercel, Netlify |

---

*Focus on explaining the "why" behind your decisions. For 5.5+ years experience, interviewers want architectural reasoning and trade-off analysis, not just syntax knowledge. Good luck!*
