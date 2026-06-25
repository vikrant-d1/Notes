# Microservices System Design — Senior/Architect Interview Guide

A complete, navigable prep guide. Each answer includes a crisp definition, the *why*, and a spoken-style cross-question response where useful.

---

## Table of Contents

1. [Microservices Fundamentals](#1-microservices-fundamentals)
2. [Communication](#2-communication)
3. [API Gateway](#3-api-gateway)
4. [Service Discovery](#4-service-discovery)
5. [Databases](#5-databases)
6. [Distributed Transactions](#6-distributed-transactions)
7. [Outbox Pattern](#7-outbox-pattern)
8. [Event Driven Architecture](#8-event-driven-architecture)
9. [Resilience](#9-resilience)
10. [Caching](#10-caching)
11. [Kubernetes](#11-kubernetes)
12. [Docker](#12-docker)
13. [Observability](#13-observability)
14. [Security](#14-security)
15. [Distributed Systems](#15-distributed-systems)
16. [Scalability](#16-scalability)
17. [Performance](#17-performance)
18. [Production Scenarios](#18-production-scenarios)
19. [Architecture Decisions](#19-architecture-decisions)
20. [HR + Architecture Combined](#20-hr--architecture-combined)
21. [FAANG-Level Whiteboard Questions](#21-faang-level-whiteboard-questions)

---

## 1. Microservices Fundamentals

### Basic

**What is Microservice Architecture?**
An architectural style structuring an application as a collection of small, independently deployable services, each owning a single business capability and its own data, communicating over the network (REST/gRPC/messaging).

**Why do companies move from monolith to microservices?**
Independent scaling of hot paths, independent deployment (faster release cadence), team autonomy, fault isolation, and technology heterogeneity. The driver is usually *organizational scaling* (many teams stepping on each other in one codebase) more than pure tech.

**What problems do microservices solve?**
Deployment bottlenecks, scaling everything-together waste, tight coupling between unrelated features, single points of failure, and large teams blocked on a shared release train.

**What are the disadvantages of microservices?**
Distributed-system complexity, network latency and partial failure, eventual consistency, harder debugging/observability, operational overhead (CI/CD, infra), data duplication, and testing complexity.

**When would you NOT use microservices?**
Small teams, early-stage products with unclear domain boundaries, low scale, or when you lack DevOps maturity. Start with a well-modularized monolith ("modular monolith") and split later.

**What is a distributed monolith?**
The worst of both worlds: services split physically but still tightly coupled — they must deploy together, share a database, or break when one changes. You pay the network/ops cost without the independence benefit.

**What is independent deployability?**
The ability to deploy one service without coordinating or redeploying others. It's the single most important property of a true microservice; if you can't deploy independently, you don't have microservices.

**What is bounded context?**
A DDD concept: an explicit boundary within which a domain model and its terms have a single, consistent meaning. Each microservice typically maps to one bounded context. "Customer" in Sales vs Support can be two different models.

**What is domain-driven design?**
A design approach that models software around the business domain using a ubiquitous language, aggregates, entities, value objects, and bounded contexts. It gives a principled way to find service boundaries.

**How do you identify service boundaries?**
By bounded contexts and business capabilities, not technical layers. Look for high cohesion inside, low coupling across, separate data ownership, and team alignment. Event Storming is a common technique.

### Advanced

**What happens if service boundaries are wrong?**
You get chatty cross-service calls, distributed transactions everywhere, shared data, and changes that ripple across services — i.e., a distributed monolith. Wrong boundaries are the most expensive mistake to undo.

**How do you split a monolith into microservices?**
Identify bounded contexts → extract the least-coupled module first → introduce an Anti-Corruption Layer → use the Strangler Fig pattern to route traffic incrementally → split the data last. Never big-bang rewrite.

**Can one team own multiple services?**
Yes. A team should own *at least* one service, but owning several related services is fine. The inverse — multiple teams owning one service — is the anti-pattern.

**How small should a microservice be?**
Small enough to be owned by one team and rewritten in a reasonable time, large enough to encapsulate a full business capability without chatty cross-service calls. "Size" is about cohesion, not lines of code.

**How many microservices are too many?**
When operational/cognitive overhead outweighs the autonomy benefit — when you spend more time on plumbing (discovery, tracing, transactions) than features. There's no fixed number; it's a cost/benefit signal.

**What are nano services?**
An anti-pattern where services are split so finely that each does almost nothing, creating huge network overhead and coordination cost for trivial logic.

**What is Conway's Law?**
Systems mirror the communication structure of the organizations that build them. Implication: design teams around the architecture you want (the "Inverse Conway Maneuver").

**What is Anti-Corruption Layer?**
A translation layer that isolates a clean bounded context from a legacy or external model, converting between them so the legacy model's concepts don't leak in and corrupt your domain.

**What is Strangler Fig Pattern?**
Incrementally replace a legacy system by routing specific requests to new services while the old system keeps serving the rest, until the old one is fully "strangled" and removed.

**How do you migrate gradually from monolith?**
Strangler Fig + a routing facade/gateway, extract one capability at a time, dual-write or sync data during transition, verify with shadow traffic, then cut over and remove old code.

---

## 2. Communication

**REST vs gRPC?**
REST: HTTP/JSON, human-readable, universal, great for public/external APIs. gRPC: HTTP/2 + Protobuf, binary, low latency, streaming, strong contracts — great for internal service-to-service. Trade-off: gRPC is faster and typed but less browser/firewall-friendly.

**REST vs GraphQL?**
REST exposes fixed resources/endpoints; GraphQL exposes a single endpoint where clients query exactly the fields they need, avoiding over/under-fetching. GraphQL shines for aggregating data for varied clients; REST is simpler to cache and reason about.

**REST vs Kafka?**
REST is synchronous request/response (point-to-point). Kafka is asynchronous, durable, log-based pub/sub for events. Use REST for "give me an answer now," Kafka for "tell everyone something happened."

**When should communication be synchronous?**
When the caller needs an immediate result to proceed (e.g., reading data to render a response, validating before commit), and the operation is fast and reliable.

**When asynchronous?**
For workflows that can complete eventually, side effects, fan-out to many consumers, decoupling producers from consumers, and smoothing load spikes (buffering).

**Why are synchronous chains dangerous?**
A → B → C synchronous calls couple availability and latency: total latency is the sum, and any link failing fails the whole chain. They create cascading failures and tight runtime coupling.

**What is temporal coupling?**
Two services must be up and responsive at the same time for an operation to succeed. Synchronous calls cause it; messaging removes it.

**What is spatial coupling?**
A service must know the exact location/address of another to call it (hardcoded host). Service discovery and brokers reduce it.

**What is request aggregation?**
Combining results from multiple downstream services into one response, typically at a gateway or BFF, so the client makes a single call.

**What is API composition?**
A query pattern where a composer service calls several services and joins their data in memory to answer a query that spans multiple databases (used when you can't do cross-service joins).

### Follow Up

**Why shouldn't UI call multiple services?**
It leaks internal topology to the client, causes chatty round-trips and latency, complicates auth/versioning, and breaks when services change. Use a BFF/gateway to aggregate instead.

**What happens if one service in a synchronous chain becomes slow?**
Callers' threads/connections block waiting, queues back up, the slowness propagates upstream, and you can exhaust thread pools — cascading failure. This is why timeouts + circuit breakers are mandatory.

**How do you avoid cascading failures?**
Timeouts, circuit breakers, bulkheads, retries with backoff+jitter, load shedding, fallbacks, and preferring async messaging for non-critical paths.

**Why should timeout always exist?**
Without a timeout a slow/hung dependency holds your resources indefinitely; one stuck dependency can take down the caller. A timeout converts an indefinite hang into a fast, handleable failure.

**What timeout value do you normally use?**
Derive it from the dependency's p99 latency plus headroom (e.g., p99 × ~1.5–2), not a guess. Typical internal calls land in the 200ms–2s range; tune per dependency and pair with retries that fit within the upstream budget.

---

## 3. API Gateway

**Why API Gateway?**
A single entry point that handles cross-cutting concerns — routing, authn/authz, rate limiting, TLS termination, request aggregation, caching — so individual services don't reimplement them and clients have one stable endpoint.

**Gateway vs Load Balancer?**
A load balancer distributes traffic across instances (L4/L7) with no business awareness. A gateway is application-aware: it routes by path/header, transforms requests, authenticates, and aggregates. Gateways often sit behind a load balancer.

**Gateway vs Reverse Proxy?**
A reverse proxy forwards requests and may do basic routing/TLS. A gateway is a reverse proxy plus API-level concerns (auth, rate limiting, aggregation, versioning). Every gateway is a reverse proxy; not every reverse proxy is a gateway.

**What logic belongs inside gateway?**
Cross-cutting, request-level concerns: routing, authentication/token validation, rate limiting, TLS termination, basic transformation, caching, and observability injection (correlation IDs).

**What should never be inside gateway?**
Business logic, domain rules, or data ownership. A "smart" gateway with business logic becomes a centralized monolith and a deployment bottleneck. Keep it dumb about the domain.

**What is BFF?**
Backend-for-Frontend: a dedicated gateway per client type (web, mobile) that tailors aggregation, payload shape, and chattiness to that client's needs.

**Why have different gateways for Web and Mobile?**
Clients have different needs: mobile wants smaller payloads and fewer round-trips (poor networks), web may want richer data. A BFF per client avoids one-size-fits-none compromises.

**Gateway authentication flow?**
Client sends credentials → gateway (or an auth/identity service) issues a JWT → subsequent requests carry the JWT → gateway validates signature/expiry/claims → forwards with user context (e.g., headers) to services, which trust the gateway-validated identity.

**Gateway rate limiting?**
Throttle per client/IP/API-key/route using algorithms like token bucket or sliding window, backed by a shared store (Redis) so limits are enforced across gateway instances. Return 429 with Retry-After.

**Gateway caching?**
Cache idempotent GET responses at the edge with appropriate TTLs and cache keys (path + relevant headers), reducing downstream load and latency. Must handle invalidation carefully.

---

## 4. Service Discovery

**What is service discovery?**
A mechanism for services to find the network locations of other services dynamically, since instances come and go (autoscaling, restarts) and IPs change.

**Client-side discovery?**
The client queries a service registry, gets the list of instances, and load-balances among them itself (e.g., Netflix Eureka + Ribbon). Pro: fewer hops. Con: discovery logic in every client.

**Server-side discovery?**
The client calls a stable endpoint (load balancer/router) that consults the registry and forwards to an instance (e.g., Kubernetes Service, AWS ALB). Pro: clients stay dumb. Con: extra hop.

**How Kubernetes does discovery?**
Each Service gets a stable virtual IP and DNS name; kube-proxy/iptables/IPVS route traffic to healthy Pod endpoints (tracked via EndpointSlices). Clients just resolve the Service DNS name.

**What is DNS-based discovery?**
Resolving a logical service name via DNS to current instance addresses. Simple and language-agnostic, but DNS caching/TTL can cause stale entries.

**What is Consul?**
A service mesh/discovery tool by HashiCorp providing a service registry, health checking, KV store, and DNS/HTTP discovery, plus optional service mesh (Connect) with mTLS.

**What is Eureka?**
Netflix's client-side discovery server (Spring Cloud), where services register and clients fetch the registry to pick instances. Common in non-Kubernetes Spring ecosystems.

**Why doesn't Kubernetes need Eureka?**
Kubernetes has built-in discovery: Services + DNS + EndpointSlices provide registration, health-based endpoint management, and stable names natively, making a separate registry redundant.

---

## 5. Databases

**Why Database Per Service?**
Each service owns its data and schema, enabling independent deployment, schema evolution, scaling, and technology choice without coupling. It enforces the bounded-context boundary at the data layer.

**Why not shared database?**
A shared DB recouples services: a schema change breaks others, scaling is shared, and "private" data leaks. It's the classic distributed-monolith trap.

**Polyglot persistence?**
Using the best-fit datastore per service: relational for transactions, document for flexible schemas, key-value for caching, graph for relationships, search engine for full-text. Each service picks its own.

**How do services share data?**
Not by reaching into each other's DB. They share via APIs (request the owner) or by publishing events that others consume to build their own read models (event-carried state transfer).

**Cross-service joins?**
Avoided at the DB level. Use API composition (call each service and join in memory) or maintain a denormalized read model populated by events (CQRS).

**Cross-service reporting?**
Don't query operational DBs directly. Stream events/CDC into a data warehouse or read-optimized store and report from there, keeping operational stores isolated.

**Database replication?**
Copying data from a primary to replicas for read scaling and high availability. Can be synchronous (consistent, slower) or asynchronous (faster, replication lag).

**Read replicas?**
Read-only copies of the primary that serve read queries to offload the primary. Watch for replication lag causing stale reads ("read-your-writes" issues).

**Sharding?**
Horizontally partitioning data across multiple databases by a shard key (e.g., user_id hash) so each node holds a subset. Scales writes and storage but complicates cross-shard queries and rebalancing.

**Partitioning?**
Splitting a single table into parts (by range, list, or hash) within a DB to improve query performance and maintenance. Unlike sharding, it's typically within one database instance.

**Connection Pooling?**
Reusing a fixed set of DB connections instead of opening one per request. Essential because DB connections are expensive and limited; pools (e.g., pgBouncer, app-level pools) cap and reuse them.

---

## 6. Distributed Transactions

**Why can't ACID work across services?**
Each service has its own database; there's no shared transaction manager and locking across services kills availability. You trade strong consistency for availability and eventual consistency.

**What is 2PC?**
Two-Phase Commit: a coordinator asks all participants to *prepare* (vote), then *commit* or *abort* based on votes. It gives atomicity across databases.

**Why isn't 2PC recommended?**
It's synchronous and blocking: participants hold locks until the coordinator decides, the coordinator is a single point of failure, and it scales poorly and hurts availability — bad fit for microservices.

**What is Saga?**
A sequence of local transactions across services, where each step publishes an event/triggers the next, and failures are handled by *compensating* transactions that undo prior steps. Provides eventual consistency without distributed locks.

**Orchestration vs Choreography?**
Orchestration: a central orchestrator tells each service what to do and tracks state (easier to reason about/monitor, but a central coordinator). Choreography: services react to each other's events with no central brain (loosely coupled, but harder to trace and reason about end-to-end).

**Compensation?**
A semantic undo for a completed step (e.g., refund for a charge, release for a reservation). Sagas can't roll back like ACID, so they compensate instead.

**Retry?**
Re-attempting a transient failure (network blip, timeout). Must be idempotent and bounded (with backoff) to avoid duplicates and storms.

**Rollback?**
In a saga, "rollback" means running compensations for already-completed steps in reverse order, since you can't undo committed local transactions directly.

**Partial Failure?**
Some steps succeeded and others failed — the defining problem of distributed transactions. Sagas handle it via compensation; the system must be designed to detect and reconcile partial state.

**What happens if compensation also fails?**
Retry the compensation (idempotently), and if it keeps failing, route to a DLQ/alert for manual intervention. You design compensations to be retriable and monitor for "stuck" sagas. Some money/inventory flows reserve then confirm to minimize this.

---

## 7. Outbox Pattern

**What is Dual Write Problem?**
When an operation must update the database *and* publish an event, doing them as two separate writes risks one succeeding and the other failing (e.g., DB commits but broker is down), leaving the system inconsistent.

**Why Outbox?**
It makes the DB write and the event "write" atomic by storing the event in an outbox table within the same local transaction as the business data, eliminating the dual-write inconsistency.

**How does Outbox solve consistency?**
The business change and the outbox row commit together (one ACID transaction). A separate process then reliably reads the outbox and publishes to the broker, guaranteeing at-least-once delivery of events that match committed state.

**Polling vs CDC?**
Polling: a publisher periodically queries the outbox table for unsent rows and publishes them (simple, slight latency, DB load). CDC: a tool reads the database transaction log to capture inserts and publish them (low latency, no polling load, more infra).

**What is Debezium?**
An open-source CDC platform that tails database transaction logs (Postgres WAL, MySQL binlog) and streams change events to Kafka — commonly used to implement the outbox via CDC.

**What happens if Outbox publisher crashes?**
No data loss: unpublished rows remain in the outbox. On restart the publisher resumes from where it left off. Because the same event may be republished, consumers must be idempotent (at-least-once semantics).

---

## 8. Event Driven Architecture

**Kafka vs RabbitMQ?**
Kafka: distributed, partitioned, durable commit log; high throughput; retains/replays events; consumers track offsets. Great for event streaming/event sourcing. RabbitMQ: a traditional message broker with flexible routing (exchanges), per-message ack, and queues; great for task queues/RPC. Kafka = log/stream; Rabbit = smart broker/queue.

**Event Notification?**
A service emits a thin event ("OrderCreated:123") signaling something happened; consumers call back to get details. Low coupling but more callbacks.

**Event Carried State Transfer?**
Events carry enough data (full state/fields) for consumers to act without calling back, letting them build local read models. Reduces runtime coupling at the cost of data duplication.

**Event Sourcing?**
Persisting state as an append-only sequence of events; current state is derived by replaying events. Gives full audit/history and time-travel, but adds complexity (rebuilds, snapshots, schema evolution).

**CQRS?**
Command Query Responsibility Segregation: separate the write model (commands) from the read model (queries), often with separate stores optimized for each, kept in sync via events. Scales reads/writes independently.

**Event replay?**
Reprocessing past events (from Kafka/event store) to rebuild a read model, fix a bug, or seed a new consumer. Requires idempotent consumers and care with side effects.

**Event ordering?**
Kafka guarantees order only within a partition. To keep related events ordered, route them to the same partition via a partition key (e.g., orderId). Global ordering across partitions is not guaranteed.

**Event schema evolution?**
Evolving event formats without breaking consumers: use backward/forward-compatible changes (add optional fields, never remove/rename required ones), a schema registry (Avro/Protobuf), and versioning.

**Consumer groups?**
A set of consumers sharing a group ID that split partitions among themselves for parallelism; each partition is consumed by exactly one consumer in the group, enabling scale-out and failover.

**Offset?**
A consumer's position (per partition) in the Kafka log. Committing offsets records progress; replays/lag are about resetting or trailing offsets.

### Follow Up

**Why duplicate events happen?**
At-least-once delivery: producers retry, consumers crash after processing but before committing offset, rebalances reprocess. Networks make exactly-once hard, so duplicates are normal.

**How do consumers become idempotent?**
Track processed event IDs (dedup table/cache), use upserts keyed by business ID, make operations naturally idempotent, or use idempotency keys so reprocessing the same event has no extra effect.

**What is DLQ?**
Dead Letter Queue: where messages go after exhausting retries (poison messages), so the main flow isn't blocked. They're inspected/replayed manually or by tooling.

**Retry strategy?**
Bounded retries with exponential backoff + jitter for transient errors, distinguishing retryable vs non-retryable failures, then route to DLQ. Avoid tight infinite retries (storms).

**Poison message?**
A message that consistently fails processing (bad data, bug). Without a DLQ it blocks the partition/queue forever; route it aside after max retries.

**Event versioning?**
Tagging events with a version and supporting multiple versions during transitions, with upcasters/transformers, so old and new consumers coexist safely.

**Partition key?**
The field used to assign an event to a Kafka partition (hash of key). Same key → same partition → ordered. Choose a key that balances load and preserves needed ordering (e.g., userId).

**Ordering guarantee?**
Only within a partition. Cross-partition/global ordering isn't guaranteed; design so ordering-sensitive events share a key.

**Exactly Once delivery?**
Very hard in distributed systems. Kafka offers exactly-once *processing* within its ecosystem (idempotent producer + transactions). In practice, aim for at-least-once + idempotent consumers (effectively-once).

**At Least Once delivery?**
The broker guarantees a message is delivered one or more times; duplicates possible. The common, practical default — paired with idempotency.

---

## 9. Resilience

**Circuit Breaker?**
A proxy that monitors failures to a dependency and "trips open" after a threshold, failing fast (or falling back) instead of hammering a sick service, then probes to recover. Prevents cascading failures.

**Bulkhead?**
Isolating resources (thread pools, connection pools) per dependency so a failure in one doesn't exhaust shared resources and sink everything — like watertight compartments in a ship.

**Retry?**
Re-attempting transient failures. Must be bounded, idempotent, and use backoff+jitter; otherwise retries amplify load on an already-struggling system.

**Timeout?**
A hard limit on waiting for a response, converting indefinite hangs into fast failures and freeing resources. The foundation all other resilience patterns build on.

**Fallback?**
A degraded but functional alternative when a dependency fails: cached/default data, a queued action, or a friendly partial response, instead of an outright error.

**Rate Limiting?**
Capping request rate per client/route to protect services from overload/abuse, returning 429 when exceeded (token bucket / sliding window).

**Backpressure?**
Signaling upstream to slow down when a consumer can't keep up (bounded queues, reactive streams, pausing consumption), preventing memory blowups and overload.

**Load Shedding?**
Deliberately rejecting/dropping low-priority requests under overload to keep the system alive for high-priority traffic — surviving by doing less.

**Health Check?**
An endpoint reporting service status. Liveness = "am I alive (restart me if not)"; readiness = "can I take traffic now." Orchestrators use them to route and restart.

**Graceful Degradation?**
Continuing to provide core functionality with reduced features when dependencies fail (e.g., show products without personalized recommendations if the rec service is down).

### Deep Questions

**Explain Closed/Open/Half Open.**
Closed: calls flow normally, failures counted. Open: threshold exceeded, calls fail fast/fallback for a cool-down. Half-Open: after cool-down, allow a few trial calls — success → Closed, failure → Open again.

**Why retries can make failures worse?**
A struggling service gets *more* load from retries (retry storm), pushing it further down — a positive feedback loop. Retries must back off, be capped, and ideally be gated by a circuit breaker.

**Retry with exponential backoff?**
Increasing the wait between attempts exponentially (e.g., 100ms, 200ms, 400ms…) to give the dependency time to recover and reduce load, instead of immediate hammering.

**Retry with jitter?**
Adding randomness to backoff delays so many clients don't retry in sync ("thundering herd"). Spreads retries over time, smoothing load.

**Circuit breaker vs retry?**
Retry handles brief transient blips by trying again; circuit breaker handles sustained failure by stopping calls entirely. They're complementary: retry for short hiccups, breaker to prevent pounding a down dependency.

---

## 10. Caching

**Redis?**
An in-memory key-value data store used for caching, sessions, rate limiting, leaderboards, pub/sub, and distributed locks. Fast (sub-ms), supports rich data structures, persistence options, and clustering.

**Cache Aside?**
(Lazy loading) App checks cache; on miss it loads from DB, populates cache, returns. App owns cache logic. Simple and common; first request is a miss and stale data possible until TTL/invalidation.

**Write Through?**
App writes to cache and DB synchronously on every write, keeping them consistent. Reads are always warm; writes are slower and you cache data that may never be read.

**Write Back?**
(Write-behind) App writes to cache only; cache flushes to DB asynchronously later. Fast writes, high throughput, but risk of data loss if cache fails before flush.

**TTL?**
Time-To-Live: expiry after which a cache entry is evicted, bounding staleness and reclaiming memory. Core lever for cache freshness.

**Cache Invalidation?**
Removing/updating stale entries when source data changes (on write, via events, or TTL). "One of the two hard things" — getting it wrong serves stale data or thrashes the cache.

**Cache Stampede?**
Many requests miss simultaneously (e.g., a hot key expires) and all hit the DB at once. Mitigate with locks/single-flight, staggered TTLs, or refresh-ahead.

**Cache Avalanche?**
Many keys expire at the same time (or cache goes down), flooding the DB. Mitigate with randomized/jittered TTLs, multi-layer caching, and DB protection (circuit breaker, rate limit).

**Cache Penetration?**
Requests for keys that don't exist (often malicious) always miss cache and hit the DB. Mitigate with caching "null" results and Bloom filters to reject unknown keys early.

**Distributed Cache?**
A cache shared across nodes (e.g., Redis Cluster) so all instances see the same cached data, avoiding per-node inconsistency and enabling scale. Adds network hop vs local cache.

---

## 11. Kubernetes

**Pod?**
The smallest deployable unit: one or more tightly coupled containers sharing network/IP and storage. Usually one main container per Pod; Pods are ephemeral and replaceable.

**Deployment?**
A controller managing stateless Pods declaratively — rollouts, rollbacks, scaling — via an underlying ReplicaSet. You declare desired state; it converges.

**ReplicaSet?**
Ensures a specified number of identical Pod replicas are running at all times, replacing failed ones. Usually managed by a Deployment, not directly.

**Service?**
A stable virtual IP/DNS name and load balancer in front of a dynamic set of Pods (selected by labels), decoupling clients from ephemeral Pod IPs. Types: ClusterIP, NodePort, LoadBalancer.

**Ingress?**
An API object for L7 (HTTP/S) routing into the cluster — host/path-based routing, TLS termination — implemented by an Ingress controller (NGINX, Traefik). One entry point for many services.

**ConfigMap?**
Stores non-sensitive configuration (env vars, config files) separately from images, injected into Pods, enabling config changes without rebuilding images.

**Secret?**
Like a ConfigMap but for sensitive data (passwords, tokens, keys), base64-encoded and ideally encrypted at rest; mounted as files or env vars.

**HPA?**
Horizontal Pod Autoscaler: automatically scales the number of Pods based on metrics (CPU, memory, or custom/external metrics) to match load.

**Readiness Probe?**
Checks whether a Pod is ready to receive traffic; if it fails, the Pod is removed from Service endpoints (no traffic) but not restarted. Prevents routing to warming-up/busy Pods.

**Liveness Probe?**
Checks whether a Pod is alive; if it fails, Kubernetes restarts the container. Recovers from deadlocks/hung states.

**Rolling Update?**
Default deployment strategy that replaces Pods incrementally (new up, old down) respecting maxSurge/maxUnavailable, achieving zero-downtime releases.

**Canary Deployment?**
Releasing the new version to a small subset of traffic/users first, monitoring, then gradually increasing if healthy — limiting blast radius of bad releases.

---

## 12. Docker

**Multi-stage build?**
Using multiple FROM stages so build tooling/deps live in a builder stage and only the final artifacts are copied into a small runtime image — drastically smaller, more secure images.

**Docker Healthcheck?**
A HEALTHCHECK instruction that periodically runs a command to report container health, letting orchestrators/Compose detect and react to unhealthy containers.

**Docker Networking?**
Containers communicate via networks: bridge (default, single host), host (share host net), overlay (multi-host/Swarm), none. User-defined bridge networks give DNS-based name resolution between containers.

**Volumes?**
Persistent storage managed by Docker, decoupled from container lifecycle, so data survives container removal and can be shared. Preferred over bind mounts for portability.

**Non-root container?**
Running the container process as a non-root user (USER directive) to limit blast radius if compromised — a key security best practice.

**Image optimization?**
Smaller, faster, safer images via: minimal base (alpine/distroless), multi-stage builds, layer ordering for cache, combining RUN commands, .dockerignore, and removing build artifacts.

---

## 13. Observability

**Logging?**
Recording discrete events with context. In microservices use structured (JSON) logs, consistent levels, and correlation IDs, shipped to a central store (ELK/Loki) since logs are scattered across services.

**Metrics?**
Numeric, aggregatable time-series (counters, gauges, histograms) like request rate, error rate, latency, saturation — cheap, queryable, and ideal for dashboards and alerting.

**Tracing?**
Following a single request across services with spans linked by a trace ID, showing where time is spent and where it failed. Essential for distributed debugging.

**Correlation ID?**
A unique ID generated at the edge and propagated through all downstream calls/logs/traces, so you can stitch together everything that happened for one request.

**OpenTelemetry?**
A vendor-neutral standard and SDK for generating/collecting traces, metrics, and logs, exporting to any backend (Jaeger, Prometheus, etc.). Avoids vendor lock-in.

**Jaeger?**
An open-source distributed tracing backend for collecting, storing, and visualizing traces/spans to analyze latency and dependencies.

**Prometheus?**
A pull-based metrics system that scrapes endpoints, stores time-series, and supports alerting via PromQL and Alertmanager. The de facto Kubernetes metrics stack.

**Grafana?**
A visualization/dashboarding tool that queries Prometheus, Loki, and others to build dashboards and alerts. The "eyes" on your metrics.

**RED metrics?**
Request-oriented: Rate (requests/sec), Errors (failed/sec), Duration (latency distribution). Great for monitoring request-driven services.

**USE metrics?**
Resource-oriented: Utilization, Saturation, Errors — per resource (CPU, memory, disk, network). Great for diagnosing infrastructure/resource bottlenecks.

### Production

**How do you debug a request across 20 services?**
Use distributed tracing with a propagated correlation/trace ID: find the trace, inspect the span timeline to locate the slow/failing service, then drill into that service's logs (filtered by the correlation ID) and metrics. Tracing first to localize, logs to root-cause.

**Which metrics do you alert on?**
User-facing symptoms (SLO-based): error rate, latency (p95/p99), and saturation/availability — i.e., RED + key business signals. Alert on symptoms users feel, not noise.

**Why not CPU alerts?**
High CPU isn't necessarily a problem (it can mean efficient use), and normal CPU doesn't mean users are happy. CPU is a *cause* to investigate, not a *symptom* to page on. Alert on SLO breaches; use CPU for diagnosis/autoscaling.

---

## 14. Security

**JWT?**
JSON Web Token: a signed (optionally encrypted) token carrying claims (user, roles, expiry). Stateless auth — the server validates the signature without a session store. Watch size, expiry, and revocation limits.

**OAuth2?**
An authorization framework for delegated access: a client gets a scoped access token to act on a resource owner's behalf without their password (flows: authorization code, client credentials, etc.).

**OIDC?**
OpenID Connect: an identity layer on top of OAuth2 that adds authentication and an ID token (who the user is), standardizing login/SSO.

**mTLS?**
Mutual TLS: both client and server present and verify certificates, so services authenticate each other and traffic is encrypted — common for service-to-service auth in a mesh.

**SPIFFE?**
Secure Production Identity Framework For Everyone: a standard for issuing cryptographic workload identities (SVIDs) so services have verifiable identities independent of network location (often via SPIRE + mTLS).

**Vault?**
HashiCorp Vault: centralized secrets management — storing, generating (dynamic secrets), rotating, and tightly controlling access to credentials/keys, with audit logging.

**Secret Rotation?**
Regularly changing credentials/keys (ideally automatically, e.g., short-lived dynamic secrets) to limit exposure window if a secret leaks.

**RBAC?**
Role-Based Access Control: permissions granted via roles assigned to users/services. Simple and coarse-grained; scales by role.

**ABAC?**
Attribute-Based Access Control: decisions based on attributes (user, resource, environment, action) and policies — fine-grained and context-aware, more flexible than RBAC but more complex.

**Zero Trust?**
"Never trust, always verify": no implicit trust based on network location; every request is authenticated, authorized, and encrypted (identity-based, least privilege, mTLS) regardless of being "inside" the perimeter.

---

## 15. Distributed Systems

**CAP Theorem?**
In a network partition (P), a distributed system must choose between Consistency (C) and Availability (A); you can't have all three simultaneously during a partition. So real systems are CP or AP under partition.

**PACELC?**
An extension of CAP: if Partition, choose A vs C; *Else* (normal operation) choose between Latency and Consistency. Captures the everyday latency/consistency trade-off CAP ignores.

**FLP?**
FLP Impossibility: in a fully asynchronous system with even one faulty process, no deterministic consensus algorithm can guarantee termination. Practical consensus uses timeouts/randomness to work around it.

**Split Brain?**
When a partition causes two sides to each believe they're the leader/primary and act independently, risking divergent/conflicting state. Prevented with quorums/fencing.

**Consensus?**
Getting multiple nodes to agree on a single value/order despite failures (e.g., who's leader, log order). Foundation for replication and coordination.

**Raft?**
A consensus algorithm designed for understandability: leader election, log replication, and safety via terms and majority quorums. Used by etcd, Consul.

**Paxos?**
A foundational, famously hard-to-understand consensus algorithm achieving agreement among nodes with majority quorums. Raft was created as a simpler alternative.

**Network Partition?**
A network failure splitting nodes into groups that can't communicate, while each group may still be up — the scenario CAP is about. Systems must decide how to behave.

**Clock Skew?**
Differences between machine clocks. Makes "wall clock" ordering unreliable across nodes, so systems use logical clocks (Lamport), vector clocks, or hybrid (TrueTime-style) approaches.

**Eventual Consistency?**
Given no new updates, all replicas eventually converge to the same value. Trades immediate consistency for availability/latency — the norm in AP systems and most microservice data sync.

---

## 16. Scalability

**Horizontal Scaling?**
Adding more instances/machines (scale out) and distributing load. Near-limitless and resilient, but requires stateless design and load balancing. Preferred for microservices.

**Vertical Scaling?**
Adding more resources (CPU/RAM) to one machine (scale up). Simple but capped by hardware limits and a single point of failure.

**Stateless Service?**
A service that keeps no client state between requests (state lives in DB/cache/token), so any instance can handle any request — the key enabler of horizontal scaling.

**Sticky Sessions?**
Routing a client always to the same instance (session affinity) because state is held in-instance. A crutch that hurts scalability/failover; prefer externalizing state.

**Load Balancer?**
Distributes incoming traffic across instances using algorithms (round-robin, least-connections) with health checks, improving throughput and availability. L4 (transport) or L7 (application).

**Auto Scaling?**
Automatically adjusting instance/Pod count based on metrics or schedules (e.g., HPA) to match demand, controlling cost and handling spikes.

**Multi Region?**
Deploying across geographic regions for lower latency to users and disaster resilience. Adds data replication/consistency and routing complexity.

**Active-Active?**
All regions/instances serve traffic simultaneously, sharing load; better utilization and failover, but needs conflict handling/consistency across regions.

**Active-Passive?**
One region/instance serves traffic; the standby takes over on failure (failover). Simpler consistency, but idle resources and failover delay.

---

## 17. Performance

**Compression?**
Shrinking payloads (gzip/brotli) to cut bandwidth and latency, trading some CPU. Big win for text/JSON over the wire.

**Pagination?**
Returning large result sets in chunks (offset or, better, cursor/keyset-based) to bound payload size and DB load. Keyset pagination avoids deep-offset slowness.

**Streaming?**
Sending data incrementally as it's produced (HTTP chunked, SSE, gRPC streams) instead of buffering the whole response — lower memory and time-to-first-byte for large/continuous data.

**Chunking?**
Breaking a large transfer into smaller pieces (e.g., chunked transfer encoding, file upload chunks) for streaming, resumability, and bounded memory.

**HTTP Keep Alive?**
Reusing a TCP connection for multiple requests instead of reopening per request, avoiding repeated handshake cost and improving latency/throughput.

**Connection Pool?**
Maintaining a reusable set of (DB/HTTP) connections to avoid per-request setup cost and to cap concurrency — critical under load.

**HTTP/2?**
Multiplexes many requests over one connection (no head-of-line blocking at HTTP level), with header compression and server push — faster than HTTP/1.1 for many small requests.

**gRPC Streaming?**
gRPC over HTTP/2 supporting server-streaming, client-streaming, and bidirectional streaming — efficient for real-time or large continuous data between services.

---

## 18. Production Scenarios

**Payment service is down. What do you do?**
Fail fast via circuit breaker, queue the payment intent (async) or show a "we'll process shortly" state, ensure idempotency so retries don't double-charge, alert, and degrade gracefully (don't block the whole checkout flow synchronously).

**Kafka is unavailable. What happens?**
Producers can't publish — buffer in the outbox (events persist with the DB transaction) so nothing is lost; consumers pause. On recovery, the outbox publisher drains and consumers resume from committed offsets. Set producer timeouts so the app doesn't hang.

**Redis crashes.**
Cache-aside falls back to the DB (graceful degradation) — protect the DB with a circuit breaker/rate limit to avoid stampede/avalanche. For sessions/locks, use Redis HA (Sentinel/Cluster) so a single node loss doesn't take you down.

**Database becomes read-only.**
Reads continue; writes fail. Detect and switch to a degraded mode: queue writes (outbox/buffer), serve reads, surface clear errors for write actions, and trigger failover/promotion of a replica.

**Kubernetes node dies.**
The scheduler reschedules its Pods onto healthy nodes; Services drop the dead endpoints (readiness), and replicas elsewhere keep serving. Proper replica count + PodDisruptionBudgets + anti-affinity ensure no single node loss causes outage.

**Circuit breaker opens.**
Calls to the failing dependency fail fast or use a fallback (cache/default/queue), shielding the caller. The breaker periodically half-opens to test recovery and closes when healthy. Alert and investigate root cause.

**Inventory reservation fails after payment.**
This is a saga partial failure: trigger compensation — refund/void the payment (idempotently) and notify the user — or, better, reserve inventory *before* charging (reserve → pay → confirm) to avoid charging without stock.

**Duplicate payment received.**
Use an idempotency key per payment attempt; the payment service detects the repeat and returns the original result instead of charging again. Dedup at the gateway/service boundary.

**Same Kafka event processed twice.**
Expected with at-least-once. The consumer must be idempotent: track processed event IDs or use upserts keyed by business ID so the second processing is a no-op.

**User clicks Pay button 5 times.**
Disable the button on click (UI), and on the backend use an idempotency key so all 5 requests map to one payment. Never rely on UI alone.

**Consumer crashes while processing message.**
Because the offset wasn't committed, the message is redelivered after rebalance; the idempotent consumer reprocesses safely. Commit offsets *after* successful processing (at-least-once).

**Gateway goes down.**
Run multiple gateway replicas behind a load balancer/DNS with health checks so there's no single point of failure; the LB routes around the dead instance. For total gateway-tier failure, have multi-AZ/region failover.

**Database replication lag increases.**
Reads from replicas may be stale. Route read-your-writes to the primary, add monitoring/alerts on lag, and degrade (serve from primary or show "may be slightly delayed") if lag exceeds a threshold. Investigate write load/network.

**Payment service responds after 30 seconds.**
The timeout should fire long before that (fast fail), the circuit breaker opens if it persists, and the request is queued/retried idempotently. A 30s synchronous wait must never block the user thread.

**Cache returns stale data.**
Tighten TTLs, invalidate on writes (event-driven), use write-through where freshness matters, and version cache keys. For critical reads, bypass cache or read-your-writes from source.

**Outbox table grows to 100 million records.**
You're not purging published rows. Add a cleanup/archival job to delete or archive successfully published events, index the unsent-status column, and partition the table by time. Monitor publisher lag.

**One microservice becomes much slower than others.**
Bulkhead/timeout/circuit-break it so it can't drag others down, trace to find the cause (DB, GC, dependency), scale it (HPA) if it's load, and add backpressure. Isolate first, root-cause second.

---

## 19. Architecture Decisions

**Why Kafka instead of RabbitMQ?**
High-throughput event streaming, durable replayable log, multiple independent consumer groups reading the same events, and event sourcing/analytics use cases. Choose Kafka when you need a durable event backbone.

**Why RabbitMQ instead of Kafka?**
Complex routing (exchanges/bindings), per-message acknowledgements, priority queues, request/reply, and traditional task queues with lower operational overhead. Choose Rabbit for flexible messaging/work distribution.

**Why REST instead of gRPC?**
Public/external APIs, broad client/browser support, human-readable, easy caching/debugging, and no need for Protobuf tooling. Choose REST when interoperability and simplicity matter more than raw performance.

**Why PostgreSQL instead of MongoDB?**
Strong relational integrity, ACID transactions, complex joins, constraints, and rich SQL — plus JSONB for flexible fields when needed. Choose Postgres when data is relational and consistency matters.

**Why MongoDB instead of PostgreSQL?**
Flexible/evolving schemas, document-shaped data, easy horizontal sharding, and high write throughput for denormalized data. Choose Mongo for unstructured/rapidly changing schemas.

**Why Kubernetes?**
Declarative orchestration: self-healing, autoscaling, rolling deploys, service discovery, and portability across clouds — the standard for running many containers reliably at scale.

**Why Docker?**
Consistent, portable, isolated runtime ("works on my machine" solved), fast startup, immutable images, and the unit Kubernetes orchestrates.

**Why Redis?**
Sub-millisecond in-memory access for caching, sessions, rate limiting, locks, and pub/sub — offloads databases and cuts latency dramatically.

**Why Event Driven?**
Loose coupling, independent scaling, resilience (async buffering), and easy extensibility (new consumers without touching producers). Choose it when services must react to changes without tight runtime coupling.

**Why Saga?**
To maintain data consistency across services without distributed locks/2PC, using local transactions + compensation for eventual consistency. Choose it for multi-service business transactions.

---

## 20. HR + Architecture Combined

> These are STAR-format talking points. Adapt the specifics to your real experience; structure shown.

**Tell me about the most complex microservice you built.**
Frame: the business capability it owned, why it was hard (high throughput / strict consistency / many integrations), the key decisions (data model, sync vs async, resilience patterns), and the measurable outcome (latency, reliability, scale). Emphasize *why* you chose each pattern.

**Describe a production outage you handled.**
Situation (impact/severity), how you detected it (alert/metric), how you triaged with tracing/logs, the immediate mitigation (rollback/circuit break/scale), the root cause, and the lasting fix + prevention (runbook, alert, test). Show calm, method, and learning.

**Tell me about a difficult scaling problem.**
The bottleneck (DB connections, hot partition, sync chain), how you found it (metrics/profiling), the fix (caching, read replicas, async, sharding, autoscaling), and results. Highlight measuring before optimizing.

**Explain a distributed transaction you designed.**
The business flow (e.g., order → payment → inventory), choice of saga (orchestration vs choreography) and why, the compensations, idempotency, and failure handling. Show you avoided 2PC and reasoned about partial failure.

**Tell me about an incident where retries caused problems.**
A retry storm overwhelming a recovering dependency; how you diagnosed it (load correlated with retries), and the fix: exponential backoff + jitter, retry caps, circuit breaker, and idempotency. Lesson: retries need guardrails.

**Explain a memory leak in Node.js that you fixed.**
Symptom (growing RSS/heap, restarts), diagnosis (heap snapshots/`--inspect`, comparing snapshots), root cause (e.g., unbounded cache/array, event-listener accumulation, closures holding references), and fix (bounded cache, removing listeners, fixing references) + monitoring added.

**Tell me about a database migration without downtime.**
Expand-contract: add new schema (nullable/additive), dual-write, backfill in batches, switch reads, then drop old columns. Used feature flags and verified with shadow reads. No locking long-running DDL on hot tables.

**Explain your logging strategy.**
Structured JSON logs, consistent levels, correlation IDs propagated end-to-end, no PII/secrets, centralized aggregation (ELK/Loki), and sampling for noisy debug logs. Logs answer "what happened for *this* request."

**Explain your monitoring dashboard.**
SLO-driven: RED metrics per service, USE for infra, error budgets, key business KPIs, and trace links. Alerts on symptoms (latency/error/availability), not raw CPU. Dashboards mirror user experience.

**What architecture decision would you change today?**
Pick a real trade-off (e.g., split too early into too many services, or chose choreography where orchestration would've been easier to operate) and explain what you learned and how you'd decide differently — shows growth and judgment.

---

## 21. FAANG-Level Whiteboard Questions

> Approach every design with: **Requirements (functional + non-functional) → Scale estimates → API → High-level architecture → Data model → Deep dives (bottlenecks) → Trade-offs.** Below: the core idea + the one or two things interviewers really probe.

**Design Amazon Checkout**
Cart → reserve inventory → payment → order. Use a saga (reserve → charge → confirm) with idempotency keys; outbox for events; eventual consistency for order fulfillment. Probe: avoiding double-charge and overselling.

**Design Uber Ride Booking**
Geospatial matching (driver locations in a quadtree/geohash + Redis), dispatch service, real-time location updates (WebSockets), surge pricing. Probe: low-latency nearby-driver search and consistent ride state machine.

**Design WhatsApp Messaging**
Persistent connections (WebSocket) via connection servers, message queue per user, delivery/read receipts, offline storage, fan-out for groups, E2E encryption. Probe: delivery guarantees and online/offline presence at scale.

**Design Netflix Recommendation**
Offline batch pipeline (Spark) computing models + online serving layer for ranked candidates, feature store, A/B testing, caching of recommendations. Probe: offline vs online split and freshness.

**Design YouTube Upload Service**
Chunked/resumable upload to object storage → transcoding pipeline (queue + workers) into multiple resolutions → CDN distribution → metadata DB. Probe: async transcoding pipeline and storage/CDN strategy.

**Design Google Drive File Storage**
Chunked storage with content-addressable dedup, metadata service, sync/conflict resolution (versioning), sharing/permissions, delta sync. Probe: sync conflicts and large-file/dedup handling.

**Design Food Delivery Platform**
Three-sided (customer/restaurant/courier): order saga, geospatial courier matching, real-time tracking, ETA estimation. Probe: order state machine across parties and assignment logic.

**Design Payment Gateway**
Idempotent payment API, integration with PSPs, ledger (double-entry), webhooks for async status, reconciliation, PCI scope minimization, retries. Probe: idempotency, consistency of the ledger, and async settlement.

**Design Inventory Reservation**
Reserve-then-confirm with TTL on reservations, atomic decrement (DB row lock or Redis with Lua), oversell prevention, release on timeout. Probe: concurrency/race conditions under flash sales.

**Design Notification System**
Multi-channel (push/email/SMS) with a queue, per-channel workers, templating, user preferences, rate limiting, retries + DLQ, idempotency. Probe: fan-out scale and delivery reliability.

**Design URL Shortener**
Hash/base62 of an ID (or counter via key range allocation), KV store for mappings, cache hot URLs, 301/302 redirect, analytics async. Probe: unique-ID generation at scale and read-heavy caching.

**Design Distributed Rate Limiter**
Token bucket / sliding window counters in Redis with atomic Lua scripts, keyed by client; handle clock/consistency across nodes. Probe: accuracy vs performance and the distributed-counter race.

**Design Distributed Cache**
Consistent hashing for sharding, replication for HA, eviction (LRU), TTLs, and cache coherence. Probe: consistent hashing/rebalancing and hot-key handling.

**Design Chat Application**
WebSocket gateway, message persistence, pub/sub fan-out (Redis/Kafka) across connection servers, presence, ordering per conversation. Probe: scaling persistent connections and message ordering/delivery.

**Design Wallet Service**
Double-entry ledger, ACID balance updates, idempotent transactions, optimistic/pessimistic locking to prevent overspend, audit trail. Probe: consistency/no-negative-balance under concurrency.

**Design OTP Service**
Generate + store OTP (Redis with TTL), rate limit per phone/IP, delivery via SMS provider, verify with attempt limits, single-use invalidation. Probe: rate limiting/abuse prevention and expiry.

**Design Email Sending Service**
Queue-based with worker pool, provider abstraction + failover, templating, retries + DLQ, idempotency keys, suppression list, bounce/complaint handling. Probe: throughput and deliverability/retries.

**Design Audit Logging System**
Append-only, immutable, tamper-evident (hash chain) store; async ingestion via Kafka; partitioned/time-series storage; queryable; retention. Probe: immutability/integrity and high write throughput.

**Design Search Autocomplete**
Prefix trie or FST in memory, ranked by popularity, served from cache, updated by an offline pipeline; debounced client requests. Probe: low-latency prefix lookup and ranking/freshness.

**Design API Gateway**
Routing, auth/token validation, rate limiting (Redis), TLS termination, aggregation/BFF, caching, observability; horizontally scaled, stateless. Probe: where cross-cutting concerns live and avoiding it becoming a monolith.

---

*End of guide. Each section is self-contained — jump via the Table of Contents.*
