# 🚀 Node.js Senior Developer Interview Prep (9+ Years)
### Topics: Scaling, Authentication, Authorization & Performance

---

## 📌 TABLE OF CONTENTS

1. [Scaling Node.js Applications](#1-scaling-nodejs-applications)
2. [Authentication (AuthN)](#2-authentication-authn)
3. [Authorization (AuthZ)](#3-authorization-authz)
4. [Handling 1 Million+ API Requests](#4-handling-1-million-api-requests)
5. [Database Performance & Optimization](#5-database-performance--optimization)
6. [Caching Strategies](#6-caching-strategies)
7. [Message Queues & Event-Driven Architecture](#7-message-queues--event-driven-architecture)
8. [Security Best Practices](#8-security-best-practices)
9. [Advanced Interview Questions & Answers](#9-advanced-interview-questions--answers)
10. [System Design: 1M Requests Architecture](#10-system-design-1m-requests-architecture)

---

## 1. Scaling Node.js Applications

### 🔑 Key Concepts

Node.js is **single-threaded** — scaling requires deliberate architecture decisions.

### Vertical vs Horizontal Scaling

| Type | Description | When to Use |
|------|-------------|-------------|
| Vertical | Add more CPU/RAM to one server | Quick fix, limited ceiling |
| Horizontal | Add more server instances | Production-grade, preferred |

### Cluster Module (Multi-Core Usage)

```javascript
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  console.log(`Master ${process.pid} is running`);

  // Fork workers for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork(); // Auto-restart dead workers
  });
} else {
  require('./app'); // Each worker runs the Express app
  console.log(`Worker ${process.pid} started`);
}
```

### PM2 — Production Process Manager

```bash
# Install PM2
npm install -g pm2

# Run app in cluster mode across all CPU cores
pm2 start app.js -i max

# Monitor
pm2 monit

# Auto-restart on crash
pm2 startup
pm2 save
```

### Load Balancing with NGINX

```nginx
upstream nodejs_cluster {
  least_conn; # Route to least busy server
  server 127.0.0.1:3001;
  server 127.0.0.1:3002;
  server 127.0.0.1:3003;
  server 127.0.0.1:3004;
}

server {
  listen 80;
  location / {
    proxy_pass http://nodejs_cluster;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
  }
}
```

### ⚡ Interview Q: "How do you scale a Node.js app handling 1M users?"

> **Answer:** Use PM2 cluster mode to utilize all CPU cores, horizontal scaling across multiple servers behind an NGINX load balancer, Redis for shared session/cache state between instances, and a message queue (Kafka/RabbitMQ) to decouple heavy workloads from the request cycle. Deploy on Kubernetes for auto-scaling based on CPU/memory thresholds.

---

## 2. Authentication (AuthN)

### JWT (JSON Web Token) — Deep Dive

```javascript
const jwt = require('jsonwebtoken');
const redis = require('redis');
const client = redis.createClient();

// ✅ Generate Access + Refresh Token Pair
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // Short-lived
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // Long-lived
  );

  return { accessToken, refreshToken };
};

// ✅ Store refresh token in Redis (not DB for performance)
const storeRefreshToken = async (userId, refreshToken) => {
  await client.setEx(
    `refresh_token:${userId}`,
    7 * 24 * 60 * 60, // 7 days in seconds
    refreshToken
  );
};

// ✅ Refresh Token Endpoint
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check token exists in Redis (not revoked)
    const storedToken = await client.get(`refresh_token:${decoded.userId}`);
    if (!storedToken || storedToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Issue new token pair (Token Rotation)
    const tokens = generateTokens(decoded.userId, decoded.role);
    await storeRefreshToken(decoded.userId, tokens.refreshToken);

    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Token expired or invalid' });
  }
});
```

### Token Blacklisting (Logout / Revocation)

```javascript
// On logout — blacklist the access token until it naturally expires
const logout = async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.decode(token);
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);

  // Add to Redis blacklist
  await client.setEx(`blacklist:${token}`, ttl, '1');

  // Also delete refresh token
  await client.del(`refresh_token:${decoded.userId}`);

  res.json({ message: 'Logged out successfully' });
};

// Middleware — check blacklist on every request
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const isBlacklisted = await client.get(`blacklist:${token}`);
  if (isBlacklisted) return res.status(401).json({ error: 'Token revoked' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### OAuth 2.0 / SSO Flow

```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  // Find or create user in DB
  let user = await User.findOne({ googleId: profile.id });
  if (!user) {
    user = await User.create({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName
    });
  }
  done(null, user);
}));
```

### ⚡ Interview Q: "How do you handle JWT at scale with distributed servers?"

> **Answer:** Store refresh tokens in Redis (not the DB) for fast lookup and easy revocation. Use short-lived access tokens (15 min) and implement token rotation on refresh. Use a shared Redis instance (or Redis Cluster) across all Node.js instances so blacklisting/revocation is consistent across every server. Never store JWTs in localStorage — use HttpOnly cookies to prevent XSS.

---

## 3. Authorization (AuthZ)

### RBAC — Role-Based Access Control

```javascript
// Define roles and permissions
const permissions = {
  admin:   ['read', 'write', 'delete', 'manage_users'],
  editor:  ['read', 'write'],
  viewer:  ['read'],
};

// Middleware factory
const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    const userPermissions = permissions[req.user.role] || [];
    const hasAccess = requiredPermissions.every(p => userPermissions.includes(p));

    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

// Usage
app.delete('/posts/:id', authMiddleware, authorize('delete'), deletePost);
app.post('/posts',       authMiddleware, authorize('write'),  createPost);
app.get('/posts',        authMiddleware, authorize('read'),   getPosts);
```

### ABAC — Attribute-Based Access Control (Advanced)

```javascript
// More granular — user can only edit THEIR OWN posts
const canEditPost = async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) return res.status(404).json({ error: 'Post not found' });

  const isOwner = post.authorId.toString() === req.user.userId;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'You can only edit your own posts' });
  }

  req.post = post; // Attach to request for next handler
  next();
};
```

### ⚡ Interview Q: "RBAC vs ABAC — when do you use which?"

> **Answer:** RBAC is simpler — assign roles to users (admin, editor, viewer) and check role on each route. Best for most applications. ABAC is more granular — permissions are based on attributes (ownership, department, time of day). Use ABAC when you need fine-grained control like "a user can only edit their own data" or "managers can only view their team's records." In large systems, combine both.

---

## 4. Handling 1 Million API Requests

### Architecture Overview

```
Client → CDN (CloudFront) → Load Balancer (NGINX)
       → Node.js Cluster (PM2, multiple instances)
       → Redis Cache (check first)
       → Kafka Queue (for heavy processing)
       → Database (PostgreSQL / MongoDB with read replicas)
```

### Rate Limiting — Prevent Abuse

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const limiter = rateLimit({
  windowMs: 60 * 1000,     // 1 minute window
  max: 100,                 // Max 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({   // Shared across all instances
    client: redisClient,
    prefix: 'rl:',
  }),
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

app.use('/api/', limiter);
```

### Connection Pooling (Database)

```javascript
// PostgreSQL with pg-pool
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  max: 20,                  // Max pool connections
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000,
});

// Always use pool.query, not single clients
const getUser = async (userId) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  return result.rows[0];
};
```

### Async Processing with Kafka

```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({ brokers: ['kafka:9092'] });

// Producer — push work to queue (in API handler)
const producer = kafka.producer();
await producer.connect();

app.post('/api/send-email', authMiddleware, async (req, res) => {
  // Don't send email synchronously — queue it
  await producer.send({
    topic: 'email-notifications',
    messages: [{ value: JSON.stringify(req.body) }],
  });

  res.status(202).json({ message: 'Request accepted, processing asynchronously' });
});

// Consumer — separate worker process handles the actual work
const consumer = kafka.consumer({ groupId: 'email-service' });
await consumer.connect();
await consumer.subscribe({ topic: 'email-notifications' });

await consumer.run({
  eachMessage: async ({ message }) => {
    const data = JSON.parse(message.value.toString());
    await emailService.send(data);
  },
});
```

---

## 5. Database Performance & Optimization

### Indexing Strategy

```javascript
// MongoDB — compound index for common query patterns
db.users.createIndex({ email: 1 }, { unique: true });
db.posts.createIndex({ authorId: 1, createdAt: -1 }); // Compound index
db.logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // TTL index — auto-delete after 30 days

// Explain query performance
db.posts.find({ authorId: userId }).sort({ createdAt: -1 }).explain('executionStats');
```

### Read Replicas (Scale DB Reads)

```javascript
// Write to primary, read from replica
const primaryDB = new MongoClient(process.env.MONGO_PRIMARY);
const replicaDB = new MongoClient(process.env.MONGO_REPLICA);

const getPost = (id) => replicaDB.collection('posts').findOne({ _id: id }); // Reads → replica
const createPost = (data) => primaryDB.collection('posts').insertOne(data);  // Writes → primary
```

### ⚡ Interview Q: "Your DB query is slow — how do you debug it?"

> **Answer:** First, use `EXPLAIN ANALYZE` (SQL) or `.explain()` (MongoDB) to check if indexes are being used. Look for full table/collection scans. Add a compound index matching the query's filter + sort fields. Then check for N+1 query problems using query logging. Use connection pooling to avoid connection overhead. For read-heavy workloads, add a Redis cache layer with a TTL. If still slow, consider read replicas to offload read traffic from the primary.

---

## 6. Caching Strategies

### Redis Cache-Aside Pattern

```javascript
const getProductWithCache = async (productId) => {
  const cacheKey = `product:${productId}`;

  // 1. Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached); // Cache HIT ✅

  // 2. Cache MISS — query database
  const product = await Product.findById(productId);
  if (!product) return null;

  // 3. Store in cache with TTL
  await redis.setEx(cacheKey, 3600, JSON.stringify(product)); // 1 hour TTL

  return product;
};

// Invalidate cache on update
const updateProduct = async (productId, data) => {
  await Product.findByIdAndUpdate(productId, data);
  await redis.del(`product:${productId}`); // Bust the cache
};
```

### Cache Stampede Prevention

```javascript
// Problem: 1000 requests hit cache at same time when it expires
// Solution: Only let ONE request rebuild the cache

const getWithLock = async (key, fetchFn, ttl = 3600) => {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const lockKey = `lock:${key}`;
  const lock = await redis.set(lockKey, '1', { NX: true, EX: 5 }); // NX = only set if not exists

  if (!lock) {
    // Another process is rebuilding — wait briefly and retry
    await new Promise(r => setTimeout(r, 100));
    return getWithLock(key, fetchFn, ttl);
  }

  try {
    const data = await fetchFn();
    await redis.setEx(key, ttl, JSON.stringify(data));
    return data;
  } finally {
    await redis.del(lockKey); // Always release lock
  }
};
```

---

## 7. Message Queues & Event-Driven Architecture

### When to Use a Queue vs Direct Call

| Scenario | Direct API Call | Message Queue |
|----------|----------------|---------------|
| Get user profile | ✅ | ❌ |
| Send welcome email | ❌ | ✅ |
| Process payment | ❌ | ✅ |
| Real-time chat message | ❌ | ✅ (WebSocket + queue) |
| Image resize/upload | ❌ | ✅ |

### RabbitMQ vs Kafka

| Feature | RabbitMQ | Kafka |
|---------|----------|-------|
| Use Case | Task queues, RPC | High-throughput streaming |
| Message Retention | Until consumed | Configurable (days/weeks) |
| Throughput | Medium | Very High (millions/sec) |
| Replay | ❌ | ✅ |
| Best For | Microservices jobs | Event streaming, analytics |

---

## 8. Security Best Practices

### Input Validation & Sanitization

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/user', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/),
  body('name').trim().escape().isLength({ max: 50 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Safe to proceed
});
```

### Security Headers (Helmet)

```javascript
const helmet = require('helmet');

app.use(helmet());                          // Sets 11 security headers
app.use(helmet.hsts({ maxAge: 31536000 })); // Force HTTPS for 1 year
app.use(helmet.noSniff());                  // Prevent MIME sniffing
app.use(helmet.xssFilter());               // Basic XSS protection
```

### SQL Injection Prevention

```javascript
// ❌ NEVER do this
const query = `SELECT * FROM users WHERE email = '${req.body.email}'`;

// ✅ Always use parameterized queries
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [req.body.email]
);
```

---

## 9. Advanced Interview Questions & Answers

### Q1: What is the Node.js Event Loop and how does it work?

> **Answer:** Node.js runs on a single thread using an event loop powered by libuv. The loop has phases: timers (setTimeout/setInterval), I/O callbacks, idle/prepare, poll (waiting for I/O), check (setImmediate), and close callbacks. When async operations complete (I/O, network), their callbacks are pushed to the appropriate phase queue. `process.nextTick()` runs before the next event loop iteration — use sparingly as it can starve I/O.

### Q2: How do you prevent memory leaks in Node.js?

> **Answer:** Common causes: event listeners not removed, global variables accumulating data, closures holding references, uncleared intervals/timeouts. Solutions: always call `emitter.removeListener()` or `emitter.removeAllListeners()`, use `WeakMap`/`WeakSet` for object references, clear intervals with `clearInterval()`, and monitor with `process.memoryUsage()` and heap snapshots in Chrome DevTools or Clinic.js.

### Q3: Explain microservices communication patterns

> **Answer:** Two main patterns: synchronous (REST or gRPC — one service calls another and waits) and asynchronous (message queues like Kafka/RabbitMQ — fire and forget). Use synchronous when you need an immediate response (auth check). Use async for operations that can be deferred (emails, notifications, data sync). For service discovery, use a registry like Consul or rely on Kubernetes DNS.

### Q4: How do you handle distributed transactions across microservices?

> **Answer:** Traditional ACID transactions don't span services. Use the SAGA pattern: a sequence of local transactions, each publishing events. If one step fails, compensating transactions roll back prior steps. Two implementations: Choreography (each service reacts to events) and Orchestration (a central coordinator manages the saga). For simpler cases, use the Outbox Pattern — write to a local DB and an outbox table atomically, then a worker publishes the event.

### Q5: What's the difference between `process.nextTick()` and `setImmediate()`?

> **Answer:** `process.nextTick()` fires before the next event loop iteration — it has the highest priority and runs after the current operation completes but before any I/O. `setImmediate()` fires in the check phase, after I/O events. Use `process.nextTick()` to ensure a callback runs before I/O (e.g., emitting errors). Prefer `setImmediate()` for anything that shouldn't block I/O processing.

### Q6: How do you design an API for zero downtime deployment?

> **Answer:** Use versioned APIs (`/api/v1/`, `/api/v2/`) so old clients keep working. Use rolling deployments (Kubernetes rolling update) — new pods start before old ones stop. Implement health checks (`/health`) so the load balancer only routes to healthy instances. Use feature flags to toggle new functionality without re-deploying. For DB migrations, make them backward-compatible (add columns, don't rename/delete until old code is retired).

### Q7: How do you debug a Node.js app with high CPU usage?

> **Answer:** Use `node --prof app.js` to generate a V8 profiler log, then `node --prof-process isolate-*.log` to analyze it. Look for hot functions. Use `clinic.js` (`clinic flame`) for flame graphs. In production, use APM tools like Datadog or New Relic. Common culprits: synchronous crypto operations, unoptimized loops on large arrays, `JSON.parse` on huge payloads, or regex with catastrophic backtracking.

---

## 10. System Design: 1M Requests Architecture

```
                    ┌─────────────────────────────────────┐
                    │           CLIENT LAYER               │
                    │  Web / Mobile / Third-party APIs     │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │         CDN (CloudFront)             │
                    │   Static files, Edge caching         │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │      API Gateway / NGINX             │
                    │  Rate Limiting, SSL, Load Balancing  │
                    └──┬────────────┬──────────────────────┘
                       │            │
           ┌───────────▼─┐    ┌─────▼───────────┐
           │  Auth Service│    │   API Service    │
           │  (JWT/OAuth) │    │  Node.js Cluster │
           └───────────┬──┘    └──────┬───────────┘
                       │              │
           ┌───────────▼──────────────▼──────────┐
           │         Redis Cluster               │
           │  Sessions, Cache, Rate Limit State  │
           └──────────────┬──────────────────────┘
                          │
           ┌──────────────▼──────────────────────┐
           │          Kafka Cluster              │
           │     Async Job Queue / Events        │
           └──┬────────────┬──────────────────────┘
              │            │
   ┌──────────▼──┐   ┌─────▼──────────┐
   │  Worker     │   │  Worker        │
   │  (Email)    │   │  (Analytics)   │
   └─────────────┘   └────────────────┘
              │
   ┌──────────▼──────────────────────────┐
   │         Database Layer              │
   │  PostgreSQL Primary + Read Replicas │
   │  MongoDB (for flexible schemas)     │
   └─────────────────────────────────────┘
```

### Key Numbers to Remember

| Metric | Value |
|--------|-------|
| Redis GET latency | ~0.1ms |
| DB query (indexed) | ~1–5ms |
| DB query (full scan) | 100ms–10s |
| Kafka throughput | ~1M messages/sec |
| Node.js (single core) | ~10K–50K req/sec |
| Node.js (cluster, 8 cores) | ~200K–400K req/sec |
| NGINX | ~500K–1M req/sec |

---

# Node.js Interview Preparation Guide
## Lead / Staff Engineer · 9+ Years Experience

---

## 1. Node.js Internals & Core Concepts

### 1.1 Event Loop — Phases & Microtasks

**Interview Question:** Explain the Node.js event loop phases in order. Where do Promises, `process.nextTick`, `setImmediate`, and `setTimeout(fn, 0)` execute?

**Key Points to Cover:**

- The event loop has 6 phases: Timers → Pending Callbacks → Idle/Prepare → Poll → Check → Close Callbacks
- `process.nextTick()` runs between every phase (microtask queue, highest priority)
- Resolved Promises (`.then`) run in the microtask queue, AFTER `nextTick` but BEFORE the next phase
- `setImmediate()` runs in the Check phase
- `setTimeout(fn, 0)` runs in the Timers phase (minimum delay ~1ms)
- Starvation risk: recursive `nextTick` blocks the loop

**Code Example:**

```js
// Predict the output:
setImmediate(() => console.log('1 - setImmediate'));
setTimeout(() => console.log('2 - setTimeout'), 0);
Promise.resolve().then(() => console.log('3 - Promise'));
process.nextTick(() => console.log('4 - nextTick'));
console.log('5 - sync');

// Output: 5, 4, 3, 2 (or 1), 1 (or 2)
// sync → nextTick → Promise → timer/immediate (order of last two can vary in main module)
```

---

### 1.2 Streams & Backpressure

**Interview Question:** How does backpressure work in Node.js streams? How would you handle it properly in a production pipeline?

**Key Points to Cover:**

- Backpressure occurs when writable can't consume as fast as readable produces
- `readable.pipe(writable)` handles backpressure automatically via `drain` events
- Manual handling: check `write()` return value → if `false`, pause readable → resume on `'drain'`
- `highWaterMark` controls buffer size (default 16KB for streams, 16 objects for objectMode)
- `pipeline()` from `stream/promises` is preferred — handles errors + cleanup automatically
- Transform streams: if you `push()` too fast without respecting callback, you bypass backpressure

**Code Example:**

```js
const { pipeline } = require('stream/promises');
const { createReadStream, createWriteStream } = require('fs');
const { Transform } = require('stream');

const transform = new Transform({
  transform(chunk, encoding, callback) {
    // Always call callback to signal readiness
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});

await pipeline(
  createReadStream('input.txt'),
  transform,
  createWriteStream('output.txt')
);
// pipeline handles backpressure, errors, and cleanup
```

---

### 1.3 Cluster & Worker Threads

**Interview Question:** When would you use the cluster module vs worker_threads? How does the cluster module distribute connections?

**Key Points to Cover:**

- `cluster`: forks entire process, each worker has its own V8 + event loop — good for scaling HTTP servers
- `worker_threads`: share memory via `SharedArrayBuffer`, single process — good for CPU-intensive tasks
- Cluster uses round-robin (default on Linux) or OS-level scheduling
- Workers communicate via IPC (serialized messages), `worker_threads` can share ArrayBuffers
- PM2/k8s are preferred for production clustering over manual cluster code
- Worker threads avoid serialization overhead for large data via `transferList`

**Code Example:**

```js
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  const worker = new Worker(__filename, {
    workerData: { numbers: [1e7, 2e7, 3e7] }
  });
  worker.on('message', (result) => console.log(result));
  worker.on('error', (err) => console.error(err));
} else {
  // CPU-heavy work runs here without blocking main loop
  const result = workerData.numbers.map(n => fibonacci(n));
  parentPort.postMessage(result);
}
```

---

### 1.4 V8 Memory & Garbage Collection

**Interview Question:** How does V8 manage memory in Node.js? How would you debug a memory leak in production?

**Key Points to Cover:**

- V8 heap: Young Gen (Scavenge, fast, frequent) → Old Gen (Mark-Sweep-Compact, slower, infrequent)
- Default heap limit ~1.5GB (64-bit) — adjustable with `--max-old-space-size`
- Common leaks: global caches, closures holding refs, forgotten event listeners, uncleared timers
- Tools: `--inspect` + Chrome DevTools heap snapshots, `process.memoryUsage()`, clinic.js, heapdump
- `WeakRef` and `FinalizationRegistry` (v14+) for advanced cache patterns
- Monitor RSS vs heapUsed vs heapTotal vs external (Buffers)

**Code Example:**

```js
// Quick memory monitoring
setInterval(() => {
  const mem = process.memoryUsage();
  console.log({
    rss: `${(mem.rss / 1024 / 1024).toFixed(1)}MB`,
    heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(1)}MB`,
    heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(1)}MB`,
    external: `${(mem.external / 1024 / 1024).toFixed(1)}MB`,
  });
}, 5000);

