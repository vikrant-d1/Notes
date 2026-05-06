# Performance Optimisation – Interview Deep Dive

> **Level:** Team Lead / Senior Full Stack Developer (9+ years)
> **Format:** Concept → Diagnosis → Code/Config Examples → Real-World Impact → Interview Tip

---

## Q1: How do you measure and improve Core Web Vitals (LCP, FID/INP, CLS)?

### The Three Core Web Vitals

```
┌────────────────────────────────────────────────────────────────────┐
│                      CORE WEB VITALS                               │
├──────────────────┬──────────────────┬──────────────────────────────┤
│                  │                  │                              │
│  LCP             │  INP             │  CLS                        │
│  Largest         │  Interaction     │  Cumulative                 │
│  Contentful      │  to Next         │  Layout                     │
│  Paint           │  Paint           │  Shift                      │
│                  │                  │                              │
│  Loading perf    │  Responsiveness  │  Visual stability           │
│                  │                  │                              │
│  Good: ≤2.5s     │  Good: ≤200ms    │  Good: ≤0.1                 │
│  Poor: >4.0s     │  Poor: >500ms    │  Poor: >0.25                │
│                  │                  │                              │
│  "How fast does  │  "How quickly    │  "Does stuff jump           │
│   main content   │   does it        │   around while              │
│   appear?"       │   respond?"      │   loading?"                 │
└──────────────────┴──────────────────┴──────────────────────────────┘
```

### Measuring — Lab vs Field

```javascript
// FIELD DATA (Real User Monitoring — RUM)
// Using web-vitals library
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,       // "good" | "needs-improvement" | "poor"
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    // Attribution for debugging
    attribution: metric.attribution,
  });
  
  // Use sendBeacon to not block page unload
  navigator.sendBeacon('/api/vitals', body);
}

onLCP(sendToAnalytics);
onINP(sendToAnalytics);
onCLS(sendToAnalytics);
onFCP(sendToAnalytics);
onTTFB(sendToAnalytics);

// LAB TOOLS:
// - Chrome DevTools Performance tab
// - Lighthouse (Chrome DevTools → Lighthouse tab)
// - WebPageTest.org (real devices, multiple locations)
// - PageSpeed Insights (combines lab + field data)

// FIELD TOOLS:
// - Chrome UX Report (CrUX) — real Chrome user data
// - web-vitals library (your own RUM)
// - Vercel Speed Insights, Datadog RUM, New Relic
```

### Improving LCP (Largest Contentful Paint)

```html
<!-- LCP element is typically: hero image, main heading, or video poster -->

<!-- 1. PRELOAD the LCP resource -->
<link rel="preload" href="/hero.webp" as="image" fetchpriority="high">

<!-- 2. Set fetchpriority on the LCP image -->
<img src="/hero.webp" alt="Hero" fetchpriority="high" loading="eager">
<!-- NEVER lazy-load the LCP image -->

<!-- 3. Eliminate render-blocking resources -->
<!-- Inline critical CSS -->
<style>
  .hero { height: 100vh; background: #1a1a2e; }
  .hero img { width: 100%; height: auto; }
</style>

<!-- Defer non-critical CSS -->
<link rel="preload" href="/full.css" as="style"
      onload="this.onload=null;this.rel='stylesheet'">

<!-- 4. Use responsive images (don't load 4K on mobile) -->
<img
  srcset="hero-400.webp 400w, hero-800.webp 800w, hero-1600.webp 1600w"
  sizes="100vw"
  src="hero-800.webp"
  alt="Hero"
  fetchpriority="high"
  decoding="async"
/>

<!-- 5. Use CDN for static assets -->
<!-- 6. Enable compression (Brotli > Gzip) -->
<!-- 7. Optimize server response time (TTFB < 800ms) -->
```

```javascript
// 8. Server-side: Stream HTML early
// Next.js / React 18
// Return the shell immediately, stream content as it's ready
// The LCP element should be in the first HTML chunk

// 9. Avoid client-side rendering for LCP content
// If your hero text comes from an API call in useEffect,
// LCP waits for: HTML → JS download → JS execute → API call → render
// Instead: SSR or SSG the hero content
```

### Improving INP (Interaction to Next Paint)

```javascript
// INP measures the WORST interaction responsiveness
// Target: input → visual update in <200ms

// 1. BREAK UP LONG TASKS
// ❌ Single long task (blocks main thread)
function processAllItems(items) {
  items.forEach(item => {
    heavyComputation(item);  // 500ms total — blocks ALL interactions
  });
}

// ✅ Yield to main thread between chunks
async function processAllItems(items) {
  const CHUNK_SIZE = 50;
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    chunk.forEach(item => heavyComputation(item));
    
    // Yield to browser — allow input processing and painting
    await new Promise(resolve => setTimeout(resolve, 0));
    // Or use scheduler.yield() (Chrome 129+)
    // await scheduler.yield();
  }
}

// 2. USE startTransition FOR NON-URGENT UPDATES
function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  function handleInput(e) {
    setQuery(e.target.value);  // Urgent — update input immediately
    
    startTransition(() => {
      setResults(filterItems(e.target.value));  // Non-urgent — can be interrupted
    });
  }
  
  return (
    <>
      <input value={query} onChange={handleInput} />
      <ResultsList items={results} />
    </>
  );
}

// 3. MOVE HEAVY WORK TO WEB WORKERS
const worker = new Worker('/filter-worker.js');

function handleInput(e) {
  setQuery(e.target.value);
  worker.postMessage({ query: e.target.value, data: items });
}

worker.onmessage = (e) => {
  startTransition(() => setResults(e.data));
};

// 4. DEBOUNCE EXPENSIVE HANDLERS
const handleScroll = throttle(() => {
  // Expensive scroll handler
}, 100);

// 5. USE CSS FOR ANIMATIONS INSTEAD OF JS
// CSS animations run on compositor thread — don't block main thread
```

### Improving CLS (Cumulative Layout Shift)

```html
<!-- CLS = sum of all unexpected layout shifts during page lifecycle -->

<!-- 1. ALWAYS set dimensions on images and videos -->
<img src="photo.webp" width="800" height="600" alt="Photo">
<!-- Or use aspect-ratio -->
<style>
  img { aspect-ratio: 4/3; width: 100%; height: auto; }
</style>

<!-- 2. RESERVE SPACE for dynamic content -->
<style>
  .ad-slot {
    min-height: 250px;  /* Reserve space before ad loads */
    background: #f0f0f0;
  }
  
  .skeleton {
    /* Placeholder matches final content dimensions */
    height: 200px;
    border-radius: 8px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
</style>

<!-- 3. USE transform FOR ANIMATIONS (not top/left/width/height) -->
<style>
  /* ❌ Causes layout shift */
  .notification { top: 0; transition: top 0.3s; }
  .notification.show { top: 60px; }
  
  /* ✅ No layout shift */
  .notification { transform: translateY(-100%); transition: transform 0.3s; }
  .notification.show { transform: translateY(0); }
</style>

<!-- 4. FONT LOADING — prevent text layout shifts -->
<style>
  @font-face {
    font-family: 'Inter';
    src: url('/inter.woff2') format('woff2');
    font-display: optional;  /* Best for CLS — fallback if slow */
    /* font-display: swap causes layout shift when font loads */
    size-adjust: 100%;
    ascent-override: 90%;
    descent-override: 20%;
    line-gap-override: 0%;
  }
</style>

<!-- 5. NEVER insert content above existing content -->
<!-- ❌ Banner injected at top of page → everything shifts down -->
<!-- ✅ Banner is pre-rendered or uses fixed/sticky positioning -->

<!-- 6. Use contain-intrinsic-size with content-visibility -->
<style>
  .section {
    content-visibility: auto;
    contain-intrinsic-size: auto 500px;
  }
</style>
```

### Interview Tip
> "I approach Core Web Vitals as a pipeline: measure with field data (web-vitals RUM), identify the specific bottleneck using attribution data, fix with targeted optimizations, and verify with A/B tests. The most common quick wins I've shipped: adding `fetchpriority='high'` to the LCP image (LCP -30%), breaking up long tasks with `scheduler.yield()` for INP, and setting explicit image dimensions for CLS. The key insight is that lab scores don't reflect real users — always prioritize field data from the 75th percentile."

