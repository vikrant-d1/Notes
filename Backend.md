## Load Balancer (ALB/NLB)

#### 1. Why do we need a Load Balancer?
To distribute traffic across multiple servers, improving scalability, availability, and fault tolerance.

#### 2. When would you use Round Robin instead of Least Connections?
Round Robin works well when requests have similar processing times and servers have similar capacity. Least Connections is better when request durations vary significantly.

#### 3. Why are Sticky Sessions generally discouraged?
They create uneven traffic distribution and make scaling and failover harder. A shared session store like Redis allows any application instance to serve any request.

####  4. ALB or NLB for a REST API?
ALB, because it understands HTTP/HTTPS and supports features like path-based routing, host-based routing, authentication integration, and WebSockets.

#### 5. ALB or NLB for PostgreSQL?
NLB, because PostgreSQL uses TCP rather than HTTP, and NLB is designed for high-performance Layer 4 traffic.

####  6. What happens if one server crashes?
The load balancer's health checks mark it as unhealthy and stop routing new requests to it until it recovers.

#### 7. Can a Load Balancer improve application performance?
Yes. By distributing traffic across multiple instances, it reduces overload on individual servers, lowers response times, and increases the application's ability to handle concurrent users. However, it doesn't make a single server faster; it improves overall system throughput and resilience.

#### What is an Auto Scaling Group?
An Auto Scaling Group automatically launches, terminates, and replaces EC2 instances based on health checks and scaling policies while maintaining the desired capacity.

#### Does the ALB create EC2 instances?

No.

The ALB only distributes traffic.

The ASG manages EC2 instances.

#### How does a new EC2 receive traffic?
The ASG launches the instance and registers it with the target group. The ALB begins routing traffic only after the instance passes the configured health checks.

#### What happens if an EC2 crashes?
The ALB health checks detect the failure and stop sending requests to that instance. The ASG then terminates the unhealthy instance (if needed) and launches a replacement to maintain the desired capacity.

#### Which scaling policy do you prefer?
Target Tracking Scaling because it automatically adjusts capacity to maintain a target metric (such as 50% CPU utilization) and usually requires less manual tuning than step scaling.

#### Traffic increases from 5,000 to 100,000 users in five minutes. Explain exactly what happens.

The users' requests first reach the Application Load Balancer. Initially, the ALB distributes traffic across the existing EC2 instances in the target group. As load increases, CloudWatch metrics such as CPU utilization or RequestCountPerTarget exceed the configured threshold. The Auto Scaling Group then launches additional EC2 instances using the launch template. Each new instance starts the application, runs the user-data bootstrap script if configured, registers with the target group, and must pass the ALB health checks before receiving traffic. As demand falls, the ASG gradually terminates excess instances according to the scaling policy, reducing infrastructure costs while maintaining availability.

#### What is a Target Group?
A Target Group is a collection of backend targets (such as EC2 instances, IP addresses, or Lambda functions) that an ALB forwards requests to. It also manages health checks for those targets.

#### Does an ALB send traffic directly to EC2?
No.
Traffic flow is:
```
ALB

↓

Listener

↓

Listener Rule

↓

Target Group

↓

EC2
```

#### What is a Listener?
A Listener defines the protocol and port (for example, HTTP:80 or HTTPS:443) that the ALB accepts. It evaluates listener rules and performs actions such as forwarding or redirecting requests.

#### How do you route requests to different microservices?

Using listener rules.

#### What happens if a target becomes unhealthy?
The Target Group health check marks the target as unhealthy, and the ALB immediately stops routing requests to it. If the instances are managed by an Auto Scaling Group, the ASG can replace the unhealthy instance automatically.

#### You have three Node.js microservices:

User Service
Order Service
Payment Service

How would you expose them using one ALB?

I would create three Target Groups—one for each microservice. The ALB would listen on HTTPS port 443. I'd configure path-based listener rules so /api/users/* forwards to the User Target Group, /api/orders/* forwards to the Order Target Group, and /api/payments/* forwards to the Payment Target Group. Each Target Group would have its own health check endpoint, such as /health. If the services are behind Auto Scaling Groups, new instances automatically register with the appropriate Target Group after passing health checks. This architecture lets each microservice scale independently while exposing a single public endpoint.

#### Can one ALB have multiple Target Groups?
Yes. In fact, that's a common design for microservices. A single ALB can have multiple listeners and multiple listener rules that route requests to different Target Groups based on paths, hosts, headers, query strings, or weighted routing rules.

