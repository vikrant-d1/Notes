# Next.js Interview Preparation

## 1.1 Cache Components / `use cache`

### Q: What is the explicit cache model in modern Next.js?

**Answer:** Modern Next.js provides explicit caching controls so developers can decide what computation/data should be cached rather than relying only on implicit behavior.

Know:

- `"use cache"`
- `cacheLife`
- `cacheTag`
- `revalidateTag`
- `revalidatePath`
- `updateTag`
- `refresh`
- Cache boundaries
- Cache invalidation after mutations

> Interview point: Always discuss **what is cached, where it is cached, how long it lives, and how it is invalidated**.

---

## 1.2 Request Memoization vs Data Cache

### Q: What is the difference?

**Answer:**

| Feature | Request Memoization | Data Cache |
|---|---|---|
| Scope | One render/request lifecycle | Across requests |
| Purpose | Avoid duplicate work | Persist reusable data |
| Example | Same `fetch()` called by components | Product API cached for 60 sec |
| Lifetime | Request/render scoped | Configurable |
| Main benefit | Deduplication | Performance/scalability |

The existing notes identify request memoization as same-render deduplication and Data Cache as persistent server-side response caching. fileciteturn1file4L273-L280

---

## 1.3 Full Route Cache vs Data Cache

### Q: If I cache API data, does that automatically mean the whole page is cached?

**Answer:** Not necessarily. Data caching and route caching are separate concepts. A page can use cached data while still having dynamic rendering behavior depending on the route and dynamic inputs.

---

## 1.4 Router Cache

### Q: What is Router Cache?

**Answer:** Router Cache is client-side caching of previously visited route segments/RSC data used to make navigation and back/forward interactions faster.

The existing notes describe Router Cache as a browser-side cache for previously visited pages. fileciteturn1file4L273-L280

---

## 1.5 Cache Invalidation Strategy

### Q: What is more important than adding a cache?

**Answer:** Designing the invalidation strategy.

Ask:

1. What data is cached?
2. What is the TTL?
3. What event makes the data stale?
4. Who invalidates it?
5. What happens if invalidation fails?
6. Can stale data be served safely?
7. How do multiple instances share the cache?

---

## 1.6 Cache Stampede

### Q: What is cache stampede?

**Answer:** A cache stampede occurs when a popular cache key expires and many requests simultaneously hit the database/API to rebuild the same value.

Solutions:

- Request coalescing
- Distributed locks
- Jittered TTLs
- Stale-while-revalidate
- Background refresh
- Warm-up
- Redis locks
- Single-flight pattern

---

## 1.7 Cache Penetration

### Q: What is cache penetration?

**Answer:** Repeated requests for data that does not exist bypass the cache and continuously hit the database.

Solutions:

- Cache negative results briefly
- Validate identifiers
- Rate limiting
- Bloom filters for very large datasets
- Request throttling

---

## 1.8 Cache Avalanche

### Q: What is cache avalanche?

**Answer:** A large number of cache entries expire at approximately the same time, causing a sudden load spike on the database.

Solutions:

- TTL jitter
- Staggered expiration
- Cache warming
- Multi-level caching
- Rate limiting
- Background refresh

---

## 1.9 HTTP Cache Headers

Know:

```http
Cache-Control
ETag
Last-Modified
Expires
Vary
Age
Surrogate-Control
```

### Q: What is the difference between browser cache and server cache?

**Answer:** Browser cache stores responses on the client. Server/application caches store reusable data or computation on the server. CDN caches sit between clients and origin infrastructure.

---

## 1.10 CDN Cache

### Q: Why should static/public Next.js content be served through a CDN?

**Answer:** A CDN serves content closer to users, reduces origin requests, improves latency, and absorbs traffic spikes.

---

## 1.11 Cache Key Design

### Q: What makes a good cache key?

**Answer:**

A cache key should uniquely represent every input that changes the result.

Bad:

```text
products
```

Better:

```text
products:v1:category:shoes:page:2:sort:price_asc
```

For personalized data:

```text
user:123:orders:page:1
```

Never put secrets or sensitive data directly into cache keys.

---

## 1.12 Cache Serialization

### Q: What should you consider when caching objects?

**Answer:**

- Serialization/deserialization cost
- Object size
- Dates
- BigInt
- Undefined values
- Version compatibility
- Compression
- JSON vs structured serialization
- Security of cached values

---

## 1.13 Cache Consistency

### Q: What does cache consistency mean?

**Answer:** It means the cached representation does not violate the application's freshness and correctness requirements.