---

## Q2: Explain your approach to performance budgeting for a large-scale web application.

### What is a Performance Budget

A performance budget is a set of quantitative limits on metrics that affect user experience. If a build exceeds the budget, it fails CI — just like a broken test.

### Setting Budgets — The Framework

```
Step 1: Define critical user journeys
  - Landing page → first meaningful content
  - Search → results displayed
  - Product page → add to cart
  - Checkout → order confirmation

Step 2: Set metric targets per journey
  
  ┌─────────────────────────────────────────────────────────┐
  │              Performance Budget Template                 │
  ├──────────────────┬──────────┬──────────┬────────────────┤
  │ Metric           │ Good     │ Warning  │ Fail           │
  ├──────────────────┼──────────┼──────────┼────────────────┤
  │ JS bundle (gz)   │ < 150KB  │ < 250KB  │ > 250KB        │
  │ CSS bundle (gz)  │ < 30KB   │ < 50KB   │ > 50KB         │
  │ Total page weight│ < 500KB  │ < 1MB    │ > 1MB          │
  │ LCP              │ < 2.0s   │ < 2.5s   │ > 2.5s         │
  │ INP              │ < 150ms  │ < 200ms  │ > 200ms        │
  │ CLS              │ < 0.05   │ < 0.1    │ > 0.1          │
  │ TTFB             │ < 400ms  │ < 800ms  │ > 800ms        │
  │ Third-party JS   │ < 50KB   │ < 100KB  │ > 100KB        │
  │ Image weight     │ < 200KB  │ < 500KB  │ > 500KB        │
  │ Font weight      │ < 100KB  │ < 150KB  │ > 150KB        │
  │ Request count    │ < 30     │ < 50     │ > 50           │
  │ DOM nodes        │ < 800    │ < 1500   │ > 1500         │
  └──────────────────┴──────────┴──────────┴────────────────┘

Step 3: Baseline from competitors
  - 20% faster than closest competitor = competitive advantage
  - Use CrUX data for competitor comparison
```

### Enforcing Budgets in CI

```javascript
// bundlesize.config.js
module.exports = {
  files: [
    { path: 'dist/js/main.*.js', maxSize: '150 KB', compression: 'gzip' },
    { path: 'dist/js/vendor.*.js', maxSize: '100 KB', compression: 'gzip' },
    { path: 'dist/css/main.*.css', maxSize: '30 KB', compression: 'gzip' },
    { path: 'dist/**/*.js', maxSize: '300 KB', compression: 'gzip' },  // Total JS
  ],
};

// webpack.config.js — built-in performance hints
module.exports = {
  performance: {
    maxAssetSize: 250 * 1024,       // 250KB per asset
    maxEntrypointSize: 400 * 1024,  // 400KB per entry
    hints: 'error',                 // Fail build if exceeded
  },
};
```

```yaml
# .github/workflows/perf-budget.yml
perf-check:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: npm ci && npm run build
    
    # Bundle size check
    - uses: siddharthkp/bundlesize2@v1
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
    
    # Lighthouse CI
    - uses: treosh/lighthouse-ci-action@v11
      with:
        configPath: .lighthouserc.json
        temporaryPublicStorage: true
```

```json
// .lighthouserc.json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "interactive": ["error", { "maxNumericValue": 3500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-byte-weight": ["warning", { "maxNumericValue": 500000 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### Bundle Analysis Dashboard

```javascript
// next.config.js — enable bundle analysis
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... config
});

// Run: ANALYZE=true npm run build
// Generates interactive treemap showing every module's size
```

### Interview Tip
> "Performance budgets are only useful if they're automated and enforced. I set them in three places: webpack/vite config for build-time asset limits, bundlesize in CI for PR-level bundle checks, and Lighthouse CI for overall page metrics. The most important practice is making budget failures BLOCK merges — just like failing tests. Without enforcement, budgets become suggestions that everyone ignores. I also set up Slack alerts when field metrics (RUM) cross thresholds — that catches regressions that lab tests miss."

---

## Q3: How would you diagnose and fix a page that takes 8 seconds to become interactive?

### Diagnostic Framework

```
8-second TTI Diagnosis Waterfall:

  0s        2s        4s        6s        8s
  |─────────|─────────|─────────|─────────|
  
  [TTFB]                                     ← Server slow?
       [HTML Parse]                           ← HTML too large?
       [CSS Download + Parse]                 ← Render-blocking CSS?
            [JS Download]                     ← Too much JS?
                 [JS Parse + Execute]         ← Heavy JS execution?
                      [Data Fetch]            ← Waterfall requests?
                           [Render + Hydrate] ← Expensive render?
                                [Interactive] ← 8 seconds!

Each segment can be the bottleneck. Diagnose systematically.
```

### Step 1: Identify the Bottleneck (Chrome DevTools)

```
1. Open DevTools → Performance tab → Record page load
2. Look at the timeline for:
   
   a) LONG TTFB (>800ms)
      → Server is slow
      → Check: server logs, database queries, CDN miss
   
   b) LARGE DOWNLOAD TIME
      → Too much data over the wire
      → Check: Network tab → sort by size
      → Look for: uncompressed assets, large images, unused JS
   
   c) LONG TASKS (yellow bars >50ms on main thread)
      → JavaScript blocking the main thread
      → Check: Bottom-Up tab → find expensive functions
      → Look for: parsing large JSON, DOM manipulation, third-party scripts
   
   d) LAYOUT THRASHING (purple bars)
      → Repeated forced layouts
      → Check: Layout Shift visualization
   
   e) WATERFALL REQUESTS (sequential, not parallel)
      → Dependencies fetched in sequence
      → Check: Network tab → waterfall column
```

### Step 2: Fix Each Bottleneck

```
BOTTLENECK: Server (TTFB >1s)
┌───────────────────────────────────────────────────┐
│ ✅ Enable CDN caching (static pages)              │
│ ✅ Use stale-while-revalidate cache headers       │
│ ✅ Optimize database queries (add indexes, N+1)   │
│ ✅ Use Redis/Memcached for repeated queries        │
│ ✅ Move to edge computing (Vercel Edge, Cloudflare)│
│ ✅ Enable HTTP/2 or HTTP/3                         │
│ ✅ Use streaming SSR (don't wait for all data)     │
└───────────────────────────────────────────────────┘
```

```html
<!-- BOTTLENECK: Render-blocking resources -->

<!-- ❌ BEFORE: All CSS and JS blocks rendering -->
<link rel="stylesheet" href="styles.css">      <!-- Blocks render -->
<link rel="stylesheet" href="animations.css">   <!-- Blocks render -->
<script src="vendor.js"></script>                <!-- Blocks parsing -->
<script src="app.js"></script>                   <!-- Blocks parsing -->

<!-- ✅ AFTER: Only critical resources block -->
<style>/* Inlined critical CSS — only above-the-fold styles */</style>
<link rel="preload" href="styles.css" as="style"
      onload="this.onload=null;this.rel='stylesheet'">
<link rel="stylesheet" href="animations.css" media="print"
      onload="this.media='all'">
<script src="vendor.js" defer></script>
<script src="app.js" defer></script>
```

```javascript
// BOTTLENECK: Too much JavaScript (>300KB gzipped)

// 1. Analyze what's in the bundle
// npx webpack-bundle-analyzer stats.json
// Or: npx source-map-explorer dist/main.js

// 2. Common culprits and fixes:
// ❌ moment.js (300KB) → ✅ date-fns (tree-shakeable) or dayjs (2KB)
// ❌ lodash (70KB full) → ✅ lodash-es (tree-shakeable) or native methods
// ❌ All of chart.js → ✅ Import only needed chart types
// ❌ Full icon library → ✅ Import individual icons

// 3. Code split routes
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));

// 4. Dynamic import heavy libraries
async function generatePDF() {
  const { jsPDF } = await import('jspdf');  // Only when needed
  const doc = new jsPDF();
  // ...
}

// 5. Remove unused code
// package.json — check with: npx depcheck
// CSS — PurgeCSS or Tailwind JIT
```

```javascript
// BOTTLENECK: Long Tasks (>50ms on main thread)

