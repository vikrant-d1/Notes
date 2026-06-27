# SQL & Node.js Interview Preparation Guide
### For 8+ Years Experience — Including Coding Round

---

## Table of Contents

1. [SQL — Core Concepts & Advanced Topics](#1-sql--core-concepts--advanced-topics)
2. [SQL — Coding Round Questions](#2-sql--coding-round-questions)
3. [Node.js — Core Concepts & Advanced Topics](#3-nodejs--core-concepts--advanced-topics)
4. [Node.js — Coding Round Questions](#4-nodejs--coding-round-questions)
5. [System Design & Architecture](#5-system-design--architecture)
6. [Behavioral & Leadership Questions](#6-behavioral--leadership-questions)
7. [Tips for the Interview Day](#7-tips-for-the-interview-day)

---

## 1. SQL — Core Concepts & Advanced Topics

### 1.1 Query Execution Order

Understanding the logical order of SQL query execution is critical at the senior level:

```
FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT
```

**Why it matters:** Interviewers expect you to explain why you can't use a column alias in `WHERE` but can in `ORDER BY`.

---

### 1.2 Joins — Deep Dive

| Join Type | Description | Use Case |
|-----------|-------------|----------|
| INNER JOIN | Returns matching rows from both tables | Most common; fetch related data |
| LEFT JOIN | All rows from the left table + matched rows from right | Find records with or without related data |
| RIGHT JOIN | All rows from the right table + matched rows from left | Rarely used; prefer LEFT JOIN |
| FULL OUTER JOIN | All rows from both tables | Data reconciliation between two sources |
| CROSS JOIN | Cartesian product of both tables | Generating combinations (e.g., sizes × colors) |
| SELF JOIN | A table joined to itself | Hierarchical data (e.g., employees & managers) |

**Interview Favorite — Self Join Example:**

```sql
-- Find employees who earn more than their manager
SELECT e.name AS employee, e.salary AS emp_salary,
       m.name AS manager, m.salary AS mgr_salary
FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;
```

---

### 1.3 Window Functions (Very Important for Senior Roles)

```sql
-- ROW_NUMBER: Assign unique sequential numbers
SELECT name, department, salary,
       ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rank
FROM employees;

-- RANK vs DENSE_RANK
-- RANK: 1, 2, 2, 4 (skips numbers)
-- DENSE_RANK: 1, 2, 2, 3 (no gaps)

-- LAG and LEAD: Access previous/next row values
SELECT month, revenue,
       LAG(revenue, 1) OVER (ORDER BY month) AS prev_month_revenue,
       revenue - LAG(revenue, 1) OVER (ORDER BY month) AS month_over_month_change
FROM monthly_sales;

-- Running totals
SELECT order_date, amount,
       SUM(amount) OVER (ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM orders;

-- NTILE: Divide rows into N buckets
SELECT name, salary,
       NTILE(4) OVER (ORDER BY salary DESC) AS salary_quartile
FROM employees;
```

---

### 1.4 Common Table Expressions (CTEs) & Recursive Queries

```sql
-- Standard CTE
WITH department_stats AS (
    SELECT department_id, AVG(salary) AS avg_salary, COUNT(*) AS emp_count
    FROM employees
    GROUP BY department_id
)
SELECT d.name, ds.avg_salary, ds.emp_count
FROM departments d
JOIN department_stats ds ON d.id = ds.department_id
WHERE ds.avg_salary > 80000;

-- Recursive CTE — Organizational hierarchy
WITH RECURSIVE org_tree AS (
    -- Base case: CEO (no manager)
    SELECT id, name, manager_id, 1 AS level
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive case: employees under each manager
    SELECT e.id, e.name, e.manager_id, ot.level + 1
    FROM employees e
    JOIN org_tree ot ON e.manager_id = ot.id
)
SELECT * FROM org_tree ORDER BY level, name;
```

---

### 1.5 Indexing & Performance Optimization

**Types of Indexes:**
- **B-Tree Index** — Default; good for equality and range queries.
- **Hash Index** — Only equality comparisons; not range-friendly.
- **Composite Index** — Multi-column; follows the leftmost prefix rule.
- **Covering Index** — Includes all columns needed by a query; avoids table lookup.
- **Partial Index** — Index on a subset of rows (PostgreSQL: `WHERE active = true`).

**Key Optimization Concepts:**
- **EXPLAIN / EXPLAIN ANALYZE** — Always analyze query plans before optimizing.
- **Avoid SELECT *** — Fetch only required columns.
- **Index selectivity** — High cardinality columns benefit more from indexing.
- **Avoid functions on indexed columns** — `WHERE YEAR(created_at) = 2024` won't use an index; use range instead.
- **Covering indexes** — If a query only reads indexed columns, it never touches the table.

```sql
-- Bad: Function on indexed column prevents index usage
SELECT * FROM orders WHERE YEAR(created_at) = 2024;

-- Good: Range query uses the index
SELECT * FROM orders WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';

-- Composite index example
CREATE INDEX idx_orders_status_date ON orders(status, created_at);
-- This index helps: WHERE status = 'shipped' AND created_at > '2024-01-01'
-- This index does NOT help: WHERE created_at > '2024-01-01' (skips leftmost column)
```

---

### 1.6 Transactions & Isolation Levels

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|----------------|------------|---------------------|--------------|
| READ UNCOMMITTED | ✅ Yes | ✅ Yes | ✅ Yes |
| READ COMMITTED | ❌ No | ✅ Yes | ✅ Yes |
| REPEATABLE READ | ❌ No | ❌ No | ✅ Yes |
| SERIALIZABLE | ❌ No | ❌ No | ❌ No |

**Key Concepts:** ACID properties, deadlocks, optimistic vs pessimistic locking, `SELECT ... FOR UPDATE`.

---

### 1.7 Advanced Topics for Senior Engineers

- **Partitioning** — Range, list, hash partitioning for large tables.
- **Materialized Views** — Pre-computed query results; refresh strategies.
- **Sharding** — Horizontal partitioning across databases; shard key selection.
- **Replication** — Master-slave, master-master; read replicas for scaling reads.
- **Query plan analysis** — Reading EXPLAIN output; understanding seq scan vs index scan.
- **Dead tuples & VACUUM** (PostgreSQL) — Table bloat and maintenance.
- **Connection pooling** — PgBouncer, ProxySQL; why it matters at scale.

---

## 2. SQL — Coding Round Questions

### Q1: Second Highest Salary

```sql
-- Method 1: Using DENSE_RANK
SELECT salary FROM (
    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
    FROM employees
) ranked
WHERE rnk = 2;

-- Method 2: Without window functions
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- Method 3: Nth highest salary (generalized)
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET N-1;  -- Replace N with desired rank
```

---

### Q2: Consecutive Login Days

```sql
-- Find users who logged in for 3+ consecutive days
WITH login_groups AS (
    SELECT user_id, login_date,
           login_date - INTERVAL '1 day' * ROW_NUMBER() OVER (
               PARTITION BY user_id ORDER BY login_date
           ) AS grp
    FROM (SELECT DISTINCT user_id, login_date::date AS login_date FROM logins) dl
)
SELECT user_id, COUNT(*) AS consecutive_days, MIN(login_date) AS start_date
FROM login_groups
GROUP BY user_id, grp
HAVING COUNT(*) >= 3
ORDER BY user_id;
```

---

### Q3: Department-wise Top 3 Salaries

```sql
SELECT department, name, salary
FROM (
    SELECT d.name AS department, e.name, e.salary,
           DENSE_RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS rnk
    FROM employees e
    JOIN departments d ON e.department_id = d.id
) ranked
WHERE rnk <= 3;
```

---

### Q4: Year-over-Year Growth

```sql
WITH yearly_revenue AS (
    SELECT EXTRACT(YEAR FROM order_date) AS year,
           SUM(amount) AS total_revenue
    FROM orders
    GROUP BY EXTRACT(YEAR FROM order_date)
)
SELECT year, total_revenue,
       LAG(total_revenue) OVER (ORDER BY year) AS prev_year_revenue,
       ROUND(
           (total_revenue - LAG(total_revenue) OVER (ORDER BY year)) * 100.0 /
           NULLIF(LAG(total_revenue) OVER (ORDER BY year), 0), 2
       ) AS yoy_growth_pct
FROM yearly_revenue
ORDER BY year;
```

---

### Q5: Find Duplicate Records

```sql
-- Find duplicates
SELECT email, COUNT(*) AS count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Delete duplicates, keeping the one with the lowest id
DELETE FROM users
WHERE id NOT IN (
    SELECT MIN(id) FROM users GROUP BY email
);
```

---

### Q6: Pivot / Cross-Tab Query

```sql
-- Pivot monthly sales by product (PostgreSQL)
SELECT product_name,
       SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 1 THEN amount ELSE 0 END) AS jan,
       SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 2 THEN amount ELSE 0 END) AS feb,
       SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 3 THEN amount ELSE 0 END) AS mar
FROM sales
GROUP BY product_name;
```

---

### Q7: Gap Analysis — Find Missing IDs

```sql
-- Find gaps in sequential IDs
SELECT a.id + 1 AS gap_start,
       (SELECT MIN(b.id) - 1 FROM orders b WHERE b.id > a.id) AS gap_end
FROM orders a
WHERE NOT EXISTS (SELECT 1 FROM orders b WHERE b.id = a.id + 1)
AND a.id < (SELECT MAX(id) FROM orders);
```

---

### Q8: Running Cumulative Percentage

```sql
SELECT category, revenue,
       SUM(revenue) OVER (ORDER BY revenue DESC) AS cumulative_revenue,
       ROUND(
           SUM(revenue) OVER (ORDER BY revenue DESC) * 100.0 /
           SUM(revenue) OVER (), 2
       ) AS cumulative_pct
FROM category_sales
ORDER BY revenue DESC;
```

---

## 3. Node.js — Core Concepts & Advanced Topics

### 3.1 Event Loop — The Heart of Node.js

The event loop has the following phases (in order):

```
   ┌───────────────────────────┐
┌─▶│        timers              │  ← setTimeout, setInterval callbacks
│  └───────────┬───────────────┘
│  ┌───────────▼───────────────┐
│  │     pending callbacks      │  ← I/O callbacks deferred from previous cycle
│  └───────────┬───────────────┘
│  ┌───────────▼───────────────┐
│  │       idle, prepare        │  ← internal use only
│  └───────────┬───────────────┘
│  ┌───────────▼───────────────┐
│  │          poll              │  ← retrieve new I/O events; execute I/O callbacks
│  └───────────┬───────────────┘
│  ┌───────────▼───────────────┐
│  │          check             │  ← setImmediate callbacks
│  └───────────┬───────────────┘
│  ┌───────────▼───────────────┐
│  │     close callbacks        │  ← socket.on('close', ...)
│  └───────────┘
│         │
│   process.nextTick() and     │  ← Microtasks execute between EVERY phase
│   Promise callbacks           │
│         │
└─────────┘
```

**Priority Order:** `process.nextTick()` > Promise (microtask) > `setTimeout` > `setImmediate`

**Interview Classic — Predict the Output:**

```javascript
console.log('1 - Start');

setTimeout(() => console.log('2 - setTimeout'), 0);

Promise.resolve().then(() => console.log('3 - Promise'));

process.nextTick(() => console.log('4 - nextTick'));

setImmediate(() => console.log('5 - setImmediate'));

console.log('6 - End');

// Output:
// 1 - Start
// 6 - End
// 4 - nextTick
// 3 - Promise
// 2 - setTimeout
// 5 - setImmediate
```

---

### 3.2 Streams (Critical for Senior-Level)

```javascript
const fs = require('fs');
const { Transform, pipeline } = require('stream');
const { promisify } = require('util');
const pipelineAsync = promisify(pipeline);

// Transform stream — process data chunks
const upperCaseTransform = new Transform({
    transform(chunk, encoding, callback) {
        this.push(chunk.toString().toUpperCase());
        callback();
    }
});

// Pipeline — proper error handling for streams
async function processFile(input, output) {
    try {
        await pipelineAsync(
            fs.createReadStream(input),
            upperCaseTransform,
            fs.createWriteStream(output)
        );
        console.log('Pipeline complete');
    } catch (err) {
        console.error('Pipeline failed:', err);
    }
}

// Backpressure handling
const readable = fs.createReadStream('large-file.csv');
const writable = fs.createWriteStream('output.csv');

readable.on('data', (chunk) => {
    const canContinue = writable.write(chunk);
    if (!canContinue) {
        readable.pause();
        writable.once('drain', () => readable.resume());
    }
});
```

**Stream Types:** Readable, Writable, Duplex (both), Transform (modify data in transit).

---

### 3.3 Cluster & Worker Threads

```javascript
// cluster.js — Multi-process (utilize all CPU cores)
const cluster = require('cluster');
const os = require('os');
const http = require('http');

if (cluster.isPrimary) {
    const numCPUs = os.cpus().length;
    console.log(`Primary ${process.pid} is running`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Restarting...`);
        cluster.fork(); // Auto-restart dead workers
    });
} else {
    http.createServer((req, res) => {
        res.writeHead(200);
        res.end(`Handled by worker ${process.pid}`);
    }).listen(8000);
}

// worker_threads — CPU-intensive tasks (true parallelism)
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
    const worker = new Worker(__filename, { workerData: { num: 40 } });
    worker.on('message', (result) => console.log(`Fibonacci result: ${result}`));
    worker.on('error', (err) => console.error(err));
} else {
    function fibonacci(n) {
        return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);
    }
    parentPort.postMessage(fibonacci(workerData.num));
}
```

**Key Difference:** `cluster` forks processes (separate memory); `worker_threads` share memory via `SharedArrayBuffer`.

---

### 3.4 Error Handling Patterns

```javascript
// 1. Express global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message
    });
});

