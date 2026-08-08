# Node.js Senior Developer 

## How to Answer Production Scenarios

For most production incidents, structure your answer as:

1.  **Identify the symptom**
2.  **Check metrics, logs, and traces**
3.  **Find the bottleneck/root cause**
4.  **Contain the failure**
5.  **Fix the root cause**
6.  **Add prevention, monitoring, and alerts**

------------------------------------------------------------------------

# 1. API Performance & Latency

## 1. API latency suddenly increased. What will you check?

**Answer:**

Investigate from the outside in:

``` text
Client
  ↓
Load Balancer
  ↓
Node.js
  ↓
Redis
  ↓
PostgreSQL
  ↓
External APIs
```

Check:

-   p50/p95/p99 latency
-   CPU and memory
-   event-loop lag
-   database query duration
-   Redis latency
-   external API latency
-   connection pool usage
-   recent deployments
-   traffic increase

Use metrics and tracing before changing code.

------------------------------------------------------------------------

## 2. CPU is normal but API latency increased. Why?

Possible causes:

-   PostgreSQL slow query
-   Redis latency
-   external API timeout
-   connection pool exhaustion
-   network latency
-   event-loop blocking
-   lock contention

CPU alone does not determine API latency.

------------------------------------------------------------------------

## 3. One endpoint is slow but all others are normal. What do you investigate?

Check:

``` text
Route
  ↓
Controller
  ↓
Service
  ↓
Database
  ↓
External APIs
```

Look for:

-   N+1 queries
-   missing indexes
-   large response payloads
-   unnecessary serialization
-   synchronous operations
-   external API calls
-   inefficient loops

------------------------------------------------------------------------

## 4. API p99 latency is high but average latency is normal. Why?

Average latency can hide slow requests.

Investigate:

-   p95/p99
-   slow database queries
-   GC pauses
-   occasional external API timeout
-   connection pool waits
-   lock contention
-   large requests

------------------------------------------------------------------------

## 5. API becomes slow only during peak traffic.

Likely causes:

-   DB connection pool exhaustion
-   CPU saturation
-   insufficient Node.js instances
-   Redis bottleneck
-   queue backlog
-   rate limits
-   lock contention

Compare traffic with resource utilization.

------------------------------------------------------------------------

## 6. API normally responds in 200ms but suddenly takes 5 seconds.

Check dependency timings.

Example:

``` text
API                5 sec
 ├── Redis          50ms
 ├── PostgreSQL    100ms
 └── Payment API  4.5 sec
```

The external dependency may be responsible.

------------------------------------------------------------------------

## 7. How would you debug production latency?

Use:

-   metrics
-   structured logs
-   distributed tracing
-   request/correlation IDs
-   database query metrics
-   Node.js event-loop metrics

Avoid blindly optimizing code without evidence.

------------------------------------------------------------------------

## 8. API has high memory usage after traffic increases.

Possible causes:

-   objects retained in memory
-   unbounded cache
-   large request bodies
-   streams not closed
-   event listeners accumulating
-   WebSocket connections
-   memory leak

Use heap snapshots and monitor RSS/heap usage.

------------------------------------------------------------------------

## 9. Response payload is huge. What would you do?

Use:

-   pagination
-   field selection
-   compression where appropriate
-   streaming
-   smaller DTOs
-   avoid returning unnecessary database columns

------------------------------------------------------------------------

## 10. API is slow because of N+1 queries.

Example:

``` text
Get 100 users
  ↓
100 separate order queries
```

Instead, batch queries:

``` text
Get users
  ↓
Batch order query
```

For GraphQL, use DataLoader.

------------------------------------------------------------------------

# 2. Redis Scenarios

## 11. Redis is down. What should happen?

For a cache, do not necessarily allow the entire application to fail.

``` text
Redis unavailable
      ↓
Log + metric
      ↓
Fallback to PostgreSQL
```

For Redis used as a critical session or coordination store, behavior
depends on the architecture. Use timeouts and circuit breaking.

------------------------------------------------------------------------

## 12. Redis latency suddenly increased.

Check:

-   CPU
-   memory
-   network
-   slow commands
-   large keys
-   `KEYS`
-   connection count
-   eviction
-   blocked clients

Avoid:

``` ts
await redis.keys("*");
```

for large datasets in production. Prefer cursor-based `SCAN`.

------------------------------------------------------------------------

## 13. Redis memory is full.

Check:

-   key size
-   TTL
-   eviction policy
-   large values
-   unbounded cache
-   forgotten keys

Possible solutions:

``` text
TTL
+
LRU/LFU eviction
+
smaller objects
+
cache cleanup
```

------------------------------------------------------------------------