// Generate heap snapshot on demand
require('v8').writeHeapSnapshot(); // Node 12+
```

---

### 1.5 libuv & Thread Pool

**Interview Question:** What operations use the libuv thread pool? How would you tune it for a high-throughput service?

**Key Points to Cover:**

- Thread pool (default 4 threads): fs operations, DNS lookups (`dns.lookup`), crypto, zlib
- Network I/O does NOT use the thread pool — uses OS async primitives (epoll/kqueue/IOCP)
- `UV_THREADPOOL_SIZE` env var to increase (max 1024) — set BEFORE requiring anything
- `dns.resolve()` uses c-ares (async, no thread pool) vs `dns.lookup()` (uses thread pool)
- Thread pool exhaustion causes queuing delays — monitor with async_hooks or clinic.js
- Crypto operations (pbkdf2, scrypt) are the heaviest thread pool consumers

**Code Example:**

```js
// Set before any require/import
process.env.UV_THREADPOOL_SIZE = 16;

// dns.resolve (c-ares, non-blocking) vs dns.lookup (thread pool)
const dns = require('dns');

// ❌ Uses thread pool - can bottleneck
dns.lookup('example.com', (err, addr) => {});

// ✅ Uses c-ares - truly async
dns.resolve4('example.com', (err, addrs) => {});
```

---

### 1.6 ESM vs CommonJS & Module System

**Interview Question:** What are the key differences between ESM and CJS in Node.js? What issues arise during migration?

**Key Points to Cover:**

- CJS: synchronous `require()`, `module.exports`, dynamic — can `require()` inside if blocks
- ESM: static `import`/`export`, async loading, supports top-level `await`
- ESM cannot `require()` CJS easily; CJS cannot use `import` of ESM (without dynamic `import()`)
- `"type": "module"` in `package.json` makes `.js` files ESM; `.cjs`/`.mjs` override
- `__dirname` / `__filename` not available in ESM — use `import.meta.url` + `fileURLToPath`
- Dual package publishing: conditional exports with `"import"` and `"require"` fields

**Code Example:**

```js
// ESM equivalents
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Conditional exports in package.json
// "exports": {
//   ".": {
//     "import": "./dist/esm/index.js",
//     "require": "./dist/cjs/index.cjs"
//   }
// }
```

---

## 2. System Design

### 2.1 Design a Rate Limiter

**Interview Question:** Design a distributed rate limiter for an API gateway handling 100K+ RPM. Discuss algorithms and tradeoffs.

**Key Points to Cover:**

- Algorithms: Token Bucket (bursty), Sliding Window Log (precise), Sliding Window Counter (balanced), Fixed Window (simple)
- Distributed: Redis + Lua scripts for atomic operations, or Redis Cell module
- Key design: per-user, per-IP, per-endpoint, or composite keys
- Handle race conditions: Lua scripts in Redis are atomic
- Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`
- Graceful degradation: local in-memory fallback if Redis is down
- Consider: multi-region sync, cost of Redis calls, clock drift

