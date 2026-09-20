# Node.js System Design Coding Tasks — Full Solutions

A practical collection of **production-oriented Node.js system-design coding problems** with complete implementations.

The goal is not only to solve the coding problem, but also to understand:

- Architecture
- Scalability
- Concurrency
- Failure handling
- Redis
- PostgreSQL
- Queues
- Caching
- Rate limiting
- Distributed systems
- Worker threads
- Observability
- Graceful shutdown
- Production trade-offs

---

# Table of Contents

| # | Problem | Important Packages |
|---|---|---|
| 1 | Rate Limiter | `express`, `redis` |
| 2 | LRU Cache | Built-in `Map` |
| 3 | TTL Cache | Built-in Node.js |
| 4 | Redis Cache | `redis` |
| 5 | Job Queue | `bullmq`, `ioredis` |
| 6 | Retry Mechanism | Built-in Node.js |
| 7 | Circuit Breaker | `opossum` |
| 8 | Concurrency Limiter | Built-in Promise |
| 9 | Request Deduplication | Built-in Promise |
| 10 | Idempotency | `express`, `redis` |
| 11 | Pub/Sub | `redis` |
| 12 | Event Emitter | Built-in Node.js |
| 13 | Worker Pool | `worker_threads` |
| 14 | Graceful Shutdown | Built-in Node.js |
| 15 | API Aggregator | `express`, `axios` |
| 16 | Pagination | `express`, `prisma` |
| 17 | File Upload | `express`, `multer` |
| 18 | Logging | `pino`, `pino-http` |
| 19 | Distributed Lock | `redis` |
| 20 | WebSocket Notification | `socket.io`, `redis` |
| 21 | URL Shortener | `express`, `prisma` |
| 22 | Token Bucket | `redis` |
| 23 | Sliding Window | `redis` |
| 24 | Background Jobs | `bullmq`, `ioredis` |
| 25 | Order Processing System | `express`, `prisma`, `bullmq`, `redis` |

---

# 1. Rate Limiter

## Problem

Allow a maximum number of requests per user within a time window.

Example:

```text
100 requests / minute
```

If the user exceeds the limit:

```http
429 Too Many Requests
```

## Package

For a production distributed application:

```bash
npm install express redis
```

For a single Node.js process, Redis is not strictly required, but for multiple instances it is recommended.

---

## Architecture

```text
Client
   |
   v
Load Balancer
   |
   +--------+--------+
   |        |        |
Node.js   Node.js   Node.js
   |        |        |
   +--------+--------+
            |
           Redis
```

---

## `rateLimiter.js`

```js
class RateLimiter {
  constructor(redis, limit, windowSeconds) {
    this.redis = redis;
    this.limit = limit;
    this.windowSeconds = windowSeconds;
  }

  async allow(key) {
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(
        key,
        this.windowSeconds
      );
    }

    return current <= this.limit;
  }
}

module.exports = RateLimiter;
```

---

## `server.js`

```js
const express = require("express");
const { createClient } = require("redis");
const RateLimiter = require("./rateLimiter");

const app = express();

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379"
});

redis.on("error", error => {
  console.error("Redis error:", error);
});

async function start() {
  await redis.connect();

  const limiter = new RateLimiter(
    redis,
    5,
    60
  );

  app.use(async (req, res, next) => {
    const userId =
      req.headers["x-user-id"] || req.ip;

    const allowed = await limiter.allow(
      `rate-limit:${userId}`
    );

    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: "Too many requests"
      });
    }

    next();
  });

  app.get("/users", (req, res) => {
    res.json({
      success: true,
      message: "Users fetched"
    });
  });

  app.listen(3000, () => {
    console.log("Server running on 3000");
  });
}

start();
```

## Interview Points

- Why Redis?
- What happens when Redis is unavailable?
- Fixed window vs sliding window?
- How does this work with 10 Node.js instances?
- How do you avoid race conditions?

---

# 2. LRU Cache

LRU means:

> Least Recently Used

When cache capacity is reached, remove the least recently used item.

## Package

No external package required.

Use JavaScript:

```js
Map
```

---

## Implementation

```js
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const value = this.cache.get(key);

    // Move to the end.
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, value);

    if (this.cache.size > this.capacity) {
      const oldestKey =
        this.cache.keys().next().value;

      this.cache.delete(oldestKey);
    }
  }

  delete(key) {
    return this.cache.delete(key);
  }

  has(key) {
    return this.cache.has(key);
  }

  size() {
    return this.cache.size;
  }
}

module.exports = LRUCache;
```

## Usage

```js
const LRUCache = require("./LRUCache");

const cache = new LRUCache(3);

cache.set("a", 1);
cache.set("b", 2);
cache.set("c", 3);

console.log(cache.get("a"));

cache.set("d", 4);

console.log(cache.get("b"));
// null
```

## Complexity

```text
get() → O(1)
set() → O(1)
delete() → O(1)
```

---

# 3. TTL Cache

TTL means:

> Time To Live

A cached value automatically expires after a specific duration.

## Package

No external package required.

---

## `TTLCache.js`

```js
class TTLCache {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, ttl) {
    this.delete(key);

    const timeout = setTimeout(() => {
      this.cache.delete(key);
    }, ttl);

    this.cache.set(key, {
      value,
      timeout
    });
  }

  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    return item.value;
  }

  delete(key) {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    clearTimeout(item.timeout);

    return this.cache.delete(key);
  }

  clear() {
    for (const item of this.cache.values()) {
      clearTimeout(item.timeout);
    }

    this.cache.clear();
  }
}

module.exports = TTLCache;
```

