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

## 💡 Final Tips for 9+ Year Interview

- **Always talk about tradeoffs** — every architectural decision has pros and cons
- **Mention observability** — logging (Winston), metrics (Prometheus), tracing (Jaeger/OpenTelemetry)
- **Bring up cost** — Redis Cluster vs single Redis, Kafka vs RabbitMQ — mention operational cost
- **Security is non-negotiable** — bring it up proactively, not just when asked
- **Know your numbers** — latency, throughput, connection pool sizes, TTLs
- **Talk about failure modes** — what happens when Redis goes down? What's the fallback?

---

*Prepared for 9+ Year Senior Node.js Developer Interview — Good Luck! 🎯*