Common strategies:

- Cache-aside
- Write-through
- Write-behind
- Read-through
- Explicit invalidation
- TTL-based expiration

---

## 1.14 Database Query Caching

### Q: Should you cache every database query?

**Answer:** No.

Cache queries when:

- Reads are frequent
- Data changes relatively slowly
- Query is expensive
- Stale data is acceptable
- Cache invalidation is manageable

Avoid caching when:

- Data is highly personalized
- Data must be strongly consistent
- Query is cheap
- Cache memory cost is too high

---

## 1.15 Dynamic Rendering Boundaries

Know how these can affect rendering/caching:

- `cookies()`
- `headers()`
- Authentication
- Search parameters
- User-specific data
- Request-specific APIs
- Dynamic route parameters

---

## 1.16 Streaming and Suspense

Know:

- Streaming SSR
- Suspense boundaries
- Loading UI
- Independent slow components
- Waterfall prevention
- Error boundaries
- Streaming failure handling

The existing notes already identify `loading.tsx`, `error.tsx`, and Suspense-based loading patterns. fileciteturn1file1L90-L114

---

## 1.17 React Server Components Payload

### Q: What is the RSC payload?

**Answer:** It is the serialized representation used by React/Next.js to communicate Server Component output and update the client-side React tree without sending all server-side component JavaScript.

Interview topics:

- RSC payload size
- Client boundaries
- `"use client"`
- Serialization
- Server-only modules
- Hydration cost

---

## 1.18 Server-Only and Client-Only Modules

Know:

```ts
import "server-only";
```

and client-only boundaries.

Question:

> How do you prevent a secret-containing server module from accidentally being imported into a Client Component?

Answer:

Use server-only boundaries, environment variable discipline, and architectural separation between server and client modules.

---

## 1.19 Server Actions Security

Never assume a Server Action is automatically authorized.

Validate:

- Authentication
- Authorization
- Input schema
- CSRF/security model where applicable
- Rate limits
- Ownership of resources
- Business rules

---

## 1.20 Rate Limiting

Senior interviews may ask:

> How would you rate-limit login, OTP, search, or expensive API requests?

Possible solutions:

- Redis token bucket
- Redis sliding window
- CDN/WAF rate limits
- Per-IP limits
- Per-user limits
- Route-specific limits
- Distributed counters

---

# 2. Caching in Next.js — Complete Mental Model

A useful interview model is:

```text
Browser
   |
   v
CDN / HTTP Cache
   |
   v
Next.js Server
   |
   +--> Router Cache
   |
   +--> Full Route Cache
   |
   +--> Data Cache
   |
   +--> Application/Redis Cache
   |
   v
Database / External API
```

The existing notes identify four Next.js cache layers:

1. Request Memoization
2. Data Cache
3. Full Route Cache
4. Router Cache

fileciteturn1file0L52-L60

For production systems, also think about:

5. Browser HTTP cache
6. CDN cache
7. Redis/application cache
8. Database-level caching/query optimization

---

# 3. How to Manage Cache in Next.js

## 3.1 Cache a Fetch for a Fixed Time

```ts
export async function getProducts() {
  const response = await fetch(
    "https://api.example.com/products",
    {
      next: {
        revalidate: 60,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return response.json();
}
```

Use this when:

- Data changes periodically
- A small amount of staleness is acceptable
- You want to reduce API/database traffic

The existing notes use the same `revalidate` pattern for ISR/data freshness. fileciteturn1file3L195-L212

---

## 3.2 Force Fresh Data

```ts
const response = await fetch(
  "https://api.example.com/profile",
  {
    cache: "no-store",
  }
);
```

Use for:

- Highly dynamic information
- User-specific information
- Data where stale results are unacceptable

---

## 3.3 Route-Level Revalidation

```ts
export const revalidate = 60;
```

Use when the route's data can generally use the same revalidation interval.

---

## 3.4 Tag-Based Cache Invalidation

Conceptually:

```ts
const response = await fetch(
  "https://api.example.com/products",
  {
    next: {
      tags: ["products"],
    },
  }
);
```

After changing a product:

```ts
revalidateTag("products");
```

The existing notes describe `revalidateTag()` as invalidating fetches associated with a tag. fileciteturn1file5L361-L363

---

## 3.5 Path-Based Invalidation

```ts
revalidatePath("/products");
```

Use when a specific route needs to be refreshed after a mutation.

---

## 3.6 Mutation + Invalidation Pattern

