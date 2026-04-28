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

---

## SECTION A: Architecture & System Design (Most Important for Senior Roles)

---

### Q1: How would you architect a multi-brand, multi-locale website using Next.js and a headless CMS?

**A:** I'd use a single Next.js codebase with dynamic routing based on brand and locale. In the CMS, each brand gets its own environment or stack, with shared global fields for common content. Locales are handled at the entry level with fallback chains. The App Router's route groups can separate brand logic, while a shared component library with brand-specific theming (CSS variables or Tailwind config per brand) keeps the UI consistent. For routing, I'd use middleware to detect locale from headers or cookies and rewrite to the correct path. Builds are triggered per-brand via webhooks, and ISR keeps content fresh without full rebuilds.

```
// Folder structure:
app/
  (brand-a)/
    [locale]/
      page.tsx
      blog/[slug]/page.tsx
  (brand-b)/
    [locale]/
      page.tsx

// middleware.ts — detect locale + brand
export function middleware(request) {
  const brand = request.headers.get('x-brand') || detectBrandFromHost(request);
  const locale = request.cookies.get('locale')?.value
    || request.headers.get('accept-language')?.split(',')[0]
    || 'en';
  return NextResponse.rewrite(
    new URL(`/${brand}/${locale}${request.nextUrl.pathname}`, request.url)
  );
}
```

---

### Q2: How do you handle content previews for editors?

**A:** I set up Next.js Draft Mode (or Preview Mode in Pages Router). The CMS sends a preview request to an API route with a secret token, which enables draft mode via a cookie. In data-fetching functions, I check the preview flag and switch to the CMS preview/management API to fetch draft content. For live preview, I integrate Contentstack's Live Preview SDK, which uses postMessage to update content in real-time as editors type. Preview environments on Vercel (per-PR deployments) give editors a dedicated URL.

```tsx
// app/api/preview/route.ts
import { draftMode } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('secret') !== process.env.PREVIEW_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }
  const draft = await draftMode(); // ← Next.js 15: must await
  draft.enable();
  redirect(`/blog/${searchParams.get('slug')}`);
}
```

---

### Q3: You're building an e-commerce product listing page. Some data is static (product name, description from CMS) and some is dynamic (price, stock, personalized recommendations). How would you architect this in Next.js 15?

**A:** This is a perfect use case for Partial Prerendering (PPR). I'd enable `experimental_ppr = true` on the route. The static CMS content (product title, description, images) renders into the prebuilt HTML shell. Dynamic sections (live pricing, stock status, user recommendations) are wrapped in `<Suspense>` boundaries with skeleton fallbacks. At request time, the shell is served instantly from CDN while dynamic parts stream in parallel. For the CMS data, I'd use `fetch` with `next: { tags: ['product'] }` for tag-based revalidation via webhook. The dynamic pricing comes from a separate microservice with `cache: 'no-store'`.

```tsx
import { Suspense } from 'react';

export const experimental_ppr = true;

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await fetchFromCMS(slug); // cached, revalidated via tags

  return (
    <div>
      {/* Static shell — served from CDN instantly */}
      <ProductHeader title={product.title} image={product.hero_image} />
      <ProductDescription content={product.body} />

      {/* Dynamic — streamed at request time */}
      <Suspense fallback={<PriceSkeleton />}>
        <LivePrice productId={product.uid} />
      </Suspense>

      <Suspense fallback={<RecommendationsSkeleton />}>
        <PersonalizedRecommendations category={product.category} />
      </Suspense>
    </div>
  );
}
```

---

### Q4: How do you decide between Server Components and Client Components? Walk me through your decision process.

**A:** My default is Server Components — they ship zero JS to the client, can directly call APIs, and are better for SEO. I only add `'use client'` when I need one of three things: (1) React hooks like `useState` or `useEffect`, (2) event handlers like `onClick` or `onChange`, or (3) browser-only APIs like `window` or `localStorage`.

The key principle is to push the `'use client'` boundary as deep as possible. For example, I wouldn't make an entire `ProductPage` a client component just because it has a "Add to Cart" button. Instead, only the `AddToCartButton` component becomes a client component, while the rest stays as a Server Component.

```tsx
// ✅ Good — minimal client boundary
// app/product/page.tsx (Server Component)
export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await cms.getEntry('product', slug);

  return (
    <div>
      <h1>{product.title}</h1>         {/* Server - no JS */}
      <p>{product.description}</p>      {/* Server - no JS */}
      <Image src={product.image} ... /> {/* Server - no JS */}
      <AddToCartButton id={product.uid} price={product.price} />
      {/* ↑ Only this ships JS to client */}
    </div>
  );
}

// components/AddToCartButton.tsx (Client Component)
'use client';
import { useState } from 'react';

export function AddToCartButton({ id, price }) {
  const [added, setAdded] = useState(false);
  return (
    <button onClick={() => { addToCart(id); setAdded(true); }}>
      {added ? 'Added ✓' : `Add to Cart — ₹${price}`}
    </button>
  );
}
```

---

### Q5: How would you implement a page builder system where content editors can compose pages from reusable blocks in the CMS?

**A:** I'd use Contentstack's Modular Blocks feature. In the CMS, I create a "Page" content type with a modular block field that allows editors to pick from blocks like Hero, Feature Grid, CTA, Testimonials, FAQ, etc. On the frontend, I maintain a component registry that maps each block's `_content_type_uid` to a React component. When the page renders, I iterate through the blocks array and dynamically render the corresponding components.

```tsx
// lib/block-registry.ts
import dynamic from 'next/dynamic';

const blockRegistry: Record<string, React.ComponentType<any>> = {
  hero_banner: dynamic(() => import('@/components/blocks/HeroBanner')),
  feature_grid: dynamic(() => import('@/components/blocks/FeatureGrid')),
  cta_section: dynamic(() => import('@/components/blocks/CTASection')),
  testimonial_carousel: dynamic(() => import('@/components/blocks/Testimonials')),
  faq_accordion: dynamic(() => import('@/components/blocks/FAQ')),
  rich_text_block: dynamic(() => import('@/components/blocks/RichText')),
};

// app/[...slug]/page.tsx
export default async function DynamicPage({ params }) {
  const { slug } = await params;
  const page = await cms.getEntry('page', slug.join('/'));

  return (
    <main>
      {page.modular_blocks.map((block, index) => {
        const Component = blockRegistry[block._content_type_uid];
        if (!Component) {
          console.warn(`Unknown block type: ${block._content_type_uid}`);
          return null;
        }
        return <Component key={`${block._content_type_uid}-${index}`} {...block} />;
      })}
    </main>
  );
}
```

This pattern is highly scalable — new block types only require creating the CMS content type and adding a new component. No routing changes needed.

---

### Q6: How do you handle error boundaries and error states in Next.js 15 App Router?

**A:** Next.js App Router has file-based error handling. I create `error.tsx` files at different route levels for granular error catching. The key points: `error.tsx` must be a Client Component (`'use client'`), it receives `error` and `reset` props, and it catches errors from its child route segments. For global errors (including the root layout), I use `global-error.tsx`. For "not found" cases, I use `not-found.tsx` with the `notFound()` function.

```tsx
// app/blog/error.tsx — catches errors in all /blog/* routes
'use client';

export default function BlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error monitoring service (Sentry, etc.)
    captureException(error);
  }, [error]);

  return (
    <div role="alert">
      <h2>Something went wrong loading this article</h2>
      <p>Our team has been notified. Please try again.</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}

// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = await cms.getEntry('blog_post', slug);
  if (!post) notFound(); // → triggers not-found.tsx
  return <Article post={post} />;
}
```

---

## SECTION B: Headless CMS Deep Dive

---

### Q7: Explain Contentstack's content model hierarchy and how you would design models for a corporate website.

**A:** Contentstack organizes content into Stacks → Content Types → Entries. A Stack is a workspace (think project). Content Types are schemas (like database tables). Entries are instances. Additionally, Global Fields are reusable field groups shared across types, and Modular Blocks allow flexible composition.

For a corporate website, I'd design:

- **Global Fields:** SEO fields (title, meta description, OG image), CTA fields (text, URL, style)
- **Content Types:**
  - `Page` — with modular blocks for flexible composition
  - `Blog Post` — title, slug, author (reference), categories (reference), body (rich text), featured image
  - `Author` — name, bio, photo, social links
  - `Category` — name, slug, description
  - `Navigation` — singleton type with nested menu items
  - `Site Settings` — singleton with logo, footer content, social links

Key decisions: I keep content types granular and content-focused (not page-layout-focused). Authors and Categories are separate types referenced by Blog Posts, enabling reuse and independent updates. The Page type uses modular blocks so editors can compose landing pages without developer involvement.

---

### Q8: How do you handle content localization with Contentstack and Next.js?

**A:** Contentstack supports entry-level localization with a fallback chain. I set up locales in the CMS (e.g., en-us → hi-in → de-de), configure fields as localizable or non-localizable, and build the frontend to handle locale routing.

```tsx
// lib/contentstack.ts
export async function getLocalizedEntry(
  contentType: string,
  slug: string,
  locale: string
) {
  return Stack.ContentType(contentType)
    .Query()
    .where('url', `/${slug}`)
    .language(locale)       // Fetch localized version
    .includeFallback()      // Fall back to parent locale if field isn't translated
    .includeReference(['author'])
    .toJSON()
    .findOne();
}

// app/[locale]/blog/[slug]/page.tsx
export default async function BlogPost({ params }) {
  const { locale, slug } = await params;
  const post = await getLocalizedEntry('blog_post', slug, locale);
  return <Article post={post} />;
}

// middleware.ts — locale detection
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

const locales = ['en-us', 'hi-in', 'de-de'];
const defaultLocale = 'en-us';

export function middleware(request) {
  const negotiator = new Negotiator({
    headers: { 'accept-language': request.headers.get('accept-language') || '' }
  });
  const preferred = negotiator.languages();
  const locale = match(preferred, locales, defaultLocale);

  if (!locales.some(l => request.nextUrl.pathname.startsWith(`/${l}`))) {
    return NextResponse.redirect(
      new URL(`/${locale}${request.nextUrl.pathname}`, request.url)
    );
  }
}
```