## 14. Cache stampede occurs. How do you solve it?

Suppose a popular key expires:

``` text
10,000 requests
       ↓
Cache miss
       ↓
10,000 DB queries
```

Solutions:

-   request coalescing
-   distributed lock
-   TTL jitter
-   stale-while-revalidate
-   cache warming

------------------------------------------------------------------------

## 15. Redis cache contains stale data.

Use:

-   TTL
-   explicit invalidation
-   write-through cache
-   event-based invalidation

Example:

``` ts
await prisma.user.update(...);
await redis.del(`user:${id}`);
```

------------------------------------------------------------------------

## 16. Redis `get()` returns old data after a database update.

Likely a cache invalidation problem.

Define a clear consistency strategy:

``` text
Update DB
  ↓
Invalidate cache
  ↓
Next request reloads cache
```

------------------------------------------------------------------------

## 17. Redis connection keeps disconnecting.

Check:

-   connection timeout
-   network
-   Redis max clients
-   container networking
-   TLS configuration
-   reconnect strategy
-   server resource usage

------------------------------------------------------------------------

# 3. PostgreSQL Scenarios

## 18. PostgreSQL connection pool is exhausted.

Symptoms:

``` text
Timeout acquiring connection
```

Investigate:

-   pool size
-   long-running transactions
-   missing `finally`
-   slow queries
-   connection leaks
-   too many Node.js instances

Correct pattern:

``` ts
const client = await pool.connect();

try {
  await client.query(...);
} finally {
  client.release();
}
```

------------------------------------------------------------------------

## 19. PostgreSQL CPU is 100%.

Check:

-   slow queries
-   missing indexes
-   sequential scans
-   expensive joins
-   high concurrency
-   autovacuum issues

Use:

``` sql
EXPLAIN ANALYZE
```

------------------------------------------------------------------------

## 20. Query suddenly became slow.

Check:

-   execution plan
-   indexes
-   table size
-   statistics
-   locks
-   query parameters
-   recent schema/data changes

------------------------------------------------------------------------

## 21. Database deadlock occurs.

Example:

``` text
Transaction A locks row 1
Transaction B locks row 2

A → waits for row 2
B → waits for row 1
```

Solutions:

-   consistent lock ordering
-   short transactions
-   proper indexes
-   retry deadlock failures where appropriate

------------------------------------------------------------------------

## 22. Transaction rollback occurs halfway through order creation.

Use a database transaction:

``` ts
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create(...);

  await tx.orderItem.create(...);

  await tx.payment.create(...);
});
```

If an operation fails, the transaction rolls back.

------------------------------------------------------------------------

## 23. Transaction remains open for a long time.

Possible causes:

-   external API call inside transaction
-   slow query
-   application waiting
-   forgotten commit/rollback

Avoid:

``` text
BEGIN
  ↓
DB query
  ↓
Payment API
  ↓
10 seconds
  ↓
UPDATE
  ↓
COMMIT
```

Keep transactions short.

------------------------------------------------------------------------

## 24. How would you handle database failure?

Classify errors:

``` text
Temporary connection error → retry
Validation error            → don't retry
Constraint violation        → don't blindly retry
Deadlock                    → controlled retry
```

------------------------------------------------------------------------

## 25. PostgreSQL works locally but not in Docker.

Check:

``` text
localhost vs postgres
```

Inside Docker, `localhost` means the current container.

Use the Docker service name:

``` env
DATABASE_URL=postgresql://user:pass@postgres:5432/db
```

------------------------------------------------------------------------

## 26. Database has too many connections.

Possible reasons:

-   too many application instances
-   pool size too large
-   connection leak
-   workers creating separate pools

Calculate total potential connections across all instances.

------------------------------------------------------------------------

## 27. Query works in development but fails in production.

Check:

-   schema version
-   migrations
-   permissions
-   indexes
-   data volume
-   PostgreSQL version
-   query planner
-   environment variables

------------------------------------------------------------------------

# 4. Kafka / Message Queue

## 28. Kafka lag is continuously increasing.

This means consumers cannot keep up.

Check:

``` text
Producer rate
Consumer rate
Partition count
Consumer count
Processing time
Consumer errors
```

Solutions:

-   increase consumers
-   increase partitions if appropriate
-   optimize processing
-   batch processing
-   remove slow downstream dependencies

------------------------------------------------------------------------

## 29. Kafka consumer is processing messages slowly.

Measure:

``` text
Kafka fetch
  ↓
Deserialization
  ↓
Business logic
  ↓
Database
  ↓
External API
```

Find the slowest stage.

------------------------------------------------------------------------

## 30. Kafka consumer crashes after processing a message.

Important question:

**When is the offset committed?**

Safer flow:

``` text
Process
  ↓
Success
  ↓
Commit offset
```

Duplicate processing can still happen, so consumers should be
idempotent.

------------------------------------------------------------------------

## 31. Kafka message is processed twice.

Possible causes:

-   consumer restart
-   rebalance
-   offset not committed
-   retry

Use idempotency:

``` text
eventId
  ↓
Check processed_events
  ↓
Already processed → skip
New → process
```

------------------------------------------------------------------------

## 32. Kafka partition becomes hot.

One partition receives disproportionate traffic.

Check the partition key.

Example:

``` text
Partition 1 → 90%
Partition 2 → 5%
Partition 3 → 5%
```

Use a better partitioning strategy.

------------------------------------------------------------------------

## 33. Consumer group keeps rebalancing.

Investigate:

-   long processing time
-   heartbeat timeout
-   session timeout
-   consumer crashes
-   network instability

------------------------------------------------------------------------

## 34. Message processing fails repeatedly.

Use:

``` text
Retry
  ↓
Retry limit
  ↓
Dead Letter Queue
```

Do not retry forever.

------------------------------------------------------------------------

## 35. Kafka is temporarily unavailable.

Producer should use:

-   timeout
-   retries
-   backoff
-   appropriate delivery semantics
-   monitoring

Do not let indefinitely blocked Kafka calls consume application
resources.

------------------------------------------------------------------------

# 5. Node.js Event Loop

## 36. Infinite loop blocks Node.js.

Bad:

``` ts
while (true) {
  // CPU-intensive work
}
```

Node.js JavaScript execution is tied to the event loop, so other
requests stop progressing.

------------------------------------------------------------------------

## 37. CPU is 100% but traffic is normal.

Possible:

-   infinite loop
-   CPU-heavy algorithm
-   JSON processing
-   compression
-   cryptographic work
-   large regex
-   synchronous filesystem operations

------------------------------------------------------------------------

## 38. How do you find event-loop blocking?

Monitor:

-   event-loop delay
-   CPU profiles
-   flame graphs
-   synchronous APIs
-   long JavaScript execution

------------------------------------------------------------------------

## 39. CPU-heavy calculation must run in Node.js. What do you do?

Use:

-   `worker_threads`
-   separate worker service
-   queue-based background processing

Do not execute expensive CPU work on the main event loop.

------------------------------------------------------------------------

## 40. Large JSON parsing causes latency spikes.

This is synchronous:

``` ts
JSON.parse(hugePayload);
```

Solutions:

-   limit payload size
-   stream data where appropriate
-   process asynchronously/off-process
-   use workers for CPU-heavy transformations

------------------------------------------------------------------------

# 6. Memory / Garbage Collection

## 41. Memory leak appears after deployment.

Compare:

``` text
Before deployment
      ↓
Heap usage
      ↓
After deployment
      ↓
Heap usage
```

Take heap snapshots and compare retained objects.

------------------------------------------------------------------------

## 42. Node.js heap keeps increasing.

Possible:

-   global arrays/maps
-   cache without TTL
-   event listener leak
-   timers
-   closures retaining objects
-   WebSocket connections
-   request objects retained

------------------------------------------------------------------------

## 43. GC pauses suddenly become high.

Possible:

-   too many short-lived objects
-   huge heap
-   large JSON structures
-   excessive allocations
-   memory pressure

Use profiling and heap analysis.

------------------------------------------------------------------------

## 44. What is the difference between heap and RSS?

**Heap** is memory managed by V8.

**RSS** is total resident memory used by the process, including:

-   V8 heap
-   native memory
-   buffers
-   external allocations

------------------------------------------------------------------------

## 45. Buffer usage causes memory growth.

Node.js `Buffer` can allocate memory outside the V8 heap.

Monitor:

``` ts
process.memoryUsage()
```

Especially:

``` text
rss
heapUsed
heapTotal
external
arrayBuffers
```

------------------------------------------------------------------------

# 7. Socket / Network

## 46. Socket memory leak occurs.

Possible:

-   sockets not closed
-   listeners not removed
-   WebSocket connections retained
-   request streams not consumed
-   agents/connections misconfigured

Track active connections.

------------------------------------------------------------------------

## 47. HTTP sockets remain open.

Check:

-   keep-alive configuration
-   connection timeout
-   response properly ended
-   request stream handling
-   upstream behavior

------------------------------------------------------------------------

## 48. External API never responds.

Always use a timeout.

Use `AbortController` to cancel requests.

Conceptually:

``` text
Request
  ↓
Timeout
  ↓
Abort request
```

Never allow unlimited network requests.

------------------------------------------------------------------------

