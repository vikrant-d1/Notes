# Node.js Senior Developer Interview Preparation Guide (9+ Years)
### Complete Definitions · Code Examples · Cross Questions & Answers

---

## Table of Contents

1. [Node.js Internals](#1-nodejs-internals)
2. [Authentication — JWT, OAuth, SSO](#2-authentication)
3. [Authorization — RBAC & ABAC](#3-authorization)
4. [Scaling & Rate Limiting](#4-scaling--rate-limiting)
5. [System Design & Microservices](#5-system-design--microservices)
6. [Database Optimization](#6-database-optimization)
7. [Caching Strategies](#7-caching-strategies)
8. [Message Queues](#8-message-queues)
9. [Security Best Practices](#9-security-best-practices)
10. [Coding Patterns](#10-coding-patterns)
11. [Key Numbers Cheatsheet](#11-key-numbers-cheatsheet)
12. [Full Revision Checklist](#12-full-revision-checklist)

---

## 1. Node.js Internals

---

### 1.1 Event Loop

#### Definition
The event loop is the heart of Node.js. Node.js is **single-threaded** — it can only execute one piece of JavaScript at a time. The event loop is what allows Node.js to perform non-blocking I/O operations even though it uses a single thread — it offloads operations to the OS or libuv thread pool, and when they complete, their callbacks are placed in the appropriate queue for the event loop to pick up.

The event loop runs continuously and cycles through **6 phases** in order:

```
1. Timers          → executes setTimeout() and setInterval() callbacks
2. Pending I/O     → executes I/O callbacks deferred to the next loop
3. Idle / Prepare  → internal use only
4. Poll            → retrieves new I/O events; executes I/O callbacks
5. Check           → executes setImmediate() callbacks
6. Close Callbacks → executes close events e.g. socket.on('close')
```

Between every phase, Node.js drains two **microtask queues**:
- `process.nextTick()` queue — highest priority
- `Promise.then()` / `queueMicrotask()` queue — runs after nextTick

```js
// Classic output prediction question
console.log('A');                                 // 1. sync
process.nextTick(() => console.log('B'));         // 2. microtask (nextTick)
Promise.resolve().then(() => console.log('C'));   // 3. microtask (Promise)
setImmediate(() => console.log('D'));             // 4. Check phase
setTimeout(() => console.log('E'), 0);           // 5. Timers phase
console.log('F');                                 // 1. sync

// Output: A → F → B → C → E (or D) → D (or E)
// Note: setTimeout(0) vs setImmediate order can vary in the main module
// but inside an I/O callback, setImmediate ALWAYS fires before setTimeout
```

#### Cross Questions & Answers

**Q1. Why does `process.nextTick()` have the highest priority?**
> `process.nextTick()` is not technically part of the event loop — it runs after the current operation completes but **before** the event loop continues to the next phase. It drains completely before any I/O or timer. This makes it useful when you need to fire a callback after the current function finishes but before any async operation.

**Q2. What is the danger of recursive `process.nextTick()`?**
> If you call `process.nextTick()` inside a `nextTick` callback recursively, it will keep adding to the microtask queue without ever letting the event loop advance. This **starves I/O** — no file reads, network responses, or timers can fire. Always use `setImmediate()` when you want to defer work but not block I/O.

**Q3. Inside an I/O callback, which fires first — `setImmediate` or `setTimeout(0)`?**
> `setImmediate()` always fires first. When inside an I/O callback (Poll phase), the loop goes directly to the Check phase next — where `setImmediate()` runs. `setTimeout(0)` won't run until the next Timers phase in the next iteration.

**Q4. What is the difference between the microtask queue and the callback queue?**
> The **microtask queue** (nextTick + Promises) is drained completely between every event loop phase — it has priority over all phases. The **callback queue** (macrotasks like setTimeout, setImmediate, I/O) is processed one per phase. A single microtask can schedule more microtasks; all will run before the loop moves on.

**Q5. Can two JavaScript callbacks run truly in parallel in Node.js?**
> No. JavaScript code is strictly single-threaded. Two callbacks never execute simultaneously. However, I/O operations (file reads, network calls) happen in parallel at the OS/libuv level — their *completion callbacks* are queued and executed one at a time by the event loop.

---

### 1.2 Streams & Backpressure

#### Definition
Streams are objects that let you read or write data in chunks rather than loading everything into memory at once. This is critical for large files, HTTP bodies, or real-time data.

**Four stream types:**
- `Readable` — source of data (file read, HTTP request)
- `Writable` — destination (file write, HTTP response)
- `Duplex` — both readable and writable (TCP socket)
- `Transform` — duplex that modifies data (gzip compression, encryption)

**Backpressure** is the mechanism that prevents a fast producer from overwhelming a slow consumer. When the writable stream's internal buffer exceeds its `highWaterMark`, `write()` returns `false`. The readable should pause until the writable emits a `drain` event.

```js
// WRONG — ignores backpressure, can cause memory overflow
readable.on('data', chunk => writable.write(chunk));

// RIGHT — pipeline() handles backpressure + error cleanup automatically
const { pipeline } = require('stream/promises');
const { createReadStream, createWriteStream } = require('fs');
const { Transform } = require('stream');

const upperCase = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback(); // CRITICAL: signals "I'm ready for the next chunk"
                // forgetting this freezes the pipeline forever
  }
});

await pipeline(
  createReadStream('input.txt'),    // producer
  upperCase,                         // transform
  createWriteStream('output.txt')   // consumer
);
// pipeline auto-destroys all streams on error and resolves when done
```

#### Cross Questions & Answers

**Q1. What is `highWaterMark` and how does it affect backpressure?**
> `highWaterMark` is the buffer size threshold. For byte streams, the default is **16KB**. For object mode streams, it's **16 objects**. When the writable buffer fills beyond this, `write()` returns `false`, signaling the readable to pause. The readable resumes when the writable emits `drain`. You can tune it — low value = more backpressure signals (slower but memory-safe), high value = fewer pauses (faster but more memory used).

**Q2. What happens if you forget to call `callback()` in a Transform stream?**
> The stream thinks the current chunk is still being processed and stops feeding new chunks. The pipeline freezes completely — no data flows, no completion, no error. This is a silent bug that is very hard to debug. Always call `callback()` (or use `callback(null, transformedData)` as a shorthand to push and signal done simultaneously).

**Q3. What is the difference between `pipe()` and `pipeline()`?**
> `pipe()` is the older API. Its major flaw: if the destination stream errors or closes, the source stream is **not** automatically destroyed — you get memory/resource leaks. `pipeline()` (from `stream/promises`) solves this by properly cleaning up all streams in the chain on any error and supports `async/await`. Always use `pipeline()` in production.

**Q4. How do you create a Readable stream from an async generator?**
> Use `Readable.from(asyncGenerator())`. Node.js natively supports async iterables as streams. It handles backpressure automatically — it only calls `.next()` on the generator when the consumer is ready for more data.

```js
async function* dataSource() {
  for (let i = 0; i < 1000; i++) {
    yield `line ${i}\n`;
    await new Promise(r => setTimeout(r, 10));
  }
}
await pipeline(Readable.from(dataSource()), createWriteStream('out.txt'));
```

**Q5. How would you handle a stream that produces data faster than you can process it in an external API call?**
> Use a Transform stream with `objectMode: true` and set a low `highWaterMark` (e.g., 1-5). Inside the transform, `await` your API call before calling `callback()`. The stream automatically pauses the source while your API call is in flight, preventing queue buildup. For higher throughput, use a parallel processing library like `parallel-transform` that maintains a pool of concurrent async operations.

---

### 1.3 Cluster vs Worker Threads

#### Definition
Node.js is single-threaded. To use multiple CPU cores, you have two options:

**Cluster Module** — forks the entire Node.js process. Each worker is a completely independent process with its own V8 instance, event loop, and memory heap. They share the server port but nothing else. Communication happens via IPC (serialized JSON messages). Best for scaling HTTP/TCP servers.

**Worker Threads** — creates threads within the same process. Workers share the same process memory and can share data via `SharedArrayBuffer` without copying. Best for CPU-intensive computations (image processing, cryptography, ML inference) that would block the event loop.

```js
// CLUSTER — scale HTTP server across all CPU cores
const cluster = require('cluster');
const os = require('os');

if (cluster.isPrimary) {
  os.cpus().forEach(() => cluster.fork());
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork(); // auto-restart
  });
} else {
  require('./app'); // each worker runs the full Express app
}

// WORKER THREADS — offload CPU work without blocking event loop
const { Worker, isMainThread, workerData, parentPort } = require('worker_threads');

if (isMainThread) {
  const worker = new Worker(__filename, { workerData: { input: largeData } });
  worker.on('message', result => console.log('Result:', result));
  worker.on('error', err => console.error('Worker error:', err));
  worker.on('exit', code => { if (code !== 0) console.error('Worker stopped:', code); });
} else {
  // This runs in a separate thread — won't block main event loop
  const result = heavyCpuWork(workerData.input);
  parentPort.postMessage(result);
}
```

#### Cross Questions & Answers

**Q1. How does the cluster module distribute incoming connections?**
> On Linux/macOS, Node.js uses **round-robin** by default (configurable via `cluster.schedulingPolicy`). The master process listens on the port and distributes accepted connections to workers in turn. On Windows, the OS handles distribution. Round-robin can be suboptimal if requests have very different processing times — a slow worker keeps getting new connections.

**Q2. Cluster round-robin breaks WebSocket sticky sessions. How do you fix it?**
> Two approaches: (1) **Sticky sessions** — configure NGINX with `ip_hash` so the same client IP always hits the same worker. (2) **Stateless workers** — store all session/connection state in Redis. Any worker can then handle any request from any client, which is the preferred production approach for horizontal scalability.

**Q3. Why can't you use SharedArrayBuffer between cluster workers?**
> Cluster workers are **separate processes** — they don't share memory. `SharedArrayBuffer` only works between **worker threads** (which are threads in the same process). For inter-process data sharing in a cluster, you use Redis, a database, or IPC messages.

**Q4. What is the serialization overhead of worker thread communication?**
> When you `postMessage()` a regular JavaScript object, it is **structured-cloned** (deep copied) — O(n) in object size. For large data, this is expensive. Solution: use **Transferable objects** (like `ArrayBuffer`) — pass it in the `transfer` array of `postMessage`. The buffer is transferred (zero-copy) to the worker; the sender loses access. Use `SharedArrayBuffer` for data that both threads need to read simultaneously.

**Q5. PM2 vs raw Cluster module — which should you use in production?**
> Always PM2 (or Kubernetes). Raw cluster requires you to manually implement: crash recovery, zero-downtime reload, log aggregation, memory monitoring, CPU profiling, and startup scripts. PM2 provides all of this out of the box. `pm2 start app.js -i max` uses one worker per CPU core with full crash restart and log management.

---

### 1.4 V8 Memory & Garbage Collection

#### Definition
V8 (the JavaScript engine) manages memory in a **heap** divided into generations based on object lifespan:

- **Young Generation (New Space)** — newly allocated objects. Uses **Scavenge** GC: fast, runs frequently, copies surviving objects to Old Gen. Divided into two semi-spaces (from-space, to-space).
- **Old Generation (Old Space)** — objects that survived Young Gen GC twice. Uses **Mark-Sweep-Compact**: marks reachable objects, sweeps unreachable ones, compacts to reduce fragmentation. Slower but infrequent.
- **Large Object Space** — objects exceeding size limits, never moved by GC.
- **Code Space** — compiled code (JIT).

Default heap limit: **~1.5GB** on 64-bit systems. Override: `node --max-old-space-size=4096 app.js`

**Common memory leak sources:**
1. Global variables accumulating data
2. Event listeners not removed (`emitter.removeAllListeners()`)
3. Closures holding references to large objects
4. Uncleared `setInterval()` timers
5. Caches with no eviction strategy

```js
// Detect leaks early — monitor memory trend
setInterval(() => {
  const m = process.memoryUsage();
  console.log({
    rss:       `${(m.rss       / 1024 / 1024).toFixed(1)} MB`, // total process memory
    heapTotal: `${(m.heapTotal / 1024 / 1024).toFixed(1)} MB`, // V8 heap allocated
    heapUsed:  `${(m.heapUsed  / 1024 / 1024).toFixed(1)} MB`, // V8 heap in use
    external:  `${(m.external  / 1024 / 1024).toFixed(1)} MB`, // C++ objects (Buffers)
  });
}, 10000);

// Take a heap snapshot for Chrome DevTools analysis
require('v8').writeHeapSnapshot('./heap-' + Date.now() + '.heapsnapshot');

// WeakRef — cache that doesn't prevent GC
const cache = new Map();
function getCached(key, factory) {
  const ref = cache.get(key);
  const obj = ref?.deref();
  if (obj) return obj;
  const newObj = factory();
  cache.set(key, new WeakRef(newObj));
  return newObj;
}
```

#### Cross Questions & Answers

**Q1. What is the difference between rss, heapUsed, heapTotal, and external?**
> - **rss** (Resident Set Size) — total memory the OS has allocated to the process: heap + stack + code + C++ bindings. This is what you see in `top`/`htop`.
> - **heapTotal** — total memory V8 has reserved for the JavaScript heap (pre-allocated). V8 grows this in chunks.
> - **heapUsed** — actual JavaScript objects currently alive in the heap. If this grows unboundedly = memory leak.
> - **external** — memory used by C++ objects that are tied to JavaScript objects (e.g., `Buffer` objects, which are allocated outside the V8 heap).

**Q2. How do you find a memory leak in a production Node.js app?**
> Step 1: Monitor `heapUsed` trend — steady increase without GC cleanup confirms a leak. Step 2: Take heap snapshots at T=0 and T+5min via Chrome DevTools (`--inspect` flag) or `v8.writeHeapSnapshot()`. Step 3: Load both snapshots in Chrome DevTools → Memory → Comparison view. Objects growing in count/retained size between snapshots are the leak. Step 4: For production without restart, use `clinic.js heapprofiler` or Datadog APM. Common findings: unbounded Maps/Sets, event listener accumulation.

**Q3. What is the Scavenge GC algorithm and why is it fast?**
> Scavenge divides Young Gen into two equal semi-spaces. All new objects are allocated in "from-space". During GC, it scans from-space — live objects are **copied** to "to-space". Dead objects (anything not copied) are automatically freed — no sweep needed. Then from/to labels are swapped. It's fast because: (1) it only scans young objects (most die young — "generational hypothesis"), (2) copying is cache-friendly, (3) it runs very frequently (every few MBs of allocation).

**Q4. What is the `--expose-gc` flag and when would you use it?**
> `node --expose-gc` makes `global.gc()` available in JavaScript, allowing you to manually trigger garbage collection. This is only for **debugging/testing** purposes — e.g., verifying that your WeakRef/cache cleanup is working correctly, or in tests to ensure objects are properly freed. Never use forced GC in production — it pauses the event loop and V8's adaptive GC is more efficient.

---

### 1.5 libuv Thread Pool

#### Definition
libuv is the C library that powers Node.js's async I/O. It maintains a **thread pool** (default 4 threads) for operations that don't have native async OS APIs.

**Uses the thread pool:**
- File system operations (`fs.readFile`, `fs.stat`, etc.)
- `dns.lookup()` — uses OS `getaddrinfo()` (synchronous at OS level)
- Crypto operations (`crypto.pbkdf2`, `crypto.scrypt`, `crypto.randomBytes`)
- `zlib` compression/decompression

**Does NOT use the thread pool:**
- Network I/O (TCP, UDP, HTTP) — uses OS async APIs (`epoll` on Linux, `kqueue` on macOS, `IOCP` on Windows)
- Child processes, pipes
- `dns.resolve()` — uses c-ares library (event-loop native)

```js
// MUST set before any require() — otherwise libuv is already initialized
process.env.UV_THREADPOOL_SIZE = '16'; // default 4, max 128 (practical), absolute max 1024

// Diagnose: dns.lookup (thread pool) vs dns.resolve (c-ares)
const dns = require('dns');

// Uses thread pool — will bottleneck if pool is saturated
dns.lookup('api.example.com', (err, address) => console.log(address));

// Uses c-ares — truly async, no thread pool involvement
dns.resolve4('api.example.com', (err, addresses) => console.log(addresses[0]));
```

#### Cross Questions & Answers

**Q1. You have 100 concurrent `bcrypt.hash()` calls. What happens with the default thread pool?**
> bcrypt uses `crypto` under the hood, which uses the thread pool. With the default pool size of 4, the first 4 hash operations start immediately. The remaining 96 queue up and wait for a thread to free up. The event loop is not blocked (callbacks are queued), but the **latency** of each hash call increases linearly with queue depth. Fix: set `UV_THREADPOOL_SIZE=16` before startup, or better, offload bcrypt to a dedicated worker thread or a separate auth microservice.

**Q2. How would you diagnose thread pool saturation in production?**
> Thread pool saturation shows as: high latency on file/crypto operations despite low CPU usage, and I/O operations taking much longer than expected. Use `clinic.js` (specifically `clinic bubbles`) which instruments `async_hooks` to track how long operations wait in the queue before starting. If the "init to before" time is long, the thread pool is saturated. Also monitor with APM tools like Datadog — create custom gauges for operation queue wait time.

**Q3. Why is `fs.readFileSync()` so dangerous in a web server?**
> `readFileSync()` is completely synchronous — it calls the OS `read()` syscall and blocks the **entire Node.js thread** until the file is fully read. No other request, timer, or I/O callback can be processed during this time. A 100ms file read blocks 100ms of all concurrent users. Even with the thread pool, the difference is: async `readFile()` offloads the wait to a pool thread while the event loop serves other requests; `readFileSync()` blocks the only event loop thread.

---

### 1.6 ESM vs CommonJS

#### Definition
Node.js supports two module systems:

**CommonJS (CJS)** — the original Node.js module system.
- `require()` is synchronous and dynamic (can be called anywhere, conditionally)
- `module.exports` / `exports` for exports
- `__dirname` and `__filename` available by default
- Files use `.js` or `.cjs` extension

**ECMAScript Modules (ESM)** — the modern JavaScript standard.
- `import`/`export` are static (must be at top level, enables tree-shaking)
- Supports top-level `await`
- `__dirname` / `__filename` not available — use `import.meta.url`
- Files use `.mjs` or `.js` with `"type": "module"` in `package.json`
- Loading is asynchronous

```js
// ESM: get __dirname equivalent
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dual package: support both CJS and ESM consumers
// package.json
{
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",   // for import users
      "require": "./dist/cjs/index.cjs"  // for require() users
    }
  }
}

// Dynamic import in CJS (load an ESM module from CJS)
const { default: chalk } = await import('chalk'); // async!
```

#### Cross Questions & Answers

**Q1. Can you `require()` an ESM module from a CJS file?**
> Not directly — `require()` is synchronous but ESM loading is asynchronous. Attempting it throws `ERR_REQUIRE_ESM`. The workaround is dynamic `import()` which is async: `const mod = await import('./esm-module.mjs')`. This is why many package authors publish dual packages (CJS + ESM) or are fully migrating to ESM.

**Q2. Why does ESM enable better tree-shaking than CJS?**
> ESM `import`/`export` statements are **static** — analyzable at parse time without executing code. A bundler can determine exactly which exports are used and eliminate the rest (dead code elimination). CJS `require()` is dynamic — `require(condition ? 'a' : 'b')` can't be statically analyzed, so bundlers must include everything or make unsafe assumptions.

**Q3. What is a "dual package hazard"?**
> When a package ships both CJS and ESM versions, a consumer application might load **both** versions of the same package. For example, a CJS dependency loads the CJS version, while an ESM file loads the ESM version. If the package uses singletons (like a shared state or class instances), you get two separate instances — bugs that are hard to trace. Solution: use package `exports` properly and document that `instanceof` checks may fail across CJS/ESM boundaries.

---

## 2. Authentication

---

### 2.1 JWT — JSON Web Tokens

#### Definition
A JWT is a **signed, self-contained token** consisting of three Base64-encoded parts separated by dots:
- **Header** — algorithm type (`HS256`, `RS256`)
- **Payload** — claims: userId, role, exp (expiry), iat (issued at)
- **Signature** — HMAC of header + payload using a secret key

JWTs are **stateless** — the server doesn't store them. Verification only requires the secret key. This enables horizontal scaling without shared session storage.

**Access Token** — short-lived (15 minutes). Sent in `Authorization: Bearer <token>` header on every API request.

**Refresh Token** — long-lived (7 days). Used only to obtain a new access token. Stored server-side in Redis for revocation capability.

**Token Rotation** — on every refresh, issue a new refresh token and invalidate the old one. Detects refresh token theft.

```js
const jwt = require('jsonwebtoken');
const redis = require('redis').createClient();

// Generate token pair
const generateTokens = (userId, role) => ({
  accessToken: jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '15m', issuer: 'myapp', audience: 'myapp-users' }
  ),
  refreshToken: jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )
});

// Refresh endpoint with token rotation
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check token exists in Redis (not revoked)
    const stored = await redis.get(`refresh:${decoded.userId}`);
    if (!stored || stored !== refreshToken)
      return res.status(401).json({ error: 'Refresh token invalid or reused' });

    // Token rotation: issue new pair, invalidate old refresh token
    const tokens = generateTokens(decoded.userId, decoded.role);
    await redis.setEx(`refresh:${decoded.userId}`, 7 * 86400, tokens.refreshToken);

    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Token expired' });
  }
});

// Auth middleware with blacklist check
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  // Check blacklist first (O(1) Redis lookup)
  const blacklisted = await redis.get(`blacklist:${token}`);
  if (blacklisted) return res.status(401).json({ error: 'Token revoked' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Logout: blacklist access token + delete refresh token
const logout = async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.decode(token);
  const ttl = decoded.exp - Math.floor(Date.now() / 1000); // seconds until expiry

  await redis.setEx(`blacklist:${token}`, ttl, '1');
  await redis.del(`refresh:${decoded.userId}`);

  res.json({ message: 'Logged out successfully' });
};
```

#### Cross Questions & Answers

**Q1. JWT is stateless — so why do you still need Redis?**
> Pure stateless JWTs can't be revoked before expiry. If an access token is stolen, or a user logs out, the token remains valid until it expires. Redis solves this: store blacklisted tokens (logout/revocation) and refresh tokens (to enable rotation and invalidation). The tradeoff is a small amount of statefulness (Redis lookup per request) in exchange for security. At scale (~0.1ms per Redis GET) this is acceptable.

**Q2. Why use short-lived access tokens (15 min) instead of one long-lived token?**
> Short access tokens limit the window of exposure if stolen. A stolen 15-minute token is valid for at most 15 minutes. A stolen 7-day token is dangerous for 7 days. The refresh token mechanism lets users stay logged in long-term while keeping the at-risk token short-lived. The refresh token is protected by being stored server-side (Redis) and only sent over HTTPS.

**Q3. What is the difference between `HS256` and `RS256` signing algorithms?**
> `HS256` uses a **shared symmetric secret** — both signing and verification use the same key. Simpler, faster, but the verifier must know the secret. `RS256` uses **asymmetric keys** — the auth server signs with a private key; any service can verify with the public key without knowing the private key. RS256 is better for microservices (each service can verify tokens independently using the public key published at a JWKS endpoint) without needing to share a secret.

**Q4. Where should JWTs be stored on the frontend? Why not localStorage?**
> Store in **HttpOnly, Secure, SameSite=Strict cookies**. `localStorage` is accessible to any JavaScript running on the page — a single XSS vulnerability exposes every stored token. HttpOnly cookies cannot be read by JavaScript at all, only sent automatically by the browser. `Secure` ensures HTTPS-only transmission. `SameSite=Strict` prevents CSRF by blocking cross-origin cookie sending.

**Q5. What is the `exp`, `iat`, `iss`, and `aud` claim in a JWT?**
> - `exp` (expiration time) — Unix timestamp after which the token is invalid. Always validate this.
> - `iat` (issued at) — Unix timestamp when the token was created. Useful for detecting tokens issued before a password change.
> - `iss` (issuer) — who issued the token (e.g., `"myapp"`). Validate to prevent tokens from other systems being accepted.
> - `aud` (audience) — intended recipient of the token (e.g., `"myapp-api"`). Prevents a token issued for one service from being used on another.

**Q6. What is the "token refresh race condition" and how do you solve it?**
> In SPAs with multiple tabs, two tabs might simultaneously detect an expired access token and both try to refresh. The first refresh rotates the refresh token. The second refresh uses the now-invalidated old refresh token and fails, logging the user out. Solution: use a mutex/lock in the browser (via `BroadcastChannel` or a shared service worker) so only one tab performs the refresh. All other tabs wait and use the new token.

---

### 2.2 OAuth 2.0 & SSO

#### Definition
OAuth 2.0 is an **authorization framework** (not authentication) that allows users to grant third-party applications limited access to their resources without sharing passwords. The user authorizes the app; the app gets a token with specific scopes.

**Key flows:**
- **Authorization Code** — for server-side web apps. Most secure. Auth code exchanged for tokens server-side.
- **Authorization Code + PKCE** — for SPAs and mobile apps. No client secret needed. Code Verifier proves authenticity.
- **Client Credentials** — for machine-to-machine. No user involved.
- **Implicit** — deprecated. Was for SPAs, replaced by PKCE.

**OpenID Connect (OIDC)** — identity layer on top of OAuth 2.0. Adds an `id_token` (JWT) with user identity claims. Use OAuth for authorization, OIDC for authentication/login.

**SSO (Single Sign-On)** — one login works across multiple services. The Identity Provider (IdP) authenticates once; all services trust the IdP's token.

```js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  'https://myapp.com/auth/google/callback'
},
async (googleAccessToken, googleRefreshToken, profile, done) => {
  // Find or create user in your own DB
  let user = await User.findOne({ googleId: profile.id });
  if (!user) {
    user = await User.create({
      googleId:    profile.id,
      email:       profile.emails[0].value,
      name:        profile.displayName,
      avatarUrl:   profile.photos[0].value,
    });
  }
  // Return your own user — issue your own JWT next
  done(null, user);
}));

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    // Issue your own JWT pair for the authenticated user
    const tokens = generateTokens(req.user._id, req.user.role);
    res.redirect(`/dashboard?token=${tokens.accessToken}`);
  }
);
```

#### Cross Questions & Answers

**Q1. What is PKCE and why is it required for SPAs?**
> PKCE (Proof Key for Code Exchange) prevents **authorization code interception attacks**. In a regular Authorization Code flow, a `client_secret` is used to exchange the auth code for tokens — but SPAs can't safely store a secret (it's visible in browser JS). PKCE replaces the secret with a per-request cryptographic challenge: the client generates a random `code_verifier`, hashes it to `code_challenge`, sends the challenge with the auth request, and sends the raw verifier when exchanging the code. An intercepted code is useless without the verifier.

**Q2. What is the difference between `access_token` and `id_token` in OIDC?**
> `access_token` — authorizes API calls on behalf of the user. Opaque or JWT, validated by the resource server. `id_token` — proves the user's identity to the **client application**. Always a JWT containing claims like `sub` (user ID), `email`, `name`. The id_token is for the client to know *who* the user is; the access_token is for the API to know *what the user can do*. Never use an id_token to authorize API access.

**Q3. How does SSO logout (Single Logout) work?**
> **Front-channel logout** — the IdP redirects the browser to each registered app's `/logout` endpoint. Simple but fails if any app is unreachable. **Back-channel logout** — the IdP sends a server-to-server POST with a logout token to each app's logout endpoint. More reliable (doesn't depend on browser being open). **Session management** — apps poll the IdP's session status endpoint via a hidden iframe. On session change, apps log out locally.

---

## 3. Authorization

---

### 3.1 RBAC — Role-Based Access Control

#### Definition
RBAC assigns permissions to **roles**, and roles to users. When a request comes in, the middleware checks if the user's role has the required permissions. Simple, fast, and sufficient for most applications.

**Components:**
- **Role** — a named group (admin, editor, viewer, moderator)
- **Permission** — an action (read, write, delete, manage_users)
- **Assignment** — user → role mapping (stored in DB)

```js
// Define role-permission map (can also be stored in DB for dynamic roles)
const rolePermissions = {
  admin:     ['read', 'write', 'delete', 'manage_users', 'view_analytics'],
  editor:    ['read', 'write'],
  moderator: ['read', 'delete'],
  viewer:    ['read'],
};

// Middleware factory — takes required permissions as arguments
const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    const userPermissions = rolePermissions[req.user.role] || [];
    const hasAll = requiredPermissions.every(p => userPermissions.includes(p));

    if (!hasAll) {
      return res.status(403).json({
        error: 'Forbidden',
        required: requiredPermissions,
        userRole: req.user.role
      });
    }
    next();
  };
};

// Usage
app.get('/posts',        authMiddleware, authorize('read'),           getPosts);
app.post('/posts',       authMiddleware, authorize('write'),          createPost);
app.delete('/posts/:id', authMiddleware, authorize('delete'),         deletePost);
app.get('/admin/users',  authMiddleware, authorize('manage_users'),   getUsers);

// Multiple permissions required
app.post('/admin/publish', authMiddleware, authorize('write', 'manage_users'), publishPost);
```

---

### 3.2 ABAC — Attribute-Based Access Control

#### Definition
ABAC makes authorization decisions based on **attributes** of the user, resource, environment, and action. More granular than RBAC — can express policies like "a user can only edit their own posts" or "managers can only view their team's data" or "this resource is only accessible during business hours."

```js
// ABAC: ownership-based access control
const canModifyPost = async (req, res, next) => {
  const post = await Post.findById(req.params.id).lean();
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const isOwner   = post.authorId.toString() === req.user.userId;
  const isAdmin   = req.user.role === 'admin';
  const isEditor  = req.user.role === 'editor' && post.status === 'draft'; // editors can edit drafts

  if (!isOwner && !isAdmin && !isEditor) {
    return res.status(403).json({ error: 'Access denied: you do not own this resource' });
  }

  req.post = post; // attach to request for downstream handlers
  next();
};

// Team-based ABAC: manager can only view their team's data
const canViewTeamData = async (req, res, next) => {
  const resource = await Resource.findById(req.params.id);
  const isAdmin     = req.user.role === 'admin';
  const sameTeam    = resource.teamId.toString() === req.user.teamId;
  const isManager   = req.user.role === 'manager' && sameTeam;

  if (!isAdmin && !isManager)
    return res.status(403).json({ error: 'You can only view your team\'s data' });
  next();
};
```

#### Cross Questions & Answers (RBAC & ABAC)

**Q1. When should you choose ABAC over RBAC?**
> Use RBAC when: access rules are static and predictable (admin/editor/viewer is enough). Use ABAC when: you need **resource-level** ownership checks ("user can only edit their own data"), **environmental** conditions ("read-only on weekends"), **relationship-based** conditions ("manager can only access their team"), or complex combinations of multiple attributes. Many real systems use RBAC for coarse-grained access and ABAC for fine-grained within a role.

**Q2. How do you cache RBAC permission checks at scale (millions of requests)?**
> Embed the user's resolved permissions directly in the JWT payload at login time. This avoids a DB or Redis lookup on every request — the middleware just reads `req.user.permissions` from the verified token. The tradeoff: if a role changes, the user must log in again (or you must revoke their token). For near-real-time role updates, use a Redis cache with a short TTL (60 seconds) and fall back to DB on miss.

**Q3. How would you implement a permission system where a user can delegate their permissions to another user temporarily?**
> This is a **delegation/impersonation** pattern. Store delegations in a DB table: `{ fromUserId, toUserId, permissions[], expiresAt }`. In the auth middleware, after loading the user's direct permissions, also query active delegations for this user and merge the permissions. Include `delegatedFrom` in the audit log so you know who actually granted the permission. Always scope delegations narrowly (time-limited, permission-limited).

**Q4. What is ReBAC (Relationship-Based Access Control)?**
> ReBAC determines access based on the **relationship graph** between users and resources. Google Zanzibar is the famous implementation. Example: "user can edit document X if user is a member of team Y which owns folder Z which contains document X." This handles deeply nested organizational hierarchies. Node.js implementations include OpenFGA (open-source Zanzibar). Use for complex enterprise authorization, not typical apps.

---

## 4. Scaling & Rate Limiting

---

### 4.1 Horizontal Scaling Architecture

#### Definition
Horizontal scaling means adding more server instances behind a load balancer rather than making one server bigger. Node.js's single-threaded nature means a single instance can only use one CPU core. To handle 1M+ requests, you need: multi-core usage (PM2 cluster), multiple servers (NGINX load balancer), shared state (Redis), async workloads (Kafka), and database read distribution (read replicas).

```
Client Requests
    ↓
CDN (CloudFront) — cache static assets at edge, reduce origin load
    ↓
NGINX (Load Balancer + Rate Limiter + SSL Termination)
    ↓                    ↓                    ↓
Node Instance 1    Node Instance 2    Node Instance 3    (each PM2 cluster: 8 cores)
    ↓                    ↓                    ↓
              Redis Cluster (shared state: sessions, cache, rate limits)
                          ↓
              Kafka Cluster (async job queue)
              ↓              ↓              ↓
         Email Worker   Analytics Worker   Notification Worker
                          ↓
              PostgreSQL Primary  +  Read Replicas (×3)
```

```bash
# PM2 cluster mode — spawn one worker per CPU core
pm2 start ecosystem.config.js

# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'api',
    script: './src/app.js',
    instances: 'max',        // one per CPU core
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      UV_THREADPOOL_SIZE: 16
    }
  }]
};
```

```nginx
# NGINX least_conn load balancing
upstream nodejs_api {
  least_conn;                    # route to server with fewest active connections
  server 10.0.0.1:3000;
  server 10.0.0.2:3000;
  server 10.0.0.3:3000;
  keepalive 32;                  # maintain persistent connections to backends
}

server {
  listen 443 ssl http2;
  location /api/ {
    proxy_pass         http://nodejs_api;
    proxy_http_version 1.1;
    proxy_set_header   Connection '';    # enable keepalive
    proxy_read_timeout 30s;
    proxy_connect_timeout 5s;
  }
}
```

#### Cross Questions & Answers

**Q1. What is the difference between `least_conn` and `round_robin` in NGINX?**
> `round_robin` (default) distributes requests evenly regardless of server load. `least_conn` routes each request to the server with the fewest active connections. `least_conn` is better when requests have variable processing times — a slow server accumulates connections and gets fewer new ones. `ip_hash` always routes the same client IP to the same server (sticky sessions) — useful for stateful protocols like WebSocket if you can't use Redis for state.

**Q2. How do you achieve zero-downtime deployment with Node.js?**
> Use PM2's `pm2 reload app` which performs a **rolling restart** — it restarts workers one at a time, keeping others serving traffic. Each new worker must emit `ready` signal before the old one is killed. For Kubernetes, use `RollingUpdate` strategy with `readinessProbe` pointing to a `/health` endpoint — a pod only receives traffic after passing the probe. Implement a `SIGTERM` handler to finish in-flight requests before exiting (graceful shutdown).

```js
// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Finishing in-flight requests...');
  server.close(async () => {
    await db.pool.end();
    await redis.quit();
    process.exit(0);
  });
  // Force exit after 30s if requests don't finish
  setTimeout(() => process.exit(1), 30000);
});
```

**Q3. How do you handle the thundering herd problem after a deployment?**
> Thundering herd: all new instances start simultaneously, all miss the cold cache, all hammer the DB. Solutions: (1) **Staggered startup** — add random startup delay per instance. (2) **Cache warming** — pre-populate critical cache keys before switching traffic. (3) **Circuit breakers** — detect DB overload and fast-fail. (4) **Jitter** — add randomness to cache TTLs so they don't all expire at the same time.

---

### 4.2 Distributed Rate Limiting

#### Definition
Rate limiting caps the number of requests from a client in a time window to prevent abuse, DoS attacks, and runaway clients. In a distributed system with multiple Node.js instances, each instance must share the rate limit counter — otherwise a client could hit all instances and exceed the limit.

**Algorithms:**
- **Fixed Window** — simple counter per window (e.g., 100 req per minute). Problem: allows burst of 200 at window boundary.
- **Sliding Window Log** — store timestamp of each request in a sorted set. Precise but memory-intensive.
- **Sliding Window Counter** — blend of fixed windows with partial interpolation. Good balance.
- **Token Bucket** — bucket fills at a rate, requests consume a token. Allows controlled bursts.
- **Leaky Bucket** — requests fill a queue processed at constant rate. Smooths traffic.

```js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

// Distributed rate limiter using Redis as shared store
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 100,               // 100 requests per IP per minute
  standardHeaders: true,  // sends X-RateLimit-* headers
  legacyHeaders: false,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:api:',   // namespaced key
  }),
  keyGenerator: (req) => req.user?.userId || req.ip, // per-user when authenticated
  handler: (req, res) => res.status(429).json({
    error: 'Too many requests',
    retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
  }),
  skip: (req) => req.user?.plan === 'enterprise', // exempt premium users
});

// Different limits for different routes
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 10 }); // 10 login attempts per 15min

app.use('/api/', apiLimiter);
app.use('/auth/login', authLimiter);
```

```js
// Custom sliding window with Lua (atomic operations)
const slidingWindowScript = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])
  local limit = tonumber(ARGV[3])
  local clearBefore = now - window

  redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)
  local count = redis.call('ZCARD', key)

  if count < limit then
    redis.call('ZADD', key, now, now .. '-' .. math.random(1000000))
    redis.call('EXPIRE', key, math.ceil(window / 1000))
    return { 1, limit - count - 1 }
  end
  return { 0, 0 }
`;

async function checkRateLimit(userId, limitPerMinute = 100) {
  const [allowed, remaining] = await redis.eval(
    slidingWindowScript, 1,
    `rl:${userId}`,
    Date.now(),
    60000,        // 60 second window in ms
    limitPerMinute
  );
  return { allowed: !!allowed, remaining };
}
```

#### Cross Questions & Answers

**Q1. Why must rate limiting use Lua scripts in Redis?**
> Without atomicity, there's a race condition. Two concurrent requests both do: `ZCARD key` → get 99 → both decide 99 < 100 → both add their entry → count is now 101. The Lua script runs atomically in Redis — no other command executes between `ZCARD` and `ZADD`. This is the same reason database transactions exist. Redis executes each Lua script as a single atomic operation.

**Q2. What happens to rate limiting if Redis goes down?**
> With `express-rate-limit + RedisStore`, you have two options: (1) **Fail open** — if Redis is unavailable, skip rate limiting and let all requests through. The service stays up but unprotected. (2) **Fail closed** — reject all requests if Redis is down. Secure but causes downtime. Best practice: fail open with an **in-memory fallback** rate limiter per instance (not globally accurate but better than nothing) and alert immediately on Redis failure.

**Q3. How do you handle rate limiting for APIs with different tiers (free/pro/enterprise)?**
> Use a composite key and dynamic limits: look up the user's plan from Redis/DB (cache aggressively), then apply the corresponding limit. Example: free=100/min, pro=1000/min, enterprise=unlimited. Implement this as middleware that sets `req.rateLimit.max` dynamically before the rate limit check. Store the user's tier in the JWT to avoid a DB lookup on every request.

---

## 5. System Design & Microservices

---

### 5.1 Microservices Communication Patterns

#### Definition
**Synchronous** communication: one service calls another and waits for a response. The caller is blocked until a response arrives. Tight coupling in time — if the downstream service is slow, the caller is slow.

**Asynchronous** communication: the caller publishes a message to a broker (Kafka/RabbitMQ) and immediately continues. The downstream service processes the message independently. Loose coupling, better resilience.

**When to use each:**
- Sync (REST/gRPC): auth checks, real-time data needs (payment status), user-facing reads
- Async (Kafka/SQS): emails, notifications, audit logs, analytics, image processing, data sync

#### Cross Questions & Answers

**Q1. What is the SAGA pattern and when do you need it?**
> SAGA handles distributed transactions where a single business operation spans multiple microservices. Instead of a two-phase commit (which is blocking and doesn't scale), SAGA breaks the transaction into a sequence of local transactions, each publishing an event. If a step fails, **compensating transactions** undo previous steps.

> **Choreography SAGA** — each service listens for events and reacts. Decentralized. Good for simple flows. Hard to debug complex flows (no central view).

> **Orchestration SAGA** — a central `OrderSaga` coordinator sends commands to each service and tracks state. Easier to debug and monitor. The coordinator is a potential single point of failure (mitigated by making it stateless + event-sourced).

**Q2. What is the Outbox Pattern and what problem does it solve?**
> The dual-write problem: writing to your DB and publishing to Kafka are two separate operations. If your app crashes between them, one succeeds and the other doesn't — your system is inconsistent.

> The Outbox Pattern solves this atomically: in the same DB transaction as your business data write, also insert an `outbox` record. A separate poller/relay process reads unpublished outbox records and publishes them to Kafka, marking them as published. Either both the DB write and the outbox entry happen, or neither does — guaranteed by the transaction.

**Q3. What is a circuit breaker and how does it prevent cascade failures?**
> Without a circuit breaker: Service A calls Service B. B is slow/down. A's requests pile up waiting. A's thread pool exhausts. A becomes slow too. Services C and D that call A also slow down. The whole system cascades.

> Circuit breaker wraps the call to B. It tracks failure rates. After a threshold (e.g., 50% of 20 requests fail), it **opens** the circuit — subsequent calls immediately return a fallback response without actually calling B. After a timeout, it enters **half-open** state and allows one test request. If it succeeds, the circuit closes. If not, it stays open. This gives B time to recover without being hammered.

**Q4. gRPC vs REST — when do you choose each for internal microservices?**
> **gRPC advantages**: HTTP/2 multiplexing, binary Protobuf (3-10× smaller than JSON), strongly-typed contracts via `.proto` files, bi-directional streaming, auto-generated client/server code in any language. **REST advantages**: human-readable JSON, universal tooling (curl, Postman, browsers), easier to debug, no code generation step.

> Choose gRPC for internal service-to-service calls where performance and contract enforcement matter. Choose REST for public APIs (broader client support) and simple internal services where developer velocity > performance optimization.

---

### 5.2 CQRS & Event Sourcing

#### Definition
**CQRS (Command Query Responsibility Segregation)** separates the write model (Commands → mutate state) from the read model (Queries → read optimized views). The read model is updated asynchronously via events from the write model and can use a different, query-optimized store (Elasticsearch, Redis, materialized views).

**Event Sourcing** stores every state change as an **immutable event** in an event log. The current state is never stored directly — it is derived by replaying all events from the beginning (or from a snapshot). This gives a complete audit trail and the ability to reconstruct state at any point in time.

#### Cross Questions & Answers

**Q1. What is the main operational challenge of event sourcing?**
> **Schema evolution** — old events must remain replayable as your domain model changes over years. If you rename a field in your event schema, all historical events still have the old field name. Solutions: upcasters (functions that transform old event schemas to new ones during replay), versioned event types (`UserCreatedV1`, `UserCreatedV2`). This requires significant discipline and tooling.

**Q2. What is a snapshot in event sourcing?**
> Replaying thousands of events to rebuild state is slow. A snapshot is a periodic capture of the aggregate's state at a specific event sequence number. To rebuild state, load the latest snapshot and replay only events after that sequence number. Snapshots are stored separately from the event log and can be regenerated at any time.

**Q3. What is eventual consistency in CQRS and how do you handle it in the UI?**
> After a Command succeeds (write), the read model updates asynchronously. There is a lag (typically milliseconds to seconds) during which the read model doesn't reflect the latest write. A user submits a form and immediately queries — they might see stale data.

> Strategies: (1) **Optimistic UI** — update the UI immediately with the submitted data without waiting for the read model. (2) **Version tracking** — the command returns a version number; the UI polls until the read model version matches. (3) **Read-your-own-writes** — for the 5 seconds after a mutation, route the user's reads to the primary DB instead of the read replica.

---

## 6. Database Optimization

---

### 6.1 Indexing Strategy

#### Definition
A database index is a separate data structure (usually a B-tree) that allows the DB to find rows matching a WHERE clause in O(log n) time instead of scanning every row O(n). The tradeoff: indexes speed up reads but slow down writes (every INSERT/UPDATE/DELETE must update all indexes on the affected columns).

**Index types:**
- **Single-field index** — one column. Fast for equality and range queries on that column.
- **Compound index** — multiple columns. Covers queries filtering/sorting on those columns together. Column order matters: must match query pattern from left.
- **Unique index** — enforces uniqueness + fast lookup (email, username).
- **TTL index** (MongoDB) — automatically deletes documents after a time period.
- **Text index** — full-text search.
- **Partial index** — indexes only a subset of rows (e.g., only active users).

```js
// MongoDB: compound index matching query + sort pattern
db.posts.createIndex({ authorId: 1, createdAt: -1 }); // query by authorId, sort by date
db.posts.createIndex({ status: 1, createdAt: -1 }, { partialFilterExpression: { status: 'published' } });
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // TTL

// ALWAYS explain before deploying a query
db.posts.find({ authorId: userId, status: 'published' })
        .sort({ createdAt: -1 })
        .limit(10)
        .explain('executionStats');
// Look for: "COLLSCAN" (bad) vs "IXSCAN" (good), totalDocsExamined vs nReturned
```

```sql
-- PostgreSQL: EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT p.*, u.name FROM posts p
JOIN users u ON p.author_id = u.id
WHERE p.status = 'published' AND p.author_id = $1
ORDER BY p.created_at DESC
LIMIT 10;
-- Look for: Seq Scan (bad) vs Index Scan (good), actual vs estimated rows
```

#### Cross Questions & Answers

**Q1. What is the N+1 query problem and how do you fix it?**
> N+1 occurs when you load a list of N items and then make one query per item for related data. Example: load 50 blog posts (1 query), then for each post, fetch the author (50 queries) = 51 queries total.

> Fix with **DataLoader** (batching + caching): DataLoader collects all `userId` loads within the same event loop tick and makes a single batched query `WHERE id IN (...)`. Results are cached for the request lifecycle. This turns 51 queries into 2 queries regardless of list size.

```js
const DataLoader = require('dataloader');
const userLoader = new DataLoader(async (userIds) => {
  const users = await db.query('SELECT * FROM users WHERE id = ANY($1)', [userIds]);
  const map = new Map(users.rows.map(u => [u.id, u]));
  return userIds.map(id => map.get(id) || null); // must match order
});

// In resolver/handler — loads are auto-batched within same tick
const posts = await Post.findAll();
const postsWithAuthors = await Promise.all(
  posts.map(async post => ({ ...post, author: await userLoader.load(post.authorId) }))
);
// Result: 2 queries total (1 for posts, 1 batched for all authors)
```

**Q2. What is a covering index?**
> A covering index contains all the columns needed to satisfy a query — the DB can answer the query entirely from the index without touching the actual table rows (no "heap fetch"). For example, if your query is `SELECT title, status FROM posts WHERE author_id = $1`, an index on `(author_id, title, status)` covers the query entirely. This is the fastest possible read — especially valuable for hot queries.

**Q3. When does adding an index hurt performance?**
> (1) **Write-heavy tables** — every write must maintain all indexes. A table with 10 indexes has 10 index updates per row write. (2) **Low-cardinality columns** — a boolean column has only 2 values. An index on it means the query planner must fetch 50% of the table anyway and may prefer a seq scan. (3) **Small tables** — a seq scan on a 1000-row table is faster than an index lookup due to overhead. Always measure with EXPLAIN ANALYZE.

---

### 6.2 Connection Pooling

#### Definition
Creating a new database connection for every request is expensive: TCP handshake, authentication, server-side process/thread creation — typically 5-20ms per connection. A connection pool pre-creates N connections and reuses them. Requests borrow a connection from the pool, use it, and return it.

```js
const { Pool } = require('pg');

const pool = new Pool({
  host:                   process.env.DB_HOST,
  database:               process.env.DB_NAME,
  user:                   process.env.DB_USER,
  password:               process.env.DB_PASS,
  max:                    20,    // max pool size — tune based on DB server limits
  min:                    5,     // keep 5 connections warm
  idleTimeoutMillis:      30000, // close idle connections after 30s
  connectionTimeoutMillis:2000,  // fail fast if can't get connection in 2s
  statement_timeout:      30000, // kill queries running > 30s
});

// Pool events for monitoring
pool.on('error', (err) => logger.error('Idle pool connection error', err));
pool.on('connect', () => metrics.gauge('db.pool.connections', pool.totalCount));
pool.on('acquire', () => metrics.gauge('db.pool.waiting', pool.waitingCount));

// Helper with automatic connection release
const query = (text, params) => pool.query(text, params);

// For transactions, explicitly get/release a client
const transfer = async (fromId, toId, amount) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, fromId]);
    await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, toId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release(); // ALWAYS release, even on error
  }
};
```

#### Cross Questions & Answers

**Q1. How do you size a connection pool?**
> Rule of thumb: `pool_size = (number_of_cores * 2) + effective_spindle_count`. For most cloud DBs, start with 10-25 connections per app instance. Too many connections overwhelm the DB server (PostgreSQL creates a process per connection). With many app instances, use PgBouncer (a connection pooler sitting in front of PostgreSQL) — it multiplexes thousands of app connections onto a small number of actual DB connections.

**Q2. What happens if a connection is never released back to the pool?**
> The connection is "leaked" — it stays borrowed forever. Over time, all connections are leaked, and new requests wait forever for a free connection (or timeout). `connectionTimeoutMillis` causes requests to fail-fast instead of hanging. To detect leaks: monitor `pool.waitingCount` and `pool.idleCount`. Use a statement timeout to kill hung queries. In tests, track acquired vs released counts.

---

## 7. Caching Strategies

---

### 7.1 Cache Patterns

#### Definition
**Cache-Aside (Lazy Loading)** — the application checks the cache first. On a miss, it fetches from the DB and populates the cache. The application manages the cache explicitly. Most common pattern.

**Write-Through** — every write goes to both the cache and the DB simultaneously. Cache is always consistent with the DB. Higher write latency but eliminates stale reads.

**Write-Behind (Write-Back)** — writes go to the cache immediately and the DB asynchronously. Very fast writes but risk of data loss if the cache fails before flushing. Use for non-critical data.

**Cache Stampede (Thundering Herd)** — a popular cached key expires. Hundreds of simultaneous requests all miss and all query the DB simultaneously, overloading it. Prevention: distributed lock, probabilistic early expiration, or background refresh.

```js
const redis = require('redis').createClient({ url: process.env.REDIS_URL });

// Cache-Aside with stampede protection using distributed lock
const getWithCache = async (key, fetchFn, ttlSeconds = 3600) => {
  // 1. Try cache
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // 2. Cache miss — acquire lock (NX = only set if not exists, PX = millisecond TTL)
  const lockKey = `lock:${key}`;
  const lockAcquired = await redis.set(lockKey, '1', { NX: true, PX: 5000 });

  if (!lockAcquired) {
    // Another process is fetching — wait briefly and retry
    await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
    return getWithCache(key, fetchFn, ttlSeconds); // recursive retry
  }

  try {
    // 3. Fetch from source
    const data = await fetchFn();
    // 4. Cache the result
    await redis.setEx(key, ttlSeconds, JSON.stringify(data));
    return data;
  } finally {
    await redis.del(lockKey); // always release lock
  }
};

// Invalidate on write
const updateUser = async (userId, patch) => {
  const user = await User.findByIdAndUpdate(userId, patch, { new: true });
  await redis.del(`user:${userId}`); // invalidate cache
  return user;
};

// Cache warming: preload on startup for critical data
const warmCache = async () => {
  const topProducts = await Product.find().sort({ views: -1 }).limit(100);
  const pipeline = redis.multi();
  topProducts.forEach(p => pipeline.setEx(`product:${p.id}`, 3600, JSON.stringify(p)));
  await pipeline.exec();
  console.log('Cache warmed with top 100 products');
};
```

#### Cross Questions & Answers

**Q1. What is the difference between cache invalidation and cache eviction?**
> **Invalidation** is deliberate removal of a specific key when the underlying data changes (write-triggered). You control when it happens. **Eviction** is automatic removal by the cache to free memory when it fills up. Redis eviction policies: `allkeys-lru` (evict least recently used from all keys), `volatile-lru` (LRU only from keys with TTL set), `noeviction` (reject new writes when full — use for critical data). For a cache, `allkeys-lru` is usually the right policy.

**Q2. How do you handle cache consistency with read replicas?**
> Write path: write to primary DB → invalidate cache. Read path: cache miss → read from replica → populate cache. Problem: if there's replication lag, you might cache stale data from the replica right after a write. Solution: for the first few seconds after a write (longer than typical replication lag), read the user's own data from the primary. Use a "dirty flag" per user in Redis: set it on write, read from primary while flag is set, clear after replication lag window.

**Q3. What is probabilistic early expiration (PER)?**
> Instead of waiting for a key to fully expire and then having a stampede, PER adds randomness: each cache read probabilistically decides to refresh the key slightly before it expires based on how long the last fetch took. Keys that are expensive to compute get refreshed more eagerly. This spreads refreshes over time, eliminating the stampede. Formula: `should_refresh = (current_time + beta * log(random)) > (expiry_time - compute_time * delta)`.

---

## 8. Message Queues

---

### 8.1 Kafka vs RabbitMQ

#### Definition
**Apache Kafka** — a distributed event log. Messages (events) are written to topics and retained for a configurable period (hours/days/forever). Consumers track their own read position (offset). Multiple independent consumer groups can each read all messages. Designed for very high throughput and event streaming.

**RabbitMQ** — a traditional message broker. Messages are routed to queues via exchanges. Once consumed and acknowledged, messages are deleted. Push-based (broker pushes to consumers). Richer routing patterns (fanout, topic, headers). Better for task queues and RPC.

| | Kafka | RabbitMQ |
|---|---|---|
| Model | Pull (consumers track offset) | Push (broker delivers) |
| Message persistence | Days/weeks/forever | Until consumed |
| Throughput | ~1M msg/sec | ~50K-100K msg/sec |
| Replay | Yes | No |
| Multiple consumers | Yes (each group gets all) | Competing consumers (one gets each) |
| Routing | Topic-based | Exchange/binding (complex) |
| Best for | Event streaming, analytics | Task queues, RPC, complex routing |

#### Cross Questions & Answers

**Q1. What is a Kafka consumer group and how does partitioning work?**
> A **consumer group** is a set of consumer instances that collectively consume a topic. Each partition in the topic is assigned to exactly one consumer in the group. This enables parallel processing — a topic with 10 partitions can be processed by up to 10 consumers in parallel. Two different consumer groups each receive **all** messages independently. Example: an `email-service` group and an `analytics-service` group both receive every `ORDER_PLACED` event.

**Q2. How do you guarantee exactly-once processing in Kafka?**
> Kafka natively provides: **at-most-once** (commit before processing — can lose messages on crash) and **at-least-once** (commit after processing — may reprocess on crash). **Exactly-once** requires: (1) Kafka Transactions — group producer sends and consumer offset commits into one atomic transaction. (2) Idempotent consumers — store processed event IDs in a DB with a unique constraint; duplicate processing fails silently. In practice, idempotent at-least-once is simpler and sufficient for most systems.

**Q3. What is a Dead Letter Queue (DLQ)?**
> When a message fails processing repeatedly (network error, validation failure, poison message), it should not block the main queue forever. After N retries, it's sent to a Dead Letter Queue — a separate topic/queue for failed messages. An operator can inspect DLQ messages, fix the bug, and replay them. Without a DLQ, a single bad message can starve an entire consumer if retried indefinitely.

---

## 9. Security Best Practices

---

### 9.1 OWASP Top Risks for Node.js

#### Cross Questions & Answers

**Q1. Explain SQL injection and how to prevent it in Node.js.**
> SQL injection: user input is concatenated into a SQL string and interpreted as SQL code. `SELECT * FROM users WHERE email = '${req.body.email}'` — if email is `' OR 1=1 --`, this returns all users.

> Prevention: always use **parameterized queries** (prepared statements). The driver sends SQL and data separately — the DB never interprets data as code: `pool.query('SELECT * FROM users WHERE email = $1', [req.body.email])`. ORMs like Sequelize/Prisma do this by default. Never use string concatenation or template literals to build queries.

**Q2. What is XSS and how do you prevent it in a Node.js API?**
> XSS (Cross-Site Scripting): malicious scripts stored in your DB (stored XSS) or reflected via URL (reflected XSS) get served to other users' browsers and execute with their session. For APIs serving JSON, the main risks are: (1) Serving HTML responses with unescaped user data. (2) Not setting proper `Content-Type: application/json` (browser won't execute JSON as HTML).

> Prevention: (1) `Content-Security-Policy` header restricts which scripts can run. (2) Escape all user-provided data before including in HTML responses. (3) Use `helmet()` which sets CSP and other protective headers. (4) `HttpOnly` cookies prevent script access to session tokens.

**Q3. What is CSRF and how do you protect against it?**
> CSRF (Cross-Site Request Forgery): a malicious site tricks an authenticated user's browser into making requests to your API. Since browsers automatically include cookies, the request appears legitimate.

> Prevention: (1) `SameSite=Strict` cookies — browsers won't send them on cross-origin requests. (2) CSRF token — a secret value embedded in forms, verified server-side. Requests without the token are rejected. (3) Check the `Origin` / `Referer` header for state-mutating requests. (4) Custom request headers (e.g., `X-Requested-With: XMLHttpRequest`) — simple requests can't set custom headers, but AJAX can.

**Q4. What is dependency vulnerability management?**
> Node.js apps typically have hundreds of npm dependencies, each potentially having known vulnerabilities. Best practices: (1) `npm audit` in CI/CD pipeline — fails build on high-severity vulnerabilities. (2) `npm audit fix` to auto-patch. (3) `Dependabot` or `Snyk` for automated PRs when new vulnerabilities are found. (4) Pin exact versions in `package-lock.json` and commit it. (5) Minimize dependencies — every package is a potential attack surface.

---

## 10. Coding Patterns

---

### 10.1 Promise Implementations

#### Definition
Promises represent the eventual result of an async operation. Key methods:
- `Promise.all` — resolves when all resolve; rejects on first rejection
- `Promise.allSettled` — waits for all, never rejects, returns status of each
- `Promise.race` — resolves/rejects with the first settled promise
- `Promise.any` — resolves with first fulfilled promise; rejects only if all reject

```js
// Promise.all from scratch
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const arr = Array.from(promises);
    if (arr.length === 0) return resolve([]);

    const results = new Array(arr.length);
    let completedCount = 0;

    arr.forEach((promise, index) => {
      Promise.resolve(promise)    // handle non-promise values
        .then(value => {
          results[index] = value; // preserve input order, not completion order
          completedCount++;
          if (completedCount === arr.length) resolve(results);
        })
        .catch(reject);           // reject immediately on first failure
    });
  });
}

// Promise.allSettled from scratch
function promiseAllSettled(promises) {
  return new Promise((resolve) => {
    const arr = Array.from(promises);
    if (arr.length === 0) return resolve([]);

    const results = new Array(arr.length);
    let settledCount = 0;

    const checkDone = () => { if (++settledCount === arr.length) resolve(results); };

    arr.forEach((promise, index) => {
      Promise.resolve(promise)
        .then(value  => { results[index] = { status: 'fulfilled', value  }; checkDone(); })
        .catch(reason => { results[index] = { status: 'rejected',  reason }; checkDone(); });
    });
  });
}
```

---

### 10.2 Async Concurrency Control

#### Definition
Processing a large array of async tasks without a concurrency limit can overwhelm downstream services (DB, external APIs). `asyncPool` maintains exactly N concurrent tasks at all times — as soon as one completes, the next starts, maintaining result order.

```js
async function asyncPool(concurrencyLimit, items, asyncFn) {
  const results = [];
  const executing = new Set();

  for (const [index, item] of items.entries()) {
    // Wrap in a resolved promise for consistency
    const taskPromise = Promise.resolve().then(() => asyncFn(item, index));
    results.push(taskPromise);
    executing.add(taskPromise);

    // Clean up completed tasks
    taskPromise.finally(() => executing.delete(taskPromise));

    // When pool is full, wait for the fastest task to complete
    if (executing.size >= concurrencyLimit) {
      await Promise.race(executing);
    }
  }

  // Wait for all remaining tasks
  return Promise.all(results);
}

// Example: fetch 500 URLs, max 10 concurrent
const results = await asyncPool(10, urls, async (url) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  return res.json();
});
```

---

### 10.3 EventEmitter from Scratch

```js
class EventEmitter {
  constructor() {
    this._events = new Map();
    this._maxListeners = 10; // warn if exceeded (potential leak)
  }

  on(event, listener) {
    if (!this._events.has(event)) this._events.set(event, []);
    const listeners = this._events.get(event);

    if (listeners.length >= this._maxListeners) {
      console.warn(`MaxListenersExceededWarning: ${event} has ${listeners.length + 1} listeners`);
    }
    listeners.push(listener);
    return this;
  }

  off(event, listener) {
    const listeners = this._events.get(event);
    if (!listeners) return this;
    // Filter out the listener and its once-wrappers
    this._events.set(event, listeners.filter(l => l !== listener && l._original !== listener));
    return this;
  }

  once(event, listener) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      listener.apply(this, args);
    };
    wrapper._original = listener; // allow off() to find and remove the wrapper
    return this.on(event, wrapper);
  }

  emit(event, ...args) {
    const listeners = this._events.get(event);
    if (!listeners || listeners.length === 0) return false;

    // Snapshot the array — a listener might remove itself during emit
    const snapshot = [...listeners];
    snapshot.forEach(listener => {
      try {
        listener.apply(this, args);
      } catch (err) {
        this.emit('error', err); // forward errors to 'error' event
      }
    });
    return true;
  }

  removeAllListeners(event) {
    if (event) this._events.delete(event);
    else this._events.clear();
    return this;
  }

  listenerCount(event) {
    return this._events.get(event)?.length ?? 0;
  }
}
```

---

### 10.4 LRU Cache

```js
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // Map preserves insertion order — key to this implementation
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const value = this.map.get(key);
    // Refresh: delete and re-insert moves key to end (most recently used)
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.map.has(key)) this.map.delete(key); // remove first to refresh position
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      // map.keys().next().value = first key = least recently used
      this.map.delete(this.map.keys().next().value);
    }
  }
}

// Production version with TTL
class TTLLRUCache extends LRUCache {
  constructor(capacity, ttlMs) {
    super(capacity);
    this.ttl = ttlMs;
    this.expiry = new Map(); // key → expiry timestamp
  }

  get(key) {
    if (this.expiry.has(key) && Date.now() > this.expiry.get(key)) {
      this.map.delete(key);
      this.expiry.delete(key);
      return -1; // expired
    }
    return super.get(key);
  }

  put(key, value) {
    super.put(key, value);
    this.expiry.set(key, Date.now() + this.ttl);
  }
}
```

---

### 10.5 Debounce & Throttle

#### Definition
**Debounce** — delays execution until N milliseconds of inactivity. If the function is called again before the delay expires, the timer resets. Use for: search input (don't query on every keystroke), auto-save (don't save on every character), resize events.

**Throttle** — executes at most once every N milliseconds regardless of call frequency. Use for: scroll event handlers, API polling, metrics flushing, rate limiting outgoing calls.

```js
function debounce(fn, delayMs) {
  let timerId = null;

  const debounced = function(...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      fn.apply(this, args);
    }, delayMs);
  };

  debounced.cancel = () => { clearTimeout(timerId); timerId = null; };
  debounced.flush  = function(...args) { clearTimeout(timerId); fn.apply(this, args); };

  return debounced;
}

function throttle(fn, intervalMs) {
  let lastCallTime = 0;
  let pendingTimer = null;

  const throttled = function(...args) {
    const now = Date.now();
    const timeUntilNextAllowed = intervalMs - (now - lastCallTime);

    if (timeUntilNextAllowed <= 0) {
      // Execute immediately
      clearTimeout(pendingTimer);
      pendingTimer = null;
      lastCallTime = now;
      fn.apply(this, args);
    } else if (!pendingTimer) {
      // Schedule for the end of the interval
      pendingTimer = setTimeout(() => {
        lastCallTime = Date.now();
        pendingTimer = null;
        fn.apply(this, args);
      }, timeUntilNextAllowed);
    }
  };

  throttled.cancel = () => { clearTimeout(pendingTimer); pendingTimer = null; };

  return throttled;
}

// Backend use: batch DB writes — flush at most every 5 seconds
const flushMetricsToDB = throttle(async (metricsBuffer) => {
  await db.metrics.insertMany(metricsBuffer);
  metricsBuffer.length = 0; // clear the buffer
}, 5000);
```

---

## 11. Key Numbers Cheatsheet

| Metric | Value | Notes |
|---|---|---|
| Redis GET/SET latency | ~0.1ms | In-process with small data |
| DB query — indexed | 1–5ms | PostgreSQL/MongoDB on SSD |
| DB query — full table scan | 100ms – 10s | Depends on table size |
| New DB connection overhead | 5–20ms | Reason for connection pooling |
| Node.js (single core) | 10K–50K req/sec | Simple JSON API |
| Node.js cluster (8 cores, PM2) | 200K–400K req/sec | With Redis, no DB |
| NGINX | 500K–1M req/sec | Static or proxy |
| Kafka throughput | ~1M msg/sec | Per partition, with batching |
| Default libuv thread pool size | 4 threads | Set UV_THREADPOOL_SIZE before start |
| V8 default heap limit (64-bit) | ~1.5 GB | Increase with --max-old-space-size |
| JWT access token lifetime | 15 minutes | Recommended |
| JWT refresh token lifetime | 7 days | Store in Redis |
| Redis max memory eviction | allkeys-lru | For cache use case |
| bcrypt hash cost factor 12 | ~250ms per hash | On a typical server, per thread |

---

## 12. Full Revision Checklist

| # | Topic | Category | Priority |
|---|---|---|---|
| 1 | Event loop phases & phase order | Internals | 🔴 Must Know |
| 2 | process.nextTick vs setImmediate vs Promise | Internals | 🔴 Must Know |
| 3 | Streams, backpressure, pipeline() | Internals | 🔴 Must Know |
| 4 | Cluster vs Worker Threads — when to use each | Internals | 🔴 Must Know |
| 5 | V8 Young Gen / Old Gen GC | Internals | 🟡 Important |
| 6 | Memory leak detection (heap snapshots, clinic.js) | Internals | 🟡 Important |
| 7 | libuv thread pool — what uses it, how to tune | Internals | 🟡 Important |
| 8 | ESM vs CJS — import/require differences | Internals | 🟡 Important |
| 9 | JWT access + refresh token architecture | Auth | 🔴 Must Know |
| 10 | Token blacklisting with Redis | Auth | 🔴 Must Know |
| 11 | Token rotation on refresh | Auth | 🔴 Must Know |
| 12 | OAuth 2.0 Authorization Code flow | Auth | 🟡 Important |
| 13 | PKCE — why needed for SPAs | Auth | 🟡 Important |
| 14 | OAuth vs OIDC difference | Auth | 🟡 Important |
| 15 | RBAC implementation in Express middleware | AuthZ | 🔴 Must Know |
| 16 | ABAC ownership checks | AuthZ | 🔴 Must Know |
| 17 | RBAC vs ABAC — when to use which | AuthZ | 🟡 Important |
| 18 | PM2 cluster mode setup | Scaling | 🔴 Must Know |
| 19 | NGINX load balancing algorithms | Scaling | 🔴 Must Know |
| 20 | Distributed rate limiting with Redis + Lua | Scaling | 🔴 Must Know |
| 21 | Rate limit algorithm tradeoffs | Scaling | 🟡 Important |
| 22 | Graceful shutdown (SIGTERM) | Scaling | 🟡 Important |
| 23 | SAGA pattern (choreography vs orchestration) | Microservices | 🟡 Important |
| 24 | Outbox pattern (dual-write prevention) | Microservices | 🟡 Important |
| 25 | Circuit breaker pattern | Microservices | 🟡 Important |
| 26 | gRPC vs REST for internal services | Microservices | 🟡 Important |
| 27 | CQRS — command vs query model | System Design | 🟡 Important |
| 28 | Event sourcing — events as source of truth | System Design | 🟡 Important |
| 29 | DB indexing — compound, partial, TTL | Database | 🔴 Must Know |
| 30 | EXPLAIN ANALYZE — reading query plans | Database | 🔴 Must Know |
| 31 | N+1 problem + DataLoader fix | Database | 🔴 Must Know |
| 32 | Connection pooling — sizing and leak detection | Database | 🔴 Must Know |
| 33 | Read replicas — routing and replication lag | Database | 🟡 Important |
| 34 | Cache-aside pattern with stampede protection | Caching | 🔴 Must Know |
| 35 | Cache invalidation strategies | Caching | 🟡 Important |
| 36 | Kafka consumer groups and offsets | Queues | 🟡 Important |
| 37 | Kafka vs RabbitMQ tradeoffs | Queues | 🟡 Important |
| 38 | Dead letter queues | Queues | 🟡 Important |
| 39 | SQL/NoSQL injection prevention | Security | 🔴 Must Know |
| 40 | Helmet.js security headers | Security | 🟡 Important |
| 41 | XSS, CSRF prevention | Security | 🟡 Important |
| 42 | Promise.all / allSettled from scratch | Coding | 🔴 Must Know |
| 43 | asyncPool — concurrency limiting | Coding | 🔴 Must Know |
| 44 | EventEmitter from scratch | Coding | 🔴 Must Know |
| 45 | LRU Cache with Map (O(1) get/put) | Coding | 🟡 Important |
| 46 | Debounce and Throttle implementations | Coding | 🟡 Important |

---

> **For Lead / Staff Level Interviews:**
> Every answer should follow the pattern: **What** → **Why** → **Tradeoffs** → **What you'd monitor after deploying it.**
> In system design rounds, drive the conversation — ask about scale, consistency requirements, and failure modes before designing. Show you think in terms of production systems, not just working code.

---

*Senior Node.js Developer Interview Guide — 9+ Years — Good Luck! 🎯*