```ts
"use server";

export async function updateProduct(id: string, data: ProductInput) {
  await db.product.update({
    where: { id },
    data,
  });

  revalidatePath("/products");
  revalidateTag("products");
}
```

Interview answer:

> Update the source of truth first, then invalidate the affected cache entries. Prefer narrow invalidation rather than clearing the entire cache.

---

## 3.7 Cache Tags Should Represent Data Domains

Good:

```text
products
product:123
categories
orders:user:123
```

Bad:

```text
everything
```

A good tag strategy allows precise invalidation.

---

# 4. Caching Patterns

## 4.1 Cache-Aside

```text
Request
  |
  v
Check Redis
  |
  +-- HIT --> return
  |
  +-- MISS
        |
        v
      Database
        |
        v
      Redis.set()
        |
        v
      return
```

Example:

```ts
const key = `product:${id}`;

const cached = await redis.get(key);

if (cached) {
  return JSON.parse(cached);
}

const product = await db.product.findUnique({
  where: { id },
});

if (product) {
  await redis.set(
    key,
    JSON.stringify(product),
    { EX: 300 }
  );
}

return product;
```

---

## 4.2 Cache-Aside with Negative Caching

```ts
const cached = await redis.get(key);

if (cached === "__NOT_FOUND__") {
  return null;
}
```

Use a short TTL for negative results.

---

## 4.3 Stale-While-Revalidate

Concept:

```text
Fresh cache
   |
   v
Return immediately

Stale but acceptable
   |
   +--> Return stale value
   |
   +--> Refresh in background
```

Useful for:

- Product catalog
- CMS content
- Navigation
- Recommendations
- Public configuration

---

## 4.4 Multi-Level Cache

```text
L1: Request memory
       |
       v
L2: Next.js cache
       |
       v
L3: Redis
       |
       v
L4: Database
```

Do not blindly add every layer. Each layer increases complexity and invalidation requirements.

---

## 4.5 Cache Warm-Up

For high-traffic keys:

```text
Deployment
   |
   v
Warm popular cache keys
   |
   v
Traffic arrives
   |
   v
Most requests are cache hits
```

---

# 5. Cache Invalidation

## Q: When should cache be invalidated?

**Answer:**

After a mutation that changes cached data.

Examples:

```text
Create product
   -> invalidate products

Update product 123
   -> invalidate product:123
   -> invalidate products listing

Delete category
   -> invalidate category
   -> invalidate affected product listings
```

---

## Q: TTL vs Explicit Invalidation?

| Strategy | Advantage | Drawback |
|---|---|---|
| TTL | Simple | Can serve stale data |
| Explicit | Fresh after mutation | More complexity |
| TTL + explicit | Strong practical approach | More moving parts |

For most production applications, use both where appropriate.

---

# 6. Redis + Next.js

## 6.1 Why Redis?

Use Redis for:

- Frequently accessed data
- Session data
- Rate limiting
- Distributed locks
- Short-lived computed values
- API response caching
- Feature/configuration caches

Do not use Redis as the primary source of truth for important business data.

---

## 6.2 Redis Cache Helper

```ts
import { redis } from "@/lib/redis";

export async function getCache<T>(key: string) {
  const value = await redis.get(key);

  if (!value) {
    return null;
  }

  return JSON.parse(value) as T;
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds = 300
) {
  await redis.set(
    key,
    JSON.stringify(value),
    { EX: ttlSeconds }
  );
}

export async function deleteCache(key: string) {
  await redis.del(key);
}
```

---

## 6.3 Production Cache-Aside Helper

```ts
export async function getProduct(id: string) {
  const key = `product:${id}`;

  const cached = await getCache<Product>(key);

  if (cached) {
    return cached;
  }

  const product = await db.product.findUnique({
    where: { id },
  });

  if (product) {
    await setCache(key, product, 300);
  }

  return product;
}
```

---

## 6.4 Avoid Cache Stampede

Use a lock:

```text
Request A -> cache miss -> acquire lock -> DB
Request B -> cache miss -> sees lock -> wait/retry
Request C -> cache miss -> sees lock -> wait/retry

A -> fills cache
B/C -> read cache
```

---

## 6.5 Redis Failure Strategy

### Q: Redis is down. Should the application fail?

**Answer:** Usually not for non-critical caching.

Use graceful degradation:

```text
Redis available
    -> cache-aside

Redis unavailable
    -> log/metric
    -> query source of truth
    -> continue request
```

But for security-critical session state, distributed locks, or rate limiting, define explicit failure behavior.

---

# 7. HTTP/CDN/Browser Caching

