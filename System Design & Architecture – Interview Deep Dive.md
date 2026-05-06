# System Design & Architecture – Interview Deep Dive

> **Level:** Team Lead / Senior Full Stack Developer (9+ years)
> **Format:** Requirements → Architecture Diagram → Technical Decisions → Code/Config → Trade-offs → Interview Tip

---

## Q1: Design Apple.com's product page for millions of hits during a product launch

### Requirements Gathering

```
Functional:
  - Hero section with product imagery (high-res, interactive 3D)
  - Specs, features, pricing, comparison tables
  - "Buy" CTA with configuration (color, storage, etc.)
  - Smooth scroll-driven animations (Apple signature)
  - Live event integration (keynote embed)
  - Localisation (40+ languages/regions)

Non-Functional:
  - Handle 50M+ concurrent users during launch
  - LCP < 1.5s (Apple's standard)
  - Zero downtime during peak
  - Works on slow connections (India, SEA markets)
  - SEO-critical (product pages must rank)
```

### High-Level Architecture

```
                         ┌─────────────────┐
                         │   Global CDN     │
                         │ (Cloudflare/     │
                         │  Akamai/Fastly)  │
                         └────────┬────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
        ┌─────▼─────┐     ┌─────▼─────┐     ┌──────▼─────┐
        │ Edge Node  │     │ Edge Node  │     │ Edge Node   │
        │ (US-West)  │     │ (EU-West)  │     │ (APAC)      │
        │            │     │            │     │             │
        │ Static HTML│     │ Static HTML│     │ Static HTML │
        │ ISR Pages  │     │ ISR Pages  │     │ ISR Pages   │
        │ Image CDN  │     │ Image CDN  │     │ Image CDN   │
        └─────┬──────┘     └─────┬──────┘     └──────┬──────┘
              │                   │                    │
              └───────────────────┼────────────────────┘
                                  │
                         ┌────────▼────────┐
                         │   Origin        │
                         │   (ISR/SSG      │
                         │    Next.js)     │
                         │                 │
                         │ ┌─────────────┐ │
                         │ │ Product API  │ │
                         │ │ Pricing API  │ │
                         │ │ Inventory API│ │
                         │ └─────────────┘ │
                         └─────────────────┘
```

### Rendering Strategy

```jsx
// Static Generation + Incremental Static Regeneration
// The page is pre-built at deploy time, then revalidated

// app/[locale]/[product]/page.tsx (Next.js App Router)
export async function generateStaticParams() {
  const products = await getProducts();
  const locales = ['en-us', 'en-gb', 'ja', 'zh-cn', 'de', 'fr'];
  
  return products.flatMap(product =>
    locales.map(locale => ({
      locale,
      product: product.slug,
    }))
  );
  // Pre-generates: /en-us/iphone-16-pro, /ja/iphone-16-pro, etc.
}

export const revalidate = 60; // ISR — regenerate every 60 seconds
// During launch: can reduce to 10s or use on-demand revalidation

async function ProductPage({ params }) {
  const { locale, product } = params;
  
  // Fetched at build time + ISR — NOT at request time
  const productData = await getProduct(product, locale);
  const pricing = await getPricing(product, locale);
  
  return (
    <>
      {/* Critical above-fold content — SSG'd, cached at edge */}
      <HeroSection product={productData} />
      <PricingSummary pricing={pricing} />
      
      {/* Below-fold — lazy loaded */}
      <Suspense fallback={<FeaturesSkeleton />}>
        <FeaturesSection product={productData} />
      </Suspense>
      
      <Suspense fallback={<ComparisonSkeleton />}>
        <ComparisonTable product={productData} />
      </Suspense>
      
      {/* Interactive — Client Component */}
      <Suspense fallback={<ConfiguratorSkeleton />}>
        <ProductConfigurator productId={productData.id} />
      </Suspense>
    </>
  );
}
```

### Handling Launch Day Traffic (50M+ Users)

```
Strategy: Serve 99.9% of requests from CDN edge — never hit origin.

Layer 1: CDN Edge Cache
  ├── Static HTML pages cached at 300+ edge locations
  ├── stale-while-revalidate: serve stale for 60s while fetching fresh
  ├── Cache-Control: public, s-maxage=60, stale-while-revalidate=300
  └── Images/videos on separate image CDN (Cloudinary/imgix)

Layer 2: On-Demand ISR
  ├── When product details change (price, availability)
  ├── API call: POST /api/revalidate?tag=iphone-16-pro
  ├── Only origin rebuilds the page → pushes to CDN
  └── Users see update within 60 seconds

Layer 3: Client-Side for Real-Time Data
  ├── Inventory/availability → client-side fetch (SWR/React Query)
  ├── Pricing by region → ISR (changes infrequently)
  └── Live event status → WebSocket or SSE

Layer 4: Graceful Degradation
  ├── If APIs are slow → show cached data + "prices may vary"
  ├── If origin is down → CDN serves stale pages indefinitely
  ├── Feature flags to disable non-essential features under load
  └── Queue system for "Buy" to prevent inventory oversell
```

### Scroll-Driven Animations (Apple's Signature)

```javascript
// Modern approach: CSS Scroll-driven Animations API + GSAP fallback

// Using CSS scroll-timeline (Chrome 115+)
// CSS:
// .hero-image {
//   animation: parallax linear;
//   animation-timeline: scroll();
//   animation-range: 0vh 100vh;
// }
// @keyframes parallax {
//   from { transform: scale(1.2) translateY(-10%); }
//   to { transform: scale(1) translateY(0); }
// }

// Fallback: IntersectionObserver + transform
function useScrollProgress(ref) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const handleScroll = () => {
            const rect = el.getBoundingClientRect();
            const progress = 1 - (rect.top / window.innerHeight);
            setProgress(Math.max(0, Math.min(1, progress)));
          };
          window.addEventListener('scroll', handleScroll, { passive: true });
          return () => window.removeEventListener('scroll', handleScroll);
        }
      },
      { threshold: 0 }
    );
    
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  
  return progress;
}

// Usage
function HeroSection({ product }) {
  const ref = useRef(null);
  const progress = useScrollProgress(ref);
  
  return (
    <section ref={ref}>
      <h1 style={{
        transform: `translateY(${progress * -50}px)`,
        opacity: 1 - progress * 0.5,
      }}>
        {product.name}
      </h1>
      <img
        src={product.heroImage}
        style={{ transform: `scale(${1 + progress * 0.2})` }}
        fetchpriority="high"
      />
    </section>
  );
}
```

### Image Strategy

```html
<!-- Hero image: AVIF with WebP and JPEG fallback -->
<picture>
  <source srcset="hero-640.avif 640w, hero-1280.avif 1280w, hero-2560.avif 2560w"
          type="image/avif" sizes="100vw">
  <source srcset="hero-640.webp 640w, hero-1280.webp 1280w, hero-2560.webp 2560w"
          type="image/webp" sizes="100vw">
  <img src="hero-1280.jpg" alt="iPhone 16 Pro"
       width="2560" height="1440"
       fetchpriority="high" decoding="async">
</picture>

<!-- Below-fold images: lazy loaded with blur placeholder -->
<!-- Using Next.js Image component with blur placeholder -->
<!-- Or native loading="lazy" with IntersectionObserver -->
```

### Interview Tip
> "The key insight for Apple-scale product pages is that the page should be static-first. Pre-render at build time, cache at CDN edges worldwide, and only use client-side fetching for truly dynamic data (inventory, cart). During a launch, 99.9% of requests should never reach the origin server. The scroll-driven animations use transform/opacity only (compositor-only properties) so they don't cause layout or paint — just GPU compositing. For images, AVIF saves 50% over WebP and 80% over JPEG, with progressive fallbacks via the `<picture>` element."

---