**Code Example:**

```js
// Sliding Window Counter with Redis (Lua for atomicity)
const rateLimitScript = `
  local key = KEYS[1]
  local window = tonumber(ARGV[1])
  local limit = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  
  redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
  local count = redis.call('ZCARD', key)
  
  if count < limit then
    redis.call('ZADD', key, now, now .. math.random())
    redis.call('EXPIRE', key, window)
    return {1, limit - count - 1}
  end
  return {0, 0}
`;

async function rateLimit(userId, limit = 100, windowSec = 60) {
  const [allowed, remaining] = await redis.eval(
    rateLimitScript, 1,
    `rl:${userId}`, windowSec * 1000, limit, Date.now()
  );
  return { allowed: !!allowed, remaining };
}
```

---

### 2.2 Design a Real-time Notification System

**Interview Question:** Design a notification system supporting push, email, SMS, and in-app for 10M users with delivery guarantees.

**Key Points to Cover:**

- Architecture: API → Message Queue (Kafka/SQS) → Channel Routers → Provider Adapters
- Fan-out pattern: single event → multiple channels per user preferences
- Delivery guarantees: at-least-once with idempotency keys, dead-letter queues for failures
- Real-time: WebSocket/SSE for in-app, with Redis Pub/Sub for horizontal scaling
- Priority queues: urgent (security alerts) vs batch (marketing)
- Template engine with i18n, user preference service, rate limiting per user
- Observability: delivery receipts, open tracking, latency percentiles