// Use Performance tab → find the long task → expand call tree

// Common fixes:

// 1. Break up long loops
// ❌ Blocks for 200ms
data.forEach(item => processItem(item));

// ✅ Yields to browser every 5ms
async function processInChunks(data) {
  for (let i = 0; i < data.length; i += 100) {
    data.slice(i, i + 100).forEach(processItem);
    await scheduler.yield();  // Or setTimeout(0)
  }
}

// 2. Defer non-critical initialization
// ❌ Runs everything on load
initAnalytics();
initChat();
initNotifications();
initA11yChecks();

// ✅ Stagger initialization
requestIdleCallback(() => initAnalytics());
requestIdleCallback(() => initChat());
setTimeout(() => initNotifications(), 3000);

// 3. Move computation to Web Worker
const worker = new Worker('/heavy-calc.js');
worker.postMessage(data);
worker.onmessage = (e) => renderResults(e.data);
```

```javascript
// BOTTLENECK: Request waterfall

// ❌ Sequential fetches (waterfall)
async function loadPage() {
  const user = await fetch('/api/user');        // 200ms
  const posts = await fetch('/api/posts');       // 300ms
  const comments = await fetch('/api/comments'); // 250ms
  // Total: 750ms (sequential)
}

// ✅ Parallel fetches
async function loadPage() {
  const [user, posts, comments] = await Promise.all([
    fetch('/api/user'),
    fetch('/api/posts'),
    fetch('/api/comments'),
  ]);
  // Total: 300ms (parallel — limited by slowest)
}

// ✅ Preload data before navigation
<link rel="preload" href="/api/user" as="fetch" crossorigin>

// ✅ Use React Router loaders for parallel route data
const router = createBrowserRouter([{
  path: '/dashboard',
  element: <Dashboard />,
  loader: async () => {
    const [user, metrics] = await Promise.all([fetchUser(), fetchMetrics()]);
    return { user, metrics };
  },
}]);
```

### The 8-Second Fix Checklist

```
Server (TTFB):
  ☐ CDN for static assets
  ☐ Edge rendering or caching
  ☐ Database query optimization
  ☐ HTTP/2 or HTTP/3

Download:
  ☐ Enable Brotli compression
  ☐ Code split by route
  ☐ Remove unused dependencies
  ☐ Optimize images (WebP/AVIF, responsive srcset)
  ☐ Subset fonts

Execution:
  ☐ Defer non-critical JS
  ☐ Break up long tasks (scheduler.yield)
  ☐ Move heavy computation to Web Workers
  ☐ Lazy load below-fold components

Rendering:
  ☐ SSR or SSG for initial content
  ☐ Progressive hydration (Suspense boundaries)
  ☐ Avoid layout thrashing (batch reads/writes)
  ☐ Use content-visibility: auto for off-screen sections

Data:
  ☐ Parallel requests (Promise.all)
  ☐ Preload critical data
  ☐ Cache API responses (TanStack Query staleTime)
  ☐ Use GraphQL to avoid over-fetching
```

### Interview Tip
> "My diagnostic process is always: measure → identify bottleneck → fix → verify. I start with the Network tab waterfall to see if it's server time, download time, or execution time. Then I use the Performance tab to find long tasks. The most impactful fixes I've shipped: switching from full lodash to lodash-es (saved 60KB), adding route-based code splitting (reduced initial JS by 70%), and parallelizing API requests that were sequential (cut data loading from 2s to 400ms). After every fix, I verify with both lab tools (Lighthouse) and field data (RUM) to confirm real user impact."

---

## Q4: What is tree shaking? How do you ensure it works properly across your bundled code?

### What Tree Shaking Does

```
Tree shaking eliminates dead code (unused exports) during bundling.
The name comes from "shaking the dependency tree" — unused branches fall off.

// math.js
export function add(a, b) { return a + b; }      // ✅ USED
export function subtract(a, b) { return a - b; }  // ❌ NOT USED
export function multiply(a, b) { return a * b; }  // ❌ NOT USED
export function divide(a, b) { return a / b; }    // ❌ NOT USED

// app.js
import { add } from './math';
console.log(add(1, 2));

// BUNDLED OUTPUT (with tree shaking):
function add(a, b) { return a + b; }
console.log(add(1, 2));
// subtract, multiply, divide are REMOVED — never shipped to users
```

### How It Works — Static Analysis of ES Modules

```javascript
// Tree shaking relies on STATIC ANALYSIS of import/export statements

// ✅ ES Modules — statically analyzable (tree shakeable)
import { map } from 'lodash-es';
// Bundler can determine at BUILD TIME that only `map` is used

// ❌ CommonJS — NOT statically analyzable (NOT tree shakeable)
const { map } = require('lodash');
// `require` is a function call — could be dynamic
// Bundler can't determine which parts are used at build time
// ENTIRE lodash is included (70KB+ gzipped)

// ❌ Dynamic import paths — NOT tree shakeable
const mod = await import(`./modules/${name}`);
// Path is a runtime variable — bundler can't analyze

// ✅ Static dynamic import — tree shakeable
const mod = await import('./specific-module');
```

### What Breaks Tree Shaking

```javascript
// PROBLEM 1: Side effects in modules
// utils.js
export const PI = 3.14159;
export function circleArea(r) { return PI * r * r; }

// THIS LINE IS A SIDE EFFECT:
console.log('Utils module loaded!');
// Even if nothing is imported, the bundler KEEPS this file
// because removing it would change program behavior

// PROBLEM 2: Re-exporting everything (barrel files)
// components/index.js
export { Button } from './Button';
export { Modal } from './Modal';
export { DataTable } from './DataTable';  // 200KB component
export { Chart } from './Chart';          // 150KB component

// app.js
import { Button } from './components';
// SOME bundlers import ALL components because of the barrel file
// Even though only Button is used

// PROBLEM 3: Class methods can't be tree-shaken
class Utils {
  static add(a, b) { return a + b; }
  static subtract(a, b) { return a - b; }  // Can't be removed
  static multiply(a, b) { return a * b; }  // Can't be removed
}
// The entire class is included — individual methods can't be shaken

// PROBLEM 4: Object property access
const utils = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
};
export default utils;

import utils from './utils';
utils.add(1, 2);
// Bundler can't know if .subtract is used elsewhere → keeps it
```

### Ensuring Tree Shaking Works

```json
// 1. Mark your package as side-effect-free
// package.json
{
  "name": "my-library",
  "sideEffects": false,
  // Or specify which files HAVE side effects:
  "sideEffects": ["*.css", "*.scss", "./src/polyfills.js"]
}
```

```javascript
// 2. Use named exports, not default exports
// ❌ Default export — harder to tree shake
export default { add, subtract, multiply };

// ✅ Named exports — each can be individually removed
export function add(a, b) { return a + b; }
export function subtract(a, b) { return a - b; }

// 3. Import specifically, not the whole module
// ❌ Imports entire library
import _ from 'lodash';
_.map(data, fn);

// ✅ Import individual function
import map from 'lodash-es/map';
map(data, fn);

// ✅ Or use named import from ES module version
import { map } from 'lodash-es';

// 4. Use ES module versions of libraries
// ❌ lodash (CommonJS) → ✅ lodash-es (ES Modules)
// ❌ moment → ✅ date-fns (tree-shakeable)
// ❌ @material-ui/icons → ✅ @mui/icons-material (tree-shakeable)

// 5. Avoid barrel file problems in large projects
// Instead of: import { Button } from '@/components';
// Use: import { Button } from '@/components/Button';
```

```javascript
// 6. Verify tree shaking is working
// webpack
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
module.exports = {
  plugins: [new BundleAnalyzerPlugin()],
};

// vite
// npx vite-bundle-visualizer

// Check: Are unused modules appearing in the bundle?
// If yes: check sideEffects, import style, and module format
```

### Interview Tip
> "Tree shaking depends on three things: ES module syntax (`import`/`export`, not `require`), the `sideEffects: false` flag in package.json, and the bundler's ability to statically analyze imports. The most common tree shaking failure I've debugged was a barrel file (`index.ts` re-exporting everything) pulling in a 200KB chart library when only a Button was needed. The fix: direct imports to the specific module file. I always verify with bundle analysis after making tree shaking changes."

---

## Q5: Explain code splitting strategies — route-based, component-based, and dynamic imports.

### Route-Based Code Splitting

```jsx
// The most impactful splitting — each route loads its own bundle