**Important Contentstack caveat:** Localizing an entry in Contentstack creates an independent copy with its own versioning and publishing queue. So updating the master entry doesn't automatically update localized entries — I handle this by setting up webhook notifications when master content changes so the localization team knows what needs updating.

---

### Q9: Compare Contentstack's Content Delivery API (CDA) vs Content Management API (CMA). When do you use each?

**A:**

| | Content Delivery API (CDA) | Content Management API (CMA) |
|---|---|---|
| **Access** | Read-only | Full CRUD |
| **Caching** | CDN-cached, fast | Not cached |
| **Token** | Delivery Token | Management Token |
| **Use case** | Frontend apps, production | Admin tools, content migration, preview |
| **Rate limits** | Higher (designed for scale) | Lower (designed for admin ops) |

I use CDA for all production frontend data fetching — it's fast, CDN-cached, and read-only (more secure). I use CMA only for: (1) preview/draft mode (fetching unpublished content), (2) content migration scripts, (3) admin dashboards that create/update content programmatically, and (4) webhook processing where I need to validate content.

---

### Q10: How would you migrate content from WordPress to Contentstack?

**A:** I'd approach it in phases:

1. **Content Audit:** Export WordPress content via WP REST API or WP-CLI. Analyze content types, taxonomies, custom fields, and media.
2. **Model Design:** Design Contentstack content types that map to WordPress entities — but don't replicate WordPress's structure blindly. Improve the model (e.g., replace WordPress categories/tags with a proper taxonomy structure).
3. **Migration Script:** Write a Node.js script using Contentstack's CMA to:
   - Upload media assets to Contentstack
   - Create entries with proper references and localization
   - Handle rate limiting (Contentstack has API rate limits)
   - Map old WordPress slugs to new URLs for 301 redirects
4. **Redirect Map:** Create a comprehensive 301 redirect map from old WordPress URLs to new URLs. Implement in Next.js middleware or Vercel config.
5. **Validation:** Compare content counts, verify media integrity, test all localized entries.
6. **SEO Monitoring:** Track rankings post-migration, verify canonical URLs, submit updated sitemap.

---

### Q11: How would you implement content versioning and scheduled publishing with Contentstack?

**A:** Contentstack has built-in versioning — every save creates a version, and you can compare or revert. For scheduled publishing, I use Contentstack's Publishing Queue with future publish dates. On the frontend side:

- **Version previews:** I build a version selector in the preview environment that uses CMA to fetch specific versions: `Stack.ContentType('blog_post').Entry('entry_uid').version(3).fetch()`
- **Scheduled content:** I rely on ISR with short revalidation periods (60-120 seconds) so scheduled content appears shortly after the CMS publishes it. For instant updates, I use on-demand revalidation via webhook that fires when content is published.
- **Rollback:** If bad content goes live, editors can revert in the CMS, which triggers a webhook → `revalidateTag()` → updated page within seconds.

---

## SECTION C: Performance Optimization (Practical Questions)

---

### Q12: A page with CMS content has poor LCP. How do you diagnose and fix it?

**A:** First, I'd use Lighthouse and Chrome DevTools Performance tab to identify the LCP element. Common CMS-related causes: unoptimized hero images served from CMS (fix: use `next/image` with Contentstack's image delivery API for format/size optimization, add `priority`), SSR delay from slow CMS API calls (fix: switch to ISR or add caching layer), render-blocking CSS from CMS rich text styles (fix: inline critical CSS, defer the rest), or large JavaScript bundles from CMS SDK (fix: lazy-load SDK, use REST API directly for simple fetches). I'd also check if the CMS CDN is geographically close to users.

---

### Q13: Walk me through how you would optimize a Next.js application for Core Web Vitals.

**A:**

**LCP (target ≤ 2.5s):**
- Mark hero images with `priority` prop on `next/image`
- Preload critical fonts with `<link rel="preload">`
- Use ISR/SSG over SSR where possible to reduce TTFB
- Optimize CMS image delivery — use Contentstack's built-in image transformations (format, quality, resize via URL params)
- Avoid client-side data fetching for above-the-fold content

**CLS (target ≤ 0.1):**
- Always set explicit `width` and `height` on `<Image />` or use `aspect-ratio` CSS
- Reserve space for dynamic content (ads, embeds, CMS modular blocks)
- Never inject content above existing content after load
- Use CSS `contain: layout` for components with dynamic sizes

**INP (target ≤ 200ms):**
- Move heavy computation off the main thread (Web Workers)
- Use `React.lazy()` and `next/dynamic` for code splitting
- Use `useTransition` for non-urgent state updates
- Keep event handlers lean — debounce expensive operations

**Measurement:**
- Vercel Analytics for real-user metrics
- Lighthouse CI in the GitHub Actions pipeline
- Custom Web Vitals reporting via `next/web-vitals`

---

### Q14: Your CMS-powered website has 10,000+ pages. Build times are taking 30+ minutes. How do you fix this?

**A:** Several strategies:

1. **Don't pre-build everything.** Use `fallback: 'blocking'` (Pages Router) or empty `generateStaticParams` with on-demand generation. Only pre-build the top 100-200 highest-traffic pages.

2. **Use ISR instead of full SSG.** Pages generate on first visit and revalidate in the background. No need to build all 10K at once.

3. **On-demand revalidation via webhooks.** Instead of time-based ISR (`revalidate: 60`), use webhook-triggered `revalidateTag()` so pages only rebuild when content actually changes.

4. **Parallelize where possible.** Optimize `generateStaticParams` to fetch page lists efficiently (batch API calls, pagination).

5. **Use Turbopack for development** and monitor Turbopack for production builds (beta in v15.5).

```tsx
// Only pre-build top pages, generate rest on-demand
export async function generateStaticParams() {
  // Only return top 200 pages by traffic
  const topPages = await cms.getEntries('page', {
    limit: 200,
    order: '-analytics.pageviews',
  });
  return topPages.map(p => ({ slug: p.url.split('/').filter(Boolean) }));
}
// All other pages generate on first visit and are cached
```

---

### Q15: How do you handle images from a headless CMS efficiently?

**A:** I build a wrapper around `next/image` that automatically applies CMS image transformations:

```tsx
// components/CMSImage.tsx
import Image from 'next/image';

interface CMSImageProps {
  asset: {
    url: string;
    title: string;
    dimension?: { width: number; height: number };
  };
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

export function CMSImage({ asset, width, height, priority, className }: CMSImageProps) {
  // Contentstack image transformation via URL params
  const optimizedUrl = `${asset.url}?auto=webp&quality=80${
    width ? `&width=${width}` : ''
  }`;

  return (
    <Image
      src={optimizedUrl}
      alt={asset.title}
      width={width || asset.dimension?.width || 800}
      height={height || asset.dimension?.height || 600}
      priority={priority}
      className={className}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
    />
  );
}

// next.config.ts — allow CMS image domain
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.contentstack.io' },
    ],
  },
};
```

Key optimizations: Contentstack's image delivery API supports format conversion (WebP/AVIF), quality adjustment, and resizing via URL parameters. Combined with `next/image`'s lazy loading and responsive `sizes`, this delivers optimal images across all viewports.

---

## SECTION D: Next.js 15 Specific Questions

---

### Q16: What are the major breaking changes in Next.js 15? Why were they made?

**A:** Two critical breaking changes:

1. **Async Request APIs:** `cookies()`, `headers()`, `draftMode()`, `params`, and `searchParams` now return Promises. **Why:** This enables Partial Prerendering. By making these APIs async, Next.js can prerender the static parts of a page at build time and only wait for request-specific data at runtime. If these were synchronous, the entire component tree would have to wait for the request.

2. **Caching defaults flipped:** `fetch()` and GET Route Handlers are no longer cached by default. **Why:** The previous "cached by default" confused many developers — data would appear stale and people didn't understand why. The new default (uncached) is more predictable. You explicitly opt into caching, which means you understand and manage your caching strategy.

---

### Q17: How would you migrate a Next.js 14 application to Next.js 15?

**A:** Step-by-step:

1. **Run the codemod:** `npx @next/codemod@canary next-async-request-api .` — automatically converts synchronous API calls to async.
2. **Fix codemod errors:** Search for `@next-codemod-error` comments where the codemod couldn't auto-migrate (usually custom utility functions).
3. **Audit fetch caching:** Since fetch is now uncached by default, find all `fetch()` calls that relied on implicit caching. Add `cache: 'force-cache'` or `next: { revalidate: N }` where you want caching.
4. **Update React hooks:** Replace `useFormState` with `useActionState` (React 19).
5. **Test Client Router Cache:** Navigation between pages may feel slower since pages aren't cached on client by default. Add `staleTimes` config if needed.
6. **Update config names:** `experimental.bundlePagesExternals` → `bundlePagesRouterDependencies`, `experimental.serverComponentsExternalPackages` → `serverExternalPackages`.
7. **Thorough testing:** The caching change is the sneaky one — pages that were fast before might now make fresh API calls on every visit.

---

### Q18: Explain how `unstable_after` works and give a real-world use case.

**A:** `unstable_after` lets you schedule work that runs after the response has been sent to the user. The user doesn't wait for this work to complete, so it doesn't affect page load time.