## Q2: Design a real-time collaborative text editor (like Pages for iCloud)

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    Collaborative Editor Architecture              │
│                                                                  │
│  User A (Browser)           Server              User B (Browser) │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Editor UI    │    │ Collaboration│    │ Editor UI    │       │
│  │ (ProseMirror/│◄──►│ Server       │◄──►│ (ProseMirror/│       │
│  │  TipTap)     │ WS │              │ WS │  TipTap)     │       │
│  │              │    │ ┌──────────┐ │    │              │       │
│  │ Local State  │    │ │ CRDT /   │ │    │ Local State  │       │
│  │ (CRDT doc)   │    │ │ Y.js Doc │ │    │ (CRDT doc)   │       │
│  │              │    │ └──────────┘ │    │              │       │
│  └──────────────┘    │              │    └──────────────┘       │
│                      │ ┌──────────┐ │                           │
│                      │ │ Presence │ │                           │
│                      │ │ (cursors)│ │                           │
│                      │ └──────────┘ │                           │
│                      │              │                           │
│                      │ ┌──────────┐ │                           │
│                      │ │ Storage  │ │                           │
│                      │ │ (DB)     │ │                           │
│                      │ └──────────┘ │                           │
│                      └──────────────┘                           │
└──────────────────────────────────────────────────────────────────┘
```

### Conflict Resolution: OT vs CRDT

```
Two approaches to handling concurrent edits:

OT (Operational Transformation):
  Used by: Google Docs
  How: Transform operations against each other
  Requires: Central server to order operations
  Pros: Proven at scale, smaller payloads
  Cons: Complex server logic, single point of ordering

CRDT (Conflict-free Replicated Data Type):
  Used by: Figma, Apple Notes, many modern editors
  How: Data structure that merges automatically without conflicts
  Requires: No central server (peer-to-peer possible)
  Pros: Works offline, simpler conflict resolution, peer-to-peer capable
  Cons: Larger memory footprint, eventual consistency

RECOMMENDATION: CRDT (Y.js) for new projects
  - Simpler to implement
  - Built-in offline support
  - Growing ecosystem (Y.js, Automerge)
```

### Frontend Implementation with Y.js + TipTap

```typescript
// Editor setup with Y.js CRDT + TipTap (ProseMirror wrapper)
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

function CollaborativeEditor({ documentId, user }) {
  const ydoc = useMemo(() => new Y.Doc(), []);
  
  // WebSocket connection to collaboration server
  const provider = useMemo(() => {
    return new WebsocketProvider(
      'wss://collab.example.com',
      documentId,  // Room name = document ID
      ydoc,
      { 
        connect: true,
        params: { token: user.token },
      }
    );
  }, [documentId, ydoc]);
  
  // Connection status
  const [status, setStatus] = useState('connecting');
  
  useEffect(() => {
    provider.on('status', (event) => setStatus(event.status));
    
    return () => {
      provider.disconnect();
      ydoc.destroy();
    };
  }, [provider, ydoc]);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }), // Disable default history
      Collaboration.configure({
        document: ydoc,
        // Y.js handles undo/redo across collaborators
      }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: user.name,
          color: user.color,  // Cursor color
        },
      }),
    ],
  });
  
  return (
    <div>
      <ConnectionStatus status={status} />
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <ActiveUsers provider={provider} />
    </div>
  );
}

// Active users display
function ActiveUsers({ provider }) {
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    const awareness = provider.awareness;
    
    const updateUsers = () => {
      const states = Array.from(awareness.getStates().values());
      setUsers(states.filter(s => s.user).map(s => s.user));
    };
    
    awareness.on('change', updateUsers);
    return () => awareness.off('change', updateUsers);
  }, [provider]);
  
  return (
    <div className="active-users">
      {users.map(u => (
        <div key={u.name} style={{ borderColor: u.color }}>
          {u.name}
        </div>
      ))}
    </div>
  );
}
```

### Offline Support with CRDT

```typescript
// Y.js naturally supports offline editing

// 1. Persist document to IndexedDB
import { IndexeddbPersistence } from 'y-indexeddb';

function useOfflineEditor(documentId) {
  const ydoc = useMemo(() => new Y.Doc(), []);
  
  // Local persistence — works offline
  const localProvider = useMemo(() => {
    return new IndexeddbPersistence(documentId, ydoc);
  }, [documentId, ydoc]);
  
  // Remote sync — syncs when online
  const remoteProvider = useMemo(() => {
    return new WebsocketProvider('wss://collab.example.com', documentId, ydoc);
  }, [documentId, ydoc]);
  
  // When user goes offline:
  //   - Edits are saved to IndexedDB
  //   - WebSocket disconnects
  //
  // When user comes back online:
  //   - WebSocket reconnects
  //   - Y.js automatically syncs local changes with server
  //   - CRDT guarantees no conflicts — all edits merge automatically
  //   - No "conflict resolution" dialog needed
  
  return { ydoc, isOnline: remoteProvider.wsconnected };
}
```

### Server Architecture

```javascript
// Collaboration server (Node.js)
import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';

const wss = new WebSocketServer({ port: 1234 });

wss.on('connection', (ws, req) => {
  // Authenticate
  const token = new URL(req.url, 'http://localhost').searchParams.get('token');
  if (!authenticateToken(token)) {
    ws.close(4001, 'Unauthorized');
    return;
  }
  
  // Y.js handles sync, awareness, and document persistence
  setupWSConnection(ws, req, {
    // Persist to database every 30 seconds
    persistence: {
      provider: leveldbPersistence,
      bindState: async (docName, ydoc) => {
        const persistedYdoc = await leveldbPersistence.getYDoc(docName);
        const update = Y.encodeStateAsUpdate(persistedYdoc);
        Y.applyUpdate(ydoc, update);
        
        ydoc.on('update', (update) => {
          leveldbPersistence.storeUpdate(docName, update);
        });
      },
    },
  });
});

// Scale horizontally with Redis pub/sub
// Each server instance shares updates via Redis
// Users on different servers collaborate seamlessly
```

### Interview Tip
> "For a collaborative editor, the key architectural decision is CRDT vs OT. I'd choose Y.js (CRDT) because it handles offline editing natively — edits made offline merge automatically when reconnecting, without conflicts. The stack is TipTap (rich text UI) + Y.js (CRDT document model) + WebSocket (real-time sync) + IndexedDB (offline persistence). For scaling, each collaboration server instance is stateless — document state is synced via Redis pub/sub, so users on different server instances can collaborate on the same document."

---

## Q3: Design a component library that serves 20+ product teams

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    Design System Architecture                 │
│                                                              │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────────┐ │
│  │ Design   │────►│ Component    │────►│ Product Apps     │ │
│  │ Tokens   │     │ Library      │     │ (consumers)      │ │
│  │          │     │              │     │                  │ │
│  │ Figma    │     │ @org/ui-core │     │ App A: @org/ui@3 │ │
│  │ Tokens   │     │ @org/ui-data │     │ App B: @org/ui@3 │ │
│  │ Studio   │     │ @org/ui-form │     │ App C: @org/ui@2 │ │
│  └──────────┘     │ @org/ui-icons│     │ (migration)      │ │
│       │           └──────────────┘     └──────────────────┘ │
│       │                  │                      │           │
│       ▼                  ▼                      ▼           │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────────┐ │
│  │ Token    │     │ Storybook    │     │ Adoption         │ │
│  │ Pipeline │     │ Documentation│     │ Dashboard        │ │
│  │ (CI/CD)  │     │ (live docs)  │     │ (metrics)        │ │
│  └──────────┘     └──────────────┘     └──────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Package Structure (Monorepo)

```
design-system/
├── packages/
│   ├── tokens/                    # Design tokens (source of truth)
│   │   ├── src/
│   │   │   ├── colors.json        # Primitive colors
│   │   │   ├── spacing.json       # Spacing scale
│   │   │   ├── typography.json    # Font stacks, sizes
│   │   │   └── themes/
│   │   │       ├── light.json
│   │   │       └── dark.json
│   │   ├── build.js               # Style Dictionary transform
│   │   └── dist/
│   │       ├── css/variables.css  # CSS custom properties
│   │       ├── js/tokens.ts       # TypeScript constants
│   │       ├── scss/_variables.scss
│   │       └── ios/Colors.swift   # Cross-platform tokens
│   │
│   ├── ui-core/                   # Core components (Button, Card, etc.)
│   │   ├── src/
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   ├── Button.stories.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Card/
│   │   │   └── index.ts           # Public API (barrel)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui-forms/                  # Form components
│   ├── ui-data/                   # Data display (Table, Chart)
│   ├── ui-icons/                  # Icon library
│   └── ui-hooks/                  # Shared hooks
│
├── apps/
│   ├── docs/                      # Storybook documentation site
│   └── playground/                # Interactive playground
│
├── tools/
│   ├── eslint-plugin/             # ESLint rules for component usage
│   └── codemod/                   # Automated migration scripts
│
├── turbo.json                     # Turborepo config
├── package.json
└── changeset.json                 # Versioning with changesets
```

### Component API Design

```tsx
// Design principles for component APIs:
// 1. Composition over configuration
// 2. Sensible defaults, powerful overrides
// 3. Accessible by default
// 4. Type-safe with discriminated unions