// React Router + React.lazy
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Each import() creates a separate chunk
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const UserProfile = lazy(() => import('./pages/UserProfile'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/user/:id" element={<UserProfile />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

// Result:
// main.js          → 50KB  (shared code, router, layout)
// Home.chunk.js    → 30KB  (home page specific)
// Dashboard.chunk.js → 120KB (charts, tables, widgets)
// Settings.chunk.js  → 40KB  (forms, settings UI)
// UserProfile.chunk.js → 25KB

// User visiting home page downloads 80KB instead of 265KB
```

### Component-Based Code Splitting

```jsx
// Split heavy components that aren't needed immediately

// ❌ Heavy modal loaded upfront
import PdfViewer from './PdfViewer';  // 300KB library

// ✅ Split: only loaded when modal opens
const PdfViewer = lazy(() => import('./PdfViewer'));

function DocumentPage() {
  const [showPdf, setShowPdf] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowPdf(true)}>View PDF</button>
      
      {showPdf && (
        <Suspense fallback={<div>Loading viewer...</div>}>
          <PdfViewer url="/document.pdf" />
        </Suspense>
      )}
    </div>
  );
}

// Heavy components to always split:
// - Rich text editors (Quill, TipTap, Draft.js)
// - Chart libraries (Recharts, Chart.js, D3)
// - PDF viewers / generators
// - Video players
// - Map components (Google Maps, Mapbox)
// - Code editors (Monaco, CodeMirror)
// - Date pickers with complex logic
```

### Dynamic Imports for Libraries

```javascript
// Load libraries on demand — not at page load

// ❌ Always loaded (even if user never exports)
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';

// ✅ Loaded only when user clicks "Export"
async function exportToExcel(data) {
  const [{ saveAs }, { Workbook }] = await Promise.all([
    import('file-saver'),
    import('exceljs'),
  ]);
  
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('Data');
  sheet.addRows(data);
  
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'export.xlsx');
}

// Named chunks for better caching
const Analytics = lazy(() => 
  import(/* webpackChunkName: "analytics" */ './Analytics')
);

// Prefetch — download during idle time, execute when needed
const AdminPanel = lazy(() =>
  import(/* webpackPrefetch: true */ './AdminPanel')
);
// Injects: <link rel="prefetch" href="AdminPanel.chunk.js">
// Browser downloads it during idle → instant when navigated

// Preload — download immediately but don't execute yet
const Dashboard = lazy(() =>
  import(/* webpackPreload: true */ './Dashboard')
);
// Downloads in parallel with current chunk
```

### Advanced: Prefetch on User Intent

```jsx
// Prefetch route JS when user HOVERS over a link (before click)
function PrefetchLink({ to, children }) {
  const prefetchRef = useRef(false);
  
  function handleMouseEnter() {
    if (!prefetchRef.current) {
      // Prefetch the route's chunk
      import(`./pages/${to}`).catch(() => {});
      prefetchRef.current = true;
    }
  }
  
  return (
    <Link to={to} onMouseEnter={handleMouseEnter}>
      {children}
    </Link>
  );
}

// Next.js does this automatically with <Link> component
// It prefetches linked routes when they enter the viewport
```

### Interview Tip
> "I apply code splitting in three layers: route-level (every route is a separate chunk — biggest impact), component-level (heavy components like editors and charts load on demand), and library-level (export libraries like ExcelJS load only on user action). The key metric is initial bundle size — I target under 150KB gzipped for the entry point. For prefetching, I use hover-intent on navigation links and `webpackPrefetch` for likely-next routes, so the chunk is already in browser cache when the user clicks."

---

## Q6: How does lazy loading work for images, components, and routes? What are the trade-offs?

### Image Lazy Loading

```html
<!-- Native lazy loading (simplest — use this by default) -->
<img src="photo.webp" loading="lazy" alt="Photo" width="800" height="600">

<!-- CRITICAL: Never lazy-load above-the-fold / LCP images -->
<img src="hero.webp" loading="eager" fetchpriority="high" alt="Hero">

<!-- Intersection Observer for advanced control -->
```

```javascript
// Custom lazy loading with blur-up placeholder
function LazyImage({ src, alt, width, height, placeholder }) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }  // Start loading 200px before visible
    );
    
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={imgRef} style={{ width, height, position: 'relative' }}>
      {/* Blurred placeholder (inline base64 or LQIP) */}
      <img
        src={placeholder}
        alt=""
        style={{
          filter: loaded ? 'none' : 'blur(20px)',
          transition: 'filter 0.3s',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      
      {/* Full image — only loads when in viewport */}
      {inView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        />
      )}
    </div>
  );
}
```

### Component Lazy Loading

```jsx
// React.lazy + Suspense
const HeavyChart = lazy(() => import('./HeavyChart'));

// Lazy on visibility (load when scrolled into view)
function LazyOnView({ children, fallback, rootMargin = '100px' }) {
  const [isVisible, setVisible] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  );
}

// Usage
<LazyOnView fallback={<ChartSkeleton />}>
  <Suspense fallback={<ChartSkeleton />}>
    <HeavyChart data={data} />
  </Suspense>
</LazyOnView>

// Lazy on interaction (load when user interacts)
function LazyOnInteraction({ importFn, fallback, ...props }) {
  const [Component, setComponent] = useState(null);
  
  async function handleInteraction() {
    if (!Component) {
      const mod = await importFn();
      setComponent(() => mod.default);
    }
  }
  
  if (Component) return <Component {...props} />;
  
  return (
    <div
      onClick={handleInteraction}
      onMouseEnter={handleInteraction}
      onFocus={handleInteraction}
    >
      {fallback}
    </div>
  );
}

// Usage — editor only loads when user clicks the placeholder
<LazyOnInteraction
  importFn={() => import('./RichTextEditor')}
  fallback={<div className="editor-placeholder">Click to edit...</div>}
  content={content}
  onChange={setContent}
/>
```

### Trade-offs Table

```
                    Benefit              Trade-off
────────────────────────────────────────────────────────────────
Image lazy load     Faster initial load   LCP image must NOT be lazy
                    Less bandwidth        Content jump if no dimensions set
                    Better INP            Below-fold images load on scroll

Component lazy      Smaller initial JS    Flash of loading state
                    Faster TTI            Extra network request on demand
                    Pay-for-what-you-use  Slightly delayed interaction

Route lazy          Each page loads only  Route transition shows loading
                    what it needs         First visit to route is slower
                    Much smaller bundles  Prefetching logic needed

Over-lazy-loading   —                     Too many loading states = bad UX
                                          Network waterfalls (lazy inside lazy)
                                          SEO impact if content not in HTML
```

### Interview Tip
> "The golden rule of lazy loading: never lazy-load what the user needs FIRST. The LCP image must be `loading='eager'` with `fetchpriority='high'`. Above-the-fold components should never be lazy. Everything below the fold or behind an interaction (modals, editors, heavy charts) should be lazy. I combine IntersectionObserver for visibility-based loading with hover-intent prefetching for likely interactions — the component starts downloading when the user's mouse moves toward it, so it's ready by the time they click."

---

## Q7: What is the difference between preload, prefetch, preconnect, and modulepreload? When do you use each?

### The Complete Resource Hints Cheat Sheet

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RESOURCE HINTS TIMELINE                          │
│                                                                         │
│  dns-prefetch  ──►  preconnect  ──►  preload  ──►  prefetch            │
│  (cheapest)         (cheap)          (NOW)         (LATER)              │
│                                                                         │
│  "Resolve DNS"  "Open TCP/TLS"  "Download NOW,   "Download when        │
│                                  I need it soon"   browser is idle"     │
│                                                                         │
│  modulepreload: like preload but for ES modules (parses + compiles)     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Each Hint in Detail

```html
<!-- ═══════════════════════════════════════════ -->
<!-- dns-prefetch: Resolve DNS for third-party domains -->
<!-- ═══════════════════════════════════════════ -->
<!-- Cost: ~0KB, ~20-120ms savings -->
<link rel="dns-prefetch" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://cdn.analytics.com">
<link rel="dns-prefetch" href="https://api.stripe.com">