#### What is SSL termination?
SSL termination means the Load Balancer performs the TLS handshake, decrypts incoming HTTPS traffic, and forwards the request to the backend.

#### Why terminate SSL at the ALB?
It centralizes certificate management, reduces CPU overhead on backend servers, simplifies deployments, and integrates well with AWS Certificate Manager for automatic renewal.

#### What is SSL Offloading?
SSL Offloading is another name for SSL termination. The ALB handles encryption and decryption so backend servers don't have to.

#### You have 10 Node.js EC2 instances behind an ALB. Where would you install the SSL certificate?

I would attach the SSL certificate to the ALB using AWS Certificate Manager. The ALB would terminate HTTPS connections and forward traffic to the target group. For most internal workloads, HTTP between the ALB and EC2 inside the private VPC is acceptable. If regulatory or security requirements demand encryption all the way to the application, I'd configure the target group to use HTTPS and install backend certificates as well.

#### Immediately after deployment, users start receiving 502 Bad Gateway. Explain exactly how you investigate.
CloudWatch to identify whether the error originates at the ALB or the targets, Target Group health to verify instance availability, health endpoints and application logs to isolate backend issues, and finally downstream dependencies like Redis and PostgreSQL. This structured approach minimizes mean time to resolution and avoids chasing the wrong component.

#### What is a Reverse Proxy?
A reverse proxy sits in front of backend servers, receives client requests, and forwards them to the appropriate backend. It can also provide SSL termination, load balancing, caching, compression, and security features.

#### Why use Nginx with Node.js?
Nginx efficiently serves static content, terminates SSL, compresses responses, proxies requests, and can load balance multiple Node.js instances, allowing Node.js to focus on application logic.

#### Difference between Nginx and HAProxy?
Nginx is a web server and reverse proxy with strong support for serving static content. HAProxy is focused on high-performance load balancing and high availability, especially for large-scale HTTP and TCP workloads.

#### Difference between ALB and Nginx?
ALB is a fully managed AWS load balancer with built-in scaling, health checks, and AWS integrations. Nginx is self-managed software that runs on your own servers and provides reverse proxy, web serving, and load balancing capabilities.

#### When would you choose HAProxy?
When the primary requirement is high-performance load balancing, advanced health checks, connection management, or TCP load balancing at very high scale.

#### You have 10 Node.js servers. Why would you place Nginx in front of them?
I use Nginx as a reverse proxy to handle concerns that shouldn't be part of the application logic. It serves static assets efficiently, terminates SSL when appropriate, compresses responses, adds security headers, and proxies API requests to the Node.js application. If I need load balancing across multiple Node.js instances on the same infrastructure, Nginx can also distribute traffic. In AWS, I typically place an Application Load Balancer in front for managed load balancing and Auto Scaling integration, while Nginx handles web server responsibilities on each instance when needed.

#### If you're already using an AWS ALB, do you always need Nginx?
No. Many modern Node.js applications run successfully with ALB directly forwarding requests to the application. I would add Nginx only if I need capabilities such as efficient static file serving, response compression, custom proxy rules, security headers, request buffering, or other web server features that the ALB doesn't provide. The decision depends on the application's requirements rather than using Nginx by default.

#### Why do we need retries?
To recover from temporary failures such as network issues, database timeouts, or third-party service outages.

#### Your Kafka consumer charged a customer's credit card twice. How would you fix it?
Kafka provides at-least-once delivery, so duplicate messages are possible. I would make the consumer idempotent by using a unique message ID or order ID. Before charging the customer, I'd check whether that message has already been processed, either by looking up a processed-message table or relying on a database unique constraint. If it's already processed, I'd skip it. For transient failures like payment gateway timeouts, I'd retry with exponential backoff and jitter. If the message continues to fail after the configured retry limit, I'd send it to a Dead Letter Queue for investigation instead of retrying forever.




## Blue/Green and Canary deployments 

#### A new release caused 500 errors for some users. Which deployment strategy minimizes impact?

Canary deployment. Only a small percentage of users receive the new version initially. If errors appear, stop the rollout and route traffic back to the stable version.

#### Which deployment strategy offers the fastest rollback?
Blue/Green deployment, because the previous environment is still running and the load balancer can redirect traffic back almost instantly.