**Code Example:**

```js
class NotificationService {
  async send(event) {
    const user = await this.userPrefs.get(event.userId);
    const channels = this.resolveChannels(event.type, user);
    
    // Fan-out to channels via message queue
    await Promise.allSettled(
      channels.map(ch =>
        this.queue.publish(`notifications.${ch}`, {
          id: crypto.randomUUID(), // idempotency key
          ...event,
          channel: ch,
          template: this.resolveTemplate(event.type, ch),
          priority: event.priority || 'normal',
          retryPolicy: { maxRetries: 3, backoff: 'exponential' }
        })
      )
    );
  }
}
```

---

### 2.3 Design an API Gateway

**Interview Question:** Design an API Gateway in Node.js for a microservices architecture. How would you handle auth, routing, and resilience?

**Key Points to Cover:**

- Responsibilities: routing, auth (JWT/OAuth), rate limiting, logging, transformation, aggregation
- Pattern: reverse proxy with service registry (Consul/etcd) or static config
- Resilience: circuit breaker (opossum), retries with jitter, timeouts, bulkhead
- Performance: connection pooling, HTTP keep-alive, response caching (Redis), compression
- Observability: distributed tracing (OpenTelemetry), structured logging, metrics
- Consider: BFF pattern (Backend for Frontend), GraphQL federation as alternative

