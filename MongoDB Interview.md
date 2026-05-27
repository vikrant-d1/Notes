# MongoDB Interview Preparation Guide — 8 Years Experience

---

## Table of Contents

1. [MongoDB Fundamentals](#1-mongodb-fundamentals)
2. [Data Modeling](#2-data-modeling)
3. [Aggregation Framework](#3-aggregation-framework)
4. [Indexing](#4-indexing)
5. [CRUD Operations — Advanced](#5-crud-operations--advanced)
6. [Replication](#6-replication)
7. [Sharding](#7-sharding)
8. [Transactions](#8-transactions)
9. [Performance Tuning](#9-performance-tuning)
10. [Security](#10-security)
11. [Schema Validation](#11-schema-validation)
12. [Change Streams](#12-change-streams)
13. [MongoDB Atlas & Cloud Features](#13-mongodb-atlas--cloud-features)
14. [Storage Engines](#14-storage-engines)
15. [Backup & Disaster Recovery](#15-backup--disaster-recovery)
16. [Common Interview Questions with Answers](#16-common-interview-questions-with-answers)
17. [Practice Scenarios](#17-practice-scenarios)

---

## 1. MongoDB Fundamentals

### What is MongoDB?

MongoDB is an open-source, document-oriented NoSQL database that stores data in flexible, JSON-like documents called BSON (Binary JSON). Unlike relational databases that store data in rows and columns, MongoDB stores data as collections of documents, making it ideal for handling unstructured or semi-structured data at scale.

### Key Terminology

| Term | Definition |
|------|-----------|
| **Database** | A physical container for collections. Each database gets its own set of files on the file system. A single MongoDB server can host multiple databases. |
| **Collection** | A group of MongoDB documents, equivalent to a table in RDBMS. Collections do not enforce a fixed schema; documents within a collection can have different fields. |
| **Document** | A single record in a collection, stored as a BSON object. It is the basic unit of data, similar to a row in RDBMS but far more flexible. |
| **Field** | A key-value pair within a document. Fields can hold values of any BSON data type including other documents, arrays, and arrays of documents. |
| **_id** | A mandatory unique identifier for every document. If not supplied, MongoDB auto-generates a 12-byte ObjectId. |
| **BSON** | Binary JSON — MongoDB's binary-encoded serialization format used to store documents and make remote procedure calls. It extends JSON with additional data types like Date, BinData, ObjectId, Decimal128, etc. |
| **Cursor** | A pointer to the result set of a query. Cursors allow iteration through results and support methods like `.sort()`, `.limit()`, `.skip()`, and `.batchSize()`. |
| **Namespace** | The full path to a collection, combining the database name and collection name separated by a dot (e.g., `mydb.users`). |

### BSON Data Types

| Type | Description |
|------|-------------|
| `Double` | 64-bit IEEE 754 floating point |
| `String` | UTF-8 encoded string |
| `Object` | Embedded document |
| `Array` | An ordered list of values |
| `Binary Data` | For storing binary content like images or files |
| `ObjectId` | 12-byte unique identifier (4-byte timestamp + 5-byte random + 3-byte counter) |
| `Boolean` | true / false |
| `Date` | 64-bit integer representing milliseconds since Unix epoch |
| `Null` | Null value or missing field |
| `Int32 / Int64` | 32-bit and 64-bit integers |
| `Decimal128` | 128-bit decimal floating point, ideal for financial/monetary data |
| `Timestamp` | Internal type used for replication oplog |

---

## 2. Data Modeling

### Definition

Data modeling in MongoDB is the process of defining how data is stored, organized, and related within collections and documents. Unlike RDBMS where you normalize everything, MongoDB modeling is driven by your application's access patterns — how your application queries and writes data determines the shape of your documents.

### 2.1 Embedding vs Referencing

#### Embedding (Denormalization)

Embedding means nesting related data directly inside a parent document. It is the default approach in MongoDB.

```json
// Embedded Model — Order with items inside
{
  "_id": ObjectId("..."),
  "customer_name": "Rahul Sharma",
  "order_date": ISODate("2025-01-15"),
  "status": "delivered",
  "items": [
    { "product": "Laptop", "qty": 1, "price": 75000 },
    { "product": "Mouse", "qty": 2, "price": 500 }
  ],
  "shipping_address": {
    "street": "MG Road",
    "city": "Bangalore",
    "pin": "560001"
  }
}
```

**When to Embed:**
- The child data is always accessed along with the parent (e.g., address with user).
- One-to-few or one-to-many relationships where "many" is bounded and small.
- Data that does not change frequently.
- You need atomic single-document writes.

**Advantages:** Single read operation, atomic writes, no joins needed.
**Disadvantages:** Document can grow beyond 16MB limit, data duplication if embedded data is shared across documents.

#### Referencing (Normalization)

Referencing stores the related document's `_id` in the parent and uses a separate collection for related data.

```json
// Parent — Order
{
  "_id": ObjectId("order123"),
  "customer_id": ObjectId("cust456"),
  "order_date": ISODate("2025-01-15"),
  "item_ids": [ObjectId("item1"), ObjectId("item2")]
}

// Child — Customer (separate collection)
{
  "_id": ObjectId("cust456"),
  "name": "Rahul Sharma",
  "email": "rahul@example.com"
}
```

**When to Reference:**
- One-to-many relationships where "many" is unbounded or very large.
- Many-to-many relationships.
- Child documents are large and are shared across multiple parents.
- Data changes frequently and you want to avoid duplication.

**Advantages:** No duplication, smaller documents, flexible querying.
**Disadvantages:** Requires `$lookup` (join) or multiple queries, no single-document atomicity across collections (requires multi-document transactions).

### 2.2 Common Modeling Patterns

#### Bucket Pattern
Groups multiple related data points into a single document to reduce document count and improve query performance.

```json
// Instead of one doc per sensor reading, bucket by hour
{
  "sensor_id": "temp_01",
  "date": ISODate("2025-01-15T10:00:00Z"),
  "readings": [
    { "ts": ISODate("...T10:01:00Z"), "val": 22.5 },
    { "ts": ISODate("...T10:02:00Z"), "val": 22.7 },
    // ... up to 60 readings per bucket
  ],
  "count": 60,
  "sum": 1350.5,
  "avg": 22.51
}
```

**Use Case:** IoT time-series data, event logging, analytics.

#### Extended Reference Pattern
Stores a copy of frequently accessed fields from a referenced document to avoid joins on hot paths.

```json
// Order doc with extended customer reference
{
  "_id": ObjectId("..."),
  "customer_id": ObjectId("cust456"),
  "customer_name": "Rahul Sharma",    // copied from customer doc
  "customer_email": "rahul@example.com", // copied from customer doc
  "items": [...]
}
```

**Trade-off:** Faster reads, but you must keep copied fields in sync when the source changes.

#### Subset Pattern
When a document has a large array but the application only needs a few most-recent entries, store a subset in the parent and keep the full history in a separate collection.

```json
// Product doc with latest 10 reviews only
{
  "_id": ObjectId("prod1"),
  "name": "Wireless Headphones",
  "recent_reviews": [ /* latest 10 */ ],
  "total_review_count": 4523
}

// Full reviews in separate collection
{ "product_id": ObjectId("prod1"), "review": "...", "date": "..." }
```

#### Polymorphic Pattern
Stores documents with varying structures in the same collection, distinguished by a type or discriminator field.

```json
// vehicles collection
{ "type": "car", "make": "Toyota", "doors": 4, "fuel": "petrol" }
{ "type": "truck", "make": "Tata", "axles": 3, "payload_tons": 25 }
{ "type": "bike", "make": "Royal Enfield", "cc": 350 }
```

#### Outlier Pattern
Handles documents where a few have unusually large arrays. Flag outliers and store overflow in a separate collection.

```json
// Normal book
{ "title": "Some Book", "reviews": [ ... ], "has_overflow": false }

// Popular book — flag it
{ "title": "Best Seller", "reviews": [ /* first 100 */ ], "has_overflow": true }

// Overflow collection
{ "book_id": ObjectId("..."), "reviews": [ /* 101 to 200 */ ], "page": 2 }
```

#### Computed Pattern
Pre-compute frequently needed calculations and store them alongside the source data to avoid expensive real-time computations.

```json
{
  "product_id": ObjectId("..."),
  "name": "Laptop Stand",
  "total_sales": 12450,
  "avg_rating": 4.3,
  "rating_count": 892,
  "last_computed": ISODate("2025-01-15")
}
```

#### Tree Structures

**Materialized Paths:**
```json
{ "_id": "Electronics", "path": ",Root," }
{ "_id": "Laptops", "path": ",Root,Electronics," }
{ "_id": "Gaming Laptops", "path": ",Root,Electronics,Laptops," }
```

**Parent Reference:**
```json
{ "_id": "Laptops", "parent": "Electronics" }
```

**Child Reference:**
```json
{ "_id": "Electronics", "children": ["Laptops", "Phones", "Tablets"] }
```

### 2.3 Schema Design Anti-Patterns

- **Massive arrays:** Unbounded arrays that grow to thousands of entries cause document growth, rewriting, and eventually hit the 16MB BSON limit.
- **Unnecessary normalization:** Splitting data across many collections when it is always accessed together forces multiple queries or lookups.
- **Over-embedding:** Embedding large, rarely accessed data inflates document size and wastes memory.
- **No indexes on query fields:** Designing a model without considering what queries will run on it.
- **Using strings for everything:** Not leveraging proper BSON types (Date, Decimal128, ObjectId) loses query semantics, sort behavior, and storage efficiency.

---

## 3. Aggregation Framework

### Definition

The Aggregation Framework is MongoDB's data processing pipeline. It allows you to transform, filter, group, sort, reshape, and compute data through a sequence of stages. Each stage takes documents as input, processes them, and passes the result to the next stage. It is far more powerful than simple `find()` queries and is the MongoDB equivalent of SQL's `GROUP BY`, `JOIN`, `HAVING`, subqueries, window functions, and more.

```javascript
db.collection.aggregate([ stage1, stage2, stage3, ... ])
```

### 3.1 Core Pipeline Stages

#### $match
Filters documents, like a `WHERE` clause. Place `$match` as early as possible to reduce the number of documents flowing through subsequent stages and to leverage indexes.

```javascript
{ $match: { status: "active", age: { $gte: 18 } } }
```

#### $group
Groups documents by a specified key and applies accumulator expressions (sum, avg, count, push, etc.).

```javascript
{
  $group: {
    _id: "$department",
    totalSalary: { $sum: "$salary" },
    avgSalary: { $avg: "$salary" },
    count: { $sum: 1 },
    employees: { $push: "$name" },
    maxSalary: { $max: "$salary" },
    minSalary: { $min: "$salary" }
  }
}
```

#### $project
Reshapes documents — include, exclude, rename fields, or add computed fields.

```javascript
{
  $project: {
    fullName: { $concat: ["$firstName", " ", "$lastName"] },
    yearOfJoining: { $year: "$joinDate" },
    salary: 1,
    _id: 0
  }
}
```

#### $sort
Orders documents. Use `1` for ascending, `-1` for descending.

```javascript
{ $sort: { totalSalary: -1, name: 1 } }
```

#### $limit and $skip
`$limit` restricts output count; `$skip` skips the first N documents. Used together for pagination.

```javascript
{ $skip: 20 },
{ $limit: 10 }
```

#### $unwind
Deconstructs an array field, outputting one document per array element. Essential before grouping on array elements.

```javascript
// Input:  { tags: ["mongodb", "database", "nosql"] }
{ $unwind: "$tags" }
// Output: { tags: "mongodb" }, { tags: "database" }, { tags: "nosql" }

// Preserve documents with empty or missing arrays:
{ $unwind: { path: "$tags", preserveNullAndEmptyArrays: true } }
```

#### $lookup (Left Outer Join)
Performs a join with another collection.

```javascript
// Basic Lookup
{
  $lookup: {
    from: "products",
    localField: "product_id",
    foreignField: "_id",
    as: "product_details"
  }
}

// Pipeline Lookup (correlated subquery)
{
  $lookup: {
    from: "orders",
    let: { cust_id: "$_id" },
    pipeline: [
      { $match: { $expr: { $eq: ["$customer_id", "$$cust_id"] } } },
      { $match: { status: "completed" } },
      { $sort: { order_date: -1 } },
      { $limit: 5 }
    ],
    as: "recent_orders"
  }
}
```

#### $addFields / $set
Adds new fields or overwrites existing fields in documents. `$set` is an alias for `$addFields`.

```javascript
{
  $addFields: {
    totalPrice: { $multiply: ["$price", "$quantity"] },
    discountedPrice: {
      $multiply: ["$price", { $subtract: [1, "$discountRate"] }]
    }
  }
}
```

#### $replaceRoot / $replaceWith
Replaces the entire document with a specified embedded document or expression.

```javascript
{ $replaceRoot: { newRoot: "$shipping_address" } }
```

#### $out and $merge
Write aggregation results to a collection.

```javascript
// $out — replaces the entire target collection
{ $out: "monthly_report" }

// $merge — upserts into target, more flexible
{
  $merge: {
    into: "monthly_report",
    on: "_id",
    whenMatched: "merge",
    whenNotMatched: "insert"
  }
}
```

#### $facet
Runs multiple aggregation pipelines within a single stage on the same input documents. Useful for building dashboards with multiple views of the same data.

```javascript
{
  $facet: {
    priceRanges: [
      { $bucket: { groupBy: "$price", boundaries: [0, 100, 500, 1000, Infinity] } }
    ],
    topRated: [
      { $sort: { rating: -1 } },
      { $limit: 5 }
    ],
    totalCount: [
      { $count: "count" }
    ]
  }
}
```

#### $bucket and $bucketAuto
Groups documents into buckets based on value ranges.

```javascript
// Manual boundaries
{
  $bucket: {
    groupBy: "$age",
    boundaries: [0, 18, 30, 50, 100],
    default: "Other",
    output: { count: { $sum: 1 }, avgIncome: { $avg: "$income" } }
  }
}

// Automatic equal-distribution buckets
{
  $bucketAuto: {
    groupBy: "$price",
    buckets: 5
  }
}
```

#### $graphLookup
Performs recursive lookups on a collection — useful for tree structures, org charts, social networks.

```javascript
{
  $graphLookup: {
    from: "employees",
    startWith: "$managerId",
    connectFromField: "managerId",
    connectToField: "_id",
    as: "reportingChain",
    maxDepth: 5,
    depthField: "level"
  }
}
```

#### $unionWith
Combines results from two collections (like SQL UNION ALL).

```javascript
{ $unionWith: { coll: "archived_orders", pipeline: [{ $match: { year: 2024 } }] } }
```

### 3.2 Key Aggregation Expressions

```javascript
// String:    $concat, $substr, $toUpper, $toLower, $trim, $split, $regexMatch
// Math:      $add, $subtract, $multiply, $divide, $mod, $abs, $ceil, $floor, $round
// Date:      $year, $month, $dayOfMonth, $hour, $minute, $dateToString, $dateDiff
// Array:     $size, $filter, $map, $reduce, $arrayElemAt, $concatArrays, $in, $isArray
// Conditional: $cond, $ifNull, $switch
// Type:      $type, $convert, $toInt, $toString, $toDate, $toObjectId
// Comparison: $eq, $ne, $gt, $gte, $lt, $lte, $cmp
// Accumulator: $sum, $avg, $min, $max, $push, $addToSet, $first, $last, $stdDevPop
```

### 3.3 Window Functions (MongoDB 5.0+)

```javascript
{
  $setWindowFields: {
    partitionBy: "$department",
    sortBy: { salary: -1 },
    output: {
      rankInDept: { $rank: {} },
      denseRank: { $denseRank: {} },
      runningTotal: {
        $sum: "$salary",
        window: { documents: ["unbounded", "current"] }
      },
      movingAvg: {
        $avg: "$salary",
        window: { documents: [-2, 0] }
      }
    }
  }
}
```

### 3.4 Performance Tips for Aggregation

- Put `$match` and `$sort` at the beginning to leverage indexes.
- Use `$project` or `$addFields` early to drop unnecessary fields and reduce memory usage.
- The `allowDiskUse: true` option lets stages that exceed the 100MB memory limit spill to disk.
- Use `{ $match: { $expr: ... } }` inside `$lookup` pipelines for correlated joins.
- Avoid `$unwind` on large arrays if you can use array operators like `$filter`, `$map`, or `$reduce` instead.
- Use `explain("executionStats")` on aggregation pipelines to analyze performance.

---

## 4. Indexing

### Definition

An index is a special data structure (B-tree by default in MongoDB) that stores a small portion of the collection's data in an ordered, easily traversable form. Indexes dramatically speed up read queries by avoiding full collection scans (COLLSCAN). Without indexes, MongoDB must scan every document in a collection to find matching results.

### 4.1 Index Types

#### Single Field Index
Index on a single field. The most basic index type.

```javascript
db.users.createIndex({ email: 1 })    // ascending
db.users.createIndex({ age: -1 })     // descending
```

#### Compound Index
Index on multiple fields. Field order matters — it defines the index prefix and determines which queries the index can support.

```javascript
db.orders.createIndex({ customer_id: 1, order_date: -1, status: 1 })
```

**ESR Rule (Equality → Sort → Range):** For optimal compound indexes, place fields used in equality conditions first, then sort fields, then range fields.

```javascript
// Query: find active orders for a customer, sorted by date
db.orders.find({ customer_id: "abc", status: "active" }).sort({ order_date: -1 })

// Optimal index following ESR:
db.orders.createIndex({ customer_id: 1, status: 1, order_date: -1 })
// Equality: customer_id, status
// Sort: order_date
```

#### Multikey Index
Automatically created when you index a field that holds an array. MongoDB creates an index entry for each element in the array.

```javascript
db.products.createIndex({ tags: 1 })
// Query: db.products.find({ tags: "electronics" })  ← uses multikey index
```

**Limitation:** A compound index can have at most one array field (multikey field).

#### Text Index
Supports full-text search on string content. A collection can have at most one text index.

```javascript
db.articles.createIndex({ title: "text", body: "text" })
db.articles.find({ $text: { $search: "mongodb aggregation" } })

// With weights
db.articles.createIndex(
  { title: "text", body: "text" },
  { weights: { title: 10, body: 5 } }
)
```

#### Geospatial Indexes

```javascript
// 2dsphere — for GeoJSON data (Earth-like sphere)
db.places.createIndex({ location: "2dsphere" })
db.places.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [77.5946, 12.9716] },
      $maxDistance: 5000  // meters
    }
  }
})

// 2d — for flat, Euclidean plane calculations
db.grid.createIndex({ pos: "2d" })
```

#### Hashed Index
Hashes the value of a field. Used primarily for hash-based sharding to ensure even data distribution.

```javascript
db.users.createIndex({ user_id: "hashed" })
```

**Note:** Hashed indexes do not support range queries; only equality matches.

#### Wildcard Index
Indexes all fields or a subset of fields in documents with dynamic or unpredictable schemas.

```javascript
// Index all fields
db.collection.createIndex({ "$**": 1 })

// Index all fields under a specific path
db.collection.createIndex({ "metadata.$**": 1 })
```

### 4.2 Index Properties

| Property | Definition |
|----------|-----------|
| **Unique** | Rejects duplicate values for the indexed field. `db.users.createIndex({ email: 1 }, { unique: true })` |
| **Sparse** | Only indexes documents that contain the indexed field. Documents missing the field are excluded from the index. |
| **Partial** | Indexes only documents matching a filter expression. More flexible than sparse. `db.orders.createIndex({ status: 1 }, { partialFilterExpression: { status: "active" } })` |
| **TTL (Time-To-Live)** | Automatically deletes documents after a specified number of seconds. Only works on single-field indexes on Date fields. `db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 })` |
| **Hidden** | The index exists but the query planner ignores it. Useful for testing impact of dropping an index without actually dropping it. `db.collection.hideIndex("index_name")` |
| **Collation** | Specifies language-specific comparison rules (case-insensitive, accent-insensitive, etc.). |

### 4.3 Covered Queries

A covered query is one where the index contains all the fields needed to satisfy the query — both the filter fields and the returned fields. MongoDB can answer it entirely from the index without touching any documents.

```javascript
db.users.createIndex({ email: 1, name: 1 })

// This query is "covered" — all fields come from the index
db.users.find({ email: "rahul@example.com" }, { email: 1, name: 1, _id: 0 })
```

In `explain()` output, a covered query shows `totalDocsExamined: 0`.

### 4.4 The explain() Method

Used to analyze query performance. Three verbosity modes:

```javascript
db.orders.find({ status: "active" }).explain("executionStats")
```

| Mode | What It Shows |
|------|---------------|
| `"queryPlanner"` | The winning plan chosen by the optimizer |
| `"executionStats"` | Actual runtime stats — documents examined, keys examined, execution time |
| `"allPlansExecution"` | Stats for all candidate plans, not just the winner |

**Key fields to check:**
- `stage: "COLLSCAN"` → no index used (bad)
- `stage: "IXSCAN"` → index scan (good)
- `nReturned` vs `totalDocsExamined` → ideally these should be close
- `totalKeysExamined` → number of index entries scanned
- `executionTimeMillis` → total query time

### 4.5 Index Best Practices

- Create indexes that support your most frequent and performance-critical queries.
- Use the ESR rule for compound indexes.
- Avoid over-indexing — each index consumes RAM and slows down writes.
- Monitor index usage with `db.collection.aggregate([{ $indexStats: {} }])`.
- Drop unused indexes.
- Use `background: true` (pre-4.2) or rely on the default non-blocking build (4.2+) for production deployments.
- Prefer partial indexes when you only query a subset of documents.
- Use TTL indexes for session data, logs, or any data with a natural expiration.

---

## 5. CRUD Operations — Advanced

### 5.1 Advanced Query Operators

```javascript
// Comparison
$eq, $ne, $gt, $gte, $lt, $lte, $in, $nin

// Logical
$and, $or, $not, $nor

// Element
$exists    // field exists or not
$type      // field is of a specific BSON type

// Array
$all       // array contains all specified elements
$elemMatch // at least one array element matches all conditions
$size      // array has exact number of elements

// Evaluation
$regex     // regular expression match
$expr      // use aggregation expressions in queries
$jsonSchema // validate against a JSON schema
$mod       // modulus operation

// Example: $elemMatch
db.students.find({
  grades: { $elemMatch: { subject: "math", score: { $gte: 90 } } }
})
```

### 5.2 Update Operators

```javascript
// Field
$set, $unset, $rename, $inc, $mul, $min, $max, $currentDate, $setOnInsert

// Array
$push, $pull, $pop, $addToSet, $pullAll
$each, $sort, $slice, $position  // modifiers for $push

// Bitwise
$bit

// Example: complex array update
db.posts.updateOne(
  { _id: ObjectId("...") },
  {
    $push: {
      comments: {
        $each: [{ user: "Amit", text: "Great post!" }],
        $sort: { date: -1 },
        $slice: 100  // keep only latest 100 comments
      }
    },
    $inc: { commentCount: 1 },
    $currentDate: { lastModified: true }
  }
)
```

### 5.3 Bulk Operations

Bulk operations send multiple write operations in a single network round-trip, drastically improving throughput.

```javascript
const bulk = db.products.initializeUnorderedBulkOp();  // parallel execution
// or initializeOrderedBulkOp() for sequential

bulk.insert({ name: "Widget A", price: 100 });
bulk.find({ name: "Widget B" }).updateOne({ $set: { price: 200 } });
bulk.find({ name: "Widget C" }).upsert().replaceOne({ name: "Widget C", price: 300 });
bulk.find({ name: "Discontinued" }).deleteOne();
bulk.execute();

// Modern API: bulkWrite
db.products.bulkWrite([
  { insertOne: { document: { name: "X", price: 50 } } },
  { updateMany: { filter: { status: "old" }, update: { $set: { status: "archived" } } } },
  { deleteMany: { filter: { qty: 0 } } }
], { ordered: false })
```

### 5.4 Upserts

An upsert updates a document if it exists or inserts a new one if it does not. Controlled by setting `upsert: true`.

```javascript
db.inventory.updateOne(
  { sku: "ABC123" },
  {
    $set: { price: 499, lastUpdated: new Date() },
    $setOnInsert: { createdAt: new Date(), initialStock: 100 }
  },
  { upsert: true }
)
```

`$setOnInsert` fields are applied only when a new document is inserted, not during an update.

### 5.5 findAndModify / findOneAndUpdate

Atomically finds and modifies a document, returning either the original or the updated document.

```javascript
db.counters.findOneAndUpdate(
  { _id: "order_seq" },
  { $inc: { seq: 1 } },
  { returnDocument: "after", upsert: true }
)
```

---

## 6. Replication

### Definition

Replication is the process of synchronizing data across multiple MongoDB servers (nodes) to provide high availability, data redundancy, and read scalability. MongoDB uses a replica set — a group of `mongod` instances that maintain the same data set.

### 6.1 Replica Set Architecture

- **Primary:** Receives all write operations. There is exactly one primary per replica set.
- **Secondary:** Replicates data from the primary via the oplog (operations log). Secondaries can serve read requests if configured.
- **Arbiter:** A lightweight member that participates in elections but holds no data. Used to break ties when you have an even number of data-bearing members.

**Minimum recommended:** 3 members (e.g., 1 Primary + 2 Secondaries, or 1 Primary + 1 Secondary + 1 Arbiter).

### 6.2 Oplog

The oplog (`local.oplog.rs`) is a capped collection on the primary that records all write operations. Secondaries tail the oplog to replicate changes. The oplog must be large enough to hold enough operations for secondaries to catch up if they fall behind.

### 6.3 Elections

When the primary becomes unavailable, the remaining members hold an election to choose a new primary. A member needs a majority vote to become primary. Elections typically complete within 10-12 seconds.

**Priority:** Each member can have a priority (0 to 1000). Higher priority members are preferred in elections. A member with priority 0 can never become primary (useful for analytics nodes or disaster recovery replicas).

### 6.4 Read Preferences

| Mode | Definition |
|------|-----------|
| `primary` | All reads go to the primary. Default. Guarantees strong consistency. |
| `primaryPreferred` | Reads from primary; falls back to secondary if primary unavailable. |
| `secondary` | All reads go to secondaries. Data may be slightly stale. |
| `secondaryPreferred` | Reads from secondary; falls back to primary if no secondary available. |
| `nearest` | Reads from the member with the lowest network latency. |

### 6.5 Write Concern

Write concern controls the level of acknowledgment requested from MongoDB for write operations.

```javascript
db.orders.insertOne(
  { item: "laptop", qty: 1 },
  { writeConcern: { w: "majority", j: true, wtimeout: 5000 } }
)
```

| Setting | Meaning |
|---------|---------|
| `w: 0` | No acknowledgment (fire and forget). |
| `w: 1` | Acknowledged by the primary only (default). |
| `w: "majority"` | Acknowledged by a majority of replica set members. Prevents rollback on failover. |
| `w: <n>` | Acknowledged by at least `n` members. |
| `j: true` | Data must be written to the on-disk journal before acknowledgment. |

---

## 7. Sharding

### Definition

Sharding is MongoDB's strategy for horizontal scaling. It distributes data across multiple servers (shards) so that no single machine has to store or serve all the data. Each shard holds a subset of the total data set.

### 7.1 Sharded Cluster Components

- **Shard:** Each shard is a replica set that holds a subset of the sharded data.
- **Config Servers:** A replica set of `mongod` instances that store the cluster's metadata — the mapping of chunks to shards.
- **mongos:** Query routers that direct client operations to the correct shard(s). Applications connect to `mongos`, not directly to shards.

### 7.2 Shard Key

The shard key is the field (or fields) that determines how data is distributed across shards. Choosing the right shard key is the single most important sharding decision.

```javascript
sh.shardCollection("mydb.orders", { customer_id: "hashed" })
sh.shardCollection("mydb.logs", { timestamp: 1, server_id: 1 })
```

**Shard Key Properties to Consider:**

| Property | Good Shard Key | Bad Shard Key |
|----------|---------------|---------------|
| **Cardinality** | High — many distinct values (e.g., user_id) | Low — few distinct values (e.g., status: active/inactive) |
| **Frequency** | Evenly distributed values | Hotspot — one value dominates writes (e.g., current date) |
| **Monotonicity** | Hashed or compound keys | Monotonically increasing (e.g., ObjectId, timestamp) — causes all writes to hit one shard |

### 7.3 Sharding Strategies

- **Range-based Sharding:** Divides data into contiguous ranges of shard key values. Supports efficient range queries but can cause hotspots if keys are monotonically increasing.
- **Hashed Sharding:** Hashes the shard key value to distribute data uniformly. Prevents hotspots but range queries become scatter-gather.
- **Zone Sharding (Tag-aware):** Assigns ranges of shard key values to specific shards. Useful for data locality (e.g., keep EU users' data on EU shards for compliance).

### 7.4 Chunks

A chunk is a contiguous range of shard key values assigned to a single shard. MongoDB auto-splits and auto-balances chunks across shards. Default chunk size is 128MB.

### 7.5 Targeted vs Scatter-Gather Queries

- **Targeted:** The query includes the shard key, so `mongos` routes it to a single shard. Fast and efficient.
- **Scatter-Gather (Broadcast):** The query does not include the shard key, so `mongos` must send the query to all shards and merge results. Slow at scale.

---

## 8. Transactions

### Definition

MongoDB supports multi-document ACID transactions (since version 4.0 for replica sets, 4.2 for sharded clusters). Transactions let you execute multiple read and write operations across multiple documents and collections with all-or-nothing atomicity — either all operations succeed and are committed, or none of them are applied.

### 8.1 Transaction Syntax

```javascript
const session = client.startSession();
try {
  session.startTransaction({
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" },
    readPreference: "primary"
  });

  const orders = session.getDatabase("mydb").getCollection("orders");
  const inventory = session.getDatabase("mydb").getCollection("inventory");

  orders.insertOne({ item: "laptop", qty: 1, price: 75000 }, { session });
  inventory.updateOne({ item: "laptop" }, { $inc: { stock: -1 } }, { session });

  session.commitTransaction();
} catch (error) {
  session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### 8.2 Transaction Limits and Best Practices

- Default transaction lifetime is 60 seconds. After that, it is automatically aborted.
- Transactions hold locks, so keep them short. Long-running transactions degrade performance.
- A transaction cannot write to capped collections.
- Transactions work across collections and databases within the same cluster.
- Do not use transactions as a substitute for good data modeling. If you can achieve atomicity with a single-document write (embedding), prefer that.
- The `readConcern: "snapshot"` provides a consistent point-in-time view of the data within the transaction.

---

## 9. Performance Tuning

### 9.1 Query Optimization

- Always check `explain("executionStats")` for slow queries.
- Look for `COLLSCAN` — add indexes to eliminate full collection scans.
- Keep `nReturned` close to `totalDocsExamined`. A large gap means the query examines many documents to return few.
- Use projection to return only needed fields: `db.users.find({}, { name: 1, email: 1 })`.
- Avoid `$regex` with leading wildcards (`/^abc/` uses index, `/abc/` does not).
- Use `$hint()` to force a specific index if the query planner chooses poorly.

### 9.2 Profiler

The database profiler captures detailed information about slow operations.

```javascript
// Enable profiling for queries slower than 100ms
db.setProfilingLevel(2, { slowms: 100 })

// Level 0: off, Level 1: slow ops only, Level 2: all ops

// Query the profiler
db.system.profile.find({ millis: { $gt: 200 } }).sort({ ts: -1 }).limit(5)
```

### 9.3 Connection Pooling

Use connection pooling in your application driver. Each pool maintains a set of persistent connections to avoid the overhead of establishing new connections for every operation.

```javascript
// Node.js example
const client = new MongoClient(uri, {
  maxPoolSize: 100,
  minPoolSize: 10,
  maxIdleTimeMS: 30000,
  waitQueueTimeoutMS: 5000
});
```

### 9.4 Working Set

The working set is the portion of data and indexes that your application actively uses. For best performance, the entire working set should fit in RAM. Monitor with `db.serverStatus().wiredTiger.cache`.

### 9.5 Monitoring Commands

```javascript
db.serverStatus()          // comprehensive server metrics
db.currentOp()             // currently running operations
db.stats()                 // database-level statistics
db.collection.stats()      // collection-level statistics (size, count, index sizes)
db.collection.totalIndexSize()  // total size of all indexes
db.collection.aggregate([{ $indexStats: {} }])  // per-index usage statistics

// mongotop — tracks time spent reading/writing per collection
// mongostat — real-time server stats (inserts/queries/updates per second, memory, connections)
```

---

## 10. Security

### 10.1 Authentication

Authentication verifies the identity of users connecting to the database.

- **SCRAM (Salted Challenge Response Authentication Mechanism):** Default mechanism. Uses username/password with SHA-1 or SHA-256.
- **x.509 Certificates:** Uses TLS/SSL certificates for both client and member authentication.
- **LDAP:** Enterprise-only. Integrates with external LDAP directories like Active Directory.
- **Kerberos:** Enterprise-only. Single sign-on support.

```javascript
db.createUser({
  user: "appUser",
  pwd: "securePassword123",
  roles: [
    { role: "readWrite", db: "mydb" },
    { role: "read", db: "reporting" }
  ]
})
```

### 10.2 Authorization (RBAC)

MongoDB uses Role-Based Access Control. Users are assigned roles that grant specific privileges.

**Built-in Roles:**

| Category | Roles |
|----------|-------|
| Database-level | `read`, `readWrite`, `dbAdmin`, `dbOwner`, `userAdmin` |
| Cluster-level | `clusterAdmin`, `clusterManager`, `clusterMonitor`, `hostManager` |
| All-database | `readAnyDatabase`, `readWriteAnyDatabase`, `dbAdminAnyDatabase`, `userAdminAnyDatabase` |
| Superuser | `root` (has all privileges) |
| Backup/Restore | `backup`, `restore` |

Custom roles can be created for fine-grained access control.

### 10.3 Encryption

- **In Transit:** Use TLS/SSL to encrypt all network communication between clients, mongos, and mongod instances.
- **At Rest:** WiredTiger supports encryption at rest using AES-256-CBC. Available in Enterprise edition or Atlas.
- **Client-Side Field Level Encryption (CSFLE):** Encrypts sensitive fields in the application before they reach the database. Even DBAs cannot read encrypted fields. Supports deterministic (allows equality queries) and random encryption.

### 10.4 Auditing

Enterprise feature that records database operations (authentication, authorization, DDL, DML) to a log file or syslog for compliance and forensic analysis.

### 10.5 Network Security

- Bind MongoDB to specific IP addresses (`bindIp` in config).
- Use firewalls to restrict access to MongoDB ports (default 27017).
- Enable authentication (`security.authorization: enabled`).
- Use VPC peering or private endpoints in cloud deployments.

---

## 11. Schema Validation

### Definition

Schema validation lets you enforce rules on document structure at the collection level. While MongoDB is schema-flexible, validation ensures that documents conform to a defined shape, preventing bad data from entering the database.

```javascript
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "age"],
      properties: {
        name: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        email: {
          bsonType: "string",
          pattern: "^.+@.+\\..+$",
          description: "must be a valid email"
        },
        age: {
          bsonType: "int",
          minimum: 0,
          maximum: 150,
          description: "must be an integer between 0 and 150"
        },
        status: {
          enum: ["active", "inactive", "suspended"],
          description: "must be one of the allowed values"
        },
        address: {
          bsonType: "object",
          required: ["city"],
          properties: {
            city: { bsonType: "string" },
            pin: { bsonType: "string" }
          }
        }
      }
    }
  },
  validationLevel: "strict",    // "strict" (all docs) or "moderate" (only inserts + updates to valid docs)
  validationAction: "error"     // "error" (reject) or "warn" (allow but log warning)
})
```

### Modifying Validation

```javascript
db.runCommand({
  collMod: "users",
  validator: { $jsonSchema: { /* updated schema */ } },
  validationLevel: "moderate"
})
```

---

## 12. Change Streams

### Definition

Change Streams allow applications to subscribe to real-time data changes on a collection, database, or entire deployment. They provide a reactive, event-driven interface built on top of the oplog, without the complexity of tailing the oplog directly.

```javascript
// Watch a collection
const changeStream = db.orders.watch([
  { $match: { "fullDocument.status": "shipped" } }
]);

changeStream.on("change", (change) => {
  console.log("Change event:", change.operationType);
  console.log("Document:", change.fullDocument);
});

// Operation types: insert, update, replace, delete, drop, rename, invalidate
```

### Resume Tokens

Every change event includes a `_id` field (the resume token). If the application disconnects, it can resume from where it left off by passing the token.

```javascript
const resumeToken = change._id;
const newStream = db.orders.watch([], { resumeAfter: resumeToken });
```

### Use Cases

- Real-time notifications and event-driven architectures.
- Syncing MongoDB data to Elasticsearch, Redis, or data warehouses.
- Audit logging.
- Triggering downstream workflows when data changes.

---

## 13. MongoDB Atlas & Cloud Features

### Definition

MongoDB Atlas is the fully managed cloud database service by MongoDB, Inc. It handles provisioning, patching, scaling, backups, and monitoring, available on AWS, Azure, and GCP.

### Key Atlas Features

| Feature | Description |
|---------|-------------|
| **Auto-Scaling** | Automatically scales compute and storage based on workload. |
| **Global Clusters** | Distribute data across regions for low-latency global access and compliance. |
| **Atlas Search** | Full-text search powered by Lucene, integrated into the aggregation pipeline via `$search`. |
| **Atlas Data Federation** | Query data across Atlas clusters, S3 buckets, and Atlas Data Lake from a single endpoint. |
| **Online Archive** | Automatically tier aging data to cheaper cloud object storage while keeping it queryable. |
| **Atlas Triggers** | Serverless functions (Realm/App Services) triggered by database events, scheduled times, or HTTP endpoints. |
| **Atlas Charts** | Built-in data visualization and dashboarding tool. |
| **Performance Advisor** | Recommends indexes based on slow query analysis. |
| **Serverless Instances** | Pay-per-operation pricing, auto-scales to zero. |

### Atlas Search Example

```javascript
db.movies.aggregate([
  {
    $search: {
      index: "default",
      text: {
        query: "time travel",
        path: ["title", "plot"],
        fuzzy: { maxEdits: 1 }
      }
    }
  },
  { $limit: 10 },
  { $project: { title: 1, score: { $meta: "searchScore" } } }
])
```

---

## 14. Storage Engines

### WiredTiger (Default since MongoDB 3.2)

WiredTiger is the default and recommended storage engine. It provides document-level concurrency control (locking at the document level rather than the collection or database level), compression (snappy by default, also supports zlib and zstd), and support for encryption at rest.

**Key Features:**
- Document-level locking for high write concurrency.
- Compression reduces storage footprint by 60-80%.
- Checkpoints every 60 seconds for crash recovery.
- Journal for write durability between checkpoints.
- In-memory caching — configurable via `cacheSizeGB` (default: 50% of RAM minus 1GB).

### In-Memory Engine

Enterprise-only engine that stores data entirely in memory. No disk I/O for data storage, providing predictable low-latency reads and writes. Data is not persisted and is lost on restart.

**Use Cases:** Caching layers, session stores, real-time analytics where durability is not critical.

---

## 15. Backup & Disaster Recovery

### Backup Methods

| Method | Description |
|--------|-------------|
| **mongodump / mongorestore** | Logical backup. Exports data as BSON files. Works for all deployments. Slower for large databases. |
| **File System Snapshots** | Point-in-time snapshots of the underlying storage (e.g., LVM, EBS). Fast for large datasets. Requires journaling enabled. |
| **Atlas Continuous Backup** | Automated, continuous backup with point-in-time restore (PITR). Managed by Atlas. |
| **Ops Manager / Cloud Manager** | Enterprise backup solution with scheduled snapshots and PITR for on-premise deployments. |

### Point-in-Time Recovery (PITR)

PITR allows restoring a database to any specific second within the backup window by replaying the oplog up to the desired timestamp. Critical for recovering from accidental data corruption or deletion.

### Backup Best Practices

- Always back up config servers in sharded clusters.
- Test restores regularly — a backup that cannot be restored is worthless.
- Store backups in a different region/availability zone.
- Use `--oplog` with `mongodump` to capture a point-in-time snapshot of a replica set.

---

## 16. Common Interview Questions with Answers

### Q1: Embedding vs Referencing — how do you decide?
**Answer:** The decision depends on the access pattern. Embed when data is always read together, the relationship is one-to-few, the embedded data is bounded in size, and you need atomic single-document writes. Reference when the relationship is one-to-many (unbounded), the child data is large or shared across parents, the child data changes independently and frequently, or you need to query the child data independently. In practice at scale, I use a hybrid approach — embed for hot-path reads and keep references for data that changes independently.

### Q2: How do you handle the 16MB document size limit?
**Answer:** First, design to avoid hitting it — use the subset pattern (keep recent N items embedded, move overflow to a separate collection), the bucket pattern (group time-series data into fixed-size buckets), or referencing for unbounded arrays. If you're storing files, use GridFS which automatically splits files into 255KB chunks. Monitor document sizes with `Object.bsonsize(doc)` in the shell.

### Q3: What is the aggregation pipeline and how does it differ from MapReduce?
**Answer:** The aggregation pipeline is a sequence of stages that process documents. It replaced MapReduce for most use cases because it is implemented natively in C++ (much faster), supports a rich set of operators, can leverage indexes in early stages, and is easier to optimize and debug. MapReduce is deprecated as of MongoDB 5.0 and should not be used for new development.

### Q4: Explain the ESR rule for compound indexes.
**Answer:** ESR stands for Equality, Sort, Range. When building a compound index, place fields used in equality conditions first, then fields used in sorting, then fields used in range conditions. This ordering lets MongoDB efficiently use the index prefix for exact matches, maintain sort order without an in-memory sort, and narrow the range scan over the remaining key space.

### Q5: What happens during a replica set failover?
**Answer:** When the primary becomes unavailable, secondaries detect this through heartbeats (every 2 seconds, 10-second timeout). An eligible secondary calls an election. Members vote; a candidate needs a majority. The elected secondary becomes the new primary. Total failover time is typically 10-12 seconds. During this window, writes are unavailable. Applications using the `w: "majority"` write concern will not lose acknowledged writes. Retryable writes (enabled by default in modern drivers) automatically retry writes that fail during failover.

### Q6: How do you choose a shard key?
**Answer:** A good shard key has high cardinality (many distinct values), even frequency distribution, and is not monotonically increasing. It should support the most common query patterns as a targeted query (includes shard key) is far faster than scatter-gather. I typically evaluate candidates by analyzing the query patterns, checking value distribution with aggregation, and testing with a staging cluster. Common patterns: hashed keys for uniform distribution, compound keys combining a grouping field with a high-cardinality field.

### Q7: When should you use transactions in MongoDB?
**Answer:** Use transactions when you need atomicity across multiple documents or collections — for example, transferring money between accounts, placing an order that updates both orders and inventory, or any operation where partial completion would leave the database in an inconsistent state. However, transactions should be the exception, not the rule. Good data modeling (embedding related data) often eliminates the need for transactions. Keep transactions short-lived to avoid lock contention.

### Q8: Explain read concern levels.
**Answer:**

| Level | Meaning |
|-------|---------|
| `local` | Returns data from the instance with no guarantee it has been replicated. Default for reads against the primary. |
| `available` | Similar to `local` but for sharded clusters may return orphan documents during chunk migration. |
| `majority` | Returns data that has been acknowledged by a majority of replica set members. Durable even if the primary fails. |
| `linearizable` | Guarantees that the read reflects all writes that completed before the read began. Strongest but slowest. |
| `snapshot` | Provides a consistent point-in-time view. Used within multi-document transactions. |

### Q9: How do you handle slow queries in production?
**Answer:** Enable the profiler at level 1 with an appropriate `slowms` threshold. Analyze slow queries with `explain("executionStats")`. Check for COLLSCAN, high `totalDocsExamined` relative to `nReturned`, and in-memory sorts. Add or adjust indexes using the ESR rule. Use `$hint` to force a better plan if needed. In Atlas, use the Performance Advisor for index recommendations. Monitor with `mongostat`, `mongotop`, and `db.currentOp()` for long-running operations. Use `maxTimeMS()` to set query timeouts.

### Q10: What is Client-Side Field Level Encryption (CSFLE)?
**Answer:** CSFLE encrypts sensitive fields in the application driver before the data is sent to the MongoDB server. The server never sees plaintext values. It supports two encryption types: deterministic (same input always produces the same ciphertext, allowing equality queries) and random (more secure but cannot be queried). It requires a Key Management Service (KMS) such as AWS KMS, Azure Key Vault, GCP KMS, or a local master key. Use cases include PII protection, compliance (HIPAA, GDPR), and ensuring even database administrators cannot read sensitive fields.

---

## 17. Practice Scenarios

### Scenario 1: E-Commerce Data Model

Design a data model for an e-commerce platform with users, products, orders, and reviews. Consider the following queries: get user profile, list user's orders with product details, get product with top reviews, and search products by category.

**Suggested approach:** Embed the shipping address in orders (always read together). Reference products from orders via `product_id` with extended reference (copy name and price at time of order). Use the subset pattern for product reviews (embed latest 10, keep full reviews in a separate collection). Use a polymorphic pattern for products with varying attributes by category.

### Scenario 2: Real-Time Analytics Pipeline

Build an aggregation pipeline that calculates daily revenue by product category, with a 7-day moving average, for a dashboard.

```javascript
db.orders.aggregate([
  { $match: { order_date: { $gte: ISODate("2025-01-01") }, status: "completed" } },
  { $unwind: "$items" },
  {
    $group: {
      _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$order_date" } }, category: "$items.category" },
      dailyRevenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } }
    }
  },
  { $sort: { "_id.category": 1, "_id.date": 1 } },
  {
    $setWindowFields: {
      partitionBy: "$_id.category",
      sortBy: { "_id.date": 1 },
      output: {
        movingAvg7Day: { $avg: "$dailyRevenue", window: { documents: [-6, 0] } }
      }
    }
  }
])
```

### Scenario 3: Index Optimization

Given the query pattern:
```javascript
db.logs.find({
  level: "error",
  service: "payment-gateway",
  timestamp: { $gte: ISODate("2025-01-01"), $lt: ISODate("2025-02-01") }
}).sort({ timestamp: -1 }).limit(50)
```

Design the optimal index using the ESR rule:

```javascript
// Equality: level, service
// Sort: timestamp (desc)
// Range: timestamp (already in sort position)
db.logs.createIndex({ level: 1, service: 1, timestamp: -1 })
```

Also consider a partial index if you predominantly query errors:
```javascript
db.logs.createIndex(
  { service: 1, timestamp: -1 },
  { partialFilterExpression: { level: "error" } }
)
```

### Scenario 4: Migration Strategy

You need to add a new required field `loyalty_tier` to 50 million user documents in production without downtime. Outline the approach.

**Answer:** Use a phased migration. First, update the application to handle documents with and without the field (defensive reads using `$ifNull` or default values). Then run a background batch update using `bulkWrite` with small batches (1000-5000 docs) and sleep intervals to avoid overwhelming the primary. Add schema validation with `validationLevel: "moderate"` so existing invalid docs are untouched but all new inserts must have the field. Monitor replication lag during the migration. Once all documents are updated, switch validation to `"strict"`.

---

## Quick Reference Cheat Sheet

```
mongod                          → database server daemon
mongos                          → query router for sharded clusters
mongosh                         → interactive shell (replaces legacy mongo shell)
mongodump / mongorestore        → logical backup and restore
mongostat / mongotop            → real-time monitoring tools
mongoexport / mongoimport       → JSON/CSV export and import

db.collection.find()            → query documents
db.collection.aggregate()       → run aggregation pipeline
db.collection.createIndex()     → create an index
db.collection.getIndexes()      → list all indexes
db.collection.dropIndex()       → drop an index
db.collection.explain()         → query execution plan
db.collection.stats()           → collection statistics
db.collection.watch()           → open a change stream
db.collection.bulkWrite()       → batch write operations
db.currentOp()                  → view active operations
db.killOp(opId)                 → terminate a running operation
db.setProfilingLevel()          → enable/disable query profiler
rs.status()                     → replica set status
rs.conf()                       → replica set configuration
sh.status()                     → sharding cluster status
sh.shardCollection()            → shard a collection
```

---

> **Tip:** At the 8-year experience level, interviewers expect you to talk about trade-offs, not just definitions. For every design decision, be ready to explain what you chose, what you gave up, and why it was the right call for that specific workload.