## 49. File upload times out.

Check:

-   request timeout
-   reverse proxy timeout
-   Node.js server timeout
-   upload size
-   network speed
-   disk/storage latency

For large files, prefer streaming directly to object storage.

------------------------------------------------------------------------

## 50. File upload consumes too much memory.

Avoid loading the entire file into memory.

Prefer:

``` text
Client
  ↓
Stream
  ↓
Object Storage
```

------------------------------------------------------------------------

# 8. Authentication / Authorization

## 51. Authentication service goes down.

Separate authentication from authorization where possible.

For JWT access tokens:

``` text
Request
  ↓
Verify JWT locally
  ↓
Continue
```

You may not need to call the authentication service on every request.

However, token revocation/session checks may require centralized state
depending on the design.

------------------------------------------------------------------------

## 52. Redis is down and refresh-token sessions are stored there.

The system cannot validate refresh sessions.

Possible behavior:

-   fail closed for refresh
-   fallback to persistent session store
-   temporarily reject refresh
-   alert operators

Do not blindly accept tokens.

------------------------------------------------------------------------

## 53. Access token expires during a request.

Return:

``` text
401 Unauthorized
```

The client can use the refresh-token flow to obtain a new access token.

------------------------------------------------------------------------

## 54. Refresh token is reused.

With rotation:

``` text
Refresh Token A
  ↓
Rotate
  ↓
Refresh Token B
```

If token A is used again, treat it as suspicious and invalidate the
session/family according to the security design.

------------------------------------------------------------------------

## 55. JWT secret is compromised.

Immediately:

-   rotate signing keys
-   invalidate affected sessions/tokens as appropriate
-   investigate access
-   deploy new configuration
-   monitor suspicious activity

------------------------------------------------------------------------

## 56. User is authenticated but accesses another user's resource.

That's an authorization failure.

Example:

``` http
GET /users/999
```

but authenticated user owns user `123`.

Always enforce resource authorization server-side.

------------------------------------------------------------------------

# 9. Retry / Resilience

## 57. Retry storm occurs.

Suppose 1,000 requests fail simultaneously.

If all retry immediately:

``` text
1000 failures
   ↓
1000 retries
   ↓
1000 retries
   ↓
Dependency overloaded
```

Use:

-   exponential backoff
-   jitter
-   retry limits
-   circuit breaker
-   queueing

------------------------------------------------------------------------

## 58. Circuit breaker is OPEN. What happens?

Requests should fail fast instead of calling the unhealthy dependency.

Typical states:

``` text
CLOSED
  ↓ failures
OPEN
  ↓ wait
HALF_OPEN
  ↓ success
CLOSED
```

------------------------------------------------------------------------

## 59. Circuit breaker keeps opening.

Investigate:

-   dependency health
-   timeout threshold
-   failure threshold
-   network
-   application configuration

Do not simply increase thresholds without understanding the failure.

------------------------------------------------------------------------

## 60. Should every failed request be retried?

No.

Retry only transient failures.

Do not normally retry:

``` text
400
401
403
404
validation failures
business rule failures
```

------------------------------------------------------------------------

## 61. Payment API times out. Should you retry?

Potentially, but **only with idempotency**.

A timeout does not tell you whether payment succeeded.

``` text
Request sent
  ↓
Payment processed
  ↓
Response lost
```

Retrying without an idempotency key can cause duplicate payment.

------------------------------------------------------------------------

# 10. Distributed Systems / Microservices

## 62. Service A calls B, which calls C. C is down.

Without protection:

``` text
A
 ↓
B
 ↓
C
```

Failure propagates.

Use:

-   timeout
-   retry
-   circuit breaker
-   fallback
-   bulkhead isolation

------------------------------------------------------------------------

## 63. One microservice is overloaded.

Prevent it from consuming all system resources.

Use:

-   concurrency limits
-   queues
-   rate limiting
-   circuit breakers
-   autoscaling

------------------------------------------------------------------------

## 64. Service dependency creates circular calls.

Example:

``` text
A → B
B → C
C → A
```

This is usually an architectural problem.

Redesign service boundaries or use asynchronous communication where
appropriate.

------------------------------------------------------------------------

## 65. Distributed transaction spans three services.

Avoid traditional distributed database transactions where possible.

Use the **Saga Pattern**:

``` text
Order
  ↓
Payment
  ↓
Inventory
```

If inventory fails:

``` text
Compensating action
  ↓
Refund payment
```

------------------------------------------------------------------------

## 66. One service succeeds but the next fails.

Use:

-   Saga
-   Outbox Pattern
-   idempotency
-   event-driven architecture

------------------------------------------------------------------------

# 11. Race Conditions