**Code Example:**

```js
const CircuitBreaker = require('opossum');

function createServiceProxy(serviceName, baseURL) {
  const breaker = new CircuitBreaker(
    async (req) => {
      return fetch(`${baseURL}${req.path}`, {
        method: req.method,
        headers: req.headers,
        body: req.body,
        signal: AbortSignal.timeout(5000),
      });
    },
    {
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      volumeThreshold: 10,
    }
  );

  breaker.fallback(() => ({ status: 503, body: 'Service unavailable' }));
  breaker.on('open', () => metrics.increment(`circuit.${serviceName}.open`));
  return breaker;
}
```

---

### 2.4 Event-Driven Microservices

**Interview Question:** How would you design an event-driven microservices system with eventual consistency? How do you handle failures?

**Key Points to Cover:**

- Event sourcing: store events as source of truth, derive state via projections
- CQRS: separate read/write models for scalability
- Saga pattern: orchestration (central coordinator) vs choreography (event chain) for distributed transactions
- Outbox pattern: write event to DB in same transaction, relay to broker — prevents dual-write issues
- Idempotent consumers: use event ID to deduplicate processing
- Dead letter queues, retry policies, compensating transactions for failure handling
- Schema registry (Avro/Protobuf) for event contracts

**Code Example:**

```js
// Transactional Outbox Pattern
async function placeOrder(order) {
  const session = await mongoose.startSession();
  await session.withTransaction(async () => {
    // 1. Write business data
    await Order.create([order], { session });
    
    // 2. Write event to outbox in SAME transaction
    await Outbox.create([{
      aggregateId: order.id,
      eventType: 'ORDER_PLACED',
      payload: order,
      status: 'PENDING',
      createdAt: new Date(),
    }], { session });
  });
  // 3. Separate relay process polls outbox → publishes to Kafka
}
```