Real-world use cases:
- **Analytics logging:** Track page views without adding latency
- **Audit trails:** Log who accessed what content
- **Cache warming:** Pre-fetch related content after serving a page
- **CMS sync:** Update a search index after content renders

```tsx
import { unstable_after as after } from 'next/server';

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  // Schedule post-response work
  after(async () => {
    await analytics.trackPageView({ page: `/product/${slug}`, product: product.uid });
    await searchIndex.updateViewCount(product.uid);
    // Pre-warm related product cache
    await Promise.all(
      product.related_ids.map(id => fetchProduct(id))
    );
  });

  return <ProductDetail product={product} />;
}
```

---

### Q19: What is the `next/form` component and why was it introduced?

**A:** `next/form` is a new `<Form>` component that enhances native HTML forms with client-side navigation. When a form is submitted, it navigates to the target URL using Next.js client-side routing instead of a full page reload. It also prefetches the target route's shared layout and loading state.

The main use case is search forms. Previously, submitting a search form would cause a full page reload to `/search?q=term`. Now, with `next/form`, it's a smooth SPA-like transition.

```tsx
import Form from 'next/form';

export function SearchBar() {
  return (
    <Form action="/search" className="flex gap-2">
      <input name="q" placeholder="Search articles..." />
      <button type="submit">Search</button>
    </Form>
  );
  // Submitting navigates to /search?q=... via client-side routing
  // No full page reload, instant transition
}
```

---

### Q20: How do React 19 Server Actions work in Next.js 15? Give a practical example.

**A:** Server Actions are async functions that run on the server, defined with `'use server'` directive. In Next.js 15, they have improved security — unused actions are dead-code eliminated, and action IDs are non-deterministic.

```tsx
// app/actions.ts
'use server';
import { revalidateTag } from 'next/cache';

export async function subscribeToNewsletter(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;

  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email', success: false };
  }

  try {
    await db.subscribers.create({ email });
    revalidateTag('subscriber-count');
    return { error: null, success: true };
  } catch (e) {
    return { error: 'Already subscribed or server error', success: false };
  }
}

// components/NewsletterForm.tsx
'use client';
import { useActionState } from 'react'; // React 19
import { subscribeToNewsletter } from '@/app/actions';

export function NewsletterForm() {
  const [state, formAction, isPending] = useActionState(
    subscribeToNewsletter,
    { error: null, success: false }
  );

  if (state.success) return <p>Thanks for subscribing!</p>;

  return (
    <form action={formAction}>
      <input name="email" type="email" placeholder="you@example.com" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Subscribing...' : 'Subscribe'}
      </button>
      {state.error && <p className="text-red-500">{state.error}</p>}
    </form>
  );
}
```

Key difference from v14: `useFormState` is deprecated → use `useActionState`. The third return value `isPending` is new and eliminates the need for `useFormStatus` in many cases.

---

## SECTION E: Practical Coding & Problem Solving

---

### Q21: Write a reusable data fetching utility for Contentstack that works with Next.js 15 caching.

```tsx
// lib/cms.ts
import Contentstack from 'contentstack';

const Stack = Contentstack.Stack({
  api_key: process.env.CS_API_KEY!,
  delivery_token: process.env.CS_DELIVERY_TOKEN!,
  environment: process.env.CS_ENVIRONMENT!,
});

type FetchOptions = {
  preview?: boolean;
  locale?: string;
  revalidate?: number | false;
  tags?: string[];
  includeRefs?: string[];
};

export async function fetchEntries<T>(
  contentType: string,
  options: FetchOptions = {}
): Promise<T[]> {
  const { locale = 'en-us', includeRefs = [], revalidate = 60 } = options;

  // Build cache-aware fetch
  const cacheConfig: RequestInit['next'] = {};
  if (revalidate === false) {
    // No caching
  } else {
    cacheConfig.revalidate = revalidate;
  }
  if (options.tags?.length) {
    cacheConfig.tags = options.tags;
  }

  const query = Stack.ContentType(contentType).Query();
  query.language(locale);
  if (includeRefs.length) query.includeReference(includeRefs);

  const result = await query.toJSON().find();
  return result[0] as T[];
}

export async function fetchEntry<T>(
  contentType: string,
  slug: string,
  options: FetchOptions = {}
): Promise<T | null> {
  try {
    const query = Stack.ContentType(contentType).Query();
    query.where('url', `/${slug}`);
    query.language(options.locale || 'en-us');
    if (options.includeRefs?.length) query.includeReference(options.includeRefs);

    const result = await query.toJSON().findOne();
    return result as T;
  } catch {
    return null;
  }
}
```

---

### Q22: Implement a custom rich text renderer for Contentstack JSON RTE in React.

```tsx
// components/RichTextRenderer.tsx
import Image from 'next/image';
import Link from 'next/link';

type Node = {
  type: string;
  children?: Node[];
  text?: string;
  attrs?: Record<string, any>;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
};

const nodeRenderers: Record<string, (node: Node, children: React.ReactNode) => React.ReactNode> = {
  'doc': (_, children) => <>{children}</>,
  'p': (_, children) => <p className="mb-4 leading-relaxed">{children}</p>,
  'h1': (_, children) => <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>,
  'h2': (_, children) => <h2 className="text-2xl font-bold mt-8 mb-3">{children}</h2>,
  'h3': (_, children) => <h3 className="text-xl font-semibold mt-6 mb-2">{children}</h3>,
  'ul': (_, children) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
  'ol': (_, children) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
  'li': (_, children) => <li className="mb-1">{children}</li>,
  'blockquote': (_, children) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">{children}</blockquote>
  ),
  'code': (node, _) => (
    <pre className="bg-gray-100 rounded p-4 overflow-x-auto mb-4">
      <code>{node.children?.[0]?.text}</code>
    </pre>
  ),
  'img': (node) => (
    <Image
      src={node.attrs?.src || ''}
      alt={node.attrs?.alt || ''}
      width={node.attrs?.width || 800}
      height={node.attrs?.height || 400}
      className="rounded-lg my-4"
    />
  ),
  'a': (node, children) => {
    const href = node.attrs?.href || '#';
    const isExternal = href.startsWith('http');
    return isExternal ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
        {children}
      </a>
    ) : (
      <Link href={href} className="text-blue-600 underline">{children}</Link>
    );
  },
};

function renderMark(text: string, node: Node): React.ReactNode {
  let result: React.ReactNode = text;
  if (node.bold) result = <strong>{result}</strong>;
  if (node.italic) result = <em>{result}</em>;
  if (node.underline) result = <u>{result}</u>;
  if (node.code) result = <code className="bg-gray-100 px-1 rounded">{result}</code>;
  return result;
}

function renderNode(node: Node, index: number): React.ReactNode {
  // Text node
  if (node.text !== undefined) {
    return <span key={index}>{renderMark(node.text, node)}</span>;
  }

  // Element node
  const children = node.children?.map((child, i) => renderNode(child, i));
  const renderer = nodeRenderers[node.type];
  if (!renderer) {
    console.warn(`Unknown node type: ${node.type}`);
    return <>{children}</>;
  }
  return <span key={index}>{renderer(node, children)}</span>;
}

export function RichTextRenderer({ content }: { content: Node }) {
  return <div className="prose max-w-none">{renderNode(content, 0)}</div>;
}
```

---

### Q23: Implement on-demand revalidation triggered by a Contentstack webhook.

```tsx
// app/api/revalidate/route.ts
import { revalidateTag, revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: Request) {
  const headersList = await headers();
  const signature = headersList.get('x-contentstack-signature');
  const body = await request.text();

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.CS_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const contentType = payload.content_type?.uid;
  const entrySlug = payload.entry?.url;

  // Tag-based revalidation
  if (contentType) {
    revalidateTag(contentType); // e.g., 'blog_post'
    console.log(`Revalidated tag: ${contentType}`);
  }

  // Path-based revalidation for specific pages
  if (entrySlug) {
    revalidatePath(entrySlug);
    console.log(`Revalidated path: ${entrySlug}`);
  }

  // Always revalidate homepage and navigation (might reference this content)
  revalidateTag('navigation');
  revalidatePath('/');

  return Response.json({
    revalidated: true,
    contentType,
    slug: entrySlug,
    timestamp: Date.now(),
  });
}
```

---

### Q24: How do you implement a search feature for CMS content in Next.js?

**A:** There are multiple approaches depending on scale:

**Small sites (< 1000 entries):** Use Contentstack's built-in search API with debounced client-side queries.

**Medium sites:** Build a search index at build time using a Server Action that queries the CMS and creates a lightweight JSON index. Use a client-side fuzzy search library like Fuse.js.

**Large sites:** Integrate a dedicated search service like Algolia or MeiliSearch. Sync CMS content via webhooks.

```tsx
// Approach: Server-side search with Contentstack
// app/search/page.tsx
export default async function SearchPage({ searchParams }) {
  const { q } = await searchParams;
  if (!q) return <SearchForm />;

  const results = await Stack.ContentType('blog_post')
    .Query()
    .search(q)
    .toJSON()
    .find();

  return (
    <div>
      <SearchForm defaultValue={q} />
      <p>{results[0].length} results for "{q}"</p>
      {results[0].map(post => (
        <SearchResultCard key={post.uid} post={post} />
      ))}
    </div>
  );
}

// Using next/form for SPA-like search navigation
import Form from 'next/form';

function SearchForm({ defaultValue = '' }) {
  return (
    <Form action="/search">
      <input name="q" defaultValue={defaultValue} placeholder="Search..." />
      <button type="submit">Search</button>
    </Form>
  );
}
```

---

## SECTION F: SEO & Accessibility

---