#### How does an ALB support Blue/Green deployments?
Create separate target groups for Blue and Green. Deploy the new version to the Green target group, verify health checks, then update the ALB listener to forward production traffic to Green. If needed, switch the listener back to Blue.

#### What metrics do you monitor during a Canary deployment?
Monitor:

HTTP 5xx error rate
Response latency (p95/p99)
Request success rate
CPU and memory utilization
Business KPIs (orders, payments, sign-ins)
Application logs and traces

#### Why is Blue/Green deployment safer than deploying directly to production?

Because the new version is deployed to a separate environment. After validation, traffic is switched. If problems occur, the load balancer can immediately route traffic back to the previous version.

#### Blue/Green and Canary deployments 
"For production deployments, I prefer either Blue/Green or Canary depending on the release. In Blue/Green, I maintain two identical environments behind an Application Load Balancer. The new version is deployed to the Green environment, validated through health checks and smoke tests, and then the ALB listener is switched to the Green target group. If an issue is detected, rollback is nearly instantaneous by pointing traffic back to Blue.

For higher-risk feature releases, I prefer Canary deployments. I gradually shift traffic—for example, 10%, then 25%, then 50%, and finally 100%—while monitoring error rates, latency, infrastructure metrics, and business KPIs. If any degradation appears, I stop the rollout and direct traffic back to the stable version. This minimizes user impact while giving confidence that the new release is healthy."

## Radis

#### What is Caching?

Caching stores frequently accessed data in a faster storage layer so future requests don't need to fetch the data from the original source (typically a database).

#### Why use Redis instead of caching in Node.js memory?

In-memory caching inside a Node.js process doesn't work well when multiple application instances are running. Redis is shared across all instances, survives application restarts (depending on persistence settings), supports TTL, eviction policies, and distributed use cases like sessions and rate limiting.

#### What is the most common caching strategy?

Cache Aside. The application reads from the cache first, falls back to the database on a miss, stores the result in the cache, and returns it.

#### When should you avoid caching?

Avoid caching data that:

Changes every request
Is highly personalized and not reusable
Must always be strongly consistent (unless your invalidation strategy guarantees it)

#### What is a cache stampede?

A cache stampede happens when a popular key expires and many requests simultaneously miss the cache, causing all of them to hit the database. Common mitigations include request coalescing (single-flight), distributed locks, stale-while-revalidate, or adding randomized TTLs.

#### What is cache invalidation?

Removing or updating cached data when the source of truth changes, ensuring users don't receive stale data.

#### How handle database spike When Redis is down ?
In production, I don't rely on a single technique. For hot keys, I typically combine multiple strategies. I use Cache Aside as the caching pattern, randomized TTLs to avoid synchronized expirations, and a distributed Redis lock so only one application instance rebuilds the cache on a miss. For frequently accessed data, I prefer stale-while-revalidate or background refresh so users continue getting responses while the cache is refreshed asynchronously. This combination minimizes database spikes, reduces latency, and keeps the system resilient during high traffic.

#### Why did you choose Cache Aside instead of Write Through?

Cache Aside is the most suitable pattern for read-heavy applications because data is only cached when it's actually requested. This reduces memory usage and avoids caching unused data. It also keeps writes simple, though I need a proper cache invalidation strategy.

#### How do you implement a distributed lock in Redis?
I use Redis's atomic SET command with the NX (only set if not exists) and EX (expiration) options.

```
SET lock:user:123 locked NX EX 10
```
If it succeeds, the process owns the lock and can rebuild the cache. Other instances wait and retry. In production, I typically use the Redlock library instead of implementing the locking logic manually.

#### Why is a lock expiration time necessary?

If the application crashes while holding the lock, the expiration ensures the lock is automatically released, preventing a deadlock.

#### What happens if Redis goes down?

The application should gracefully fall back to the database. To protect the database from overload, I would also use techniques like:

Rate limiting
Circuit breakers
Connection pooling
Auto Scaling
Cache warm-up after Redis recovers

#### Why not cache everything forever?

Because data changes. Permanent caching can return stale information and waste memory. TTLs and cache invalidation keep the cache fresh.

#### What is stale-while-revalidate?
Instead of making users wait after a cache entry expires, I return the existing cached value immediately and refresh the cache asynchronously in the background. The next request receives the updated data.

#### When would you avoid stale-while-revalidate?
For strongly consistent data, such as:

Banking balances
Payment status
Stock trading
Inventory with strict consistency requirements

