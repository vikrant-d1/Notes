# NViz Commerce Backend — Developer Q&A

---

## Q1. What is this project and what problem does it solve?

**A:** This is a **Commerce Unifier** — a single Express + TypeScript backend that sits in front of multiple e-commerce platforms (BigCommerce, CommerceTools) and multiple CMS providers (Contentstack, PayloadCMS). Instead of the frontend talking directly to BigCommerce or CommerceTools, it talks to this API. The provider is selected per-request via a header (`x-commerce-provider`, `x-cms-provider`). This means the storefront code never changes when you swap the underlying commerce platform.

---

## Q2. How does the multi-provider architecture work technically?

**A:** Every feature (products, cart, orders, etc.) lives under `src/modules/{feature}/`. Inside each module there is an adapter factory:

```
src/modules/product/
├── index.ts          ← adapter factory
├── bigcommerce/      ← BigCommerce implementation
└── commercetools/    ← CommerceTools implementation
```

The `requireProvider` middleware reads the `x-commerce-provider` header, validates it against the folders that actually exist on disk (auto-discovery — no hardcoded list), and attaches `req.provider` to the request. The service layer then calls `getAdapter(req.provider)` which returns the right implementation. Both implementations satisfy the same interface, so the service layer is completely provider-agnostic.

---

## Q3. What is the contract-driven transformation system?

**A:** Every API call goes through a pipeline:

```
validateRequest(contract, payload)
  → transformRequest(payload, contract, config)
    → adapter.method(providerPayload)      ← hits BigCommerce / CommerceTools
      → transformResponse(raw, contract, config)
        → validateResponse(contract, unified)
          → sendSuccess(res, data)
```

`contracts/` holds JSON Schema definitions for the **unified format** (what the frontend always sees). `schemas/` holds transform config files that map unified fields ↔️ provider-specific fields — field aliasing, nesting, type coercion. The `commerce-transform-sdk` package executes this mapping. This means adding a new provider only requires writing transform configs, not touching any service logic.

---

## Q4. How is caching implemented? What layers exist?

**A:** There are three layers:

**1. In-memory module singletons**
Adapter instances are cached at the module level so SDK clients are not re-instantiated on every request.

**2. Nitrozen CDN (edge cache)**
The primary cache. All public responses are cached at the CDN edge. The backend has a purge API (`src/services/cachePurge.service.ts`) that calls the Nitrozen purge endpoint with a Bearer token. It supports two purge modes: purge by group name, or purge specific URLs. Cache purge is always fire-and-forget — it never blocks the response.

**3. Database-backed purge registry**
The `CmsPurgeTarget` table tracks every CMS content item (by `provider + contentType + entryUid + locale`) and the URL paths it affects. When CMS content changes (via webhook), the system looks up which URLs need purging and fires the Nitrozen purge. This is how CMS edits automatically invalidate the CDN cache without a full purge.

In-memory TTL caches (60s for Nitrozen purge groups, 5min for CMS header) exist but are lightweight; the CDN is the real cache layer.

---

## Q5. How is multi-CMS integration handled, and how do you add a new CMS?

**A:** CMS providers live under `src/providers/` (Contentstack, PayloadCMS). The `cms.service.ts` reads `req.provider` (set from `x-cms-provider` header) and delegates to the right provider client. Both clients expose the same interface:

- `getPageData(slug, options)`
- `getHeader()` / `getFooter()`
- `getEntry(contentType, uid, options)`
- `getEntries(contentType, query)`
- `searchEntries(query, filters)`

To add a new CMS you create a new folder under `src/providers/`, implement that interface, and the `requireProvider` middleware auto-discovers it from the directory structure — no code changes elsewhere. Contentstack uses API Key + Access Token auth; PayloadCMS uses API Key + an optional Preview Secret for draft mode.

---

## Q6. How does draft/preview content work?

**A:** Both CMS providers support draft content. When a request includes a preview flag, the service fetches both the **published** and **draft** versions in parallel. It then runs `computeDraftChanges()` to diff them, returning the published content plus a `_changes` object so the frontend knows exactly which fields changed in the draft. For PayloadCMS, draft access requires a `PAYLOAD_PREVIEW_SECRET` to be validated in the request, preventing public access to unpublished content.

