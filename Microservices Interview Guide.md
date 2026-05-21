# Microservices Interview Guide — Senior/Staff Backend Engineer (10+ Years)

> A comprehensive Q&A reference covering architecture, messaging systems (RabbitMQ, Kafka, SQS), inter-service authentication, design patterns, and real-world production concerns.

---

## Table of Contents

1. [Core Microservices Concepts](#1-core-microservices-concepts)
2. [Message Brokers — RabbitMQ](#2-message-brokers--rabbitmq)
3. [Message Brokers — Apache Kafka](#3-message-brokers--apache-kafka)
4. [Message Brokers — Amazon SQS](#4-message-brokers--amazon-sqs)
5. [RabbitMQ vs Kafka vs SQS — Head-to-Head](#5-rabbitmq-vs-kafka-vs-sqs--head-to-head)
6. [Messaging Patterns](#6-messaging-patterns)
7. [Authentication & Authorization Between Microservices](#7-authentication--authorization-between-microservices)
8. [Design Patterns in Microservices](#8-design-patterns-in-microservices)
9. [Data Management](#9-data-management)
10. [Resilience & Fault Tolerance](#10-resilience--fault-tolerance)
11. [Observability & Monitoring](#11-observability--monitoring)
12. [Deployment & DevOps](#12-deployment--devops)
13. [Real-World Scenario Questions](#13-real-world-scenario-questions)
14. [System Design Questions](#14-system-design-questions)
15. [Anti-Patterns & Pitfalls](#15-anti-patterns--pitfalls)

---

## 1. Core Microservices Concepts

### Q: What are microservices? How do you define them for your team?

**A:** Microservices are an architectural style where an application is composed of small, autonomous services that are independently deployable, each owning a specific business capability. Each service runs in its own process, communicates over lightweight protocols (HTTP/REST, gRPC, or async messaging), and can be developed, deployed, and scaled independently.

Key characteristics:
- Single Responsibility — one service, one bounded context
- Independently deployable — no coordinated release needed
- Decentralized data management — each service owns its database
- Technology heterogeneity — services can use different languages/stacks
- Designed for failure — assume every dependency can fail

### Q: What are the benefits of microservices?

**A:**
- **Independent scalability** — scale only the services under load, not the entire monolith
- **Faster release cycles** — small teams own small codebases and ship independently
- **Technology freedom** — pick the best language, framework, and database per service
- **Fault isolation** — a crash in the payment service doesn't bring down the catalog
- **Organizational alignment** — maps cleanly to cross-functional teams (Conway's Law)
- **Easier onboarding** — a developer can understand a single service quickly

### Q: What are the drawbacks/challenges?

**A:**
- **Distributed system complexity** — network latency, partial failures, eventual consistency
- **Operational overhead** — dozens of services means dozens of deployments, logs, and dashboards
- **Data consistency** — no ACID transactions across services; you need sagas or eventual consistency
- **Testing difficulty** — integration and end-to-end tests are harder; contract testing becomes essential
- **Service discovery and networking** — need infrastructure for routing, load balancing, DNS
- **Debugging and tracing** — a single user request may touch 10+ services; distributed tracing is mandatory
- **Team maturity required** — demands strong DevOps culture, CI/CD, monitoring, and ownership

### Q: When should you NOT use microservices?

**A:** Avoid microservices when the team is small (fewer than 5-8 engineers), the domain is not well understood (you'll draw wrong boundaries), you lack DevOps maturity (no CI/CD, no container orchestration), or the application is simple enough that a modular monolith handles it well. Premature decomposition is worse than a well-structured monolith.

### Q: Explain bounded context and how it relates to microservice boundaries.

**A:** Bounded context is a Domain-Driven Design (DDD) concept. It defines the boundary within which a particular domain model applies. Each microservice should align with one bounded context. For example, the "Order" entity in the Order service has different attributes and behavior than an "Order" reference inside the Shipping service. They are not the same model — they are different representations within different bounded contexts. Getting these boundaries right is the single most important architectural decision.

### Q: How do you decide the granularity of a microservice?

**A:** I use several heuristics:
- **Business capability** — can a single team own it end-to-end?
- **Data ownership** — does it have a clear, independent data store?
- **Rate of change** — is this part of the system changing independently?
- **Scalability profile** — does it need to scale differently from its neighbors?
- **Team size** — follows the "two-pizza team" rule; if a service needs more than one team, it's too big
- **Coupling** — if two services always deploy together, they should probably be one service

---

## 2. Message Brokers — RabbitMQ

### Q: What is RabbitMQ?

**A:** RabbitMQ is an open-source message broker that implements the Advanced Message Queuing Protocol (AMQP). It acts as an intermediary for messaging — producers send messages to exchanges, exchanges route messages to queues based on routing rules (bindings), and consumers pull messages from queues. It's written in Erlang and is known for flexible routing, reliability, and mature tooling.

### Q: Explain the core components of RabbitMQ.

**A:**
- **Producer** — application that publishes messages to an exchange
- **Exchange** — receives messages from producers and routes them to queues based on bindings and routing keys
- **Queue** — a buffer that stores messages until a consumer is ready to process them
- **Binding** — a rule that tells the exchange which queue(s) to route messages to
- **Consumer** — application that subscribes to a queue and processes messages
- **Virtual Host (vhost)** — logical namespace for isolation; each vhost has its own exchanges, queues, and permissions

### Q: What are the exchange types in RabbitMQ?

**A:**
- **Direct** — routes messages to queues where the routing key exactly matches the binding key. Use case: task distribution.
- **Fanout** — broadcasts every message to all bound queues, ignoring routing keys. Use case: notifications, event broadcasting.
- **Topic** — routes based on pattern matching of routing keys using wildcards (`*` matches one word, `#` matches zero or more words). Use case: selective event routing (e.g., `order.created.us`).
- **Headers** — routes based on message header attributes instead of routing key. Rarely used but useful for complex routing logic.

### Q: How does RabbitMQ handle message acknowledgment?

**A:** RabbitMQ supports manual and auto acknowledgment. In manual mode, the consumer sends an `ack` after successfully processing a message. If the consumer crashes before acking, RabbitMQ redelivers the message to another consumer. There's also `nack` (negative acknowledgment) which can optionally requeue the message. `reject` is similar but for a single message. For publishers, "publisher confirms" let the producer know when the broker has persisted the message to disk.

### Q: What are the benefits of RabbitMQ?

**A:**
- Flexible routing with multiple exchange types
- Mature and battle-tested with excellent documentation
- Supports multiple protocols (AMQP, MQTT, STOMP)
- Built-in management UI for monitoring
- Message-level TTL, dead-letter exchanges, priority queues
- Lightweight and easy to set up for moderate-scale systems
- Strong delivery guarantees (at-least-once with confirms + acks)

### Q: What are the drawbacks of RabbitMQ?

**A:**
- **Not designed for high-throughput event streaming** — at very high volumes (millions of msg/sec), it can struggle compared to Kafka
- **Messages are deleted after consumption** — no replay capability; once consumed and acked, the message is gone
- **Scaling is harder** — clustering improves availability but doesn't shard queues across nodes by default (quorum queues and streams help but add complexity)
- **Erlang dependency** — debugging and tuning require Erlang knowledge
- **Back-pressure handling** — under heavy load, queues can grow unboundedly if consumers are slow, potentially causing memory issues
- **No native ordering guarantee across consumers** — multiple consumers on one queue means messages may be processed out of order

### Q: What is a Dead Letter Exchange (DLX)?

**A:** A DLX is an exchange that receives messages that were rejected (nacked without requeue), expired (TTL exceeded), or couldn't be delivered because the queue exceeded its max length. You configure a DLX on a queue, and undeliverable messages are automatically routed there. This is critical for building retry mechanisms and poison-message handling in production systems.

### Q: Explain RabbitMQ's quorum queues.

**A:** Quorum queues are a replicated queue type based on the Raft consensus algorithm. They replicate queue content across multiple nodes and provide stronger data-safety guarantees than classic mirrored queues. They're the recommended choice for data safety in production. Trade-offs include higher memory usage and not supporting some classic queue features like message priorities.

---

## 3. Message Brokers — Apache Kafka

### Q: What is Apache Kafka?

**A:** Apache Kafka is a distributed event streaming platform. Unlike traditional message brokers, Kafka is fundamentally a distributed commit log. Producers write events to topics (partitioned, ordered, append-only logs), and consumers read from those logs at their own pace using offsets. Kafka retains messages for a configurable time (or indefinitely), enabling replay, multiple consumer groups, and event sourcing patterns. It's designed for high throughput, fault tolerance, and horizontal scalability.

### Q: Explain Kafka's architecture.

**A:**
- **Broker** — a Kafka server; a cluster has multiple brokers for fault tolerance
- **Topic** — a named stream of records, analogous to a database table
- **Partition** — a topic is split into partitions for parallelism; each partition is an ordered, immutable log
- **Offset** — a unique, sequential ID for each message within a partition; consumers track their position via offsets
- **Producer** — writes records to topics; can choose partition by key (hash-based) or round-robin
- **Consumer** — reads records from topics; each consumer in a consumer group reads from exclusive partitions
- **Consumer Group** — a set of consumers that cooperatively consume a topic; Kafka assigns partitions to consumers in the group
- **ZooKeeper/KRaft** — ZooKeeper was used for metadata management and leader election; KRaft (Kafka Raft) is the newer built-in replacement, removing the ZooKeeper dependency
- **Replication** — each partition has a leader and configurable replicas (ISR — In-Sync Replicas) for fault tolerance

### Q: What are the benefits of Kafka?

**A:**
- **Extreme throughput** — can handle millions of messages per second per cluster
- **Message retention and replay** — consumers can re-read old messages; essential for event sourcing, auditing, and reprocessing
- **Horizontal scalability** — add brokers and partitions to scale linearly
- **Strong ordering** — ordering guaranteed within a partition
- **Multiple consumer groups** — multiple independent applications can consume the same topic without interference
- **Durability** — messages are persisted to disk and replicated across brokers
- **Ecosystem** — Kafka Connect for integrations, Kafka Streams and ksqlDB for stream processing, Schema Registry for data governance

### Q: What are the drawbacks of Kafka?

**A:**
- **Operational complexity** — running a Kafka cluster requires expertise (broker config, partition rebalancing, ISR management, monitoring lag)
- **Not ideal for traditional request-reply** — Kafka is designed for streaming, not RPC-style messaging
- **No built-in message routing** — unlike RabbitMQ's exchanges, Kafka has no content-based routing; consumers read entire topics
- **Consumer complexity** — managing offsets, rebalances, and exactly-once semantics adds application-level complexity
- **Partition count is hard to change** — increasing partitions is easy but decreasing is not supported; choosing the right count upfront matters
- **Latency** — Kafka optimizes for throughput via batching, which can add milliseconds of latency; not ideal for ultra-low-latency use cases
- **Storage costs** — long retention periods with high throughput can demand significant disk space

### Q: Explain consumer groups and partition assignment.

**A:** A consumer group is a set of consumers that divide the work of consuming a topic. Kafka assigns each partition to exactly one consumer within a group. If there are 6 partitions and 3 consumers in a group, each gets 2 partitions. If a consumer dies, its partitions are reassigned (rebalance). If there are more consumers than partitions, the extras sit idle. Multiple consumer groups can independently consume the same topic — each group maintains its own offsets.

### Q: What is exactly-once semantics in Kafka?

**A:** Exactly-once semantics (EOS) means each message is processed exactly once even in the presence of failures. Kafka achieves this through:
- **Idempotent producer** — deduplicates retried sends at the broker level using producer ID and sequence numbers
- **Transactional API** — allows atomic writes across multiple partitions; either all writes commit or none do
- **Consumer with read_committed isolation** — consumers only see committed transactional messages

EOS is available end-to-end within Kafka (producer → broker → consumer) using the Kafka Streams library. For external systems, you still need application-level idempotency.

### Q: What is Kafka's ISR (In-Sync Replicas)?

**A:** ISR is the set of replicas that are fully caught up with the partition leader. When a producer sends a message with `acks=all`, the leader waits for all ISR members to acknowledge before confirming. If a replica falls behind, it's removed from the ISR. The `min.insync.replicas` setting ensures a minimum number of replicas must acknowledge, providing a durability guarantee. For example, with a replication factor of 3 and `min.insync.replicas=2`, you can tolerate one broker failure without data loss.

---

## 4. Message Brokers — Amazon SQS

### Q: What is Amazon SQS?

**A:** Amazon Simple Queue Service (SQS) is a fully managed message queuing service from AWS. It eliminates the operational overhead of running and scaling a message broker. SQS offers two queue types: Standard (best-effort ordering, at-least-once delivery, nearly unlimited throughput) and FIFO (strict ordering, exactly-once processing, up to 3,000 messages/sec with batching). It's a pull-based system — consumers poll the queue for messages.

### Q: Explain SQS Standard vs FIFO queues.

**A:**

| Feature | Standard Queue | FIFO Queue |
|---|---|---|
| Ordering | Best-effort; no guarantee | Strict FIFO within message group |
| Delivery | At-least-once (duplicates possible) | Exactly-once processing |
| Throughput | Nearly unlimited | 300 msg/sec (3,000 with batching) |
| Use case | High throughput, order not critical | Order-sensitive workflows, deduplication needed |
| Deduplication | Not built-in | Content-based or explicit dedup ID |
| Message Group ID | Not applicable | Required; enables parallel ordered processing |

### Q: What are the benefits of SQS?

**A:**
- **Fully managed** — zero operational overhead; no brokers to provision, patch, or scale
- **Automatic scaling** — handles any volume without capacity planning
- **High availability** — messages replicated across multiple AZs by default
- **Pay-per-use pricing** — cost-effective for variable workloads
- **Dead-letter queues (DLQ)** — built-in support for poison message handling
- **Integration with AWS ecosystem** — Lambda triggers, SNS fan-out, EventBridge, Step Functions
- **Visibility timeout** — prevents other consumers from processing a message while one consumer is working on it
- **Long polling** — reduces empty receives and cost

### Q: What are the drawbacks of SQS?

**A:**
- **No message replay** — once deleted, a message is gone; no Kafka-style retention and re-read
- **No built-in pub/sub** — SQS is point-to-point; for fan-out you must combine with SNS (SNS → SQS pattern)
- **FIFO throughput limits** — 300/3,000 msg/sec may be insufficient for high-volume systems
- **Polling model** — adds latency compared to push-based systems; long polling helps but introduces up to 20 seconds of wait
- **AWS lock-in** — tightly coupled to the AWS ecosystem; migration is costly
- **Limited routing** — no exchange/routing-key concept; one queue, one purpose
- **Message size limit** — 256 KB max (use Extended Client Library with S3 for larger payloads)
- **No native cross-region replication** — you must build this yourself

### Q: What is the visibility timeout in SQS?

**A:** When a consumer receives a message from SQS, the message becomes invisible to other consumers for a configurable period called the visibility timeout (default 30 seconds). If the consumer processes the message and deletes it within this window, it's done. If the consumer crashes or takes too long, the visibility timeout expires and the message reappears in the queue for another consumer to pick up. You can dynamically extend the timeout using `ChangeMessageVisibility` if processing takes longer than expected.

### Q: How do you handle large messages in SQS?

**A:** SQS has a 256 KB message size limit. For larger payloads, use the Amazon SQS Extended Client Library (Java) or a custom implementation: store the payload in S3, put a reference (S3 bucket + key) in the SQS message, and have the consumer retrieve the full payload from S3. This is a common pattern for processing images, documents, or large JSON payloads.

---

## 5. RabbitMQ vs Kafka vs SQS — Head-to-Head

### Q: When would you choose each?

**A:**

| Criteria | RabbitMQ | Kafka | SQS |
|---|---|---|---|
| **Best for** | Complex routing, RPC, task queues | High-throughput streaming, event sourcing, log aggregation | Simple decoupling, serverless, AWS-native apps |
| **Throughput** | Tens of thousands msg/sec | Millions msg/sec | Unlimited (Standard) / 3K (FIFO) |
| **Message retention** | Until consumed | Configurable (hours to forever) | Up to 14 days |
| **Ordering** | Per-queue (single consumer) | Per-partition | Best-effort (Standard) / Strict (FIFO) |
| **Replay** | No | Yes | No |
| **Routing** | Rich (exchanges, binding keys) | No built-in routing | None |
| **Delivery semantics** | At-least-once (with confirms) | At-least-once / Exactly-once | At-least-once / Exactly-once (FIFO) |
| **Operational cost** | Self-managed (or CloudAMQP) | High (self-managed) or use Confluent/MSK | Zero (fully managed) |
| **Protocol** | AMQP, MQTT, STOMP | Custom binary protocol | HTTP/HTTPS (AWS SDK) |

### Q: Can they be used together?

**A:** Absolutely. A common production architecture uses Kafka as the central event backbone (high-throughput, durable event log), RabbitMQ for services that need complex routing or RPC-style communication, and SQS for AWS Lambda-triggered workloads or simple async decoupling. For example: Kafka captures all order events, a RabbitMQ-based notification service selectively routes alerts by type and region, and SQS triggers Lambda functions for PDF generation.

---

## 6. Messaging Patterns

### Q: Explain the main messaging patterns used in microservices.

**A:**

**Point-to-Point (Queue):**
One producer sends a message to a queue, and exactly one consumer processes it. Used for task distribution and work queues. RabbitMQ direct exchange, SQS standard queue, and Kafka with a single consumer group all implement this pattern.

**Publish-Subscribe (Pub/Sub):**
A producer publishes an event and multiple subscribers receive it. Used for event broadcasting (e.g., "OrderPlaced" event consumed by Inventory, Notification, and Analytics services). RabbitMQ fanout exchange, Kafka with multiple consumer groups, and SNS + SQS fan-out implement this.

**Request-Reply:**
A service sends a request message and waits for a response on a reply queue. Used for synchronous-style communication over async transport. RabbitMQ has built-in support with correlation IDs and reply-to headers. Kafka can do it but it's awkward. SQS requires two queues.

**Competing Consumers:**
Multiple consumers listen on the same queue, and each message is processed by exactly one consumer. This is how you horizontally scale message processing. RabbitMQ and SQS natively support this. In Kafka, consumers within the same consumer group are competing consumers across partitions.

**Event Sourcing:**
Every state change is captured as an immutable event in an append-only log. The current state is derived by replaying events. Kafka's durable, replayable log makes it the natural choice for event sourcing.

**CQRS (Command Query Responsibility Segregation):**
Separate the write model (commands) from the read model (queries). Events flow from the command side to update materialized views on the query side. Kafka is commonly used as the event transport between the two sides.

**Dead Letter Queue (DLQ):**
Messages that fail processing after a configured number of retries are moved to a separate queue for inspection. All three systems support DLQs — RabbitMQ via DLX, Kafka via custom consumer logic, and SQS natively.

**Saga Pattern:**
A sequence of local transactions across services, coordinated through events. If a step fails, compensating transactions undo previous steps. Can be choreography-based (each service listens for events and reacts) or orchestration-based (a central coordinator directs the flow). Message brokers are the backbone of saga implementation.

---

## 7. Authentication & Authorization Between Microservices

### Q: Why is inter-service auth different from user-facing auth?

**A:** User-facing auth verifies a human's identity. Inter-service auth verifies that the calling service is who it claims to be (authentication) and is allowed to call the target service (authorization). The challenges are different: there's no human to type a password, services scale to hundreds of instances, tokens must be managed programmatically, and the attack surface is the internal network itself.

### Q: What are the main approaches to inter-service authentication?

**A:**

**1. Mutual TLS (mTLS):**
Both the client and server present X.509 certificates during the TLS handshake. Each service has a certificate signed by a trusted internal CA. The server verifies the client's certificate, and the client verifies the server's. This provides transport-level encryption and authentication.

- Benefits: Strong identity, encryption in transit, no application-level token management
- Drawbacks: Certificate lifecycle management is complex (issuance, rotation, revocation), doesn't carry user context, hard to implement fine-grained authorization
- Best for: Service mesh environments (Istio, Linkerd handle mTLS automatically)

**2. JWT (JSON Web Tokens) — Token Propagation:**
The API gateway authenticates the user, issues a JWT, and each downstream service validates the JWT to know both the calling service and the originating user. Services can also have their own service-to-service JWTs.

- Benefits: Stateless validation (no network call to auth server), carries user context (claims), supports fine-grained authorization via scopes/roles
- Drawbacks: Token revocation is hard (JWTs are valid until expiry), token size grows with claims, every service needs the public key or shared secret
- Best for: Systems where downstream services need user context for authorization decisions

**3. OAuth 2.0 Client Credentials Grant:**
Each service has a client ID and secret. When Service A needs to call Service B, it requests an access token from the authorization server using client credentials. Service B validates the token.

- Benefits: Standard protocol, centralized token management, supports scopes for authorization, tokens are short-lived
- Drawbacks: Extra network hop to the auth server (mitigated by caching tokens), requires an authorization server, adds latency
- Best for: Formal environments with clear service boundaries and a need for centralized access control

**4. API Keys:**
Each service has a unique API key. The calling service includes the key in headers. The receiving service validates it against a key store.

- Benefits: Simple to implement, easy to rotate
- Drawbacks: No standard for key management, keys can leak, no built-in expiry, hard to do fine-grained auth
- Best for: Simple internal systems with few services, or as a secondary layer

**5. Service Mesh (Sidecar Proxy):**
A service mesh like Istio or Linkerd injects a sidecar proxy alongside each service. The mesh handles mTLS, identity, and authorization policies transparently. Services don't need to implement any auth logic.

- Benefits: Zero application-level auth code, centralized policy management, automatic mTLS, works across languages
- Drawbacks: Added infrastructure complexity, latency from proxy hops, debugging can be harder
- Best for: Large-scale Kubernetes deployments with many services

**6. SPIFFE/SPIRE:**
SPIFFE (Secure Production Identity Framework For Everyone) provides a standard for service identity. SPIRE is the implementation. Each workload gets a SPIFFE ID (a URI) and a short-lived X.509 certificate (SVID). Services verify each other's SVIDs.

- Benefits: Standardized identity, short-lived auto-rotated certificates, works across platforms (Kubernetes, VMs, bare metal)
- Drawbacks: Requires SPIRE infrastructure, newer ecosystem
- Best for: Multi-platform environments needing strong workload identity

### Q: How do you propagate user context across services?

**A:** There are several strategies:

- **JWT propagation** — the original JWT travels with each request; downstream services extract user claims directly
- **Custom headers** — the API gateway extracts user info and sets internal headers (e.g., `X-User-ID`, `X-User-Roles`); simpler but requires trust in the gateway
- **Token exchange** — each service exchanges the incoming token for a new, scoped token specific to the next hop (OAuth 2.0 Token Exchange — RFC 8693); most secure but most complex
- **Embedded in message payload** — for async communication, include user context in the event/message body

### Q: How do you handle auth in async/event-driven communication?

**A:** For events flowing through Kafka, RabbitMQ, or SQS:

- **Signed events** — the producing service signs the event payload with its private key; consumers verify the signature before processing
- **Envelope pattern** — wrap the event in an envelope containing the producer's identity, a timestamp, and a signature
- **Broker-level ACLs** — Kafka supports SASL authentication and ACLs to control which services can produce/consume to/from which topics; RabbitMQ has vhosts and user permissions
- **Encrypted payloads** — encrypt sensitive event data; only authorized consumers have the decryption key
- **mTLS to the broker** — ensure only authenticated services can connect to the message broker at all

### Q: What is the "confused deputy" problem in microservices?

**A:** The confused deputy problem occurs when a service (the deputy) is tricked into performing an action it shouldn't. For example, Service A calls Service B on behalf of User X, but Service B can't distinguish whether the request is authorized by User X or if Service A is acting maliciously. The fix is to always propagate the original user's context (JWT, claims) so that the target service can independently verify authorization — not just trust the calling service.

### Q: How do you manage secret rotation without downtime?

**A:** Use a secrets manager (Vault, AWS Secrets Manager) with overlapping validity. When rotating:
1. Generate the new credential
2. Configure the service to accept both old and new credentials
3. Update calling services to use the new credential (rolling deployment)
4. Revoke the old credential after all callers have migrated

For certificates, SPIRE automates this with short-lived SVIDs that rotate every few minutes. For JWTs, use JWKS endpoints where the auth server publishes both the old and new signing keys during rotation.

---

## 8. Design Patterns in Microservices

### Q: Explain the API Gateway pattern.

**A:** An API Gateway is a single entry point for all client requests. It handles cross-cutting concerns: authentication, rate limiting, request routing, SSL termination, response aggregation, and protocol translation. Clients talk to the gateway; the gateway talks to services. Examples: Kong, AWS API Gateway, Envoy, NGINX.

Benefits: Simplifies client code, centralizes auth and rate limiting, enables backend changes without affecting clients. Drawbacks: Single point of failure (must be highly available), can become a bottleneck, adds latency, risk of becoming a "god service" with too much logic.

### Q: What is the Saga pattern? Choreography vs Orchestration?

**A:** A saga manages distributed transactions as a sequence of local transactions. Each service performs its local transaction and publishes an event. If any step fails, compensating transactions are executed to undo previous steps.

**Choreography:** Each service listens for events and decides what to do next. No central coordinator. Simple for few steps, but becomes hard to understand and debug with many services (event spaghetti).

**Orchestration:** A central saga orchestrator tells each service what to do and handles the workflow logic. Easier to understand and debug, but the orchestrator is a single point of failure and can become complex.

In practice, orchestration is preferred for complex workflows (5+ steps) and choreography for simple, 2-3 step flows.

### Q: Explain the Circuit Breaker pattern.

**A:** The circuit breaker prevents a service from repeatedly calling a failing dependency, which would waste resources and cause cascading failures. It has three states:
- **Closed** — requests flow normally; failures are counted
- **Open** — after a failure threshold is reached, all requests are immediately rejected with a fallback response; no calls to the dependency
- **Half-Open** — after a timeout, a limited number of test requests are allowed through; if they succeed, the circuit closes; if they fail, it reopens

Libraries: Resilience4j (Java), Polly (.NET), Hystrix (legacy). In a service mesh, Istio can implement circuit breaking at the proxy level.

### Q: What is the Strangler Fig pattern?

**A:** A migration strategy for incrementally replacing a monolith with microservices. You build new functionality as microservices and route specific requests to them via a facade or API gateway, while the monolith continues to handle everything else. Over time, more and more traffic is routed to microservices until the monolith is "strangled" and can be decommissioned. This avoids the risky "big bang" rewrite.

### Q: Explain the Sidecar pattern.

**A:** A sidecar is a helper container deployed alongside a service container in the same pod (Kubernetes) or host. It handles cross-cutting concerns like logging, monitoring, mTLS, configuration, or service discovery without the service needing to implement them. The service mesh pattern is built on sidecars — every service gets an Envoy sidecar that handles networking transparently.

### Q: What is the Backends for Frontends (BFF) pattern?

**A:** Instead of one API gateway for all clients, you create a dedicated backend for each frontend type (web, mobile, IoT). Each BFF aggregates and tailors API responses for its specific client. This avoids the problem of a single API trying to serve clients with very different needs (a mobile app needs less data than a web dashboard). Each BFF is owned by the frontend team that consumes it.

### Q: Explain the Bulkhead pattern.

**A:** Inspired by ship bulkheads, this pattern isolates failures by partitioning resources. For example, you assign separate thread pools or connection pools for different downstream services. If the payment service is slow and exhausts its pool, the order service's pool is unaffected. This prevents a slow dependency from consuming all resources and bringing down the entire service.

### Q: What is the Event-Driven Architecture (EDA)?

**A:** An architecture where services communicate by producing and consuming events. An event represents a fact that something happened (e.g., "OrderPlaced"). Services are loosely coupled — the producer doesn't know or care who consumes the event. EDA enables reactive systems, real-time processing, and temporal decoupling. Kafka is the most common backbone for EDA in microservices.

### Q: What is the Ambassador pattern?

**A:** An ambassador is a helper service (often a sidecar) that handles outgoing network requests on behalf of a service. It can add retries, circuit breaking, logging, or routing logic. The service just sends requests to localhost, and the ambassador handles the rest. Similar to a sidecar but specifically focused on outgoing traffic.

### Q: What is the Anti-Corruption Layer (ACL)?

**A:** An ACL is a translation layer between your microservice and an external or legacy system. It prevents the external system's domain model from "corrupting" your service's clean domain model. For example, when integrating with a legacy ERP, the ACL translates between the ERP's data formats and your service's domain objects. It's a DDD concept that's essential during monolith migration.

---

## 9. Data Management

### Q: Explain the Database per Service pattern.

**A:** Each microservice owns its database (or schema). No other service can directly access another service's data — they must go through the service's API. This ensures loose coupling, independent schema evolution, and the ability to choose the best database technology per service (polyglot persistence). The trade-off is that cross-service queries become harder and data consistency requires explicit patterns like sagas.

### Q: How do you handle cross-service queries?

**A:**
- **API Composition** — a service (or API gateway) calls multiple services and aggregates results in memory. Simple but can be slow with many calls.
- **CQRS with materialized views** — consume events from multiple services to build a read-optimized view. For example, an "Order Dashboard" service subscribes to Order, Payment, and Shipping events and maintains a denormalized view.
- **Event-driven data replication** — services publish events when data changes; interested services consume these events and maintain local copies. Enables fast local queries but introduces eventual consistency.

### Q: What is eventual consistency and how do you deal with it?

**A:** Eventual consistency means that after a write, not all readers will immediately see the latest data, but they will eventually converge. In microservices, this is the norm because there's no distributed ACID transaction.

Strategies to deal with it:
- **Design for it** — make the UI communicate that data may take a moment to update (e.g., "Your order is being processed")
- **Idempotent consumers** — since messages can be delivered more than once, ensure processing the same message twice has no side effects
- **Compensation** — if something goes wrong, publish a compensating event to undo the action
- **Read-your-writes consistency** — for the user who just performed the write, ensure they see their own changes (e.g., read from the primary, write acknowledgment before redirecting)

### Q: What is the Outbox pattern?

**A:** The outbox pattern ensures reliable event publishing alongside database transactions. Instead of directly publishing an event to a broker (which could fail after the DB commit), you write the event to an "outbox" table in the same database transaction. A separate process (poller or CDC — Change Data Capture using Debezium) reads the outbox table and publishes events to the broker. This guarantees that if the DB transaction commits, the event will eventually be published.

### Q: What is Change Data Capture (CDC)?

**A:** CDC captures changes (inserts, updates, deletes) from a database's transaction log and streams them as events. Tools like Debezium read the MySQL binlog or PostgreSQL WAL and publish changes to Kafka topics. This enables real-time data synchronization between services without modifying application code. It's the backbone of the outbox pattern at scale.

---

## 10. Resilience & Fault Tolerance

### Q: How do you design for failure in microservices?

**A:**
- **Circuit breakers** — prevent cascading failures from slow or unresponsive dependencies
- **Retries with exponential backoff and jitter** — handle transient failures without thundering herd
- **Timeouts** — every external call must have a timeout; no indefinite waiting
- **Bulkheads** — isolate resource pools per dependency
- **Fallbacks** — return cached data, default values, or degraded responses when a dependency is unavailable
- **Health checks** — liveness and readiness probes so the orchestrator can restart or stop routing to unhealthy instances
- **Graceful degradation** — the system should lose features, not crash entirely (e.g., show cached prices if the pricing service is down)
- **Chaos engineering** — proactively inject failures (Netflix Chaos Monkey) to validate resilience

### Q: What is the retry storm / thundering herd problem?

**A:** When a dependency recovers from an outage, all clients that were retrying simultaneously flood it with requests, potentially causing it to fail again. Solutions: exponential backoff (increase wait time between retries), jitter (add randomness to spread retries), circuit breaker (stop retrying entirely after a threshold), and rate limiting on the server side.

### Q: How do you implement idempotency?

**A:** Assign each request a unique idempotency key (UUID). The service checks if it has already processed a request with that key before executing. If it has, it returns the cached response. Store idempotency keys in a database or cache with a TTL. This is critical for payment processing, order creation, and any operation where duplicates are dangerous. In messaging, use the message ID or a business-specific deduplication key.

### Q: Explain rate limiting strategies.

**A:**
- **Token bucket** — a bucket fills with tokens at a fixed rate; each request consumes a token; if the bucket is empty, the request is rejected
- **Sliding window** — counts requests in a rolling time window; more accurate than fixed windows
- **Per-service rate limiting** — each service enforces its own limits
- **Gateway-level rate limiting** — the API gateway enforces global limits per client/API key
- **Distributed rate limiting** — use Redis or a shared counter for rate limiting across multiple instances

---

## 11. Observability & Monitoring

### Q: What are the three pillars of observability?

**A:**
- **Logs** — structured, contextual records of events (use JSON, include correlation IDs). Tools: ELK Stack (Elasticsearch, Logstash, Kibana), Loki, Fluentd.
- **Metrics** — numeric measurements over time (request rate, error rate, latency percentiles, saturation). Tools: Prometheus, Grafana, Datadog.
- **Traces** — end-to-end path of a request across services (distributed tracing). Tools: Jaeger, Zipkin, AWS X-Ray, OpenTelemetry.

### Q: What is distributed tracing and why is it critical?

**A:** Distributed tracing follows a request as it flows through multiple services. Each service adds a "span" to the trace, recording timing, service name, and metadata. A trace ID propagated in headers (W3C Trace Context or B3) ties all spans together. Without distributed tracing, debugging a latency issue across 10+ services is nearly impossible. OpenTelemetry is the industry standard for instrumentation.

### Q: What metrics should every microservice expose?

**A:** At minimum, the RED metrics:
- **Rate** — requests per second
- **Errors** — error rate (5xx, timeouts)
- **Duration** — latency percentiles (p50, p95, p99)

Additionally:
- Saturation — CPU, memory, connection pool usage, queue depth
- Business metrics — orders processed, payments completed
- Downstream dependency health — circuit breaker state, retry counts
- Message broker metrics — consumer lag (Kafka), queue depth (RabbitMQ/SQS), processing rate

---

## 12. Deployment & DevOps

### Q: What deployment strategies do you use for microservices?

**A:**
- **Blue-Green** — run two identical environments; switch traffic from blue (current) to green (new) after validation. Instant rollback by switching back.
- **Canary** — route a small percentage of traffic (1-5%) to the new version; monitor for errors; gradually increase. Limits blast radius.
- **Rolling** — replace instances one at a time. Kubernetes default. Minimal resource overhead but rollback is slower.
- **Feature flags** — deploy the code but keep features disabled; enable for specific users or percentages. Decouples deployment from release.
- **Shadow/Dark launch** — route a copy of production traffic to the new version without affecting users. Validates behavior under real load.

### Q: How do you handle database migrations in microservices?

**A:** Every migration must be backward-compatible with the currently running code. Use the "expand and contract" pattern:
1. **Expand** — add the new column/table (nullable or with defaults); deploy code that writes to both old and new
2. **Migrate** — backfill data
3. **Contract** — deploy code that only uses the new schema; drop old column/table

Tools: Flyway, Liquibase, or language-specific tools. Never make breaking schema changes in a single deployment.

### Q: What is a service mesh and when do you need one?

**A:** A service mesh (Istio, Linkerd, Consul Connect) is a dedicated infrastructure layer for service-to-service communication. It handles mTLS, traffic management (canary, retries, timeouts), observability (automatic metrics and traces), and authorization policies — all without changing application code.

You need one when: you have 50+ services, you want consistent cross-cutting behavior across languages, you need mTLS everywhere, or you want traffic management capabilities (canary routing, fault injection). You don't need one for fewer than 10 services or when the operational overhead isn't justified.

---

## 13. Real-World Scenario Questions

### Q: A downstream service is intermittently timing out, causing your service's response times to spike. How do you handle this?

**A:**
1. Check distributed traces to identify which service is slow and where the latency is
2. Verify the circuit breaker state — if it's not tripping, the threshold may be too lenient
3. Implement or tighten the timeout on calls to that service
4. Ensure the circuit breaker is configured: open after N failures, return a fallback (cached data or degraded response)
5. Add a bulkhead — dedicate a separate thread/connection pool for this dependency so it doesn't consume shared resources
6. Implement retry with exponential backoff for transient failures
7. Long term — consider making the call async via a message queue if it doesn't need to be synchronous

### Q: You're processing 10 million events per day and occasionally losing events. How do you diagnose and fix this?

**A:**
1. Check consumer lag — if using Kafka, is the consumer group falling behind?
2. Check for consumer rebalances — frequent rebalances can cause message loss during partition reassignment
3. Verify commit strategy — are offsets being committed before processing completes? Switch to manual commits after processing.
4. Check dead-letter queues — are messages failing and being discarded silently?
5. Enable producer acknowledgments — `acks=all` in Kafka, publisher confirms in RabbitMQ
6. Implement the outbox pattern — ensure events are reliably published from the source
7. Add monitoring — track produced vs consumed counts; set up alerts on divergence
8. Implement idempotent processing — even if a message is delivered twice, processing is safe

### Q: Two teams want to share a database to avoid event-driven complexity. What do you tell them?

**A:** I'd push back firmly. Shared databases create tight coupling — schema changes in one service can break the other, deployment independence is lost, and you can't scale or optimize storage independently. The short-term convenience creates long-term pain. Instead, I'd suggest: define clear APIs between the services, use async events for data that needs to be shared, or if the coupling is that tight, question whether they should be separate services at all. Sometimes the answer is to merge them.

---

## 14. System Design Questions

### Q: Design an order processing system with microservices.

**A:**

**Services:**
- Order Service — accepts and validates orders, manages order lifecycle
- Inventory Service — tracks stock, handles reservations
- Payment Service — processes payments, handles refunds
- Notification Service — sends emails, SMS, push notifications
- Shipping Service — manages fulfillment and tracking

**Flow (Orchestrated Saga):**
1. Client → API Gateway → Order Service (create order, status: PENDING)
2. Order Service → Inventory Service: reserve stock
3. If reserved → Order Service → Payment Service: charge customer
4. If charged → Order Service → Shipping Service: create shipment
5. Order Service updates status to CONFIRMED and publishes OrderConfirmed event
6. Notification Service (subscribed to OrderConfirmed) sends confirmation email

**Failure handling (compensations):**
- Payment fails → release inventory reservation
- Shipping fails → refund payment, release inventory

**Technology choices:**
- Kafka for the event backbone (OrderCreated, InventoryReserved, PaymentCharged events)
- Saga orchestrator in the Order Service
- Each service has its own database (Postgres for Order/Inventory, a payment gateway for Payment)
- Redis for caching inventory counts
- API Gateway with JWT auth
- Distributed tracing with OpenTelemetry

### Q: How would you design a notification system at scale?

**A:**
- **Ingestion**: Services publish notification requests to Kafka topics (email, sms, push)
- **Processing**: Consumer services per channel pull from their topic, template the message, and call the provider (SendGrid, Twilio, FCM)
- **Rate limiting**: Per-user rate limits to avoid spamming; use Redis for counters
- **Deduplication**: Idempotency key in each notification event; check before sending
- **Retry**: Failed sends go to a retry topic with exponential backoff; after N retries, move to DLQ
- **Preferences**: A user preference service stores channel preferences and quiet hours; the router checks before dispatching
- **Tracking**: Each notification gets a unique ID; track sent/delivered/opened status

---

## 15. Anti-Patterns & Pitfalls

### Q: What are common microservices anti-patterns?

**A:**

**Distributed Monolith:** Services that must be deployed together because they're tightly coupled. You have all the complexity of microservices with none of the benefits. Fix: enforce strict API contracts, database per service, and independent deployment pipelines.

**Nano-services:** Services that are too small to justify the operational overhead. A service that has 50 lines of business logic but requires its own database, deployment pipeline, and monitoring is a net negative. Fix: merge related nano-services.

**Shared Database:** Multiple services reading and writing the same database. Any schema change is a coordination nightmare. Fix: database per service, communicate via APIs or events.

**God Service:** One service that does too much and becomes a bottleneck. Fix: decompose by bounded context.

**Chatty Communication:** Services making dozens of synchronous calls to each other for a single user request. Fix: aggregate calls in a BFF or gateway, use async events, or merge overly chatty services.

**Ignoring Network Failures:** Treating remote calls like local function calls. Fix: implement timeouts, retries, circuit breakers, and fallbacks for every external call.

**Event Soup:** In choreography-based systems, so many events flying around that no one can understand the flow. Fix: use orchestration for complex flows, document event contracts, visualize event flows.

**Not Investing in Observability:** You can't debug what you can't see. Fix: structured logging, distributed tracing, and business metrics from day one — not after the first production incident.

---

## Quick Reference Card

| Topic | Key Points |
|---|---|
| When to use microservices | Complex domain, multiple teams, independent scaling needs, mature DevOps |
| RabbitMQ | Complex routing, task queues, RPC; messages deleted after consumption |
| Kafka | High throughput, event streaming, replay, event sourcing; operational complexity |
| SQS | Fully managed, AWS-native, serverless triggers; no replay, no pub/sub alone |
| Inter-service auth | mTLS for transport, JWT for user context, OAuth2 CC for service identity, service mesh for zero-code |
| Data consistency | Saga pattern, outbox + CDC, eventual consistency, idempotent consumers |
| Resilience | Circuit breaker, bulkhead, retry with backoff, timeout, graceful degradation |
| Observability | Logs + Metrics + Traces; OpenTelemetry; RED metrics; consumer lag monitoring |

---

*This guide is designed as a comprehensive interview preparation resource for senior backend engineers. Each answer reflects production experience and architectural decision-making expected at the 10+ year experience level.*