## Usage

```js
const TTLCache = require("./TTLCache");

const cache = new TTLCache();

cache.set(
  "user:1",
  {
    id: 1,
    name: "Vikrant"
  },
  5000
);

console.log(cache.get("user:1"));
```

After 5 seconds:

```js
console.log(cache.get("user:1"));
// null
```

## Production Warning

Do not use an in-memory TTL cache for shared data when running:

```text
10 Node.js instances
```

Each instance has separate memory.

Use Redis for distributed caching.

---

# 4. Redis Cache

## Package

```bash
npm install redis
```

---

## Redis Client

```js
const { createClient } = require("redis");

const redis = createClient({
  url: process.env.REDIS_URL ||
    "redis://localhost:6379"
});

redis.on("error", error => {
  console.error("Redis Error:", error);
});

async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

module.exports = {
  redis,
  connectRedis
};
```

---

## Cache Helper

```js
const {
  redis,
  connectRedis
} = require("./redis");

async function set(
  key,
  value,
  ttl = 300
) {
  await connectRedis();

  await redis.set(
    key,
    JSON.stringify(value),
    {
      EX: ttl
    }
  );
}

async function get(key) {
  await connectRedis();

  const value = await redis.get(key);

  if (!value) {
    return null;
  }

  return JSON.parse(value);
}

async function del(key) {
  await connectRedis();

  return redis.del(key);
}

module.exports = {
  set,
  get,
  del
};
```

---

## Cache-Aside Pattern

```js
async function getUser(userId) {
  const key = `user:${userId}`;

  const cachedUser = await cache.get(key);

  if (cachedUser) {
    return cachedUser;
  }

  const user = await db.user.findUnique({
    where: {
      id: userId
    }
  });

  if (user) {
    await cache.set(
      key,
      user,
      300
    );
  }

  return user;
}
```

Architecture:

```text
Request
   |
   v
Redis
   |
   +---- Hit ----> Response
   |
 Miss
   |
   v
Database
   |
   v
Redis
   |
   v
Response
```

---

# 5. Job Queue

For production background processing, use a queue.

## Package

```bash
npm install bullmq ioredis
```

---

## Architecture

```text
API
 |
 v
Queue
 |
 +-------+-------+
 |       |       |
Worker  Worker  Worker
```

---

## `queue.js`

```js
const { Queue } = require("bullmq");

const connection = {
  host: "localhost",
  port: 6379
};

const emailQueue = new Queue(
  "email",
  {
    connection
  }
);

module.exports = emailQueue;
```

---

## Producer

```js
const emailQueue =
  require("./queue");

async function addEmailJob(data) {
  await emailQueue.add(
    "send-email",
    data,
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000
      },
      removeOnComplete: true
    }
  );
}

addEmailJob({
  to: "user@example.com",
  subject: "Welcome"
});
```

---

## Worker

```js
const {
  Worker
} = require("bullmq");

const connection = {
  host: "localhost",
  port: 6379
};

const worker = new Worker(
  "email",
  async job => {
    console.log(
      "Processing:",
      job.name
    );

    console.log(
      "Email:",
      job.data
    );

    // Send email here
  },
  {
    connection,
    concurrency: 5
  }
);

worker.on(
  "completed",
  job => {
    console.log(
      `Job ${job.id} completed`
    );
  }
);

worker.on(
  "failed",
  (job, error) => {
    console.error(
      `Job ${job?.id} failed`,
      error
    );
  }
);
```

---

# 6. Retry Mechanism

No package required.

```js
async function retry(
  fn,
  retries = 3
) {
  let lastError;

  for (
    let attempt = 1;
    attempt <= retries;
    attempt++
  ) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      console.log(
        `Attempt ${attempt} failed`
      );
    }
  }

  throw lastError;
}
```

Usage:

```js
const result = await retry(
  () => callExternalAPI(),
  3
);
```

---

# 7. Circuit Breaker

## Package

```bash
npm install opossum
```

`opossum` is a commonly used Node.js circuit-breaker package.

---

## Implementation

```js
const CircuitBreaker =
  require("opossum");

async function paymentService() {
  const response = await fetch(
    "https://payment.example.com"
  );

  if (!response.ok) {
    throw new Error(
      "Payment service failed"
    );
  }

  return response.json();
}

const breaker =
  new CircuitBreaker(
    paymentService,
    {
      timeout: 3000,
      errorThresholdPercentage: 50,
      resetTimeout: 10000
    }
  );

breaker.on("open", () => {
  console.log(
    "Circuit breaker OPEN"
  );
});

breaker.on("close", () => {
  console.log(
    "Circuit breaker CLOSED"
  );
});

breaker.on("halfOpen", () => {
  console.log(
    "Circuit breaker HALF_OPEN"
  );
});

async function main() {
  try {
    const result =
      await breaker.fire();

    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

main();
```

## States

```text
CLOSED
  |
  | failures
  v
OPEN
  |
  | reset timeout
  v
HALF_OPEN
  |
  +---- Success ----> CLOSED
  |
  +---- Failure ----> OPEN
```

---

# 8. Concurrency Limiter

No external package required.