### Q25: How do you generate a dynamic sitemap from CMS content in Next.js 15?

```tsx
// app/sitemap.ts
import { MetadataRoute } from 'next';
import { fetchEntries } from '@/lib/cms';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await fetchEntries<{ url: string; updated_at: string }>('blog_post', {
    revalidate: 3600,
    tags: ['sitemap'],
  });

  const pages = await fetchEntries<{ url: string; updated_at: string }>('page', {
    revalidate: 3600,
    tags: ['sitemap'],
  });

  const blogUrls = posts.map(post => ({
    url: `https://example.com/blog${post.url}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const pageUrls = pages.map(page => ({
    url: `https://example.com${page.url}`,
    lastModified: new Date(page.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [
    { url: 'https://example.com', lastModified: new Date(), priority: 1.0 },
    ...pageUrls,
    ...blogUrls,
  ];
}
```

---

### Q26: How do you implement structured data (JSON-LD) for SEO on CMS-driven pages?

```tsx
// components/StructuredData.tsx
export function ArticleJsonLd({ post, url }: { post: BlogPost; url: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description,
    image: post.featured_image?.url,
    datePublished: post.publish_date,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: post.author?.name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Your Company',
      logo: { '@type': 'ImageObject', url: 'https://example.com/logo.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Usage in page
export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = await fetchEntry('blog_post', slug);
  return (
    <>
      <ArticleJsonLd post={post} url={`https://example.com/blog/${slug}`} />
      <Article post={post} />
    </>
  );
}
```

---

### Q27: What WCAG accessibility requirements do you follow? Give concrete examples.

**A:** I follow WCAG 2.1 AA as the minimum standard. Concrete implementations:

1. **Semantic HTML:** Use `<main>`, `<nav>`, `<article>`, `<section>` instead of `<div>` soup. Every page has exactly one `<h1>`.

2. **Skip navigation link:**
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-white focus:z-50">
  Skip to main content
</a>
```

3. **Image alt text from CMS:** Require alt text as a mandatory field in Contentstack's asset schema. Decorative images get `alt=""`.

4. **Color contrast:** Maintain 4.5:1 ratio minimum. I use tools like axe DevTools during development.

5. **Keyboard navigation:** All interactive elements reachable via Tab. Custom components (modals, dropdowns) implement proper focus trapping and Escape key handling.

6. **ARIA for dynamic content:**
```tsx
<div role="alert" aria-live="polite">
  {formError && <p>{formError}</p>}
</div>
```

7. **Automated testing:** `jest-axe` in unit tests, Lighthouse accessibility audit in CI.

---

## SECTION G: CI/CD & Agile

---

### Q28: Describe the ideal CI/CD pipeline for a Next.js + headless CMS project.

**A:**

```
Developer pushes code
  → GitHub Actions triggers:
    1. Lint (ESLint 9)
    2. Type check (tsc --noEmit)
    3. Unit tests (Jest + React Testing Library)
    4. Build (next build)
    5. E2E tests (Playwright) against preview deployment
    6. Lighthouse CI (performance budget check)
  → Vercel auto-deploys:
    - PR → Preview deployment (editors can test with draft content)
    - Main branch → Production deployment

CMS content changes:
  → Contentstack webhook fires
  → /api/revalidate → revalidateTag('content-type')
  → Affected pages regenerate within seconds
```

Key practices: Preview deployments for every PR let editors test content changes in context. Lighthouse CI enforces performance budgets (LCP < 2.5s, CLS < 0.1). E2E tests verify critical user flows against real CMS data.

---

### Q29: How do you participate in Agile/Scrum ceremonies as a senior frontend developer?

**A:** As a senior developer, I go beyond just attending ceremonies:

- **Sprint Planning:** I help break down stories into technical tasks, identify CMS content model changes that need to happen first, flag dependencies with the backend or design team, and estimate effort with consideration for testing and accessibility.
- **Daily Standup:** Keep it focused — what I shipped, what's blocked. If a CMS API change is blocking frontend work, I escalate immediately.
- **Sprint Retro:** I often propose process improvements — like adding Lighthouse CI to catch performance regressions, or setting up Storybook for better design-dev collaboration.
- **Code Reviews:** I focus on architecture, reusability, and performance implications — not just syntax. I look for: proper caching strategy, correct Server vs Client component boundaries, accessible markup, and TypeScript type safety.
- **Backlog Refinement:** I proactively flag technical debt, propose spikes for new patterns (like migrating to PPR), and help PMs understand the impact of content model changes.

---

## SECTION H: Behavioral & Situational

---

### Q30: Tell me about a time you optimized a frontend application's performance. What was the result?

**A (STAR Framework):**

**Situation:** On a previous project, our CMS-driven marketing site had an LCP of 4.8 seconds on mobile. The business was losing conversions — bounce rate was 45% on landing pages.

**Task:** I was responsible for bringing LCP under 2.5 seconds without breaking the content editing workflow.

**Action:**
- Profiled with Chrome DevTools — found the hero image (served as full-size JPEG from CMS) was the LCP element at 2.4MB
- Implemented `next/image` with CMS image transformations — auto-WebP, responsive sizes, explicit dimensions
- Switched landing pages from SSR to ISR with 60-second revalidation — reduced TTFB from 800ms to 40ms
- Code-split the testimonial carousel (only loaded below the fold) using `next/dynamic`
- Preloaded the primary font with `<link rel="preload">`

**Result:** LCP dropped from 4.8s to 1.7s. Bounce rate decreased from 45% to 28%. The approach became the team standard for all CMS-powered pages.

---

### Q31: How do you handle disagreements about technical decisions with your team?

**A:** I approach technical disagreements as learning opportunities. Recently, a colleague wanted to make every component a Client Component "for simplicity," while I advocated for Server Components by default. Instead of insisting I was right, I:

1. Built a small proof of concept showing both approaches
2. Measured the bundle size difference (Server Components approach shipped 60% less JS)
3. Presented the data in a team tech talk, showing the performance impact
4. Compromised — we established clear guidelines for when to use each, documented in our ADR (Architecture Decision Records)

The key is: use data over opinions, and always be willing to learn something new from the other perspective.

---

### Q32: How do you mentor junior developers on your team?

**A:** I believe in structured mentoring:

- **Code reviews as teaching moments:** Instead of just fixing issues, I explain the *why* — "This should be a Server Component because it doesn't use hooks, and keeping it server-side reduces the client bundle."
- **Pair programming sessions:** Especially for complex features like CMS integration or implementing ISR.
- **Internal documentation:** I maintain ADRs and a team wiki with patterns for common tasks (how to add a new CMS block, how to set up preview mode, caching strategy guidelines).
- **Encourage ownership:** I assign meaningful features to juniors and guide them through the architecture decisions rather than handing them only bug fixes.

---

## SECTION I: Advanced & Differentiator Questions

---

### Q33: How would you implement A/B testing with a headless CMS and Next.js?

**A:** I'd use Next.js middleware for traffic splitting and the CMS for variant content:

```tsx
// middleware.ts
export function middleware(request) {
  const bucket = request.cookies.get('ab-bucket')?.value
    || (Math.random() < 0.5 ? 'A' : 'B');

  const response = NextResponse.next();
  if (!request.cookies.get('ab-bucket')) {
    response.cookies.set('ab-bucket', bucket, { maxAge: 60 * 60 * 24 * 30 });
  }
  response.headers.set('x-ab-bucket', bucket);
  return response;
}

// In page component
import { headers } from 'next/headers';

export default async function LandingPage() {
  const headersList = await headers();
  const bucket = headersList.get('x-ab-bucket') || 'A';

  // Fetch variant-specific content from CMS
  const page = await cms.getEntry('landing_page', 'home', {
    variant: bucket, // CMS stores variant content
  });

  return <PageRenderer content={page} />;
}
```

Important: With PPR, the static shell can be shared across variants while only the dynamic variant-specific sections differ.

---

### Q34: How do you handle content personalization in a CMS-driven Next.js app?

**A:** Personalization conflicts with static caching, so I architect it in layers:

1. **Static shell:** CMS content that's the same for everyone (header, hero layout, footer) — served from CDN
2. **Edge personalization:** Middleware reads cookies/headers to determine user segment and rewrites to variant pages or sets headers
3. **Client-side personalization:** Below-the-fold sections fetch personalized content via client components after the static shell loads
4. **CMS-powered rules:** Content editors define personalization rules in the CMS (show block X to segment Y). The frontend evaluates these rules at render time.

With PPR, this becomes elegant: the static shell is instant, and personalized sections stream in via Suspense boundaries.

---

### Q35: How would you implement a design system that integrates with CMS content?

**A:** I'd build a token-based design system where tokens live in both the code and CMS:

1. **Design tokens** (colors, spacing, typography) defined in Tailwind config and replicated as CMS Global Fields
2. **Component library** in a shared package (monorepo with Turborepo), documented in Storybook
3. **CMS block components** consume design tokens — editors pick from predefined styles (e.g., "primary" or "secondary" button style) rather than arbitrary values
4. **Theme support:** CSS variables for brand-specific themes, switchable via CMS settings

```tsx
// CMS editor picks style variant → maps to design token
const buttonStyles = {
  primary: 'bg-brand-primary text-white hover:bg-brand-primary-dark',
  secondary: 'bg-white text-brand-primary border border-brand-primary',
  ghost: 'bg-transparent text-brand-primary hover:bg-gray-50',
};

function CTAButton({ style, text, url }: CMSButtonProps) {
  return (
    <Link href={url} className={`px-6 py-3 rounded-lg ${buttonStyles[style]}`}>
      {text}
    </Link>
  );
}
```

---

### Q36: Explain how you'd handle a production incident where CMS content isn't updating on the live site.

**A:** I'd follow a systematic debugging approach:

1. **Check CMS publish status:** Is the entry actually published in Contentstack? (It could be stuck in workflow approval)
2. **Check webhook delivery:** Contentstack's webhook log — was the webhook sent? Did it get a 200 response?
3. **Check revalidation API:** Hit `/api/revalidate` manually with the content type tag and verify the response
4. **Check cache headers:** Use `curl -I` on the page URL to check `Cache-Control`, `x-nextjs-cache` (HIT/MISS/STALE) headers
5. **Check Vercel function logs:** Are there errors in the revalidation function? API token expired?
6. **Emergency fix:** If ISR is stuck, deploy a no-op code change to force a full rebuild, which clears the cache

Prevention: I set up monitoring on webhook delivery failures and revalidation API errors. I also add a "Cache-Bust" button in the CMS preview that editors can use to manually trigger revalidation.

---

### Q37: What's the difference between `revalidateTag` and `revalidatePath`? When do you use each?

**A:**

- **`revalidatePath('/blog/my-post')`** — invalidates the cache for one specific URL. Good when you know exactly which page was affected.
- **`revalidateTag('blog_post')`** — invalidates all cached data tagged with 'blog_post'. This is broader — if you tagged your CMS fetch calls with `next: { tags: ['blog_post'] }`, all pages using blog posts will revalidate.

I prefer `revalidateTag` for CMS webhooks because a single content change can affect multiple pages (the blog listing page, the individual post, the homepage featured posts, the sitemap). Tag-based revalidation catches all of them.

```tsx
// When CMS publishes a blog post, all these pages revalidate:
// 1. /blog (listing page that fetches with tag: 'blog_post')
// 2. /blog/[slug] (individual post)
// 3. / (homepage that shows featured posts tagged 'blog_post')
```

---

### Q38: How do you handle environment-specific configurations for CMS integration?

```tsx
// lib/config.ts
const config = {
  development: {
    csApiKey: process.env.CS_API_KEY!,
    csDeliveryToken: process.env.CS_PREVIEW_TOKEN!, // Use preview token in dev
    csEnvironment: 'development',
    previewMode: true,
    revalidateDefault: 10, // Short for dev
  },
  staging: {
    csApiKey: process.env.CS_API_KEY!,
    csDeliveryToken: process.env.CS_STAGING_DELIVERY_TOKEN!,
    csEnvironment: 'staging',
    previewMode: false,
    revalidateDefault: 30,
  },
  production: {
    csApiKey: process.env.CS_API_KEY!,
    csDeliveryToken: process.env.CS_PRODUCTION_DELIVERY_TOKEN!,
    csEnvironment: 'production',
    previewMode: false,
    revalidateDefault: 60,
  },
};

export const cmsConfig = config[process.env.NODE_ENV as keyof typeof config]
  || config.development;
```

**Key points:**
- Different delivery tokens per environment
- Preview tokens only in development
- Different revalidation intervals (shorter in dev for faster feedback)
- Separate Contentstack environments (dev/staging/prod) so content editors can test in staging before publishing to production

---

### Q39: How would you handle SEO when CMS editors change a page's URL slug?

**A:** This is critical — changing slugs without redirects kills SEO. My approach:

1. **Store old slugs in CMS:** Add a "Previous URLs" field to content types that automatically captures the old slug when it changes
2. **Implement redirect middleware:**
```tsx
// middleware.ts
export async function middleware(request) {
  const path = request.nextUrl.pathname;

  // Check redirect map (cached, refreshed via webhook)
  const redirect = await getRedirect(path);
  if (redirect) {
    return NextResponse.redirect(
      new URL(redirect.destination, request.url),
      { status: 301 } // Permanent redirect — preserves SEO
    );
  }
  return NextResponse.next();
}
```
3. **Submit updated sitemap** to Google Search Console after URL changes
4. **Monitor 404s** via analytics to catch any missed redirects

---

### Q40: What questions would YOU ask the interviewer about this role?

This shows initiative. Strong questions to ask:

1. "What headless CMS are you currently using and are there plans to migrate or upgrade?"
2. "How many locales/brands does the current site serve, and what's the content volume?"
3. "What does the current deployment pipeline look like? Are you on Vercel, or self-hosting?"
4. "How do content editors currently preview changes before publishing?"
5. "What's the biggest frontend performance challenge you're facing right now?"
6. "Are you using the Pages Router or App Router, and do you have plans to migrate?"
7. "How large is the frontend team, and how do you handle code reviews and architectural decisions?"
8. "What's the current tech debt situation, and is there dedicated time for addressing it?"

---

### Two critical breaking changes to nail:

- [ ] Async Request APIs — cookies(), headers(), params, searchParams all return Promises now. You must await them. In client components, use React.use() instead. This is foundational for PPR.
- [ ] Caching flipped — fetch() is now uncached by default (opposite of v14). You must explicitly opt in with cache: 'force-cache' or next: { revalidate: N }.

New features to highlight in the interview:

- [ ] Partial Prerendering (PPR) — static shell + dynamic streaming in one route
- [ ] React 19 hooks — useActionState, useOptimistic, useFormStatus
- [ ] Turbopack Dev — stable, ~96% faster Fast Refresh
- [ ] next/form — client-side navigation for forms
- [ ] unstable_after — run code after response is sent
- [ ] Server Actions security — auto dead-code elimination + secure IDs


### Q2: You're building a large e-commerce site with 50,000 product pages and blog content from a CMS. The product data changes hourly, but blog articles are updated weekly. Which rendering strategy would you use for each, and why?
The Correct Answer:
For 50,000 product pages (changing hourly):

Use ISR (Incremental Static Regeneration) with revalidate: 3600 (1 hour)
Why? Build static HTML at deploy time, then regenerate specific pages every hour when they're requested. You get fast initial load (cached static) + fresh data (revalidates hourly). No server-per-request overhead.

For blog articles (changing weekly):

Use SSG (Static Site Generation) with revalidate: 604800 (7 days)
Why? Articles don't change often. Pre-render everything at build time. Super fast, no server cost.

Why NOT SSR?

Every request hits the server → slower response, higher server costs, harder to scale, no CDN caching benefit.

###  Next.js 15 Caching Behavior (Breaking Change)
# Next.js 15: Fetch Caching Changes & Fixes

## The Breaking Change

In Next.js 15, `fetch()` requests are **no longer cached by default**. In Next.js 14, fetches were cached automatically — now you must explicitly opt in to caching.

---

## Option 1: Explicitly Cache the Fetch

```javascript
// Next.js 15 - Explicitly cache
export default async function Page() {
  const data = await fetch(
    'https://cms.contentstack.io/api/v3/entries',
    { cache: 'force-cache' }  // Cache this fetch
  )
  return <div>...</div>
}
```

---

## Option 2: Use Revalidation (ISR Approach)

```javascript
// Revalidate every 1 hour (3600 seconds)
export default async function Page() {
  const data = await fetch(
    'https://cms.contentstack.io/api/v3/entries',
    { next: { revalidate: 3600 } }  // Revalidate every hour
  )
  return <div>...</div>
}
```

---

## Option 3: No Caching (Fetch Fresh Every Time)

```javascript
// Next.js 15 default - uncached, always fresh
export default async function Page() {
  const data = await fetch(
    'https://cms.contentstack.io/api/v3/entries',
    { cache: 'no-store' }  // Explicitly no cache
  )
  return <div>...</div>
}
```

---

## When to Use What?

| Scenario                          | Strategy    | Code                                |
| --------------------------------- | ----------- | ----------------------------------- |
| Blog posts updated weekly         | ISR         | `{ next: { revalidate: 604800 } }` |
| Product prices change hourly      | ISR         | `{ next: { revalidate: 3600 } }`   |
| User-specific content (profile)   | No cache    | `{ cache: 'no-store' }`            |
| Static homepage                   | Force cache | `{ cache: 'force-cache' }`         |

---

## Another Breaking Change: Async APIs

APIs like `cookies()`, `headers()`, and `params` are now **async** in Next.js 15. You must `await` them:

```javascript
// Next.js 14 - Synchronous
const token = cookies().get('auth-token')

// Next.js 15 - Async (MUST await)
const cookieStore = await cookies()
const token = cookieStore.get('auth-token')
```

# Headless CMS Integration — Multi-Language Website with Next.js & Contentstack

## Q3: Content Localization Approach

**Scenario:** Building a multi-language website (English, Spanish, French) using Next.js and Contentstack.

---

## 1. Content Structure in Contentstack

### Localization Setup

- Enable **multiple languages** in Contentstack settings (English, Spanish, French)
- Configure **fallback chains** — e.g., if Spanish content is missing, fall back to English
- Each content type (e.g., `product`, `blog_post`) has language-specific entries
- Contentstack stores translations as **separate entries per locale**, not as fields within one entry

### Key Concept: Fallback Query

When content isn't available in the requested language, Contentstack returns the **fallback language content** based on your configured fallback chain.

```
French (fr) → Spanish (es) → English (en) [base]
```

---

## 2. URL Structure & Routing

### Three Options Compared

| Option | Example URL | SEO | Recommendation |
| ------ | ----------- | --- | -------------- |
| **A: Language prefix (dynamic route)** | `/en/products/laptop` | ✅ Excellent | ✅ **Best choice** |
| **B: Query parameter** | `/products/laptop?lang=en` | ⚠️ Weak | ❌ Avoid |
| **C: Accept-Language header** | `/products/laptop` | ❌ Poor | ❌ Avoid |

### Why Option A Wins

- Each language gets its **own distinct, crawlable URL**
- Google indexes each language version **independently**
- Better organic traffic in each regional market
- Clear to users which language they're viewing

### Why Option C Fails for SEO

- Google crawlers **don't send `Accept-Language` headers consistently**
- Google might crawl `/products/laptop` once in English and **miss other languages entirely**
- Search engines won't index all language versions properly
- You lose organic traffic in non-English markets

### Next.js Route Structure

```
app/
  [lang]/
    products/
      [slug]/
        page.tsx      ← /en/products/laptop, /es/products/laptop
    page.tsx          ← /en, /es (homepage per language)
  middleware.ts       ← detect & redirect language
```

---

## 3. Middleware for Language Handling

Instead of relying on query params, use **Next.js Middleware** for a cleaner approach:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

const SUPPORTED_LOCALES = ['en', 'es', 'fr']
const DEFAULT_LOCALE = 'en'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if pathname already has a locale
  const hasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (hasLocale) return NextResponse.next()

  // Detect language from cookie or Accept-Language header
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  const headerLocale = request.headers
    .get('accept-language')
    ?.split(',')[0]
    .split('-')[0]

  const locale =
    SUPPORTED_LOCALES.includes(cookieLocale ?? '')
      ? cookieLocale
      : SUPPORTED_LOCALES.includes(headerLocale ?? '')
        ? headerLocale
        : DEFAULT_LOCALE

  // Rewrite URL internally (user sees /products, server handles /en/products)
  return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url))
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico).*)'],
}
```

**Key benefit:** Middleware detects language → redirects to prefixed URL → same page component handles all languages.

---

## 4. Content Fetching Utility (TypeScript)

### Reusable Contentstack Fetch Function

```typescript
// lib/contentstack.ts