// ═══════ Button — Polymorphic + Variant-based ═══════
interface ButtonBaseProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Polymorphic: renders as <button>, <a>, or custom component
type ButtonProps<E extends React.ElementType = 'button'> = ButtonBaseProps &
  Omit<React.ComponentPropsWithoutRef<E>, keyof ButtonBaseProps> & {
    as?: E;
  };

function Button<E extends React.ElementType = 'button'>({
  as,
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  ...rest
}: ButtonProps<E>) {
  const Component = as || 'button';
  
  return (
    <Component
      className={cn(
        styles.button,
        styles[variant],
        styles[size],
        loading && styles.loading,
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </Component>
  );
}

// Usage:
<Button variant="primary" size="lg">Click me</Button>
<Button as="a" href="/next" variant="secondary">Link</Button>
<Button as={NextLink} href="/page">Router Link</Button>
```

### Versioning Strategy with Changesets

```bash
# Using @changesets/cli for semantic versioning

# Developer workflow:
# 1. Make changes to components
# 2. Run: npx changeset
# 3. Select packages changed + semver bump
# 4. Write changelog entry
# 5. PR is merged → CI creates a "Version Packages" PR
# 6. Merging that PR publishes to npm

# .changeset/brave-birds-dance.md (auto-generated)
---
"@org/ui-core": minor
"@org/tokens": patch
---

Added `loading` prop to Button component. Updated token values for spacing.
```

```json
// .changeset/config.json
{
  "changelog": "@changesets/changelog-github",
  "commit": false,
  "linked": [
    ["@org/ui-core", "@org/ui-forms", "@org/ui-data"]
  ],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch"
}
```

### Theming Architecture

```tsx
// Theme provider using CSS custom properties + React Context

// tokens package generates CSS:
// themes/light.css
// :root { --color-bg-primary: #ffffff; --color-text-primary: #1a1a2e; ... }

// themes/dark.css
// [data-theme="dark"] { --color-bg-primary: #0a0a0a; --color-text-primary: #f5f5f5; ... }

// Theme Provider
interface ThemeConfig {
  theme: 'light' | 'dark' | 'system';
  accentColor?: string;  // Brand customization
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  density?: 'compact' | 'comfortable' | 'spacious';
}

function ThemeProvider({ config, children }: { config: ThemeConfig; children: React.ReactNode }) {
  const resolvedTheme = useResolvedTheme(config.theme);
  
  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    
    if (config.accentColor) {
      document.documentElement.style.setProperty('--color-accent', config.accentColor);
    }
    if (config.borderRadius) {
      document.documentElement.dataset.radius = config.borderRadius;
    }
    if (config.density) {
      document.documentElement.dataset.density = config.density;
    }
  }, [resolvedTheme, config]);
  
  return <ThemeContext.Provider value={config}>{children}</ThemeContext.Provider>;
}

// Each product team customizes:
<ThemeProvider config={{
  theme: 'system',
  accentColor: '#FF6B35',  // Team's brand color
  borderRadius: 'lg',
  density: 'comfortable',
}}>
  <App />
</ThemeProvider>
```

### Adoption & Migration Strategy

```typescript
// Automated codemods for migration between major versions
// Using jscodeshift

// codemod: v2-to-v3-button.ts
// Migrates: <Button type="primary"> → <Button variant="primary">
export default function transformer(file, api) {
  const j = api.jscodeshift;
  
  return j(file.source)
    .findJSXElements('Button')
    .forEach(path => {
      // Rename prop: type → variant
      j(path)
        .find(j.JSXAttribute, { name: { name: 'type' } })
        .forEach(attr => {
          attr.node.name.name = 'variant';
        });
      
      // Rename prop: isLoading → loading
      j(path)
        .find(j.JSXAttribute, { name: { name: 'isLoading' } })
        .forEach(attr => {
          attr.node.name.name = 'loading';
        });
    })
    .toSource();
}

// Teams run: npx jscodeshift -t @org/codemods/v2-to-v3-button.ts src/
// Automatically migrates their codebase
```

### Adoption Dashboard

```
Track adoption across teams:

Metrics:
  ├── Package install count per team
  ├── Component usage frequency (via ESLint plugin)
  ├── Version distribution (how many teams on latest?)
  ├── Custom component ratio (vs design system components)
  ├── Accessibility audit scores
  └── Bundle size impact per team

ESLint Plugin (enforcement):
  @org/eslint-plugin-design-system
    ├── no-hardcoded-colors  → must use tokens
    ├── no-custom-button     → must use <Button> from library
    ├── prefer-design-tokens → flag raw pixel values
    └── deprecated-component → warn on v2 components
```

### Interview Tip
> "A component library serving 20+ teams needs three things: versioning discipline (semantic versioning with changesets so teams can upgrade safely), theming flexibility (CSS custom properties allow teams to customise without forking), and migration tooling (codemods that automatically update code for major versions). The biggest adoption killer I've seen is breaking changes without migration paths — so every breaking change ships with a codemod. I also set up an adoption dashboard to track which teams are on old versions and proactively help them upgrade."

---

## Q4: How would you architect a micro-frontend system for a large organisation?

### When Micro-Frontends Make Sense

```
✅ USE micro-frontends when:
  - 5+ teams independently deploying different parts of the UI
  - Teams use different frameworks (React + Vue + Angular)
  - Need independent deployment cycles (team A deploys without affecting team B)
  - Organisational boundaries align with UI boundaries
  - Legacy migration (incrementally replace old app)

❌ DON'T USE when:
  - Small team (<10 developers)
  - Single framework across the organisation
  - Tight coupling between UI sections
  - Early-stage product (premature complexity)
  - Performance is the top priority (overhead is unavoidable)
```

### Architecture Options

```
Option 1: Module Federation (Webpack 5 / Vite)
  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │ Shell App    │     │ Team A App  │     │ Team B App  │
  │ (Host)       │◄───►│ (Remote)    │◄───►│ (Remote)    │
  │              │     │             │     │             │
  │ Layout       │     │ Products    │     │ Checkout    │
  │ Nav/Auth     │     │ Search      │     │ Cart        │
  │ Routing      │     │ Catalog     │     │ Payment     │
  └─────────────┘     └─────────────┘     └─────────────┘
  
  Pros: Runtime integration, shared dependencies, TypeScript support
  Cons: Webpack-specific, versioning complexity, shared state challenges


Option 2: iframe-based (Legacy approach)
  Not recommended — poor UX, SEO, accessibility, and communication


Option 3: Web Components
  ┌─────────────────────────────────────────────┐
  │ Shell App                                    │
  │  <header-app></header-app>                  │
  │  <product-app product-id="123"></product-app>│
  │  <checkout-app></checkout-app>              │
  └─────────────────────────────────────────────┘
  
  Pros: Framework-agnostic, browser-native, encapsulated
  Cons: Limited React integration, styling challenges, SSR difficulty