<!-- USE WHEN: You'll need a third-party domain but not immediately -->
<!-- DON'T USE: For your own domain (already resolved) -->


<!-- ═══════════════════════════════════════════ -->
<!-- preconnect: DNS + TCP + TLS handshake -->
<!-- ═══════════════════════════════════════════ -->
<!-- Cost: ~1KB overhead, saves ~100-500ms -->
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://api.example.com">

<!-- USE WHEN: You KNOW you'll fetch from this origin very soon -->
<!-- DON'T: Use for more than 2-3 origins (each holds a connection open) -->
<!-- ALWAYS: Add crossorigin for CORS resources (fonts, fetch API) -->


<!-- ═══════════════════════════════════════════ -->
<!-- preload: Fetch THIS resource NOW (current page needs it) -->
<!-- ═══════════════════════════════════════════ -->
<!-- Cost: Actual download cost. HIGH PRIORITY. -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/hero.webp" as="image">
<link rel="preload" href="/critical.css" as="style">
<link rel="preload" href="/api/user" as="fetch" crossorigin>

<!-- The "as" attribute is REQUIRED — tells browser: -->
<!-- as="font"   → high priority, correct content type -->
<!-- as="image"  → medium priority -->
<!-- as="style"  → highest priority (render-blocking) -->
<!-- as="script" → high priority -->
<!-- as="fetch"  → high priority -->

<!-- USE WHEN: Resource is critical for current page but discovered late -->
<!-- Example: Font referenced in CSS → browser finds it after CSS loads -->
<!--   With preload: font download starts immediately with HTML parse -->
<!-- DON'T: Preload resources you don't use on THIS page (wastes bandwidth) -->


<!-- ═══════════════════════════════════════════ -->
<!-- prefetch: Fetch for FUTURE navigation (low priority, when idle) -->
<!-- ═══════════════════════════════════════════ -->
<!-- Cost: Download during idle time. LOW PRIORITY. -->
<link rel="prefetch" href="/dashboard.js">
<link rel="prefetch" href="/api/dashboard-data" as="fetch">
<link rel="prefetch" href="/next-page.html">

<!-- USE WHEN: High probability user will navigate to this next -->
<!-- Browser downloads during idle time — no impact on current page -->
<!-- DON'T: Prefetch everything — wastes user's bandwidth -->
<!-- DON'T: Prefetch on metered connections (check navigator.connection) -->


<!-- ═══════════════════════════════════════════ -->
<!-- modulepreload: Preload + Parse + Compile ES modules -->
<!-- ═══════════════════════════════════════════ -->
<link rel="modulepreload" href="/src/components/Dashboard.js">
<link rel="modulepreload" href="/src/utils/charts.js">

<!-- Unlike preload (which just downloads), modulepreload: -->
<!--   1. Downloads the module -->
<!--   2. Parses JavaScript -->
<!--   3. Compiles to bytecode -->
<!--   4. Ready to execute instantly when imported -->
<!-- USE WHEN: ES modules that will be imported on current page -->
```

### Practical Implementation

```html
<!-- A well-optimized <head> section -->
<head>
  <!-- 1. Preconnect to critical origins (max 2-3) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://api.example.com">
  
  <!-- 2. DNS-prefetch for other origins -->
  <link rel="dns-prefetch" href="https://cdn.analytics.com">
  
  <!-- 3. Preload critical resources -->
  <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/hero.webp" as="image" fetchpriority="high">
  
  <!-- 4. Critical CSS inlined -->
  <style>/* critical above-the-fold CSS */</style>
  
  <!-- 5. Full CSS deferred -->
  <link rel="preload" href="/styles.css" as="style"
        onload="this.onload=null;this.rel='stylesheet'">
  
  <!-- 6. JS modules -->
  <link rel="modulepreload" href="/src/app.js">
  <script type="module" src="/src/app.js" defer></script>
  
  <!-- 7. Prefetch likely next pages -->
  <link rel="prefetch" href="/dashboard.js">
</head>
```

### Interview Tip
> "The mental model is about timing: `preconnect` saves handshake time for origins you'll use within seconds. `preload` tells the browser 'download this NOW — I need it for the current page but you haven't discovered it yet.' `prefetch` says 'download this during idle — I might need it on the next page.' `modulepreload` goes beyond preload by also parsing and compiling JS modules. The biggest performance win I've gotten from resource hints was preloading the LCP image and preconnecting to the font CDN — together they cut LCP by 800ms because the browser started both downloads at HTML parse time instead of waiting to discover them through CSS."

---

## Q8: How do you optimise fonts for performance — font-display strategies, subsetting, variable fonts?

### Font Loading Strategies (`font-display`)

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2');
  
  /* ═══ font-display options ═══ */
  
  font-display: swap;
  /* Show fallback immediately → swap to custom font when loaded
     PROS: No invisible text (good for FCP)
     CONS: Text reflows when font swaps → CLS impact (FOUT) 
     USE: For body text where readability > visual polish */
  
  font-display: optional;
  /* Show fallback → only use custom font if already cached
     PROS: Zero CLS (best for Core Web Vitals)
     CONS: First visit may not show custom font
     USE: When CLS is critical, or for non-essential decorative fonts */
  
  font-display: fallback;
  /* Brief invisible period (100ms) → fallback → swap if loaded within 3s
     PROS: Compromise between swap and block
     CONS: Can still cause minor CLS
     USE: Good default for most use cases */
  
  font-display: block;
  /* Invisible text for up to 3s → then fallback
     PROS: No FOUT (flash of unstyled text)
     CONS: FOIT (flash of invisible text) — blank text for seconds
     USE: Icon fonts only (where fallback is meaningless) */
  
  font-display: auto;
  /* Browser decides (usually similar to block)
     USE: Never — always specify explicitly */
}
```

### Font Subsetting — Remove Unused Characters

```bash
# Using pyftsubset (from fonttools)
# Full Inter font: 300KB
# After subsetting to Latin: 25KB (92% reduction)

pip install fonttools brotli

# Subset to Latin characters only
pyftsubset Inter-Regular.ttf \
  --output-file=Inter-Regular-Latin.woff2 \
  --flavor=woff2 \
  --layout-features='kern,liga,calt' \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"

# For Google Fonts — add subset parameter
# fonts.googleapis.com auto-subsets, but you can control it:
```

```css
/* Unicode-range subsetting — browser only downloads needed subsets */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153;  /* Latin */
  font-display: optional;
}

@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-cyrillic.woff2') format('woff2');
  unicode-range: U+0400-045F, U+0490-0491, U+04B0-04B1;  /* Cyrillic */
  font-display: optional;
}

/* Browser ONLY downloads the subset it needs
   English page: downloads latin only (25KB)
   Russian page: downloads latin + cyrillic (50KB)
   Never downloads unused character sets */
```

### Variable Fonts — One File for All Weights/Styles

```css
/* Traditional: separate file per weight */
/* 400.woff2 (25KB) + 500.woff2 (25KB) + 600.woff2 (25KB) + 700.woff2 (25KB) = 100KB */

/* Variable font: ONE file covers all weights */
/* inter-var.woff2 = 45KB (covers weight 100-900) */

@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2-variations');
  font-weight: 100 900;           /* Full weight range */
  font-style: normal;
  font-display: optional;
}

/* Now any weight works without extra downloads */
body { font-weight: 400; }        /* Regular */
h1 { font-weight: 720; }          /* Custom weight — not possible with static fonts */
strong { font-weight: 650; }      /* Any value in the range */
.subtle { font-weight: 350; }

/* Variable font axes — some fonts support width, slant, optical size */
.wide-text {
  font-variation-settings: 'wdth' 125, 'wght' 600;
}
```

### Optimal Font Loading Strategy