---

### 2.5 Database Scaling Strategies

**Interview Question:** Your Node.js service is hitting DB bottlenecks at 50K QPS. Walk through your scaling strategy.

**Key Points to Cover:**

- Read replicas: route reads to replicas, writes to primary (handle replication lag)
- Connection pooling: pgBouncer or app-level pools, avoid per-request connections
- Caching layers: Redis/Memcached with cache-aside, write-through, or write-behind
- Sharding: hash-based vs range-based, consistent hashing for redistribution
- CQRS: separate read-optimized stores (Elasticsearch, materialized views)
- Query optimization: indexes, EXPLAIN ANALYZE, N+1 detection, batch loading (DataLoader)
- Consider: which queries are hot, read/write ratio, consistency requirements

**Code Example:**

```js
// DataLoader to solve N+1 queries
const DataLoader = require('dataloader');

const userLoader = new DataLoader(async (userIds) => {
  // Single batched query instead of N queries
  const users = await db.query(
    'SELECT * FROM users WHERE id = ANY($1)',
    [userIds]
  );
  // Must return results in same order as input keys
  const userMap = new Map(users.map(u => [u.id, u]));
  return userIds.map(id => userMap.get(id) || null);
});

// In resolvers - automatically batched & cached per request
const user = await userLoader.load(userId);
```