// 2. Async wrapper to avoid try-catch in every route
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

app.get('/users/:id', asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);
    res.json(user);
}));

// 3. Custom error class
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

// 4. Uncaught exception & unhandled rejection handlers
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    process.exit(1); // Must exit — state is unreliable
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
    // Graceful shutdown
    server.close(() => process.exit(1));
});
```

---

### 3.5 Memory Management & Performance

```javascript
// Detect memory leaks
const v8 = require('v8');
const heapStats = v8.getHeapStatistics();
console.log(`Heap used: ${heapStats.used_heap_size / 1024 / 1024} MB`);
console.log(`Heap limit: ${heapStats.heap_size_limit / 1024 / 1024} MB`);

// Memory leak example — growing closures
const leakyCache = [];
function processRequest(data) {
    // This array grows forever without bounds
    leakyCache.push(data);
}

// Fix: Use LRU cache with max size
const LRU = require('lru-cache');
const cache = new LRU({ max: 500, ttl: 1000 * 60 * 5 });

// Profiling tools:
// - node --inspect app.js → Chrome DevTools
// - node --prof app.js → V8 profiler output
// - clinic.js (autocannon + clinic doctor/flame/bubbleprof)
```

---

### 3.6 Security Best Practices

- **Helmet.js** — Set security-related HTTP headers.
- **Rate Limiting** — Prevent brute force / DDoS.
- **Input Validation** — Use Joi or Zod; never trust client input.
- **SQL Injection Prevention** — Always use parameterized queries.
- **CORS** — Configure properly; never use `*` in production.
- **JWT Best Practices** — Short expiry, refresh tokens, httpOnly cookies.
- **Dependency Auditing** — `npm audit`, Snyk, Dependabot.

```javascript
// Parameterized query — SAFE
const result = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND status = $2',
    [email, 'active']
);