```html
<head>
  <!-- 1. Preconnect to font origin -->
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  
  <!-- 2. Preload the most critical font file -->
  <link rel="preload" href="/fonts/inter-var-latin.woff2"
        as="font" type="font/woff2" crossorigin>
  
  <!-- 3. Inline font-face declaration (avoid extra CSS file) -->
  <style>
    @font-face {
      font-family: 'Inter';
      src: url('/fonts/inter-var-latin.woff2') format('woff2');
      font-weight: 100 900;
      font-display: optional;
      unicode-range: U+0000-00FF;
    }
    
    /* Fallback font metrics matching */
    @font-face {
      font-family: 'Inter Fallback';
      src: local('Arial');
      size-adjust: 107%;
      ascent-override: 90%;
      descent-override: 22%;
      line-gap-override: 0%;
    }
    
    body {
      font-family: 'Inter', 'Inter Fallback', system-ui, sans-serif;
    }
  </style>
</head>
```

### Interview Tip
> "My font optimization stack: variable fonts for weight flexibility in one file (saves 50%+ vs multiple static files), unicode-range subsetting to only download needed character sets, `font-display: optional` for zero CLS, preloading the critical font file, and fallback font metric overrides (`size-adjust`, `ascent-override`) to match the custom font's dimensions so there's zero layout shift even with `font-display: swap`. For a typical app, this reduces font-related CLS to zero and font load time by 70%."

---

## Q9: Explain service workers and their role in caching strategies.

### What Service Workers Are

```
Service Worker = JavaScript proxy between your app and the network.
It intercepts every network request and can respond with cached data,
network data, or a combination.

Browser                   Service Worker              Network
  │                           │                          │
  │── fetch('/api/data') ──►  │                          │
  │                           │── Check cache ──►        │
  │                           │                          │
  │                           │  Cache hit?              │
  │                           │  YES → respond from cache│
  │                           │  NO  → fetch from network│
  │                           │        │                 │
  │                           │  ◄─────┘                 │
  │  ◄── response ────────── │                          │
  │                           │                          │
```

### Service Worker Lifecycle

```javascript
// sw.js — Service Worker file

const CACHE_NAME = 'app-v2';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/offline.html',
];

// ═══ INSTALL: Cache critical resources ═══
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())  // Activate immediately
  );
});

// ═══ ACTIVATE: Clean up old caches ═══
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())  // Take control immediately
  );
});

// ═══ FETCH: Intercept requests ═══
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // ... caching strategy here
  );
});
```

### Caching Strategies

```javascript
// ═══════════════════════════════════════════
// 1. CACHE FIRST (Cache Falling Back to Network)
// ═══════════════════════════════════════════
// Best for: Static assets (CSS, JS, fonts, images)
// "Use cached version if available, fetch from network only if not cached"

self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'style' ||
      event.request.destination === 'script' ||
      event.request.destination === 'font') {
    
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;  // Cache hit — instant!
        
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
  }
});


// ═══════════════════════════════════════════
// 2. NETWORK FIRST (Network Falling Back to Cache)
// ═══════════════════════════════════════════
// Best for: API calls, dynamic content, HTML pages
// "Always try network first for freshest data, fall back to cache if offline"

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          return caches.match(event.request);  // Offline fallback
        })
    );
  }
});


// ═══════════════════════════════════════════
// 3. STALE-WHILE-REVALIDATE
// ═══════════════════════════════════════════
// Best for: Content that updates periodically (blog posts, user profiles, feeds)
// "Respond with cache immediately, update cache in background for next time"

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(response => {
          cache.put(event.request, response.clone());
          return response;
        });
        
        return cached || fetchPromise;
        // If cached: respond INSTANTLY with cache, update in background
        // If not cached: wait for network
      });
    })
  );
});


// ═══════════════════════════════════════════
// 4. CACHE ONLY
// ═══════════════════════════════════════════
// Best for: Offline-only resources, precached assets
// "Only respond from cache, never go to network"

event.respondWith(caches.match(event.request));


// ═══════════════════════════════════════════
// 5. NETWORK ONLY
// ═══════════════════════════════════════════
// Best for: Non-GET requests, analytics, real-time data
// "Always go to network, never cache"

event.respondWith(fetch(event.request));
```

### Strategy Decision Matrix

```
Resource Type          Strategy                  Why
──────────────────────────────────────────────────────────────────
App shell (HTML)       Network First             Always fresh, offline fallback
CSS/JS (versioned)     Cache First               Immutable with hash in filename
Fonts                  Cache First               Rarely change, expensive to download
Images                 Cache First               Large, slow to re-download
API data (dynamic)     Network First             Need fresh data, cache for offline
API data (semi-static) Stale-While-Revalidate    Fast response + background refresh
User avatar/profile    Stale-While-Revalidate    Show cached, update in background
Analytics pings        Network Only              Must reach server, no cache needed
POST/PUT/DELETE        Network Only              Mutations should never be cached
Offline page           Cache Only                Pre-cached during install
```

### Workbox — Production Service Worker Library

```javascript
// Google's Workbox simplifies service worker caching

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Precache build assets (injected by build tool)
precacheAndRoute(self.__WB_MANIFEST);

// Cache images (Cache First, max 60, expire after 30 days)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Cache API responses (Stale While Revalidate)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 }),
    ],
  })
);

// Cache pages (Network First with offline fallback)
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [
      new ExpirationPlugin({ maxEntries: 25 }),
    ],
  })
);
```

### Interview Tip
> "I think of caching strategies by answering one question: what's worse for the user — seeing stale data, or waiting for the network? For static assets (JS, CSS, fonts), stale data is fine → Cache First. For API data, stale data might be wrong → Network First. For feeds and profiles, a brief stale view is acceptable → Stale-While-Revalidate. In production, I use Workbox because it handles the complexity (cache expiration, versioning, precaching manifests) that's easy to get wrong with raw service worker code."

---

## Q10: How would you set up a performance monitoring pipeline (RUM vs synthetic monitoring)?

### RUM vs Synthetic — Both Are Needed

```
SYNTHETIC MONITORING (Lab testing)
  "How does the site perform under controlled conditions?"
  
  ┌─────────────────────────────────────────────────────────┐
  │ ✅ Consistent, repeatable results                       │
  │ ✅ Catches regressions in CI/CD                         │
  │ ✅ Tests specific devices/networks you configure         │
  │ ❌ Doesn't reflect real user conditions                  │
  │ ❌ Limited geographic coverage                           │
  │ ❌ Can't capture real user interactions (INP)            │
  │                                                         │
  │ Tools: Lighthouse CI, WebPageTest, SpeedCurve            │
  │ When: Every PR, every deploy, scheduled (hourly/daily)   │
  └─────────────────────────────────────────────────────────┘

RUM (Real User Monitoring)
  "How does the site perform for actual users?"
  
  ┌─────────────────────────────────────────────────────────┐
  │ ✅ Real devices, real networks, real interactions        │
  │ ✅ Captures p75, p90, p99 distributions                 │
  │ ✅ Segments by geography, device, connection             │
  │ ✅ Captures INP (real interactions)                      │
  │ ❌ Noisy data (many variables)                           │
  │ ❌ Requires traffic to be meaningful                     │
  │ ❌ Privacy considerations                                │
  │                                                         │
  │ Tools: web-vitals, Vercel Analytics, Datadog RUM         │
  │ When: Always running in production                       │
  └─────────────────────────────────────────────────────────┘
```

### RUM Implementation