---

## 3. Coding / DSA

### 3.1 Implement Promise.all / Promise.allSettled

**Interview Question:** Implement `Promise.all` from scratch. Then extend it to `Promise.allSettled`.

**Key Points to Cover:**

- `Promise.all`: resolves when ALL resolve, rejects on FIRST rejection
- Must maintain order of results (not completion order)
- Handle empty array (resolve immediately with `[]`)
- Handle non-promise values (wrap with `Promise.resolve`)
- `allSettled`: never rejects, returns `{status, value/reason}` for each

**Code Example:**

```js
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const arr = Array.from(promises);
    if (arr.length === 0) return resolve([]);
    
    const results = new Array(arr.length);
    let settled = 0;
    
    arr.forEach((p, i) => {
      Promise.resolve(p)
        .then(value => {
          results[i] = value;   // preserve order
          if (++settled === arr.length) resolve(results);
        })
        .catch(reject);        // reject on first error
    });
  });
}

function promiseAllSettled(promises) {
  return new Promise((resolve) => {
    const arr = Array.from(promises);
    if (arr.length === 0) return resolve([]);
    
    const results = new Array(arr.length);
    let settled = 0;
    const done = () => { if (++settled === arr.length) resolve(results); };
    
    arr.forEach((p, i) => {
      Promise.resolve(p)
        .then(value  => { results[i] = { status: 'fulfilled', value }; done(); })
        .catch(reason => { results[i] = { status: 'rejected', reason }; done(); });
    });
  });
}
```

---

### 3.2 Implement an Event Emitter

**Interview Question:** Implement a Node.js-like `EventEmitter` with `on`, `off`, `once`, and `emit`.

**Key Points to Cover:**

- Store listeners in a `Map<event, listener[]>`
- `once()` wraps listener to auto-remove after first call
- `emit()` should handle errors thrown by listeners
- Support removing specific listeners (`off`)
- Edge cases: emitting with no listeners, removing during emit

**Code Example:**

```js
class EventEmitter {
  constructor() {
    this._events = new Map();
  }

  on(event, fn) {
    if (!this._events.has(event)) this._events.set(event, []);
    this._events.get(event).push(fn);
    return this;
  }

  off(event, fn) {
    const listeners = this._events.get(event);
    if (listeners) {
      this._events.set(event, listeners.filter(f => f !== fn && f._orig !== fn));
    }
    return this;
  }

  once(event, fn) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      fn.apply(this, args);
    };
    wrapper._orig = fn;
    return this.on(event, wrapper);
  }

  emit(event, ...args) {
    const listeners = this._events.get(event);
    if (!listeners || !listeners.length) return false;
    // Snapshot to handle removals during emit
    [...listeners].forEach(fn => fn.apply(this, args));
    return true;
  }
}
```

---

### 3.3 Async Concurrency Control

**Interview Question:** Implement a function that processes an array of async tasks with a concurrency limit of N.

**Key Points to Cover:**

- Like `p-limit` / `p-map` — process at most N tasks concurrently
- Must maintain result order
- Handle errors gracefully (fail-fast or collect)
- Use a pool pattern — when one finishes, start the next
- This tests understanding of async flow control

**Code Example:**

```js
async function asyncPool(limit, items, fn) {
  const results = [];
  const executing = new Set();

  for (const [index, item] of items.entries()) {
    const promise = Promise.resolve().then(() => fn(item, index));
    results.push(promise);
    executing.add(promise);

    const clean = () => executing.delete(promise);
    promise.then(clean, clean);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

// Usage: process 100 URLs, max 5 concurrent
const results = await asyncPool(5, urls, async (url) => {
  const res = await fetch(url);
  return res.json();
});
```