## 67. Two requests update the same account simultaneously.

Example:

``` text
Balance = 100

Request A → withdraw 80
Request B → withdraw 80
```

Both may see 100.

Solutions:

-   database transaction
-   row-level locking
-   atomic update
-   optimistic concurrency

------------------------------------------------------------------------

## 68. Prevent duplicate order creation.

Use an idempotency key:

``` http
Idempotency-Key: abc-123
```

Store:

``` text
abc-123 → order result
```

If the same request arrives again, return the existing result.

------------------------------------------------------------------------

## 69. Inventory goes negative.

Use atomic database logic.

Instead of:

``` text
SELECT stock
UPDATE stock
```

Use an atomic conditional update:

``` sql
UPDATE products
SET stock = stock - 1
WHERE id = $1
  AND stock > 0;
```

Then check affected rows.

------------------------------------------------------------------------

## 70. Two workers process the same job.

Use:

-   queue visibility timeout
-   job locks
-   idempotency
-   unique constraints
-   distributed locking where appropriate

------------------------------------------------------------------------

# 12. Payments

## 71. User clicks Pay twice.

Use an idempotency key:

``` text
Payment Request
  ↓
Idempotency Key
  ↓
Existing?
 ├── yes → return existing result
 └── no → process
```

------------------------------------------------------------------------

## 72. Payment succeeds but database update fails.

This is a distributed consistency problem.

Use:

-   payment provider idempotency
-   transaction/outbox
-   reconciliation
-   webhook processing
-   compensating actions

Never assume two independent systems can atomically update together.

------------------------------------------------------------------------

## 73. Payment webhook arrives twice.

Webhook handlers must be idempotent.

Store:

``` text
webhookEventId
```

and ignore duplicates.

------------------------------------------------------------------------

## 74. Payment webhook arrives before API response.

Do not rely on response ordering.

Treat the webhook as an independent event and make processing
idempotent.

------------------------------------------------------------------------

## 75. Payment status is `pending` for hours.

Create reconciliation logic:

``` text
Pending
  ↓
Check provider
  ↓
Success → update
Failed → update
Still pending → retry later
```

------------------------------------------------------------------------

# 13. Kubernetes / Docker

## 76. Kubernetes pod enters CrashLoopBackOff.

Check:

``` bash
kubectl logs <pod>
kubectl describe pod <pod>
```

Investigate:

-   startup exception
-   environment variables
-   secrets/config
-   port
-   health checks
-   memory limit
-   database connection

------------------------------------------------------------------------

## 77. Pod is killed because of OOM.

Likely:

``` text
Memory usage > container limit
```

Investigate memory leaks and heap usage before simply increasing the
limit.

------------------------------------------------------------------------

## 78. Liveness probe keeps failing.

Possible:

-   event loop blocked
-   application startup too slow
-   dependency call inside health endpoint
-   CPU saturation

A liveness probe should generally check whether the process is alive,
not whether every dependency is healthy.

------------------------------------------------------------------------

## 79. Readiness probe fails.

This generally means:

``` text
Do not send traffic to this pod
```

Useful when:

-   application isn't ready
-   critical initialization hasn't completed
-   pod is shutting down

------------------------------------------------------------------------

## 80. Kubernetes sends SIGTERM but requests are lost.

Implement graceful shutdown:

``` text
SIGTERM
  ↓
Readiness false
  ↓
Stop accepting traffic
  ↓
Finish existing requests
  ↓
Close connections
  ↓
Exit
```

------------------------------------------------------------------------

# 14. Node.js Process / Error Handling

## 81. `uncaughtException` occurs.

Treat it as fatal.

Example:

``` ts
process.on("uncaughtException", async (error) => {
  logger.fatal(error);

  await shutdown();

  process.exit(1);
});
```

Do not silently continue after an unknown process-level failure.

------------------------------------------------------------------------

## 82. `unhandledRejection` occurs.

Log it and, for serious process-level failures, perform controlled
shutdown.

``` ts
process.on("unhandledRejection", async (reason) => {
  logger.error(reason);

  await shutdown();

  process.exit(1);
});
```

------------------------------------------------------------------------

## 83. What is graceful shutdown?

It means:

``` text
Stop new work
  ↓
Finish/settle existing work
  ↓
Close resources
  ↓
Exit
```

------------------------------------------------------------------------

## 84. Application receives SIGINT.

Usually Ctrl+C.

Handle:

``` ts
process.on("SIGINT", shutdown);
```

------------------------------------------------------------------------

## 85. Application receives SIGTERM.

Common in Kubernetes, Docker, and process managers.

Handle:

``` ts
process.on("SIGTERM", shutdown);
```