---

## Q7. How does JWT authentication work and how is the cart handled across guest/logged-in states?

**A:** Two tokens are issued on login — a 15-minute access token and a 7-day refresh token (expiry configurable via env vars). The `requireAuth` middleware verifies the Bearer token and attaches `req.user` with `{ customerId, email, provider }`. `optionalAuth` does the same but never rejects — used on routes like product detail where login is optional.

For cart continuity, a `CartCustomerMap` table stores `{ customerId, cartId }`. When a guest adds items and then logs in, `mergeGuestCart()` reads the guest cart ID from the request, looks up the customer's existing cart, merges items, and updates the map. The frontend gets back the merged cart ID — no items are lost across the auth transition.

---

## Q8. How is the sitemap generated and kept up to date?

**A:** Three sitemap types are generated: product, category, and CMS pages. Each enumerates all entries from the respective provider (paginating through all products/categories, querying all published CMS pages). The results are assembled into XML and uploaded to GCP Cloud Storage. There is a `/sitemapsyncup` endpoint that triggers full regeneration + upload — this is called by a webhook or scheduled job. For serving, the route handler first tries to serve from GCP Storage (for production scale), falling back to a local `local-sitemaps/` directory. The `x-cms-provider` header on `/sitemapsyncup` controls which CMS the sitemap pulls from.

---

## Q9. What does the unified API response envelope look like and why?

**A:** Every response — success or error — shares the same shape:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Product retrieved successfully",
  "messageCodes": ["product:get:success"],
  "data": {},
  "pagination": { "total": 150, "limit": 20, "offset": 40 },
  "meta": {
    "provider": "bigcommerce",
    "resource": "product",
    "action": "get",
    "timestamp": "...",
    "duration": 45
  },
  "_raw": {}
}
```

`messageCodes` follow the pattern `{resource}:{action}:{result}` and are machine-readable so the frontend can drive UI messages without parsing strings. `_raw` (the original provider response) is only included outside production — useful for debugging but never exposed to end users in prod. `meta.duration` is the end-to-end time in milliseconds for each request.

---

## Q10. How does locale and regional pricing work?

**A:** The `resolveLocale` middleware runs on every request. It checks (in priority order): query param `?locale=`, then `x-locale` header, then the default from `locale.config.json`. The config maps each locale to a currency, region, and provider-specific price list ID:

```json
"en-IN": {
  "currency": "INR",
  "priceListIds": { "bigcommerce": "8", "commercetools": "in-pricing" }
}
```

`req.locale` is attached with the resolved context. When the product service fetches prices, it passes the correct `priceListId` for the active provider, so Indian users automatically see INR pricing from the India price list without any frontend logic.

---

## Q11. How are webhooks from BigCommerce and CommerceTools handled?

**A:** Both platforms push webhooks to `/api/webhooks`. BigCommerce sends PubSub-encoded payloads; CommerceTools sends structured change event objects. The webhook handler decodes the payload, identifies the event type (product updated, order created, etc.), and triggers the appropriate downstream action — most commonly registering CMS purge targets or triggering a sitemap resync. All webhook processing is async and non-blocking (`.catch(err => console.warn(...))`), so a slow or failing webhook handler never affects the user-facing API.

---

## Q12. How is email handled and what prevents it from slowing down API responses?

**A:** Email uses Nodemailer with MJML templates (MJML compiles to responsive HTML). Templates exist for order confirmation, password reset, abandoned cart reminders, and newsletter. All email sends are fire-and-forget:

```typescript
sendOrderConfirmationEmail(order, customer)
  .catch(err => console.error('Email failed', err));
// response is already sent — email failure is silent to the user
```

SMTP config (host, port, credentials) comes from env vars. The `STORE_NAME`, `STORE_URL`, and `STORE_LOGO_URL` env vars are injected into every template so the same email service works for any storefront without code changes.