Serving stale data in these scenarios could cause incorrect business behavior.

#### How do you refresh the cache in the background?
Common approaches include:

Scheduled jobs (Cron)
Background workers (BullMQ, RabbitMQ, SQS consumers)
Event-driven updates after database changes

#### What metrics do you monitor for Redis?
I monitor:

Cache hit ratio
Cache miss ratio
Memory usage
Evictions
Latency
Connected clients
CPU utilization
Network throughput
Key expiration rate

#### What if multiple servers rebuild the cache simultaneously?
That's exactly the cache stampede problem. In a distributed environment, I prevent it using a Redis distributed lock so only one server rebuilds the cache while the others wait or retry.

#### What happens if rebuilding the cache takes 30 seconds?

I wouldn't let every request wait. I'd prefer:

Stale-While-Revalidate to serve stale data temporarily, or
Background refresh to keep the cache warm before it expires.

#### Why use Redis instead of an in-memory Node.js cache?

A Node.js in-memory cache is isolated to a single process. In production, multiple Node.js instances behind a load balancer each have their own memory, leading to inconsistent cache state. Redis provides a shared cache accessible by all instances.

#### During a flash sale, a Redis key for your product catalog expires. Suddenly, 50,000 users request the same product. How would you handle it?
I would first use the Cache Aside pattern for reads. To prevent a cache stampede, I'd acquire a distributed Redis lock so only one application instance queries the database and rebuilds the cache. I'd also use randomized TTLs to avoid synchronized expirations in the future. For very popular data like product catalogs, I'd keep the cache warm using background refresh or stale-while-revalidate, ensuring users continue receiving responses while the cache is refreshed. Finally, I'd monitor cache hit ratio, latency, and database load to verify the solution is working effectively.

#### Why does Redis need persistence?
Redis stores data in memory, which is volatile. Persistence allows Redis to recover data after crashes or restarts by saving it to disk.

#### What is RDB?
RDB periodically creates snapshots of the entire Redis dataset and stores them on disk. It offers fast recovery and low overhead but can lose recent changes made after the last snapshot.

#### What is AOF?
AOF logs every write operation. On restart, Redis replays those commands to rebuild memory. It offers better durability than RDB but uses more disk space and has more write overhead.

#### Which loses less data?
AOF (especially with appendfsync everysec) because it persists writes much more frequently than periodic snapshots.

#### Your Redis server crashes. How do you recover?
Redis can recover using persistence. If RDB is enabled, it restores the latest snapshot, though some recent updates may be lost. If AOF is enabled, Redis replays the logged write commands, providing much better durability. In production, I generally enable both RDB and AOF. Also, if Redis is being used purely as a cache, losing cached data is usually acceptable because the application can repopulate the cache from the primary database. For critical business data like orders or payments, Redis should not be the system of record—the data should be stored in a durable database such as PostgreSQL, with Redis used only as a caching layer.

#### Where do you enable RDB and AOF? In Node.js code or Redis?
RDB and AOF are Redis server features, not client features. I enable them in the Redis server configuration (redis.conf) or through container/orchestration configuration. My Node.js application simply reads and writes data using the Redis client. The persistence mechanism is handled entirely by the Redis server. This separation keeps application code independent of infrastructure configuration.

#### What happens when Redis memory becomes full?
If maxmemory is configured, Redis follows the configured maxmemory-policy. Depending on the policy, it may reject writes, evict keys, or remove only keys with TTL.

#### Difference between LRU and LFU?
LRU: Removes the key that has not been accessed recently.
LFU: Removes the key with the lowest access frequency.

#### Which policy would you choose?

For most application caches, I prefer **allkeys-lru** because recently accessed data is usually the most valuable. If the workload has a stable set of frequently accessed keys, such as a product catalog or recommendation data, **allkeys-lfu** can provide better long-term cache efficiency.

#### Your Redis memory is full. What would you do?
First, I'd confirm whether Redis is genuinely under-provisioned or whether keys are living too long due to poor TTL settings. I'd inspect memory usage and key distribution. For a cache, I'd configure maxmemory with an eviction policy like allkeys-lru or allkeys-lfu, depending on the access pattern. I'd also review TTLs, monitor eviction rates and cache hit ratios, and scale Redis vertically or horizontally if memory pressure is sustained. If Redis is being used for critical non-cache data, I'd avoid relying on eviction and instead redesign the storage strategy.