```js
class ConcurrencyLimiter {
  constructor(limit) {
    this.limit = limit;
    this.active = 0;
    this.queue = [];
  }

  run(fn) {
    return new Promise(
      (resolve, reject) => {
        this.queue.push({
          fn,
          resolve,
          reject
        });

        this.next();
      }
    );
  }

  next() {
    if (
      this.active >= this.limit ||
      this.queue.length === 0
    ) {
      return;
    }

    const task = this.queue.shift();

    this.active++;

    Promise.resolve()
      .then(task.fn)
      .then(task.resolve)
      .catch(task.reject)
      .finally(() => {
        this.active--;

        this.next();
      });

    this.next();
  }
}

module.exports =
  ConcurrencyLimiter;
```

Usage:

```js
const limiter =
  new ConcurrencyLimiter(5);

const results =
  await Promise.all(
    users.map(user =>
      limiter.run(() =>
        sendEmail(user)
      )
    )
  );
```

Only 5 operations run simultaneously.

---

# 9. Request Deduplication

Problem:

```text
Request A ──┐
Request B ──┼──> Database
Request C ──┘
```

Instead:

```text
Request A ──┐
Request B ──┼──> One Promise
Request C ──┘
```

## Implementation

```js
const pendingRequests =
  new Map();

async function getUser(userId) {
  const key = `user:${userId}`;

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise =
    fetchUserFromDatabase(userId);

  pendingRequests.set(
    key,
    promise
  );

  try {
    return await promise;
  } finally {
    pendingRequests.delete(key);
  }
}
```

This is called:

> Request coalescing / Promise deduplication.

---

# 10. Idempotency

Important for:

- Payments
- Orders
- Subscriptions
- Booking
- Money transfer

## Package

```bash
npm install express redis
```

---

## Middleware

```js
async function idempotency(
  req,
  res,
  next
) {
  const key =
    req.headers["idempotency-key"];

  if (!key) {
    return res.status(400).json({
      message:
        "Idempotency-Key required"
    });
  }

  const redisKey =
    `idempotency:${key}`;

  const existing =
    await redis.get(redisKey);

  if (existing) {
    return res.json(
      JSON.parse(existing)
    );
  }

  res.sendIdempotentResponse =
    async data => {
      await redis.set(
        redisKey,
        JSON.stringify(data),
        {
          EX: 86400
        }
      );

      return res.json(data);
    };

  next();
}
```

Usage:

```js
app.post(
  "/payments",
  idempotency,
  async (req, res) => {
    const payment =
      await createPayment(req.body);

    return res.sendIdempotentResponse({
      success: true,
      payment
    });
  }
);
```

## Important Production Issue

The simple implementation above can still have race conditions when two identical requests arrive simultaneously.

A production implementation should use an atomic Redis operation such as:

```text
SET key value NX EX
```

or a database uniqueness constraint.

---

# 11. Redis Pub/Sub

## Package

```bash
npm install redis
```

---

## Publisher

```js
const {
  createClient
} = require("redis");

const publisher =
  createClient({
    url: "redis://localhost:6379"
  });

await publisher.connect();

await publisher.publish(
  "order.created",
  JSON.stringify({
    orderId: 123
  })
);
```

---

## Subscriber

```js
const subscriber =
  publisher.duplicate();

await subscriber.connect();

await subscriber.subscribe(
  "order.created",
  message => {
    const data =
      JSON.parse(message);

    console.log(
      "Order created:",
      data
    );
  }
);
```

Architecture:

```text
Publisher
    |
    v
 Redis Pub/Sub
   /    |    \
  v     v     v
Email  SMS   Notification
```

### Important

Redis Pub/Sub is generally not a durable queue.

If a subscriber is disconnected, it can miss messages.

For durable jobs, use:

```text
BullMQ
Kafka
RabbitMQ
```

depending on requirements.

---

# 12. EventEmitter

Node.js provides EventEmitter.

No package required.

```js
const EventEmitter =
  require("events");

const emitter =
  new EventEmitter();

function handleOrder(order) {
  console.log(
    "Order:",
    order.id
  );
}

emitter.on(
  "order.created",
  handleOrder
);

emitter.emit(
  "order.created",
  {
    id: 123
  }
);
```

## `once()`

```js
emitter.once(
  "server.started",
  () => {
    console.log(
      "Server started"
    );
  }
);
```

## `off()`

```js
emitter.off(
  "order.created",
  handleOrder
);
```

### When to use

Good for:

- In-process events
- Modules communicating inside one Node.js process

Not suitable as a distributed event bus.

---

# 13. Worker Pool

For CPU-heavy work use:

```text
worker_threads
```

No external package is required.

---

## `worker.js`

```js
const {
  parentPort,
  workerData
} = require("worker_threads");

function fibonacci(n) {
  if (n <= 1) {
    return n;
  }

  return (
    fibonacci(n - 1) +
    fibonacci(n - 2)
  );
}

const result =
  fibonacci(workerData);

parentPort.postMessage(result);
```

---

## `main.js`

```js
const {
  Worker
} = require("worker_threads");

const path =
  require("path");

function runWorker(data) {
  return new Promise(
    (resolve, reject) => {
      const worker =
        new Worker(
          path.join(
            __dirname,
            "worker.js"
          ),
          {
            workerData: data
          }
        );

      worker.once(
        "message",
        resolve
      );

      worker.once(
        "error",
        reject
      );

      worker.once(
        "exit",
        code => {
          if (code !== 0) {
            reject(
              new Error(
                `Worker exited with code ${code}`
              )
            );
          }
        }
      );
    }
  );
}

async function main() {
  const result =
    await runWorker(40);

  console.log(
    "Result:",
    result
  );
}

main();
```

---

# 14. Graceful Shutdown