// String concatenation — VULNERABLE
const result = await pool.query(
    `SELECT * FROM users WHERE email = '${email}'`  // ❌ NEVER DO THIS
);
```

---

### 3.7 Design Patterns in Node.js

| Pattern | Example |
|---------|---------|
| **Singleton** | Database connection pool, Logger |
| **Factory** | Creating different payment processors |
| **Observer** | EventEmitter, pub/sub messaging |
| **Middleware** | Express middleware chain |
| **Repository** | Data access abstraction layer |
| **Circuit Breaker** | Handling external service failures |
| **CQRS** | Separate read/write models for scale |

**Circuit Breaker Example:**

```javascript
class CircuitBreaker {
    constructor(fn, options = {}) {
        this.fn = fn;
        this.failureThreshold = options.failureThreshold || 5;
        this.resetTimeout = options.resetTimeout || 30000;
        this.state = 'CLOSED'; // CLOSED → OPEN → HALF_OPEN
        this.failureCount = 0;
        this.lastFailureTime = null;
    }

    async execute(...args) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
                this.state = 'HALF_OPEN';
            } else {
                throw new Error('Circuit breaker is OPEN');
            }
        }

        try {
            const result = await this.fn(...args);
            this.onSuccess();
            return result;
        } catch (err) {
            this.onFailure();
            throw err;
        }
    }

    onSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }

    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
        }
    }
}
```

---

## 4. Node.js — Coding Round Questions

### Q1: Rate Limiter (Sliding Window)

```javascript
class SlidingWindowRateLimiter {
    constructor(windowMs, maxRequests) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        this.requests = new Map(); // key → [timestamps]
    }

    isAllowed(key) {
        const now = Date.now();
        const windowStart = now - this.windowMs;

        if (!this.requests.has(key)) {
            this.requests.set(key, []);
        }

        const timestamps = this.requests.get(key);

        // Remove expired timestamps
        while (timestamps.length > 0 && timestamps[0] <= windowStart) {
            timestamps.shift();
        }

        if (timestamps.length < this.maxRequests) {
            timestamps.push(now);
            return true;
        }

        return false;
    }
}

