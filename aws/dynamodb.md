# DynamoDB Interview Questions

## DynamoDB Basics

1. **What is Amazon DynamoDB?** *Answer:* DynamoDB is a fully managed, serverless, key-value and document NoSQL database. It delivers single-digit millisecond performance at any scale. AWS handles the infrastructure, replication, patching, and scaling. Data is automatically replicated across 3 AZs for high availability.

2. **What is a DynamoDB Table, Item, and Attribute?** *Answer:*
   - **Table:** The top-level container (similar to a relational table)
   - **Item:** A single record (similar to a row). Maximum size: 400 KB.
   - **Attribute:** A data field within an item (similar to a column). DynamoDB is schemaless — items in the same table can have different attributes.

3. **What is a Primary Key in DynamoDB?** *Answer:* Every item must have a unique primary key. Two types:
   - **Simple Primary Key (Partition Key only):** A single attribute uniquely identifies each item. DynamoDB hashes the partition key to determine the physical partition where the item is stored.
   - **Composite Primary Key (Partition Key + Sort Key):** Multiple items can share the same partition key, but the combination of partition key + sort key must be unique. Items with the same partition key are stored together, sorted by sort key.

4. **What is the difference between DynamoDB and RDS?** *Answer:*
   | | DynamoDB | RDS |
   |---|---|---|
   | Type | NoSQL (key-value/document) | SQL (relational) |
   | Schema | Flexible (schemaless) | Fixed schema |
   | Scaling | Horizontal, automatic | Vertical or read replicas |
   | Queries | Key-based, limited filtering | Complex JOINs, full SQL |
   | Latency | Single-digit milliseconds | Variable |
   | Use case | High throughput, simple queries | Complex queries, ACID |

5. **What are Read/Write Capacity Units (RCU/WCU)?** *Answer:*
   - **Read Capacity Unit (RCU):** 1 RCU = 1 strongly consistent read/sec for items up to 4 KB, or 2 eventually consistent reads/sec. Transactional reads cost 2 RCUs.
   - **Write Capacity Unit (WCU):** 1 WCU = 1 write/sec for items up to 1 KB. Transactional writes cost 2 WCUs.

---

## Capacity Modes & Performance

6. **What are DynamoDB capacity modes?** *Answer:*
   - **Provisioned Mode:** You specify expected RCUs and WCUs. Use Auto Scaling to adjust automatically. Best for predictable traffic with cost optimization.
   - **On-Demand Mode:** DynamoDB automatically scales to handle any traffic level with no capacity planning needed. Pay per request. Best for unpredictable traffic or new tables where you don't know the load. More expensive at high, consistent scale.

7. **What is DynamoDB Auto Scaling?** *Answer:* Auto Scaling automatically adjusts provisioned RCU/WCU based on actual traffic using CloudWatch metrics and target utilization (default 70%). It scales up quickly when traffic increases and scales down slowly after traffic decreases. You set min/max capacity bounds. There's a brief delay when scaling up — if traffic spikes exceed current capacity, requests may be throttled.

8. **What is DynamoDB Accelerator (DAX)?** *Answer:* DAX is a fully managed, in-memory cache for DynamoDB. It delivers up to 10x performance improvement (microsecond latency vs millisecond). It's fully API-compatible with DynamoDB — just change the endpoint. Ideal for read-heavy workloads or applications requiring extremely low latency. Not suitable for write-heavy workloads or strongly consistent reads (DAX only caches eventually consistent reads).

---

## Indexes

9. **What is a Global Secondary Index (GSI)?** *Answer:* A GSI is an index with a different partition key (and optionally sort key) than the base table. It spans all partitions and is automatically maintained by DynamoDB. You can have up to 20 GSIs per table. GSIs have their own provisioned capacity. Supports only eventually consistent reads. Use when you need to query by non-primary-key attributes.