### Node.js Connection
In sentinels the client discovers the current master automatically.
### Redis Sentinels
```javascript
import Redis from "ioredis";

const redis = new Redis({
  sentinels: [
    { host: "10.0.0.10", port: 26379 },
    { host: "10.0.0.11", port: 26379 },
    { host: "10.0.0.12", port: 26379 },
  ],
  name: "mymaster",
});
```
#### Redis Cluster
```javascript
import Redis from "ioredis";

const cluster = new Redis.Cluster([
  { host: "10.0.0.20", port: 6379 },
  { host: "10.0.0.21", port: 6379 },
  { host: "10.0.0.22", port: 6379 },
]);
```

#### What is Redis Sentinel?
Redis Sentinel provides high availability by monitoring the Redis master, detecting failures, promoting a replica to master when needed, and allowing clients to discover the new master.

#### What is Redis Cluster?
Redis Cluster distributes data across multiple master nodes using 16,384 hash slots, providing both horizontal scaling and high availability.

#### Difference between Sentinel and Cluster?
Sentinel focuses on high availability for a single writable master. Cluster provides high availability plus data sharding, allowing the dataset and traffic to be spread across multiple masters.

#### Which would you choose?
If my Redis dataset comfortably fits on one server and I mainly need automatic failover, I'd choose Sentinel. If the dataset or traffic exceeds the capacity of a single server, I'd choose Redis Cluster because it provides sharding and horizontal scaling.

#### Your Redis instance has reached 100 GB, but a single node can only handle 32 GB. What would you do?
At that point, vertical scaling is no longer sufficient. I would migrate to Redis Cluster so the dataset is partitioned across multiple master nodes using Redis hash slots. Each master would have one or more replicas for high availability. The application would connect using a cluster-aware Redis client such as ioredis, which automatically routes requests to the correct node. This approach increases both storage capacity and throughput while maintaining automatic failover.

#### If you're using Redis only as a cache, do you always need Sentinel or Cluster?
Not necessarily. For a small application, a single Redis instance may be sufficient because the cache can be rebuilt from the primary database after a failure. As traffic grows or Redis starts storing critical transient data such as sessions, rate-limiting state, or large caches, adding Sentinel for high availability or moving to a Redis Cluster for scaling becomes appropriate.

#### Why Redis instead of local memory?

Redis is shared by all application instances, supports TTL, eviction policies, replication, persistence, and high availability. Local memory is fast but isolated to a single process.

#### How do you keep distributed caches consistent?
I treat the database as the source of truth. After updating the database, I invalidate or update the Redis cache. If I use local L1 caches, I synchronize them using Redis Pub/Sub or another event mechanism so all application instances remove stale entries.

#### How do large companies cache data?
A common architecture is:

L1 cache: Local in-memory cache inside each application instance
L2 cache: Shared Redis Cluster
Database: PostgreSQL/MySQL as the source of truth

Reads follow L1 → L2 → Database. Writes update the database first, then invalidate or refresh the caches.

#### You have 20 Node.js instances behind an ALB. A user updates their profile. How do you ensure every server returns the updated profile?
The database is the source of truth, so I update PostgreSQL first inside a transaction. After the transaction commits successfully, I invalidate or refresh the corresponding Redis key. If the application also uses local L1 caches for performance, I publish an invalidation event through Redis Pub/Sub so every Node.js instance removes its local copy. The next request reloads the fresh data from Redis or, on a cache miss, from PostgreSQL using the Cache Aside pattern. This keeps all application instances consistent while minimizing database load.

#### Which Redis metric is most important?
Cache hit ratio, because it directly reflects how effectively Redis is reducing database load. A falling hit ratio usually leads to increased DB traffic and higher application latency.

#### How do you detect Redis memory problems?

Monitor:
used_memory
maxmemory
evicted_keys

Increasing evictions or memory consistently near the configured limit indicates pressure.

#### What would you alert on?
Typical production alerts include:

Cache hit ratio drops below target
Memory usage exceeds ~80–85%
Evictions increase unexpectedly
Latency increases significantly
Replication lag grows
Redis becomes unavailable
CPU remains high for a sustained period

#### Your API latency jumped from 100 ms to 2 seconds, but PostgreSQL is healthy. How would you investigate Redis?

