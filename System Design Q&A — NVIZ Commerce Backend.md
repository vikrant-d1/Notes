# System Design Q&A — NVIZ Commerce Backend

---

## 1. Multi-Provider Commerce Abstraction

**Q: The system needs to support both BigCommerce and CommerceTools as ecommerce backends, and the frontend should switch between them without any code changes. How would you design this?**

**A:**

Use the **Adapter Pattern** with runtime provider resolution.

**Core Design:**
- Define a `{Feature}Adapter` interface for each domain (products, cart, orders, etc.)
- Each provider implements its own version: `bigcommerce/product.adapter.ts`, `commercetools/product.adapter.ts`
- A `requireProvider()` middleware reads the `x-commerce-provider` request header and dynamically loads the correct adapter at runtime

```
Request → resolveLocale → requireProvider → adapter.getProduct() → transformResponse → client
```

**Schema-Driven Transformation:**  
Rather than mapping fields manually in each adapter, a monorepo package (`@commerce-unifier/transform-sdk`) stores JSON schemas per provider and resource. It uses JSONata expressions to transform provider-specific shapes into a unified envelope. This decouples the mapping logic from business logic.

**Unified Response Envelope:**
```json
{
  "success": true,
  "data": {},
  "meta": { "provider": "bigcommerce", "resource": "product", "duration": 42 }
}
```

**Trade-off:** The adapter layer adds indirection and requires schema maintenance for each provider field change. The benefit is that the frontend and downstream consumers are fully decoupled from provider internals.

---

## 2. Sitemap Generation with Multi-Tier Fallback

**Q: You need to serve XML sitemaps for products, categories, and CMS pages. The data comes from multiple sources (BigCommerce/CommerceTools APIs, Contentstack, Payload CMS). How do you design a resilient sitemap system?**

**A:**

Use a **3-tier fallback strategy** with background generation and cloud caching.

**Serving Flow (per request):**
```
1. Try GCP Cloud Storage (nvizstores/commerce/{provider}/{env}/sitemap/*.xml)
2. Fallback → local filesystem (local-sitemaps/)
3. Fallback → on-demand generation (hits commerce + CMS APIs)
```

**Generation Pipeline (`/sitemapsyncup`):**
- `getProductSitemap()` — paginates products, groups into category-level files (`category_*_product_sitemap.xml`)
- `getCategorySitemap()` — single file for all categories
- `getCMSPageSitemap()` — fetches from Contentstack or Payload CMS, respects `isEnabled` flag and supports per-page `changeFrequency` / `priority`
- `generateSitemap()` — creates the sitemap index wrapping all child files
- Uploads all files to GCP Storage for subsequent requests to hit the cache

**Response Headers:**
```
Content-Type: application/xml
Cache-Control: public, max-age=3600
```

**Resilience:** If the CMS API is down during generation, the route returns a specific error (`SITEMAP_NOT_FOUND`) but doesn't crash the backend. The last successfully generated sitemap remains in GCP Storage.

**Trade-off:** The GCP-first strategy means updates lag by up to 1 hour (or until `/sitemapsyncup` is triggered). On-demand fallback avoids this but adds latency and provider API load on cache miss.

---

## 3. Multi-Locale, Multi-Currency Pricing

**Q: The platform serves customers across multiple regions (US, India, etc.) with different currencies and provider-specific price lists. How do you design the locale and pricing resolution?**

**A:**

Use a **middleware-driven locale resolution** with a static config mapping.

**Config Structure (`locale.config.json`):**
```json
{
  "defaultLocale": "en-US",
  "locales": {
    "en-US": { "currency": "USD", "region": "US", "priceListIds": { "bigcommerce": "1", "commercetools": "us-pricing" } },
    "en-IN": { "currency": "INR", "region": "IN", "priceListIds": { "bigcommerce": "2", "commercetools": "in-pricing" } }
  }
}
```