A production Node.js service should handle:

```text
SIGTERM
SIGINT
```

---

## Implementation

```js
const server =
  app.listen(3000);

async function shutdown(
  signal
) {
  console.log(
    `${signal} received`
  );

  server.close(async () => {
    console.log(
      "HTTP server closed"
    );

    try {
      await redis.quit();

      await prisma.$disconnect();

      console.log(
        "Resources closed"
      );

      process.exit(0);
    } catch (error) {
      console.error(error);

      process.exit(1);
    }
  });
}

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);

process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);
```

## Shutdown sequence

```text
SIGTERM
   |
   v
Stop accepting new requests
   |
   v
Finish existing requests
   |
   v
Stop workers
   |
   v
Close Redis
   |
   v
Close Database
   |
   v
Exit
```

---

# 15. API Aggregator

## Package

```bash
npm install express axios
```

---

## Implementation

```js
const express =
  require("express");

const axios =
  require("axios");

const app =
  express();

async function getUser(id) {
  const response =
    await axios.get(
      `http://user-service/users/${id}`
    );

  return response.data;
}

async function getOrders(id) {
  const response =
    await axios.get(
      `http://order-service/orders/${id}`
    );

  return response.data;
}

async function getRecommendations(id) {
  const response =
    await axios.get(
      `http://recommendation-service/users/${id}`
    );

  return response.data;
}

app.get(
  "/dashboard/:id",
  async (req, res) => {
    try {
      const id =
        req.params.id;

      const [
        user,
        orders,
        recommendations
      ] = await Promise.all([
        getUser(id),
        getOrders(id),
        getRecommendations(id)
      ]);

      res.json({
        user,
        orders,
        recommendations
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to load dashboard"
      });
    }
  }
);

app.listen(3000);
```

### Production Improvements

Add:

```text
Timeout
Retry
Circuit Breaker
Fallback
Tracing
Metrics
```

---

# 16. Pagination

## Package

```bash
npm install express @prisma/client
npm install -D prisma
```

---

## Offset Pagination

```js
app.get(
  "/users",
  async (req, res) => {
    const page =
      Number(req.query.page) || 1;

    const limit =
      Math.min(
        Number(req.query.limit) || 20,
        100
      );

    const skip =
      (page - 1) * limit;

    const [
      users,
      total
    ] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc"
        }
      }),

      prisma.user.count()
    ]);

    res.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(
            total / limit
          )
      }
    });
  }
);
```

---

## Cursor Pagination

Better for large datasets.

```js
const users =
  await prisma.user.findMany({
    take: 20,

    ...(cursor
      ? {
          skip: 1,
          cursor: {
            id: cursor
          }
        }
      : {}),

    orderBy: {
      id: "asc"
    }
  });
```

Response:

```json
{
  "data": [],
  "nextCursor": "abc123"
}
```

---

# 17. File Upload

## Package

```bash
npm install express multer
```

---

## Basic Upload

```js
const express =
  require("express");

const multer =
  require("multer");

const app =
  express();

const upload =
  multer({
    dest: "uploads/",
    limits: {
      fileSize:
        5 * 1024 * 1024
    }
  });

app.post(
  "/upload",
  upload.single("file"),
  (req, res) => {
    res.json({
      success: true,
      file: req.file
    });
  }
);

app.listen(3000);
```

---

## MIME Validation

```js
const upload =
  multer({
    dest: "uploads/",

    fileFilter: (
      req,
      file,
      callback
    ) => {
      const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];

      if (
        !allowed.includes(
          file.mimetype
        )
      ) {
        return callback(
          new Error(
            "Invalid file type"
          )
        );
      }

      callback(null, true);
    }
  });
```

### Production

For large files:

```text
Client
  |
  v
API
  |
  v
Object Storage
```

Consider:

- AWS S3
- Cloudflare R2
- Google Cloud Storage
- Azure Blob Storage

Avoid keeping huge files in Node.js memory.

---

# 18. Structured Logging

## Packages

```bash
npm install pino pino-http
```

---

## Logger

```js
const pino =
  require("pino");

const logger =
  pino({
    level:
      process.env.LOG_LEVEL ||
      "info"
  });

module.exports =
  logger;
```

---

## Express

```js
const pinoHttp =
  require("pino-http");

app.use(
  pinoHttp({
    logger
  })
);
```

Now:

```js
req.log.info(
  {
    userId: 123
  },
  "User fetched"
);
```

Log format:

```json
{
  "level": 30,
  "time": 1720000000,
  "msg": "User fetched",
  "userId": 123
}
```

### Production logging should include

```text
requestId
userId
method
URL
statusCode
duration
error
service
environment
```

---

# 19. Distributed Lock

## Package

```bash
npm install redis
```

For serious distributed locking, evaluate a well-tested approach/library rather than implementing a lock casually.

---

## Basic Redis Lock

```js
async function acquireLock(
  redis,
  key,
  value,
  ttl
) {
  const result =
    await redis.set(
      key,
      value,
      {
        NX: true,
        PX: ttl
      }
    );

  return result === "OK";
}
```

Usage:

```js
const lockKey =
  "lock:payment:123";

const lockValue =
  crypto.randomUUID();

const acquired =
  await acquireLock(
    redis,
    lockKey,
    lockValue,
    10000
  );

if (!acquired) {
  return;
}