interface ContentstackConfig {
  contentType: string
  entryUid?: string
  locale?: string
  revalidate?: number
}

interface ContentstackEntry<T = Record<string, unknown>> {
  uid: string
  title: string
  locale: string
  [key: string]: unknown
  data: T
}

const API_BASE = process.env.CONTENTSTACK_API_HOST
  || 'https://cdn.contentstack.io/v3'

const HEADERS = {
  api_key: process.env.CONTENTSTACK_API_KEY!,
  access_token: process.env.CONTENTSTACK_DELIVERY_TOKEN!,
  'Content-Type': 'application/json',
}

export async function getContentstackEntry<T = Record<string, unknown>>({
  contentType,
  entryUid,
  locale = 'en',
  revalidate = 3600,
}: ContentstackConfig): Promise<ContentstackEntry<T>> {
  const url = entryUid
    ? `${API_BASE}/content_types/${contentType}/entries/${entryUid}?locale=${locale}`
    : `${API_BASE}/content_types/${contentType}/entries?locale=${locale}`

  try {
    const response = await fetch(url, {
      headers: HEADERS,
      next: { revalidate }, // ISR — revalidate after N seconds
    })

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '5'
      throw new Error(`Rate limited. Retry after ${retryAfter}s`)
    }

    // Handle auth errors
    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid Contentstack API token')
    }

    if (!response.ok) {
      throw new Error(`Contentstack API error: ${response.status}`)
    }

    const data = await response.json()
    return entryUid ? data.entry : data.entries
  } catch (error) {
    console.error('[Contentstack]', error)
    throw error
  }
}
```

### Usage in a Page Component

```typescript
// app/[lang]/products/[slug]/page.tsx

