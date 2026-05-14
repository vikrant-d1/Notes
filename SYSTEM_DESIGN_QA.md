# EnableDB — Backend & System Design Q&A

> B2B e-commerce platform backend: Node.js + TypeScript + PostgreSQL + multi-system integrations

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack Decisions](#2-tech-stack-decisions)
3. [Architecture & Structure](#3-architecture--structure)
4. [Database Design](#4-database-design)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [API Design](#6-api-design)
7. [Middleware Pipeline](#7-middleware-pipeline)
8. [External Integrations](#8-external-integrations)
9. [Event-Driven Architecture (PubSub)](#9-event-driven-architecture-pubsub)
10. [Search & Indexing](#10-search--indexing)
11. [Feature Flags](#11-feature-flags)
12. [Observability & Monitoring](#12-observability--monitoring)
13. [Security](#13-security)
14. [Performance & Scalability](#14-performance--scalability)
15. [Error Handling](#15-error-handling)
16. [Testing Strategy](#16-testing-strategy)
17. [CI/CD & Deployment](#17-cicd--deployment)
18. [Multi-Tenancy & Localization](#18-multi-tenancy--localization)

---

## 1. Project Overview

**Q: What is EnableDB and what problem does it solve?**

EnableDB is the backend API layer for a B2B e-commerce platform. It acts as the central orchestration hub between:
- The front-end (customer-facing UI)
- BigCommerce (e-commerce engine)
- SAP S4 (enterprise ERP)
- Solr (product search)
- ContentStack (headless CMS)
- Google Cloud services (PubSub, Trace)

The problem it solves: enterprise B2B purchasing is complex — companies have hierarchies, custom pricing, credit limits, approval workflows, multiple ship-to locations, and locale-specific content. EnableDB manages all that domain logic in one place rather than spreading it across multiple systems.

---

**Q: What is the core domain of this application?**

The core domain is B2B commerce orchestration:
- **Companies** — hierarchical (parent → child → location) with credit, addresses, channels
- **Customers** — employees mapped to companies with role-based permissions
- **Products** — catalog managed in BigCommerce, indexed in Solr, enriched locally
- **Cart & Orders** — multi-step purchasing with approval workflows
- **Payments & Invoices** — integrated with SAP S4 financial data
- **Permission Matrix** — granular RBAC controlling what users can see and do

---

## 2. Tech Stack Decisions

**Q: Why Node.js + TypeScript instead of another language/runtime?**

- Node.js excels at I/O-heavy workloads — this app spends most of its time waiting on DB queries and external API calls, not CPU-bound work.
- TypeScript adds compile-time safety across 154 Prisma models and 80+ service files, catching mismatched data shapes before runtime.
- The existing team and ecosystem (BigCommerce SDK, Google Cloud libraries) have strong Node.js support.

---

**Q: Why Express.js and not Fastify, NestJS, or another framework?**

Express was chosen for its simplicity and wide ecosystem. The codebase adds structure manually (routes → controllers → services), which gives full control without the opinion overhead of NestJS. The app has grown to 50+ route modules so that layered structure is consistently applied.

---

**Q: Why Prisma ORM instead of raw SQL or another ORM like TypeORM?**

| Reason | Detail |
|---|---|
| Type safety | Prisma generates TypeScript types from schema — no manual DTO mapping |
| Schema-as-code | 154 `.prisma` files are the single source of truth for the DB schema |
| Migrations | `prisma migrate` handles schema evolution with a history log |
| Soft delete extensions | Prisma client extensions allow transparent filtering of deleted records |
| Query sanitization | Prisma parameterizes all queries — no SQL injection risk |

---

**Q: Why PostgreSQL as the primary database?**

- ACID-compliant transactions needed for cart/order/payment operations
- Relational model suits the complex entity relationships (company hierarchies, order line items, role mappings)
- Prisma + PostgreSQL adapter with connection pooling via `pg` Node pool
- Strong support for JSONB columns where schema flexibility is needed

---

**Q: Why use separate `.prisma` files per model instead of one big schema?**

With 154 models the monolithic schema would be ~10,000+ lines — impossible to navigate. Splitting by domain (`src/model/company/`, `src/model/product/`, etc.) means each team can work on their domain models independently without merge conflicts. Prisma supports multi-file schemas natively.

---

## 3. Architecture & Structure

**Q: Describe the layered architecture of this application.**

```
Request
  │
  ▼
Middleware (CORS → Security Headers → CSP Nonce → Logger → Auth → Rate Limit)
  │
  ▼
Routes  (src/routes/**)          ← declare endpoints, apply middleware per route
  │
  ▼
Controllers (src/controller/**)  ← parse request, call service, format response
  │
  ▼
Services (src/service/**)        ← business logic, DB access, external API calls
  │
  ▼
Prisma ORM / External APIs       ← PostgreSQL, BigCommerce, SAP S4, PubSub, Solr
```

Each layer has a single responsibility. Controllers never touch Prisma directly. Services never format HTTP responses. This makes testing and swapping dependencies straightforward.

---

**Q: How are routes organized?**

Routes live in `src/routes/` grouped by domain. The main `src/routes/index.ts` aggregates all domain routers and mounts them under a common prefix. Each domain folder has its own `index.ts` that wires endpoints to controllers with the appropriate middleware chain:

```typescript
// Typical route setup
router.post(
  '/create',
  openFeatureValidation('company-create-flag'),  // 1. Feature flag
  authorizeUser,                                  // 2. JWT auth
  checkRolePermission('company:write'),           // 3. RBAC
  createCompanyController                         // 4. Handler
);
```

---

**Q: What is the Controller vs Service separation and why does it matter?**

| Layer | Responsibility | What it does NOT do |
|---|---|---|
| Controller | Parse req params/body, call service, send HTTP response | No business logic, no DB access |
| Service | Business logic, DB queries, external API calls | No HTTP-specific code |

This separation means services are easily unit-tested without spinning up an HTTP server, and controllers stay thin and predictable.

---

**Q: What does `CommonServiceResponse` look like and why is it consistent?**

```typescript
interface CommonServiceResponse {
  err: boolean;
  msg: string;
  data: any;
}
```

Every service returns this shape. Controllers check `err` and map it to the correct HTTP status. Consistency means controllers are predictable — no service surprises the controller with a different error format.

---

## 4. Database Design

**Q: Describe the soft delete pattern used across all models.**

Every model has these fields:

```prisma
deleted        Boolean   @default(false)
deleted_at     DateTime?
deleted_by     String?
deleted_note   String?
deleted_reason String?
```

A Prisma client extension automatically adds `WHERE deleted = false` to all `findMany`, `findFirst`, and `findUnique` queries. `delete` operations are intercepted and converted to `update({ deleted: true, deleted_at: now() })`. This means:
- No data is ever physically removed
- Full audit trail of who deleted what, when, and why
- Accidental deletions are recoverable

---

**Q: What ULID/UUID strategy is used for primary keys?**

All models use a `uuid` field (despite the name, populated with ULIDs — Universally Unique Lexicographically Sortable Identifiers). ULIDs are:
- Sortable by creation time (unlike random UUIDs)
- Globally unique without a central sequence
- URL-safe (no hyphens needed)
- Compatible with UUID data types in PostgreSQL

---

**Q: How is the company hierarchy modeled?**

Companies have a self-referential parent relationship:

```prisma
model edb_company {
  uuid            String   @id
  parent_company  String?  // references another edb_company.uuid
  company_type    String   // "parent" | "child" | "location"
}
```

The hierarchy is: `Parent Company → Child Company → Ship-To Location`. API queries traverse this hierarchy to determine what catalogs, pricing, and permissions apply to a given user at a given location.

---

**Q: How are many-to-many relationships handled?**

Explicit junction tables are used rather than Prisma implicit M2M, because the join records themselves carry data. Examples:
- `edb_channelcustomergroup_m_m` — channel ↔ customer group with channel-specific group settings
- `edb_channelcompany_m_m` — channel ↔ company with enrollment dates
- `edb_customer_company` — customer ↔ company with role at that company

---

**Q: How is the SAP S4 data integrated into the database?**

A dedicated `src/model/s4data/` domain has 16 models that mirror SAP S4 table structures:
- `edb_s4_kna1` — Customer master (mirrors SAP KNA1 table)
- `edb_s4_knmt` — Customer material info (KNMT)
- `edb_s4_but000` — Business partner master (BUT000)
- `edb_s4_raw` — Raw import buffer before enrichment
- `edb_s4_enriched` — Post-processed S4 data

S4 data is synced into these local tables via PubSub-triggered jobs, giving fast read access without real-time S4 API calls on every request.

---

## 5. Authentication & Authorization

**Q: How does authentication work end-to-end?**

1. User logs in → service validates credentials → issues a JWT
2. JWT is signed with `JWT_AUTH_TOKEN_SECRETKEY`
3. Token payload contains `{ id, jti, mainUserId }`
4. On each request: Passport.js `passport-jwt` strategy extracts the `Bearer` token from the `Authorization` header
5. Token is validated (signature + expiry)
6. `jti` (session ID) is checked against the DB — revoked sessions are rejected even with a valid token
7. User record is fetched and enriched with company context, permissions, price lists, locales
8. Enriched user is attached to `req.user` for downstream use

---

**Q: What is user context enrichment and what does it contain?**

After JWT validation, the middleware builds a rich `UserInfo` object and attaches it to the request. It contains:

```
req.user = {
  id, email, name, bpNumber,       // identity
  companyId, parentCompanyId,       // company hierarchy
  shipToId, billToId,               // selected location
  channel, currency, locale,        // channel context
  priceList, catalogs,              // pricing
  customerGroup,                    // pricing tier
  siteRoles, permissions,           // access control
  isEmployee, isImpersonating       // user type flags
}
```

This single enrichment pass avoids repeated DB calls in every controller/service.

---

**Q: How does impersonation work?**

An employee can act as a customer. The JWT carries `mainUserId` (the employee's real ID). An `impersonation` header is passed with the target customer's ID. The auth middleware:
1. Verifies the employee's JWT
2. Loads the target customer's context
3. Sets `req.user` to the customer context
4. Sets `req.user.isImpersonating = true` and `req.user.impersonatedBy = mainUserId`

Audit logs record the impersonating employee's ID alongside all actions taken.

---

**Q: How does Role-Based Access Control (RBAC) work?**

Two layers:

**1. Matrix Permission System** (`mtx_*` tables)  
The permission matrix stores a hierarchy: `Groups → Roles → Permissions`. A user belongs to groups, groups have roles, roles have permissions. The `checkRolePermission(key)` middleware queries this matrix to determine if the user has the required permission for an action.

**2. Feature-Flag-Based Access**  
Some features are gated by feature flags in addition to roles — useful for gradual rollouts where a role is necessary but not sufficient.

---

**Q: How is API key authentication different from JWT auth?**

API key auth (`authorizeApiKey` middleware) is used for machine-to-machine calls — background jobs, data sync scripts, internal services. The API key is passed in a header, looked up in `edb_api_keys` table, and validated. These routes bypass JWT user context enrichment since there is no "user" in the request.

---

## 6. API Design

**Q: What conventions are used for API responses?**

All responses follow a standard envelope:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Human-readable message",
  "data": { ... }
}
```

Error responses add:
```json
{
  "success": false,
  "errorCode": "MACHINE_READABLE_CODE",
  "messageCodes": ["i18n.key.for.translation"],
  "data": {}
}
```

The `messageCodes` array allows the front-end to display locale-specific error messages without coupling error text to the backend.

---

**Q: How is API documentation maintained?**

Swagger is auto-generated from `src/apidocumentation/modules/*.ts` files. Each module documents one API endpoint with:
- Description
- Request body / query parameter schema
- Response schema with status codes
- Authentication requirement

Docs are served at `/apidocumentation` and can be exported as an OpenAPI 3.0 spec. Having documentation as code means it stays in sync with implementation — the same file that defines route types also documents them.

---

**Q: How does pagination work on list endpoints?**

List endpoints accept `offset` and `limit` query parameters. Services translate these into Prisma `skip` and `take` options. Responses include `total` count so clients can render pagination controls. No cursor-based pagination is used — offset pagination suits admin-facing list views where users jump to page N.

---

## 7. Middleware Pipeline

**Q: What is the full middleware chain for a typical authenticated request?**

```
1. CORS               — allow cross-origin with credentials
2. Helmet             — security headers (CSP, HSTS, X-Frame-Options, etc.)
3. cspNonce           — generate per-request nonce for inline scripts
4. cookieParser       — parse cookies (locale stored here)
5. bodyParser         — parse JSON request body
6. requestLogger      — attach correlation ID, start OTel span
7. openFeatureValidation — check feature flag before route executes
8. authorizeUser      — validate JWT, enrich req.user
9. checkRolePermission — RBAC check against permission matrix
10. rateLimit         — token bucket per IP/endpoint for mutation routes
11. Controller        — business logic
12. errorHandler      — catch thrown errors, map to HTTP status
```

---

**Q: How does rate limiting work?**

The `rate-limiter-flexible` library implements a token bucket algorithm. Two limiters:

- `dataModificationLimiter` — applied to POST/PUT/PATCH/DELETE routes; prevents mass data changes
- `registrationLimiter` — applied to registration/lead capture endpoints; prevents spam signups

If the limit is exceeded, the middleware throws a `rateLimitError` which the error handler maps to HTTP 429 with a `Retry-After` header.

---

**Q: How are CSP nonces used?**

The `cspNonce` middleware generates a cryptographically random nonce on every request and:
1. Stores it in `res.locals.nonce`
2. Adds it to the `Content-Security-Policy` header: `script-src 'nonce-<value>'`
3. Makes it available to EJS templates for inline scripts

This allows inline scripts in server-rendered views while preventing XSS — an attacker's injected script won't have the correct nonce.

---

## 8. External Integrations

**Q: How does BigCommerce integration work?**

BigCommerce is the e-commerce engine. The integration is bi-directional:

- **Reads from BC** — product catalog, pricing, categories (via GraphQL queries in `src/bigcommerce/`)
- **Writes to BC** — when a company/customer/permission changes locally, a service in `src/service/bigcommerce/` pushes the delta to BC's REST API

The local database is the system of record for B2B-specific data. BigCommerce handles the storefront/cart engine. EnableDB keeps them in sync.

---

**Q: How does SAP S4 integration work?**

SAP S4 is the ERP system. Integration is primarily read-heavy:
- S4 data (customer master, invoices, open orders, credit status) is synced into local `edb_s4_*` tables via PubSub-triggered batch jobs
- API endpoints serve this locally-cached S4 data — no real-time S4 call per request
- Write-back to S4 happens for specific operations (e.g., `SAP_S4_CMIR_UPDATE_URL` for customer material info updates)

Local caching of S4 data decouples availability — if S4 is slow or down, the platform still serves last-known data.

---

**Q: How does Solr search integration work?**

Solr is used for product search and catalog browsing. The flow:
1. Products are indexed into Solr with all searchable attributes, pricing, and availability
2. `POST /product/search` routes query Solr (not PostgreSQL) for performance
3. Solr returns product IDs; the service enriches with any local overrides
4. Re-indexing is triggered by PubSub events when product data changes

Complex Solr query templates are pre-built in `src/config/index.ts` — factoring query logic into config keeps service code clean.

---

**Q: How does ContentStack (CMS) integration work?**

ContentStack is a headless CMS used for marketing content — headers, footers, banners, locale-specific text. The API fetches content via ContentStack's delivery API using `CONTENTSTACK_API_KEY` and `CONTENTSTACK_ACCESS_TOKEN`. Content is locale-aware — the same endpoint returns different content based on the current locale.

---

## 9. Event-Driven Architecture (PubSub)

**Q: Why use Google Cloud PubSub and what problems does it solve?**

Several operations in B2B commerce are expensive and don't need to block the HTTP response:
- Syncing a company update to BigCommerce
- Re-indexing products in Solr after a catalog change
- Sending email notifications
- Generating invoice PDFs

PubSub decouples these: the request publishes a message and returns immediately. A subscriber picks it up and processes asynchronously. Benefits:
- Lower API latency (no waiting for BigCommerce/Solr to respond)
- Retry on failure without user impact
- Scales independently from the API server

---

**Q: How are PubSub messages published and consumed?**

**Publishing:**
```typescript
await publishMessageService(payload, handlerName, topicName);
```
The service serializes the payload and publishes to the named topic.

**Consuming:**
- Local dev: pull subscription — the app polls for messages
- Production: push subscription — PubSub HTTP POSTs to the `/pubsub/*` routes
- Handler routing via switch-case in `handleMessagesService`:
  ```typescript
  switch (handlerName) {
    case 'syncCompanyToBigCommerce': return syncCompanyHandler(payload);
    case 'reindexProduct':           return reindexProductHandler(payload);
    ...
  }
  ```

Topic and subscriber names are prefixed with `PUBSUB_ENV` so dev/staging/prod don't share topics.

---

## 10. Search & Indexing

**Q: Why Solr for search instead of PostgreSQL full-text search?**

| Concern | PostgreSQL FTS | Solr |
|---|---|---|
| Faceted search | Limited | Native |
| Relevance tuning | Limited | Full control (boost fields, synonyms) |
| Performance at scale | Degrades with catalog size | Designed for large catalogs |
| Real-time indexing | Yes | Near real-time |
| Attribute filtering | Joins required | Native field filtering |

For a B2B catalog with thousands of SKUs, faceted attribute filtering (filter by size, brand, category) with relevance scoring is a hard requirement. Solr handles this natively.

---

**Q: How is the Solr index kept in sync?**

1. Product data changes (price update, availability change, new product) trigger a PubSub event
2. The PubSub subscriber calls the Solr indexing service
3. The service builds a Solr document from the product data and posts to `SOLR_BASE_URL`
4. Solr commits the document

Full re-index jobs can also be triggered via the `/solr/reindex` admin endpoint for bulk updates.

---

## 11. Feature Flags

**Q: What is OpenFeature and why is it used?**

OpenFeature is a vendor-neutral feature flag SDK standard. It's used here with **FlagD** as the backend provider. This means:
- Feature flags are evaluated locally (low latency, no external API call per request)
- The same OpenFeature API works with any provider (LaunchDarkly, Unleash, etc.) — no vendor lock-in
- Flags can be updated without redeployment

---

**Q: How are feature flags integrated into routes?**

Every route is wrapped with `openFeatureValidation('flag-key')` middleware:

```typescript
router.post('/create', openFeatureValidation('company-create'), authorizeUser, controller);
```

If the flag is `false`, the middleware returns HTTP 403 before auth or business logic runs. This is a kill switch — any route can be instantly disabled in production without a deploy.

Use cases in this codebase:
- Gradual rollout of new features to a subset of companies
- A/B testing new checkout flows
- Emergency kill switch if a feature causes issues

---

**Q: What is FlagD and how is it configured?**

FlagD is an open-source feature flag evaluation engine that runs as a sidecar service. It reads flag definitions from a JSON config file. The app connects to it via `FLAGD_HOST` and `FLAGD_PORT` environment variables. In Docker Compose, FlagD runs as a separate container (`Dockerfile.flagd`).

---

## 12. Observability & Monitoring

**Q: How is distributed tracing implemented?**

OpenTelemetry SDK (`@opentelemetry/sdk-node`) with Google Cloud Trace exporter:

1. `src/openTelemetry/register.ts` initializes the SDK at startup (before any other imports)
2. Auto-instrumentation patches HTTP, Express, and `pg` (PostgreSQL) — no manual instrumentation needed for most operations
3. Every request gets a trace with child spans for: route handling, service calls, DB queries, outbound HTTP
4. Spans are exported to Google Cloud Trace for visualization

Resource attributes (`service.name`, `service.version`, `deployment.environment`) allow filtering traces by environment.

---

**Q: How does the Winston logger integrate with OpenTelemetry?**

The logger (`src/common/logger.ts`) reads the current active span and attaches trace/span IDs to every log entry:

```json
{
  "message": "Processing order",
  "level": "info",
  "logging.googleapis.com/trace": "projects/my-project/traces/abc123",
  "logging.googleapis.com/spanId": "def456",
  "logging.googleapis.com/trace_sampled": true
}
```

This means every log line in Google Cloud Logging can be correlated to its trace in Google Cloud Trace — you can go from a log line directly to the full request trace.

---

**Q: How are correlation IDs used?**

A `x-correlation-id` header is accepted from upstream callers (API gateway, load balancer) or generated if absent. It's:
- Attached to the OTel span as an attribute
- Included in every log line
- Returned in the response header

For a distributed system with multiple services, the correlation ID stitches together all the logs from a single user action across services.

---

**Q: What does the health check endpoint do?**

`GET /_status/healthz` returns:
```json
{ "success": true, "message": "Health check passed successfully", "statusCode": 200 }
```

On startup the app also calls `checkDatabaseConnection()` to verify PostgreSQL is reachable. This endpoint is polled by the load balancer/Kubernetes liveness probe.

---

## 13. Security

**Q: How does Helmet protect the API?**

Helmet sets security-focused HTTP response headers:

| Header | What it does |
|---|---|
| `Content-Security-Policy` | Restricts sources for scripts, styles, images |
| `Strict-Transport-Security` | Forces HTTPS (default: 1 year) |
| `X-Frame-Options` | Prevents clickjacking (sameorigin) |
| `X-Content-Type-Options` | Prevents MIME sniffing |
| `Referrer-Policy` | Controls referrer info leakage |
| `Permissions-Policy` | Restricts browser APIs (camera, geolocation, etc.) |

All values are configurable via environment variables, so security policies can be tightened per environment without code changes.

---

**Q: How is SQL injection prevented?**

Prisma uses parameterized queries for all operations — user input is never interpolated into SQL strings. Additionally, `src/common/security/sanitize.ts` sanitizes Prisma query arguments before logging them, preventing sensitive data from appearing in logs even if queries contain PII.

---

**Q: How are passwords stored?**

`bcryptjs` with a salt round of at least 10. Passwords are never stored in plain text. The hash is stored in the user record and compared on login using `bcrypt.compare()`.

---

**Q: How are secrets managed?**

Secrets are injected via environment variables (never hardcoded):
- `JWT_AUTH_TOKEN_SECRETKEY` — JWT signing secret
- `DATABASE_URL` — DB connection string with credentials
- `BIGCOMMERCE_*` — API tokens
- `GOOGLE_APPLICATION_CREDENTIALS` / `GOOGLE_CLOUD_KEYFILE_JSON` — GCP service account

In production these are injected by the deployment platform (Kubernetes Secrets, Cloud Run env vars). The `.env` file is gitignored.

---

**Q: How does CORS work in this API?**

CORS is configured to allow credentials (`Access-Control-Allow-Credentials: true`) and all HTTP methods. Origin whitelisting is managed via environment config. The `cookie-parser` middleware handles session cookies that carry locale preferences.

---

## 14. Performance & Scalability

**Q: How is database connection pooling handled?**

Prisma uses `@prisma/adapter-pg` with a Node.js `pg.Pool`. The pool:
- Maintains a configurable number of persistent connections
- Reuses connections across requests (no connect/disconnect overhead per request)
- Queues requests when all connections are busy

This is critical for a Node.js server where hundreds of concurrent requests share a small pool of DB connections.

---

**Q: How are expensive operations kept off the critical path?**

Via Google Cloud PubSub:
- BigCommerce sync → async
- Solr re-indexing → async
- Email notifications → async
- PDF generation → async

The API returns success as soon as the local DB is updated. The PubSub subscriber handles propagation to other systems. If the subscriber fails, PubSub retries with exponential backoff — no data is lost.

---

**Q: How is `p-queue` used for concurrency control?**

`p-queue` is a promise queue that limits concurrent async operations. It's used in batch processing scenarios (e.g., indexing thousands of products into Solr) where firing all operations in parallel would overwhelm the target system or exhaust the connection pool.

```typescript
const queue = new PQueue({ concurrency: 10 });
products.forEach(p => queue.add(() => indexProduct(p)));
await queue.onIdle();
```

---

**Q: How does the caching strategy work?**

The app primarily relies on:
1. **Local PostgreSQL** as a cache for SAP S4 data (synced periodically)
2. **Solr** as a pre-built search index (not computed at query time)
3. **PubSub-triggered invalidation** — when source data changes, a message triggers re-indexing

There is a cache purge endpoint for manual invalidation when needed.

---

## 15. Error Handling

**Q: How does the global error handler work?**

`src/middleware/errorHandler.ts` is registered as the last middleware in Express. Any error thrown by a route handler or passed via `next(err)` lands here. It:

1. Identifies the error class to determine HTTP status:
   ```
   notAuthorizedError → 401
   notAllowedError    → 403
   notFoundError      → 404
   validationError    → 406
   rateLimitError     → 429
   failedToExecute    → 500
   ```
2. Logs the error with stack trace via Winston
3. Records the error on the current OTel span
4. Sends a standard error response envelope

---

**Q: What custom error classes exist and when is each thrown?**

| Class | HTTP | When to throw |
|---|---|---|
| `notAuthorizedError` | 401 | Missing or invalid JWT |
| `notAllowedError` | 403 | Valid token but insufficient permission |
| `notFoundError` | 404 | Resource does not exist |
| `validationError` | 406 | Request body fails schema validation |
| `rateLimitError` | 429 | Rate limit bucket exhausted |
| `failedToExecute` | 500 | Unexpected internal failure |

---

**Q: How are Zod validation errors handled?**

Zod schemas are defined per-controller for request body validation. If `schema.parse(req.body)` throws, the controller catches the `ZodError` and wraps it in a `validationError`. The error handler maps this to 406 with a human-readable message listing which fields failed and why.

---

## 16. Testing Strategy

**Q: What testing frameworks are used and why two of them?**

- **Jest** — primary framework for unit tests (`test/` directory, `*.test.ts` files). TypeScript-native via `ts-jest`. Used for service/controller unit tests with mocks.
- **Mocha + Chai** — used for integration/functional tests that pre-date the Jest setup. Kept for backward compatibility.

---

**Q: How are unit tests structured for services?**

Services are tested by mocking Prisma and external API clients:
- `jest-mock-extended` provides type-safe mocks for Prisma client
- `node-mocks-http` creates mock Express `req`/`res` objects for controller tests
- Services are tested with fake inputs and expected `CommonServiceResponse` outputs

---

**Q: What is the Jest configuration?**

```typescript
// jest.config.ts
{
  preset: 'ts-jest',
  testEnvironment: 'node',
  maxWorkers: '75%',           // parallel test execution
  testTimeout: 50000,          // 50s for integration tests
  collectCoverage: true
}
```

75% of CPU cores used for parallel test execution — keeps the full test suite fast.

---

## 17. CI/CD & Deployment

**Q: How does the Docker build work?**

Multi-stage `Dockerfile`:

```dockerfile
# Stage 1: Build
FROM node:23-alpine AS builder
COPY . .
RUN npm ci && npm run build   # TypeScript → dist/
RUN npx prisma generate        # Generate Prisma client

# Stage 2: Runtime
FROM node:23-alpine
USER node                      # Non-root for security
COPY --from=builder dist/ .
COPY --from=builder node_modules/ .
CMD ["node", "server.js"]
```

Multi-stage build keeps the final image small — no TypeScript compiler or source files in production.

---

**Q: How are commit messages enforced?**

`commitlint` + Husky pre-commit hook enforces:
```
<type>: DB1-<JIRA_TICKET_NO> <message>
```
Types: `feat | fix | chore | docs | style | refactor | test | revert`

This links every commit to a JIRA ticket, making git history a reliable audit trail for changes.

---

**Q: How are releases managed?**

The `Makefile` automates releases:
```makefile
release:
  npm version patch
  git tag prod-v$(VERSION)
  git tag stage-v$(VERSION)
  git push --tags
```

Git tags (`prod-v*`, `stage-v*`, `qa-v*`) drive deployment pipelines — a push of the right tag triggers the corresponding environment's CI deploy.

---

**Q: What pre-commit hooks run?**

Husky runs on every `git commit`:
1. ESLint on changed files
2. Prettier formatting check
3. Commitlint message format validation

If any check fails, the commit is blocked. This catches issues before they hit CI.

---

## 18. Multi-Tenancy & Localization

**Q: How is multi-tenancy handled?**

Tenancy is at the Company level. A single database holds all companies, with data isolation enforced at the query level — all queries include a `company_id` filter. Companies can be:
- **Parent companies** — enterprise customers
- **Child companies** — divisions or subsidiaries
- **Locations** — individual ship-to addresses

A user's JWT enrichment loads their company context, and all service queries scope data to that company hierarchy.

---

**Q: How does localization work?**

The platform supports 7+ locales (`en-us`, `en-ca`, `fr-ca`, `es-mx`, etc.). Locale is:
1. Stored in a cookie after user preference selection
2. Read by the auth middleware → attached to `req.user.locale`
3. Passed to ContentStack queries → returns locale-specific CMS content
4. Used for date/number formatting (Luxon library)
5. Used by the front-end to select translation strings (via `messageCodes` in error responses)

Currency and pricing are also channel-specific — a Canadian company sees CAD pricing from a CA-specific price list.

---

**Q: How are multiple sales channels managed?**

`edb_channel` represents a sales channel (e.g., US web, CA web, FR-CA web). Companies are enrolled in specific channels via `edb_channelcompany_m_m`. A channel determines:
- Default currency
- Available locales
- Applicable customer groups
- Price lists
- BigCommerce store context (separate BC store per channel)

The auth middleware resolves the user's active channel from their company enrollment and attaches it to the request context.

---

## Quick Reference

| Concern | Solution Used |
|---|---|
| Framework | Express.js 4 |
| Language | TypeScript 5 |
| ORM | Prisma 6 |
| Database | PostgreSQL |
| Auth | Passport.js + JWT |
| RBAC | Custom matrix (`mtx_*` tables) |
| Search | Apache Solr |
| E-commerce engine | BigCommerce |
| ERP | SAP S4 |
| CMS | ContentStack |
| Async messaging | Google Cloud PubSub |
| Feature flags | OpenFeature + FlagD |
| Tracing | OpenTelemetry → Google Cloud Trace |
| Logging | Winston (structured JSON) |
| Security headers | Helmet |
| Rate limiting | rate-limiter-flexible |
| Validation | Zod |
| Testing | Jest + ts-jest |
| API docs | Swagger (OpenAPI 3.0) |
| Containerization | Docker multi-stage build |
| CI hooks | Husky + commitlint |
