# SQL & PostgreSQL Interview Preparation Guide
### Basic → Advanced | Cross-Questions | Company-Asked | PostgreSQL-Specific

---

## Table of Contents

1. [What is SQL? Sublanguages](#1-what-is-sql-sublanguages)
2. [WHERE vs HAVING](#2-where-vs-having)
3. [Types of JOINs](#3-types-of-joins)
4. [DELETE vs TRUNCATE vs DROP](#4-delete-vs-truncate-vs-drop)
5. [Normalization: 1NF, 2NF, 3NF, BCNF](#5-normalization-1nf-2nf-3nf-bcnf)
6. [Indexes: Types, When to Use](#6-indexes-types-when-to-use)
7. [Transactions & ACID Properties](#7-transactions--acid-properties)
8. [Window Functions](#8-window-functions)
9. [CTE vs Subquery](#9-cte-vs-subquery)
10. [Subqueries: Correlated vs Non-Correlated, EXISTS vs IN](#10-subqueries-correlated-vs-non-correlated-exists-vs-in)
11. [Stored Procedures, Functions & Triggers](#11-stored-procedures-functions--triggers)
12. [Views vs Materialized Views](#12-views-vs-materialized-views)
13. [Query Execution Plan & Optimization](#13-query-execution-plan--optimization)
14. [MVCC in PostgreSQL 🐘](#14-mvcc-in-postgresql-)
15. [Table Partitioning in PostgreSQL 🐘](#15-table-partitioning-in-postgresql-)
16. [PostgreSQL Data Types: JSONB, ARRAY, UUID 🐘](#16-postgresql-data-types-jsonb-array-uuid-)
17. [Locking in PostgreSQL 🐘](#17-locking-in-postgresql-)
18. [Replication in PostgreSQL 🐘](#18-replication-in-postgresql-)
19. [pg_stat_statements & Slow Query Analysis 🐘](#19-pg_stat_statements--slow-query-analysis-)
20. [Foreign Keys & Constraints](#20-foreign-keys--constraints)

> 🐘 = PostgreSQL-specific topic

---

## BASIC LEVEL

---

## 1. What is SQL? Sublanguages

**Definition:**  
SQL (Structured Query Language) is a standard language for managing and manipulating relational databases.

**Answer:**  
SQL has 5 sublanguages:

| Sublanguage | Full Name | Commands |
|---|---|---|
| DDL | Data Definition Language | CREATE, ALTER, DROP, TRUNCATE |
| DML | Data Manipulation Language | SELECT, INSERT, UPDATE, DELETE |
| DCL | Data Control Language | GRANT, REVOKE |
| TCL | Transaction Control Language | COMMIT, ROLLBACK, SAVEPOINT |
| DQL | Data Query Language | SELECT (sometimes separate) |

```sql
-- DDL
CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100));

-- DML
INSERT INTO employees (name) VALUES ('Alice');
UPDATE employees SET name = 'Bob' WHERE id = 1;

-- TCL
BEGIN;
UPDATE accounts SET balance = balance - 500 WHERE id = 1;
COMMIT;

-- DCL
GRANT SELECT ON employees TO readonly_user;
```

**Cross-Questions:**

> **Q: Difference between DDL and DML?**  
> DDL defines structure (schema); changes are auto-committed in most DBs. DML manipulates data; changes can be rolled back within a transaction.

> **Q: Can DDL be rolled back in PostgreSQL?**  
> Yes! Unlike MySQL, PostgreSQL wraps DDL in transactions, so `DROP TABLE` inside `BEGIN...ROLLBACK` is reversible. This is a key PostgreSQL differentiator.

> **Q: What is the difference between TRUNCATE and DELETE in terms of DDL/DML classification?**  
> TRUNCATE is DDL (auto-committed in MySQL, transactional in PostgreSQL). DELETE is DML and always transactional.

**Asked at:** Google, Amazon, Microsoft, Infosys, TCS, Wipro

---

## 2. WHERE vs HAVING

**Definition:**  
WHERE filters rows before aggregation. HAVING filters groups after aggregation.

**Answer:**

| | WHERE | HAVING |
|---|---|---|
| Applied | Before GROUP BY | After GROUP BY |
| Works with aggregates | No | Yes |
| Can use column aliases | No | No (in most DBs) |
| Performance | Faster (reduces rows early) | Slower (filters after grouping) |

```sql
-- WHERE: filter rows before grouping
SELECT department, COUNT(*)
FROM employees
WHERE salary > 50000        -- applied before grouping
GROUP BY department;

-- HAVING: filter groups after aggregation
SELECT department, COUNT(*) AS cnt
FROM employees
GROUP BY department
HAVING COUNT(*) > 5;        -- applied after grouping

-- Both together
SELECT department, AVG(salary) AS avg_sal
FROM employees
WHERE active = true
GROUP BY department
HAVING AVG(salary) > 70000;
```

**Cross-Questions:**

> **Q: Can you use HAVING without GROUP BY?**  
> Yes. Without GROUP BY the entire result set is treated as one group. E.g., `HAVING COUNT(*) > 100` on the whole table is valid.

> **Q: Can WHERE use aggregate functions?**  
> No. Aggregates are computed after WHERE. `WHERE COUNT(*) > 5` throws an error — use HAVING instead.

> **Q: What is the order of execution in a SQL query?**  
> FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT

**Asked at:** Amazon, Flipkart, Walmart, Accenture, Cognizant

---

## 3. Types of JOINs

**Definition:**  
JOINs combine rows from two or more tables based on a related column.

**Answer:**

| JOIN Type | Returns |
|---|---|
| INNER JOIN | Rows matching in both tables |
| LEFT JOIN | All left rows + matched right rows (NULL if no match) |
| RIGHT JOIN | All right rows + matched left rows (NULL if no match) |
| FULL OUTER JOIN | All rows from both tables, NULLs where no match |
| CROSS JOIN | Cartesian product of both tables |
| SELF JOIN | Table joined with itself |

```sql
-- INNER JOIN
SELECT e.name, d.dept_name
FROM employees e
INNER JOIN departments d ON e.dept_id = d.id;

-- LEFT JOIN (includes employees with no department)
SELECT e.name, d.dept_name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.id;

-- FULL OUTER JOIN
SELECT e.name, d.dept_name
FROM employees e
FULL OUTER JOIN departments d ON e.dept_id = d.id;

-- SELF JOIN (find manager names)
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;

-- CROSS JOIN (all product-color combinations)
SELECT p.name, c.color
FROM products p
CROSS JOIN colors c;
```

**Cross-Questions:**

> **Q: Difference between LEFT JOIN and LEFT OUTER JOIN?**  
> They are identical. OUTER is optional syntax — `LEFT JOIN = LEFT OUTER JOIN`.

> **Q: When would you use a CROSS JOIN?**  
> For generating combinations — all possible product-color pairs, test data generation, date-dimension tables in data warehouses.

> **Q: What happens to NULL values in JOIN conditions?**  
> `NULL = NULL` is never true in SQL. Rows with NULL in join columns are excluded from INNER JOIN results. Use `IS NOT DISTINCT FROM` in PostgreSQL for NULL-safe equality.

**Asked at:** Google, Facebook, Morgan Stanley, Cognizant, TCS

---

## 4. DELETE vs TRUNCATE vs DROP

**Definition:**  
All three remove data but differ in scope, rollback capability, and performance.

**Answer:**

| | DELETE | TRUNCATE | DROP |
|---|---|---|---|
| Type | DML | DDL | DDL |
| Removes | Specific rows | All rows | Entire table |
| WHERE clause | Yes | No | No |
| Rollback | Yes | Yes (PostgreSQL) / No (MySQL) | Yes (PostgreSQL) / No (MySQL) |
| Triggers | Yes (row-level) | Statement-level only | No |
| Resets sequence | No | Yes (with RESTART IDENTITY) | N/A |
| Speed | Slow (logged) | Very fast | Fast |

```sql
-- DELETE: conditional, logged, rollbackable
DELETE FROM logs WHERE created_at < '2023-01-01';

-- TRUNCATE: all rows, fast, resets sequences
TRUNCATE TABLE sessions RESTART IDENTITY;

-- TRUNCATE with foreign key cascade
TRUNCATE TABLE orders, order_items CASCADE;

-- DROP: removes table entirely
DROP TABLE IF EXISTS temp_data;

-- PostgreSQL: TRUNCATE is transactional!
BEGIN;
TRUNCATE TABLE test_table;
ROLLBACK;  -- Works in PostgreSQL, not in MySQL
```

**Cross-Questions:**

> **Q: Does TRUNCATE fire triggers?**  
> In PostgreSQL, TRUNCATE fires statement-level triggers (BEFORE/AFTER TRUNCATE), but NOT row-level triggers since no individual rows are processed.

> **Q: Can TRUNCATE be rolled back in PostgreSQL?**  
> Yes! Unlike MySQL, PostgreSQL's TRUNCATE is transactional — it can be rolled back within `BEGIN...ROLLBACK`.

> **Q: Why is TRUNCATE faster than DELETE?**  
> TRUNCATE doesn't scan rows one by one. It deallocates the data pages directly with minimal WAL logging.

**Asked at:** TCS, Infosys, Wipro, HCL, Capgemini

---

## 5. Normalization: 1NF, 2NF, 3NF, BCNF

**Definition:**  
Normalization is the process of organizing a relational database to reduce redundancy and improve data integrity.

**Answer:**

**1NF (First Normal Form):**
- Atomic values — no repeating groups, no arrays in cells
- Each cell has a single value
- Each column has a unique name
- Order of rows doesn't matter

**2NF (Second Normal Form):**
- Must be in 1NF
- No partial dependency — non-key columns must depend on the entire composite primary key

**3NF (Third Normal Form):**
- Must be in 2NF
- No transitive dependency — non-key columns must depend only on the primary key, not on other non-key columns

**BCNF (Boyce-Codd Normal Form):**
- Stricter version of 3NF
- Every determinant must be a candidate key

```sql
-- Violates 1NF: multiple values in one cell
-- phone: "9876543210, 9123456789"  ← BAD

-- Violates 3NF: zip_code → city is a transitive dependency
CREATE TABLE orders_bad (
    order_id    INT PRIMARY KEY,
    customer_zip VARCHAR(10),
    customer_city VARCHAR(50)   -- depends on zip, not order_id!
);

-- 3NF compliant: separate the dependency
CREATE TABLE zip_codes (
    zip  VARCHAR(10) PRIMARY KEY,
    city VARCHAR(50)
);

CREATE TABLE orders (
    order_id     INT PRIMARY KEY,
    customer_zip VARCHAR(10) REFERENCES zip_codes(zip)
);
```

**Cross-Questions:**

> **Q: When would you intentionally denormalize?**  
> In read-heavy analytics, data warehouses (star/snowflake schemas), or when JOINs are a proven bottleneck. Always profile before denormalizing.

> **Q: What is the difference between 3NF and BCNF?**  
> In 3NF, a non-prime attribute can depend on another non-prime attribute IF that determinant is a candidate key. BCNF requires every determinant to be a superkey — it's strictly stronger.

> **Q: What is a star schema vs snowflake schema?**  
> Star schema has denormalized dimension tables directly connected to a fact table. Snowflake normalizes the dimension tables into sub-dimensions — more storage-efficient but slower for reads.

**Asked at:** Google, Microsoft, Adobe, Morgan Stanley, HCL

---

## INTERMEDIATE LEVEL

---

## 6. Indexes: Types, When to Use

**Definition:**  
An index is a data structure that speeds up data retrieval at the cost of additional storage and slower writes.

**Answer:**

| Index Type | Best For | Notes |
|---|---|---|
| B-Tree (default) | Equality, range, ORDER BY | General purpose |
| Hash | Equality only (`=`) | Faster for exact match, no range |
| GIN | JSONB, arrays, full-text | Multiple values per row |
| GiST | Geometric, full-text, ranges | Extensible index type |
| BRIN | Large tables with natural ordering | Very small, timestamps/sequential IDs |
| Partial | Subset of rows | Smaller, more targeted |
| Composite | Multiple columns | Leftmost prefix rule |
| Expression | Function results | Index on `LOWER(email)` |

```sql
-- Basic B-Tree index
CREATE INDEX idx_emp_salary ON employees(salary);

-- Composite index (order matters: leftmost prefix rule)
CREATE INDEX idx_emp_dept_salary ON employees(department, salary);

-- Partial index (only active users — smaller, faster)
CREATE INDEX idx_active_users ON users(email) WHERE active = true;

-- Expression index (case-insensitive search)
CREATE INDEX idx_lower_email ON users(LOWER(email));

-- GIN index for JSONB
CREATE INDEX idx_meta_gin ON products USING GIN (metadata);

-- Check if index is being used
EXPLAIN ANALYZE SELECT * FROM employees WHERE department = 'Engineering';

-- List all indexes on a table
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'employees';
```

**Cross-Questions:**

> **Q: What is the leftmost prefix rule for composite indexes?**  
> A composite index on `(a, b, c)` can be used for queries filtering on `a`, `a+b`, or `a+b+c` but NOT on `b` alone or `c` alone without `a`.

> **Q: Does PostgreSQL use an index for IS NULL queries?**  
> Yes. B-Tree indexes in PostgreSQL include NULL values, unlike some other databases (e.g., Oracle excludes NULLs from B-Tree indexes).

> **Q: What is an index-only scan?**  
> When the query only needs columns already stored in the index, PostgreSQL skips the heap entirely (visibility map permitting), making it extremely fast.

> **Q: When should you NOT create an index?**  
> Small tables (full scan is faster), heavily write-dominant workloads, low-cardinality columns (e.g., boolean), columns rarely used in WHERE/JOIN/ORDER BY.

**Asked at:** Amazon, Microsoft, Goldman Sachs, HCL, Stripe

---

## 7. Transactions & ACID Properties

**Definition:**  
A transaction is a unit of work that is either fully completed or fully rolled back. ACID ensures reliability.

**Answer:**

| Property | Meaning | Example |
|---|---|---|
| Atomicity | All operations succeed or all fail | Money transfer: debit + credit both happen or neither |
| Consistency | DB moves from one valid state to another | FK constraints always satisfied |
| Isolation | Concurrent transactions don't interfere | Two users booking the last seat |
| Durability | Committed data survives crashes | Power failure doesn't lose committed transactions |

**Isolation Levels (weakest → strongest):**

| Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|---|---|---|---|
| READ UNCOMMITTED | Possible | Possible | Possible |
| READ COMMITTED | Prevented | Possible | Possible |
| REPEATABLE READ | Prevented | Prevented | Possible |
| SERIALIZABLE | Prevented | Prevented | Prevented |

```sql
BEGIN;

SAVEPOINT before_transfer;

UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;

-- Check something went wrong
-- ROLLBACK TO SAVEPOINT before_transfer;

COMMIT;

-- Set isolation level
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SELECT * FROM inventory WHERE product_id = 42;
COMMIT;
```

**Cross-Questions:**

> **Q: What is a dirty read? Which isolation level prevents it?**  
> Reading uncommitted data from another transaction. Prevented by READ COMMITTED and above.

> **Q: What is a phantom read?**  
> A re-read of a query returns new rows inserted by another committed transaction. Only SERIALIZABLE prevents phantom reads.

> **Q: PostgreSQL's default isolation level?**  
> READ COMMITTED. Note: PostgreSQL doesn't implement READ UNCOMMITTED — it silently upgrades it to READ COMMITTED.

> **Q: What is a non-repeatable read?**  
> Reading the same row twice within a transaction and getting different values because another transaction committed an UPDATE between the two reads.

**Asked at:** Uber, Stripe, Airbnb, Razorpay, PayPal

---

## 8. Window Functions

**Definition:**  
Window functions perform calculations across a set of rows related to the current row without collapsing them into a single output row.

**Answer:**

Unlike GROUP BY aggregations, window functions retain all rows. Key syntax:  
`function() OVER (PARTITION BY col ORDER BY col ROWS BETWEEN ...)`

| Function | Description |
|---|---|
| ROW_NUMBER() | Unique sequential integer per partition |
| RANK() | Rank with gaps on ties (1,1,3) |
| DENSE_RANK() | Rank without gaps (1,1,2) |
| NTILE(n) | Divides into n buckets |
| LAG(col, n) | Value from n rows before current |
| LEAD(col, n) | Value from n rows after current |
| FIRST_VALUE() / LAST_VALUE() | First/last value in window frame |
| SUM/AVG/COUNT OVER() | Running totals, moving averages |

```sql
-- Rank employees by salary within each department
SELECT name, department, salary,
    RANK()       OVER (PARTITION BY department ORDER BY salary DESC) AS rank,
    DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dense_rank,
    ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS row_num
FROM employees;

-- Running total of orders
SELECT order_date, amount,
    SUM(amount) OVER (ORDER BY order_date) AS running_total,
    AVG(amount) OVER (ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS moving_avg_7d
FROM orders;

-- Previous row comparison (salary change)
SELECT name, salary,
    LAG(salary)  OVER (ORDER BY hire_date) AS prev_salary,
    LEAD(salary) OVER (ORDER BY hire_date) AS next_salary,
    salary - LAG(salary) OVER (ORDER BY hire_date) AS change
FROM employees;

-- Top-N per group (get top 3 earners per department)
SELECT * FROM (
    SELECT name, department, salary,
        ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn
    FROM employees
) ranked
WHERE rn <= 3;
```

**Cross-Questions:**

> **Q: Difference between RANK() and DENSE_RANK()?**  
> With values 100, 100, 90: RANK gives 1, 1, 3 (gap); DENSE_RANK gives 1, 1, 2 (no gap).

> **Q: Can window functions be used in WHERE clause?**  
> No. Window functions are evaluated after WHERE. Wrap in a subquery or CTE to filter on window results.

> **Q: What is ROWS vs RANGE in frame specification?**  
> ROWS counts physical rows; RANGE treats duplicate ORDER BY values as the same group. Default is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.

**Asked at:** Amazon, Netflix, Uber, PayPal, LinkedIn

---

## 9. CTE vs Subquery

**Definition:**  
A CTE (Common Table Expression) is a named temporary result set defined within a WITH clause, scoped to a single SQL statement.

**Answer:**

| | CTE | Subquery |
|---|---|---|
| Readability | High (named, reusable) | Low (nested inline) |
| Reusability in same query | Yes | No |
| Recursion | Yes | No |
| Performance (PostgreSQL 12+) | Inlined by default | Always inlined |
| Debugging | Easier (isolate each CTE) | Harder |

```sql
-- Basic CTE
WITH high_earners AS (
    SELECT * FROM employees WHERE salary > 80000
)
SELECT department, COUNT(*)
FROM high_earners
GROUP BY department;

-- Multiple CTEs
WITH
dept_avg AS (
    SELECT department, AVG(salary) AS avg_sal FROM employees GROUP BY department
),
above_avg AS (
    SELECT e.name, e.salary, d.avg_sal
    FROM employees e
    JOIN dept_avg d ON e.department = d.department
    WHERE e.salary > d.avg_sal
)
SELECT * FROM above_avg ORDER BY salary DESC;

-- Recursive CTE: org hierarchy
WITH RECURSIVE org AS (
    -- Anchor: top-level employees (no manager)
    SELECT id, name, manager_id, 1 AS level
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive: add direct reports
    SELECT e.id, e.name, e.manager_id, o.level + 1
    FROM employees e
    JOIN org o ON e.manager_id = o.id
)
SELECT * FROM org ORDER BY level, name;

-- Writable CTE (INSERT/UPDATE inside CTE)
WITH updated AS (
    UPDATE employees
    SET salary = salary * 1.1
    WHERE department = 'Engineering'
    RETURNING id, name, salary
)
SELECT * FROM updated;
```

**Cross-Questions:**

> **Q: Are CTEs always materialized in PostgreSQL?**  
> Before PG 12, CTEs were always materialized (optimization fence). From PG 12+, the planner can inline non-recursive, non-volatile CTEs unless you explicitly add `MATERIALIZED` keyword.

> **Q: Can you UPDATE using a CTE?**  
> Yes. CTEs can be used with INSERT, UPDATE, DELETE via writable CTEs (data-modifying CTEs) in PostgreSQL.

> **Q: When would you force CTE materialization?**  
> When the CTE result is expensive to compute and used multiple times, or when you want to prevent the planner from re-evaluating it (e.g., CTEs with RANDOM() or volatile functions).

**Asked at:** Google, LinkedIn, Twitter, Zomato, Amazon

---

## 10. Subqueries: Correlated vs Non-Correlated, EXISTS vs IN

**Definition:**  
A subquery is a query nested inside another query. Correlated subqueries reference columns from the outer query.

**Answer:**

**Non-correlated subquery:** executes once, result reused by outer query.  
**Correlated subquery:** executes once per row of outer query — can be slow on large tables.

```sql
-- Non-correlated (runs once)
SELECT name FROM employees
WHERE dept_id IN (
    SELECT id FROM departments WHERE location = 'Mumbai'
);

-- Correlated (runs once per employee row — slow)
SELECT name, salary FROM employees e
WHERE salary > (
    SELECT AVG(salary)
    FROM employees
    WHERE department = e.department  -- references outer query
);

-- Rewrite correlated subquery as window function (much faster)
SELECT name, salary
FROM (
    SELECT name, salary,
        AVG(salary) OVER (PARTITION BY department) AS dept_avg
    FROM employees
) t
WHERE salary > dept_avg;

-- EXISTS (stops at first match — efficient for large sets)
SELECT name FROM customers c
WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.customer_id = c.id
);

-- NOT EXISTS (safer than NOT IN when NULLs possible)
SELECT name FROM customers c
WHERE NOT EXISTS (
    SELECT 1 FROM orders o WHERE o.customer_id = c.id
);
```

**Cross-Questions:**

> **Q: When does IN with NULL cause issues?**  
> `col IN (1, 2, NULL)` never returns false — it returns NULL for non-matching rows. This means `NOT IN (..., NULL)` always returns an empty set! Use `NOT EXISTS` instead.

> **Q: EXISTS vs IN — which is faster?**  
> EXISTS is generally faster for large datasets as it short-circuits on first match. IN materializes the entire subquery result. But the query planner may optimize both to the same plan in modern PostgreSQL.

> **Q: How to rewrite a correlated subquery for better performance?**  
> Convert to a JOIN or use window functions. The avg-salary example above is a classic case.

**Asked at:** Amazon, Netflix, Morgan Stanley, Deutsche Bank, Goldman Sachs

---

## 11. Stored Procedures, Functions & Triggers

**Definition:**  
Server-side programmable objects that encapsulate business logic within the database.

**Answer:**

| | Function | Stored Procedure (PG 11+) | Trigger |
|---|---|---|---|
| Returns value | Yes | Optional (OUT params) | TRIGGER type |
| Use in SQL expressions | Yes | No | No |
| Transaction control | No | Yes (COMMIT/ROLLBACK inside) | No |
| Call syntax | SELECT fn() | CALL proc() | Auto-fires on events |

```sql
-- Simple SQL function
CREATE OR REPLACE FUNCTION get_salary(emp_id INT)
RETURNS NUMERIC AS $$
    SELECT salary FROM employees WHERE id = emp_id;
$$ LANGUAGE SQL;

-- PL/pgSQL function with logic
CREATE OR REPLACE FUNCTION calculate_bonus(emp_id INT)
RETURNS NUMERIC AS $$
DECLARE
    emp_salary NUMERIC;
    bonus      NUMERIC;
BEGIN
    SELECT salary INTO emp_salary FROM employees WHERE id = emp_id;

    IF emp_salary > 100000 THEN
        bonus := emp_salary * 0.20;
    ELSE
        bonus := emp_salary * 0.10;
    END IF;

    RETURN bonus;
END;
$$ LANGUAGE plpgsql;

-- Trigger function + trigger (audit log)
CREATE OR REPLACE FUNCTION log_salary_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log(emp_id, old_salary, new_salary, changed_by, changed_at)
    VALUES (OLD.id, OLD.salary, NEW.salary, current_user, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER salary_audit
AFTER UPDATE OF salary ON employees
FOR EACH ROW
WHEN (OLD.salary IS DISTINCT FROM NEW.salary)
EXECUTE FUNCTION log_salary_change();
```

**Cross-Questions:**

> **Q: Difference between BEFORE and AFTER triggers?**  
> BEFORE triggers fire before the operation — they can modify `NEW` to change the inserted/updated value or return NULL to cancel the operation. AFTER triggers fire after — useful for auditing.

> **Q: Can a trigger call another trigger (cascading)?**  
> Yes, but it's dangerous. PostgreSQL has a depth limit and cascading triggers can cause infinite loops. Always use `WHEN` condition to guard.

> **Q: What is a statement-level vs row-level trigger?**  
> Row-level (`FOR EACH ROW`) fires once per affected row — has access to OLD and NEW. Statement-level (`FOR EACH STATEMENT`) fires once per SQL statement — no OLD/NEW access.

**Asked at:** Google, Microsoft, Adobe, Salesforce, Infosys

---

## 12. Views vs Materialized Views

**Definition:**  
A view is a named SQL query stored in the database. A materialized view stores the query result physically on disk.

**Answer:**

| | View | Materialized View |
|---|---|---|
| Data stored | No (virtual) | Yes (physical) |
| Freshness | Always current | Stale until refreshed |
| Query speed | Depends on base tables | Very fast (pre-computed) |
| Refresh | N/A | Manual or scheduled |
| Index support | No | Yes |
| Storage | None | Yes |

```sql
-- Regular view (always fresh, no storage)
CREATE OR REPLACE VIEW active_employees AS
SELECT id, name, department, salary
FROM employees
WHERE active = true;

SELECT * FROM active_employees WHERE department = 'Engineering';

-- Materialized view (fast reads, needs refresh)
CREATE MATERIALIZED VIEW dept_salary_summary AS
SELECT
    department,
    COUNT(*)       AS headcount,
    AVG(salary)    AS avg_salary,
    SUM(salary)    AS total_salary
FROM employees
GROUP BY department;

-- Create index on materialized view (not possible on regular view)
CREATE INDEX ON dept_salary_summary(department);

-- Refresh options
REFRESH MATERIALIZED VIEW dept_salary_summary;                    -- locks during refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY dept_salary_summary;       -- no lock (needs unique index)
```

**Cross-Questions:**

> **Q: Can you INSERT/UPDATE through a view?**  
> Yes, but only on simple views (single table, no aggregates, no DISTINCT, no GROUP BY). Complex views require `INSTEAD OF` triggers.

> **Q: What is `REFRESH MATERIALIZED VIEW CONCURRENTLY`?**  
> Refreshes the view without blocking reads. Requires a unique index on the materialized view. Computes the new result set in the background and swaps atomically.

**Asked at:** Amazon, Google, Salesforce, Freshworks, Hotstar

---

## ADVANCED LEVEL

---

## 13. Query Execution Plan & Optimization

**Definition:**  
A query execution plan describes the steps the DB engine takes to execute a query, including scan types, join methods, and cost estimates.

**Answer:**

**Key EXPLAIN nodes:**

| Node | Meaning |
|---|---|
| Seq Scan | Full table scan (bad for large tables) |
| Index Scan | Uses index to fetch rows (random I/O) |
| Index Only Scan | Data fully from index (fastest) |
| Bitmap Heap Scan | Batches index lookups (good for many rows) |
| Hash Join | Builds hash table from smaller table |
| Merge Join | Efficient for large, pre-sorted inputs |
| Nested Loop | For small inner tables with index |

```sql
-- Basic explain (estimated plan, no execution)
EXPLAIN SELECT * FROM employees WHERE salary > 90000;

-- Full analysis with actual timing and buffer info
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT e.name, d.dept_name
FROM employees e
JOIN departments d ON e.dept_id = d.id
WHERE e.salary > 90000;

-- Update statistics so planner has accurate estimates
ANALYZE employees;

-- Update statistics for specific column with more buckets
ALTER TABLE employees ALTER COLUMN department SET STATISTICS 500;
ANALYZE employees;

-- Identify missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'employees';
```

**Optimization checklist:**
1. Check slow query log / pg_stat_statements
2. Run EXPLAIN ANALYZE
3. Look for Seq Scans on large tables → add index
4. Look for high row estimates vs actual → run ANALYZE
5. Rewrite correlated subqueries as JOINs or CTEs
6. Consider partitioning for very large tables

**Cross-Questions:**

> **Q: What does 'cost' mean in EXPLAIN output?**  
> Cost is in arbitrary planner units. Format is `startup_cost..total_cost`. Lower is better, but it's an estimate — always verify with ANALYZE.

> **Q: What is a statistics target in PostgreSQL?**  
> `ALTER TABLE t ALTER COLUMN c SET STATISTICS N` increases the histogram buckets the planner uses. Default is 100; set higher (up to 10000) for skewed distributions.

> **Q: What is a Bitmap Heap Scan?**  
> PostgreSQL first does a Bitmap Index Scan to collect qualifying row locations, then does a Bitmap Heap Scan to fetch those rows in physical order (reducing random I/O).

**Asked at:** Google, Facebook, Amazon, Atlassian, Razorpay

---

## 14. MVCC in PostgreSQL 🐘

**Definition:**  
MVCC (Multi-Version Concurrency Control) allows multiple transactions to read and write concurrently without blocking each other by keeping multiple versions of each row.

**Answer:**

PostgreSQL never overwrites data in-place. Each row version (tuple) has:
- **xmin**: transaction ID that created this version
- **xmax**: transaction ID that deleted/updated this version (0 if current)

Readers never block writers; writers never block readers. Dead row versions accumulate and need **VACUUM** to reclaim space.

**HOT updates** (Heap Only Tuple): if updated columns have no indexes and the new version fits on the same page, PostgreSQL avoids index updates — a major performance optimization.

```sql
-- Check dead tuple accumulation
SELECT
    relname,
    n_live_tup,
    n_dead_tup,
    ROUND(n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0) * 100, 1) AS dead_pct,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- Manual vacuum
VACUUM ANALYZE employees;

-- Aggressive vacuum (reclaims space to OS) — locks table!
VACUUM FULL employees;

-- Check transaction ID wraparound risk
SELECT datname, age(datfrozenxid) AS xid_age
FROM pg_database
ORDER BY age(datfrozenxid) DESC;
```

**Cross-Questions:**

> **Q: What is table bloat and how to fix it?**  
> Dead tuples cause bloat. `VACUUM` reclaims space for reuse (same file). `VACUUM FULL` rewrites the file but takes an exclusive lock. `pg_repack` does online defrag without locking.

> **Q: Why can't VACUUM remove all dead tuples?**  
> If any transaction is still older than the row's xmax (long-running transactions or idle-in-transaction connections), VACUUM cannot remove those dead rows.

> **Q: What is transaction ID wraparound?**  
> PostgreSQL uses 32-bit transaction IDs (4B limit). When they wrap around, old rows could become "in the future." PostgreSQL has safety mechanisms and alerts via `age(datfrozenxid)`. Autovacuum with `FREEZE` prevents this.

**Asked at:** Amazon, Google, Cred, Groww, Stripe

---

## 15. Table Partitioning in PostgreSQL 🐘

**Definition:**  
Partitioning splits a large logical table into smaller physical tables (partitions), improving query performance and manageability.

**Answer:**

PostgreSQL supports 3 partitioning strategies (declarative, PG 10+):

| Strategy | Best For | Example |
|---|---|---|
| RANGE | Date ranges, numeric ranges | Monthly orders, yearly logs |
| LIST | Discrete known values | Country, status, region |
| HASH | Even distribution | User IDs, order IDs |

**Benefits:** partition pruning, faster vacuums, bulk deletes by dropping partitions, index locality.

```sql
-- Range partitioning by month
CREATE TABLE orders (
    id         BIGSERIAL,
    created_at TIMESTAMPTZ NOT NULL,
    amount     NUMERIC,
    status     TEXT
) PARTITION BY RANGE (created_at);

-- Create partitions
CREATE TABLE orders_2024_01 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE orders_2024_02 PARTITION OF orders
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Default partition (catches everything else)
CREATE TABLE orders_default PARTITION OF orders DEFAULT;

-- List partitioning by region
CREATE TABLE sales (
    id     BIGSERIAL,
    region TEXT NOT NULL,
    amount NUMERIC
) PARTITION BY LIST (region);

CREATE TABLE sales_india    PARTITION OF sales FOR VALUES IN ('IN', 'INDIA');
CREATE TABLE sales_us       PARTITION OF sales FOR VALUES IN ('US', 'USA');
CREATE TABLE sales_others   PARTITION OF sales DEFAULT;

-- Verify partition pruning
EXPLAIN SELECT * FROM orders
WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01';
-- → Only scans orders_2024_01

-- Drop a partition (instant bulk delete — much faster than DELETE)
DROP TABLE orders_2024_01;
```

**Cross-Questions:**

> **Q: What is partition pruning?**  
> The planner eliminates partitions that can't contain rows matching the WHERE clause. Enabled with `enable_partition_pruning=on` (default in PG 11+).

> **Q: Can you create a global index across all partitions in PostgreSQL?**  
> No. PostgreSQL does not support global indexes spanning all partitions. Each partition has its own local index. This is unlike Oracle, which does support global indexes.

> **Q: Sub-partitioning?**  
> Yes. A partition can itself be partitioned (partition of a partition). For example, partition by year, then sub-partition each year by region.

**Asked at:** Netflix, Hotstar, Swiggy, Meesho, Amazon

---

## 16. PostgreSQL Data Types: JSONB, ARRAY, UUID 🐘

**Definition:**  
PostgreSQL offers rich native types beyond standard SQL including binary JSON, arrays, UUIDs, and key-value stores.

**Answer:**

| Type | Description | Index |
|---|---|---|
| JSONB | Binary JSON — indexed, queryable | GIN |
| JSON | Text JSON — preserves whitespace | None |
| ARRAY | Native arrays of any type | GIN |
| UUID | 128-bit universally unique ID | B-Tree |
| hstore | Key-value pairs | GIN, GiST |
| TSVECTOR | Full-text search document | GIN, GiST |

**JSONB operators:**

| Operator | Meaning |
|---|---|
| `->` | Get JSON field (returns JSONB) |
| `->>` | Get JSON field (returns text) |
| `@>` | Contains |
| `<@` | Is contained by |
| `?` | Key exists |
| `?|` | Any key exists |
| `?&` | All keys exist |

```sql
-- JSONB with GIN index
CREATE TABLE products (
    id       SERIAL PRIMARY KEY,
    name     TEXT,
    metadata JSONB
);

CREATE INDEX idx_meta_gin ON products USING GIN (metadata);

-- Query JSONB
SELECT * FROM products
WHERE metadata @> '{"color": "red", "available": true}';

SELECT metadata->>'price' AS price FROM products
WHERE metadata ? 'discount';

-- ARRAY usage
CREATE TABLE posts (
    id   SERIAL PRIMARY KEY,
    title TEXT,
    tags TEXT[]
);

SELECT * FROM posts WHERE 'postgresql' = ANY(tags);
SELECT * FROM posts WHERE tags @> ARRAY['sql', 'postgresql'];

-- UUID primary key
CREATE TABLE users (
    id    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL
);

-- Full text search
SELECT * FROM articles
WHERE to_tsvector('english', content) @@ to_tsquery('postgresql & index');
```

**Cross-Questions:**

> **Q: JSONB vs JSON — which to use?**  
> JSONB 99% of the time. It's stored in decomposed binary form, supports indexing with GIN, and operators like `@>`, `?`, `?|`. Use JSON only if you need exact text preservation (whitespace, key order).

> **Q: What is the `->` vs `->>` operator for JSONB?**  
> `->` returns JSONB value; `->>` returns text. E.g., `metadata->'price'` returns JSONB `42`, while `metadata->>'price'` returns text `"42"`.

> **Q: Why use UUID over SERIAL for primary keys?**  
> UUIDs are globally unique — safe for distributed systems, merging databases, and exposing IDs in URLs. SERIAL is simpler and smaller (4/8 bytes) but predictable and not distributed-safe.

**Asked at:** Stripe, Curefit, Dunzo, Clevertap, BrowserStack

---

## 17. Locking in PostgreSQL 🐘

**Definition:**  
PostgreSQL has a multi-layered locking system to manage concurrent access while maximizing throughput.

**Answer:**

**Row-level locks:**

| Lock Mode | Conflicts With | Use Case |
|---|---|---|
| FOR UPDATE | All except FOR KEY SHARE | Update/delete the row |
| FOR NO KEY UPDATE | FOR UPDATE, FOR SHARE | Update non-key columns |
| FOR SHARE | FOR UPDATE, FOR NO KEY UPDATE | Read and prevent updates |
| FOR KEY SHARE | FOR UPDATE only | FK checks |

**Advisory locks:** Application-level cooperative locks — the database doesn't enforce them, your application logic does.

```sql
-- Pessimistic locking: select for update
BEGIN;
SELECT * FROM inventory WHERE product_id = 42 FOR UPDATE;
-- Only one transaction holds this lock
UPDATE inventory SET qty = qty - 1 WHERE product_id = 42;
COMMIT;

-- SKIP LOCKED: perfect for job queues
SELECT * FROM job_queue
WHERE status = 'pending'
ORDER BY created_at
LIMIT 1
FOR UPDATE SKIP LOCKED;

-- NOWAIT: fail immediately if lock unavailable
SELECT * FROM orders WHERE id = 123 FOR UPDATE NOWAIT;

-- Advisory lock (distributed lock pattern)
SELECT pg_try_advisory_lock(hashtext('my-critical-section'));  -- returns boolean
-- do critical work...
SELECT pg_advisory_unlock(hashtext('my-critical-section'));

-- Monitor current locks
SELECT
    pid,
    relation::regclass AS table_name,
    mode,
    granted,
    pg_blocking_pids(pid) AS blocked_by
FROM pg_locks
WHERE relation IS NOT NULL;
```

**Cross-Questions:**

> **Q: How do you prevent deadlocks?**  
> Always acquire locks in a consistent order across transactions. Use `FOR UPDATE NOWAIT` to fail fast instead of waiting. Monitor `pg_stat_activity` for long-running transactions.

> **Q: What does SKIP LOCKED do?**  
> `SELECT...FOR UPDATE SKIP LOCKED` skips rows already locked by other transactions — perfect for job queues where multiple workers should claim different tasks without contention.

> **Q: What is ACCESS EXCLUSIVE lock?**  
> The most restrictive table-level lock. Acquired by ALTER TABLE, DROP TABLE, VACUUM FULL. Blocks all other operations including reads.

**Asked at:** Uber, Ola, CRED, PhonePe, Razorpay

---

## 18. Replication in PostgreSQL 🐘

**Definition:**  
Replication copies data from a primary to one or more standby servers for high availability and read scaling.

**Answer:**

| | Streaming (Physical) | Logical |
|---|---|---|
| Unit of replication | WAL bytes | Rows/changes |
| Version requirement | Same major version | Can differ (PG 10+) |
| Replica usable for reads | Yes (Hot Standby) | Yes |
| Replicate specific tables | No | Yes |
| Supports zero-downtime upgrades | No | Yes |
| Performance overhead | Low | Medium |

```sql
-- Logical replication setup

-- On PRIMARY: create publication
CREATE PUBLICATION my_pub FOR TABLE orders, users, products;

-- Or publish all tables
CREATE PUBLICATION my_pub FOR ALL TABLES;

-- On REPLICA: subscribe
CREATE SUBSCRIPTION my_sub
    CONNECTION 'host=primary_host dbname=mydb user=replicator password=secret'
    PUBLICATION my_pub;

-- Monitor replication lag on primary
SELECT
    client_addr,
    application_name,
    state,
    sync_state,
    pg_wal_lsn_diff(sent_lsn, replay_lsn)  AS replay_lag_bytes,
    replay_lag
FROM pg_stat_replication;

-- Monitor on replica
SELECT
    status,
    received_lsn,
    latest_end_lsn,
    latest_end_time
FROM pg_stat_wal_receiver;
```

**Cross-Questions:**

> **Q: What is WAL (Write-Ahead Log)?**  
> WAL is a transaction log where every change is written before being applied to data files. It ensures durability and crash recovery, and is the basis for both streaming and logical replication.

> **Q: What is `synchronous_commit = off`?**  
> Transactions return success before WAL is flushed to disk. Risks losing last few transactions on crash but can reduce write latency by 10–30x. Not the same as asynchronous replication — data is still replicated; only disk flush timing changes.

> **Q: What is pg_basebackup used for?**  
> It creates a base backup of a running PostgreSQL server — used to initialize a physical standby replica. It streams the cluster data directory over the replication protocol.

**Asked at:** Amazon, Hotstar, Razorpay, Zepto, Freshworks

---

## 19. pg_stat_statements & Slow Query Analysis 🐘

**Definition:**  
`pg_stat_statements` is a PostgreSQL extension that tracks execution statistics of all SQL statements executed on the server.

**Answer:**

Enable in `postgresql.conf`:
```
shared_preload_libraries = 'pg_stat_statements'
```

Key columns: `mean_exec_time`, `calls`, `total_exec_time`, `rows`, `stddev_exec_time`

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top 10 slowest queries by average time
SELECT
    ROUND(mean_exec_time::numeric, 2)  AS avg_ms,
    ROUND(total_exec_time::numeric, 2) AS total_ms,
    calls,
    rows,
    LEFT(query, 120) AS query_snippet
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Most called queries (high frequency)
SELECT calls, ROUND(mean_exec_time::numeric, 2) AS avg_ms, LEFT(query, 100) AS q
FROM pg_stat_statements
ORDER BY calls DESC LIMIT 10;

-- High-variance queries (sometimes slow — hard to catch)
SELECT
    calls,
    ROUND(mean_exec_time::numeric, 2) AS avg_ms,
    ROUND(stddev_exec_time::numeric, 2) AS stddev_ms,
    LEFT(query, 100) AS q
FROM pg_stat_statements
WHERE calls > 100
ORDER BY stddev_exec_time DESC LIMIT 10;

-- Reset stats
SELECT pg_stat_statements_reset();

-- Log slow queries in postgresql.conf
-- log_min_duration_statement = 1000  (log queries > 1 second)
```

**Cross-Questions:**

> **Q: What is auto_explain?**  
> A PostgreSQL module that automatically logs EXPLAIN ANALYZE output for queries exceeding a threshold (`auto_explain.log_min_duration`). Invaluable for catching slow queries in production without manual intervention.

> **Q: What does `log_min_duration_statement` do?**  
> Logs any query taking longer than N milliseconds. Set to `1000` to log queries > 1 second. Set to `0` to log all queries (very verbose, only for debugging).

**Asked at:** Razorpay, PayU, BrowserStack, Freshworks, Zepto

---

## 20. Foreign Keys & Constraints

**Definition:**  
Constraints enforce data integrity rules at the database level, guaranteeing correctness regardless of application logic.

**Answer:**

| Constraint | Purpose |
|---|---|
| PRIMARY KEY | Unique + NOT NULL identifier |
| FOREIGN KEY | Referential integrity between tables |
| UNIQUE | No duplicate values in column(s) |
| NOT NULL | Column cannot be empty |
| CHECK | Custom boolean condition |
| EXCLUDE | Generalized constraint (PostgreSQL) |

```sql
CREATE TABLE orders (
    id          BIGSERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount      NUMERIC CHECK (amount > 0),
    status      TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'cancelled')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite unique constraint
ALTER TABLE order_items
ADD CONSTRAINT uq_order_product UNIQUE (order_id, product_id);

-- Deferrable foreign key (useful for bulk inserts)
ALTER TABLE order_items
ADD CONSTRAINT fk_order
FOREIGN KEY (order_id) REFERENCES orders(id)
DEFERRABLE INITIALLY DEFERRED;

-- PostgreSQL EXCLUDE constraint (no overlapping date ranges)
CREATE TABLE reservations (
    room_id  INT,
    period   TSTZRANGE,
    EXCLUDE USING GIST (room_id WITH =, period WITH &&)
);

-- Disable FK checks temporarily (bulk load)
SET session_replication_role = 'replica';  -- disables FK triggers
-- ... bulk insert ...
SET session_replication_role = 'origin';
```

**Cross-Questions:**

> **Q: ON DELETE CASCADE vs ON DELETE SET NULL vs ON DELETE RESTRICT?**  
> CASCADE deletes child rows when parent is deleted. SET NULL sets FK column to NULL. RESTRICT (default) prevents deletion if child rows exist. SET DEFAULT sets FK to the column's default value.

> **Q: Why might you disable foreign keys during bulk load?**  
> FK checks fire on every INSERT, causing significant overhead during large data loads. Disabling them, bulk loading, then re-enabling and validating is a common pattern for ETL pipelines.

> **Q: What is a deferrable constraint?**  
> A constraint marked `DEFERRABLE INITIALLY DEFERRED` is checked at COMMIT time instead of row-by-row. Useful for inserting mutually referencing rows or circular FKs.

**Asked at:** Amazon, Google, Stripe, Atlassian, Salesforce

---

## Quick Reference: SQL Execution Order

```
FROM          →  identify source tables
JOIN          →  combine tables
WHERE         →  filter rows (before aggregation)
GROUP BY      →  group rows
HAVING        →  filter groups (after aggregation)
SELECT        →  compute output columns
DISTINCT      →  remove duplicates
ORDER BY      →  sort results
LIMIT/OFFSET  →  paginate results
```

---

## Quick Reference: PostgreSQL-Specific Features

| Feature | When to Use |
|---|---|
| JSONB + GIN index | Flexible schema, semi-structured data |
| Partitioning | Tables > 100M rows, time-series data |
| Logical replication | Zero-downtime major upgrades, selective replication |
| Advisory locks | Distributed locking without extra infrastructure |
| SKIP LOCKED | Job queues with multiple workers |
| Recursive CTE | Tree/graph traversal (org charts, file paths) |
| EXCLUDE constraint | No-overlap constraints (room booking, date ranges) |
| pg_stat_statements | Production slow query identification |
| VACUUM / autovacuum | MVCC dead tuple cleanup |
| MATERIALIZED VIEW | Pre-computed expensive aggregations |

---

*Study tip: For each topic, practice explaining the definition in one sentence, then give a real-world scenario where it matters, then write the SQL from memory.*