Option 4: Route-based (Simplest)
  /products/*  → Team A's React app (deployed independently)
  /checkout/*  → Team B's React app (deployed independently)
  /admin/*     → Team C's Vue app (deployed independently)
  
  Shared: Header/footer served by shell or loaded as remote
  
  Pros: Simplest to implement, independent deployments, clean boundaries
  Cons: Full page reload between apps (or complex client-side routing)
```

### Module Federation Implementation

```javascript
// ═══ Shell App (Host) — webpack.config.js ═══
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        // Load remote apps at RUNTIME — no build-time coupling
        products: 'products@https://products.example.com/remoteEntry.js',
        checkout: 'checkout@https://checkout.example.com/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        '@org/design-system': { singleton: true },
      },
    }),
  ],
};

// Shell App routing
const ProductsApp = lazy(() => import('products/App'));
const CheckoutApp = lazy(() => import('checkout/App'));

function Shell() {
  return (
    <Layout>
      <ErrorBoundary fallback={<AppError />}>
        <Suspense fallback={<AppSkeleton />}>
          <Routes>
            <Route path="/products/*" element={<ProductsApp />} />
            <Route path="/checkout/*" element={<CheckoutApp />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}


// ═══ Products App (Remote) — webpack.config.js ═══
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'products',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App',           // Full app
        './ProductCard': './src/ProductCard', // Individual component
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        '@org/design-system': { singleton: true },
      },
    }),
  ],
};
```

### Cross-App Communication

```typescript
// Custom Event Bus (framework-agnostic)
class EventBus {
  private events = new Map<string, Set<Function>>();
  
  emit(event: string, data?: unknown) {
    this.events.get(event)?.forEach(handler => handler(data));
    // Also dispatch DOM event for cross-framework communication
    window.dispatchEvent(new CustomEvent(`mfe:${event}`, { detail: data }));
  }
  
  on(event: string, handler: Function) {
    if (!this.events.has(event)) this.events.set(event, new Set());
    this.events.get(event)!.add(handler);
    return () => this.events.get(event)!.delete(handler);
  }
}

// Shared instance via window
window.__MFE_EVENT_BUS__ = window.__MFE_EVENT_BUS__ || new EventBus();
const eventBus = window.__MFE_EVENT_BUS__;

// Team A: User adds to cart
eventBus.emit('cart:item-added', { productId: 123, quantity: 1 });

// Team B: Checkout listens
eventBus.on('cart:item-added', (item) => {
  updateCart(item);
});

// Shared state for auth/user (via shared store or Context bridge)
// Use a framework-agnostic store (like vanilla Zustand or nanostores)
```

### Pros and Cons

```
PROS:
  ✅ Independent deployments (Team A ships without waiting for Team B)
  ✅ Technology freedom (React, Vue, Svelte can coexist)
  ✅ Team autonomy (each team owns their domain end-to-end)
  ✅ Incremental migration (replace legacy app piece by piece)
  ✅ Fault isolation (one app crashing doesn't break others)
  ✅ Parallel development at scale (50+ developers, no merge conflicts)

CONS:
  ❌ Performance overhead (duplicate frameworks, multiple bundles)
  ❌ UX inconsistency risk (different teams, different patterns)
  ❌ Shared state complexity (no single state tree)
  ❌ Testing complexity (integration tests across boundaries)
  ❌ DevX overhead (local development requires running multiple apps)
  ❌ CSS conflicts (global styles can bleed across apps)
  ❌ SEO challenges (client-side composition hurts crawlability)
  ❌ Debugging difficulty (errors cross app boundaries)
```

### Interview Tip
> "Micro-frontends solve an ORGANISATIONAL problem, not a technical one. If you have 5+ teams that need to deploy independently and own their UI end-to-end, micro-frontends are justified. If you have one team or can coordinate releases, a monolith or monorepo with module boundaries is simpler and faster. My preferred approach is Module Federation for runtime composition with shared React and design system singletons. The critical constraint: every micro-frontend MUST use the shared design system — otherwise you get visual fragmentation. I also keep cross-app communication minimal (events only, no shared state) to maintain true independence."

---

## Q5: Design a media-heavy dashboard that loads in under 2 seconds on 3G

### The 3G Constraint

```
3G typical throughput: 400 Kbps (50 KB/s)
2-second budget: ~100KB total for first meaningful paint

Budget allocation:
  HTML:        5KB  (gzipped)
  Critical CSS: 5KB  (inlined)
  Critical JS:  40KB (gzipped, deferred)
  Hero content: 30KB (1 low-res image + text)
  Fonts:        20KB (1 variable font, subset)
  ─────────────────
  Total:        100KB — fits in 2s on 3G
  
Everything else: lazy loaded AFTER first paint
```

### Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    Media Dashboard Architecture                │
│                                                               │
│  Initial Load (< 100KB):                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ App Shell (SSR)                                         │  │
│  │  ├── Header + Navigation                                │  │
│  │  ├── Dashboard Grid (skeleton placeholders)             │  │
│  │  └── Critical metrics (text only — SSR'd from API)      │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  Progressive Load (after paint):                              │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Media Widgets (lazy, prioritized)                       │  │
│  │  ├── Priority 1: Visible widgets (IntersectionObserver) │  │
│  │  ├── Priority 2: Below-fold widgets (scroll-triggered)  │  │
│  │  └── Priority 3: 3D models (user-initiated only)        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  Media Pipeline:                                              │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Images: LQIP → Progressive AVIF → Full resolution       │  │
│  │ Videos: Poster → Low-res stream → Adaptive bitrate      │  │
│  │ 3D:     Static screenshot → Low-poly → Full model       │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### Progressive Image Loading

```tsx
// Three-tier image loading: blur-up pattern
function ProgressiveImage({ 
  src, 
  placeholder,  // 20-byte BlurHash or 800-byte LQIP
  alt, 
  width, 
  height 
}) {
  const [stage, setStage] = useState<'placeholder' | 'low' | 'full'>('placeholder');
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stage 1: Load low-res version (10KB)
          const lowRes = new Image();
          lowRes.src = src.replace('.avif', '-400.avif');
          lowRes.onload = () => {
            setCurrentSrc(lowRes.src);
            setStage('low');
            
            // Stage 2: Load full-res version
            const fullRes = new Image();
            fullRes.src = src;
            fullRes.onload = () => {
              setCurrentSrc(fullRes.src);
              setStage('full');
            };
          };
          
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [src]);
  
  return (
    <div ref={containerRef} style={{ width, height, position: 'relative' }}>
      <img
        src={currentSrc}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: stage === 'placeholder' ? 'blur(20px)' : 'none',
          transition: 'filter 0.3s ease',
        }}
      />
    </div>
  );
}
```

### Adaptive Video Streaming

```tsx
// Video widget with adaptive quality
function VideoWidget({ videoId, poster }) {
  const [quality, setQuality] = useState('auto');
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Detect connection quality
  useEffect(() => {
    const connection = navigator.connection;
    if (connection) {
      if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
        setQuality('poster-only');  // Don't load video at all
      } else if (connection.effectiveType === '3g') {
        setQuality('360p');
      } else {
        setQuality('auto');  // HLS adaptive
      }
      
      connection.addEventListener('change', () => {
        // React to network changes
      });
    }
  }, []);
  
  if (quality === 'poster-only') {
    return (
      <div>
        <img src={poster} alt="Video thumbnail" loading="lazy" />
        <button onClick={() => setQuality('360p')}>
          Play Video (uses data)
        </button>
      </div>
    );
  }
  
  return (
    <video
      ref={videoRef}
      poster={poster}
      preload="none"       // Don't preload video data
      controls
      playsInline
    >
      {quality === '360p' && (
        <source src={`/video/${videoId}/360p.mp4`} type="video/mp4" />
      )}
      {quality === 'auto' && (
        <source src={`/video/${videoId}/master.m3u8`} type="application/x-mpegURL" />
      )}
    </video>
  );
}
```

### 3D Model Lazy Loading

```tsx
// 3D model: only load on user interaction
function Model3DWidget({ modelUrl, previewImage }) {
  const [loaded, setLoaded] = useState(false);
  
  if (!loaded) {
    return (
      <div className="model-placeholder" onClick={() => setLoaded(true)}>
        <img src={previewImage} alt="3D model preview" loading="lazy" />
        <button>Load 3D Model</button>
        <p className="data-warning">~5MB download</p>
      </div>
    );
  }
  
  // Three.js and model only download when user clicks
  const ThreeViewer = lazy(() => import('./ThreeViewer'));
  
  return (
    <Suspense fallback={<ModelLoadingSkeleton />}>
      <ThreeViewer url={modelUrl} />
    </Suspense>
  );
}
```

### Interview Tip
> "The strategy for media-heavy dashboards on 3G is aggressive progressive loading. The initial paint budget is ~100KB — enough for the shell, text metrics, and skeleton placeholders. Images use a three-tier blur-up pattern (BlurHash → low-res → full-res). Videos detect connection speed via `navigator.connection` and show poster-only on slow connections. 3D models never auto-load — they require user interaction because they're 5MB+. Every media element has a `content-visibility: auto` container so off-screen widgets don't even parse. The key mindset shift: on 3G, EVERY kilobyte is a decision."

---

## Q6: Design the frontend for an App Store-like marketplace

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    App Store Frontend Architecture                 │
│                                                                   │
│  Rendering Strategy:                                              │
│  ├── Home/Browse: SSG + ISR (editorial content, curated lists)    │
│  ├── Search: CSR with SSR shell (instant search, faceted filters) │
│  ├── App Detail: SSG + ISR (millions of pages, SEO-critical)      │
│  ├── Reviews: CSR with pagination (user-generated, dynamic)       │
│  └── User Account: CSR (authenticated, personalized)              │
│                                                                   │
│  API Layer:                                                       │
│  ├── GraphQL for catalog (complex queries, nested relationships)  │
│  ├── REST for auth, purchases, reviews (simple CRUD)              │
│  └── Algolia/Elasticsearch for search (dedicated search service)  │
│                                                                   │
│  State Management:                                                │
│  ├── TanStack Query: Server state (apps, reviews, categories)     │
│  ├── Zustand: Client state (filters, UI state, cart)              │
│  └── URL state: Search params (query, filters — shareable)        │
└──────────────────────────────────────────────────────────────────┘
```

### Search with Faceted Filtering

```tsx
// URL-driven search with instant results

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // All filter state lives in the URL (shareable, bookmarkable)
  const filters = {
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || 'all',
    price: searchParams.get('price') || 'all',   // free, paid, all
    rating: searchParams.get('rating') || '0',     // minimum rating
    sort: searchParams.get('sort') || 'relevance',
    page: parseInt(searchParams.get('page') || '1'),
  };
  
  // Debounced search query
  const [inputValue, setInputValue] = useState(filters.query);
  const deferredQuery = useDeferredValue(inputValue);
  
  useEffect(() => {
    setSearchParams(prev => {
      prev.set('q', deferredQuery);
      prev.set('page', '1');  // Reset page on new search
      return prev;
    });
  }, [deferredQuery]);
  
  // Fetch results with TanStack Query
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', filters],
    queryFn: () => searchApps(filters),
    keepPreviousData: true,   // Show old results while fetching new
    staleTime: 60_000,        // Cache for 1 min
  });
  
  return (
    <div className="search-layout">
      <SearchBar 
        value={inputValue}
        onChange={setInputValue}
        suggestions={data?.suggestions}
      />
      
      <div className="search-content">
        <FilterSidebar 
          facets={data?.facets}
          activeFilters={filters}
          onFilterChange={(key, value) => {
            setSearchParams(prev => {
              prev.set(key, value);
              prev.set('page', '1');
              return prev;
            });
          }}
        />
        
        <div className="results" style={{ opacity: isFetching ? 0.7 : 1 }}>
          <ResultsGrid apps={data?.apps || []} />
          <Pagination 
            total={data?.total || 0}
            page={filters.page}
            onPageChange={(p) => setSearchParams(prev => { prev.set('page', String(p)); return prev; })}
          />
        </div>
      </div>
    </div>
  );
}
```

### App Detail Page (SEO-Optimized SSG)

```tsx
// app/[appSlug]/page.tsx — Static generation with ISR

export async function generateStaticParams() {
  // Pre-generate top 10K most popular apps
  const topApps = await getTopApps(10000);
  return topApps.map(app => ({ appSlug: app.slug }));
  // Less popular apps generated on-demand (ISR)
}

export const revalidate = 3600;  // Revalidate every hour

async function AppDetailPage({ params }) {
  const app = await getApp(params.appSlug);
  
  if (!app) notFound();
  
  return (
    <>
      {/* Structured data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: app.name,
          applicationCategory: app.category,
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: app.rating,
            reviewCount: app.reviewCount,
          },
          offers: {
            '@type': 'Offer',
            price: app.price,
            priceCurrency: 'USD',
          },
        }),
      }} />
      
      <AppHeader app={app} />
      <ScreenshotGallery screenshots={app.screenshots} />
      <AppDescription description={app.description} />
      
      {/* Reviews — client-side with infinite scroll */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ReviewsSection appId={app.id} />
      </Suspense>
      
      {/* Recommendations — personalized, client-side */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations category={app.category} appId={app.id} />
      </Suspense>
    </>
  );
}
```

### Interview Tip
> "An App Store frontend is fundamentally a search-and-browse product. I'd optimize for two user journeys: browsing (SSG editorial pages with ISR for freshness) and searching (CSR with server-side search via Algolia/Elasticsearch). All filter state lives in the URL so searches are shareable and bookmarkable. App detail pages are pre-rendered for SEO (millions of pages via ISR — popular ones at build time, long-tail on-demand). Reviews and recommendations are client-side because they're personalized and paginated. TanStack Query handles all server state with `keepPreviousData` for seamless filter transitions."

---

## Q7: API design from a frontend perspective — REST vs GraphQL vs tRPC

### Quick Comparison

```
REST:
  "Standard HTTP endpoints, each returns a fixed shape"
  GET /api/users/123            → { id, name, email, avatar, role, ... }
  GET /api/users/123/posts      → [{ id, title, body, comments, ... }]
  
  Over-fetching: GET /users/123 returns 20 fields when you need 3
  Under-fetching: Need user + posts + comments = 3 separate requests