**`resolveLocale` Middleware:**
1. Reads `x-locale` header (or query param)
2. Does case-insensitive matching (`en-us` → `en-US`)
3. Attaches locale context to `req` — currency, region, price list IDs
4. Falls back to `defaultLocale` if header is absent or unrecognized

**Provider-Aware Price List Resolution:**  
The middleware attaches the full price list map; each adapter reads `req.locale.priceListIds[provider]` to get its own list ID. This means the same middleware works regardless of which provider is active.

**Trade-off:** Static config is simple and zero-latency, but requires a deploy to add a new locale. An alternative would be a database-backed locale config fetched at startup, at the cost of a DB dependency at boot.

---

## 4. Cart Persistence Across Authentication States

**Q: A guest user adds items to a cart, then logs in. How do you design cart merge between unauthenticated and authenticated states?**

**A:**

Use a **dual-cart model** with explicit merge on login.

**Guest Cart:**
- Created on first add-to-cart; cart ID stored in a cookie or local storage on the frontend
- Backend persists guest cart state via the provider API (BigCommerce/CommerceTools both support anonymous carts) + optional Prisma DB for session tracking

**Authenticated Cart:**
- On login, the frontend sends the guest cart ID alongside the auth token
- Backend calls `mergeGuestCart(guestCartId, customerId)` on the cart adapter
- Provider APIs handle the actual item merge; duplicates resolved per provider rules

**After Merge:**
- Guest cart is invalidated
- Merged cart ID returned to the client

**Trade-off:** Provider-native merge (BigCommerce/CommerceTools both support this natively) is simpler than implementing merge logic server-side, but the behavior (e.g., quantity conflict resolution) differs between providers and must be tested per provider.

---

## 5. Post-Deploy Cache Invalidation

**Q: After a deployment, product prices and sitemaps may have changed. How do you ensure the CDN and storage caches are invalidated without manual intervention?**

**A:**

Integrate cache purge as a **post-deploy step in the CI/CD pipeline.**

**Deployment Flow (Google Cloud Build):**
```
1. Build Docker image (Kaniko) → push to GCR
2. Deploy to GKE (gke-deploy)
3. Post-deploy: call N7 (Nitrogen) CDN purge API via script
4. Inject secret checksum as deployment annotation for rollback tracking
```

**What Gets Purged:**
- CDN edge cache for product, category, and sitemap URLs
- GCP Storage is not purged — old sitemaps remain until `/sitemapsyncup` overwrites them

**Sitemaps Specifically:**  
A separate trigger (`/sitemapsyncup` endpoint) regenerates and re-uploads all sitemap files to GCP Storage. This can be called by a Cloud Build step or a cron job after deployment.

**Trade-off:** Eager purge-on-deploy means a brief cache-cold period (increased origin load). Lazy TTL expiry (1-hour `Cache-Control`) avoids this but means stale data lingers. The hybrid approach used here — CDN purge immediately, sitemap regenerated async — balances freshness and load.

---

## 6. File Storage with Cloud/Local Fallback

**Q: The system needs to handle file uploads (product images, sitemaps) and work both in production (GCP) and local development. How do you design the storage abstraction?**

**A:**

Use a **strategy-based storage service** toggled by an environment variable.

**Interface:**
```ts
uploadFile(path, buffer, contentType): Promise<string>   // returns publicUrl
getFileAsBuffer(path): Promise<Buffer>
deleteFile(path): Promise<void>
```

**Runtime Resolution:**
- `LOCAL_STORAGE=true` → writes to `./data/` on disk, returns local paths
- Default → calls GCP Cloud Storage SDK, stores under `nvizstores/commerce/{provider}/{env}/{category}/{file}`

**GCP Path Convention:**
```
nvizstores/commerce/bigcommerce/prod/sitemap/sitemap.xml
nvizstores/commerce/commercetools/dev/media/product-image.jpg
```

