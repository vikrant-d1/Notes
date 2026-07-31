### 1. What are your must-haves in production for a Node service?
For a production-ready Node.js service, I focus on reliability, observability, security, scalability, and maintainability.

**First, logging and monitoring.** I use structured logging with libraries like Pino or Winston and integrate an APM tool such as New Relic or Datadog. I also expose health endpoints like /health and /ready for Kubernetes or the load balancer.

**Second, error handling.** I implement centralized error handling, catch unhandled promise rejections and uncaught exceptions, and ensure the application shuts down gracefully after logging critical errors.

**Third, configuration management.** I keep configuration in environment variables, validate them at startup, and never hard-code secrets. Secrets are managed through a secure secret manager.

**Fourth, security.** I use Helmet, CORS, input validation with Zod or Joi, rate limiting, JWT verification, password hashing with bcrypt, and keep dependencies updated.

**Fifth, performance.** I enable compression, use Redis caching where appropriate, optimize database queries with indexes, implement connection pooling, and avoid blocking the Node.js event loop.

**Sixth, scalability.** Since Node.js is single-threaded, I run multiple instances using PM2 or Kubernetes, place them behind a load balancer, and ensure the service is stateless so it can scale horizontally.

**Seventh, deployment.** I prefer Docker-based deployments with CI/CD pipelines, blue-green or canary deployments, automatic rollback capability, and zero-downtime releases.

**Finally, testing.** I include unit, integration, and API tests, and production readiness checks before every release.


### 2. Imagine one of your APIs suddenly becomes slow in production. Latency jumps from 200 milliseconds to 3 seconds right after a deploy. Walk me through, step by step, exactly how you'd investigate and isolate the root cause.
"If an API latency increases from 200 ms to 3 seconds immediately after deployment, my first assumption is that the deployment introduced the issue. I would investigate in this order.

**Step 1:** Confirm the issue

First, I'd verify the increase in latency using New Relic, Datadog, or CloudWatch dashboards. I'd check:

Response time
Error rate
Request throughput
Whether all instances are affected or only a subset

Since it happened immediately after deployment, I'd compare metrics before and after the release.

**Step 2:** Check application logs

Next, I'd review structured logs for any new errors, warnings, exceptions, or timeout messages. I'd correlate logs using request IDs or trace IDs to identify where requests are slowing down.

**Step 3:** Use APM tracing

I'd open the slow transaction trace in New Relic or another APM tool to identify where time is being spent:

Database query
External API call
Redis
Application logic
File system

This quickly tells me which layer is responsible.

**Step 4:** Check infrastructure

I'd verify CPU usage, memory consumption, garbage collection activity, event loop delay, and container restarts. If CPU or memory suddenly spikes after deployment, it could indicate inefficient code or a memory leak.

**Step 5:** Database investigation

If the APM shows database latency, I'd inspect:

Slow query logs
Query execution plans
Missing indexes
Locking or deadlocks
Connection pool exhaustion

I'd compare the generated SQL before and after deployment to see if a code change altered query behavior.

**Step 6:** External dependencies

If the delay comes from another service or third-party API, I'd check:

Network latency
Timeouts
Retry behavior
Circuit breaker status

A downstream service slowdown can easily propagate to our API.

**Step 7:** Compare the deployment

Since the issue started right after deployment, I'd review:

Git diff
Feature flags
Configuration changes
Environment variable changes
Dependency version updates

I'd identify exactly what changed in this release.

**Step 8:** Decide on rollback

If customer impact is high and the root cause isn't immediately obvious, I'd roll back to the previous stable version using our blue-green or canary deployment strategy. Restoring service takes priority while the investigation continues.

**Step 9:** Verify the fix

After fixing or rolling back, I'd monitor latency, error rate, CPU, memory, and business metrics to ensure performance has returned to normal and there are no regressions.

Finally, I'd document the root cause and preventive actions, such as adding tests, improving monitoring, or introducing alerts."

### 3. Imagine your Node app is running on Kubernetes with 10 pods behind a load balancer. One pod starts responding much slower than the others, but the rest are fine. How would you identify and resolve that?
First, compare that pod's metrics against healthy ones. CPU, memory, restarts, event loop delay. Then, check the logs for that specific pod. Look for skewed config. Maybe one has a different env or sticky sessions pinning heavy users. If it's safe, you can drain and restart that pod, but capture evidence first if you suspect a leak. Then, verify by monitoring the replacement.

### 4. Design a rate limiter for a Node API behind a load balancer. How would you design it, and why not just in memory?
I would use Redis as a centralized, atomic counter because all Node.js instances behind the load balancer need a shared view of request counts. In-memory rate limiting doesn't work in a distributed environment due to isolated process memory, pod restarts, and horizontal scaling. For production, I'd implement a Redis-backed token bucket algorithm with atomic operations, return standard rate-limit headers, and define a clear strategy for Redis failures.

### 5. Your Node app is on Kubernetes behind a load balancer. Traffic doubles after a campaign. CPU looks fine, but latency spikes from 200 milliseconds to 2 seconds. Database is healthy. Walk me through how you'd investigate and what metrics you'd check first.
Healthy CPU doesn't necessarily mean the application isn't overloaded. In Node.js, a single blocked event loop, waiting on I/O, connection pool contention, or a slow downstream dependency can all increase response time dramatically while CPU usage remains relatively low. That's why I'd rely on traces and runtime metrics rather than CPU alone.