GraphQL:
  "Ask for exactly what you need in one request"
  query {
    user(id: "123") {
      name
      avatar
      posts(limit: 5) {
        title
        commentCount
      }
    }
  }
  
  One request, exact data shape, no over/under-fetching.

tRPC:
  "End-to-end type-safe RPC — like calling a function"
  const user = await trpc.user.getById.query({ id: '123' });
  // TypeScript auto-completes everything — input, output, errors
  // No codegen, no schema definition, just TypeScript
```

### When to Use Each

```
REST — Choose when:
  ├── Public API consumed by third parties
  ├── Simple CRUD operations
  ├── Team is familiar with REST conventions
  ├── Caching is critical (HTTP caching is straightforward)
  ├── Each endpoint maps cleanly to a resource
  └── Mobile apps that benefit from HTTP caching
  
  Frontend tools: fetch/axios + TanStack Query
  
GraphQL — Choose when:
  ├── Multiple clients need different data shapes (web, mobile, watch)
  ├── Complex nested data (social graph, e-commerce catalog)
  ├── Frontend needs to control query shape without backend changes
  ├── Real-time subscriptions are needed
  ├── Multiple backend services aggregated into one API
  └── Rapid frontend iteration (query changes without backend deploy)
  
  Frontend tools: Apollo Client, urql, or TanStack Query + graphql-request
  
tRPC — Choose when:
  ├── Full-stack TypeScript (frontend + backend)
  ├── Same team owns both frontend and backend
  ├── Monorepo setup
  ├── Maximum type safety without code generation
  ├── Internal tools, admin panels, SaaS products
  └── Rapid prototyping (fastest DX)
  
  Frontend tools: @trpc/react-query (built on TanStack Query)