// Express middleware usage
function rateLimiterMiddleware(limiter) {
    return (req, res, next) => {
        const key = req.ip;
        if (limiter.isAllowed(key)) {
            next();
        } else {
            res.status(429).json({ error: 'Too many requests' });
        }
    };
}
```

---

### Q2: Promise.all — Custom Implementation

```javascript
function promiseAll(promises) {
    return new Promise((resolve, reject) => {
        if (!Array.isArray(promises)) {
            return reject(new TypeError('Argument must be an array'));
        }

        const results = [];
        let completed = 0;
        const total = promises.length;

        if (total === 0) return resolve([]);

        promises.forEach((promise, index) => {
            Promise.resolve(promise)
                .then((value) => {
                    results[index] = value;
                    completed++;
                    if (completed === total) resolve(results);
                })
                .catch(reject); // Reject on first failure
        });
    });
}

// Bonus: Promise.allSettled
function promiseAllSettled(promises) {
    return Promise.all(
        promises.map((p) =>
            Promise.resolve(p)
                .then((value) => ({ status: 'fulfilled', value }))
                .catch((reason) => ({ status: 'rejected', reason }))
        )
    );
}
```

---

### Q3: Event Emitter — Custom Implementation

```javascript
class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push({ listener, once: false });
        return this;
    }

    once(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push({ listener, once: true });
        return this;
    }

    emit(event, ...args) {
        if (!this.events[event]) return false;

        this.events[event] = this.events[event].filter((entry) => {
            entry.listener.apply(this, args);
            return !entry.once;
        });

        return true;
    }

    off(event, listener) {
        if (!this.events[event]) return this;
        this.events[event] = this.events[event].filter(
            (entry) => entry.listener !== listener
        );
        return this;
    }

    listenerCount(event) {
        return this.events[event] ? this.events[event].length : 0;
    }
}
```

---

### Q4: Async Task Queue with Concurrency Limit

```javascript
class AsyncQueue {
    constructor(concurrency = 3) {
        this.concurrency = concurrency;
        this.running = 0;
        this.queue = [];
    }