## 1. Production Incident

### Question

Describe a production incident you handled end-to-end.

### Strong Answer

-   An alert was triggered because an e-commerce API started failing in
    production.
-   I opened **New Relic APM** and checked the failed transaction
    traces.
-   I identified the exact error and isolated the failing code path.
-   The root cause was an incorrect variable/configuration causing the
    API failure.
-   I fixed the bug, added unit tests, and verified the fix in a
    development environment.
-   I deployed the fix using **canary deployment**.
-   I monitored error rate, latency, logs, and New Relic metrics.
-   After confirming stability, I shifted 100% of traffic to the new
    version.

------------------------------------------------------------------------

## 2. N+1 Query in Prisma

### Question

How would you identify and fix an N+1 query?

### Strong Answer

1.  Detect slow transactions in New Relic.
2.  Find the SQL query causing excessive database calls.
3.  Confirm using Prisma query logs.
4.  Fix using:
    -   `include`
    -   `select`
    -   batching
    -   DataLoader (especially for GraphQL)
5.  Verify with tests.
6.  Deploy to Dev.
7.  Canary deployment.
8.  Confirm latency improvement in New Relic.

------------------------------------------------------------------------

## 3. Zero Downtime Index Creation

### Question

How do you add an index to a large production table without downtime?

### Strong Answer (Memorize)

1.  Run **EXPLAIN ANALYZE**.
2.  Confirm an index will improve performance.
3.  Create the index without blocking writes.

PostgreSQL:

``` sql
CREATE INDEX CONCURRENTLY idx_orders_user_id
ON orders(user_id);
```

4.  Wait until index creation completes.
5.  Deploy the application normally.
6.  Canary deployment for the application.
7.  Monitor New Relic and database metrics.
8.  Confirm the query planner uses the index with `EXPLAIN ANALYZE`.

If adding a new column: - Add nullable column. - Deploy
backward-compatible code. - Backfill in batches. - Enable with feature
flag. - Remove old code later (expand → migrate → contract).

------------------------------------------------------------------------

## 4. High CPU Usage

### Question

How do you prove Node.js is CPU-bound?

### Strong Answer

First, prove the problem.

Check: - New Relic CPU usage - Event loop delay - Request latency -
Database latency - External API latency

If DB and network are healthy but CPU is high and event loop delay is
high, it is likely CPU-bound.

Then profile:

-   Node.js Inspector (built-in)
-   Clinic.js (external npm package)

Remember:

-   **New Relic = Monitoring**
-   **Node Inspector / Clinic.js = Profiling**

Fixes: - Optimize expensive algorithms. - Avoid unnecessary loops. -
Move CPU-intensive work to Worker Threads. - Use PM2 cluster or
Kubernetes replicas for horizontal scaling.

------------------------------------------------------------------------

## 5. Memory Leak

### Question

Memory keeps increasing until Kubernetes OOMKills the pod.

### Strong Answer

1.  Observe memory growth in New Relic.
2.  Verify heap usage never drops after GC.
3.  Capture heap snapshots using:
    -   Node.js Inspector
    -   heapdump
4.  Compare snapshots.
5.  Find retained objects.

Common causes: - Global cache - Uncleared timers - Event listeners -
Closures - Large Maps/Sets

Fix the leak.

Deploy with rolling/canary deployment.

Monitor memory after deployment.

Remember:

-   **New Relic detects the leak.**
-   **Heap Snapshot identifies the leaked object.**

------------------------------------------------------------------------

## 6. Latency Increased After Deployment

### Question

API latency increased from 200 ms to 3 seconds immediately after
deployment.

### Strong Answer

1.  Confirm customer impact.
2.  Check New Relic deployment markers.
3.  Compare previous vs current deployment.
4.  If customers are impacted significantly:
    -   Roll back immediately.
5.  Verify service recovery.
6.  Debug root cause:
    -   Slow query
    -   Missing index
    -   N+1 query
    -   Infinite loop
    -   External API
7.  Fix.
8.  Test.
9.  Canary deployment.
10. Monitor.

Priority:

Restore service first.

Investigate later.

------------------------------------------------------------------------

## 7. Redis Failure

### Question

Redis goes down. Login becomes slow.

### Strong Answer

1.  Check Redis health.
2.  Check connection errors.
3.  Determine impact:
    -   Cache only?
    -   Session store?
4.  If cache:
    -   Bypass cache carefully.
    -   Protect DB with rate limiting.
5.  If session store:
    -   Fail gracefully.
6.  Restart or failover Redis.
7.  Verify application recovery.
8.  Perform RCA.

------------------------------------------------------------------------

# Interview Tips

## Monitoring vs Profiling

Monitoring: - New Relic - Prometheus - Grafana

Profiling: - Node.js Inspector - Clinic.js - heapdump

## Golden Incident Flow

1.  Detect
2.  Measure
3.  Isolate
4.  Mitigate
5.  Restore
6.  Root Cause Analysis
7.  Permanent Fix
8.  Canary Deployment
9.  Monitor


