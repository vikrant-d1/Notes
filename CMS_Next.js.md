# Complete Interview Preparation Guide
## Senior Frontend Developer — Next.js 15 + Headless CMS (Nagarro)

---

# 📑 TABLE OF CONTENTS

| # | Section | Page Focus | JD Alignment |
|---|---------|-----------|--------------|
| **PART 1** | **NEXT.JS 15 CORE KNOWLEDGE** | |
| 1.1 | [Breaking Changes — Async APIs](#11-breaking-change-1--async-request-apis) | Must-know | Next.js SSR/SSG/ISR |
| 1.2 | [Breaking Changes — Caching Flipped](#12-breaking-change-2--caching-defaults-flipped) | Must-know | Data fetching & caching |
| 1.3 | [Rendering Strategies Comparison](#13-rendering-strategies--when-to-use-what) | Must-know | SSR, SSG, ISR strategies |
| 1.4 | [Server Components vs Client Components](#14-server-components-vs-client-components) | Must-know | Modern JS frameworks |
| 1.5 | [Partial Prerendering (PPR)](#15-partial-prerendering-ppr--experimental) | Differentiator | Rendering strategies |
| 1.6 | [React 19 Hooks](#16-react-19-new-hooks) | Should-know | Modern JS frameworks |
| 1.7 | [New APIs — Form, After, Instrumentation](#17-new-apis-in-nextjs-15) | Should-know | Performance optimization |
| 1.8 | [Turbopack, Server Actions Security, Config](#18-other-notable-changes) | Nice-to-know | CI/CD, deployment |
| **PART 2** | **HEADLESS CMS ARCHITECTURE** | |
| 2.1 | [What is Headless CMS — Traditional vs Headless](#21-what-is-headless-cms) | Must-know | Headless architecture |
| 2.2 | [Contentstack — Core Concepts & Hierarchy](#22-contentstack-core-concepts) | Must-know | Contentstack experience |
| 2.3 | [Content Modeling Best Practices](#23-content-modeling-best-practices) | Must-know | CMS-driven frontend |
| 2.4 | [CMS API Integration with Next.js 15](#24-contentstack-integration-with-nextjs-15) | Must-know | CMS API integration |
| 2.5 | [CDA vs CMA — When to Use Each](#25-content-delivery-api-vs-content-management-api) | Should-know | Data handling |
| 2.6 | [Preview & Draft Mode](#26-preview--draft-mode-in-nextjs-15) | Must-know | Preview environments |
| 2.7 | [Content Localization (Multi-Language)](#27-content-localization-multi-language) | Must-know | Localization |
| 2.8 | [Content Versioning & Scheduled Publishing](#28-content-versioning--scheduled-publishing) | Should-know | Content versioning |
| 2.9 | [CMS-Driven Page Builder (Modular Blocks)](#29-cms-driven-page-builder-modular-blocks) | Must-know | Reusable UI components |
| **PART 3** | **COMPONENT ARCHITECTURE & TYPESCRIPT** | |
| 3.1 | [Atomic Design for CMS-Driven Sites](#31-atomic-design-for-cms-driven-sites) | Must-know | Reusable, modular components |
| 3.2 | [TypeScript Patterns for CMS](#32-typescript-patterns-for-cms) | Must-know | TypeScript proficiency |
| 3.3 | [Rich Text Renderer for CMS JSON](#33-rich-text-renderer-for-contentstack-json-rte) | Practical | Scalable UI components |
| **PART 4** | **PERFORMANCE & CORE WEB VITALS** | |
| 4.1 | [Core Web Vitals — Numbers to Know](#41-core-web-vitals--numbers-to-know) | Must-know | Performance optimization |
| 4.2 | [LCP, CLS, INP — Specific Fixes](#42-optimization-strategies-by-metric) | Must-know | Core Web Vitals |
| 4.3 | [CMS Image Optimization](#43-cms-image-optimization) | Must-know | Performance optimization |
| 4.4 | [Handling 10K+ Pages — Build Time](#44-handling-10k-pages--build-time-optimization) | Should-know | Scalability |
| **PART 5** | **SEO & ACCESSIBILITY** | |
| 5.1 | [SEO with Next.js 15 Metadata API](#51-seo-with-nextjs-15-metadata-api) | Must-know | SEO best practices |
| 5.2 | [Dynamic Sitemap from CMS](#52-dynamic-sitemap-from-cms) | Should-know | SEO best practices |
| 5.3 | [Structured Data (JSON-LD)](#53-structured-data-json-ld) | Should-know | SEO best practices |
| 5.4 | [Accessibility (WCAG) Patterns](#54-accessibility-wcag-patterns) | Must-know | WCAG best practices |
| **PART 6** | **CI/CD & DEPLOYMENT** | |
| 6.1 | [CI/CD Pipeline Design](#61-cicd-pipeline-design) | Must-know | CI/CD pipelines |
| 6.2 | [CMS Webhook → Revalidation Pipeline](#62-webhook-revalidation-pipeline) | Must-know | Frontend deployment |
| 6.3 | [Environment-Specific CMS Config](#63-environment-specific-cms-configuration) | Should-know | Deployment platforms |
| **PART 7** | **PRODUCTION CHALLENGES & SOLUTIONS** | |
| 7.1 | [Slow CMS API — 3-Layer Defense](#71-slow-cms-api--3-layer-defense) | Must-know | Performance optimization |
| 7.2 | [Real-Time Inventory on Cached Pages](#72-real-time-inventory-on-cached-pages) | Differentiator | Data fetching strategies |
| 7.3 | [Stale Content After CMS Publish](#73-stale-content-after-cms-publish) | Must-know | Troubleshooting production |
| 7.4 | [Build Failures — API Rate Limiting](#74-build-failures--api-rate-limiting) | Should-know | Troubleshooting production |
| 7.5 | [Performance Monitoring (3 Levels)](#75-performance-monitoring-3-levels) | Must-know | Performance optimization |
| **PART 8** | **SYSTEM DESIGN — E-COMMERCE ARCHITECTURE** | |
| 8.1 | [Rendering Strategy Per Page Type](#81-rendering-strategy-per-page-type) | Must-know | System design thinking |
| 8.2 | [Multi-Language & Multi-Currency (15 Countries)](#82-multi-language--multi-currency-15-countries) | Must-know | Localization |
| 8.3 | [Architecture Decision Flowchart](#83-architecture-decision-flowchart) | Differentiator | Architecture skills |
| **PART 9** | **INTERVIEW Q&A (40 QUESTIONS)** | |
| 9A | [Architecture & System Design (Q1–Q6)](#section-a-architecture--system-design) | | |
| 9B | [Headless CMS Deep Dive (Q7–Q11)](#section-b-headless-cms-deep-dive) | | |
| 9C | [Performance Optimization (Q12–Q15)](#section-c-performance-optimization) | | |
| 9D | [Next.js 15 Specific (Q16–Q20)](#section-d-nextjs-15-specific) | | |
| 9E | [Practical Coding (Q21–Q24)](#section-e-practical-coding--problem-solving) | | |
| 9F | [SEO & Accessibility (Q25–Q27)](#section-f-seo--accessibility) | | |
| 9G | [CI/CD & Agile (Q28–Q29)](#section-g-cicd--agile) | | |
| 9H | [Behavioral & Situational (Q30–Q32)](#section-h-behavioral--situational) | | |
| 9I | [Advanced & Differentiator (Q33–Q40)](#section-i-advanced--differentiator) | | |
| **PART 10** | **QUICK REVISION CHECKLISTS** | |
| 10.1 | [Night-Before Checklist](#101-night-before-the-interview-checklist) | | |
| 10.2 | [One-Line Strategy Reference](#102-one-line-strategy-reference-table) | | |
| 10.3 | [Questions to Ask the Interviewer](#103-questions-to-ask-the-interviewer) | | |

---

# PART 1: NEXT.JS 15 CORE KNOWLEDGE

---

## 1.1 Breaking Change 1 — Async Request APIs

In Next.js 15, **all request-time APIs return Promises** instead of values.

**Affected APIs:** `cookies()`, `headers()`, `draftMode()`, `params`, `searchParams`

```tsx
// ✅ Next.js 15 — all async, must await
import { cookies, headers, draftMode } from 'next/headers';

const cookieStore = await cookies();
const token = cookieStore.get('token');

const headersList = await headers();
const referer = headersList.get('referer');

// ✅ params must be awaited in pages/layouts
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

**Why this matters:** Enables Partial Prerendering. Next.js can prerender static parts ahead of time and only wait for request-specific data when you `await`.

**Migration:** `npx @next/codemod@canary next-async-request-api .`

---

## 1.2 Breaking Change 2 — Caching Defaults Flipped

Next.js 15 changes from **"cached by default"** to **"uncached by default"**:

```tsx
// Next.js 15: fetch is NOT cached by default
const data = await fetch('https://api.example.com/data');
// Equivalent to: { cache: 'no-store' }

// To opt INTO caching:
await fetch(url, { cache: 'force-cache' });          // Cache forever
await fetch(url, { next: { revalidate: 3600 } });    // ISR: revalidate hourly
await fetch(url, { cache: 'no-store' });              // Never cache (explicit)
```

**Also uncached now:** GET Route Handlers, Client Router Cache (`staleTime` defaults to 0).

**When to use what:**

| Scenario | Strategy | Code |
|----------|----------|------|
| Blog posts (weekly updates) | ISR | `{ next: { revalidate: 604800 } }` |
| Product prices (hourly) | ISR | `{ next: { revalidate: 3600 } }` |
| User profile (personal) | No cache | `{ cache: 'no-store' }` |
| Static homepage | Force cache | `{ cache: 'force-cache' }` |

---

## 1.3 Rendering Strategies — When to Use What

| Strategy | When HTML Generated | Freshness | Use Case | Next.js 15 API |
|----------|-------------------|-----------|----------|---------------|
| **SSG** | Build time | Stale until rebuild | Blog posts, docs | `generateStaticParams()` + `cache: 'force-cache'` |
| **ISR** | Build + background | Configurable | Product pages, CMS | `fetch({ next: { revalidate: 60 } })` |
| **SSR** | Every request | Always fresh | Dashboards, checkout | `fetch({ cache: 'no-store' })` or `cookies()`/`headers()` |
| **PPR** | Shell at build, dynamic at request | Mixed | Static + dynamic pages | `experimental_ppr = true` + `<Suspense>` |
| **CSR** | Client-side | Depends | Interactive widgets | `'use client'` + SWR/React Query |

**Critical for interview:** Know WHY you'd choose one over another with CMS examples.

---

## 1.4 Server Components vs Client Components

```tsx
// Server Component (default) — runs ONLY on server
// ✅ Can: fetch data, access backend, keep secrets safe, zero client JS
// ❌ Cannot: use hooks, handle events, use browser APIs
export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = await cms.getEntry('blog_post', slug);
  return (
    <article>
      <h1>{post.title}</h1>
      <RichTextRenderer content={post.body} />
      <LikeButton postId={post.uid} initialCount={post.likes} />
    </article>
  );
}

// Client Component — ships JS to browser
'use client';
import { useState } from 'react';

function LikeButton({ postId, initialCount }) {
  const [count, setCount] = useState(initialCount);
  return (
    <button onClick={() => setCount(c => c + 1)}>❤️ {count}</button>
  );
}
```

**Key principle:** Push `'use client'` boundary as deep as possible. Don't make entire pages client components — only the interactive parts.

---

## 1.5 Partial Prerendering (PPR) — Experimental

Combines static and dynamic rendering in a single route:

```tsx
import { Suspense } from 'react';
export const experimental_ppr = true;

export default async function ProductPage({ params }) {
  const { id } = await params;
  return (
    <div>
      {/* Static shell — prerendered, served from CDN */}
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

**Why it matters for CMS sites:** Marketing pages have static CMS content (hero, features) with dynamic personalized sections (recommendations, pricing) — all in one route.

---

## 1.6 React 19 New Hooks

**`useActionState`** (replaces deprecated `useFormState`):
```tsx
'use client';
import { useActionState } from 'react';

function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitForm, { message: '' });
  return (
    <form action={formAction}>
      <input name="email" type="email" />
      <button disabled={isPending}>{isPending ? 'Sending...' : 'Submit'}</button>
      {state.message && <p>{state.message}</p>}
    </form>
  );
}
```

**`useOptimistic`** — optimistic UI updates:
```tsx
const [optimisticTodos, addOptimistic] = useOptimistic(
  todos,
  (state, newTodo) => [...state, { ...newTodo, pending: true }]
);
```

**`useFormStatus`** — now includes `data`, `method`, `action` along with `pending`.

**React Compiler (Experimental):** Auto-optimizes re-renders — no manual `useMemo`/`useCallback`.

---

## 1.7 New APIs in Next.js 15

**`next/form` — Client-Side Navigation for Forms:**
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
// Navigates to /search?q=... via client-side routing — no full page reload
```

**`unstable_after` — Post-Response Tasks:**
```tsx
import { unstable_after as after } from 'next/server';

export default async function Page() {
  const data = await fetchCMSContent();
  after(() => {
    analytics.track('page_view', { page: 'home' });
  });
  return <HomePage data={data} />;
}
```

**`instrumentation.ts` — Now Stable:**
```tsx
export async function register() { /* Init OpenTelemetry, Sentry */ }
export async function onRequestError(err, request, context) {
  await reportToSentry(err, request, context);
}
```

---

## 1.8 Other Notable Changes

- **Turbopack Dev (Stable):** `next dev --turbo` — up to 96% faster Fast Refresh
- **Server Actions Security:** Unused actions auto-removed from bundle; IDs are non-deterministic
- **TypeScript `next.config.ts`:** Native support
- **ESLint 9 support** (backward-compatible with ESLint 8)
- **Static Route Indicator:** Visual indicator during dev
- **Config renames:** `experimental.bundlePagesExternals` → `bundlePagesRouterDependencies`

---

# PART 2: HEADLESS CMS ARCHITECTURE

---

## 2.1 What is Headless CMS

A CMS providing content via APIs (REST/GraphQL) with no built-in frontend.

| Aspect | Traditional (WordPress) | Headless (Contentstack) |
|--------|------------------------|------------------------|
| Frontend | Tightly coupled (PHP) | Decoupled (any framework) |
| Content Delivery | Server-rendered HTML | API (REST/GraphQL) |
| Flexibility | Limited to themes | Full UI control |
| Omnichannel | Difficult | Native (web, mobile, IoT) |
| Scalability | Vertical | Horizontal (CDN + API) |

---

## 2.2 Contentstack Core Concepts

**Hierarchy:** Stacks → Content Types → Entries

- **Stack:** Workspace (like a project)
- **Content Types:** Schema definitions (like database tables)
- **Entries:** Instances of content types (like rows)
- **Global Fields:** Reusable field groups shared across types
- **Modular Blocks:** Flexible, composable content sections
- **Assets:** Media files managed within CMS
- **Environments:** Publishing targets (dev, staging, production)
- **Locales:** Multi-language content management
- **References:** Relationships between entries (like foreign keys)
- **Webhooks:** HTTP callbacks on content events

---

## 2.3 Content Modeling Best Practices

- Design content types around **content purpose**, not page layout
- Use **references** over embedding for reusable content (authors, categories)
- Use **modular blocks** for flexible page builders
- Plan for **localization** from the start (field-level vs entry-level)
- Keep content types **granular** — "Page" with modular blocks beats "Homepage", "About Page"
- Version content independently from code

**Example corporate website model:**
- **Global Fields:** SEO (title, description, OG image), CTA (text, URL, style)
- **Content Types:** Page (modular blocks), Blog Post, Author, Category, Navigation (singleton), Site Settings (singleton)

---

## 2.4 Contentstack Integration with Next.js 15

```tsx
// lib/contentstack.ts
import Contentstack from 'contentstack';

const Stack = Contentstack.Stack({
  api_key: process.env.CS_API_KEY!,
  delivery_token: process.env.CS_DELIVERY_TOKEN!,
  environment: process.env.CS_ENVIRONMENT!,
});

export async function getEntry(contentType: string, slug: string) {
  const result = await Stack.ContentType(contentType)
    .Query()
    .where('url', `/${slug}`)
    .includeReference(['author', 'category'])
    .toJSON()
    .findOne();
  return result;
}

// app/blog/[slug]/page.tsx
import { getEntry } from '@/lib/contentstack';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { slug } = await params; // ← v15: must await
  const post = await getEntry('blog_post', slug);
  if (!post) return {};
  return { title: post.seo?.title || post.title, description: post.seo?.description };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params; // ← v15: must await
  const post = await getEntry('blog_post', slug);
  if (!post) notFound();
  return <Article post={post} />;
}
```

---

## 2.5 Content Delivery API vs Content Management API

| | CDA (Delivery) | CMA (Management) |
|---|---|---|
| Access | Read-only | Full CRUD |
| Caching | CDN-cached, fast | Not cached |
| Token | Delivery Token | Management Token |
| Use case | Frontend production | Preview, migration, admin |
| Rate limits | Higher | Lower |

**Rule:** CDA for production. CMA only for preview/draft mode, content migration, admin tools.

---

## 2.6 Preview & Draft Mode in Next.js 15

```tsx
// app/api/preview/route.ts
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('secret') !== process.env.PREVIEW_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }
  const draft = await draftMode(); // ← v15: must await
  draft.enable();
  redirect(`/blog/${searchParams.get('slug')}`);
}

// In page component
export default async function BlogPost({ params }) {
  const { slug } = await params;
  const { isEnabled: isPreview } = await draftMode();
  const post = isPreview
    ? await fetchFromCMA(slug)  // Management API → draft content
    : await fetchFromCDA(slug); // Delivery API → published content

  return (
    <>
      {isPreview && <div className="bg-yellow-100 p-2 text-center">⚠️ Preview Mode</div>}
      <Article post={post} />
    </>
  );
}
```

---

## 2.7 Content Localization (Multi-Language)

**URL Structure (Best for SEO):** `/en/products/laptop`, `/es/products/laptop`

```tsx
// lib/contentstack.ts
export async function getLocalizedEntry(contentType, slug, locale) {
  return Stack.ContentType(contentType).Query()
    .where('url', `/${slug}`)
    .language(locale)
    .includeFallback() // Falls back to parent locale if missing
    .includeReference(['author'])
    .toJSON().findOne();
}

// middleware.ts — auto-detect and redirect
export function middleware(request) {
  const pathname = request.nextUrl.pathname;
  const hasLocale = LOCALES.some(l => pathname.startsWith(`/${l}`));
  if (hasLocale) return NextResponse.next();

  const locale = request.cookies.get('NEXT_LOCALE')?.value
    || detectFromHeader(request)
    || 'en';
  return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
}
```

**Contentstack caveat:** Localizing an entry creates an independent copy with its own versioning. Master updates don't auto-propagate — use webhook notifications.

**SEO requirements:** `hreflang` tags, unique URLs per language, `<html lang="">`, dynamic sitemaps per locale.

---

## 2.8 Content Versioning & Scheduled Publishing

- **Built-in versioning:** Every save creates a version; compare or revert
- **Scheduled publishing:** Contentstack Publishing Queue with future dates
- **On frontend:** ISR with short revalidation (60-120s) so scheduled content appears quickly; webhook + `revalidateTag()` for instant updates
- **Rollback:** Editor reverts in CMS → webhook fires → page updates in seconds

---

## 2.9 CMS-Driven Page Builder (Modular Blocks)

```tsx
import dynamic from 'next/dynamic';

const blockRegistry: Record<string, React.ComponentType<any>> = {
  hero_banner: dynamic(() => import('@/components/blocks/HeroBanner')),
  feature_grid: dynamic(() => import('@/components/blocks/FeatureGrid')),
  cta_section: dynamic(() => import('@/components/blocks/CTASection')),
  testimonial_carousel: dynamic(() => import('@/components/blocks/Testimonials')),
  faq_accordion: dynamic(() => import('@/components/blocks/FAQ')),
};

export default async function DynamicPage({ params }) {
  const { slug } = await params;
  const page = await cms.getEntry('page', slug.join('/'));
  return (
    <main>
      {page.modular_blocks.map((block, i) => {
        const Component = blockRegistry[block._content_type_uid];
        if (!Component) { console.warn(`Unknown: ${block._content_type_uid}`); return null; }
        return <Component key={`${block._content_type_uid}-${i}`} {...block} />;
      })}
    </main>
  );
}
```

---

# PART 3: COMPONENT ARCHITECTURE & TYPESCRIPT

---

## 3.1 Atomic Design for CMS-Driven Sites

- **Atoms:** Button, Input, Label, Icon
- **Molecules:** SearchBar (Input + Button), Card (Image + Text + Button)
- **Organisms:** Header, Footer, HeroSection, BlogGrid
- **Templates:** Page layouts combining organisms
- **Pages:** Templates filled with CMS data

---

## 3.2 TypeScript Patterns for CMS

```tsx
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
  uid: string; url: string; title: string;
  dimension: { width: number; height: number };
}

type Reference<T> = T & { _content_type_uid: string };

// Generic type-safe fetcher
async function fetchEntry<T>(contentType: string, slug: string): Promise<T | null> {
  try {
    return await Stack.ContentType(contentType).Query()
      .where('url', `/${slug}`).toJSON().findOne() as T;
  } catch { return null; }
}
```

**Key utility types:** `Partial<T>`, `Pick<T, K>`, `Omit<T, K>`, `Record<K, V>`, discriminated unions for CMS block types.

---

## 3.3 Rich Text Renderer for Contentstack JSON RTE

```tsx
const nodeRenderers: Record<string, (node, children) => React.ReactNode> = {
  'doc': (_, children) => <>{children}</>,
  'p': (_, children) => <p className="mb-4 leading-relaxed">{children}</p>,
  'h2': (_, children) => <h2 className="text-2xl font-bold mt-8 mb-3">{children}</h2>,
  'ul': (_, children) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
  'img': (node) => <Image src={node.attrs?.src} alt={node.attrs?.alt} width={800} height={400} />,
  'a': (node, children) => {
    const href = node.attrs?.href || '#';
    return href.startsWith('http')
      ? <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
      : <Link href={href}>{children}</Link>;
  },
};

function renderMark(text, node) {
  let result = text;
  if (node.bold) result = <strong>{result}</strong>;
  if (node.italic) result = <em>{result}</em>;
  if (node.code) result = <code className="bg-gray-100 px-1 rounded">{result}</code>;
  return result;
}
```

---

# PART 4: PERFORMANCE & CORE WEB VITALS

---

## 4.1 Core Web Vitals — Numbers to Know

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| **INP** (Interaction to Next Paint) | ≤ 200ms | ≤ 500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | > 0.25 |

---

## 4.2 Optimization Strategies by Metric

**LCP fixes:** `priority` on hero `<Image>`, preload fonts, ISR/SSG over SSR, Contentstack image transformations (format/quality/resize via URL params), avoid client-side data fetching above the fold.

**CLS fixes:** Explicit `width`/`height` on images, `aspect-ratio` CSS, reserve space for dynamic content, never inject content above existing content.

**INP fixes:** `React.lazy()` + `next/dynamic` for code splitting, `useTransition` for non-urgent updates, Web Workers for heavy computation, debounce expensive handlers.

---

## 4.3 CMS Image Optimization

```tsx
import Image from 'next/image';

export function CMSImage({ asset, width, height, priority }) {
  const optimizedUrl = `${asset.url}?auto=webp&quality=80${width ? `&width=${width}` : ''}`;
  return (
    <Image
      src={optimizedUrl}
      alt={asset.title}
      width={width || asset.dimension?.width || 800}
      height={height || asset.dimension?.height || 600}
      priority={priority}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
    />
  );
}

// next.config.ts
const nextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: 'images.contentstack.io' }] },
};
```

---

## 4.4 Handling 10K+ Pages — Build Time Optimization

```tsx
export async function generateStaticParams() {
  const topPages = await cms.getEntries('page', { limit: 200, order: '-pageviews' });
  return topPages.map(p => ({ slug: p.url.split('/').filter(Boolean) }));
}
// Remaining pages generate on first visit via ISR
```

| Approach | Pages Built | Build Time |
|----------|------------|------------|
| Build all 10,000 | 10,000 | 30-45 min |
| Build top 200 + ISR | 200 | 2-3 min |

---

# PART 5: SEO & ACCESSIBILITY

---

## 5.1 SEO with Next.js 15 Metadata API

```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getEntry('blog_post', slug);
  return {
    title: post.seo_title || post.title,
    description: post.meta_description,
    openGraph: { title: post.title, images: [{ url: post.featured_image.url }], type: 'article' },
    alternates: { canonical: `https://example.com/blog/${slug}` },
  };
}
```

---

## 5.2 Dynamic Sitemap from CMS

```tsx
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await fetchEntries('blog_post', { tags: ['sitemap'] });
  return [
    { url: 'https://example.com', lastModified: new Date(), priority: 1.0 },
    ...posts.map(p => ({
      url: `https://example.com/blog${p.url}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly', priority: 0.7,
    })),
  ];
}
```

---

## 5.3 Structured Data (JSON-LD)

```tsx
export function ArticleJsonLd({ post, url }) {
  const schema = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: post.title, image: post.featured_image?.url,
    datePublished: post.publish_date, dateModified: post.updated_at,
    author: { '@type': 'Person', name: post.author?.name },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
```

---

## 5.4 Accessibility (WCAG) Patterns

- **Semantic HTML:** `<main>`, `<nav>`, `<article>`, `<section>` — single `<h1>` per page
- **Skip navigation:** `<a href="#main" className="sr-only focus:not-sr-only">Skip to main</a>`
- **Images:** Mandatory alt text in CMS; decorative images get `alt=""`
- **Contrast:** 4.5:1 minimum ratio
- **Keyboard:** Full Tab navigation, focus trapping in modals, Escape key handling
- **ARIA:** `role="alert"`, `aria-live="polite"` for dynamic content
- **Testing:** axe DevTools, Lighthouse, NVDA/VoiceOver, `jest-axe`

---

# PART 6: CI/CD & DEPLOYMENT

---

## 6.1 CI/CD Pipeline Design

```
Developer pushes code
  → GitHub Actions: Lint → Type check → Unit tests → Build → E2E tests → Lighthouse CI
  → Vercel auto-deploys: PR → Preview | Main → Production

CMS content changes:
  → Contentstack webhook → /api/revalidate → revalidateTag() → Pages refresh
```

---

## 6.2 Webhook Revalidation Pipeline

```tsx
// app/api/revalidate/route.ts
import { revalidateTag, revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const headersList = await headers();
  if (headersList.get('x-webhook-secret') !== process.env.WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const payload = await request.json();
  if (payload.content_type?.uid) revalidateTag(payload.content_type.uid);
  if (payload.entry?.url) revalidatePath(payload.entry.url);
  revalidatePath('/');
  return Response.json({ revalidated: true, timestamp: Date.now() });
}
```

**`revalidateTag` vs `revalidatePath`:** Tags invalidate ALL pages using that content type (broader). Path invalidates one specific URL. Prefer tags for CMS webhooks.

---

## 6.3 Environment-Specific CMS Configuration

```tsx
const config = {
  development: { token: process.env.CS_PREVIEW_TOKEN, env: 'development', revalidate: 10 },
  staging: { token: process.env.CS_STAGING_TOKEN, env: 'staging', revalidate: 30 },
  production: { token: process.env.CS_PRODUCTION_TOKEN, env: 'production', revalidate: 60 },
};
```

---

# PART 7: PRODUCTION CHALLENGES & SOLUTIONS

---

## 7.1 Slow CMS API — 3-Layer Defense

**Layer 1 — ISR Caching:** Most users hit cached pages, never touching the API.
**Layer 2 — Timeout + Fallback:** 5-second AbortController timeout → stale cache → default content.
**Layer 3 — Parallel Fetching:** `Promise.all([header, products, footer])` instead of sequential.

---

## 7.2 Real-Time Inventory on Cached Pages

**Architecture:** Static CMS content (ISR) + Dynamic inventory (client-side SWR polling every 30s).

```tsx
// Server Component — static shell
<ProductDetails product={product} />
<Suspense fallback={<InventorySkeleton />}>
  <LiveInventory productId={product.uid} />  {/* Client component */}
</Suspense>

// Client Component — real-time
'use client';
const { data } = useSWR(`/api/inventory/${productId}`, fetcher, {
  refreshInterval: 30000, revalidateOnFocus: true,
});
```

**Why polling over WebSocket?** Simpler, cheaper, scales better. 30-second delay is acceptable for inventory. WebSocket is for chat, live auctions, collaborative editing.

---

## 7.3 Stale Content After CMS Publish

**Debug checklist:** CMS publish status → Webhook delivery logs → `/api/revalidate` response → Cache headers (`curl -I`) → Vercel function logs → Emergency: deploy no-op change to force rebuild.

---

## 7.4 Build Failures — API Rate Limiting

**Fix:** Batch API calls with pagination + delay:
```tsx
while (true) {
  const batch = await fetch(`${CMS_URL}/entries?limit=100&skip=${skip}`);
  allProducts.push(...batch.entries);
  if (batch.entries.length < 100) break;
  skip += 100;
  await new Promise(r => setTimeout(r, 100)); // Respect rate limits
}
```

---

## 7.5 Performance Monitoring (3 Levels)

**Level 1 — Web Vitals:** `useReportWebVitals` → send LCP/INP/CLS to analytics
**Level 2 — CMS API Health:** `performance.now()` timing on every CMS fetch; alert if > 2 seconds
**Level 3 — Error Tracking:** `instrumentation.ts` + Sentry for all server errors

| Metric | Alert Threshold |
|--------|----------------|
| LCP | > 2.5s |
| CLS | > 0.1 |
| CMS API response | > 2 seconds |
| Webhook delivery | Any failure |
| Build time | > 5 minutes |
| Error rate | > 1% |

---

# PART 8: SYSTEM DESIGN — E-COMMERCE ARCHITECTURE

---

## 8.1 Rendering Strategy Per Page Type

| Page | Strategy | Revalidation | LCP | Why |
|------|----------|-------------|-----|-----|
| Homepage | ISR | 24h | ~800ms | Updated weekly |
| Product List | ISR + client filters | 1h | ~1.2s | Hourly price changes |
| Product Detail | ISR (on-demand) | 2h | ~1.5s | Pre-build top 1K, ISR rest |
| Blog | SSG | Never | ~600ms | Rarely changes |
| Checkout | SSR | Per-request | 1-2s | User-specific, real-time |
| Dashboard | Client-side | Per-request | ~1s+ | Personal, real-time |

---

## 8.2 Multi-Language & Multi-Currency (15 Countries)

**URL structure:** `/en-US/products/laptop`, `/es-MX/products/laptop`

**Key insight:** Language and currency are separate concerns. A Spanish speaker in the US needs Spanish UI with USD pricing.

**Implementation:**
1. Contentstack: 15 locales with fallback chains
2. Next.js: `app/[locale]/...` dynamic routing
3. Middleware: Detect from cookie → Accept-Language → default
4. Currency: Separate API route converting base price to regional currency
5. SEO: `hreflang` tags, unique URLs per locale, `<html lang="">`

---

## 8.3 Architecture Decision Flowchart

```
Is the page user-specific?
├── YES → Needs server auth?
│         ├── YES → SSR (Checkout)
│         └── NO  → Client-Side (Dashboard)
└── NO  → Content change frequency?
          ├── RARELY → SSG (Blog)
          ├── HOURLY → ISR (Products, Homepage)
          └── REAL-TIME → SSR or Client-Side (Inventory widget)
```

---

# PART 9: INTERVIEW Q&A (40 QUESTIONS)

---

## SECTION A: Architecture & System Design

### Q1: How would you architect a multi-brand, multi-locale website using Next.js and a headless CMS?

**A:** Single Next.js codebase with dynamic routing. Each brand gets its own CMS environment/stack with shared global fields. Locales handled at entry level with fallback chains. App Router route groups separate brand logic. Shared component library with brand-specific theming (CSS variables/Tailwind per brand). Middleware detects locale from headers/cookies and rewrites. ISR + webhooks keep content fresh per-brand.

### Q2: How do you handle content previews for editors?

**A:** Next.js Draft Mode with secret token via API route. CMS sends preview request → enables draft mode cookie → data-fetching switches to CMA (Management API) for draft content. Contentstack Live Preview SDK uses postMessage for real-time updates. Vercel PR preview deployments give editors dedicated URLs.

### Q3: Static + dynamic content on same page — how?

**A:** PPR (Partial Prerendering). Static CMS content in the shell, dynamic sections in `<Suspense>` boundaries. Shell served from CDN instantly; dynamic parts stream in parallel. Tag-based ISR revalidation via CMS webhooks for static content; `cache: 'no-store'` for dynamic pricing.

### Q4: Server vs Client Components — decision process?

**A:** Default to Server Components (zero client JS, direct API access). Only add `'use client'` for: hooks (`useState`/`useEffect`), event handlers, browser APIs. Push the boundary as deep as possible — only the interactive leaf component becomes client, not the whole page.

### Q5: How would you implement a CMS page builder?

**A:** Contentstack Modular Blocks + frontend component registry mapping `_content_type_uid` to React components. Editors compose pages by picking blocks; frontend iterates and renders dynamically. New blocks only need CMS type + React component — no routing changes.

### Q6: Error handling in Next.js 15 App Router?

**A:** File-based: `error.tsx` (must be `'use client'`) at route levels for granular catching. `global-error.tsx` for root layout errors. `not-found.tsx` with `notFound()` function. Error component receives `error` and `reset` props.

---

## SECTION B: Headless CMS Deep Dive

### Q7: Design content models for a corporate website?

**A:** Granular, content-focused types. Global Fields (SEO, CTA). Content Types: Page (modular blocks), Blog Post (references to Author + Category), Author, Category, Navigation (singleton), Site Settings (singleton). References enable reuse; modular blocks give editors flexibility.

### Q8: Content localization with Contentstack?

**A:** Entry-level localization with fallback chains. URL-based routing (`/[locale]/...`). Middleware auto-detects. CMS `includeFallback()` in queries. Important: localized entries are independent copies — webhook notifications needed for translation tracking.

### Q9: CDA vs CMA — when to use each?

**A:** CDA for all production (read-only, CDN-cached, fast). CMA only for preview/draft mode, migration scripts, admin tools.

### Q10: WordPress to Contentstack migration?

**A:** Phases: Content audit → Model design (improve, don't replicate) → Node.js migration script using CMA (handle rate limits) → 301 redirect map → Validation → SEO monitoring post-migration.

### Q11: Content versioning and scheduled publishing?

**A:** Built-in versioning in Contentstack. Scheduled publishing via Publishing Queue. ISR + webhook revalidation for instant frontend updates. Version selector in preview environment using CMA.

---

## SECTION C: Performance Optimization

### Q12: Diagnose and fix poor LCP on CMS page?

**A:** Lighthouse + DevTools to identify LCP element. Common CMS causes: unoptimized hero image (fix: `next/image` + priority + CMS transforms), slow API (fix: ISR caching), render-blocking CSS (fix: inline critical), large SDK bundle (fix: lazy-load, use REST directly).

### Q13: Optimize for Core Web Vitals?

**A:** LCP: priority images, preload fonts, ISR over SSR, CMS image transforms. CLS: explicit dimensions, reserved space, no late injection. INP: code splitting, `useTransition`, lean handlers. Measure: Vercel Analytics + Lighthouse CI.

### Q14: 10K+ pages causing 30-min builds?

**A:** Pre-build top 200 only via `generateStaticParams`. Rest generate on-demand via ISR. Webhook revalidation instead of time-based. Batch API calls with pagination.

### Q15: Efficient CMS image handling?

**A:** Wrapper around `next/image` applying Contentstack URL transforms (auto-WebP, quality, resize). Configure `remotePatterns` in config. Use `sizes` prop for responsive. `priority` for above-fold.

---

## SECTION D: Next.js 15 Specific

### Q16: Major breaking changes in Next.js 15?

**A:** (1) Async Request APIs — `cookies()`, `headers()`, `params`, `searchParams` return Promises. Enables PPR. (2) Caching flipped — fetch uncached by default. Explicit opt-in required. More predictable.

### Q17: Migrate Next.js 14 to 15?

**A:** Run codemod → fix `@next-codemod-error` comments → audit fetch caching (add explicit cache options) → replace `useFormState` with `useActionState` → test client router cache behavior → update config names.

### Q18: `unstable_after` — use case?

**A:** Post-response task execution. Analytics logging, audit trails, cache warming, search index updates — all without adding user-facing latency.

### Q19: `next/form` — why introduced?

**A:** Enhances HTML forms with client-side navigation. Search forms navigate via SPA routing instead of full page reload. Prefetches target route layout.

### Q20: React 19 Server Actions in Next.js 15?

**A:** `'use server'` functions with improved security — dead-code elimination, non-deterministic IDs. Use `useActionState` (replaces `useFormState`) with `isPending` for loading states.

---

## SECTION E: Practical Coding & Problem Solving

### Q21: Reusable CMS data fetching utility?

**A:** Generic TypeScript function with locale support, configurable revalidation, tag-based caching, error handling. Uses Contentstack SDK with proper typing.

### Q22: Rich text renderer for CMS JSON?

**A:** Node-type to React-component mapping. Handle marks (bold/italic/code), elements (p/h2/ul/img/a), internal vs external links. `next/image` for embedded images.

### Q23: On-demand revalidation via webhook?

**A:** Secure API route: verify webhook signature → parse content type and entry URL → `revalidateTag()` for content type + `revalidatePath()` for specific page + always revalidate homepage.

### Q24: Search feature for CMS content?

**A:** Scale-dependent: Small → Contentstack built-in search. Medium → Fuse.js client-side with build-time JSON index. Large → Algolia/MeiliSearch synced via webhooks. Use `next/form` for SPA search navigation.

---

## SECTION F: SEO & Accessibility

### Q25: Dynamic sitemap from CMS?

**A:** `app/sitemap.ts` fetching all CMS entries with proper `lastModified`, `changeFrequency`, `priority`. Tagged fetch for webhook revalidation.

### Q26: Structured data (JSON-LD)?

**A:** Component generating Article schema from CMS data. Injected via `<script type="application/ld+json">`. Include headline, image, dates, author, publisher.

### Q27: WCAG accessibility requirements?

**A:** Semantic HTML, skip navigation, mandatory CMS alt text, 4.5:1 contrast, keyboard navigation, focus trapping, ARIA for dynamic content. Testing with axe, Lighthouse, screen readers, `jest-axe`.

---

## SECTION G: CI/CD & Agile

### Q28: Ideal CI/CD pipeline?

**A:** GitHub Actions: lint → type-check → tests → build → E2E (Playwright) → Lighthouse CI. Vercel: PR previews + production deploys. CMS: webhook → revalidation API.

### Q29: Agile participation as senior dev?

**A:** Sprint Planning: break down stories, flag CMS dependencies, estimate with testing/a11y consideration. Standups: focused updates, escalate blockers. Retros: propose process improvements (Lighthouse CI, Storybook). Code Reviews: architecture, caching, a11y, TypeScript. Refinement: flag tech debt, propose spikes.

---

## SECTION H: Behavioral & Situational

### Q30: Performance optimization story (STAR)?

**A:** **S:** CMS marketing site with 4.8s LCP, 45% bounce rate. **T:** Bring LCP under 2.5s. **A:** Profiled → found 2.4MB hero image → implemented `next/image` + CMS transforms → switched SSR to ISR → code-split below-fold carousel → preloaded fonts. **R:** LCP 4.8s → 1.7s. Bounce rate 45% → 28%. Became team standard.

### Q31: Technical disagreement handling?

**A:** Data over opinions. Built POC comparing approaches. Measured bundle size difference (60% less JS with Server Components). Presented at team tech talk. Compromised with documented guidelines in ADR.

### Q32: Mentoring junior developers?

**A:** Code reviews as teaching (explain WHY). Pair programming for complex features. Internal wiki with patterns. Assign meaningful features with guided architecture decisions.

---

## SECTION I: Advanced & Differentiator

### Q33: A/B testing with CMS + Next.js?

**A:** Middleware assigns bucket (cookie). Page reads bucket header → fetches variant content from CMS. With PPR, static shell shared, only variant sections differ.

### Q34: Content personalization?

**A:** Layered: static shell (CDN) + edge personalization (middleware) + client-side personalized sections. CMS stores personalization rules; frontend evaluates at render time. PPR makes this elegant.

### Q35: Design system with CMS integration?

**A:** Token-based: Tailwind config + CMS Global Fields. Editors pick predefined styles (primary/secondary), mapped to design tokens. Monorepo with Turborepo, documented in Storybook.

### Q36: Production incident — content not updating?

**A:** Systematic: CMS publish status → webhook logs → revalidation API → cache headers (`curl -I`) → Vercel logs → emergency deploy. Prevention: monitor webhooks, add manual "Cache-Bust" button.

### Q37: `revalidateTag` vs `revalidatePath`?

**A:** Tag: invalidates ALL pages using that content type (broader). Path: one specific URL. Prefer tags for CMS webhooks — one content change affects multiple pages.

### Q38: Environment-specific CMS config?

**A:** Different tokens per env. Preview token in dev only. Shorter revalidation in dev. Separate Contentstack environments (dev/staging/prod).

### Q39: SEO when editors change URL slugs?

**A:** Store old slugs in CMS "Previous URLs" field. Middleware checks redirect map → 301 redirect. Submit updated sitemap. Monitor 404s.

### Q40: Questions to ask the interviewer?

**A:** What CMS are you using? How many locales/brands? Vercel or self-hosted? How do editors preview? Biggest performance challenge? Pages Router or App Router? Team size? Tech debt allocation?

---

# PART 10: QUICK REVISION CHECKLISTS

---

## 10.1 Night-Before the Interview Checklist

- [ ] Can I explain SSR vs SSG vs ISR vs PPR with CMS examples?
- [ ] Can I write `await params`, `await cookies()`, `await headers()` correctly?
- [ ] Do I know why Next.js 15 changed caching defaults?
- [ ] Can I explain Contentstack content types, entries, references, modular blocks?
- [ ] Can I describe CMS → webhook → revalidation pipeline?
- [ ] Can I write a component registry for modular blocks?
- [ ] Can I explain LCP, INP, CLS and give specific fixes?
- [ ] Do I have a STAR story about performance optimization?
- [ ] Can I explain Server vs Client Components and when to use each?
- [ ] Can I code a `fetchEntry` utility with TypeScript generics?
- [ ] Do I know the difference between `revalidateTag` and `revalidatePath`?
- [ ] Can I explain preview/draft mode implementation?
- [ ] Do I have thoughtful questions to ask the interviewer?

---

## 10.2 One-Line Strategy Reference Table

| Challenge | Strategy |
|-----------|----------|
| Slow CMS API | ISR caching + timeout/fallback + `Promise.all` |
| 10K+ products to build | Pre-build top 200, ISR for rest |
| Content not updating | Webhook → `revalidateTag()` |
| Real-time inventory | ISR page + client-side SWR polling (30s) |
| Multi-language | URL-based locale routing + CMS fallback chains |
| Performance monitoring | Web Vitals + CMS API health + Sentry |
| Stale content | Webhook retries + CDN purge + cache headers |
| Rate limiting on build | Paginated batch fetching with delays |
| Preview not working | Draft Mode + CMA for draft content |
| SEO slug changes | 301 redirects via middleware + sitemap update |

---

## 10.3 Questions to Ask the Interviewer

1. "What headless CMS are you currently using and are there plans to migrate?"
2. "How many locales/brands does the site serve? What's the content volume?"
3. "Are you on Vercel, or self-hosting? What does the deployment pipeline look like?"
4. "How do content editors currently preview changes?"
5. "What's the biggest frontend performance challenge right now?"
6. "Pages Router or App Router? Migration plans?"
7. "How large is the frontend team? How are architectural decisions made?"
8. "Is there dedicated time for tech debt and improvement?"

---

*Remember: For 5.5+ years, interviewers want TRADE-OFF analysis and WHY — not just WHAT. Lead with architecture thinking, back up with code. Good luck, Vikrant!*