I'd first check the cache hit ratio. If it has dropped, it may indicate poor TTL settings or a cache invalidation issue that's forcing requests to the database. Next, I'd review memory usage and eviction counts to see whether Redis is under memory pressure. I'd check latency with LATENCY DOCTOR, inspect SLOWLOG GET for expensive commands, verify CPU and network utilization, and, if using replicas, confirm there isn't replication lag. In AWS ElastiCache, I'd use CloudWatch metrics such as CacheHits, CacheMisses, Evictions, CPUUtilization, and CurrConnections. I'd also correlate Redis metrics with my application's traces in New Relic or Datadog to identify whether Redis is the bottleneck or a symptom of another issue.



 -----------------------

####   1. What are your must-haves in production for a Node service?
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

#### 3. Imagine your Node app is running on Kubernetes with 10 pods behind a load balancer. One pod starts responding much slower than the others, but the rest are fine. How would you identify and resolve that?
First, compare that pod's metrics against healthy ones. CPU, memory, restarts, event loop delay. Then, check the logs for that specific pod. Look for skewed config. Maybe one has a different env or sticky sessions pinning heavy users. If it's safe, you can drain and restart that pod, but capture evidence first if you suspect a leak. Then, verify by monitoring the replacement.

####  4. Design a rate limiter for a Node API behind a load balancer. How would you design it, and why not just in memory?
I would use Redis as a centralized, atomic counter because all Node.js instances behind the load balancer need a shared view of request counts. In-memory rate limiting doesn't work in a distributed environment due to isolated process memory, pod restarts, and horizontal scaling. For production, I'd implement a Redis-backed token bucket algorithm with atomic operations, return standard rate-limit headers, and define a clear strategy for Redis failures.

####  5. Your Node app is on Kubernetes behind a load balancer. Traffic doubles after a campaign. CPU looks fine, but latency spikes from 200 milliseconds to 2 seconds. Database is healthy. Walk me through how you'd investigate and what metrics you'd check first.
Healthy CPU doesn't necessarily mean the application isn't overloaded. In Node.js, a single blocked event loop, waiting on I/O, connection pool contention, or a slow downstream dependency can all increase response time dramatically while CPU usage remains relatively low. That's why I'd rely on traces and runtime metrics rather than CPU alone.

## 1. Production Incident

#### Describe a production incident you handled end-to-end.


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


#### 2. N+1 Query in Prisma, How would you identify and fix an N+1 query?

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

#### 3. Zero Downtime Index Creation, How do you add an index to a large production table without downtime?

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


#### 4. High CPU Usage How do you prove Node.js is CPU-bound?
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


#### 5. Memory Leak, Memory keeps increasing until Kubernetes OOMKills the pod.
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

#### 6. Latency Increased After Deployment, API latency increased from 200 ms to 3 seconds immediately after deployment.
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


#### 7. Redis Failure, Redis goes down. Login becomes slow.

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


#### Monitoring vs Profiling

Monitoring: - New Relic - Prometheus - Grafana

Profiling: - Node.js Inspector - Clinic.js - heapdump


#### How do services communicate?

Using:

REST
gRPC
Kafka/Event-driven messaging
RabbitMQ
Amazon SQS (depending on the use case)

#### Is Microservices always better?
No.

Microservices solve organizational and scaling problems but introduce significant operational complexity. A well-designed monolith is often the better choice for small teams and simpler applications.

### Why API Gateway?
It provides a single entry point for clients and centralizes concerns such as authentication, routing, rate limiting, logging, SSL termination, and request aggregation.

#### You're building an e-commerce platform with User, Order, Payment, and Inventory services. How would they communicate?
I'd use different communication mechanisms based on the business requirement. For synchronous operations that require an immediate response, such as fetching a user profile or validating an order, I'd use REST or gRPC. For internal, latency-sensitive communication, I'd prefer gRPC because of its performance and strongly typed contracts. For asynchronous workflows such as order creation, payment processing, inventory updates, notifications, and email sending, I'd use an event-driven architecture with Kafka. An API Gateway would serve as the single entry point for external clients, handling authentication, routing, rate limiting, and request aggregation.

#### Difference between Retry and Circuit Breaker?

**Retry**

Tries again because failures may be temporary.

**Circuit Breaker**

Stops calling a consistently failing service until it has a chance to recover.

### Why Timeout?
To prevent blocked connections and threads when downstream services are slow or unavailable.

### Why Service Discovery?
Because service instances scale dynamically and their IP addresses change. Service discovery allows applications to locate healthy instances without hardcoding addresses.