---

### 3.4 LRU Cache

**Interview Question:** Implement an LRU Cache with O(1) get and put operations.

**Key Points to Cover:**

- Doubly linked list + HashMap for O(1) operations
- `get`: move to front (most recently used)
- `put`: add to front, evict from tail if over capacity
- Node.js twist: discuss TTL, `WeakRef` for memory-sensitive caches

**Code Example:**

```js
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
    // Map maintains insertion order — we can exploit this!
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const value = this.map.get(key);
    // Refresh position: delete and re-insert
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      // Delete oldest (first key)
      const firstKey = this.map.keys().next().value;
      this.map.delete(firstKey);
    }
  }
}

// For production — add TTL support
class TTLCache extends LRUCache {
  constructor(capacity, ttlMs) {
    super(capacity);
    this.ttl = ttlMs;
    this.timestamps = new Map();
  }
  get(key) {
    if (this.timestamps.has(key) &&
        Date.now() - this.timestamps.get(key) > this.ttl) {
      this.map.delete(key);
      this.timestamps.delete(key);
      return -1;
    }
    return super.get(key);
  }
}
```

---

### 3.5 Debounce & Throttle

**Interview Question:** Implement `debounce` and `throttle`. Explain when you'd use each in a Node.js backend context.

**Key Points to Cover:**

- Debounce: delay execution until N ms of inactivity — good for search, auto-save
- Throttle: execute at most once per N ms — good for rate limiting, metrics flush
- Backend uses: debounce DB writes on rapid updates, throttle log flushing, API polling
- Support `cancel()` and `flush()` for both

**Code Example:**

```js
function debounce(fn, ms) {
  let timer;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => clearTimeout(timer);
  debounced.flush = (...args) => {
    clearTimeout(timer);
    fn(...args);
  };
  return debounced;
}

function throttle(fn, ms) {
  let last = 0, timer;
  const throttled = (...args) => {
    const now = Date.now();
    const remaining = ms - (now - last);
    if (remaining <= 0) {
      clearTimeout(timer);
      last = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn(...args);
      }, remaining);
    }
  };
  throttled.cancel = () => { clearTimeout(timer); timer = null; };
  return throttled;
}

// Backend: batch DB writes
const flushMetrics = throttle(async (metrics) => {
  await db.insertMany(metrics);
}, 5000);
```

---

## 4. Behavioral / Leadership Questions

### "Tell me about a time you led a major technical migration."
**Tip:** Use STAR format. Quantify: team size, timeline, % improvement. Show how you handled pushback.

### "How do you handle disagreements with product/engineering leadership?"
**Tip:** Show you "disagree and commit." Give an example where you changed your mind AND one where you persuaded others.

### "Describe a production incident you managed."
**Tip:** Walk through detection → triage → mitigation → root cause → prevention. Emphasize blameless culture.

### "How do you mentor junior engineers?"
**Tip:** Concrete examples: code reviews, design doc guidance, pair programming, creating growth plans.

### "How do you decide what NOT to build?"
**Tip:** Show business awareness: ROI, opportunity cost, technical debt tradeoffs, data-driven decisions.

---

## Quick Revision Checklist

| # | Topic | Category | Priority |
|---|-------|----------|----------|
| 1 | Event Loop Phases & Microtasks | Internals | 🔴 Must Know |
| 2 | Streams & Backpressure | Internals | 🔴 Must Know |
| 3 | Cluster vs Worker Threads | Internals | 🔴 Must Know |
| 4 | V8 Memory & GC | Internals | 🟡 Important |
| 5 | libuv & Thread Pool | Internals | 🟡 Important |
| 6 | ESM vs CommonJS | Internals | 🟡 Important |
| 7 | Rate Limiter Design | System Design | 🔴 Must Know |
| 8 | Notification System | System Design | 🔴 Must Know |
| 9 | API Gateway | System Design | 🟡 Important |
| 10 | Event-Driven Microservices | System Design | 🟡 Important |
| 11 | Database Scaling | System Design | 🟡 Important |
| 12 | Promise.all Implementation | Coding | 🔴 Must Know |
| 13 | EventEmitter Implementation | Coding | 🔴 Must Know |
| 14 | Async Concurrency Control | Coding | 🔴 Must Know |
| 15 | LRU Cache | Coding | 🟡 Important |
| 16 | Debounce & Throttle | Coding | 🟡 Important |

---

> **Pro Tips for Lead/Staff Level:**
> - Go beyond "what" — explain "why" and "tradeoffs" for every answer.
> - In system design, drive the conversation: ask clarifying questions, discuss scale, and proactively bring up failure modes.
> - Write clean, production-quality code while explaining your thought process aloud.
> - Demonstrate ownership mentality: "Here's what I'd monitor after deploying this."


*Prepared for 9+ Year Senior Node.js Developer Interview — Good Luck! 🎯*