10. **What is a Local Secondary Index (LSI)?** *Answer:* An LSI has the same partition key as the base table but a different sort key. It must be created when the table is created and cannot be added or deleted later. Up to 5 LSIs per table. LSIs share the table's provisioned capacity and support both strongly and eventually consistent reads. Use when you need to sort/filter by different attributes within the same partition.

11. **What is the difference between GSI and LSI?** *Answer:*
    | | GSI | LSI |
    |---|---|---|
    | Partition Key | Different from base table | Same as base table |
    | Creation time | Any time | Only at table creation |
    | Capacity | Separate provisioned capacity | Shares table capacity |
    | Consistency | Eventually consistent only | Both consistency modes |
    | Limit | 20 per table | 5 per table |

---

## Features

12. **What is DynamoDB Streams?** *Answer:* DynamoDB Streams captures a time-ordered sequence of item-level changes (insert, update, delete) in a table. Records are retained for 24 hours. Common use cases: trigger Lambda on data changes, replicate data to other tables (cross-region replication), maintain audit logs, implement event-sourcing patterns.

13. **What are DynamoDB Transactions?** *Answer:* DynamoDB Transactions provide ACID guarantees across multiple items and tables in a single AWS account and region. Two operations:
    - **TransactWriteItems:** All-or-nothing writes to up to 100 items
    - **TransactGetItems:** Consistent reads of up to 100 items
    Transactions cost 2 RCUs/WCUs per operation. Useful for financial transactions, inventory management.

14. **What is DynamoDB TTL (Time To Live)?** *Answer:* TTL allows you to define a per-item timestamp attribute. DynamoDB automatically deletes items within 48 hours after the TTL timestamp passes. Deletions are free and don't consume WCUs. Ideal for session data, temporary cache, log data, and any data with a natural expiration. Deleted items still appear in DynamoDB Streams before removal.

15. **What is DynamoDB Point-in-Time Recovery (PITR)?** *Answer:* PITR enables continuous backups of your DynamoDB table and allows restoration to any point in the last 35 days, down to the second. It's like an automatic backup that you can restore from without disrupting the running table. You restore to a new table. PITR has an additional cost per GB stored.

---

## Advanced Concepts

16. **What is DynamoDB Global Tables?** *Answer:* Global Tables provide multi-region, multi-active replication. Changes made in any region are automatically replicated to all other regions, typically within 1 second. Enables low-latency access for globally distributed users and provides disaster recovery. Uses DynamoDB Streams as the replication mechanism.

17. **What is the DynamoDB partition key design best practice?** *Answer:* A good partition key should have high cardinality (many distinct values) and a uniform distribution of access patterns. Avoid "hot partitions" where one key receives disproportionate traffic. Anti-patterns: using Status (only a few values), Timestamp (writes cluster on current time). Solution: add a random suffix or use composite keys to distribute load.

18. **What is the difference between Query and Scan in DynamoDB?** *Answer:*
    - **Query:** Retrieves items with the same partition key. Can filter by sort key. Efficient and targeted — reads only relevant data. Always use Query when possible.
    - **Scan:** Reads every item in the table. Can filter client-side but still reads all data. Expensive, slow, and consumes all RCUs. Use only when you must access all items.

19. **What is DynamoDB Conditional Write?** *Answer:* A conditional write succeeds only if a specified condition is true. Example: only update an item if the current version attribute equals what you expect (optimistic locking). Prevents overwriting data that changed since you last read it. Uses ConditionExpression parameter. Does not consume WCUs if the condition fails.

20. **How do you model one-to-many relationships in DynamoDB?** *Answer:* Common patterns:
    - **Single Table Design:** Store multiple entity types in one table using a generic PK/SK scheme (e.g., PK=`USER#123`, SK=`ORDER#456`). Enables fetching a user and all their orders in a single query.
    - **Adjacency List Pattern:** Represent relationships by storing both the parent and child as items, with the sort key indicating the relationship type.
    - Use GSIs to support access patterns that need to query from the "many" side.