import { getContentstackEntry } from '@/lib/contentstack'

interface Product {
  title: string
  description: string
  price: number
  images: { url: string }[]
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang, slug } = await params // ⚠️ Next.js 15: params is async

  const product = await getContentstackEntry<Product>({
    contentType: 'product',
    entryUid: slug,
    locale: lang,
    revalidate: 3600, // revalidate every hour
  })

  return (
    <div>
      <h1>{product.title}</h1>
      <p>{product.description}</p>
      <span>${product.price}</span>
    </div>
  )
}
```

---

## 5. ISR Strategy for Multi-Language at Scale

**Problem:** 1,000 products × 3 languages = 3,000 pages. How to handle efficiently?

### Approach: On-Demand ISR with Fallback

```typescript
// app/[lang]/products/[slug]/page.tsx

// Only pre-generate the most popular pages at build time
export async function generateStaticParams() {
  const topProducts = await getContentstackEntry({
    contentType: 'product',
    locale: 'en',
  })

  const locales = ['en', 'es', 'fr']

  // Pre-generate top 50 products × 3 languages = 150 pages
  return topProducts.slice(0, 50).flatMap((product) =>
    locales.map((lang) => ({
      lang,
      slug: product.uid,
    }))
  )
}

// Remaining pages generated on-demand and cached
export const dynamicParams = true // allow pages not in generateStaticParams
```

### Strategy Summary

| Pages | Strategy | Why |
| ----- | -------- | --- |
| Top 50 products × 3 langs | Pre-generated at build | Fast first load, good for SEO |
| Remaining 950 × 3 langs | ISR on-demand | Generated on first visit, then cached |
| Revalidation | `revalidate: 3600` | Fresh content every hour |

---

## 6. Next.js 15 Breaking Changes to Remember

### Async APIs

```typescript
// ❌ Next.js 14 — synchronous
const token = cookies().get('auth-token')
const { lang } = params

// ✅ Next.js 15 — MUST await
const cookieStore = await cookies()
const token = cookieStore.get('auth-token')
const { lang } = await params
```

### Fetch Caching

```typescript
// ❌ Next.js 14 — cached by default (no action needed)
await fetch(url)

// ✅ Next.js 15 — explicitly opt in to caching
await fetch(url, { next: { revalidate: 3600 } })
await fetch(url, { cache: 'force-cache' })
```

---

## 7. SEO Checklist for Multi-Language Sites

- Use `hreflang` tags in `<head>` to tell Google about language alternatives
- Each language must have a **unique, crawlable URL** (`/en/...`, `/es/...`)
- Add a **sitemap per language** or a combined sitemap with `hreflang` annotations
- Set `<html lang="es">` dynamically based on the current locale
- Use **canonical URLs** to avoid duplicate content penalties

```typescript
// app/[lang]/layout.tsx
export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  return (
    <html lang={lang}>
      <head>
        <link rel="alternate" hrefLang="en" href="https://example.com/en" />
        <link rel="alternate" hrefLang="es" href="https://example.com/es" />
        <link rel="alternate" hrefLang="fr" href="https://example.com/fr" />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

# Headless CMS — Production Challenges & Solutions (Next.js + Contentstack)

## Challenge 1: CMS API is Slow (200ms → 3-4 seconds)

**Problem:** Contentstack API response time spikes. Pages load slowly, LCP drops, users leave.

### 3-Layer Defense Strategy

---

### Layer 1 — ISR Caching (Primary Defense)

Most users should never hit the live API at all.

```typescript
const data = await fetch(cmsUrl, {
  next: { revalidate: 3600 }, // Serve cached version for 1 hour
})
// Only 1 request per hour hits the slow API
// All other users get instant cached response
```

---

### Layer 2 — Timeout + Fallback

Don't let a slow API hang the entire page.

```typescript
// lib/cms-fetch.ts
async function fetchFromCMS(url: string, options?: RequestInit) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000) // 5s max

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) throw new Error(`CMS returned ${response.status}`)
    return await response.json()
  } catch (error) {
    clearTimeout(timeout)
    console.error('CMS API slow/down:', error)

    // Fallback chain: stale cache → default content
    const cachedData = await getFromLocalCache(url)
    if (cachedData) return cachedData
    return getFallbackContent()
  }
}
```

---

### Layer 3 — Parallel Fetching

Never make sequential CMS calls when they're independent.

```typescript
// ❌ Sequential — 3 × 3s = 9 seconds total
const header = await fetchFromCMS('/header')
const products = await fetchFromCMS('/products')
const footer = await fetchFromCMS('/footer')

// ✅ Parallel — 3 seconds total (all run simultaneously)
const [header, products, footer] = await Promise.all([
  fetchFromCMS('/header'),
  fetchFromCMS('/products'),
  fetchFromCMS('/footer'),
])
```

> **Interview Answer:** "I'd use a three-layer approach: ISR caching as the primary defense so most users never hit the API, request timeouts with fallback data for when the API is genuinely slow, and parallel fetching with `Promise.all` to minimize total wait time when multiple API calls are needed."

---

## Challenge 2: Building 10,000 Products at Deploy Time

**Problem:** Building all 10,000 static pages takes 30+ minutes. CI/CD times out, team productivity drops.

### Solution: Build Top Pages, Generate Rest On-Demand

```typescript
// app/products/[slug]/page.tsx

// STEP 1: Pre-build only top 200 high-traffic products
export async function generateStaticParams() {
  const topProducts = await fetch(
    'https://cms.contentstack.io/v3/content_types/product/entries',
    {
      headers: { api_key: process.env.CS_API_KEY! },
      next: { revalidate: 86400 }, // refresh product list daily
    }
  )
  const data = await topProducts.json()

  return data.entries
    .sort((a, b) => b.pageviews - a.pageviews)
    .slice(0, 200) // only top 200, NOT all 10,000
    .map((product) => ({ slug: product.url }))
}

// STEP 2: Remaining 9,800 pages generate on first visit
export default async function ProductPage({ params }) {
  const { slug } = await params

  const product = await fetch(
    `https://cms.contentstack.io/v3/content_types/product/entries?query={"url":"/${slug}"}`,
    { next: { revalidate: 7200 } } // cache for 2 hours
  )

  if (!product.ok) notFound()

  const data = await product.json()
  return <ProductDetail product={data.entry} />
}
```

### What Happens at Runtime

```
Build time → 200 pages built (2-3 min) ✅