#### Your Payment Service is down, but your website must remain operational. How would you design the system?
I'd configure a reasonable timeout for calls to the Payment Service so requests don't hang indefinitely. For transient failures, I'd retry a limited number of times using exponential backoff with jitter. If failures continue beyond the configured threshold, a circuit breaker would open to stop sending traffic to the unhealthy service and fail fast. The Order Service could return a user-friendly message or mark the order as "Payment Pending," depending on the business requirements. I'd isolate Payment Service resources using the Bulkhead pattern so failures don't affect other services, and I'd rely on service discovery to always connect to healthy service instances if multiple replicas are available.

#### What is a Distributed Transaction?
A transaction that spans multiple independent services or databases and requires coordination to keep data consistent.

#### What is Two-Phase Commit?
A distributed transaction protocol with two phases:

Prepare
Commit (or Rollback)

The coordinator ensures all participants either commit or roll back together.

#### Why isn't SQL BEGIN/COMMIT enough?
Because SQL transactions work within a single database. In microservices, each service owns its own database, so a local transaction cannot guarantee consistency across services.

#### Why is 2PC slow?
Because it requires multiple network round trips, locks resources during the prepare phase, and waits for every participant before committing.

#### Why isn't 2PC popular in Microservices?
Because it reduces availability and scalability, introduces blocking, and creates a coordinator dependency. Modern distributed systems usually prefer eventual consistency with patterns like Saga.

#### An order service updates its database, then the payment service fails. How do you keep the system consistent?
If I were using a traditional distributed transaction, Two-Phase Commit could guarantee atomicity across the databases, but I generally wouldn't choose it for cloud-native microservices because of its blocking behavior, coordinator dependency, and scalability limitations. Instead, I'd use the Saga Pattern. The Order Service would create the order in a pending state and publish an event. The Payment Service would attempt the payment. If payment succeeds, the workflow continues to Inventory and Shipping. If payment fails, a compensating transaction would cancel the order, returning the system to a consistent business state through eventual consistency.

#### Would you use 2PC in a modern e-commerce microservices system?
Generally, no. While 2PC provides strong consistency, it doesn't scale well for high-throughput distributed systems because it blocks participants, depends on a coordinator, and increases latency. For most microservice architectures, I'd use the Saga Pattern with compensating transactions and accept eventual consistency, reserving 2PC for cases where strong atomicity across multiple resources is absolutely required.

#### What is Saga Pattern?
Saga is a distributed transaction pattern where a business transaction is split into multiple local transactions. If one step fails, compensating transactions undo previously completed steps to achieve eventual consistency.

#### What is a Compensating Transaction?
An action that reverses the business effect of a previous successful step. Examples include refunding a payment or cancelling an order.

#### What is the Outbox Pattern?
The Outbox Pattern stores business data and an integration event in the same database transaction. A background process later publishes the event to the message broker, ensuring events are not lost.

#### Why not publish directly to Kafka?
Because the database write and Kafka publish are separate operations. If one succeeds and the other fails, the system becomes inconsistent. The Outbox Pattern solves this by making the database update and event creation atomic.

#### A customer places an order. The order is saved successfully, but the Kafka event isn't published because Kafka is temporarily unavailable. How would you solve this?
I would implement the Outbox Pattern. Instead of writing to the Orders table and publishing to Kafka as two independent operations, I'd write both the order and an outbox event in the same database transaction. After the transaction commits, a background worker reads pending events from the Outbox table and publishes them to Kafka. If Kafka is unavailable, the worker retries later without losing the event. This guarantees that every committed business transaction eventually produces the corresponding integration event.

#### Your application uses PostgreSQL with read replicas. A user updates their email address and immediately refreshes the page, but still sees the old email. Why?
This is likely due to replication lag. The write was committed to the primary database, but the subsequent read was served from a replica that hadn't yet received the update. To provide a better user experience, I'd implement read-after-write consistency by routing the user's immediate follow-up reads to the primary for a short period or using session-aware routing. Other users can continue reading from replicas because temporary staleness is acceptable for that use case.

#### Would you use strong consistency for every application?
No. I choose the consistency model based on business requirements. For financial transactions and inventory reservations, I require strong consistency. For user preferences, I typically implement read-after-write consistency so users immediately see their own changes. For use cases like social feeds, analytics, notifications, or product catalogs, eventual consistency is usually sufficient because it offers better scalability and availability with acceptable temporary staleness.