    add(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.process();
        });
    }

    async process() {
        while (this.running < this.concurrency && this.queue.length > 0) {
            const { task, resolve, reject } = this.queue.shift();
            this.running++;

            try {
                const result = await task();
                resolve(result);
            } catch (err) {
                reject(err);
            } finally {
                this.running--;
                this.process();
            }
        }
    }
}

// Usage
const queue = new AsyncQueue(2); // Max 2 concurrent tasks

const delay = (ms, val) => () =>
    new Promise((res) => setTimeout(() => res(val), ms));

queue.add(delay(1000, 'A')).then(console.log); // "A" after 1s
queue.add(delay(500, 'B')).then(console.log);  // "B" after 0.5s
queue.add(delay(300, 'C')).then(console.log);  // "C" waits, runs after "B"
```

---

### Q5: LRU Cache Implementation

```javascript
class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.cache = new Map(); // Map preserves insertion order
    }

    get(key) {
        if (!this.cache.has(key)) return -1;

        // Move to end (most recently used)
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }

    put(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.capacity) {
            // Delete least recently used (first item)
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }
}

// Usage
const cache = new LRUCache(3);
cache.put(1, 'a');
cache.put(2, 'b');
cache.put(3, 'c');
cache.get(1);       // Returns 'a', moves to end
cache.put(4, 'd');  // Evicts key 2 (least recently used)
```

---

### Q6: Debounce & Throttle

```javascript
// Debounce — execute after delay; resets on each call
function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Throttle — execute at most once per interval
function throttle(fn, interval) {
    let lastTime = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastTime >= interval) {
            lastTime = now;
            fn.apply(this, args);
        }
    };
}
```

---

### Q7: Deep Clone with Circular Reference Handling

```javascript
function deepClone(obj, seen = new WeakMap()) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof RegExp) return new RegExp(obj);

    // Handle circular references
    if (seen.has(obj)) return seen.get(obj);

    const clone = Array.isArray(obj) ? [] : {};
    seen.set(obj, clone);

    for (const key of Reflect.ownKeys(obj)) {
        clone[key] = deepClone(obj[key], seen);
    }

    return clone;
}
```

---

### Q8: REST API with Connection Pooling & Transactions

```javascript
const express = require('express');
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    user: 'admin',
    password: 'secret',
    max: 20,              // Max connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