try {
  await processPayment();
} finally {
  // Release only if ownership
  // is still yours.
}
```

### Important

Never blindly:

```js
redis.del(lockKey)
```

because another worker may have acquired the lock after your TTL expired.

A safe release should verify the lock value atomically, commonly using a Lua script.

---

# 20. WebSocket Notification

## Package

```bash
npm install express socket.io
```

---

## Server

```js
const express =
  require("express");

const http =
  require("http");

const {
  Server
} = require("socket.io");

const app =
  express();

const server =
  http.createServer(app);

const io =
  new Server(server, {
    cors: {
      origin: "*"
    }
  });

io.on(
  "connection",
  socket => {
    console.log(
      "Client connected:",
      socket.id
    );

    socket.on(
      "join",
      userId => {
        socket.join(
          `user:${userId}`
        );
      }
    );

    socket.on(
      "disconnect",
      () => {
        console.log(
          "Client disconnected"
        );
      }
    );
  }
);

function notifyUser(
  userId,
  data
) {
  io.to(
    `user:${userId}`
  ).emit(
    "notification",
    data
  );
}

server.listen(
  3000,
  () => {
    console.log(
      "WebSocket server running"
    );
  }
);
```

Notification:

```js
notifyUser(
  123,
  {
    type: "ORDER_CREATED",
    orderId: 456
  }
);
```

### Scaling

With multiple Node.js instances, use a Socket.IO Redis adapter.

```bash
npm install @socket.io/redis-adapter redis
```

Architecture:

```text
              Load Balancer
                    |
          +---------+---------+
          |                   |
       Node 1              Node 2
          |                   |
          +---------+---------+
                    |
                  Redis
```

---

# 21. URL Shortener

## Package

```bash
npm install express
npm install @prisma/client
npm install -D prisma
```

---

## Database Model

```prisma
model Url {
  id        String   @id @default(cuid())
  code      String   @unique
  original  String
  createdAt DateTime @default(now())

  @@index([code])
}
```

---

## Base62

```js
const chars =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encodeBase62(num) {
  let result = "";

  while (num > 0) {
    result =
      chars[num % 62] +
      result;

    num =
      Math.floor(num / 62);
  }

  return result;
}
```

A production system can use:

- Database sequence
- Snowflake ID
- UUID-based identifier
- Random Base62 ID

---

## Create Short URL

```js
app.post(
  "/shorten",
  async (req, res) => {
    const {
      original
    } = req.body;

    const code =
      crypto
        .randomBytes(5)
        .toString("base64url");

    const url =
      await prisma.url.create({
        data: {
          code,
          original
        }
      });

    res.json({
      shortUrl:
        `https://short.example/${url.code}`
    });
  }
);
```

---

## Redirect

```js
app.get(
  "/:code",
  async (req, res) => {
    const url =
      await prisma.url.findUnique({
        where: {
          code:
            req.params.code
        }
      });

    if (!url) {
      return res.status(404).send(
        "URL not found"
      );
    }

    res.redirect(
      url.original
    );
  }
);
```

---

# 22. Token Bucket Rate Limiter

Token bucket concepts:

```text
Capacity = 10
Refill = 2 tokens/second
```

Each request consumes one token.

---

## Simple In-Memory Version

```js
class TokenBucket {
  constructor(
    capacity,
    refillRate
  ) {
    this.capacity =
      capacity;

    this.refillRate =
      refillRate;

    this.tokens =
      capacity;

    this.lastRefill =
      Date.now();
  }

  refill() {
    const now =
      Date.now();

    const elapsed =
      (now -
        this.lastRefill) /
      1000;

    const tokensToAdd =
      elapsed *
      this.refillRate;

    this.tokens =
      Math.min(
        this.capacity,
        this.tokens +
          tokensToAdd
      );

    this.lastRefill =
      now;
  }

  consume(tokens = 1) {
    this.refill();

    if (
      this.tokens < tokens
    ) {
      return false;
    }

    this.tokens -= tokens;

    return true;
  }
}
```

Usage:

```js
const bucket =
  new TokenBucket(
    10,
    2
  );

console.log(
  bucket.consume()
);
```

### Distributed Production Version

Store bucket state in Redis and use an atomic Lua script to prevent race conditions.

---

# 23. Sliding Window Rate Limiter

A Redis sorted set can represent request timestamps.

## Package

```bash
npm install redis
```

---

## Basic Implementation

```js
async function allowRequest(
  redis,
  key,
  limit,
  windowMs
) {
  const now =
    Date.now();

  const start =
    now - windowMs;

  await redis.zRemRangeByScore(
    key,
    0,
    start
  );

  const count =
    await redis.zCard(key);

  if (count >= limit) {
    return false;
  }

  await redis.zAdd(
    key,
    {
      score: now,
      value:
        `${now}:${Math.random()}`
    }
  );

  await redis.expire(
    key,
    Math.ceil(
      windowMs / 1000
    )
  );

  return true;
}
```

### Important

For strict correctness under high concurrency, the operations should be combined atomically, typically with a Redis Lua script.

Architecture:

```text
Request
   |
   v
Redis Sorted Set
   |
   +-- Remove expired
   |
   +-- Count requests
   |
   +-- Add request
   |
   v
Allow / Reject
```

---

# 24. Background Job Processor

## Package

```bash
npm install bullmq ioredis
```

---

## Producer

```js
const {
  Queue
} = require("bullmq");

const connection = {
  host: "localhost",
  port: 6379
};

const queue =
  new Queue(
    "orders",
    {
      connection
    }
  );

