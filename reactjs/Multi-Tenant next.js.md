# Multi-Tenant Application in Next.js — Complete Interview Guide


---

## Table of Contents

1. [What is Multi-Tenancy?](#1-what-is-multi-tenancy)
2. [Multi-Tenant Architecture Approaches](#2-multi-tenant-architecture-approaches)
3. [Tenant Identification — How the App Knows Which Tenant](#3-tenant-identification)
4. [Authentication in Multi-Tenant Apps](#4-authentication-in-multi-tenant-apps)
5. [Token Storage — Where to Store Tokens and Why](#5-token-storage)
6. [Database Strategies for Multi-Tenancy](#6-database-strategies-for-multi-tenancy)
7. [Row-Level Security (RLS)](#7-row-level-security)
8. [Authorization & Role-Based Access (RBAC)](#8-authorization-and-rbac)
9. [Tenant-Aware Middleware in Next.js](#9-tenant-aware-middleware)
10. [Tenant Switching — Users Belonging to Multiple Tenants](#10-tenant-switching)
11. [Branding & Customization Per Tenant](#11-branding-and-customization)
12. [Deployment Strategies](#12-deployment-strategies)
13. [Security Checklist](#13-security-checklist)
14. [Scenario-Based Interview Questions with Answers](#14-scenario-based-interview-questions)

---

## 1. What is Multi-Tenancy?

Multi-tenancy is a software architecture where a single application serves multiple customers (called "tenants") from one codebase and one deployment. Each tenant gets their own isolated space — their own data, users, settings, and sometimes their own branding — but they all share the same application infrastructure.

**Think of it like an apartment building:**
- The building is your application (one codebase, one deployment).
- Each apartment is a tenant (separate data, separate users, separate settings).
- The building's plumbing, electricity, and elevator are shared infrastructure (servers, database, codebase).
- Each apartment has its own lock and key (authentication, data isolation).
- A tenant in apartment 3 can never walk into apartment 7 (data isolation).

**Real-world examples:**
- **Slack** — Each workspace is a tenant. Your company's Slack is completely isolated from another company's Slack.
- **Notion** — Each workspace is a tenant with its own pages, members, and settings.
- **Shopify** — Each store is a tenant with its own products, orders, and custom domain.
- **Jira** — Each organization is a tenant with its own projects, boards, and users.

### Why Multi-Tenancy?

| Without Multi-Tenancy | With Multi-Tenancy |
|----------------------|-------------------|
| Deploy a separate app for each customer | One app serves all customers |
| 100 customers = 100 deployments to maintain | 100 customers = 1 deployment |
| Bug fix needs to be applied 100 times | Bug fix applied once, everyone gets it |
| Infrastructure cost multiplied per customer | Shared infrastructure, much cheaper |
| Each customer needs separate DevOps | Centralized operations |

---

## 2. Multi-Tenant Architecture Approaches

There are three main ways to identify and route tenants. Each has specific trade-offs.

---

### 2.1 Subdomain-Based Tenancy

Each tenant gets a unique subdomain: `acme.yourapp.com`, `globex.yourapp.com`.

**How it works in Next.js:**
1. User visits `acme.yourapp.com`.
2. Next.js Middleware reads the `Host` header from the request.
3. Middleware extracts `acme` as the tenant slug.
4. The app loads data, settings, and branding for the `acme` tenant.

```tsx
// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  
  // Extract tenant from subdomain
  // e.g., "acme.yourapp.com" → "acme"
  const tenant = hostname.split(".")[0];
  
  // Skip for main domain (yourapp.com) or localhost
  if (tenant === "www" || tenant === "yourapp" || hostname.startsWith("localhost")) {
    return NextResponse.next();
  }

  // Pass tenant info to the app via headers
  const response = NextResponse.next();
  response.headers.set("x-tenant-slug", tenant);
  return response;
}
```

**Benefits:**
- Clean, professional URLs: `acme.yourapp.com/dashboard`
- Easy to identify tenant from any request.
- Tenants can upgrade to custom domains: `dashboard.acme.com`.
- Clear separation — each tenant feels like a separate app.

**Drawbacks:**
- Requires wildcard DNS setup (`*.yourapp.com` pointing to your server).
- Needs wildcard SSL certificate for HTTPS.
- Local development is harder — you need to configure `/etc/hosts` or use tools like `nip.io`.
- Custom domains require additional SSL certificate management.

**Best for:** SaaS products where each tenant is a separate organization (Slack, Notion, Jira).

---

### 2.2 Path-Based Tenancy

Each tenant is a path segment: `yourapp.com/acme/dashboard`, `yourapp.com/globex/dashboard`.

**How it works in Next.js:**

```
app/
  [tenant]/
    dashboard/
      page.tsx
    settings/
      page.tsx
    layout.tsx
```

```tsx
// app/[tenant]/dashboard/page.tsx
export default async function Dashboard({ params }: { params: { tenant: string } }) {
  const tenantData = await getTenantBySlug(params.tenant);
  
  if (!tenantData) {
    notFound(); // 404 if tenant doesn't exist
  }

  const stats = await getStats(tenantData.id);
  return <DashboardView stats={stats} tenant={tenantData} />;
}
```

**Benefits:**
- Simplest to implement — just use Next.js dynamic routes.
- No DNS or SSL configuration needed.
- Works on any hosting platform without special setup.
- Local development works out of the box.

**Drawbacks:**
- URLs are longer and less clean: `/acme/dashboard` instead of `acme.yourapp.com/dashboard`.
- Feels less like a separate product for each tenant.
- SEO can be tricky — search engines might see it as one website with different sections.
- Harder to add custom domains later.

**Best for:** Internal tools, early-stage products, B2B apps where URL aesthetics matter less.

---

### 2.3 Custom Domain Tenancy

Each tenant brings their own domain: `dashboard.acme.com`, `app.globex.com`.

**How it works in Next.js:**

```tsx
// middleware.ts
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";

  // Look up which tenant owns this domain
  const tenant = await getTenantByDomain(hostname);

  if (!tenant) {
    return NextResponse.redirect(new URL("/not-found", request.url));
  }

  // Rewrite to the tenant-specific path internally
  const response = NextResponse.rewrite(
    new URL(`/${tenant.slug}${request.nextUrl.pathname}`, request.url)
  );
  response.headers.set("x-tenant-id", tenant.id);
  return response;
}
```

**Benefits:**
- Most professional look — the tenant's brand is front and center.
- Tenants love having their own domain (perceived ownership).
- Great for white-label products.

**Drawbacks:**
- Most complex to implement and maintain.
- Each custom domain needs its own SSL certificate (can automate with Let's Encrypt/Cloudflare).
- Tenants must configure DNS records on their end.
- Debugging is harder — the same app responds to many different domains.

**Best for:** White-label SaaS, enterprise clients who want branded experiences (Shopify, WordPress multisite).

---

### Comparison Table

| Factor | Subdomain | Path | Custom Domain |
|--------|-----------|------|---------------|
| URL example | `acme.app.com` | `app.com/acme` | `dashboard.acme.com` |
| Setup complexity | Medium | Low | High |
| DNS/SSL effort | Wildcard needed | None | Per-domain certificates |
| Local dev ease | Hard | Easy | Hard |
| White-label ready | Partially | No | Yes |
| Tenant identity | From hostname | From URL path | From domain lookup |
| Best for | SaaS orgs | Internal tools | Enterprise / white-label |

---

## 3. Tenant Identification — How the App Knows Which Tenant

Every single request to your app must answer one question first: "Which tenant is this for?"

### The Identification Chain

```
Request arrives
    ↓
Step 1: Middleware extracts tenant from subdomain / path / domain
    ↓
Step 2: Validate tenant exists in database
    ↓
Step 3: Attach tenant context to the request (header, cookie, or token claim)
    ↓
Step 4: Every subsequent operation uses tenant context
    ↓
Step 5: Database queries filter by tenant_id
```

### Where Tenant Info Lives During a Request

| Storage | When to Use | Example |
|---------|------------|---------|
| **Request header** (`x-tenant-id`) | Set by middleware, read by Server Components and API routes | `request.headers.get("x-tenant-id")` |
| **JWT claim** (`tenant_id` inside token) | After login, include tenant ID in the token so every authenticated request carries it | `{ sub: "user_123", tenant_id: "acme_456" }` |
| **Cookie** | Store active tenant ID in a cookie for persistence across requests | `cookies().get("active-tenant")` |
| **URL parameter** | Path-based tenancy reads it from the URL | `params.tenant` |

### Critical Rule: Never Trust the Client

The tenant identifier must always be validated server-side. If a user sends `x-tenant-id: evil_tenant` in their request header, the server must verify they actually belong to that tenant. The middleware is the gatekeeper — it validates the tenant before the request reaches any page or API route.

---

## 4. Authentication in Multi-Tenant Apps

Authentication in multi-tenant apps is more complex than single-tenant apps because you must answer two questions instead of one:

1. **"Who is this user?"** — Standard authentication.
2. **"Which tenant do they belong to?"** — Tenant membership.

And often a third: **"What can they do in this tenant?"** — Tenant-specific authorization (roles and permissions).

---

### 4.1 Authentication Approaches

#### Approach 1: Shared Authentication, Tenant-Scoped Sessions

**How it works:** One user account, one login. After login, the user's token or session contains their tenant memberships. If they belong to multiple tenants, they can switch between them.

```
User: alice@example.com
  ├── Tenant: Acme Corp (role: admin)
  ├── Tenant: Globex Inc (role: member)
  └── Tenant: Initech (role: viewer)
```

**JWT structure after login:**

```json
{
  "sub": "user_alice_123",
  "email": "alice@example.com",
  "active_tenant": {
    "id": "tenant_acme_456",
    "slug": "acme",
    "role": "admin"
  },
  "tenants": [
    { "id": "tenant_acme_456", "role": "admin" },
    { "id": "tenant_globex_789", "role": "member" },
    { "id": "tenant_initech_012", "role": "viewer" }
  ],
  "iat": 1700000000,
  "exp": 1700003600
}
```

**Benefits:**
- One login for all tenants — smooth user experience.
- User can switch tenants without re-authenticating.
- Centralized user management.

**Drawbacks:**
- Token gets larger as the user joins more tenants.
- Switching tenants requires issuing a new token with a different `active_tenant`.
- More complex token validation logic.

**Best for:** SaaS platforms where users commonly belong to multiple orgs (Slack, Notion, GitHub).

---

#### Approach 2: Per-Tenant Authentication (Isolated Login)

**How it works:** Each tenant has its own login page. Users authenticate specifically against one tenant. There's no cross-tenant session.

```
acme.yourapp.com/login    → logs in to Acme only
globex.yourapp.com/login  → logs in to Globex only
```

**JWT structure:**

```json
{
  "sub": "user_alice_acme",
  "email": "alice@example.com",
  "tenant_id": "tenant_acme_456",
  "role": "admin",
  "exp": 1700003600
}
```

**Benefits:**
- Simpler token structure — one token, one tenant.
- Stronger isolation — compromising one tenant's auth doesn't affect others.
- Each tenant can have different auth providers (Acme uses Google SSO, Globex uses SAML).

**Drawbacks:**
- Users must log in separately for each tenant.
- No unified user profile across tenants.
- Managing multiple sessions is complex.

**Best for:** Enterprise/regulated environments where strong isolation is required (healthcare, finance).

---

#### Approach 3: SSO (Single Sign-On) with Tenant Selection

**How it works:** User authenticates once through a central identity provider. After authentication, they select which tenant/workspace to enter. The system issues a tenant-scoped token for the selected workspace.

```
1. User visits yourapp.com/login
2. Redirected to SSO provider (Google, Okta, Azure AD)
3. SSO confirms identity
4. App shows: "Select workspace: [Acme] [Globex] [Initech]"
5. User picks Acme → app issues Acme-scoped token
```

**Benefits:**
- Best user experience — one login, clear workspace selection.
- Enterprise customers love SSO (often a requirement).
- Can integrate with corporate identity providers (Okta, Azure AD, Auth0).

**Drawbacks:**
- Most complex to implement.
- Requires integration with multiple identity providers.
- Token refresh and session management across tenants is non-trivial.

**Best for:** Enterprise SaaS with corporate customers who need SSO.

---

### 4.2 Auth Libraries for Next.js Multi-Tenant

| Library | How It Helps | Multi-Tenant Support |
|---------|-------------|---------------------|
| **NextAuth.js / Auth.js** | Full auth solution with OAuth, credentials, magic links | Good — extend session/JWT callbacks to include tenant data |
| **Clerk** | Drop-in auth with UI components | Built-in organization/team support |
| **Auth0** | Enterprise-grade auth-as-a-service | Organizations feature for multi-tenancy |
| **Supabase Auth** | Auth integrated with Supabase database | Combine with RLS for tenant isolation |
| **Custom JWT** | Build your own auth flow | Full control over tenant claims |

### 4.3 NextAuth.js Multi-Tenant Example

```tsx
// auth.ts (NextAuth configuration)
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google, GitHub, Credentials],

  callbacks: {
    // Add tenant info to JWT token
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // On first login, fetch user's tenant memberships
        const memberships = await prisma.membership.findMany({
          where: { userId: user.id },
          include: { tenant: true },
        });

        token.tenants = memberships.map(m => ({
          id: m.tenant.id,
          slug: m.tenant.slug,
          role: m.role,
        }));

        // Set first tenant as active (or the one from the subdomain)
        token.activeTenantId = memberships[0]?.tenant.id;
        token.activeTenantRole = memberships[0]?.role;
      }

      // Handle tenant switching
      if (trigger === "update" && session?.activeTenantId) {
        const membership = token.tenants.find(
          t => t.id === session.activeTenantId
        );
        if (membership) {
          token.activeTenantId = membership.id;
          token.activeTenantRole = membership.role;
        }
      }

      return token;
    },

    // Make tenant info available in the session
    async session({ session, token }) {
      session.user.tenants = token.tenants;
      session.user.activeTenantId = token.activeTenantId;
      session.user.activeTenantRole = token.activeTenantRole;
      return session;
    },
  },
});
```

---

## 5. Token Storage — Where to Store Tokens and Why

This is one of the most asked interview questions: **"Where do you store authentication tokens in a multi-tenant app?"**

There are four common storage options. Each has trade-offs between security, convenience, and complexity.

---

### 5.1 Option 1: HttpOnly Cookie (Recommended)

**What it is:** The server sets the token in a cookie with the `HttpOnly` flag. The browser stores the cookie and automatically sends it with every request. JavaScript on the page **cannot** read or modify this cookie — it's invisible to client-side code.

```tsx
// Server-side: Setting the token in an HttpOnly cookie
// (API route or Server Action)
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  // Authenticate user
  const user = await authenticateUser(email, password);
  const token = generateJWT({
    sub: user.id,
    tenant_id: user.activeTenantId,
    role: user.role,
  });

  // Set HttpOnly cookie
  cookies().set("auth-token", token, {
    httpOnly: true,    // JavaScript CANNOT access this cookie
    secure: true,      // Only sent over HTTPS
    sameSite: "lax",   // Prevents CSRF on cross-site requests
    path: "/",
    maxAge: 60 * 60,   // 1 hour
  });

  return Response.json({ success: true });
}
```

```tsx
// Server-side: Reading the token
// (Middleware, Server Component, or API route)
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";

export async function getSession() {
  const token = cookies().get("auth-token")?.value;
  if (!token) return null;

  try {
    const payload = await verifyJWT(token);
    return payload; // { sub, tenant_id, role }
  } catch {
    return null;
  }
}
```

**Why it's recommended:**
- **XSS-proof** — Even if an attacker injects JavaScript into your page, they cannot steal the token because JavaScript has zero access to HttpOnly cookies.
- **Automatic** — The browser sends the cookie with every request. No client-side code needed.
- **Works with Server Components** — Next.js can read cookies in middleware and Server Components.

**Drawbacks:**
- Vulnerable to CSRF (Cross-Site Request Forgery) — mitigate with `sameSite: "lax"` or `"strict"` and CSRF tokens.
- Cookie has a 4KB size limit — if your JWT is large (many tenant claims), it may not fit.
- Sharing tokens across subdomains requires `domain: ".yourapp.com"` — which means all subdomains (all tenants) share the same cookie space.

---

### 5.2 Option 2: localStorage

**What it is:** Tokens stored in the browser's `localStorage` using `localStorage.setItem("token", jwt)`. Persists across browser sessions until explicitly cleared.

```tsx
// Client-side: Storing the token
const response = await fetch("/api/login", { method: "POST", body: ... });
const { token } = await response.json();
localStorage.setItem("auth-token", token);

// Client-side: Using the token
const token = localStorage.getItem("auth-token");
fetch("/api/data", {
  headers: { Authorization: `Bearer ${token}` }
});
```

**Why people use it:** Simple to implement. Token is available instantly on the client for API calls.

**Why it's dangerous:**
- **Vulnerable to XSS** — Any JavaScript running on your page (including injected scripts from a third-party library, ad, or attack) can read `localStorage` and steal the token.
- Once stolen, the attacker has full access to the user's account.
- Not accessible from Server Components or middleware.

**Verdict:** Not recommended for production multi-tenant apps. The XSS risk is too high when dealing with multi-tenant data isolation.

---

### 5.3 Option 3: sessionStorage

**Same as localStorage but clears when the browser tab is closed.** Same XSS vulnerability. Slightly better because the token doesn't persist after the session, but still risky.

**Verdict:** Not recommended for the same reasons as localStorage.

---

### 5.4 Option 4: In-Memory + HttpOnly Refresh Token (Best Security)

**What it is:** A hybrid approach that combines the security of HttpOnly cookies with the CSRF-resistance of in-memory storage.

- **Access token** (short-lived, 15 minutes) → stored in JavaScript memory (a variable or React state). Lost on page refresh.
- **Refresh token** (long-lived, 7-30 days) → stored in an HttpOnly cookie. Used to get a new access token when the current one expires.

```
How it works:

1. User logs in → Server returns:
   - Access token (in response body) → stored in memory
   - Refresh token (in HttpOnly cookie) → stored by browser

2. User makes API call → Sends access token from memory in Authorization header

3. Access token expires (after 15 min) → Client calls /api/refresh
   - Browser automatically sends refresh cookie
   - Server validates refresh token
   - Server returns new access token → stored in memory again

4. User closes tab → Access token is gone (it was in memory)
   User reopens tab → Refresh cookie still exists
   App calls /api/refresh on load → Gets new access token → User stays logged in
```

```tsx
// Server: Login endpoint
export async function POST(request: Request) {
  const user = await authenticateUser(/*...*/);

  // Short-lived access token — returned in response body
  const accessToken = generateJWT(
    { sub: user.id, tenant_id: user.activeTenantId, role: user.role },
    { expiresIn: "15m" }
  );

  // Long-lived refresh token — stored in HttpOnly cookie
  const refreshToken = generateRefreshToken(user.id);

  cookies().set("refresh-token", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/api/refresh",  // only sent to refresh endpoint
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return Response.json({ accessToken });
}
```

```tsx
// Client: Auth context
"use client";
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // On app load, try to get an access token using the refresh cookie
  useEffect(() => {
    refreshAccessToken();
  }, []);

  async function refreshAccessToken() {
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      if (res.ok) {
        const { accessToken } = await res.json();
        setAccessToken(accessToken);
      }
    } catch {
      setAccessToken(null); // User is logged out
    }
  }

  return (
    <AuthContext.Provider value={{ accessToken, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Why it's the most secure:**
- Access token is in memory → JavaScript injection can access it, but it expires in 15 minutes and is lost on page refresh.
- Refresh token is in HttpOnly cookie → JavaScript cannot access it at all.
- Refresh cookie only goes to `/api/refresh` → minimizes CSRF surface.
- Even if the access token is stolen, the damage window is only 15 minutes.

**Drawbacks:**
- Most complex to implement.
- Page refresh requires a round-trip to `/api/refresh` before the app is fully authenticated.
- Must handle the brief "loading" state while the access token is being refreshed.

---

### Token Storage Comparison

| Storage | XSS Safe? | CSRF Safe? | Survives Refresh? | Server Accessible? | Recommended? |
|---------|-----------|-----------|-------------------|-------------------|-------------|
| **HttpOnly Cookie** | Yes | Needs `sameSite` | Yes | Yes (middleware, Server Components) | Yes — for most apps |
| **localStorage** | No — JS can read it | Yes | Yes | No | No |
| **sessionStorage** | No — JS can read it | Yes | No (dies on tab close) | No | No |
| **In-Memory + HttpOnly Refresh** | Mostly (15 min window) | Yes | Yes (via refresh) | Partially | Yes — for high-security apps |

### Multi-Tenant Specific Token Considerations

When dealing with multi-tenant apps, you also need to decide:

**What goes in the token?**

| Claim | Purpose | Include? |
|-------|---------|---------|
| `sub` (user ID) | Identify the user | Always |
| `tenant_id` | Identify the active tenant | Always |
| `role` | User's role in the active tenant | Always |
| `tenants[]` | List of all tenant memberships | Only if user can switch tenants without re-auth |
| `permissions[]` | Specific permissions | Only if using fine-grained permissions |

**Cookie domain for subdomain tenancy:**

```tsx
// Setting cookie domain for subdomain-based multi-tenancy
cookies().set("auth-token", token, {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  domain: ".yourapp.com",  // Leading dot = shared across all subdomains
  path: "/",               // acme.yourapp.com and globex.yourapp.com both get this cookie
});
```

**Warning:** Sharing cookies across subdomains means Tenant A's subdomain could theoretically read Tenant B's cookie. The cookie holds a JWT, so the data is signed and tamper-proof — but the token itself is accessible. For maximum isolation, use per-tenant cookies or the in-memory + refresh token approach.

---

## 6. Database Strategies for Multi-Tenancy

How you store tenant data is one of the most critical architectural decisions. There are three strategies:

---

### 6.1 Shared Database, Shared Schema (tenant_id Column)

**What it is:** All tenants share one database and the same tables. Every row has a `tenant_id` column that identifies which tenant the data belongs to. Every query must filter by `tenant_id`.

```sql
-- Every table has a tenant_id column
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_projects_tenant ON projects(tenant_id);

-- Every query MUST include tenant_id
SELECT * FROM projects WHERE tenant_id = 'acme_456' AND status = 'active';
```

```tsx
// Prisma example
const projects = await prisma.project.findMany({
  where: {
    tenantId: session.activeTenantId,  // NEVER forget this filter
    status: "active",
  },
});
```

**Benefits:**
- Simplest to implement and manage.
- Cheapest — one database, one connection pool.
- Easy to run cross-tenant analytics and reporting.
- Adding a new tenant costs nothing (just insert a row in the tenants table).
- Schema migrations apply once and affect all tenants.

**Drawbacks:**
- A developer forgetting `WHERE tenant_id = ...` causes a data leak across tenants.
- One slow tenant's heavy queries can affect all other tenants (noisy neighbor problem).
- Harder to give a single tenant their own backup or data export.
- All tenants share the same database performance limits.

**Best for:** Startups, early-stage SaaS, apps with many small tenants, where speed of development matters more than maximum isolation.

---

### 6.2 Shared Database, Separate Schema

**What it is:** All tenants share one database server, but each tenant gets their own PostgreSQL schema (like a namespace). Tables are identical in structure but isolated by schema.

```sql
-- Create a schema for each tenant
CREATE SCHEMA tenant_acme;
CREATE SCHEMA tenant_globex;

-- Same table structure in each schema
CREATE TABLE tenant_acme.projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Query uses schema prefix
SELECT * FROM tenant_acme.projects WHERE status = 'active';
-- OR set search_path per session:
SET search_path TO tenant_acme;
SELECT * FROM projects WHERE status = 'active';
```

**Benefits:**
- Stronger isolation than shared schema — no risk of forgetting `tenant_id` filter.
- Per-tenant backup and restore is possible (dump one schema).
- Can run different schema versions per tenant during migrations.
- Still uses one database, so connection management is simpler than full DB isolation.

**Drawbacks:**
- Schema migrations must be applied to each schema separately.
- Cross-tenant analytics requires querying across schemas (complex).
- New tenant onboarding involves creating a schema and all tables.
- 1000 tenants = 1000 schemas — management overhead grows.

**Best for:** Mid-market SaaS with moderate tenant count (10-500 tenants) needing stronger isolation.

---

### 6.3 Separate Database Per Tenant

**What it is:** Each tenant gets their own completely separate database. Full isolation.

```
tenant_acme_db    → Acme's data
tenant_globex_db  → Globex's data
tenant_initech_db → Initech's data
```

```tsx
// Application routes to the correct database
function getDatabaseUrl(tenantId: string): string {
  const tenantConfig = tenantDatabaseMap[tenantId];
  return tenantConfig.databaseUrl;
}

// Create tenant-specific Prisma client
function getTenantPrisma(tenantId: string) {
  const url = getDatabaseUrl(tenantId);
  return new PrismaClient({ datasources: { db: { url } } });
}
```

**Benefits:**
- Maximum isolation — one tenant's data is physically separate.
- No noisy neighbor — each database has its own resources.
- Per-tenant backup, restore, and data export is trivial.
- Can host a tenant's database in a specific region for compliance (GDPR).
- Easiest to handle tenant deletion — just drop the database.

**Drawbacks:**
- Most expensive — each database costs money.
- Most complex operations — managing 1000 databases requires automation.
- Connection pool management is complex (a pool per database).
- Cross-tenant analytics is very difficult.
- Schema migrations must be applied to every database.

**Best for:** Enterprise SaaS with strict compliance requirements, large tenants that need dedicated resources, regulated industries (healthcare, finance).

---

### Which Database Strategy to Choose?

```
How many tenants?
├── Many (100+) with small data → Shared Schema + tenant_id (+ RLS)
├── Moderate (10-100) with medium data → Separate Schemas
├── Few (<10) with large data/compliance → Separate Databases
└── Mixed → Hybrid: shared for small tenants, separate DB for enterprise
```

**The Hybrid Approach (Real-World Best Practice):**
Start with shared schema + `tenant_id` for all tenants. When an enterprise customer needs strict isolation (compliance, dedicated resources), offer them a separate database. Your app's tenant routing layer decides which database to connect to based on the tenant's tier.

---

## 7. Row-Level Security (RLS)

### What is RLS?

Row-Level Security is a PostgreSQL feature that automatically filters rows based on policies you define. Even if your application code forgets the `WHERE tenant_id = ...` clause, the database itself prevents cross-tenant data access. It's a safety net at the database level.

### How it Works

```sql
-- Step 1: Enable RLS on the table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Step 2: Create a policy that filters by tenant
CREATE POLICY tenant_isolation ON projects
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Step 3: In your application, set the tenant context per request
SET app.current_tenant_id = 'acme_456';

-- Step 4: Now all queries are automatically filtered
SELECT * FROM projects;
-- PostgreSQL internally executes: SELECT * FROM projects WHERE tenant_id = 'acme_456'

-- Even if code does: SELECT * FROM projects (no WHERE clause)
-- RLS ensures only acme_456's data is returned
```

### Setting Tenant Context in Next.js

```tsx
// lib/db.ts — Tenant-aware database client
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function withTenantContext<T>(
  tenantId: string,
  queryFn: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    // Set tenant context for this connection — RLS uses this
    await client.query("SET app.current_tenant_id = $1", [tenantId]);
    
    // Run the actual query — RLS automatically filters
    const result = await queryFn(client);
    return result;
  } finally {
    // Reset and release
    await client.query("RESET app.current_tenant_id");
    client.release();
  }
}

// Usage in a Server Component
const projects = await withTenantContext(session.tenantId, async (client) => {
  const res = await client.query("SELECT * FROM projects WHERE status = $1", ["active"]);
  return res.rows;
});
// RLS guarantees only the current tenant's projects are returned
```

### Why RLS Matters

| Without RLS | With RLS |
|------------|---------|
| Developer forgets `WHERE tenant_id = ...` → data leak | Database enforces filter automatically — no leak possible |
| Security depends on every developer writing correct queries | Security enforced at the database level — one policy, all queries protected |
| Code reviews must catch every missing filter | Defense in depth — even buggy code can't leak data |

---

## 8. Authorization and RBAC

### What is RBAC?

Role-Based Access Control assigns permissions to roles, then assigns roles to users within each tenant. A user might be an admin in one tenant and a viewer in another.

### Common Multi-Tenant Role Structure

```
Tenant: Acme Corp
├── Owner (1 person)
│   └── Can do everything: billing, invite members, delete tenant
├── Admin (2-3 people)
│   └── Can manage projects, members, settings (not billing or deletion)
├── Member (20 people)
│   └── Can create/edit projects, comment, upload files
└── Viewer (5 people)
    └── Can only read projects and view reports
```

### Database Schema for RBAC

```sql
-- Users table (tenant-independent)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT
);

-- Tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free'
);

-- Membership table (the bridge — ties users to tenants with roles)
CREATE TABLE memberships (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, tenant_id)  -- a user has one role per tenant
);
```

### Checking Permissions in Next.js

```tsx
// lib/auth.ts
type Role = "owner" | "admin" | "member" | "viewer";

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export function hasMinRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Server Component usage
export default async function SettingsPage() {
  const session = await getSession();

  if (!hasMinRole(session.role, "admin")) {
    redirect("/unauthorized");
  }

  return <SettingsForm />;
}

// Middleware usage for route protection
export function middleware(request: NextRequest) {
  const session = getSessionFromCookie(request);

  if (request.nextUrl.pathname.startsWith("/settings")) {
    if (!hasMinRole(session.role, "admin")) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }
}
```

---

## 9. Tenant-Aware Middleware in Next.js

Middleware is the heart of a multi-tenant Next.js app. It runs before every request and handles: tenant identification, authentication validation, tenant authorization, and routing.

```tsx
// middleware.ts — Complete multi-tenant middleware
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";
import { getTenantBySlug } from "./lib/tenants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip public routes
  if (pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // 2. Extract tenant from subdomain
  const hostname = request.headers.get("host") || "";
  const tenantSlug = hostname.split(".")[0];

  // 3. Validate tenant exists
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    return NextResponse.redirect(new URL("/tenant-not-found", request.url));
  }

  // 4. Check authentication
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 5. Verify token and check tenant membership
  const session = await verifyToken(token);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isMember = session.tenants.some(t => t.id === tenant.id);
  if (!isMember) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // 6. Pass tenant context to the application
  const response = NextResponse.next();
  response.headers.set("x-tenant-id", tenant.id);
  response.headers.set("x-tenant-slug", tenant.slug);
  response.headers.set("x-user-role", session.tenants.find(t => t.id === tenant.id).role);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

---

## 10. Tenant Switching — Users Belonging to Multiple Tenants

A common pattern: Alice is an admin at Acme Corp and a viewer at Globex Inc. She needs to switch between them seamlessly.

### How Tenant Switching Works

```
Alice is on acme.yourapp.com (active tenant: Acme, role: admin)
    ↓
Alice clicks "Switch to Globex" in the tenant picker
    ↓
Option A (Subdomain): Redirect to globex.yourapp.com
    - If cookie domain is .yourapp.com → already authenticated
    - Cookie/JWT already contains her Globex membership
    - Middleware reads new subdomain → loads Globex context

Option B (Same domain): Call /api/switch-tenant { tenantId: "globex" }
    - Server validates Alice's Globex membership
    - Server issues new JWT with activeTenantId = "globex", role = "viewer"
    - New token set in cookie
    - Page refreshes with Globex data
```

### Server Action for Tenant Switching

```tsx
"use server";

export async function switchTenant(targetTenantId: string) {
  const session = await getSession();

  // Validate user belongs to target tenant
  const membership = await prisma.membership.findUnique({
    where: {
      userId_tenantId: {
        userId: session.userId,
        tenantId: targetTenantId,
      },
    },
  });

  if (!membership) {
    throw new Error("You don't have access to this tenant");
  }

  // Issue new token with updated active tenant
  const newToken = generateJWT({
    sub: session.userId,
    tenant_id: targetTenantId,
    role: membership.role,
    tenants: session.tenants, // keep the full list
  });

  cookies().set("auth-token", newToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  redirect("/dashboard"); // Redirect to dashboard of new tenant
}
```

---

## 11. Branding and Customization Per Tenant

Multi-tenant apps often need per-tenant theming: custom logos, colors, fonts, and even feature toggles.

### Tenant Configuration Schema

```tsx
interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  branding: {
    logo: string;
    primaryColor: string;
    accentColor: string;
    favicon: string;
  };
  features: {
    enableBilling: boolean;
    enableAnalytics: boolean;
    maxUsers: number;
  };
  plan: "free" | "pro" | "enterprise";
}
```

### Applying Branding via CSS Variables

```tsx
// app/[tenant]/layout.tsx
export default async function TenantLayout({ children, params }) {
  const tenant = await getTenant(params.tenant);

  return (
    <div
      style={{
        "--primary-color": tenant.branding.primaryColor,
        "--accent-color": tenant.branding.accentColor,
      } as React.CSSProperties}
    >
      <header>
        <img src={tenant.branding.logo} alt={tenant.name} />
      </header>
      {children}
    </div>
  );
}
```

---

## 12. Deployment Strategies

| Strategy | How It Works | Best For |
|----------|-------------|----------|
| **Single deployment, subdomain routing** | One Next.js app on Vercel/AWS, wildcard DNS `*.yourapp.com` routes all tenants | Most SaaS apps |
| **Single deployment, path routing** | One app, tenants identified by URL path `/acme/dashboard` | Simple multi-tenancy |
| **Multi-region deployment** | Deploy the same app to multiple regions, route tenants by geography | Global SaaS with data residency requirements |
| **Dedicated deployment per enterprise tenant** | Large enterprise customers get their own isolated deployment | Enterprise with strict compliance |

---

## 13. Security Checklist

| Item | Status |
|------|--------|
| Every database query filters by `tenant_id` (or RLS enforces it) | Must have |
| JWT tokens include `tenant_id` claim — validated server-side on every request | Must have |
| Middleware validates tenant membership before allowing access | Must have |
| HttpOnly + Secure + SameSite flags on auth cookies | Must have |
| Never trust `tenant_id` from client — always validate against session | Must have |
| Row-Level Security enabled at the database level | Strongly recommended |
| Rate limiting per tenant to prevent abuse | Recommended |
| Audit logging for cross-tenant actions | Recommended |
| Tenant-scoped API keys (if exposing an API) | Recommended |
| Separate encryption keys per tenant for sensitive data | For enterprise/compliance |
| Regular penetration testing for tenant isolation | For production SaaS |

---

## 14. Scenario-Based Interview Questions with Answers

---

### S1: Design a Multi-Tenant SaaS Like Notion

**Scenario:** You're building a Notion-like tool where companies create workspaces. Each workspace has its own pages, members, and settings. Users can belong to multiple workspaces. How would you architect this?

**Answer:**

**Tenant model:** Each workspace is a tenant. Users can belong to multiple tenants with different roles.

**Routing:** Subdomain-based — `acme.notionclone.com`. Users switching workspaces get redirected to the other subdomain. Cookie domain set to `.notionclone.com` so the auth token is shared.

**Authentication:** Shared auth with NextAuth.js. JWT contains the user's workspace memberships. When the user visits `acme.notionclone.com`, middleware reads the subdomain, validates their membership in the Acme workspace, and loads Acme's data.

**Database:** Shared database with `workspace_id` column on every table + Row-Level Security in PostgreSQL. For a Notion clone, the shared schema is ideal because workspaces are many and small.

**Token storage:** HttpOnly cookie with `domain: ".notionclone.com"`. Token contains `active_workspace_id` and `role`. Switching workspace either redirects to the new subdomain (cookie works across subdomains) or re-issues the token with the new `active_workspace_id`.

**Authorization:** Role-based — owner, admin, editor, viewer. Page-level permissions (can share specific pages with specific users) handled by an ACL table.

---

### S2: Where Should You Store the Auth Token?

**Scenario:** An interviewer asks: "You're building a multi-tenant app. Where do you store the authentication token — localStorage, sessionStorage, HttpOnly cookie, or in-memory? Explain the trade-offs."

**Answer:**

"I would use an HttpOnly cookie for most multi-tenant applications. Here's why:

**localStorage is not safe.** Any JavaScript on the page can read it — including scripts from third-party libraries, analytics, or an XSS attack. If an attacker steals the token, they can impersonate the user across tenants. In a multi-tenant app, a stolen token potentially exposes multiple organizations' data. The risk is too high.

**sessionStorage has the same XSS vulnerability** and additionally dies when the tab closes, which is a bad user experience.

**HttpOnly cookies are the best default choice.** JavaScript cannot access them, so XSS attacks can't steal the token. The browser sends them automatically with every request, so Server Components and middleware can read them. I'd set `httpOnly: true`, `secure: true`, `sameSite: lax`, and `path: /`.

The one risk is CSRF, but `sameSite: lax` prevents most cross-site attacks, and you can add a CSRF token for extra protection.

For the subdomain model, I'd set `domain: '.myapp.com'` so the cookie is shared across tenant subdomains. The JWT inside is signed, so even though all subdomains can see it, no one can tamper with it.

**For high-security requirements**, I'd use the hybrid approach: short-lived access token (15 minutes) in memory, long-lived refresh token in an HttpOnly cookie. This minimizes the window of exposure even if the in-memory token is somehow captured."

---

### S3: How Do You Prevent Tenant Data Leaks?

**Scenario:** "Your multi-tenant app uses a shared database. A developer accidentally writes a query without the `tenant_id` filter. How do you prevent data from leaking to the wrong tenant?"

**Answer:**

"I'd implement defense in depth — multiple layers of protection so that a single mistake doesn't cause a data leak.

**Layer 1: Tenant-aware data access layer.** Instead of letting developers write raw queries, I'd create a tenant-aware wrapper that automatically injects the `tenant_id` filter. Every database call goes through this wrapper. Developers never write `WHERE tenant_id = ...` manually — the wrapper does it.

```tsx
// Developers use this — tenant_id is automatic
const projects = await tenantDb.projects.findMany({ where: { status: 'active' } });
// Internally becomes: WHERE tenant_id = 'acme_456' AND status = 'active'
```

**Layer 2: PostgreSQL Row-Level Security (RLS).** Even if the wrapper has a bug, RLS at the database level ensures queries always filter by tenant. The app sets `app.current_tenant_id` at the start of each request, and RLS policies enforce it.

**Layer 3: Code reviews with a checklist.** Every PR that touches data access is reviewed with a specific focus on tenant isolation.

**Layer 4: Automated tests.** Integration tests that explicitly verify cross-tenant isolation: create data in Tenant A, query as Tenant B, assert zero results.

**Layer 5: Audit logging.** Log every query that returns data, including the tenant context. Anomalies (a user seeing data from a tenant they don't belong to) trigger alerts."

---

### S4: Shared Database vs Separate Database

**Scenario:** "Your startup has 500 small tenants and 3 enterprise clients with strict compliance requirements (healthcare). How do you architect the database?"

**Answer:**

"I'd use a hybrid approach:

**For the 500 small tenants:** Shared database with `tenant_id` column + Row-Level Security. This is the most cost-effective and operationally simple approach. One database, one connection pool, one migration pipeline. RLS prevents cross-tenant data leaks at the database level.

**For the 3 enterprise clients:** Separate database per enterprise tenant. Healthcare compliance often requires that patient data is physically isolated, separately encrypted, and independently auditable. A dedicated database per enterprise client meets these requirements. It also allows us to host their database in a specific region (e.g., EU-only for GDPR).

**The routing layer:** Middleware identifies the tenant. A tenant configuration table stores whether the tenant uses the shared database or has a dedicated one. The data access layer reads this config and routes queries to the correct database.

```tsx
async function getDbClient(tenantId: string) {
  const config = await getTenantDbConfig(tenantId);
  
  if (config.type === 'shared') {
    // Use the shared pool with RLS tenant context
    return getSharedDbWithTenantContext(tenantId);
  } else {
    // Use the dedicated database for this tenant
    return getDedicatedDbClient(config.connectionString);
  }
}
```

This hybrid gives us cost-efficiency for the majority while meeting strict compliance for enterprise. As more small tenants grow into mid-market, we can graduate them to separate schemas or databases without changing the application code."

---

### S5: Multi-Tenant Authentication with SSO

**Scenario:** "An enterprise customer wants to use their own identity provider (Okta) for SSO. Other tenants use email/password. How do you handle this?"

**Answer:**

"The key is making the auth flow tenant-aware from the very first step:

1. **Tenant-aware login page:** When a user visits `acme.yourapp.com/login`, the app looks up Acme's tenant configuration to see which auth method they use.

2. **Tenant config stores auth settings:**
```json
{
  "tenant": "acme",
  "auth": {
    "method": "saml",
    "provider": "okta",
    "samlEntryPoint": "https://acme.okta.com/app/.../sso/saml",
    "samlCert": "..."
  }
}

{
  "tenant": "globex",
  "auth": {
    "method": "credentials",
    "allowGoogleOAuth": true
  }
}
```

3. **Login page renders the right flow:**
   - Acme user → sees 'Sign in with Okta' button → redirected to Okta → SAML assertion returned → app validates, creates session.
   - Globex user → sees email/password form + Google sign-in button.

4. **After authentication**, both paths converge to the same JWT structure: `{ sub, tenant_id, role }`. The rest of the app doesn't care how the user authenticated.

5. **Enterprise requirements:** Acme might mandate SAML-only login (no password fallback), session timeout of 30 minutes (shorter than default), MFA enforcement. These are stored in the tenant config and enforced during login and session validation."

---

### S6: How Do You Handle Tenant Onboarding?

**Scenario:** "A new organization signs up for your SaaS. Walk me through what happens technically."

**Answer:**

"Tenant onboarding is a multi-step process:

1. **User signs up with email/password or OAuth.**

2. **Create tenant record:**
```tsx
const tenant = await prisma.tenant.create({
  data: {
    name: "New Corp",
    slug: "newcorp",          // becomes newcorp.yourapp.com
    plan: "free",
    settings: { theme: 'default', timezone: 'UTC' },
  },
});
```

3. **Create membership — link the user to the tenant as owner:**
```tsx
await prisma.membership.create({
  data: {
    userId: user.id,
    tenantId: tenant.id,
    role: "owner",
  },
});
```

4. **If using separate schemas/databases:** Run migrations to create the tenant's tables. If using shared schema, no database work needed — the `tenant_id` column handles it.

5. **If using subdomains:** Configure DNS. On Vercel, wildcard subdomains work automatically. On AWS, ensure the wildcard DNS record exists.

6. **Seed default data:** Create default projects, categories, settings, or onboarding templates for the new tenant.

7. **Issue new JWT with tenant membership:** Re-issue the user's token to include the new tenant.

8. **Redirect to `newcorp.yourapp.com/onboarding`** to walk the user through initial setup."

---

### S7: Rate Limiting and Noisy Neighbor Problem

**Scenario:** "One tenant is making 10,000 API requests per minute, slowing down the application for everyone. How do you handle this?"

**Answer:**

"This is the 'noisy neighbor' problem — one tenant consuming disproportionate resources.

**Prevention:**

1. **Per-tenant rate limiting:** Implement rate limiting in middleware that tracks requests per tenant, not just per IP. Use Redis to store counters.

```tsx
// middleware.ts
const tenantKey = `rate:${tenantId}`;
const count = await redis.incr(tenantKey);
if (count === 1) await redis.expire(tenantKey, 60); // 1-minute window

const limit = getTenantRateLimit(tenant.plan); // free: 100/min, pro: 1000/min
if (count > limit) {
  return new NextResponse('Too Many Requests', { status: 429 });
}
```

2. **Plan-based limits:** Free tenants get 100 requests/min, Pro gets 1000, Enterprise gets 10,000. Enforce in middleware.

3. **Database connection pooling per tenant:** Limit how many database connections a single tenant can use.

4. **Queue heavy operations:** Long-running tasks (reports, exports, bulk updates) go into a background job queue with per-tenant concurrency limits.

5. **For extreme cases:** Move the noisy tenant to a separate database or deployment (the hybrid approach)."

---

### S8: Tenant Data Export and Deletion (GDPR)

**Scenario:** "A tenant requests all their data to be exported (data portability) and then deleted (right to erasure) under GDPR. How do you handle this?"

**Answer:**

"**Data export:**
With shared schema, query all tables with `WHERE tenant_id = 'target'`, serialize to JSON or CSV, package into a ZIP, and provide a secure download link. With separate database, dump the entire database.

**Data deletion:**
With shared schema, delete all rows where `tenant_id = 'target'` across all tables, in the correct order (respecting foreign keys). With separate database, drop the database. Then delete the tenant record, all memberships, and all related auth data (sessions, tokens, refresh tokens).

**Important considerations:**
- Keep an audit log of the deletion request and execution (required for GDPR compliance).
- Invalidate all active sessions and tokens for the tenant immediately.
- Remove data from backups within the retention window (or document why you can't).
- Handle cascading — the tenant's files in object storage (S3), cached data in Redis, search indexes, etc."

---

### S9: How Do You Test Multi-Tenant Isolation?

**Scenario:** "How do you write tests that verify one tenant can never see another tenant's data?"

**Answer:**

```tsx
describe("Tenant data isolation", () => {
  let tenantA, tenantB, userA, userB;

  beforeAll(async () => {
    // Create two tenants and their users
    tenantA = await createTenant("acme");
    tenantB = await createTenant("globex");
    userA = await createUserWithMembership(tenantA.id, "admin");
    userB = await createUserWithMembership(tenantB.id, "admin");
  });

  test("Tenant A cannot see Tenant B's projects", async () => {
    // Create a project in Tenant B
    const project = await createProject(tenantB.id, { name: "Secret Project" });

    // Query as Tenant A — should return nothing
    const results = await getProjects(tenantA.id);
    const found = results.find(p => p.id === project.id);
    expect(found).toBeUndefined();
  });

  test("API rejects requests for wrong tenant", async () => {
    const tokenA = generateToken(userA.id, tenantA.id);

    // Try to access Tenant B's endpoint with Tenant A's token
    const response = await fetch(`/api/tenants/${tenantB.id}/projects`, {
      headers: { Cookie: `auth-token=${tokenA}` },
    });

    expect(response.status).toBe(403); // Forbidden
  });

  test("Direct database query without tenant filter returns nothing (RLS)", async () => {
    // Set RLS context to Tenant A
    await db.query("SET app.current_tenant_id = $1", [tenantA.id]);
    
    // Query without WHERE — RLS should filter automatically
    const result = await db.query("SELECT * FROM projects");
    
    // Should only contain Tenant A's projects
    result.rows.forEach(row => {
      expect(row.tenant_id).toBe(tenantA.id);
    });
  });
});
```

---

### S10: Scaling from 10 Tenants to 10,000 Tenants

**Scenario:** "Your app started with 10 tenants and now has 10,000. What changes?"

**Answer:**

"At 10 tenants, almost any architecture works. At 10,000, you need to optimize multiple layers:

**Database:** If using shared schema, add proper indexes on `tenant_id` columns (compound indexes: `(tenant_id, status)`, `(tenant_id, created_at)`). Consider partitioning large tables by `tenant_id`. Monitor query performance per tenant.

**Caching:** Add a caching layer (Redis) for tenant configurations. You don't want to hit the database for every request to look up tenant settings. Cache tenant metadata with a TTL.

**Connection pooling:** With 10,000 tenants hitting one database, connection pooling (PgBouncer) becomes essential. Without it, you'll exhaust database connections.

**CDN and static assets:** Tenant-specific assets (logos, custom CSS) should be served from a CDN, not from the database or app server.

**Background jobs:** Tenant-level operations (sending emails, generating reports) go through a job queue with per-tenant fairness to prevent one tenant from monopolizing workers.

**Monitoring:** Instrument per-tenant metrics: request count, response time, error rate, database query time. Set up alerts for anomalies.

**Eventually:** Consider sharding the database by tenant ranges, or migrating the largest tenants to dedicated databases."

---

> **Interview Tip:** Multi-tenant architecture questions test your ability to think about trade-offs at scale. There's no single "correct" answer — interviewers want to see that you can evaluate options, articulate trade-offs, and choose the approach that fits the specific business requirements. Always start your answer with "It depends on..." and then explain the factors that influence your decision.