------------------------------------------------------------------------

# 15. Express / Middleware

## 86. Middleware is slowing every request.

Check:

-   synchronous processing
-   unnecessary database calls
-   logging
-   authentication calls
-   large payload parsing

Put expensive middleware only where needed.

------------------------------------------------------------------------

## 87. Error middleware doesn't execute.

Express error middleware must have four arguments:

``` ts
(err, req, res, next)
```

It should also be registered after routes.

------------------------------------------------------------------------

## 88. Async errors aren't reaching the Express error handler.

Use appropriate async error handling for your Express version or an
async wrapper.

Conceptually:

``` ts
try {
  ...
} catch (error) {
  next(error);
}
```

------------------------------------------------------------------------

## 89. Middleware calls `next()` twice.

This can cause unpredictable behavior.

Each middleware should either:

``` text
send response
```

or:

``` text
next()
```

but not both.

------------------------------------------------------------------------

# 16. GraphQL

## 90. GraphQL API becomes slow with large queries.

Possible:

-   deeply nested queries
-   N+1 queries
-   expensive resolvers
-   unrestricted query complexity

Use:

-   DataLoader
-   depth limits
-   complexity analysis
-   pagination
-   resolver caching

------------------------------------------------------------------------

## 91. GraphQL resolver performs one DB query per user.

Classic N+1.

Use DataLoader:

``` text
Users
  ↓
DataLoader
  ↓
Batch IDs
  ↓
One DB query
```

------------------------------------------------------------------------

## 92. GraphQL client requests huge data.

Use:

-   pagination
-   query complexity limits
-   maximum depth
-   field-level authorization

------------------------------------------------------------------------

# 17. File / Stream Scenarios

## 93. User uploads a 2GB file.

Do not load it into memory.

Use:

``` text
HTTP stream
  ↓
Object storage
```

------------------------------------------------------------------------

## 94. Stream crashes halfway.

Handle:

-   `error`
-   `close`
-   cleanup
-   partial upload cancellation

------------------------------------------------------------------------

## 95. CSV export contains millions of records.

Do not create one huge array:

``` ts
const users = await getAllUsers();
```

Use streaming/batching:

``` text
DB cursor
  ↓
Transform
  ↓
CSV stream
  ↓
HTTP response
```

------------------------------------------------------------------------

# 18. WebSocket

## 96. WebSocket works on one server but fails with multiple instances.

Problem:

``` text
Client A → Pod 1
Client B → Pod 2
```

Connection state is local.

Use:

-   Redis Pub/Sub
-   Kafka
-   shared event broker
-   sticky sessions where appropriate

------------------------------------------------------------------------

## 97. WebSocket connections keep increasing.

Possible:

-   clients not disconnecting
-   server cleanup missing
-   heartbeat failure
-   memory leak

Track:

``` text
active_connections
connections_created
connections_closed
```

------------------------------------------------------------------------

## 98. One WebSocket client sends too many messages.

Use:

-   rate limiting
-   message-size limits
-   authentication
-   backpressure
-   connection throttling

------------------------------------------------------------------------

# 19. Security

## 99. API suddenly receives millions of requests.

Possible DDoS/abuse.

Use:

-   rate limiting
-   WAF
-   CDN
-   authentication
-   IP/user throttling
-   autoscaling
-   request-size limits

------------------------------------------------------------------------

## 100. User sends SQL injection payload.

Use parameterized queries or a properly configured ORM.

Bad:

``` ts
`SELECT * FROM users WHERE email = '${email}'`
```

Good:

``` ts
await pool.query(
  "SELECT * FROM users WHERE email = $1",
  [email]
);
```

------------------------------------------------------------------------

## 101. User sends an extremely large JSON payload.

Configure body limits:

``` ts
app.use(express.json({
  limit: "1mb"
}));
```

Choose the limit based on actual API requirements.

------------------------------------------------------------------------

# 20. Advanced Production Scenarios

## 102. How would you design a resilient Node.js API?

Baseline architecture:

``` text
                    ┌──────────────┐
Client ────────────►│ Load Balancer│
                    └──────┬───────┘
                           │
                ┌──────────┼──────────┐
                ▼          ▼          ▼
             Node.js    Node.js    Node.js
                │          │          │
                └──────────┼──────────┘
                           │
                ┌──────────┼──────────┐
                ▼          ▼          ▼
             Redis      PostgreSQL   Kafka
                           │
                      Read Replica
```

Include:

``` text
Timeouts
Retries
Exponential Backoff
Jitter
Circuit Breaker
Rate Limiting
Idempotency
DLQ
Graceful Shutdown
Health Checks
Metrics
Logs
Tracing
```