## Q: Explain the complete cache path.

```text
Browser Cache
    |
    | miss
    v
CDN
    |
    | miss
    v
Next.js / Origin
    |
    | miss
    v
Redis
    |
    | miss
    v
Database
```

The goal is to stop requests as early as safely possible.

---

## Q: What is ETag?

**Answer:** ETag identifies a particular representation of a resource. A client can send `If-None-Match`; if the resource has not changed, the server can return `304 Not Modified`.

---

## Q: Why is `Vary` important?

**Answer:** `Vary` tells caches which request headers affect the response. Incorrect `Vary` behavior can cause one user's representation to be incorrectly served to another user.

---

# 8. Senior Interview Questions

## Q1. Why can a user still see stale data after `revalidatePath()`?

**Answer:** There may be multiple cache layers. Consider:

- Data Cache
- Full Route Cache
- Router Cache
- CDN
- Browser cache
- Redis/application cache

Invalidate the correct layer and verify whether the client has already prefetched/cached the route.

---

## Q2. How would you design caching for an e-commerce product page?

**Answer:**

- Public product details: cache
- Product listing: cache
- Inventory/availability: short TTL or fresh query
- User cart: user-specific, do not use shared public cache
- Payment status: fresh/strongly consistent
- Reviews: cache with tag invalidation
- Pricing: cache only if business rules permit it

---

## Q3. How would you cache a dashboard?

**Answer:**

Separate data by freshness:

```text
User profile      -> 5 min
Analytics         -> 60 sec
Live notifications -> no-store / realtime
Static metadata   -> hours
```

Avoid caching the entire personalized dashboard as one shared response.

---

## Q4. How would you cache search results?

**Answer:**

Use a normalized key:

```text
search:v2:q=iphone:page=1:sort=price
```

Use a short TTL and enforce:

- Query normalization
- Maximum query length
- Rate limiting
- Pagination limits

---

## Q5. What should never be shared through a public cache?

**Answer:**

Potentially sensitive user-specific responses such as:

- Private profile data
- Payment details
- Private orders
- Authorization decisions
- Account-specific pricing unless carefully keyed
- Tokens/secrets

---

# 9. Scenario-Based Questions

## Scenario 1 — Product page shows old price

**Question:** Product price changed in DB, but users still see the old price.

**Answer:**

Check in order:

1. Browser cache
2. Router Cache
3. CDN
4. Full Route Cache
5. Data Cache
6. Redis
7. API cache
8. Database

Then identify the actual stale layer and invalidate only that layer.

---

## Scenario 2 — Product API suddenly receives 20x traffic

**Answer:**

Check:

- Cache hit ratio
- TTL expiration
- Cache stampede
- CDN hit ratio
- Recent deployment
- Cache key changes
- Bot traffic
- Retry storms

Mitigate with:

- Request coalescing
- Redis
- CDN caching
- Rate limiting
- Longer/staggered TTL
- Background refresh

---

## Scenario 3 — Redis goes down

**Answer:**

For non-critical cache:

```text
Redis failure
 -> log
 -> metric
 -> bypass cache
 -> DB/API
```

Add circuit breaker/backoff if Redis failure causes cascading load.

---

## Scenario 4 — Database CPU reaches 100%

**Answer:**

Check:

- Cache hit ratio
- Slow queries
- Missing indexes
- N+1 queries
- Connection pool
- Recent deployment
- Cache expiration
- Traffic increase

Do not immediately increase DB size without identifying the cause.

---

## Scenario 5 — Cache stampede after deployment

**Answer:**

Likely all cache keys were invalidated or cold.

Solutions:

- Warm critical keys
- Stagger TTLs
- Background refresh
- Request coalescing
- Avoid global invalidation
- Gradual rollout

---

## Scenario 6 — Personalized page is accidentally cached

**Answer:**

Immediately verify whether user-specific data is entering a shared cache.

Fix by:

- Making the response dynamic
- Removing shared caching
- Correct cache key segmentation
- Avoiding user-specific data in public CDN caches
- Auditing `Cache-Control`

---

## Scenario 7 — Search page is slow

**Answer:**

Measure:

```text
DNS
TLS
TTFB
Server rendering
DB query
API latency
RSC payload
JS execution
```

Then optimize the actual bottleneck.

---

## Scenario 8 — Next.js page has 5 API calls

**Answer:**

If independent:

```ts
const [a, b, c, d, e] = await Promise.all([
  getA(),
  getB(),
  getC(),
  getD(),
  getE(),
]);
```

