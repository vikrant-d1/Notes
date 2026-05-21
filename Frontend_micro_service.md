# Micro-Frontend Interview Guide — Senior/Staff Engineer (10+ Years)

> A comprehensive Q&A reference covering architecture, composition strategies, Module Federation, Single-SPA, routing, shared state, authentication, CSS isolation, testing, deployment, performance, and real-world production concerns.

---

## Table of Contents

1. [Core Micro-Frontend Concepts](#1-core-micro-frontend-concepts)
2. [Composition Strategies](#2-composition-strategies)
3. [Webpack Module Federation](#3-webpack-module-federation)
4. [Single-SPA Framework](#4-single-spa-framework)
5. [iFrames-Based Micro-Frontends](#5-iframes-based-micro-frontends)
6. [Web Components Approach](#6-web-components-approach)
7. [Routing & Navigation](#7-routing--navigation)
8. [Shared State & Communication](#8-shared-state--communication)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [CSS Isolation & Styling](#10-css-isolation--styling)
11. [Shared Dependencies & Versioning](#11-shared-dependencies--versioning)
12. [Testing Strategies](#12-testing-strategies)
13. [Performance Optimization](#13-performance-optimization)
14. [Deployment & CI/CD](#14-deployment--cicd)
15. [Design Patterns & Best Practices](#15-design-patterns--best-practices)
16. [Migration Strategies](#16-migration-strategies)
17. [Real-World Scenario Questions](#17-real-world-scenario-questions)
18. [System Design Questions](#18-system-design-questions)
19. [Anti-Patterns & Pitfalls](#19-anti-patterns--pitfalls)
20. [Framework-Specific Questions](#20-framework-specific-questions)

---

## 1. Core Micro-Frontend Concepts

### Q: What are micro-frontends? How do you define them?

**A:** Micro-frontends are an architectural approach that extends the microservices philosophy to the frontend. Instead of building a single, monolithic frontend application, you decompose the UI into smaller, independently developed, tested, and deployed pieces — each owned by a separate team. Each micro-frontend represents a vertical slice of business functionality, from the UI layer down to the data-fetching logic. The shell (or container) application stitches these pieces together into a cohesive user experience.

Think of it as applying Conway's Law to the frontend — the architecture mirrors the team structure, and each team ships their own feature independently without coordinating releases with other teams.

### Q: What are the key benefits of micro-frontends?

**A:**

- **Independent deployability** — Team A can deploy their checkout module without waiting for Team B's catalog changes. This dramatically reduces release coordination overhead.
- **Team autonomy** — each team owns their slice end-to-end (UI, API calls, tests, deployment pipeline). They can move at their own velocity.
- **Technology heterogeneity** — one team can use React, another Vue, another Angular. You can also incrementally adopt new frameworks without rewriting everything.
- **Incremental upgrades** — upgrade React 17 to 18 in one micro-frontend at a time, not across the entire app in a single risky release.
- **Isolated failures** — a crash in the product recommendations widget doesn't bring down the entire page. Error boundaries contain the blast radius.
- **Scalable development** — as the organization grows from 5 to 50 frontend developers, teams don't step on each other's toes in a single codebase.
- **Faster onboarding** — a new developer can understand a single micro-frontend's codebase in days, not weeks.

### Q: What are the drawbacks and challenges?

**A:**

- **Increased complexity** — instead of one build pipeline, you have many. Orchestration, composition, and integration testing become significantly harder.
- **Payload size** — if not managed carefully, each micro-frontend can ship its own copy of React, lodash, or other libraries, ballooning the total JavaScript sent to the browser.
- **Inconsistent UX** — without a shared design system and strict conventions, different teams produce visually and behaviorally inconsistent user experiences.
- **Cross-cutting concerns** — authentication, analytics, error tracking, logging, and theming must be standardized and shared — but sharing code between independently deployed apps is inherently tricky.
- **Performance overhead** — composition at runtime (especially with iframes or multiple framework instances) adds latency, memory usage, and CPU load.
- **Communication complexity** — micro-frontends need to communicate (e.g., "user added item to cart"), but tight coupling defeats the purpose. Designing the right inter-app communication pattern is difficult.
- **SEO challenges** — client-side composition can hurt server-side rendering and SEO if not architected carefully.
- **Debugging across boundaries** — tracing a bug that spans two micro-frontends owned by different teams requires coordination and shared tooling.

### Q: When should you NOT use micro-frontends?

**A:** Avoid micro-frontends when:
- The team is small (fewer than 3-4 frontend developers) — the overhead isn't justified
- The application is simple — a CRUD admin panel doesn't need this complexity
- The domain isn't well understood — you'll draw wrong boundaries just like with microservices
- You don't have DevOps maturity — without solid CI/CD, container orchestration, and monitoring, you'll struggle
- Performance is paramount and every kilobyte matters — the overhead of multiple bundles and runtime composition can hurt
- There's a single product team — micro-frontends solve an organizational problem; if there's no organizational scaling issue, a well-structured monolith is simpler

### Q: How do you decide the boundaries of a micro-frontend?

**A:** I follow these heuristics:

- **Business domain** — aligned with bounded contexts from DDD. The "Product Catalog" micro-frontend, the "Checkout" micro-frontend, the "User Account" micro-frontend. Each maps to a business capability.
- **Team ownership** — each micro-frontend should be owned by exactly one team. If two teams need to change the same micro-frontend frequently, the boundary is wrong.
- **Page or section** — common splits are by page/route (horizontal split) or by section/widget on a page (vertical split). Horizontal is simpler; vertical is more flexible but harder to integrate.
- **Rate of change** — parts of the UI that change weekly should be separate from parts that change quarterly.
- **Independence** — if two pieces always deploy together or share significant state, they should be one micro-frontend.
- **User journey** — follow the user flow; transitions between micro-frontends should feel seamless, so avoid splitting in the middle of a tight interaction flow (e.g., don't split the checkout form across two micro-frontends).

### Q: What is the difference between micro-frontends and component libraries?

**A:** A component library (like a design system) is a collection of reusable UI primitives (buttons, inputs, modals) shared across applications. It's a dependency, not an independently deployable unit. A micro-frontend is a full-fledged, independently deployable application fragment that contains its own business logic, data fetching, routing, and state. A micro-frontend *uses* the component library; it is not a component library itself.

### Q: How does Conway's Law relate to micro-frontends?

**A:** Conway's Law states that organizations design systems that mirror their communication structure. Micro-frontends explicitly leverage this — each team owns a vertical slice of the product, and the architecture reflects that team structure. If you have a "Search" team, a "Checkout" team, and a "User Profile" team, you build three micro-frontends. This alignment reduces cross-team coordination overhead, which is the primary organizational benefit.

---

## 2. Composition Strategies

### Q: What are the main composition strategies for micro-frontends?

**A:**

**Build-Time Composition:**
Micro-frontends are published as npm packages. The container app installs them as dependencies and bundles everything at build time.

- Benefits: Simple, single optimized bundle, great for SSR, easy to reason about
- Drawbacks: Requires redeploying the container when any micro-frontend changes, losing independent deployability — the core benefit
- Use when: The "micro-frontends" are really just shared libraries or you're okay with coordinated releases

**Server-Side Composition:**
The server assembles the page from fragments produced by different services. Technologies include Server-Side Includes (SSI), Edge-Side Includes (ESI), Tailor (Zalando), or frameworks like Next.js with module federation.

- Benefits: Fast initial page load (HTML is assembled server-side), good for SEO, works without JavaScript
- Drawbacks: Server infrastructure complexity, harder to achieve rich client-side interactivity, caching complexity
- Use when: SEO matters, you want fast first paint, content-heavy pages

**Client-Side Composition (Runtime):**
The container app loads micro-frontends dynamically in the browser. Techniques include JavaScript imports, Module Federation, Single-SPA, or iframes.

- Benefits: True independent deployability, no container redeployment, rich interactivity
- Drawbacks: Client-side performance cost, JavaScript dependency, harder to SSR
- Use when: Interactive applications (SPAs, dashboards), you need true independent deployment

**Edge-Side Composition:**
CDN or edge workers (Cloudflare Workers, Lambda@Edge) assemble the page from fragments at the edge, close to the user.

- Benefits: Low latency, combines server-side benefits with CDN caching
- Drawbacks: Limited compute at the edge, debugging complexity, vendor-specific
- Use when: Global audience, performance-critical, content that can be assembled from cached fragments

### Q: What factors determine which composition strategy to choose?

**A:**

| Factor | Build-Time | Server-Side | Client-Side | Edge-Side |
|---|---|---|---|---|
| Independent deploy | No | Yes | Yes | Yes |
| SEO | Good | Excellent | Requires SSR | Good |
| Initial load speed | Fast | Fast | Slower | Fast |
| Interactivity | Full | Limited | Full | Limited |
| Complexity | Low | Medium | Medium-High | High |
| Offline support | Easy | Hard | Medium | Hard |
| Best for | Small teams | Content sites | SPAs, dashboards | Global content |

In practice, many production systems use a hybrid — server-side composition for the initial page shell and above-the-fold content, with client-side composition for interactive widgets that load after.

---

## 3. Webpack Module Federation

### Q: What is Webpack Module Federation and why is it significant?

**A:** Module Federation is a Webpack 5 feature that allows multiple independently built and deployed JavaScript applications to share code at runtime. One application (the "host") can dynamically load modules from another application (the "remote") without installing it as an npm dependency. It also supports bidirectional sharing — any app can be both a host and a remote simultaneously.

It's significant because it solved the biggest pain point of micro-frontends: sharing code and dependencies at runtime without sacrificing independent deployability. Before Module Federation, you had to either bundle everything together (losing independence) or accept duplicate dependencies (hurting performance).

### Q: Explain the core concepts: Host, Remote, Shared, Exposes.

**A:**

- **Host** — the application that consumes modules from other applications. It defines which remotes it can load from.
- **Remote** — the application that exposes modules for other applications to consume. It specifies what it "exposes."
- **Exposes** — the configuration in the remote that declares which modules are available for consumption (e.g., a React component, a utility function, an entire page).
- **Shared** — dependencies that are shared between host and remotes to avoid duplication. For example, if both the host and remote use React 18, Module Federation ensures only one copy is loaded. Configuration options include `singleton` (only one version allowed), `requiredVersion`, and `eager` loading.

```javascript
// Remote (Team A's app) - webpack.config.js
new ModuleFederationPlugin({
  name: 'catalog',
  filename: 'remoteEntry.js',
  exposes: {
    './ProductList': './src/components/ProductList',
    './ProductDetail': './src/pages/ProductDetail',
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.0.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
  },
})

// Host (Shell app) - webpack.config.js
new ModuleFederationPlugin({
  name: 'shell',
  remotes: {
    catalog: 'catalog@https://catalog.example.com/remoteEntry.js',
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.0.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
  },
})

// Host - consuming the remote module
const ProductList = React.lazy(() => import('catalog/ProductList'));
```

### Q: What are the benefits of Module Federation?

**A:**
- True runtime code sharing without npm publish cycles
- Shared dependencies avoid duplication (single React instance)
- No framework lock-in — works with React, Vue, Angular, or vanilla JS
- Bidirectional — any app can be both host and remote
- Supports dynamic remotes — remote URLs can be determined at runtime, not just build time
- Incremental adoption — you can federate one module at a time from a monolith
- Version negotiation — if versions are incompatible, each app loads its own copy (graceful fallback)

### Q: What are the drawbacks of Module Federation?

**A:**
- **Webpack-specific** — tightly coupled to Webpack 5 (though Vite has `vite-plugin-federation` and Rspack supports it)
- **Runtime failures** — if a remote is down or its `remoteEntry.js` is unreachable, the host must handle the error gracefully
- **Version mismatches** — shared singletons can break if the remote requires a newer version of React than the host provides
- **Debugging difficulty** — source maps across federated modules are tricky; stack traces can be hard to follow
- **TypeScript support** — no native type sharing; you need workarounds like `@module-federation/typescript` or shared type packages
- **Testing complexity** — unit tests run in isolation without federation; integration tests must account for the federated setup
- **Implicit coupling** — shared dependencies create a hidden contract between apps; changing a shared dependency version can break remotes
- **Cold start** — loading `remoteEntry.js` files adds network requests before any federated code can execute

### Q: How do you handle failure when a remote is unavailable?

**A:** This is critical for production resilience:

```javascript
// Error boundary around federated components
const ProductList = React.lazy(() =>
  import('catalog/ProductList').catch(() => {
    // Fallback: load a local stub, cached version, or show an error UI
    return { default: () => <div>Product catalog is temporarily unavailable</div> };
  })
);

// Wrap with React.Suspense and ErrorBoundary
<ErrorBoundary fallback={<FallbackUI />}>
  <Suspense fallback={<Skeleton />}>
    <ProductList />
  </Suspense>
</ErrorBoundary>
```

Additionally: implement health checks for remotes, use a CDN with caching so `remoteEntry.js` is available even if the origin is down, and consider pre-loading critical remote entries during the shell's initialization.

### Q: What is the difference between Module Federation and Rspack/Vite federation?

**A:** Module Federation originated in Webpack 5. Rspack (a Rust-based Webpack-compatible bundler) supports Module Federation natively with near-identical configuration. Vite supports it through `@originjs/vite-plugin-federation`, but it's a community plugin, not a first-class feature — and there are subtle differences in how shared dependencies and eager loading work. Module Federation 2.0 (by Zack Jackson) aims to be bundler-agnostic, working across Webpack, Rspack, and Vite with a unified API. If you're starting fresh, evaluate Module Federation 2.0 for cross-bundler compatibility.

### Q: How do you handle TypeScript types across federated modules?

**A:**
- **Shared type packages** — publish a `@company/types` package that both host and remote depend on. Simple but creates a release coordination point.
- **`@module-federation/typescript`** — a plugin that automatically generates and consumes type declarations from remote entries at build time.
- **Contract-first approach** — define interfaces in a shared repo; each remote implements the interface; the host consumes the interface, not the concrete type.
- **Runtime validation** — use Zod or io-ts to validate the shape of data crossing micro-frontend boundaries at runtime, regardless of types.

---

## 4. Single-SPA Framework

### Q: What is Single-SPA and how does it work?

**A:** Single-SPA is a JavaScript framework for building micro-frontends. It acts as a top-level router that manages the lifecycle of multiple frontend applications (React, Angular, Vue, Svelte, or vanilla JS) on a single page. Each "application" registers with Single-SPA and provides three lifecycle hooks: `bootstrap` (one-time initialization), `mount` (render into the DOM), and `unmount` (clean up and remove from the DOM). Single-SPA decides which applications to mount based on the current URL and an "activity function" that each app provides.

```javascript
// Root config (shell)
import { registerApplication, start } from 'single-spa';

registerApplication({
  name: '@company/navbar',
  app: () => System.import('@company/navbar'),
  activeWhen: '/',  // always active
});

registerApplication({
  name: '@company/catalog',
  app: () => System.import('@company/catalog'),
  activeWhen: '/catalog',
});

registerApplication({
  name: '@company/checkout',
  app: () => System.import('@company/checkout'),
  activeWhen: '/checkout',
});

start();
```

### Q: What are the lifecycle hooks in Single-SPA?

**A:**
- **`bootstrap(props)`** — called once when the application is loaded for the first time. Use it for one-time setup (initializing a framework, setting up global state).
- **`mount(props)`** — called every time the application should be rendered. Create the DOM, mount the React/Vue/Angular app to the container element.
- **`unmount(props)`** — called every time the application should be removed. Clean up the DOM, unsubscribe from events, tear down the framework instance. Failing to clean up causes memory leaks.
- **`unload(props)`** (optional) — called when the application should be completely removed from memory. Rarely used.

### Q: What are the benefits of Single-SPA?

**A:**
- Framework-agnostic — mix React, Vue, Angular, Svelte on one page
- Mature ecosystem — `single-spa-react`, `single-spa-vue`, `single-spa-angular` adapters
- Import maps support — works well with SystemJS and native import maps for runtime module loading
- Layout engine — `single-spa-layout` for declarative DOM layout and route-based application placement
- Active community and extensive documentation
- Decoupled from the build tool — works with Webpack, Rollup, Vite, or any bundler

### Q: What are the drawbacks of Single-SPA?

**A:**
- **Learning curve** — understanding the lifecycle model, import maps, SystemJS, and the root config takes time
- **Multiple framework instances** — if apps use different frameworks, each instance adds to bundle size and memory
- **Global DOM conflicts** — mount/unmount must be implemented carefully to avoid DOM leaks
- **Routing complexity** — the activity function model can lead to subtle bugs when routes overlap or don't match correctly
- **Performance** — mounting and unmounting full applications on route change is heavier than component-level composition
- **Shared state is not built-in** — you need a separate solution for cross-app communication
- **No SSR story** — Single-SPA is client-side only; SSR requires custom implementation

### Q: How does Single-SPA differ from Module Federation?

**A:** They solve different problems and can be used together:

| Aspect | Single-SPA | Module Federation |
|---|---|---|
| What it is | Application lifecycle orchestrator | Code-sharing mechanism |
| Scope | Manages mounting/unmounting of entire apps | Shares individual modules/components |
| Framework | Agnostic (works with any bundler) | Webpack-specific (Rspack, Vite via plugins) |
| Granularity | Page/route-level applications | Component/module-level sharing |
| Dependency sharing | Via import maps / SystemJS | Built-in shared config |
| Typical use | Multiple full apps on one page | Sharing components/pages across apps |

A common production setup uses Single-SPA as the orchestrator and Module Federation as the module-loading mechanism within each registered application.

---

## 5. iFrames-Based Micro-Frontends

### Q: Can iframes be used for micro-frontends? When is it appropriate?

**A:** Yes, iframes are the oldest and most battle-tested micro-frontend technique. Each micro-frontend is loaded in its own iframe, providing the strongest isolation possible — separate DOM, CSS, JavaScript execution context, and even separate browser security context.

**When to use iframes:**
- You need absolute isolation (e.g., embedding a third-party app or a legacy application)
- Security is paramount — iframes respect the same-origin policy and can use `sandbox` attributes
- The embedded content doesn't need tight visual or behavioral integration with the host
- You're embedding content from different security domains

### Q: What are the drawbacks of iframes?

**A:**
- **Performance** — each iframe creates a separate browsing context (separate DOM, JS engine instance, memory). Multiple iframes dramatically increase memory usage.
- **SEO** — content inside iframes is not indexed well by search engines
- **Responsiveness** — iframes don't resize naturally; you need JavaScript bridges to communicate height changes
- **Routing** — the browser's URL doesn't reflect the iframe's internal navigation; back button behavior is broken
- **Accessibility** — screen readers struggle with iframes; focus management across iframe boundaries is complex
- **Communication overhead** — cross-iframe communication is limited to `postMessage`, which is async and requires serializable data
- **UX consistency** — scrollbars, modals, tooltips, and dropdowns inside iframes can't overflow the iframe boundary, leading to clipped UI elements
- **Cookie and storage isolation** — with third-party cookie restrictions tightening, iframes from different origins may lose access to cookies

### Q: How do you communicate between iframes?

**A:** The `window.postMessage()` API is the standard mechanism:

```javascript
// Parent → iframe
const iframe = document.getElementById('checkout-frame');
iframe.contentWindow.postMessage({ type: 'USER_UPDATED', payload: { id: 123 } }, 'https://checkout.example.com');

// iframe → Parent
window.parent.postMessage({ type: 'CHECKOUT_COMPLETE', payload: { orderId: 456 } }, 'https://shell.example.com');

// Receiving (in either)
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://trusted.example.com') return; // ALWAYS verify origin
  const { type, payload } = event.data;
  // handle message
});
```

Always validate `event.origin` to prevent cross-site scripting attacks. Define a clear message protocol (event types, payload shapes) as a shared contract.

---

## 6. Web Components Approach

### Q: How can Web Components be used for micro-frontends?

**A:** Web Components (Custom Elements, Shadow DOM, HTML Templates) allow you to encapsulate micro-frontend functionality as standard HTML elements. Each micro-frontend registers a custom element (e.g., `<checkout-widget>`), and the shell simply includes these elements in its HTML. The Shadow DOM provides style encapsulation.

```javascript
// Micro-frontend: Checkout Widget
class CheckoutWidget extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>/* scoped styles */</style>
      <div id="checkout-root"></div>
    `;
    // Mount React/Vue/vanilla app inside shadow DOM
    ReactDOM.createRoot(shadow.getElementById('checkout-root')).render(<CheckoutApp />);
  }
  disconnectedCallback() {
    // Clean up
  }
}
customElements.define('checkout-widget', CheckoutWidget);
```

### Q: What are the benefits and drawbacks of the Web Components approach?

**A:**

**Benefits:**
- Framework-agnostic by design — any framework can produce and consume custom elements
- Native browser API — no extra runtime libraries needed
- Style encapsulation via Shadow DOM
- Interoperable — works in any HTML context
- Progressive enhancement — can render server-side and hydrate client-side

**Drawbacks:**
- Shadow DOM complicates global theming — CSS custom properties (variables) penetrate the shadow boundary, but other styles don't
- Server-side rendering support for Shadow DOM is limited (Declarative Shadow DOM is emerging)
- React's compatibility with custom elements has historically been poor (though React 19 improves this significantly)
- Event handling across shadow boundaries requires careful design (events don't naturally bubble out of shadow DOM unless composed)
- Bundle size — if each Web Component ships its own framework, you still have the duplication problem

---

## 7. Routing & Navigation

### Q: How do you handle routing across micro-frontends?

**A:** There are two levels of routing:

**Top-level routing (shell):** The shell/container owns the top-level routes and decides which micro-frontend to mount. For example, `/catalog/*` mounts the Catalog micro-frontend, `/checkout/*` mounts Checkout.

**Internal routing (micro-frontend):** Each micro-frontend manages its own sub-routes. The Catalog micro-frontend handles `/catalog/list`, `/catalog/product/:id`, etc., using its own router (React Router, Vue Router).

The challenge is keeping the browser URL and the micro-frontend's internal state in sync without conflicts. Approaches:

- **Convention-based prefixes** — each micro-frontend owns a URL prefix (`/catalog`, `/checkout`). The shell routes by prefix; the micro-frontend handles everything after.
- **History API coordination** — the shell listens to `popstate` and `pushState`. When a micro-frontend navigates, it uses the shared History API. The shell detects the route change and mounts/unmounts accordingly.
- **Single-SPA's activity functions** — the activity function checks the URL and returns true if the micro-frontend should be active.
- **Custom event bus for navigation** — micro-frontends emit navigation events; the shell listens and orchestrates.

### Q: How do you handle deep linking and the browser back button?

**A:** Each micro-frontend must use the browser's History API (not hash routing) and the shell must be aware of nested routes. When a user deep-links to `/checkout/payment`, the shell must mount the Checkout micro-frontend and pass the sub-path `/payment` so Checkout can render the correct internal view. For the back button, all micro-frontends share the same browser history stack. The critical rule: only ONE router should call `history.pushState` — either the shell delegates to the micro-frontend, or the micro-frontend uses a memory router with the shell controlling the URL. React Router's `basename` prop and Vue Router's `base` option help scope routes to a prefix.

### Q: How do you handle cross-micro-frontend navigation?

**A:** When the Catalog micro-frontend needs to send the user to Checkout:

- **Option 1: URL change** — the Catalog app simply calls `window.history.pushState({}, '', '/checkout')` or uses `window.location.href = '/checkout'`. The shell detects the route change and mounts Checkout. This is the simplest and most decoupled approach.
- **Option 2: Custom event** — emit a navigation event via a shared event bus; the shell handles it.
- **Option 3: Shared navigation service** — a thin singleton provided by the shell that exposes `navigate('/checkout')`. Micro-frontends call it instead of manipulating the URL directly.

I prefer Option 1 for simplicity — it uses the browser's native mechanism and requires zero coupling between micro-frontends.

---

## 8. Shared State & Communication

### Q: How do micro-frontends communicate with each other?

**A:** Communication should be minimal and loosely coupled. Patterns include:

**1. Custom Events (Browser Events):**
The simplest approach. One micro-frontend dispatches a `CustomEvent` on `window`; others listen.

```javascript
// Producer
window.dispatchEvent(new CustomEvent('cart:item-added', { detail: { productId: 42, qty: 1 } }));

// Consumer
window.addEventListener('cart:item-added', (e) => {
  updateCartCount(e.detail);
});
```

Benefits: Zero dependencies, fully decoupled. Drawback: No type safety, no guaranteed delivery, can become event soup.

**2. Shared Event Bus / Pub-Sub:**
A lightweight pub-sub library (or a custom one) that micro-frontends subscribe to. The shell provides it as a global or injectable dependency.

**3. URL / Query Parameters:**
The URL is a natural shared state. Passing data through query parameters or route params is simple and bookmarkable. Best for navigation-related state.

**4. Shared State Store:**
A singleton store (e.g., a lightweight Redux store, Zustand, or even a plain RxJS BehaviorSubject) provided by the shell. Micro-frontends subscribe to slices of state.

**5. Props / Attributes:**
For component-level micro-frontends (Module Federation, Web Components), the parent passes data as props or HTML attributes. This is the most explicit and type-safe approach.

**6. postMessage (iframes):**
For iframe-based micro-frontends, `window.postMessage` is the only option.

### Q: What is the best practice for shared state?

**A:** Minimize it ruthlessly. Every piece of shared state is a coupling point. My hierarchy:

1. **URL** — for navigation state, filter parameters, IDs. Always prefer the URL for state that should be shareable/bookmarkable.
2. **Events** — for notifications (something happened). Fire and forget. The producer doesn't know or care who's listening.
3. **Props/attributes** — for parent-child data passing. Explicit and type-safe.
4. **Shared store** — only for truly global state (authenticated user, cart count, feature flags). Keep it as small as possible and provide a clear contract (interface) for what's in the store.

If two micro-frontends share a lot of state, they should probably be one micro-frontend.

### Q: How do you avoid tight coupling through communication?

**A:**

- Define a **communication contract** — a documented schema for events, shared store shape, and props. Treat it like an API contract.
- Use **domain events, not implementation events** — dispatch `order:placed` (business domain), not `redux:ORDER_ACTION_DISPATCHED` (implementation detail).
- **Never share framework-specific objects** — don't pass a React context, a Vue reactive object, or an Angular service across boundaries.
- **Serialize everything** — data crossing micro-frontend boundaries should be plain JSON. No functions, no class instances, no framework objects.
- **Avoid bidirectional communication** — prefer unidirectional data flow. If two micro-frontends are constantly messaging each other, the boundary is wrong.

---

## 9. Authentication & Authorization

### Q: How do you handle authentication across micro-frontends?

**A:** Authentication should be centralized and handled by the shell/container. The micro-frontends should never implement their own login flow. Common approaches:

**1. Shell-Owned Auth (Recommended):**
The shell handles login, token management, and session. It passes the auth token to micro-frontends via:
- A shared auth service/singleton that micro-frontends import
- Props/attributes when mounting micro-frontends
- A global context or event (`auth:token-refreshed`)
- HTTP-only cookies (if using same-domain, server-set cookies)

**2. Token in Shared State:**
The JWT is stored by the shell (in memory for security, or in an HTTP-only cookie). Micro-frontends access it through a shared auth module to include in their API requests.

**3. Auth as a Micro-Frontend:**
The login page itself can be a micro-frontend that, upon successful authentication, passes the token to the shell, which then stores it and makes it available to all other micro-frontends.

```javascript
// Shell provides an auth service
const authService = {
  getToken: () => currentToken,
  onTokenChange: (callback) => listeners.push(callback),
  logout: () => { /* clear token, redirect */ },
};

// Passed to micro-frontends as a prop or injected via Module Federation shared scope
<CatalogApp authService={authService} />
```

### Q: How do you handle token refresh across micro-frontends?

**A:** The shell owns token refresh. When the access token is about to expire:

1. The shell intercepts API responses (401) or proactively checks token expiry
2. It refreshes the token using the refresh token
3. It notifies all micro-frontends of the new token via an event or shared store update
4. Micro-frontends retry their failed requests with the new token

Critical: implement a token refresh lock — if multiple micro-frontends detect an expired token simultaneously, only one refresh request should be made. Use a singleton `refreshPromise` that all concurrent callers await.

```javascript
let refreshPromise = null;

async function getValidToken() {
  if (isTokenExpired(accessToken)) {
    if (!refreshPromise) {
      refreshPromise = refreshToken().finally(() => { refreshPromise = null; });
    }
    accessToken = await refreshPromise;
  }
  return accessToken;
}
```

### Q: How do you handle authorization (permissions, roles)?

**A:** The shell loads the user's permissions/roles after authentication and provides them to micro-frontends. Each micro-frontend uses these permissions to control what's visible and accessible. Server-side authorization is still mandatory — the frontend permissions are for UX only, not security.

Approach: the shell fetches the user's role/permission set and shares it via a permissions service or shared store. Micro-frontends call `permissionsService.canAccess('checkout:refund')` to conditionally render UI elements. The shell can also use permissions to decide whether to load a micro-frontend at all (don't even fetch the admin micro-frontend if the user isn't an admin).

### Q: Where do you store tokens? What are the security considerations?

**A:**

| Storage | Pros | Cons |
|---|---|---|
| In-memory (JS variable) | Safest from XSS; cleared on tab close | Lost on refresh (need silent re-auth) |
| HTTP-only cookie | Not accessible via JS (XSS-safe); auto-sent with requests | CSRF risk (mitigate with SameSite, CSRF tokens); same-domain required |
| localStorage | Persists across refreshes | Vulnerable to XSS; accessible by any JS on the page |
| sessionStorage | Persists only for the session | Still vulnerable to XSS; not shared across tabs |

For micro-frontends: I recommend HTTP-only, SameSite=Strict cookies for the refresh token and an in-memory access token. The shell handles silent re-authentication on page reload using the refresh token cookie. This approach gives the best balance of security and UX.

---

## 10. CSS Isolation & Styling

### Q: How do you prevent CSS conflicts between micro-frontends?

**A:**

**1. Shadow DOM:**
Web Components' Shadow DOM provides true style encapsulation. Styles inside the shadow root don't leak out, and external styles don't leak in (except CSS custom properties).

**2. CSS Modules:**
Each micro-frontend uses CSS Modules. Class names are locally scoped and transformed to unique hashes at build time (e.g., `.button` becomes `.button_a1b2c3`). Zero runtime cost.

**3. CSS-in-JS:**
Libraries like Styled Components or Emotion generate unique class names at runtime. Each micro-frontend's styles are scoped automatically. Drawback: runtime performance cost and potential issues with multiple instances of the CSS-in-JS library.

**4. Naming Conventions (BEM with Prefix):**
Each micro-frontend prefixes its classes: `.catalog__product-card`, `.checkout__form-field`. Manual but works without tooling. Relies on discipline.

**5. Utility-First CSS (Tailwind):**
If all micro-frontends share the same Tailwind configuration, utility classes are consistent and non-conflicting. Works well but requires coordinating the Tailwind config and purge settings.

**6. `@scope` and `@layer` (Modern CSS):**
CSS `@layer` controls cascade order. `@scope` (newer, limited support) scopes styles to a subtree. These native CSS features are becoming viable for style isolation.

### Q: How do you maintain a consistent design system across micro-frontends?

**A:** A shared design system is non-negotiable for micro-frontends. Implementation:

- **Shared component library** — publish a versioned package (`@company/design-system`) with base components (Button, Input, Modal, etc.). Each micro-frontend depends on it.
- **Design tokens** — colors, spacing, typography, and breakpoints are defined as CSS custom properties or a tokens package. This ensures visual consistency even if micro-frontends use different frameworks.
- **Shared Tailwind/CSS config** — if using utility CSS, share the configuration file.
- **Visual regression testing** — tools like Chromatic, Percy, or Playwright screenshots catch visual drift across micro-frontends.
- **Storybook** — a centralized Storybook for the design system components, used by all teams as a reference.

The design system team should be cross-functional, with representatives from each micro-frontend team, to prevent the design system from becoming a bottleneck.

---

## 11. Shared Dependencies & Versioning

### Q: How do you handle shared dependencies (React, lodash, etc.)?

**A:**

- **Module Federation shared config** — declare shared dependencies with `singleton: true` and `requiredVersion`. Module Federation negotiates at runtime: if versions are compatible, a single copy is used; if not, each app loads its own.
- **Import maps** — for Single-SPA setups, use import maps (or SystemJS) to point all micro-frontends to a single CDN-hosted copy of shared libraries.
- **Externals** — configure shared libs as Webpack externals and load them from a CDN via `<script>` tags in the shell. All micro-frontends reference the global.
- **Shared dependency service** — the shell loads core dependencies and exposes them. Micro-frontends declare their requirements; the shell provides compatible versions.

### Q: What happens when micro-frontends need different versions of the same library?

**A:** This is one of the hardest problems. Options:

- **Module Federation version negotiation** — if `singleton` is false, each app loads its own version. If `singleton` is true, the highest compatible version is loaded. If incompatible, it falls back to loading both (or throws an error if `strictVersion` is set).
- **Accept the duplication** — for small libraries, loading two versions is an acceptable trade-off for team independence.
- **Coordinated upgrades** — for major frameworks (React, Angular), mandate that all micro-frontends stay within one major version. Use a shared upgrade ticket and a deprecation window.
- **Adapter pattern** — wrap the shared dependency in an adapter with a stable API. The adapter internally can use whatever version it needs.

The pragmatic approach: enforce singleton for React and ReactDOM (you can't have two React instances rendering into the same DOM tree). For everything else, allow duplication and monitor bundle size.

### Q: How do you manage versioning of micro-frontends themselves?

**A:** In runtime composition, micro-frontends are not versioned in the traditional sense — the "latest deployed version" is always served. This is by design: independent deployability means there's no coordinated release.

However, you need backward compatibility for the integration contract:
- **Version the contract, not the app** — the props interface, event schema, and shared state shape should be versioned. Use semantic versioning for these contracts.
- **Backward-compatible changes** — adding optional props, new event types, or new fields is safe. Removing props, changing types, or renaming events is breaking.
- **Consumer-driven contract tests** — the shell writes tests that validate the contract with each micro-frontend. If a micro-frontend's deployment breaks the contract, the test fails and blocks the deploy.

---

## 12. Testing Strategies

### Q: How do you test micro-frontends?

**A:**

**Unit Tests (per micro-frontend):**
Each micro-frontend has its own unit tests, running independently in isolation. Test components, hooks, utilities, and business logic. No awareness of other micro-frontends or the shell. Use Jest, Vitest, React Testing Library.

**Integration Tests (per micro-frontend):**
Test the micro-frontend as a standalone application — mount it, interact with it, verify behavior. Mock API calls but test the full internal flow.

**Contract Tests:**
The most critical layer for micro-frontends. Verify that the integration contract between the shell and each micro-frontend is honored. Use Pact or custom schema validation. The shell publishes its expectations (what props it passes, what events it emits); the micro-frontend verifies it can consume them.

**Visual Regression Tests:**
Capture screenshots of each micro-frontend in isolation and in the composed shell. Detect visual drift. Tools: Chromatic, Percy, Playwright screenshot comparisons.

**End-to-End Tests (composed application):**
Test the full user journey across micro-frontends in the composed application. Spin up the shell with all micro-frontends (or mocked stubs) and run Playwright/Cypress. These tests are slow and brittle, so keep them focused on critical paths.

**Performance Tests:**
Monitor bundle sizes, load times, and core web vitals per micro-frontend and for the composed application. Set budgets and fail CI if exceeded.

### Q: What are contract tests and why are they essential?

**A:** Contract tests validate the agreement between a consumer (shell) and a provider (micro-frontend). The consumer defines what it expects (props, events, API shape), and the provider's tests verify it satisfies those expectations. If the provider breaks the contract (e.g., renames a prop from `userId` to `uid`), the contract test fails before the provider is deployed — catching the break before it reaches production. Without contract tests, you discover integration failures in production or in slow, flaky E2E tests.

---

## 13. Performance Optimization

### Q: What are the main performance concerns with micro-frontends?

**A:**
- **Duplicate dependencies** — multiple copies of React, lodash, etc.
- **Network waterfall** — shell loads → remoteEntry.js loads → micro-frontend chunks load → data fetches begin. Multiple sequential network requests.
- **Large initial bundle** — if all micro-frontends are loaded eagerly, the initial page load is massive.
- **Multiple framework instances** — React + Angular + Vue on one page means three framework runtimes.
- **Runtime overhead** — composition mechanisms (postMessage, event buses, Module Federation) add CPU and memory overhead.

### Q: How do you optimize performance?

**A:**

- **Lazy loading** — load micro-frontends only when their route is activated or their viewport intersection triggers. Use `React.lazy()`, dynamic `import()`, or IntersectionObserver.
- **Shared dependencies** — Module Federation's `shared` config or import maps to ensure a single copy of major libraries.
- **Preloading** — for likely navigations, `<link rel="preload">` the next micro-frontend's entry point. Or preload on hover.
- **Bundle analysis** — each micro-frontend team monitors their bundle size independently. Set strict budgets (e.g., < 150 KB gzipped per micro-frontend).
- **CDN and caching** — serve all static assets from a CDN with long cache headers. Use content-hashed filenames for cache busting.
- **Server-side rendering (SSR)** — render the above-the-fold content server-side for fast first paint. Hydrate client-side for interactivity.
- **Code splitting within micro-frontends** — each micro-frontend should internally split by route and lazy-load its own sub-pages.
- **Service Workers** — cache micro-frontend assets for returning users; enable offline support.
- **HTTP/2 multiplexing** — multiple `remoteEntry.js` files can load in parallel over a single connection.

### Q: How do you measure and monitor micro-frontend performance?

**A:**
- **Core Web Vitals** — track LCP, FID/INP, CLS for the composed application. Each micro-frontend contributes to these metrics.
- **Per-micro-frontend load time** — measure the time from request to interactive for each micro-frontend.
- **Bundle size tracking** — CI pipeline step that reports and gates on bundle size per micro-frontend.
- **Real User Monitoring (RUM)** — tools like Datadog RUM, SpeedCurve, or Web Vitals library report metrics from real user sessions.
- **Synthetic monitoring** — Lighthouse CI in the pipeline; scheduled Lighthouse runs against production.
- **Custom performance marks** — use `performance.mark()` and `performance.measure()` to instrument micro-frontend mount times.

---

## 14. Deployment & CI/CD

### Q: How do you deploy micro-frontends independently?

**A:** Each micro-frontend has its own CI/CD pipeline:

1. **Separate repos or monorepo with scoped builds** — each micro-frontend has its own build and deploy step, triggered only by changes in its directory.
2. **Build** — produces a static bundle (JS, CSS, assets).
3. **Deploy to CDN** — upload the bundle to an S3 bucket or CDN origin. The `remoteEntry.js` (Module Federation) or application bundle URL is the contract between the shell and the micro-frontend.
4. **No shell redeployment** — the shell references the micro-frontend by URL. When the micro-frontend deploys a new version, the shell automatically picks it up on the next page load (since it fetches the remote entry at runtime).
5. **Versioned URLs or latest** — use content-hashed filenames for individual chunks but keep the entry point URL stable (e.g., `https://cdn.example.com/catalog/remoteEntry.js` always points to the latest). The entry point itself references hashed chunk URLs.

### Q: Monorepo vs polyrepo for micro-frontends?

**A:**

| Aspect | Monorepo | Polyrepo |
|---|---|---|
| Code sharing | Easy (direct imports) | Requires published packages |
| Dependency management | Unified (single lockfile) | Independent (version drift risk) |
| CI/CD | Faster with affected-only builds (Nx, Turborepo) | Each repo has its own pipeline |
| Team autonomy | Less (shared tooling decisions) | More (full ownership) |
| Onboarding | Easier (everything in one place) | Harder (many repos to discover) |
| Scale | Can slow down with thousands of packages | Each repo is small and fast |

My recommendation: start with a monorepo (using Nx or Turborepo for efficient builds) for up to 5-10 micro-frontends and 5-8 teams. Move to polyrepo only when the monorepo becomes a bottleneck or when teams need complete autonomy (e.g., different organizations, different tech stacks).

### Q: How do you handle rollbacks?

**A:** Since micro-frontends are independently deployed static assets on a CDN:

- **Revert the CDN entry point** — point `remoteEntry.js` back to the previous build's hashed chunks.
- **Blue-green CDN deployments** — keep the previous version's assets alive; swap the entry point.
- **Feature flags** — don't roll back the deployment; toggle the feature off. The code is deployed but inactive.
- **Canary deployments** — route a percentage of users to the new version; if metrics degrade, route all users back to the old version.

Key: never delete old assets from the CDN immediately. Users with open tabs may still reference previous chunk URLs. Keep old versions for at least 24-48 hours.

---

## 15. Design Patterns & Best Practices

### Q: What is the Shell (Container) pattern?

**A:** The shell is the host application that provides the layout scaffold (header, footer, sidebar, main content area), manages top-level routing, handles authentication, loads shared dependencies, and orchestrates the mounting of micro-frontends into designated DOM containers. It should be as thin as possible — ideally just infrastructure code with no business logic.

### Q: What is the Strangler pattern for frontend migration?

**A:** Similar to the backend strangler fig: incrementally replace a monolithic frontend by routing specific pages or features to new micro-frontends while the monolith handles everything else. Use a reverse proxy or the shell's router to direct traffic. Over time, more pages are migrated until the monolith is empty and can be decommissioned.

Steps:
1. Build a thin shell that wraps the existing monolith (render the monolith in the shell's content area)
2. Identify a page or feature to extract
3. Build the new micro-frontend
4. Route that page to the new micro-frontend in the shell; the monolith no longer serves it
5. Repeat until the monolith is gone

### Q: What is the Facade pattern in micro-frontends?

**A:** The shell exposes a simplified interface (facade) for micro-frontends to interact with cross-cutting concerns. Instead of micro-frontends directly accessing the auth token, analytics library, or router, the shell provides a `shellServices` object:

```javascript
const shellServices = {
  auth: { getToken, onTokenChange, logout },
  analytics: { track, identify },
  navigation: { navigate, getCurrentRoute },
  featureFlags: { isEnabled },
};

// Passed to each micro-frontend
<CatalogApp services={shellServices} />
```

This decouples micro-frontends from implementation details. The shell can change its analytics provider from Google Analytics to Segment without any micro-frontend knowing.

### Q: What is the Composition Gateway pattern?

**A:** A server-side component that assembles the initial HTML by fetching HTML fragments from each micro-frontend's server. It acts like an API gateway but for HTML. Examples: Zalando's Tailor, Podium by Finn.no, or custom implementations using ESI/SSI. The gateway handles timeouts, fallbacks, and caching. Each micro-frontend serves its HTML fragment from its own endpoint; the gateway stitches them together and returns the composed page.

---

## 16. Migration Strategies

### Q: How do you migrate from a monolithic frontend to micro-frontends?

**A:**

**Phase 1 — Assess and Prepare:**
- Map the monolith's domains and identify bounded contexts
- Identify team boundaries — which team will own which slice
- Set up the shared design system and component library
- Establish CI/CD, monitoring, and deployment infrastructure

**Phase 2 — Build the Shell:**
- Create a thin shell application
- The shell initially just wraps the existing monolith (proxy or iframe)
- Set up top-level routing in the shell

**Phase 3 — Strangler Migration:**
- Pick the lowest-risk, most independent page/feature
- Build it as a micro-frontend
- Route it through the shell; remove it from the monolith
- Validate: deployment independence, performance, UX consistency

**Phase 4 — Iterate:**
- Extract the next feature, then the next
- Refine shared contracts, communication patterns, and the design system
- Build shared tooling (CLI templates, testing utilities)

**Phase 5 — Decommission:**
- Once all features are migrated, decommission the monolith
- Keep the shell thin; resist adding business logic to it

### Q: What are the biggest risks during migration?

**A:**
- **Drawing wrong boundaries** — fixing a bad decomposition is extremely expensive
- **Performance regression** — the composed page is slower than the monolith. Benchmark early and often.
- **UX degradation** — visual inconsistencies, navigation glitches, and flash of unstyled content during transitions
- **Organizational resistance** — teams must adopt new processes, tooling, and ownership models
- **Shared dependency hell** — conflicting versions of React or the design system across micro-frontends during migration
- **Incomplete extraction** — the monolith retains hidden coupling to extracted features; both must be modified for changes

---

## 17. Real-World Scenario Questions

### Q: Team A uses React 18 and Team B is still on React 16. How do you handle this?

**A:** If using Module Federation, configure React as a shared singleton with `requiredVersion: '^16.8.0 || ^18.0.0'`. In practice, React 16 and 18 can't share a single instance (breaking API differences). Options:
1. **Run both** — each micro-frontend loads its own React. Accept the ~40 KB duplication. Ensure they render into separate DOM nodes (never share a React tree across versions).
2. **Mandate upgrade** — set a deadline for Team B to upgrade to React 18. Provide migration support. This is usually the right answer for a major framework.
3. **Web Component wrapper** — wrap Team B's React 16 micro-frontend in a Web Component with Shadow DOM, fully isolating its React instance.

### Q: One micro-frontend's deployment broke the production site. How do you prevent this?

**A:**
1. **Contract tests in CI** — the shell has contract tests for each micro-frontend; they run in the micro-frontend's pipeline before deployment
2. **Canary deployment** — roll out to 1% of users first; monitor error rates, Core Web Vitals, and user metrics
3. **Error boundaries** — the shell wraps each micro-frontend in an error boundary that catches render errors and shows a fallback
4. **Feature flags** — deploy behind a flag; enable gradually; kill switch for instant rollback
5. **Runtime health check** — the shell pings each micro-frontend's entry point before mounting; if it returns an error, show a fallback
6. **Automated rollback** — CI/CD pipeline monitors production metrics post-deploy; if error rate spikes, automatically redeploy the previous version
7. **Post-mortem** — identify root cause, add a test to prevent recurrence

### Q: Users report that the page feels slow after you introduced micro-frontends. How do you diagnose?

**A:**
1. **Measure** — run Lighthouse, check Core Web Vitals (LCP, FID, CLS) before vs after
2. **Network waterfall** — open DevTools Network tab. Look for sequential loading: shell → remoteEntry.js → micro-frontend chunks → data APIs. Identify the longest chain.
3. **Bundle audit** — check for duplicate dependencies (two copies of React, lodash, moment.js)
4. **Rendering timeline** — use React Profiler or Performance tab to identify mount/re-render costs
5. **Fix**: preload critical micro-frontends, share dependencies, lazy-load non-critical ones, add SSR for above-the-fold content, use a service worker for caching
6. **Set budgets** — enforce per-micro-frontend JavaScript budgets in CI

### Q: Two micro-frontends need to show the same data (e.g., cart count in the header and the cart page). How?

**A:** Use an event-driven approach:
1. The Cart micro-frontend is the source of truth. When items change, it dispatches a `cart:updated` event with the count.
2. The Header micro-frontend (or shell) listens for `cart:updated` and updates its badge.
3. Alternatively, use a shared lightweight store (a single `BehaviorSubject` from RxJS or a Zustand store) that both subscribe to. The Cart micro-frontend writes; the Header reads.
4. Never have both micro-frontends independently fetch the cart — one is the owner, the other subscribes.

---

## 18. System Design Questions

### Q: Design a micro-frontend architecture for an e-commerce platform.

**A:**

**Micro-frontends:**
- **Shell** — layout (header, footer, sidebar), routing, auth, shared dependencies, design system
- **Product Catalog** — product listing, search, filters, product detail page
- **Shopping Cart** — cart sidebar/page, mini-cart in header
- **Checkout** — shipping, payment, order confirmation
- **User Account** — profile, orders, addresses, payment methods
- **Admin Dashboard** — product management, order management (separate shell entirely)

**Composition:** Client-side with Module Federation. Shell is the host; each micro-frontend is a remote.

**Routing:**
- `/` → Shell (home page, possibly a Content micro-frontend)
- `/products/*` → Product Catalog
- `/cart` → Shopping Cart
- `/checkout/*` → Checkout
- `/account/*` → User Account

**Shared state:**
- Auth token → shell-owned, passed via auth service
- Cart count → Cart micro-frontend emits `cart:updated` event
- User data → shell loads on auth, shares via context/props

**Design system:** `@company/ui-kit` npm package with React components, design tokens as CSS custom properties.

**Deployment:** Each micro-frontend in its own repo, CI/CD pipeline deploys to S3 + CloudFront. Shell references remotes by CDN URL.

**Performance:** Shared React/ReactDOM via Module Federation, lazy-load Checkout and Account, preload Product Catalog on shell load, SSR for product detail pages (SEO).

### Q: Design a dashboard application with pluggable widgets from different teams.

**A:**

**Architecture:** The shell provides a grid layout (like a configurable dashboard). Widgets are micro-frontends loaded into grid cells.

**Widget contract:**
```typescript
interface WidgetManifest {
  id: string;
  name: string;
  remoteEntry: string;
  exposedModule: string;
  defaultSize: { width: number; height: number };
  permissions: string[];
}
```

**Widget registry:** A backend service stores available widgets and their manifests. The shell fetches the registry, filters by user permissions, and renders the user's configured layout.

**Loading:** Module Federation with dynamic remotes — the shell resolves the `remoteEntry` URL from the manifest at runtime, not build time.

**Communication:** Widgets subscribe to a shared data bus for dashboard-level filters (date range, region). Each widget fetches its own data based on the filter context.

**Isolation:** Each widget wrapped in an error boundary. If a widget crashes, the rest of the dashboard is unaffected. CSS isolation via CSS Modules or Shadow DOM.

---

## 19. Anti-Patterns & Pitfalls

### Q: What are common micro-frontend anti-patterns?

**A:**

**Distributed Monolith (Frontend Edition):**
Micro-frontends that must be deployed together because they share a tightly coupled state or a shared library that requires coordinated upgrades. You have the complexity of micro-frontends with none of the independence.

**Mega Shell:**
A shell application that accumulates business logic, data fetching, and UI components over time. It becomes a monolith itself. Keep the shell infrastructure-only.

**Nano-Frontends:**
Splitting too granularly — every button, every form field is a micro-frontend. The integration overhead dwarfs any benefit. A micro-frontend should represent a meaningful business capability.

**Shared Mutable State Everywhere:**
A giant global Redux store shared across all micro-frontends. Every team's action can affect every other team's state. This recreates monolithic coupling.

**Copy-Paste Components:**
Instead of maintaining a shared design system, teams copy components into their own codebases and diverge over time. The UI becomes inconsistent.

**Ignoring Performance:**
Assuming "it'll be fine" and ending up with 3 MB of JavaScript on the initial page load because every micro-frontend ships its own dependencies.

**iFrame Everything:**
Using iframes by default because they're "safe." The UX, performance, accessibility, and routing costs are severe and usually not worth it.

**No Contract Testing:**
Deploying micro-frontends without contract tests and discovering integration failures from user bug reports.

**Technology Zoo:**
Using React, Angular, Vue, Svelte, Solid, and Lit simultaneously because "micro-frontends support technology freedom." Freedom doesn't mean you should. Limit to 2 frameworks maximum in most organizations.

---

## 20. Framework-Specific Questions

### Q: How do you implement micro-frontends with Next.js?

**A:** Next.js supports Module Federation via `@module-federation/nextjs-mfe` (community plugin) and the newer Module Federation 2.0 with Next.js support. You can also use Next.js zones — multiple Next.js apps behind a single domain, routed by a reverse proxy (e.g., Vercel rewrites, NGINX). Each zone is a separate Next.js app with its own build and deployment.

For SSR micro-frontends: the shell Next.js app fetches HTML fragments from other Next.js micro-frontends at request time and includes them in its response. This is server-side composition.

### Q: How do you handle micro-frontends in a React Native (mobile) context?

**A:** True micro-frontends in mobile are harder than web due to the single binary constraint (App Store/Play Store submission). Approaches:
- **Code Push / OTA updates** — use CodePush to update JavaScript bundles independently. Each "micro-frontend" is a JS bundle that can be updated without an app store release.
- **Module Federation for React Native** — experimental support via Re.Pack (Webpack for React Native).
- **Feature modules** — within a monorepo, structure the app as independent feature modules with clear boundaries, even if they ship as a single binary. Not true micro-frontends but achieves team independence.
- **Super App pattern** — the host app loads "mini-apps" (like WeChat mini-programs) via a custom runtime.

### Q: How do Angular and Vue handle micro-frontends differently?

**A:**

**Angular:**
- Module Federation is well-supported (especially with `@angular-architects/module-federation`)
- Angular's module system maps naturally to micro-frontends (each micro-frontend is an Angular module or standalone component)
- Angular Elements (Web Components) allow Angular micro-frontends to be consumed by non-Angular shells
- Challenge: Angular's framework size is large; running multiple Angular instances is expensive

**Vue:**
- Module Federation works via `@originjs/vite-plugin-federation` (Vite) or Webpack
- Vue's component model is lightweight, making it less expensive to run multiple instances
- Vue's `defineCustomElement` API creates Web Components from Vue components
- Micro-frontends can be mounted as Vue app instances into DOM containers provided by the shell

### Q: How does Astro's island architecture relate to micro-frontends?

**A:** Astro's "islands" are independently hydrated interactive components on an otherwise static page. Each island can use a different framework (React, Vue, Svelte). While not "micro-frontends" in the organizational sense (they don't imply independent deployment or team ownership), the technical pattern is similar — isolated, framework-agnostic interactive fragments composed on a shared page. Astro's approach is great for content-heavy sites with isolated interactive widgets but doesn't solve the independent deployment or team autonomy problem.

---

## Quick Reference Card

| Topic | Key Points |
|---|---|
| When to use | Multiple teams, independent deploy needs, complex product surface, organizational scaling |
| Composition | Build-time (npm), Server-side (SSI/ESI), Client-side (Module Federation, Single-SPA), Edge (Workers) |
| Module Federation | Runtime code sharing, Webpack 5, shared deps, host/remote model |
| Single-SPA | Lifecycle orchestrator, framework-agnostic, route-based mounting |
| Communication | Custom events > Shared store > Props > postMessage. Minimize shared state. |
| Auth | Shell-owned. JWT in memory. Refresh token in HTTP-only cookie. Shared auth service. |
| CSS isolation | Shadow DOM, CSS Modules, CSS-in-JS, BEM prefix, Tailwind |
| Testing | Unit (isolated) → Contract (critical) → Integration → Visual → E2E (minimal) |
| Performance | Lazy load, share deps, preload, CDN, bundle budgets, SSR for above-fold |
| Deploy | Independent pipelines, CDN hosting, stable entry URLs, canary rollout |
| Anti-patterns | Distributed monolith, mega shell, shared mutable state, technology zoo |

---

*This guide is designed as a comprehensive interview preparation resource for senior frontend/fullstack engineers. Each answer reflects production experience and architectural decision-making expected at the 10+ year experience level.*