**Public ACL:** Files served directly from GCP Storage URLs with public-read ACL (with graceful handling for uniform bucket-level access policies).

**Trade-off:** The environment variable switch is simple but can mask cloud-specific issues during development. A more rigorous approach would be a local GCP Storage emulator (e.g., `fake-gcs-server`), at the cost of additional dev environment complexity.

---

## 7. Unified Error Handling

**Q: With 29+ product endpoints, 12 cart endpoints, multiple CMS integrations, and two commerce providers, how do you ensure consistent error responses across the entire API?**

**A:**

Use a **centralized error handler** with typed error objects and message codes.

**Error Object Shape:**
```ts
{
  statusCode: number,     // HTTP status
  code: string,           // machine-readable (e.g., SITEMAP_NOT_FOUND)
  message: string,        // human-readable
  messageCodes: string[], // i18n keys for frontend translation
  details?: unknown       // validation errors, raw provider errors (dev mode only)
}
```

**Flow:**
1. Route handlers call `sendError(res, code, statusCode)` for handled errors
2. Unhandled exceptions bubble up to `globalErrorHandler` (4-arg Express signature)
3. Global handler strips internal details from production responses (no stack traces, no raw provider errors unless `NODE_ENV=development`)

**Message Code System:**  
`buildFailureMessageCode('product', 'not_found')` → `'product.not_found'`  
Frontend maps these keys to translated strings, decoupling error text from the backend.

**Trade-off:** Centralizing error shape requires discipline — every new route must use the shared `sendError()` function. Linting/type enforcement (e.g., making the response type require going through the helper) would enforce this, but adds boilerplate.

---

## 8. Webhook Processing from Multiple Providers

**Q: Both BigCommerce and CommerceTools send webhooks for order, product, and customer events. How do you design the webhook ingestion system?**

**A:**

Use a **single webhook route** with provider-based dispatch.

**Route:** `POST /webhook/{provider}/{event}`  
The `{provider}` path segment determines which signature verification and payload parser to apply.

**Processing Pattern:**
1. Verify HMAC signature (provider-specific secret)
2. Parse and normalize the event payload using the transformation SDK
3. Dispatch to the relevant service handler (e.g., `handleOrderCreated()`, `handleProductUpdated()`)
4. Respond `200 OK` immediately; actual processing is async to prevent webhook timeouts
5. Failed handlers log errors but don't return 5xx (to prevent provider retries causing duplicate processing)

**Idempotency:**  
Store processed event IDs in Prisma. Before handling, check if the event ID was already processed — return 200 without re-processing if found.

**Trade-off:** Async processing improves webhook response time but requires robust error logging and retry infrastructure (e.g., a dead-letter queue or a retry cron). The current implementation logs failures; a production-grade version would add a job queue (e.g., Cloud Tasks or BullMQ).

---

## Quick Reference — Key Files

| Topic | File |
|---|---|
| App bootstrap & middleware order | [src/index.ts](../src/index.ts) |
| Unified response contracts | [src/engine/response.ts](../src/engine/response.ts) |
| Locale & pricing resolution | [src/middleware/resolveLocale.ts](../src/middleware/resolveLocale.ts) |
| Sitemap serving & fallback | [src/routes/sitemap.route.ts](../src/routes/sitemap.route.ts) |
| Sitemap generation logic | [src/services/sitemap.service.ts](../src/services/sitemap.service.ts) |
| GCP storage abstraction | [src/providers/gcp/storage.service.ts](../src/providers/gcp/storage.service.ts) |
| Schema-driven transformation | [packages/commerce-transform-sdk/src/](../packages/commerce-transform-sdk/src/) |
| CI/CD & cache purge pipeline | [ci/cloudbuild/dev/cloudbuild.yaml](../ci/cloudbuild/dev/cloudbuild.yaml) |
| Locale config | [src/config/locale.config.json](../src/config/locale.config.json) |
| Prisma data model | [prisma/schema/](../prisma/schema/) |