```

### tRPC Example (End-to-End Type Safety)

```typescript
// ═══ Server (backend) ═══
// server/routers/user.ts
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';

export const userRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await db.user.findUnique({ where: { id: input.id } });
      if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
      return user;
      // Return type is automatically inferred by TypeScript
    }),
  
  update: protectedProcedure
    .input(z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return db.user.update({
        where: { id: ctx.user.id },
        data: input,
      });
    }),
});


// ═══ Client (frontend) ═══
// No codegen needed — types flow automatically

function UserProfile({ userId }: { userId: string }) {
  // Full type inference: data is typed as User | undefined
  const { data: user, isLoading } = trpc.user.getById.useQuery({ id: userId });
  
  const updateUser = trpc.user.update.useMutation({
    onSuccess: () => {
      utils.user.getById.invalidate({ id: userId });
    },
  });
  
  // TypeScript knows:
  // - user.name is string
  // - user.email is string
  // - updateUser.mutate({ name: 123 }) → TYPE ERROR (name must be string)
  // - trpc.user.nonExistent → TYPE ERROR (doesn't exist)
  
  if (isLoading) return <Skeleton />;
  
  return (
    <div>
      <h1>{user.name}</h1>  {/* Fully typed */}
      <button onClick={() => updateUser.mutate({ name: 'New Name' })}>
        Update
      </button>
    </div>
  );
}
```

### Decision Matrix

```
Criterion            REST        GraphQL      tRPC
──────────────────────────────────────────────────────
Type safety          Manual      Codegen      Automatic
Over-fetching        Common      None         None
Under-fetching       Common      None         None
Caching              HTTP native Complex      TanStack Query
Learning curve       Low         Medium       Low (if TS)
Public API           ✅ Best     ✅ Good      ❌ Internal only
Multiple clients     ❌ Fixed    ✅ Flexible  ❌ TS only
Real-time            WebSocket   Subscriptions WebSocket
File uploads         Easy        Complex      Easy
Error handling       HTTP codes  GraphQL errors Typed errors
Bundle size          ~0KB        ~30-50KB     ~10KB
Backend flexibility  Any         Any          Node.js/TS only
```

### Interview Tip
> "My decision framework: If the API is public or consumed by non-TypeScript clients, REST with OpenAPI spec for type generation. If multiple clients need different data shapes (web vs mobile vs third-party), GraphQL for query flexibility. If it's a full-stack TypeScript project where the same team owns frontend and backend, tRPC for zero-overhead type safety. In practice, I've seen the most productivity gains with tRPC in startup/SaaS environments and GraphQL in enterprise environments with multiple consumer teams. REST remains the right choice for simple CRUD APIs and public integrations."

---

## Q8: How do you structure a large-scale Next.js application?

### Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (marketing)/              # Route group: public pages
│   │   ├── page.tsx              # Homepage
│   │   ├── pricing/page.tsx
│   │   ├── about/page.tsx
│   │   └── layout.tsx            # Marketing layout (different nav)
│   │
│   ├── (dashboard)/              # Route group: authenticated
│   │   ├── layout.tsx            # Dashboard layout (sidebar, auth guard)
│   │   ├── dashboard/page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx          # Project list
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx      # Project detail
│   │   │   │   ├── settings/page.tsx
│   │   │   │   └── loading.tsx   # Suspense fallback
│   │   │   └── new/page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       └── loading.tsx
│   │
│   ├── api/                      # API routes (or use tRPC)
│   │   └── trpc/[trpc]/route.ts
│   │
│   ├── layout.tsx                # Root layout
│   ├── loading.tsx               # Global loading
│   ├── error.tsx                 # Global error boundary
│   ├── not-found.tsx             # 404 page
│   └── globals.css
│
├── components/                   # Shared components
│   ├── ui/                       # Primitive UI (Button, Input, Card)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── index.ts
│   ├── layout/                   # Layout components (Header, Sidebar)
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   └── features/                 # Feature-specific components
│       ├── projects/
│       │   ├── ProjectCard.tsx
│       │   ├── ProjectForm.tsx
│       │   └── ProjectList.tsx
│       └── settings/
│           └── SettingsForm.tsx
│
├── lib/                          # Core utilities
│   ├── api/                      # API client layer
│   │   ├── client.ts             # Configured fetch/axios
│   │   └── endpoints.ts          # API endpoint definitions
│   ├── auth/                     # Authentication
│   │   ├── session.ts
│   │   └── middleware.ts
│   ├── db/                       # Database (if full-stack)
│   │   ├── schema.ts             # Drizzle/Prisma schema
│   │   └── client.ts
│   └── utils/                    # Pure utility functions
│       ├── format.ts
│       ├── validation.ts
│       └── cn.ts                 # className utility
│
├── hooks/                        # Custom React hooks
│   ├── useDebounce.ts
│   ├── useMediaQuery.ts
│   └── useAuth.ts
│
├── stores/                       # Client state (Zustand)
│   ├── ui-store.ts               # UI state (sidebar, modals)
│   └── filter-store.ts           # Filter/search state
│
├── types/                        # Shared TypeScript types
│   ├── api.ts
│   ├── models.ts
│   └── index.ts
│
├── config/                       # App configuration
│   ├── navigation.ts
│   ├── feature-flags.ts
│   └── constants.ts
│
└── middleware.ts                  # Next.js middleware (auth, redirects)
```

### Key Architectural Patterns

```tsx
// 1. Server Components by default, Client Components at leaf nodes
// app/(dashboard)/projects/[id]/page.tsx — SERVER

async function ProjectPage({ params }) {
  const project = await getProject(params.id);  // Server-only DB call
  
  return (
    <div>
      <h1>{project.name}</h1>                    {/* Static — zero JS */}
      <ProjectDescription text={project.desc} /> {/* Static — zero JS */}
      
      {/* Only interactive parts are Client Components */}
      <ProjectActions projectId={project.id} />  {/* 'use client' */}
      
      <Suspense fallback={<TasksSkeleton />}>
        <ProjectTasks projectId={project.id} />  {/* Server — async */}
      </Suspense>
    </div>
  );
}

// 2. Parallel data fetching with Promise.all
async function DashboardPage() {
  // All three fetch in parallel — no waterfall
  const [projects, metrics, notifications] = await Promise.all([
    getProjects(),
    getMetrics(),
    getNotifications(),
  ]);
  
  return (
    <div>
      <MetricsBar metrics={metrics} />
      <ProjectList projects={projects} />
      <NotificationFeed notifications={notifications} />
    </div>
  );
}

// 3. Middleware for auth and routing
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  
  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Redirect logged-in users from marketing pages
  if (request.nextUrl.pathname === '/' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Interview Tip
> "For a large-scale Next.js app, the key structural decisions are: route groups for layout boundaries (marketing vs dashboard), Server Components by default with Client Components only at interactive leaves, parallel data fetching with `Promise.all` instead of sequential awaits, and feature-based component organization (`components/features/projects/`) rather than type-based (`components/buttons/`). I use middleware for auth guards instead of client-side checks because it runs at the edge and prevents even the HTML from loading for unauthorized routes."

---

## Q9: Design a notification system — web, push, email, and in-app

### Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                  Notification System Architecture                  │
│                                                                   │
│  Event Sources          Notification Service       Delivery        │
│  ┌──────────┐          ┌──────────────────┐      ┌─────────────┐ │
│  │ User     │          │                  │      │ In-App      │ │
│  │ Actions  │─────────►│  Event Router    │─────►│ (WebSocket) │ │
│  │          │          │       │          │      │             │ │
│  │ System   │          │  ┌────▼────┐     │      │ Push        │ │
│  │ Events   │─────────►│  │ Rules   │     │─────►│ (FCM/APNs) │ │
│  │          │          │  │ Engine  │     │      │             │ │
│  │ Scheduled│          │  │         │     │      │ Email       │ │
│  │ Triggers │─────────►│  │ Route + │     │─────►│ (SES/SG)   │ │
│  │          │          │  │ Dedup + │     │      │             │ │
│  └──────────┘          │  │ Batch   │     │      │ SMS         │ │
│                        │  └─────────┘     │─────►│ (Twilio)    │ │
│                        │                  │      └─────────────┘ │
│                        │  ┌──────────┐    │                      │
│                        │  │ User     │    │                      │
│                        │  │ Prefs DB │    │                      │
│                        │  └──────────┘    │                      │
│                        └──────────────────┘                      │
└───────────────────────────────────────────────────────────────────┘
```