async function createJob(
  order
) {
  await queue.add(
    "process-order",
    order,
    {
      attempts: 5,

      backoff: {
        type: "exponential",
        delay: 1000
      },

      removeOnComplete: 1000,
      removeOnFail: 5000
    }
  );
}
```

---

## Worker

```js
const {
  Worker
} = require("bullmq");

const worker =
  new Worker(
    "orders",
    async job => {
      switch (job.name) {
        case "process-order":
          return processOrder(
            job.data
          );

        default:
          throw new Error(
            `Unknown job: ${job.name}`
          );
      }
    },
    {
      connection,
      concurrency: 10
    }
  );

async function processOrder(
  order
) {
  console.log(
    "Processing order:",
    order.id
  );

  // Payment
  // Inventory
  // Notification

  return {
    success: true
  };
}
```

---

# 25. Complete Order Processing System

This is the most important advanced exercise.

## Requirements

Build:

```http
POST /orders
GET /orders/:id
POST /orders/:id/cancel
```

---

# Architecture

```text
                    Client
                      |
                      v
                Load Balancer
                      |
                      v
                API Gateway
                      |
                      v
                Order Service
                 /         \
                v           v
          PostgreSQL       Redis
                |
                v
             Outbox
                |
                v
             Queue
          /      |      \
         v       v       v
     Payment  Inventory  Notification
      Worker    Worker      Worker
```

---

# Packages

```bash
npm install express
npm install @prisma/client
npm install bullmq ioredis
npm install redis
npm install zod
npm install pino pino-http
npm install helmet
npm install cors

npm install -D prisma
npm install -D jest supertest
```

---

# Folder Structure

```text
src/
├── app.js
├── server.js
│
├── config/
│   └── env.js
│
├── db/
│   └── prisma.js
│
├── redis/
│   └── client.js
│
├── middleware/
│   ├── errorHandler.js
│   ├── auth.js
│   └── idempotency.js
│
├── modules/
│   └── order/
│       ├── order.controller.js
│       ├── order.service.js
│       ├── order.routes.js
│       └── order.schema.js
│
├── queue/
│   ├── order.queue.js
│   └── order.worker.js
│
└── utils/
    ├── retry.js
    └── logger.js
```

---

# Prisma Schema

```prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())

  orders Order[]
}

model Order {
  idempotencyKey String   @unique
  id             String   @id @default(cuid())

  userId         String
  status         OrderStatus

  total          Decimal

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user User @relation(
    fields: [userId],
    references: [id]
  )

  items OrderItem[]

  @@index([userId])
  @@index([status])
}

model OrderItem {
  id        String @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  price     Decimal

  order Order @relation(
    fields: [orderId],
    references: [id]
  )

  @@index([orderId])
}

enum OrderStatus {
  PENDING
  PAYMENT_PROCESSING
  PAID
  FAILED
  CANCELLED
}
```

---

# Prisma Client

`src/db/prisma.js`

```js
const {
  PrismaClient
} = require("@prisma/client");

const prisma =
  new PrismaClient();

module.exports =
  prisma;
```

---

# Redis Client

`src/redis/client.js`

```js
const {
  createClient
} = require("redis");

const redis =
  createClient({
    url:
      process.env.REDIS_URL ||
      "redis://localhost:6379"
  });

redis.on(
  "error",
  error => {
    console.error(
      "Redis Error:",
      error
    );
  }
);

async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

module.exports = {
  redis,
  connectRedis
};
```

---

# Order Validation

`order.schema.js`

```js
const {
  z
} = require("zod");

const createOrderSchema =
  z.object({
    userId:
      z.string().min(1),

    items:
      z.array(
        z.object({
          productId:
            z.string().min(1),

          quantity:
            z.number().int().positive(),

          price:
            z.number().positive()
        })
      ).min(1)
  });

module.exports =
  createOrderSchema;
```

---

# Order Service

```js
const prisma =
  require("../../db/prisma");

async function createOrder(
  data,
  idempotencyKey
) {
  const existing =
    await prisma.order.findUnique({
      where: {
        idempotencyKey
      }
    });

  if (existing) {
    return existing;
  }

  const total =
    data.items.reduce(
      (sum, item) =>
        sum +
        item.price *
          item.quantity,
      0
    );

  const order =
    await prisma.order.create({
      data: {
        userId:
          data.userId,

        idempotencyKey,

        status:
          "PENDING",

        total,

        items: {
          create:
            data.items.map(
              item => ({
                productId:
                  item.productId,

                quantity:
                  item.quantity,

                price:
                  item.price
              })
            )
        }
      },

      include: {
        items: true
      }
    });

  return order;
}

module.exports = {
  createOrder
};
```

---

# Order Controller

```js
const {
  createOrder
} = require("./order.service");

const schema =
  require("./order.schema");

async function create(
  req,
  res,
  next
) {
  try {
    const data =
      schema.parse(
        req.body
      );

    const key =
      req.headers[
        "idempotency-key"
      ];

    if (!key) {
      return res.status(400).json({
        success: false,
        message:
          "Idempotency-Key required"
      });
    }

    const order =
      await createOrder(
        data,
        key
      );

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create
};
```

---

# Routes

```js
const express =
  require("express");

const controller =
  require("./order.controller");

const router =
  express.Router();

router.post(
  "/",
  controller.create
);

module.exports =
  router;
```

---

# Application

`app.js`

```js
const express =
  require("express");

const helmet =
  require("helmet");

const cors =
  require("cors");

const orderRoutes =
  require("./modules/order/order.routes");

const app =
  express();

app.use(
  helmet()
);

app.use(
  cors()
);

app.use(
  express.json()
);

app.get(
  "/health",
  (req, res) => {
    res.status(200).json({
      status: true,
      message:
        "Service is healthy"
    });
  }
);

app.use(
  "/orders",
  orderRoutes
);

app.use(
  (error, req, res, next) => {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Internal Server Error"
    });
  }
);