```javascript
// Performance monitoring client
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

class PerformanceMonitor {
  constructor(options = {}) {
    this.endpoint = options.endpoint || '/api/perf';
    this.sampleRate = options.sampleRate || 0.1;  // 10% of users
    this.buffer = [];
    this.flushInterval = 5000;
    
    if (Math.random() > this.sampleRate) return;  // Sample
    
    this.init();
  }
  
  init() {
    // Core Web Vitals
    onLCP(metric => this.collect(metric));
    onINP(metric => this.collect(metric));
    onCLS(metric => this.collect(metric));
    onFCP(metric => this.collect(metric));
    onTTFB(metric => this.collect(metric));
    
    // Custom metrics
    this.measureCustomMetrics();
    
    // Flush on page hide
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush();
    });
    
    // Periodic flush
    setInterval(() => this.flush(), this.flushInterval);
  }
  
  collect(metric) {
    this.buffer.push({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      
      // Context for debugging
      url: location.href,
      timestamp: Date.now(),
      connection: navigator.connection?.effectiveType,
      deviceMemory: navigator.deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      userAgent: navigator.userAgent,
      viewport: `${innerWidth}x${innerHeight}`,
      
      // Attribution (what caused the metric)
      attribution: metric.attribution ? {
        element: metric.attribution.element,
        url: metric.attribution.url,
        timeToFirstByte: metric.attribution.timeToFirstByte,
      } : undefined,
    });
  }
  
  measureCustomMetrics() {
    // Time to hero image visible
    const heroImg = document.querySelector('.hero-image');
    if (heroImg) {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.element === heroImg) {
            this.collect({ name: 'hero-image-load', value: entry.startTime, rating: 'custom' });
          }
        });
      }).observe({ type: 'element', buffered: true });
    }
    
    // Long tasks
    new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.duration > 100) {
          this.collect({
            name: 'long-task',
            value: entry.duration,
            rating: entry.duration > 200 ? 'poor' : 'needs-improvement',
          });
        }
      });
    }).observe({ type: 'longtask', buffered: true });
  }
  
  flush() {
    if (this.buffer.length === 0) return;
    
    const payload = JSON.stringify(this.buffer);
    this.buffer = [];
    
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.endpoint, payload);
    } else {
      fetch(this.endpoint, {
        method: 'POST',
        body: payload,
        keepalive: true,
      });
    }
  }
}

// Initialize
new PerformanceMonitor({ sampleRate: 0.1 });
```

### Alerting Pipeline

```
RUM Data → Time-series DB → Dashboards → Alerts

Dashboard views:
  1. P75 Core Web Vitals over time (weekly trend)
  2. Vitals by page/route
  3. Vitals by device type (mobile vs desktop)
  4. Vitals by geography
  5. Vitals by connection type (4G vs 3G)
  6. Regression detection (deploy markers)

Alerts:
  ⚠️ P75 LCP > 2.5s for 15 minutes → Slack #perf-alerts
  🔴 P75 LCP > 4.0s for 5 minutes → PagerDuty
  ⚠️ P75 INP > 200ms for 15 minutes → Slack
  ⚠️ Bundle size exceeds budget → Block deploy
  🔴 Error rate > 1% → PagerDuty
```

### Interview Tip
> "A production performance monitoring pipeline needs both synthetic and RUM. Synthetic catches regressions before they ship (Lighthouse CI in PRs). RUM catches regressions that only appear in production — slow API on specific regions, heavy ads on certain pages, third-party script regression. I sample RUM at 10% to reduce overhead and cost, store in a time-series database, and alert at the P75 level (matching Google's CWV threshold). The most important piece: deploy markers on dashboards so you can instantly correlate performance changes with specific releases."

---

## Q11: What causes JavaScript bundle bloat and how do you systematically reduce it?

### Common Causes of Bundle Bloat

```
1. KITCHEN-SINK IMPORTS
   import _ from 'lodash';           // 72KB instead of 4KB
   import moment from 'moment';       // 67KB (with locales: 300KB+)
   import * as Icons from 'lucide-react';  // All 1000+ icons

2. DUPLICATE DEPENDENCIES
   react@18.2.0 (in your app)
   react@17.0.2 (in a dependency)
   → Two copies of React in bundle

3. UNOPTIMIZED POLYFILLS
   core-js imported fully → 150KB
   Babel preset-env targeting old browsers → extra transforms

4. BARREL FILES (index.ts re-exports)
   import { Button } from '@ui/components';
   // May pull in DataTable, Chart, etc. due to barrel file

5. UNNECESSARY DEPENDENCIES
   is-odd, is-even, left-pad type packages
   Date libraries when Intl.DateTimeFormat suffices
   Full CSS frameworks when you use 5% of classes

6. CSS-IN-JS RUNTIME
   styled-components/emotion runtime: ~12KB
   Alternative: Tailwind (zero runtime), CSS Modules

7. SOURCE MAPS IN PRODUCTION
   Accidentally including .map files doubles bundle size

8. DEVELOPMENT-ONLY CODE
   console.log, debug tools, dev warnings not stripped
```

### Systematic Reduction Process

```bash
# Step 1: ANALYZE — see what's in the bundle
npx webpack-bundle-analyzer stats.json
# Or for Vite:
npx vite-bundle-visualizer
# Or for any bundler:
npx source-map-explorer dist/main.js

# Step 2: FIND DUPLICATES
npx duplicate-package-checker-webpack-plugin
# Or manually check:
npm ls react  # See if multiple versions exist

# Step 3: FIND UNUSED DEPENDENCIES
npx depcheck
# Lists: unused dependencies, missing dependencies, phantom dependencies

# Step 4: FIND UNUSED EXPORTS (dead code)
npx knip
# Finds unused files, exports, dependencies in your project
```

```javascript
// Step 5: REPLACE HEAVY LIBRARIES

// ❌ moment.js (300KB) → ✅ date-fns (tree-shakeable, ~3KB per function)
// ❌ moment.js (300KB) → ✅ dayjs (2KB, same API)
// ❌ lodash (72KB) → ✅ lodash-es (tree-shakeable) or native methods
// ❌ axios (13KB) → ✅ native fetch (0KB) + tiny wrapper
// ❌ uuid (4KB) → ✅ crypto.randomUUID() (0KB, native)
// ❌ classnames (1KB) → ✅ clsx (228B) or template literals
// ❌ numeral.js (25KB) → ✅ Intl.NumberFormat (0KB, native)

// Step 6: OPTIMIZE IMPORTS
// ❌
import { format, parse, addDays, subDays, isAfter, isBefore } from 'date-fns';
// ✅ (if tree-shaking is broken)
import format from 'date-fns/format';
import addDays from 'date-fns/addDays';

// Step 7: DYNAMIC IMPORT HEAVY FEATURES
// ❌ Always loaded
import { Chart } from 'chart.js';

// ✅ Loaded on demand
async function showChart(data) {
  const { Chart } = await import('chart.js');
  new Chart(canvas, { data });
}
```

```javascript
// Step 8: MODERN TARGET — reduce polyfills

// next.config.js or vite.config.js
// Target modern browsers → fewer polyfills

// browserslist in package.json
{
  "browserslist": [
    "last 2 Chrome versions",
    "last 2 Firefox versions",
    "last 2 Safari versions",
    "last 2 Edge versions"
    // NOT "IE 11" — adds 50KB+ of polyfills
  ]
}

// Or use module/nomodule pattern
// <script type="module"> → modern browsers (no polyfills needed)
// <script nomodule>      → legacy browsers (full polyfills)
```

### Interview Tip
> "My bundle reduction workflow is: visualize (bundle analyzer), identify (duplicates, unused deps, heavy imports), replace (native APIs, lighter alternatives), split (lazy load heavy features), and verify (size limit in CI). The biggest wins I've gotten: replacing moment with dayjs (saved 280KB), switching from full lodash to native methods (saved 65KB), and fixing barrel file imports that were pulling in unused components (saved 150KB). I maintain a `bundlesize` config in CI that fails the build if any chunk exceeds the budget."

---

## Q12: How do you profile and fix rendering jank using Chrome DevTools' Performance tab?

### What is Jank

```
Jank = visible stuttering during scrolling, animations, or interactions.

Smooth: 60fps = 16.67ms per frame
Janky: Dropped frames when a frame takes >16.67ms

Timeline of a smooth frame:
  ┌──────────────────────────────────────────┐
  │ 16.67ms                                  │
  │ [JS] [Style] [Layout] [Paint] [Compose]  │
  │  5ms   1ms    2ms      3ms     1ms = 12ms ✅ │
  └──────────────────────────────────────────┘

Timeline of a janky frame:
  ┌──────────────────────────────────────────────────┐
  │ 16.67ms                    ← deadline exceeded   │
  │ [=======JS 45ms=======] [Style] [Layout] [Paint] │
  │                                        = 55ms ❌  │
  │                          3 frames dropped         │
  └──────────────────────────────────────────────────┘
```

### Step-by-Step Profiling Process