### Frontend: In-App Notification Center

```tsx
// Real-time notifications via WebSocket + REST fallback

function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Initial load via REST
  const { data: initialData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications({ limit: 50 }),
  });
  
  // Real-time updates via WebSocket
  useEffect(() => {
    const ws = new WebSocket(`wss://api.example.com/notifications`);
    
    ws.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permitted
      if (Notification.permission === 'granted' && document.hidden) {
        new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon,
          tag: notification.id,     // Dedup
          data: { url: notification.actionUrl },
        });
      }
    };
    
    ws.onclose = () => {
      // Fallback: poll every 30s if WebSocket disconnects
      const interval = setInterval(async () => {
        const fresh = await fetchNotifications({ since: lastTimestamp });
        if (fresh.length > 0) {
          setNotifications(prev => [...fresh, ...prev]);
          setUnreadCount(prev => prev + fresh.length);
        }
      }, 30000);
      
      return () => clearInterval(interval);
    };
    
    return () => ws.close();
  }, []);
  
  const markAsRead = useMutation({
    mutationFn: (ids) => markNotificationsRead(ids),
    onMutate: (ids) => {
      // Optimistic update
      setNotifications(prev =>
        prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - ids.length));
    },
  });
  
  return { notifications, unreadCount, markAsRead };
}
```

### Push Notifications (Web Push API)

```javascript
// Register service worker + push subscription

async function subscribeToPush() {
  // 1. Request permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;
  
  // 2. Register service worker
  const registration = await navigator.serviceWorker.register('/sw.js');
  
  // 3. Subscribe to push
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  
  // 4. Send subscription to server
  await fetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify({
      subscription,
      preferences: {
        mentions: true,
        updates: true,
        marketing: false,
      },
    }),
  });
  
  return subscription;
}

// Service Worker: handle push events
// sw.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/notification.png',
      badge: '/icons/badge.png',
      tag: data.tag,        // Group similar notifications
      renotify: true,       // Vibrate even if same tag
      data: { url: data.url },
      actions: data.actions || [],
    })
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data.url;
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Focus existing tab or open new one
      const existing = windowClients.find(c => c.url === url);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