------------------------------------------------------------------------

## 103. Complete Production Incident

**Scenario:**

> Production Node.js API suddenly has 5x latency, Redis is slow,
> PostgreSQL connections are exhausted, Kafka lag is increasing, and CPU
> is 90%. What do you do?

**Strong senior answer:**

I would not immediately restart everything.

First establish whether this is:

``` text
Traffic spike
      OR
Application regression
      OR
Dependency failure
```

### Step 1 --- Check recent deployment

``` text
Did anything change?
```

If yes, compare before/after metrics.

### Step 2 --- Check traffic

``` text
Requests/sec
Error rate
p95
p99
```

### Step 3 --- Check Node.js

``` text
CPU
Memory
Event-loop lag
GC pauses
Active connections
```

### Step 4 --- Check Redis

``` text
Latency
CPU
Memory
Connections
Slow commands
Evictions
```

### Step 5 --- Check PostgreSQL

``` text
Active connections
Waiting connections
Slow queries
Locks
CPU
```

### Step 6 --- Check Kafka

``` text
Consumer lag
Consumer errors
Processing latency
```

### Step 7 --- Protect dependencies

Verify:

``` text
Timeouts
Circuit breakers
Bounded retries
Backoff + jitter
Rate limiting
```

### Step 8 --- Reduce pressure

Potentially:

``` text
Scale Node.js
  ↓
Reduce expensive requests
  ↓
Queue background work
  ↓
Temporarily disable non-critical features
```

### Step 9 --- Find the root cause

Example:

``` text
New deployment
  ↓
Cache key bug
  ↓
Cache hit rate dropped
  ↓
PostgreSQL traffic increased
  ↓
DB pool exhausted
  ↓
API requests waited
  ↓
Kafka consumers slowed
  ↓
Kafka lag increased
```

Do not blindly increase pod count if the real bottleneck is PostgreSQL.

------------------------------------------------------------------------

## 104. Duplicate Payment + Timeout Scenario

**Scenario:**

> Payment API times out. You retry. Payment succeeds but your API never
> receives the response. What happens?

**Strong answer:**

A timeout does not mean the payment failed.

The provider may have successfully charged the customer.

``` text
Request
  ↓
Payment provider
  ↓
Payment succeeds
  ↓
Response lost
  ↓
Our service sees timeout
```

Do not blindly create another payment.

Use:

``` text
Idempotency Key
+
Payment Provider Status API
+
Webhook
+
Payment Reconciliation
```

Flow:

``` text
Client
  ↓
Idempotency Key
  ↓
Payment Service
  ↓
Provider
  ↓
Timeout
  ↓
Don't duplicate charge
  ↓
Check status / wait for webhook
  ↓
Update order
```

------------------------------------------------------------------------

## 105. Memory Leak Scenario

**Scenario:**

> After the latest Node.js deployment, memory increases continuously
> until Kubernetes kills the pod. What do you do?

**Answer:**

First compare memory before and after deployment.

Monitor:

``` text
Heap Used
RSS
External Memory
GC
```

Then:

``` text
Heap snapshot
  ↓
Compare snapshots
  ↓
Find retained objects
```

Investigate:

-   global Maps
-   arrays
-   caches
-   event listeners
-   timers
-   WebSockets
-   Buffers
-   closures

Reproduce under load.

Do not solve the problem simply by increasing the Kubernetes memory
limit.

------------------------------------------------------------------------

## 106. PostgreSQL Pool + Node.js Scenario

**Scenario:**

> PostgreSQL connection pool is exhausted, but database CPU is only 30%.
> Why?

**Strong answer:**

Pool exhaustion does not necessarily mean PostgreSQL is overloaded.

Connections may be held by:

-   long-running transactions
-   leaked connections
-   slow queries
-   application code waiting while holding a connection
-   incorrectly configured pool size
-   too many Node.js instances

Inspect:

``` text
Pool size
Active connections
Idle connections
Waiting clients
Transaction duration
Long-running queries
Connection leaks
```

------------------------------------------------------------------------

## 107. Kafka Lag Scenario

**Scenario:**

> Kafka lag increases from 10K to 10M messages. What do you do?

**Answer:**

Check:

``` text
Producer rate
Consumer rate
Consumer errors
Processing latency
Partition distribution
Database latency
External API latency
```

If processing is healthy but insufficient:

``` text
Increase consumers
```

If consumers are blocked by PostgreSQL:

``` text
Fix PostgreSQL bottleneck first
```

Do not blindly add consumers if the downstream database is already
overloaded.

------------------------------------------------------------------------

## 108. Cache Stampede Scenario

**Scenario:**