```
1. OPEN DevTools → Performance tab

2. CONFIGURE:
   ☑ Screenshots (see visual changes)
   ☑ CPU: 4x slowdown (simulates mid-range mobile)
   ☑ Network: Fast 3G (simulates real conditions)

3. RECORD:
   Click Record → Perform the janky action → Stop
   (scroll, animate, type, click — whatever is janky)

4. ANALYZE the flame chart:

   ┌─────────────────────────────────────────────────────┐
   │ Frames:  ▓▓░▓▓▓░░▓▓▓▓░▓▓                          │
   │          ↑ dropped frames (red = janky)              │
   │                                                     │
   │ Main:    ═══════════════════════════                 │
   │          [Task]  [Task]  [Loooong Task]  [Task]     │
   │                          ↑ This one! >50ms          │
   │                                                     │
   │ Expand the long task:                               │
   │  ├── Event: scroll                                  │
   │  ├── Function Call: handleScroll                    │
   │  │   ├── getBoundingClientRect  (forced layout)     │
   │  │   ├── style.height = ...     (invalidate layout) │
   │  │   ├── getBoundingClientRect  (forced layout!)    │
   │  │   └── style.width = ...      (invalidate again!) │
   │  └── Layout (forced)                                │
   └─────────────────────────────────────────────────────┘

5. IDENTIFY the pattern:
   - Yellow blocks = JavaScript execution
   - Purple blocks = Layout/Reflow
   - Green blocks = Paint
   - Red corners on frames = dropped frames
   
   Look for:
   a) Long yellow blocks (>50ms) = heavy JS computation
   b) Many purple blocks = layout thrashing
   c) Large green blocks = expensive paints
   d) Forced reflow markers (purple with warning icon)
```

### Common Jank Patterns and Fixes

```javascript
// ═══ PATTERN 1: LAYOUT THRASHING ═══
// Symptom: Many purple "Layout" blocks interleaved with yellow

// ❌ Read-write-read-write cycle
function updatePositions(elements) {
  elements.forEach(el => {
    const top = el.offsetTop;           // READ (forces layout)
    el.style.top = (top + 10) + 'px';  // WRITE (invalidates layout)
    // Next iteration: READ forces layout AGAIN
  });
}

// ✅ Batch reads, then batch writes
function updatePositions(elements) {
  const tops = elements.map(el => el.offsetTop);  // ALL reads
  
  requestAnimationFrame(() => {
    elements.forEach((el, i) => {
      el.style.transform = `translateY(${tops[i] + 10}px)`;  // ALL writes
    });
  });
}


// ═══ PATTERN 2: LONG JS EXECUTION ═══
// Symptom: Single yellow block >50ms

// ❌ Blocks main thread for 200ms
function renderLargeList(items) {
  const html = items.map(item => `<div>${item.name}</div>`).join('');
  container.innerHTML = html;
}

// ✅ Chunk the work
async function renderLargeList(items) {
  const CHUNK = 100;
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    const fragment = document.createDocumentFragment();
    chunk.forEach(item => {
      const div = document.createElement('div');
      div.textContent = item.name;
      fragment.appendChild(div);
    });
    container.appendChild(fragment);
    
    // Yield to browser between chunks
    await new Promise(r => requestAnimationFrame(r));
  }
}


// ═══ PATTERN 3: EXPENSIVE ANIMATIONS ═══
// Symptom: Paint (green) blocks during animation

// ❌ Animating layout properties
.box {
  transition: width 0.3s, height 0.3s, top 0.3s, left 0.3s;
  /* Every frame: Layout → Paint → Composite */
}

// ✅ Animating compositor properties
.box {
  transition: transform 0.3s, opacity 0.3s;
  will-change: transform;
  /* Every frame: Composite only (GPU) */
}


// ═══ PATTERN 4: SCROLL HANDLER JANK ═══
// Symptom: Dropped frames during scroll

// ❌ Heavy work in scroll handler
window.addEventListener('scroll', () => {
  // Runs 60+ times per second
  updateParallax();
  checkInfiniteScroll();
  updateStickyHeader();
  trackScrollDepth();
});

// ✅ Passive listener + rAF throttle
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateParallax();
      checkInfiniteScroll();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });  // passive tells browser: "I won't call preventDefault"
// Browser can scroll immediately without waiting for handler
```

### DevTools Performance Panel Key Areas

```
Summary Tab (after recording):
  ┌────────────────────────────────┐
  │ Loading:    150ms  (blue)      │
  │ Scripting:  890ms  (yellow)    │ ← JS is the bottleneck
  │ Rendering:  210ms  (purple)    │
  │ Painting:    80ms  (green)     │
  │ Idle:       670ms  (gray)      │
  └────────────────────────────────┘

Bottom-Up Tab:
  Shows which functions took the most total time
  Sort by "Self Time" to find the actual slow code
  (not just functions that call slow code)

Call Tree Tab:
  Shows the hierarchy: which function called which
  Find the root cause of slow execution chains

Event Log Tab:
  Chronological list of events
  Filter to "Layout Shift" to find CLS sources
  Filter to "Long Task" to find >50ms JS blocks
```

### Performance Profiling Checklist

```
Before profiling:
  ☐ Use Incognito mode (no extensions)
  ☐ Enable CPU 4x slowdown
  ☐ Close other tabs
  ☐ Use production build (not dev mode)
  ☐ Clear cache

During profiling:
  ☐ Record only the janky interaction (keep recordings short)
  ☐ Perform the action 3-4 times for consistent data

Analysis:
  ☐ Check Frames row for dropped frames (red markers)
  ☐ Find Long Tasks (>50ms yellow blocks)
  ☐ Check for forced reflow (purple blocks with warnings)
  ☐ Check paint areas (green — are they unexpectedly large?)
  ☐ Use Bottom-Up → sort by Self Time for hotspots
  ☐ Check for layout thrashing patterns (read-write interleaving)

Fix verification:
  ☐ Profile again after fix — same conditions
  ☐ Compare frame rates (Frames row)
  ☐ Verify Long Tasks are gone or reduced
  ☐ Test on real mobile device (not just throttled desktop)
```

### Interview Tip
> "My jank debugging workflow is always: record → identify dropped frames → find the long task → expand the call tree → fix the root cause → verify with another recording. The three most common causes I've fixed in production: layout thrashing from read-write interleaving in scroll handlers (fix: batch reads then writes), expensive CSS properties being animated (fix: switch to transform/opacity), and large DOM manipulations blocking the main thread (fix: use DocumentFragment + requestAnimationFrame chunking). The key DevTools tip: sort by 'Self Time' in Bottom-Up view to find the actual slow function, not just the function that happens to be the caller."

---

## Quick Reference Cheat Sheet

| # | Topic | Key One-Liner |
|---|---|---|
| 1 | Core Web Vitals | LCP = loading, INP = responsiveness, CLS = stability; measure with field data at P75 |
| 2 | Performance Budgets | Automate in CI — budgets only work if they block merges |
| 3 | 8s TTI Diagnosis | Systematic: TTFB → download → parse → execute → fetch → render → find the bottleneck |
| 4 | Tree Shaking | ES modules + sideEffects: false + named exports = dead code eliminated |
| 5 | Code Splitting | Route-level (biggest impact) → component-level (heavy widgets) → library-level (on-demand) |
| 6 | Lazy Loading | Never lazy-load LCP/above-fold content; everything below-fold should be lazy |
| 7 | Resource Hints | preconnect = handshake, preload = NOW, prefetch = LATER, modulepreload = preload + compile |
| 8 | Font Optimization | Variable font + subset + font-display: optional + metric overrides = zero CLS |
| 9 | Service Workers | Cache First for static, Network First for dynamic, Stale-While-Revalidate for semi-static |
| 10 | Perf Monitoring | Synthetic catches regressions pre-deploy; RUM captures real-user conditions post-deploy |
| 11 | Bundle Bloat | Visualize → identify heavy/duplicate deps → replace with lighter alternatives → CI budgets |
| 12 | Rendering Jank | Profile → find long tasks → fix layout thrashing / heavy JS / wrong animation properties → verify |

---

> **Team Lead Tip:** Performance is a team discipline, not a one-time audit. I establish three practices: performance budgets in CI (prevent regressions), RUM dashboards with alerts (catch production issues), and quarterly performance reviews (systematic optimization). The goal is a culture where every developer thinks about performance as naturally as they think about correctness.