module.exports =
  app;
```

---

# Server

```js
const app =
  require("./app");

const {
  connectRedis
} = require("./redis/client");

const prisma =
  require("./db/prisma");

async function start() {
  await connectRedis();

  await prisma.$connect();

  const server =
    app.listen(
      3000,
      () => {
        console.log(
          "Server running on 3000"
        );
      }
    );

  async function shutdown(
    signal
  ) {
    console.log(
      `${signal} received`
    );

    server.close(
      async () => {
        await prisma.$disconnect();

        process.exit(0);
      }
    );
  }

  process.on(
    "SIGTERM",
    () =>
      shutdown("SIGTERM")
  );

  process.on(
    "SIGINT",
    () =>
      shutdown("SIGINT")
  );
}

start();
```

---

# Queue

`order.queue.js`

```js
const {
  Queue
} = require("bullmq");

const connection = {
  host:
    process.env.REDIS_HOST ||
    "localhost",

  port:
    Number(
      process.env.REDIS_PORT ||
      6379
    )
};

const orderQueue =
  new Queue(
    "order-processing",
    {
      connection
    }
  );

module.exports =
  orderQueue;
```

---

# Worker

```js
const {
  Worker
} = require("bullmq");

const connection = {
  host: "localhost",
  port: 6379
};

const worker =
  new Worker(
    "order-processing",

    async job => {
      const order =
        job.data;

      console.log(
        "Processing:",
        order.id
      );

      // 1. Payment
      // 2. Inventory
      // 3. Notification

      return {
        success: true
      };
    },

    {
      connection,

      concurrency: 10
    }
  );

worker.on(
  "completed",
  job => {
    console.log(
      "Completed:",
      job.id
    );
  }
);

worker.on(
  "failed",
  (job, error) => {
    console.error(
      "Failed:",
      job?.id,
      error
    );
  }
);
```

---

# Production Order Flow

```text
POST /orders
       |
       v
Validate request
       |
       v
Check Idempotency
       |
       v
Create Order
       |
       v
PostgreSQL
       |
       v
Queue
       |
       +-------------------+
       |                   |
       v                   v
 Payment Worker      Inventory Worker
       |                   |
       +---------+---------+
                 |
                 v
         Notification Worker
                 |
                 v
              Complete
```

---

# Outbox Pattern

For a production distributed system, don't simply:

```js
await prisma.order.create();

await queue.add();
```

because:

```text
Database succeeds
Queue fails
```

Now your database contains the order but no event exists.

Use the Outbox Pattern.

```text
Database Transaction
       |
       +---- Order
       |
       +---- Outbox Event
```

Then a background worker publishes the outbox event.

---

# Outbox Model

```prisma
model OutboxEvent {
  id          String   @id @default(cuid())
  eventType   String
  aggregateId String
  payload     Json
  processed   Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@index([processed])
}
```

---

# Transaction

```js
const order =
  await prisma.$transaction(
    async tx => {
      const order =
        await tx.order.create({
          data: {
            userId,
            idempotencyKey,
            status: "PENDING",
            total
          }
        });

      await tx.outboxEvent.create({
        data: {
          eventType:
            "ORDER_CREATED",

          aggregateId:
            order.id,

          payload: order
        }
      });

      return order;
    }
  );
```

Now:

```text
Order + Event
```

are committed atomically.

---

# Production Improvements

For a serious production system add:

## Security

```text
Authentication
Authorization
Helmet
CORS
Input validation
Rate limiting
Secrets management
```

## Database

```text
Indexes
Transactions
Connection pooling
Query optimization
Read replicas
Partitioning when required
```

## Redis

```text
Caching
Rate limiting
Distributed locks
Sessions
Idempotency
Pub/Sub
```

## Queue

```text
Retry
Backoff
Dead Letter Queue
Concurrency
Job priorities
Delayed jobs
Job monitoring
```

## Observability

```text
Pino
Prometheus
OpenTelemetry
APM
Distributed tracing
Metrics
Health checks
```

## Deployment

```text
Docker
Kubernetes
AWS ECS
AWS EKS
EC2
Load Balancer
Auto Scaling
```

---

# Testing

## Packages

```bash
npm install -D jest supertest
```

---

## Health Test

```js
const request =
  require("supertest");

const app =
  require("../src/app");

describe(
  "GET /health",
  () => {
    test(
      "should return healthy",
      async () => {
        const response =
          await request(app)
            .get("/health");

        expect(
          response.status
        ).toBe(200);

        expect(
          response.body.status
        ).toBe(true);
      }
    );
  }
);
```

Run:

```bash
npm test
```

---

# Docker

## `Dockerfile`

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "src/server.js"]
```

---

# Docker Compose

```yaml
services:

  app:
    build: .
    ports:
      - "3000:3000"

    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/app
      REDIS_URL: redis://redis:6379

    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:17-alpine

    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app

    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine

    ports:
      - "6379:6379"
```

Run:

```bash
docker compose up -d
```

Check:

```bash
docker compose ps
```

---

# Recommended Package List

## Core

```bash
express
```

## Validation

```bash
zod
```

## Database

