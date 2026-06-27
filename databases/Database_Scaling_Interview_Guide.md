# Database Scaling Interview Guide (Sharding / Replication / Partitioning)

# Have you handled database scaling challenges (sharding/replication/partitioning)?

## Interview Answer

**Answer:**

Yes. In my backend experience, I have worked on database scaling
primarily through **replication, partitioning, indexing, caching, and
query optimization**. While I haven't implemented production-level
database sharding, I understand its architecture, trade-offs, and when
it should be used.

------------------------------------------------------------------------

# 1. Read Replication

## Scenario

Our application was read-heavy, with thousands of product and dashboard
requests but comparatively fewer write operations.

## Problem

The primary database was handling both reads and writes, increasing CPU
utilization and query latency.

## Solution

-   Configured a primary-replica architecture.
-   Routed all SELECT queries to read replicas.
-   Kept INSERT, UPDATE, and DELETE operations on the primary database.
-   Used connection pooling in the Node.js application.

## Result

-   Reduced load on the primary database.
-   Improved API response times.
-   Increased overall system throughput.

**Tech Stack**

-   Node.js
-   Express.js
-   MySQL
-   Sequelize

------------------------------------------------------------------------

# 2. Table Partitioning

## Scenario

An audit/log table grew to millions of rows.

## Problem

Reports and searches became slower because every query scanned a massive
table.

## Solution

-   Partitioned the table by month.
-   Archived older partitions.
-   Queried only relevant partitions.

## Result

-   Faster reporting.
-   Reduced scan time.
-   Easier maintenance.

------------------------------------------------------------------------

# 3. Query Optimization

## Work Performed

-   Added single and composite indexes.
-   Removed unnecessary joins.
-   Replaced SELECT \* with specific columns.
-   Implemented pagination.
-   Used EXPLAIN to analyze execution plans.
-   Optimized slow SQL queries.

## Result

Some APIs improved from **4--5 seconds** to **under 500 ms**.

------------------------------------------------------------------------

# 4. Redis Caching

Before scaling the database further, we reduced unnecessary database
traffic.

## Cached Data

-   User sessions
-   Product catalog
-   Categories
-   OTPs
-   Frequently accessed master data

## Benefits

-   Lower database load
-   Faster API responses
-   Better scalability

------------------------------------------------------------------------

# 5. Application Scaling

Instead of immediately introducing sharding, we first scaled the
application.

## Techniques

-   Multiple Node.js instances using PM2
-   Load balancing
-   Database connection pooling

This delayed the need for more complex database architectures.

------------------------------------------------------------------------

# Understanding Database Sharding

Although I haven't implemented production sharding, I understand how it
works.

## Common Sharding Strategies

-   User ID-based sharding
-   Region-based sharding
-   Hash-based sharding
-   Range-based sharding

## Challenges

-   Cross-shard joins
-   Distributed transactions
-   Data rebalancing
-   Backup and recovery
-   Operational complexity

## When to Use Sharding

-   Data size exceeds a single database server.
-   Write traffic becomes too high.
-   Vertical scaling is no longer sufficient.

------------------------------------------------------------------------

# Cross Questions with Answers

## Q1. Why use replication?

**Answer**

To distribute read traffic, improve availability, and reduce load on the
primary database.

------------------------------------------------------------------------

## Q2. Can replicas handle write operations?

**Answer**

No. Typically, writes go only to the primary database. Replicas are used
for read operations.

------------------------------------------------------------------------

## Q3. What is replication lag?

**Answer**

It is the delay before data written to the primary database appears on
replicas.

------------------------------------------------------------------------

## Q4. What is partitioning?

**Answer**

Partitioning divides a large table into smaller logical partitions while
keeping it as a single table from the application's perspective.

------------------------------------------------------------------------

## Q5. Partitioning vs Sharding?

  Partitioning                 Sharding
  ---------------------------- -----------------------------------------
  Within one database          Across multiple database servers
  Easier to manage             More complex
  Improves query performance   Improves scalability and write capacity

------------------------------------------------------------------------

## Q6. Why not shard immediately?

**Answer**

Because sharding introduces significant complexity. In most systems,
indexing, caching, replication, and query optimization provide
substantial performance gains before sharding becomes necessary.

------------------------------------------------------------------------

# 30-Second Interview Answer

> "Yes. I've handled database scaling using replication, partitioning,
> indexing, Redis caching, and query optimization. For read-heavy
> workloads, I routed read traffic to replicas while writes remained on
> the primary database. I also partitioned large log tables, optimized
> slow queries with indexes and EXPLAIN, and reduced database load
> through Redis caching. Although I haven't implemented production
> sharding yet, I understand its architecture, routing strategies, and
> operational trade-offs."