```

### User Preference Management

```tsx
// Notification preferences UI
function NotificationPreferences() {
  const { data: prefs, isLoading } = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: fetchNotificationPrefs,
  });
  
  const updatePrefs = useMutation({
    mutationFn: updateNotificationPrefs,
    onSuccess: () => queryClient.invalidateQueries(['notification-prefs']),
  });
  
  if (isLoading) return <Skeleton />;
  
  return (
    <form>
      <h2>Notification Preferences</h2>
      
      {/* Per-channel, per-category matrix */}
      <table>
        <thead>
          <tr>
            <th>Event Type</th>
            <th>In-App</th>
            <th>Push</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(prefs.categories).map(([category, channels]) => (
            <tr key={category}>
              <td>{formatCategoryName(category)}</td>
              {['inApp', 'push', 'email'].map(channel => (
                <td key={channel}>
                  <Toggle
                    checked={channels[channel]}
                    onChange={(checked) => updatePrefs.mutate({
                      category,
                      channel,
                      enabled: checked,
                    })}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Quiet hours */}
      <fieldset>
        <legend>Quiet Hours (no push/email)</legend>
        <TimeRangePicker
          start={prefs.quietHours.start}
          end={prefs.quietHours.end}
          timezone={prefs.timezone}
          onChange={(range) => updatePrefs.mutate({ quietHours: range })}
        />
      </fieldset>
    </form>
  );
}
```

### Interview Tip
> "A multi-channel notification system needs three key pieces on the frontend: WebSocket for real-time in-app delivery with REST polling as fallback, the Web Push API with a service worker for browser push notifications that work even when the tab is closed, and a preference matrix that lets users control what they receive on each channel. The critical backend consideration is a rules engine that handles deduplication (don't send the same notification via push AND in-app simultaneously), batching (digest emails instead of one per event), and quiet hours. The preference matrix should be per-category, per-channel — users want granular control."

---

## Q10: Implement an offline-first progressive web app for a note-taking tool

### Offline-First Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                    Offline-First Note-Taking PWA                   │
│                                                                   │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────────┐  │
│  │ React UI    │◄───►│ Local Store  │◄───►│ Sync Engine      │  │
│  │             │     │ (IndexedDB)  │     │                  │  │
│  │ Editor      │     │              │     │ ┌──────────────┐ │  │
│  │ Note List   │     │ Notes        │     │ │ Conflict     │ │  │
│  │ Search      │     │ Folders      │     │ │ Resolution   │ │  │
│  │ Tags        │     │ Attachments  │     │ └──────┬───────┘ │  │
│  └─────────────┘     │ Sync Queue   │     │        │         │  │
│                      └──────────────┘     │ ┌──────▼───────┐ │  │
│                                           │ │ Server API   │ │  │
│                                           │ │ (when online)│ │  │
│                                           │ └──────────────┘ │  │
│                                           └──────────────────┘  │
│                                                                  │
│  KEY PRINCIPLE: IndexedDB is the source of truth.                │
│  Server is a backup/sync target. App works 100% offline.         │
└───────────────────────────────────────────────────────────────────┘
```

### PWA Manifest & Service Worker Setup

```json
// manifest.json
{
  "name": "QuickNotes",
  "short_name": "Notes",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a1a2e",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    { "src": "/screenshots/home.png", "sizes": "1280x720", "type": "image/png" }
  ]
}
```

### Local Database with Dexie.js (IndexedDB Wrapper)

```typescript
// db.ts — Local database schema
import Dexie, { Table } from 'dexie';

interface Note {
  id: string;           // UUID
  title: string;
  content: string;      // Markdown or JSON (TipTap/ProseMirror)
  folderId: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
  version: number;      // For conflict detection
  deletedAt: number | null;  // Soft delete
}

interface SyncQueueItem {
  id: string;
  noteId: string;
  operation: 'create' | 'update' | 'delete';
  data: Partial<Note>;
  timestamp: number;
  retryCount: number;
}

class NotesDB extends Dexie {
  notes!: Table<Note>;
  folders!: Table<Folder>;
  syncQueue!: Table<SyncQueueItem>;
  
  constructor() {
    super('NotesApp');
    
    this.version(1).stores({
      notes: 'id, folderId, updatedAt, syncStatus, *tags, deletedAt',
      folders: 'id, parentId, name',
      syncQueue: 'id, noteId, timestamp',
    });
  }
}

export const db = new NotesDB();
```

### CRUD Operations (Offline-First)

```typescript
// All operations write to IndexedDB FIRST, then queue sync

class NoteService {
  // CREATE — instant, works offline
  async createNote(input: { title: string; content: string; folderId?: string }): Promise<Note> {
    const note: Note = {
      id: crypto.randomUUID(),
      title: input.title,
      content: input.content,
      folderId: input.folderId || null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: 'pending',
      version: 1,
      deletedAt: null,
    };
    
    // Write to local DB (instant)
    await db.notes.add(note);
    
    // Queue sync (will process when online)
    await db.syncQueue.add({
      id: crypto.randomUUID(),
      noteId: note.id,
      operation: 'create',
      data: note,
      timestamp: Date.now(),
      retryCount: 0,
    });
    
    // Trigger sync if online
    this.trySync();
    
    return note;
  }
  
  // UPDATE — instant, works offline
  async updateNote(id: string, changes: Partial<Note>): Promise<Note> {
    const existing = await db.notes.get(id);
    if (!existing) throw new Error('Note not found');
    
    const updated = {
      ...existing,
      ...changes,
      updatedAt: Date.now(),
      version: existing.version + 1,
      syncStatus: 'pending' as const,
    };
    
    await db.notes.put(updated);
    
    // Queue sync
    await db.syncQueue.add({
      id: crypto.randomUUID(),
      noteId: id,
      operation: 'update',
      data: { ...changes, version: updated.version },
      timestamp: Date.now(),
      retryCount: 0,
    });
    
    this.trySync();
    return updated;
  }
  
  // SEARCH — fully offline using IndexedDB indexes
  async searchNotes(query: string): Promise<Note[]> {
    const allNotes = await db.notes
      .where('deletedAt')
      .equals(null)  // Exclude soft-deleted
      .toArray();
    
    const lower = query.toLowerCase();
    return allNotes
      .filter(n => 
        n.title.toLowerCase().includes(lower) ||
        n.content.toLowerCase().includes(lower) ||
        n.tags.some(t => t.toLowerCase().includes(lower))
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }
}
```

### Sync Engine

```typescript
class SyncEngine {
  private syncing = false;
  
  async sync() {
    if (this.syncing || !navigator.onLine) return;
    this.syncing = true;
    
    try {
      // 1. Push local changes to server
      await this.pushChanges();
      
      // 2. Pull remote changes
      await this.pullChanges();
      
    } finally {
      this.syncing = false;
    }
  }
  
  private async pushChanges() {
    const queue = await db.syncQueue.orderBy('timestamp').toArray();
    
    for (const item of queue) {
      try {
        const response = await fetch(`/api/notes/${item.noteId}`, {
          method: item.operation === 'create' ? 'POST' :
                  item.operation === 'delete' ? 'DELETE' : 'PUT',
          body: JSON.stringify(item.data),
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          // Remove from queue
          await db.syncQueue.delete(item.id);
          
          // Mark note as synced
          await db.notes.update(item.noteId, { syncStatus: 'synced' });
          
        } else if (response.status === 409) {
          // CONFLICT — server has newer version
          await this.handleConflict(item, await response.json());
          
        } else {
          // Retry later
          await db.syncQueue.update(item.id, {
            retryCount: item.retryCount + 1,
          });
        }
        
      } catch (err) {
        // Network error — will retry next sync
        break;
      }
    }
  }
  
  private async pullChanges() {
    const lastSync = localStorage.getItem('lastSyncTimestamp') || '0';
    
    const response = await fetch(`/api/notes/changes?since=${lastSync}`);
    const remoteChanges = await response.json();
    
    for (const remote of remoteChanges) {
      const local = await db.notes.get(remote.id);
      
      if (!local) {
        // New note from server
        await db.notes.add({ ...remote, syncStatus: 'synced' });
      } else if (local.syncStatus === 'synced') {
        // No local changes — accept server version
        await db.notes.put({ ...remote, syncStatus: 'synced' });
      } else {
        // Both local and remote changed — conflict
        await this.handleConflict(
          { noteId: local.id, data: local },
          remote
        );
      }
    }
    
    localStorage.setItem('lastSyncTimestamp', String(Date.now()));
  }
  
  private async handleConflict(local, remote) {
    // Strategy: Last-write-wins with user notification
    // For a note-taking app, keep BOTH versions and let user merge
    
    const conflictNote = {
      ...remote,
      syncStatus: 'conflict' as const,
      conflictData: {
        localVersion: local.data,
        remoteVersion: remote,
        detectedAt: Date.now(),
      },
    };
    
    await db.notes.put(conflictNote);
    // UI shows conflict indicator — user resolves manually
  }
}

// Auto-sync triggers
const syncEngine = new SyncEngine();

// Sync when coming back online
window.addEventListener('online', () => syncEngine.sync());

// Periodic sync when online
setInterval(() => {
  if (navigator.onLine) syncEngine.sync();
}, 30000);

// Sync on visibility change (user returns to tab)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && navigator.onLine) {
    syncEngine.sync();
  }
});

// Background sync (when supported)
navigator.serviceWorker?.ready.then(reg => {
  reg.sync?.register('sync-notes');
});
```

### React Hooks for Offline-First UI

```tsx
// Hook that reads from IndexedDB with live updates
function useNotes(folderId?: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  
  useEffect(() => {
    // Initial load from IndexedDB
    async function load() {
      let query = db.notes.where('deletedAt').equals(null);
      if (folderId) query = db.notes.where('folderId').equals(folderId);
      const results = await query.sortBy('updatedAt');
      setNotes(results.reverse());
    }
    load();
    
    // Subscribe to changes (Dexie liveQuery alternative)
    const subscription = liveQuery(() =>
      db.notes
        .where('deletedAt').equals(null)
        .sortBy('updatedAt')
    ).subscribe(results => setNotes(results.reverse()));
    
    return () => subscription.unsubscribe();
  }, [folderId]);
  
  return notes;
}

// Connection status indicator
function SyncStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  
  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);
  
  useEffect(() => {
    const check = async () => {
      const count = await db.syncQueue.count();
      setPendingCount(count);
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="sync-status">
      <span className={`dot ${online ? 'green' : 'red'}`} />
      {online ? (
        pendingCount > 0 ? `Syncing ${pendingCount} changes...` : 'All synced'
      ) : (
        `Offline — ${pendingCount} changes pending`
      )}
    </div>
  );
}
```

### Interview Tip
> "The core principle of offline-first is: IndexedDB is the source of truth, not the server. Every operation writes locally first (instant response), then queues a sync operation. The sync engine processes the queue when online, handling conflicts with a last-write-wins strategy plus user-visible conflict markers for notes that changed on both devices. The three sync triggers are: coming back online (event listener), periodic polling (setInterval), and Background Sync API (service worker). For a note-taking app, I'd also add Dexie's `liveQuery` for reactive UI updates from IndexedDB — the UI auto-updates when any operation (local or synced) modifies the database."

---

## Quick Reference Cheat Sheet

| # | Topic | Key One-Liner |
|---|---|---|
| 1 | Apple Product Page | SSG + ISR at CDN edge; 99.9% of launch traffic served from cache; compositor-only scroll animations |
| 2 | Collaborative Editor | Y.js CRDT + TipTap + WebSocket; offline edits merge automatically without conflicts |
| 3 | Component Library | Monorepo + semantic versioning + changesets; codemods for automated migration; CSS custom properties for theming |
| 4 | Micro-Frontends | Solve organisational problems, not technical; Module Federation for runtime composition; shared design system is non-negotiable |
| 5 | Media Dashboard on 3G | 100KB initial budget; three-tier image loading (blur → low-res → full); connection-aware video quality; 3D on user-click only |
| 6 | App Store Marketplace | SSG + ISR for app pages (SEO); CSR for search/filters; URL-driven filter state for shareability |
| 7 | API Design | REST for public APIs; GraphQL for multi-client flexibility; tRPC for full-stack TypeScript productivity |
| 8 | Next.js at Scale | Route groups for layout boundaries; Server Components default; parallel data fetching; middleware for auth |
| 9 | Notification System | WebSocket + REST fallback for in-app; Web Push API for browser push; per-category per-channel preference matrix |
| 10 | Offline-First PWA | IndexedDB is source of truth; sync queue with conflict detection; auto-sync on online, visibility, and periodic triggers |

---

> **Team Lead Tip:** System design interviews at the leadership level are about trade-off articulation, not just architecture knowledge. For every decision, state WHY you chose it, WHAT you traded off, and WHEN you'd choose differently. "I'd use SSG because SEO matters here, but I'd switch to SSR if we needed real-time personalization" shows deeper understanding than just describing SSG. Always tie technical decisions to business outcomes: faster load times → higher conversion; offline support → user retention; component library → development velocity across 20 teams.