```bash
@prisma/client
prisma
```

## Redis

```bash
redis
```

or:

```bash
ioredis
```

## Queue

```bash
bullmq
```

## Circuit Breaker

```bash
opossum
```

## Logging

```bash
pino
pino-http
```

## Security

```bash
helmet
cors
```

## HTTP Client

```bash
axios
```

Node.js `fetch()` can also be used in modern Node.js versions.

## File Upload

```bash
multer
```

## WebSocket

```bash
socket.io
```

## Testing

```bash
jest
supertest
```

## CPU-intensive work

```text
worker_threads
```

Built into Node.js.

---

# Interview Coding Order

Practice these in this order:

```text
01. LRU Cache
        ↓
02. TTL Cache
        ↓
03. Promise Concurrency Limiter
        ↓
04. Retry
        ↓
05. Rate Limiter
        ↓
06. Redis Cache
        ↓
07. Request Deduplication
        ↓
08. Idempotency
        ↓
09. Job Queue
        ↓
10. Circuit Breaker
        ↓
11. Distributed Lock
        ↓
12. Worker Pool
        ↓
13. WebSocket Notification
        ↓
14. URL Shortener
        ↓
15. Order Processing System
```

---

# What You Should Explain During Interview

For every coding task, explain these seven things:

## 1. Requirement

What exactly does the system need to do?

## 2. Data Structure

For example:

```text
Map
Redis Hash
Sorted Set
Queue
Database Table
```

## 3. Concurrency

Ask:

> How many requests/jobs can execute simultaneously?

## 4. Failure

Ask:

> What happens when Redis/database/API is unavailable?

## 5. Scalability

Ask:

> What happens when traffic increases from 1,000 to 1 million requests?

## 6. Consistency

Ask:

> Can duplicate operations happen?

This leads to:

```text
Idempotency
Distributed Lock
Transactions
Outbox Pattern
```

## 7. Observability

Explain:

```text
Logs
Metrics
Tracing
Alerts
Health checks
```

---

# Senior Node.js System Design Checklist

Before finishing an answer, check:

```text
[ ] API design
[ ] Authentication
[ ] Authorization
[ ] Validation
[ ] Error handling
[ ] Database
[ ] Indexes
[ ] Transactions
[ ] Cache
[ ] Redis
[ ] Queue
[ ] Retry
[ ] Backoff
[ ] Circuit breaker
[ ] Timeout
[ ] Rate limiting
[ ] Idempotency
[ ] Distributed locking
[ ] Concurrency
[ ] Graceful shutdown
[ ] Logging
[ ] Metrics
[ ] Tracing
[ ] Testing
[ ] Docker
[ ] CI/CD
[ ] Horizontal scaling
```

---

# Most Important Interview Questions

### 1. Why use Redis instead of Node.js Map?

Because Node.js memory is local to one process. Redis provides shared state across multiple instances.

### 2. Why use a queue?

To move slow/background work outside the HTTP request lifecycle.

### 3. Why use BullMQ?

It provides production-oriented job management on top of Redis, including retries, delayed jobs, concurrency, and job lifecycle management.

### 4. Why use a circuit breaker?

To prevent repeatedly calling an unhealthy dependency.

### 5. Why use idempotency?

To prevent duplicate side effects when clients retry requests.

### 6. Why use an Outbox?

To reliably persist business changes and events together.

### 7. Why use Worker Threads?

Promises don't make CPU-heavy JavaScript execute on another thread. Worker Threads do.

### 8. Why use controlled concurrency?

Unlimited concurrency can exhaust:

```text
Memory
Database connections
API limits
CPU
Network
```

### 9. Why use cursor pagination?

It is generally more scalable for large datasets than very large offsets and provides more stable traversal under changing data.

### 10. Why graceful shutdown?

To prevent:

```text
Dropped requests
Incomplete jobs
Database connection leaks
Corrupted operations
```

---

# Final Architecture

A mature Node.js backend can look like:

```text
                         Client
                           |
                           v
                    Load Balancer
                           |
                           v
                     API Gateway
                           |
             +-------------+-------------+
             |             |             |
             v             v             v
          Service A     Service B     Service C
             |             |             |
             +-------------+-------------+
                           |
             +-------------+-------------+
             |                           |
             v                           v
          Redis                     PostgreSQL
             |
             v
           Queue
             |
       +-----+-----+-----+
       |     |     |     |
       v     v     v     v
    Worker Worker Worker Worker
       |
       v
 External Services

             Observability
                  |
       +----------+----------+
       |          |          |
      Logs      Metrics    Tracing
```

---

# Final Mental Model

When you receive a Node.js system-design coding problem:

```text
                    Problem
                       |
                       v
                 Requirements
                       |
                       v
                  API Design
                       |
                       v
                Data Structures
                       |
                       v
                  Database
                       |
                       v
                    Cache
                       |
                       v
                  Concurrency
                       |
                       v
              Queue / Async Work
                       |
                       v
             Failure Handling
                       |
             +---------+---------+
             |         |         |
           Retry     Timeout   Circuit
             |         |       Breaker
             +---------+---------+
                       |
                       v
                 Idempotency
                       |
                       v
              Distributed Systems
                       |
                       v
                Observability
                       |
                       v
                  Scalability
                       |
                       v
                 Trade-offs
```

> **Interview rule:** Don't stop after writing working code. Explain what happens when traffic increases, Redis fails, the database becomes slow, an external API times out, the same request arrives twice, a worker crashes, or two application instances process the same job.