> A popular product cache expires at exactly 12:00 PM. 50,000 users
> request it simultaneously. What happens?

Without protection:

``` text
50,000 cache misses
        ↓
50,000 DB queries
```

Solutions:

``` text
TTL jitter
+
Request coalescing
+
Distributed lock
+
Stale-while-revalidate
```

------------------------------------------------------------------------

## 109. Infinite Event Loop Scenario

**Scenario:**

> CPU suddenly reaches 100%, requests timeout, but memory is normal.
> What do you suspect?

Possible causes:

``` text
Infinite loop
CPU-heavy algorithm
Synchronous operation
Large JSON.parse/stringify
Regex backtracking
Crypto/compression
```

Use CPU profiling, flame graphs, and event-loop delay metrics.

------------------------------------------------------------------------

## 110. Final Senior-Level Question

**Question:**

> What makes a Node.js production system reliable?

**Strong answer:**

I would design for failure rather than assuming dependencies always
work.

``` text
                 Node.js Service
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
      Redis         PostgreSQL       Kafka
        │              │              │
        └──────────────┼──────────────┘
                       │
              Resilience Layer
                       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
    Timeout          Retry          Circuit Breaker
       │               │                │
       ▼               ▼                ▼
   Backoff           Jitter           Fallback
                       │
                       ▼
                      DLQ
```

Operationally:

``` text
Observability
├── Logs
├── Metrics
├── Tracing
└── Alerts

Reliability
├── Graceful shutdown
├── Health checks
├── Idempotency
├── Rate limiting
├── Backpressure
├── Retry policies
├── Circuit breakers
└── DLQ

Performance
├── Event-loop monitoring
├── DB optimization
├── Redis caching
├── Connection pools
├── Streaming
└── Worker threads
```

------------------------------------------------------------------------

# Rapid-Fire Interview Checklist

Before a Senior Node.js interview, be able to explain these without
hesitation:

-   [ ] Event loop
-   [ ] Event-loop blocking
-   [ ] Worker Threads
-   [ ] Streams
-   [ ] Buffers
-   [ ] Async Hooks
-   [ ] AsyncLocalStorage
-   [ ] Graceful shutdown
-   [ ] Memory leaks
-   [ ] GC pauses
-   [ ] CPU profiling
-   [ ] Connection pooling
-   [ ] PostgreSQL transactions
-   [ ] Deadlocks
-   [ ] Race conditions
-   [ ] Optimistic/pessimistic locking
-   [ ] Redis caching
-   [ ] Cache stampede
-   [ ] Redis failure
-   [ ] Kafka consumer lag
-   [ ] Kafka partitioning
-   [ ] Consumer rebalancing
-   [ ] Idempotency
-   [ ] Retry/backoff/jitter
-   [ ] Circuit breaker
-   [ ] Rate limiting
-   [ ] Backpressure
-   [ ] Saga
-   [ ] Outbox Pattern
-   [ ] CQRS
-   [ ] API Gateway
-   [ ] BFF
-   [ ] WebSocket scaling
-   [ ] JWT
-   [ ] Refresh-token rotation
-   [ ] OAuth2/OIDC
-   [ ] API security
-   [ ] SQL injection
-   [ ] Docker
-   [ ] Kubernetes
-   [ ] Liveness/readiness probes
-   [ ] CrashLoopBackOff
-   [ ] OOMKilled
-   [ ] Health checks
-   [ ] Observability
-   [ ] Logs
-   [ ] Metrics
-   [ ] Distributed tracing
-   [ ] Production incident response

# Senior Answer Formula

For any scenario, use this framework:

``` text
SYMPTOM
  ↓
IMPACT
  ↓
METRICS / LOGS / TRACES
  ↓
ROOT CAUSE
  ↓
IMMEDIATE MITIGATION
  ↓
PERMANENT FIX
  ↓
PREVENTION
  ↓
MONITORING / ALERT
```

Example:

``` text
Kafka lag increasing
  ↓
Consumer throughput below producer throughput
  ↓
Check consumer metrics + DB latency + errors
  ↓
PostgreSQL is slow
  ↓
Reduce consumer concurrency / protect DB
  ↓
Optimize DB query + index
  ↓
Add capacity planning
  ↓
Alert on consumer lag and processing latency
```

## Final Interview Tip

A strong Senior Node.js answer should demonstrate more than coding
knowledge.

Show that you understand:

``` text
Code
 ↓
Runtime
 ↓
Database
 ↓
Cache
 ↓
Messaging
 ↓
Network
 ↓
Infrastructure
 ↓
Observability
 ↓
Failure Recovery
```

The interviewer should hear **how you investigate, mitigate, fix, and
prevent production failures**, not just the definition of a technology.