User visits /products/rare-item →
  Page doesn't exist yet →
  Next.js generates it on-the-fly (SSR-like) →
  Caches result as static HTML →
  All future users get the cached version

After 2 hours →
  Next request triggers background revalidation →
  Fresh data fetched, page updated silently
```

### Build Time Comparison

| Approach | Pages Built | Build Time |
| -------- | ----------- | ---------- |
| Build all 10,000 | 10,000 | 30-45 minutes |
| Build top 200 + ISR | 200 | 2-3 minutes |

> **Interview Answer:** "I'd never build all 10,000 pages at deploy time. I'd use `generateStaticParams` to pre-build only the top 200 highest-traffic pages — covering 80% of visitors. The remaining pages generate on first visit via ISR, get cached, and revalidate every 2 hours. Build time drops from 30+ minutes to under 3 minutes."

---

## Challenge 3: Webhooks for Instant Content Updates

**Problem:** Editor publishes a blog post in Contentstack. Website still shows old content because the cached page hasn't revalidated yet.

### Solution: Webhook → On-Demand Revalidation

---

### Step 1 — Configure Webhook in Contentstack

```
Contentstack Dashboard → Settings → Webhooks → Create
  URL:     https://yoursite.com/api/revalidate
  Events:  Entry Published, Entry Updated, Entry Deleted
  Headers: x-webhook-secret: YOUR_SECRET_KEY
```

---

### Step 2 — Revalidation API Route

```typescript
// app/api/revalidate/route.ts
import { revalidateTag, revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  // Verify webhook authenticity
  const headersList = await headers()
  const secret = headersList.get('x-webhook-secret')

  if (secret !== process.env.WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await request.json()
  const contentType = payload.content_type?.uid // e.g., 'blog_post'
  const entryUrl = payload.entry?.url           // e.g., '/my-new-post'
  const action = payload.event                  // e.g., 'publish'

  try {
    // Tag-based: revalidate ALL pages using this content type
    if (contentType) revalidateTag(contentType)

    // Path-based: revalidate the specific page
    if (entryUrl) revalidatePath(entryUrl)

    // Always refresh homepage (might show latest posts)
    revalidatePath('/')

    return Response.json({
      revalidated: true,
      contentType,
      url: entryUrl,
      action,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return Response.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}
```

---

### Step 3 — Tag Your Fetch Calls

```typescript
export default async function BlogListPage() {
  const posts = await fetch('https://cms.contentstack.io/v3/.../blog_post', {
    next: {
      tags: ['blog_post'],  // ← links to revalidateTag('blog_post')
      revalidate: 3600,      // fallback: also revalidate every hour
    },
  })

  return <BlogList posts={await posts.json()} />
}
```

---

### The Complete Flow

```
Editor publishes blog post in Contentstack
  ↓
Contentstack fires webhook → POST /api/revalidate
  ↓
API route verifies secret, parses payload
  ↓
Calls revalidateTag('blog_post')
  ↓
Next.js invalidates all pages tagged with 'blog_post'
  ↓
Next user request triggers fresh fetch from CMS
  ↓
New content is live within seconds ✅
```

> **Interview Answer:** "I set up Contentstack webhooks that fire on publish/update/delete events. These hit a secure API route in Next.js that calls `revalidateTag()` to invalidate all pages using that content type. Content goes live within seconds of clicking 'Publish', without waiting for a full rebuild or ISR timer."

---

## Challenge 4: Performance Monitoring

**Problem:** How do you know if your CMS-driven site is performing well?

### 3-Level Monitoring

---

### Level 1 — Core Web Vitals (Real User Metrics)

```typescript
// app/layout.tsx
import { useReportWebVitals } from 'next/web-vitals'

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({
        name: metric.name,     // LCP, INP, CLS
        value: metric.value,
        rating: metric.rating, // 'good', 'needs-improvement', 'poor'
        page: window.location.pathname,
      }),
    })
  })
}
```

---

### Level 2 — CMS API Health Monitoring

```typescript
async function fetchWithMonitoring(url: string) {
  const start = performance.now()

  try {
    const response = await fetch(url)
    const duration = performance.now() - start

    if (duration > 2000) {
      await alertTeam({
        message: `CMS API slow: ${duration}ms for ${url}`,
        severity: 'warning',
      })
    }

    return response
  } catch (error) {
    await alertTeam({
      message: `CMS API DOWN: ${url}`,
      severity: 'critical',
    })
    throw error
  }
}
```

---

### Level 3 — Error Tracking (Sentry via `instrumentation.ts`)

```typescript
// instrumentation.ts — Next.js 15 stable API
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const Sentry = await import('@sentry/nextjs')
    Sentry.init({ dsn: process.env.SENTRY_DSN })
  }
}

export async function onRequestError(error, request, context) {
  await fetch('https://monitoring.example.com/errors', {
    method: 'POST',
    body: JSON.stringify({
      message: error.message,
      page: request.path,
      renderingPhase: context.renderingPhase, // 'render' or 'data-fetch'
      routeType: context.routeType,           // 'pages' or 'app'
    }),
  })
}
```

### Alert Thresholds

| Metric | Tool | Alert Threshold |
| ------ | ---- | --------------- |
| LCP | Vercel Analytics | > 2.5 seconds |
| CLS | Vercel Analytics | > 0.1 |
| INP | Vercel Analytics | > 200ms |
| CMS API response time | Custom monitoring | > 2 seconds |
| Webhook delivery | Contentstack logs | Any failure |
| Build time | GitHub Actions | > 5 minutes |
| Error rate | Sentry | > 1% of requests |

> **Interview Answer:** "I implement three levels of monitoring: real-user Core Web Vitals via `useReportWebVitals`, CMS API health monitoring with response time alerts, and error tracking using `instrumentation.ts` with Sentry. If LCP goes above 2.5s or CMS API exceeds 2s, the team gets notified automatically."

---

## Bonus: 3 Common Production Issues

---

### Issue 1: Stale Content After CMS Update

**Problem:** Editor publishes but website shows old version.

**Root causes and fixes:**

- **Webhook failed** → Check Contentstack webhook logs, add retry logic
- **ISR timer hasn't expired** → Implement on-demand revalidation via webhooks
- **CDN caching old version** → Add proper `Cache-Control` headers, purge CDN cache
- **Browser caching old version** → Add `stale-while-revalidate` headers

---

### Issue 2: Build Fails Due to API Rate Limiting

**Problem:** `generateStaticParams` makes 500+ API calls. Contentstack rate-limits you. Build fails.

**Fix:** Batch API calls with pagination + delay.

```typescript
async function getAllProducts() {
  const allProducts = []
  let skip = 0
  const limit = 100

  while (true) {
    const response = await fetch(
      `${CMS_URL}/entries?content_type=product&limit=${limit}&skip=${skip}`
    )
    const data = await response.json()
    allProducts.push(...data.entries)

    if (data.entries.length < limit) break
    skip += limit

    // Respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return allProducts
}
```

---

### Issue 3: Preview Mode Not Working for Editors

**Problem:** Editors click "Preview" in Contentstack but see published content, not drafts.

**Fix:** Use Next.js Draft Mode.

```typescript
// app/api/preview/route.ts
import { draftMode } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')

  if (secret !== process.env.PREVIEW_SECRET) {
    return new Response('Invalid token', { status: 401 })
  }

  const draft = await draftMode() // Next.js 15 — must await
  draft.enable()

  return Response.redirect(new URL(`/blog/${slug}`, request.url))
}
```

```typescript
// In the page component
import { draftMode } from 'next/headers'

export default async function BlogPost({ params }) {
  const { slug } = await params
  const { isEnabled: isPreview } = await draftMode()

  // Use Preview API for drafts, Delivery API for published
  const post = isPreview
    ? await fetchFromCMA(slug) // Management API → draft content
    : await fetchFromCDA(slug) // Delivery API → published content

  return (
    <>
      {isPreview && (
        <div className="bg-yellow-100 p-2 text-center">
          ⚠️ Preview Mode — This content is not published yet
        </div>
      )}
      <Article post={post} />
    </>
  )
}
```

---

## Quick Reference: All Interview Answers

| Challenge | One-Line Strategy |
| --------- | ----------------- |
| Slow CMS API | ISR caching + timeout/fallback + `Promise.all` parallel fetching |
| 10K products to build | Pre-build top 200 via `generateStaticParams`, ISR for the rest |
| Content not updating | Webhook → `revalidateTag()` for instant on-demand revalidation |
| Performance monitoring | Web Vitals + CMS API health alerts + Sentry error tracking |
| Stale content | Webhook retries + CDN purge + proper cache headers |
| Rate limiting on build | Paginated batch fetching with delays |
| Preview not working | Next.js Draft Mode + CMA (Management API) for draft content |

---

# System Design — E-Commerce Frontend Architecture (Next.js + Contentstack)

## The Scenario

- **10 million** monthly users globally
- **500,000** products across multiple categories
- **15 countries** with different languages and currencies
- Content managed in **Contentstack**
- Real-time inventory updates
- Multiple brands under one umbrella
- **Performance SLA:** LCP < 2 seconds globally, 99.99% availability

---

## Q5: Rendering Strategy — Which Strategy for Each Page?

### Understanding the Trade-offs

| Strategy | Build Time | Freshness | Server Cost | Performance | Best For |
| -------- | ---------- | --------- | ----------- | ----------- | -------- |
| **SSG** | Once at deploy | Stale until rebuild | $0 runtime | ⚡⚡⚡ Fastest | Static content |
| **ISR** | Once + periodic revalidation | Configurable | $0 – minimal | ⚡⚡ Very fast | Semi-dynamic content |
| **SSR** | Every request | Always fresh | $$$ high | ⚡ Slower | Real-time data |
| **Dynamic/Client** | Zero server | Can be stale | $0 server | ⚡ Depends | User-specific |

---

## 1. Homepage — ✅ ISR (revalidate: 24 hours)

```typescript
// app/page.tsx
export const revalidate = 86400 // Revalidate daily