The existing notes recommend parallel fetching for independent data to avoid waterfalls. fileciteturn1file4L296-L325

---

## Scenario 9 — One API call depends on another

**Answer:**

Sequential fetching may be necessary:

```text
Get user
   |
   v
Get user's orders
```

But stream independent sections using Suspense where possible.

---

## Scenario 10 — Server Action updates product but UI remains stale

**Answer:**

Check:

1. Mutation actually succeeded
2. Correct cache tag/path was invalidated
3. Client router cache
4. Optimistic UI state
5. CDN/browser cache
6. Redis/application cache

---

## Scenario 11 — ISR page is still stale

**Answer:**

Check:

- Revalidation interval
- Route cache
- Data cache
- CDN
- Explicit invalidation
- Client router cache
- Whether the page is actually using the intended cache configuration

ISR can intentionally serve stale content while regeneration happens in the background. fileciteturn1file3L184-L237

---

## Scenario 12 — Cache hit ratio drops from 95% to 20%

**Answer:**

Investigate:

- Cache key cardinality
- Key construction
- TTL changes
- Deployment
- Cache eviction
- Memory pressure
- Serialization failures
- Prefix/version changes
- Traffic pattern

---

## Scenario 13 — Redis memory is full

**Answer:**

Check:

- Largest keys
- TTLs
- Eviction policy
- Key cardinality
- Serialization size
- Duplicate data
- Unbounded cache keys

Then:

- Reduce object size
- Add TTLs
- Remove unnecessary keys
- Improve key design
- Configure appropriate eviction behavior

---

## Scenario 14 — One cache key is extremely hot

**Answer:**

A single popular key can become a bottleneck.

Solutions:

- CDN cache
- Local L1 cache where safe
- Redis
- Replication
- Request coalescing
- Precompute value
- Background refresh

---

## Scenario 15 — Cache invalidation fails

**Answer:**

Never assume invalidation succeeded.

Use:

- Logs
- Metrics
- Retry policy
- Dead-letter/event mechanism where needed
- Versioned cache keys
- Periodic TTL fallback

---

## Scenario 16 — API is fast but page is slow

**Answer:**

The bottleneck may be:

- Server component rendering
- Waterfall
- RSC payload
- Client JavaScript
- Hydration
- Images
- Fonts
- Third-party scripts
- Serialization

---

## Scenario 17 — Page is fast locally but slow in production

**Answer:**

Compare:

- Region
- CDN
- Database location
- API location
- Cold starts
- Network latency
- Environment variables
- Production cache behavior
- Build output
- Runtime

---

## Scenario 18 — Users in India see slower response than US users

**Answer:**

Check geography:

```text
India user
 -> nearest CDN
 -> origin region
 -> DB region
```

Use CDN/edge caching and consider data locality or multi-region architecture.

---

## Scenario 19 — Cache contains outdated authorization data

**Answer:**

Authorization decisions should not be casually cached.

Prefer:

- Short TTL
- Versioned permissions
- Explicit invalidation
- User/session-specific keys
- Fresh authorization checks for sensitive operations

---

## Scenario 20 — User changes account but sees previous user's data

**Answer:**

This is a severe cache isolation bug.

Immediately investigate:

- Shared cache keys
- Router Cache
- Browser cache
- CDN configuration
- Cookies
- Session handling
- `Vary`
- Cache-Control

Never use:

```text
profile
```

for user-specific cache data.

Use a properly isolated key such as:

```text
profile:user:123
```

---

# 10. Production Troubleshooting Scenarios

## Scenario 21 — Memory usage continuously increases

Check:

- In-memory cache
- Global Maps
- Event listeners
- Timers
- Large RSC payloads
- Unbounded arrays
- Redis client lifecycle
- Third-party libraries

---

## Scenario 22 — CPU spikes after deployment

Check:

- React/Next rendering changes
- Infinite loops
- Expensive serialization
- Cache miss storm
- Compression
- Image processing
- Build/runtime configuration
- New middleware/proxy logic

---

## Scenario 23 — API latency increased from 100 ms to 2 sec

Break down:

```text
Client
 -> CDN
 -> Next.js
 -> API
 -> DB
```

Use tracing to identify the slow segment.

---

## Scenario 24 — Traffic doubled but DB traffic increased 10x

Likely causes:

- Cache hit ratio collapsed
- Cache keys changed
- TTL reduced
- Cache unavailable
- N+1 query introduced
- Retry storm

---

## Scenario 25 — Deployment caused all pages to become slow

Check:

- Cache cold start
- CDN cache misses
- Data Cache state
- New server rendering path
- Bundle size
- Database load
- Third-party dependency latency

---

# 11. Security Scenarios

## Scenario 26 — How do you protect Server Actions?

**Answer:**

Treat Server Actions as backend endpoints.

Validate:

```text
Authentication
Authorization
Input validation
Resource ownership
Rate limiting
Business rules
Audit logging
```

---

## Scenario 27 — How do you prevent secret leakage?

**Answer:**

- Never expose server secrets to Client Components
- Use server-only modules
- Avoid `NEXT_PUBLIC_` for secrets
- Validate environment configuration
- Review RSC/client boundaries
- Never return secrets from server functions

---

## Scenario 28 — User can access `/admin` directly

**Answer:**

Protect at the server boundary.

Do not rely only on:

```ts
if (!isAdmin) {
  router.push("/");
}
```

Client-side checks are not authorization.

---

## Scenario 29 — API receives bot traffic

**Answer:**

Use multiple layers:

```text
CDN/WAF
  ->
Rate limiting
  ->
Authentication
  ->
Validation
  ->
Application
```

---

# 12. Performance Scenarios

## Scenario 30 — Large JavaScript bundle

Check:

- `"use client"` boundaries
- Heavy dependencies
- Dynamic imports
- Bundle analyzer
- Duplicate packages
- Client-only libraries

The existing notes already recommend minimizing Client Components and lazy-loading heavy components. fileciteturn1file1L102-L114

---

## Scenario 31 — Hydration error after deployment

Check:

- `Date.now()`
- `Math.random()`
- Browser-only APIs
- Different server/client data
- Locale/timezone differences
- Non-deterministic rendering

The existing notes identify these as common hydration-error causes. fileciteturn1file5L353-L357

---

## Scenario 32 — Slow first content

Optimize:

- Server rendering
- CDN
- Streaming
- Suspense
- Critical CSS
- Fonts
- Images
- Third-party scripts

---

## Scenario 33 — Slow navigation after initial load

Check:

- Router Cache
- Prefetching
- RSC payload
- Client JS
- Layout boundaries
- Network requests
- Cache invalidation

---

# 13. Architecture Scenarios

## Scenario 34 — Design a high-traffic product catalog

Suggested architecture:

```text
Browser
   |
CDN
   |
Next.js
   |
Redis / Next.js Data Cache
   |
Product API
   |
PostgreSQL
```

Cache:

- Categories
- Product details
- Product listings

Do not blindly cache:

- Cart
- Payment status
- User authorization

---

## Scenario 35 — Design a news website

Use:

```text
CDN
  |
Next.js
  |
Cached CMS/API
  |
Database
```

Use ISR/revalidation for articles and tag-based invalidation when editors publish content.

---

## Scenario 36 — Design a personalized dashboard

Do not make the complete page publicly cacheable.

Separate:

```text
Static shell -> CDN/cache

User data -> authenticated server request

Real-time widgets -> fresh/realtime channel
```

---

## Scenario 37 — Design a multi-tenant SaaS

Cache key must include tenant:

```text
tenant:acme:settings
tenant:acme:products
tenant:globex:settings
```

Never allow one tenant's cache entries to be returned to another tenant.

---

## Scenario 38 — Design a rate limiter

Redis structure:

```text
rate:user:123:/api/orders
```

Possible algorithms:

- Fixed window
- Sliding window
- Token bucket
- Leaky bucket

---

## Scenario 39 — Design distributed locking

Use a lock around expensive cache rebuilds:

```text
SET lock:key randomToken NX EX 10
```

Important:

- Expiration
- Ownership token
- Safe release
- Retry/backoff
- Failure handling

---

# 14. Additional Questions

## Q40. What is the difference between SSR and ISR?

**Answer:** SSR renders dynamically for requests; ISR allows statically cached output to be regenerated after a revalidation period. The existing notes describe ISR as a balance between SSG speed and SSR freshness. fileciteturn1file3L184-L237

---

## Q41. What is PPR?

**Answer:** Partial Prerendering combines a static shell with dynamic streamed sections.

The existing notes describe static portions being served quickly while dynamic sections stream through Suspense. fileciteturn1file3L241-L249

---

## Q42. Why use Server Components?

**Answer:** They keep server-only logic on the server and can reduce browser JavaScript. The existing notes emphasize reduced client JS and access to server-side resources. fileciteturn1file2L137-L140

---

## Q43. When should you use a Client Component?

**Answer:** When you need browser-side interactivity such as:

- State
- Effects
- Event handlers
- Browser APIs
- Client-only libraries

---

## Q44. How do you avoid prop drilling in Server Components?

**Answer:**

Use:

- Server-side data access
- Composition
- Route layouts
- Context only where appropriate
- Client state only where needed

---

## Q45. How do you handle errors from an external API?

**Answer:**

- Check `response.ok`
- Use timeouts/abort signals
- Retry only safe operations
- Apply exponential backoff
- Use fallback UI
- Log structured errors
- Track upstream latency/error rate
- Avoid retry storms

---

## Q46. How do you handle API timeouts?

**Answer:**

Use `AbortController`:

```ts
const controller = new AbortController();

const timeout = setTimeout(
  () => controller.abort(),
  3000
);

try {
  const response = await fetch(url, {
    signal: controller.signal,
  });

  return response.json();
} finally {
  clearTimeout(timeout);
}
```

---

## Q47. How do you prevent a slow dependency from blocking the entire page?

**Answer:**

Use:

- Suspense
- Streaming
- Parallel requests
- Timeouts
- Fallbacks
- Independent error boundaries
- Cached fallback data

---

## Q48. What is a cache key collision?

**Answer:** Two logically different requests generate the same cache key, causing incorrect data to be returned.

---

## Q49. What is cache poisoning?

**Answer:** Incorrect or malicious data gets stored in a cache and is served to later users.

Prevent with:

- Correct cache keys
- Proper input normalization
- Correct `Vary`
- Authentication isolation
- Trusted cache population
- Safe response headers

---

## Q50. What is stale-while-revalidate?

**Answer:** Return an acceptable stale value immediately while refreshing the cached value asynchronously.

---

## Q51. Why not use Redis for everything?

**Answer:** Redis adds operational cost, memory cost, invalidation complexity, network latency, and consistency concerns. Cache only what provides measurable value.

---

## Q52. How do you monitor caching?

Track:

```text
cache_hit_total
cache_miss_total
cache_hit_ratio
cache_latency
cache_errors
cache_evictions
cache_memory
hot_keys
DB queries after cache miss
```

---

## Q53. What is the most important cache metric?

**Answer:** Cache hit ratio is useful, but the real goal is reduced latency and backend load. A high hit ratio is not useful if cached values are incorrect or expensive to retrieve.

---

## Q54. How do you version cache keys?

```text
product:v1:123
product:v2:123
```

Useful when the serialized shape or business logic changes.

---

## Q55. How do you clear an old cache safely after deployment?

**Answer:**

Prefer:

```text
new key namespace/version
```

over deleting millions of keys synchronously.

Example:

```text
v1:product:123
v2:product:123
```

---

## Q56. What is cache warming?

**Answer:** Pre-populating frequently used cache entries before traffic arrives.

---

## Q57. What is cache eviction?

**Answer:** Removing entries because they expire, are explicitly deleted, or because the cache reaches its memory limit and needs to evict data according to its policy.

---

## Q58. How do you handle large cached objects?

**Answer:**

- Avoid unnecessary fields
- Compress when useful
- Cache projections
- Split large objects
- Set maximum object sizes
- Monitor serialization time

---

## Q59. How do you handle cache failure?

**Answer:**

Caching should usually degrade gracefully:

```text
Cache failure
    |
    v
Fallback to source
    |
    v
Protect source with rate limits/circuit breaker
```

---

## Q60. How do you test caching?

**Answer:**

Test:

- Cache hit
- Cache miss
- Expiration
- Invalidation
- Stale data
- Cache failure
- Concurrent misses
- Serialization failure
- Key isolation
- Multi-user isolation

---

# 15. Practical Coding Questions

## Coding 1 — Implement cache-aside

Implement:

```ts
getUser(id)
```

Requirements:

- Redis first
- DB fallback
- 5-minute TTL
- Handle Redis failure
- Avoid caching null permanently

---

## Coding 2 — Implement cache invalidation

Implement:

```ts
updateProduct(id, data)
```

Requirements:

```text
DB update
  ->
delete product cache
  ->
invalidate product listing
```

---

## Coding 3 — Implement request coalescing

If 100 requests miss the same cache key, only one should hit the database.

Expected concept:

```ts
const inFlight = new Map<string, Promise<unknown>>();
```

---

## Coding 4 — Implement TTL jitter

Instead of:

```ts
TTL = 300
```

use:

```ts
TTL = 300 + random(0, 60)
```

This reduces synchronized expiration.

---

## Coding 5 — Implement Redis rate limiting

Implement:

```text
100 requests / minute / user
```

using Redis.

---

## Coding 6 — Implement stale-while-revalidate

Requirements:

```text
fresh -> return
stale -> return + refresh
missing -> wait for source
```

---

## Coding 7 — Implement timeout

Use:

```ts
AbortController
```

and return a controlled fallback on timeout.

---

## Coding 8 — Implement retry with backoff

Expected:

```text
100ms
200ms
400ms
800ms
```

Add jitter and stop after a maximum retry count.

---

# 16. Quick Revision Checklist

## Next.js Core

- [ ] App Router
- [ ] Pages Router
- [ ] Server Components
- [ ] Client Components
- [ ] Server Actions
- [ ] Route Handlers
- [ ] Layouts
- [ ] Route Groups
- [ ] Dynamic Routes
- [ ] Parallel Routes
- [ ] Intercepting Routes
- [ ] Middleware / current network boundary model
- [ ] Metadata API

## Rendering

- [ ] CSR
- [ ] SSR
- [ ] SSG
- [ ] ISR
- [ ] Streaming
- [ ] Suspense
- [ ] PPR
- [ ] Dynamic rendering
- [ ] Static rendering

## Caching

- [ ] Request Memoization
- [ ] Data Cache
- [ ] Full Route Cache
- [ ] Router Cache
- [ ] `revalidate`
- [ ] `no-store`
- [ ] Cache tags
- [ ] Path invalidation
- [ ] `use cache`
- [ ] Cache lifetime
- [ ] Cache tagging
- [ ] Cache invalidation
- [ ] Redis
- [ ] CDN
- [ ] Browser cache
- [ ] HTTP cache headers
- [ ] Cache stampede
- [ ] Cache penetration
- [ ] Cache avalanche
- [ ] Cache poisoning
- [ ] Cache key design
- [ ] Cache consistency

## Performance

- [ ] Waterfall
- [ ] Parallel fetching
- [ ] Streaming
- [ ] RSC payload
- [ ] Hydration
- [ ] Bundle size
- [ ] Dynamic imports
- [ ] Image optimization
- [ ] Font optimization
- [ ] CDN
- [ ] Database indexing
- [ ] N+1 queries
- [ ] Connection pooling

## Security

- [ ] Authentication
- [ ] Authorization
- [ ] Server Action security
- [ ] Input validation
- [ ] Rate limiting
- [ ] CSRF considerations
- [ ] Secret management
- [ ] Security headers
- [ ] Tenant isolation
- [ ] Cache isolation

## Production

- [ ] Logging
- [ ] Metrics
- [ ] Tracing
- [ ] Error boundaries
- [ ] Health checks
- [ ] Timeouts
- [ ] Retries
- [ ] Circuit breaker
- [ ] Graceful degradation
- [ ] Docker
- [ ] Self-hosting
- [ ] CDN
- [ ] Multi-region
- [ ] Deployment rollback

---

# Top 20 Questions to Memorize

1. Explain all Next.js cache layers.
2. What changed in caching from Next.js 14 to 15?
3. What is the modern explicit cache model?
4. What is `use cache`?
5. `revalidatePath` vs tag-based invalidation?
6. Data Cache vs Full Route Cache?
7. Router Cache vs browser cache?
8. How would you cache an e-commerce product page?
9. How do you prevent cache stampede?
10. What happens when Redis goes down?
11. How do you design Redis cache keys?
12. How do you prevent cross-user cache leakage?
13. How do you cache personalized dashboards?
14. How do you handle stale data?
15. How do you diagnose a low cache hit ratio?
16. How do you protect the DB during a cache outage?
17. How do you optimize a slow Next.js page?
18. How do Server Components reduce frontend cost?
19. How do you secure Server Actions?
20. How would you design a production Next.js application for millions of users?

---

# Senior-Level Interview Answer Formula

For architecture/scenario questions, answer in this order:

```text
1. Identify the problem
2. Measure the bottleneck
3. Explain the trade-off
4. Choose the architecture
5. Explain caching
6. Explain invalidation
7. Explain failure handling
8. Explain security
9. Explain monitoring
10. Explain scalability
```

Example:

> "I would first measure whether the bottleneck is Next.js rendering, the API, Redis, or the database. Then I would introduce caching only for data where staleness is acceptable. I would define explicit cache keys and TTLs, invalidate affected tags after mutations, protect the database from cache stampedes, and monitor hit ratio, latency, errors, and backend load. For personalized data I would isolate cache entries by user/tenant and avoid public CDN caching."

---