const app = express();
app.use(express.json());

// Transaction example: Transfer money between accounts
app.post('/transfer', async (req, res) => {
    const { fromAccount, toAccount, amount } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Debit
        const debit = await client.query(
            `UPDATE accounts SET balance = balance - $1
             WHERE id = $2 AND balance >= $1 RETURNING *`,
            [amount, fromAccount]
        );

        if (debit.rows.length === 0) {
            throw new Error('Insufficient funds');
        }

        // Credit
        await client.query(
            `UPDATE accounts SET balance = balance + $1 WHERE id = $2`,
            [amount, toAccount]
        );

        // Log the transaction
        await client.query(
            `INSERT INTO transactions (from_acct, to_acct, amount, created_at)
             VALUES ($1, $2, $3, NOW())`,
            [fromAccount, toAccount, amount]
        );

        await client.query('COMMIT');
        res.json({ success: true, message: 'Transfer complete' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release(); // Always release back to pool
    }
});
```

---

## 5. System Design & Architecture

### 5.1 Topics You Must Know

- **Microservices vs Monolith** — When to use each; migration strategies.
- **Message Queues** — RabbitMQ, Kafka, SQS; pub/sub vs point-to-point.
- **Caching Strategies** — Redis/Memcached; cache-aside, write-through, write-behind.
- **Database Scaling** — Read replicas, sharding, partitioning, connection pooling.
- **API Gateway** — Rate limiting, auth, routing, load balancing.
- **Event-Driven Architecture** — Event sourcing, CQRS, eventual consistency.
- **Container Orchestration** — Docker, Kubernetes basics; health checks, scaling.
- **CI/CD Pipelines** — Automated testing, deployment strategies (blue-green, canary).
- **Observability** — Logging (ELK), metrics (Prometheus/Grafana), tracing (Jaeger).

### 5.2 Sample System Design Question: URL Shortener

**Key Components:**
1. API layer (Node.js + Express)
2. Base62 encoding for short URLs
3. PostgreSQL for URL mapping + Redis cache
4. Rate limiting per user/IP
5. Analytics (click tracking, async via message queue)
6. Horizontal scaling with load balancer

**Estimation:**
- 100M URLs/month → ~40 URLs/second (write)
- 10:1 read-to-write ratio → ~400 reads/second
- 6-character base62 → 62^6 = ~56 billion unique codes

---

## 6. Behavioral & Leadership Questions

As a senior engineer (8+ years), expect questions around:

**Technical Leadership:**
- Describe a time you made a critical architectural decision. What trade-offs did you consider?
- How do you handle technical debt? Give an example of prioritizing it.
- Tell me about a time you mentored a junior developer through a difficult problem.

**Conflict & Collaboration:**
- Describe a disagreement with a colleague about a technical approach. How was it resolved?
- How do you handle pushback when proposing a new technology or process?

**Ownership & Impact:**
- What's the most impactful project you've led? What metrics improved?
- Tell me about a production incident you managed. What was the RCA and what changed?

**Framework for Answers: STAR Method**
- **S**ituation — Set the context
- **T**ask — What was your responsibility
- **A**ction — What did you do (focus here, use "I" not "we")
- **R**esult — Quantifiable outcome

---

## 7. Tips for the Interview Day

1. **Think out loud** — Interviewers want to see your thought process, not just the final answer.
2. **Clarify before coding** — Ask about edge cases, constraints, and expected input/output.
3. **Start with brute force** — Then optimize. Showing the progression is valuable.
4. **Discuss trade-offs** — "I chose X because of Y, but the downside is Z."
5. **Time management** — Don't spend 30 minutes on one part of a multi-part question.
6. **Test your code** — Walk through with a sample input before declaring it done.
7. **Know your resume** — Be ready to go deep on any project or technology you've listed.
8. **Ask smart questions** — About team structure, tech stack, deployment processes, engineering culture.

---

## Quick Revision Checklist

| Topic | Confidence (1-5) |
|-------|:-:|
| SQL Joins & Subqueries | ☐ |
| Window Functions | ☐ |
| CTEs & Recursive Queries | ☐ |
| Indexing & Query Optimization | ☐ |
| Transactions & Isolation Levels | ☐ |
| Node.js Event Loop | ☐ |
| Streams & Backpressure | ☐ |
| Cluster & Worker Threads | ☐ |
| Error Handling Patterns | ☐ |
| Design Patterns | ☐ |
| REST API Best Practices | ☐ |
| System Design Fundamentals | ☐ |
| Security Best Practices | ☐ |

---

> **Good luck with your interviews!** Consistent practice with real coding problems and mock interviews will make the biggest difference. Focus on understanding *why* things work, not just memorizing solutions.