export default async function HomePage() {
  const banners = await fetch(
    'https://cms.contentstack.io/v3/content_types/banner/entries',
    {
      headers: { api_key: process.env.CONTENTSTACK_API_KEY },
      next: { revalidate: 86400 },
    }
  )

  const promotions = await fetch(
    'https://cms.contentstack.io/v3/content_types/promotion/entries',
    { next: { revalidate: 86400 } }
  )

  return (
    <>
      <Hero banners={await banners.json()} />
      <Promotions promotions={await promotions.json()} />
      <FeaturedProducts />
    </>
  )
}
```

**Why ISR?**

- Content updated weekly, not hourly
- Most users hit the cached version (fast)
- After 24 hours, next visit triggers a fresh fetch from CMS
- No full rebuild needed
- **Result: LCP ~800ms globally ✅**

---

## 2. Product List Page — ✅ ISR + Client-Side Filtering

```typescript
// app/products/page.tsx
export const revalidate = 3600 // Revalidate every hour

export default async function ProductListPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>
}) {
  const params = await searchParams

  const products = await fetch(
    `https://cms.contentstack.io/v3/content_types/product/entries?category=${params.category || ''}`,
    { next: { revalidate: 3600, tags: ['products'] } }
  )

  const productData = await products.json()

  return (
    <ProductListShell>
      {/* Products rendered on server */}
      <ProductGrid products={productData.entries} />

      {/* Client-side filters — instant, no server round-trip */}
      <ClientSideFilters initialProducts={productData.entries} />
    </ProductListShell>
  )
}
```

**Why ISR + Client Filtering?**

- Product catalog updates hourly (prices change, new items added)
- ISR with 1-hour revalidation keeps it fresh enough
- Client-side filtering for sort/category = instant interaction, no server latency
- **Result: LCP ~1.2s, filter interaction instant ✅**

---

## 3. Product Detail Page — ✅ ISR (On-Demand)

```typescript
// app/products/[slug]/page.tsx

// Pre-generate top 1000 products at build time
export async function generateStaticParams() {
  const topProducts = await fetch(
    'https://cms.contentstack.io/v3/content_types/product/entries?limit=1000&sort=-pageviews',
    {
      headers: { api_key: process.env.CONTENTSTACK_API_KEY },
      next: { revalidate: 86400 },
    }
  )

  const data = await topProducts.json()
  return data.entries.map((product) => ({ slug: product.url }))
}

export const revalidate = 7200 // Revalidate every 2 hours

export default async function ProductPage({ params }) {
  const { slug } = await params

  const product = await fetch(
    `https://cms.contentstack.io/v3/content_types/product/entries?query={"url":"/${slug}"}`,
    { next: { revalidate: 7200, tags: ['product', slug] } }
  )

  if (!product.ok) return notFound()

  const data = await product.json()
  const productEntry = data.entries[0]

  return (
    <>
      {/* Static content from CMS */}
      <ProductHeader product={productEntry} />

      {/* Real-time inventory — client-side, always fresh */}
      <InventoryWidget productId={productEntry.id} />

      {/* Client-side reviews and ratings */}
      <Reviews productId={productEntry.id} />
    </>
  )
}
```

**Why ISR?**

- Pre-build top 1,000 most-viewed products (covers ~80% of traffic)
- Remaining 499,000 products generate on first visit via ISR
- Revalidate every 2 hours (prices change, slight staleness acceptable)
- Inventory widget is **client-side** (always real-time fresh)
- **Result: LCP ~1.5s, inventory always current ✅**

**What happens at runtime:**

```
Build → Top 1,000 products built in ~5 minutes

User visits /products/rare-item →
  Page doesn't exist in cache →
  Next.js generates it on-the-fly →
  Caches as static HTML →
  Next user gets cached version instantly

After 2 hours →
  Next request triggers background revalidation →
  Fresh data fetched, page updated silently
```

---

## 4. Blog Articles — ✅ SSG (Static Site Generation)

```typescript
// app/blog/[slug]/page.tsx

// Generate ALL blog articles at build time
export async function generateStaticParams() {
  const articles = await fetch(
    'https://cms.contentstack.io/v3/content_types/blog_article/entries?limit=10000',
    { headers: { api_key: process.env.CONTENTSTACK_API_KEY } }
  )

  const data = await articles.json()
  return data.entries.map((article) => ({ slug: article.slug }))
}

export const revalidate = false // Build once, serve forever

export default async function BlogArticle({ params }) {
  const { slug } = await params

  const article = await fetch(
    `https://cms.contentstack.io/v3/content_types/blog_article/entries?query={"slug":"${slug}"}`,
    { cache: 'force-cache' }
  )

  const data = await article.json()
  return <ArticleContent article={data.entries[0]} />
}
```

**Why SSG?**

- Blog articles are rarely updated
- Build once, serve forever — zero server cost
- Blazing fast
- If an article needs an update → webhook triggers rebuild
- **Result: LCP ~600ms, zero server cost ✅**

---

## 5. Checkout Page — ✅ SSR (Server-Side Rendering)

```typescript
// app/checkout/page.tsx
export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // Always fresh — never cache user-specific data
  const cart = await fetch(`https://api.store.com/cart/${user.id}`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${user.token}` },
  })

  const shipping = await fetch(
    `https://api.store.com/shipping?country=${user.country}&state=${user.state}`,
    { cache: 'no-store' }
  )

  return (
    <>
      <CartSummary cart={await cart.json()} />
      <ShippingOptions shipping={await shipping.json()} />
      <PaymentForm user={user} />
    </>
  )
}
```

**Why SSR?**

- Every user has a different cart
- Prices and shipping rates change frequently
- Must show real-time, accurate info before payment
- Cannot cache — entirely user-specific
- **Result: 1-2s latency, acceptable for checkout ✅**

---

## 6. User Dashboard — ✅ Dynamic Rendering (Client-Side)

```typescript
// app/dashboard/page.tsx
'use client'

import { useUser } from '@/hooks/useUser'
import { useOrders } from '@/hooks/useOrders'

export default function Dashboard() {
  const { user, loading } = useUser()
  const { orders, loading: ordersLoading } = useOrders()

  if (loading) return <DashboardSkeleton />
  if (!user) return <NotAuthenticated />

  return (
    <>
      <UserProfile user={user} />
      <OrderHistory orders={orders} />
      <WishlistSection />
    </>
  )
}

// Custom hook with polling for real-time-ish updates
function useOrders() {
  const [orders, setOrders] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [])

  async function fetchOrders() {
    const res = await fetch('/api/orders', { cache: 'no-store' })
    setOrders(await res.json())
    setLoading(false)
  }

  return { orders, loading }
}
```

**Why Dynamic/Client-Side?**

- Personal data — order history, preferences, wishlist
- Must be real-time and accurate
- No way to pre-build (different for every user)
- Show loading skeleton while fetching
- **Result: Initial load ~1s, then real-time updates ✅**

---

## Summary Table

| Page | Strategy | Revalidation | LCP | Why |
| ---- | -------- | ------------ | --- | --- |
| Homepage | ISR | 24 hours | ~800ms | Updated weekly, most popular |
| Product List | ISR + Client filters | 1 hour | ~1.2s | Prices/inventory change hourly |
| Product Detail | ISR (on-demand) | 2 hours | ~1.5s | Pre-build top 1K, ISR the rest |
| Blog Articles | SSG | Never | ~600ms | Static content, permanent |
| Checkout | SSR | Per-request | 1-2s | User-specific, real-time |
| Dashboard | Dynamic (Client) | Per-request | ~1s+ | Personal data, real-time |

---

## Global Performance Optimization

To achieve **LCP < 2 seconds globally**, you also need:

```typescript
// 1. Image optimization
import Image from 'next/image'

<Image
  src={productImage}
  alt="Product"
  priority={isAboveTheFold}
  quality={85}
  sizes="(max-width: 640px) 100vw, 640px"
/>

// 2. Font optimization
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], display: 'swap' })

// 3. Script optimization — don't block page load
<Script src="analytics.js" strategy="lazyOnload" />

// 4. Compression
// next.config.js
export const compress = true
```

### Performance Checklist

| Technique | Impact | Effort |
| --------- | ------ | ------ |
| `next/image` with priority | LCP -30% | Low |
| Font `display: swap` | CLS improvement | Low |
| Script `lazyOnload` | TTI improvement | Low |
| ISR over SSR | LCP -50% | Medium |
| CDN (Vercel Edge / CloudFront) | Global LCP -40% | Medium |
| Pre-build top products | First-visit LCP = 0 | Medium |

---

## Architecture Decision Flowchart

```
Is the page user-specific?
  ├── YES → Does it need server-side auth/data?
  │         ├── YES → SSR (Checkout)
  │         └── NO  → Client-Side Dynamic (Dashboard)
  └── NO  → Does content change frequently?
            ├── RARELY/NEVER → SSG (Blog)
            ├── HOURLY/DAILY → ISR (Products, Homepage)
            └── REAL-TIME    → SSR or Client-Side (Inventory widget)
```

> **Interview Answer:** "I'd use a hybrid approach: SSG for static content like blogs (fastest, zero cost), ISR for product and marketing pages (fresh enough, nearly as fast), SSR only for user-specific flows like checkout (must be real-time), and client-side rendering for dashboards (personal, real-time). This covers 99% of traffic with cached pages, keeping LCP under 2 seconds globally."
---


