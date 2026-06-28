# CQRS (Command Query Responsibility Segregation) Pattern

## What is CQRS?

**CQRS (Command Query Responsibility Segregation)** is a design pattern that separates **write operations (Commands)** from **read operations (Queries)**.

Instead of using the same model and database for both reading and writing, CQRS allows each to have its own model, database, and optimization strategy.

- **Command** → Changes data (Create, Update, Delete)
- **Query** → Reads data (GET operations)

---

# Why Do We Need CQRS?

Consider an E-commerce application.

Users perform two different types of operations:

### Write Operations

```
Create Order

Update Order

Cancel Order
```

### Read Operations

```
View Order

Search Orders

Generate Reports
```

Using the same database for both reads and writes can become a bottleneck.

Problems:

- Read queries become slow.
- Heavy reporting affects write performance.
- Difficult to scale.
- Complex SQL joins.

CQRS separates these responsibilities.

---

# Traditional Architecture

```
               Client
                  |
                  V
            Application
                  |
                  V
           Single Database
        (Read + Write Together)
```

Everything goes through one database.

---

# CQRS Architecture

```
                    Client
                       |
            -----------------------
            |                     |
            V                     V
      Command API           Query API
            |                     |
            V                     V
      Write Database        Read Database
            |
            V
      Event Bus (Kafka/RabbitMQ)
            |
            V
      Read Model Updater
            |
            V
       Read Database
```

---

# How CQRS Works

## Command Side (Write)

Handles:

- Create
- Update
- Delete

Example:

```
Create Order
```

Flow:

```
Client

↓

Command API

↓

Order Service

↓

Write Database
```

---

## Query Side (Read)

Handles:

```
Get Order

Search Orders

Dashboard

Reports
```

Flow:

```
Client

↓

Query API

↓

Read Database
```

No business logic modifies data here.

---

# Step-by-Step Example

### Step 1

Customer places an order.

```
POST /orders
```

---

### Step 2

Command Service

```
Validate

↓

Save Order

↓

Publish Event
```

---

### Step 3

Event Published

```
OrderCreated
```

---

### Step 4

Read Model Updated

```
Read Database

↓

New Order Available
```

---

### Step 5

Customer requests order history.

```
GET /orders
```

The request goes directly to the Read Database.

---

# Architecture Diagram

```
                  Client
                     |
         -------------------------
         |                       |
         V                       V
    Command API             Query API
         |                       |
         V                       V
  Command Service         Read Service
         |                       |
         V                       |
   Write Database                |
         |                       |
         | Publish Event         |
         V                       |
     Kafka / RabbitMQ            |
         |                       |
         V                       |
   Read Model Updater -----------+
         |
         V
    Read Database
```

---

# Example

### Write Database

```
Orders

Customers

Payments
```

Optimized for:

- Inserts
- Updates
- Transactions

---

### Read Database

```
Dashboard

Reports

Search

Analytics
```

Optimized for:

- Fast reads
- Denormalized data
- Indexes

---

# Event Flow

```
Customer

↓

Create Order

↓

Write Database

↓

OrderCreated Event

↓

Kafka

↓

Read Database Updated

↓

Customer Reads Order
```

---

# Read Model Example

Instead of joining multiple tables:

```
Orders

Customers

Products

Payments
```

The read database stores:

```
Order Summary

Customer Name

Product Name

Payment Status

Shipping Status
```

One simple query retrieves everything.

---

# Benefits

- Independent scaling of reads and writes.
- Faster read performance.
- Simpler query models.
- Supports Event Sourcing.
- Better separation of responsibilities.
- Optimized databases for different workloads.

---

# Challenges

- Increased architectural complexity.
- Eventual consistency between read and write databases.
- More infrastructure to maintain.
- Event handling and synchronization required.
- Harder debugging.

---

# CQRS with Event Sourcing

CQRS is often used with **Event Sourcing**.

```
Command

↓

Store Event

↓

Kafka

↓

Update Read Database
```

Instead of storing only the latest state, every state change is stored as an event.

---

# Real-World Example

### Amazon

Write Side:

```
Place Order

Cancel Order

Update Address
```

Read Side:

```
Order History

Recommendations

Dashboard

Tracking
```

Millions of users may browse products (reads) while far fewer place orders (writes). CQRS allows each workload to scale independently.

---

# CQRS vs Traditional CRUD

| Traditional CRUD | CQRS |
|------------------|-------|
| Same model for read and write | Separate models |
| One database | Separate read and write databases (optional) |
| Simple architecture | More complex architecture |
| Difficult to optimize | Optimized independently |
| Limited scalability | High scalability |

---

# CQRS vs Event Sourcing

| CQRS | Event Sourcing |
|------|----------------|
| Separates reads and writes | Stores every state change as an event |
| Can work without Event Sourcing | Often used with CQRS |
| Focuses on scalability | Focuses on auditability and history |

---

# When Should You Use CQRS?

Use CQRS when:

- Read traffic is much higher than write traffic.
- Complex reporting queries impact performance.
- Read and write workloads need different scaling.
- Building event-driven microservices.
- Large enterprise applications.
- High-performance systems.

Avoid CQRS for:

- Small CRUD applications.
- Simple REST APIs.
- Systems with low traffic.

---

# Interview Answer (2 Minutes)

> **CQRS (Command Query Responsibility Segregation)** is a design pattern that separates write operations from read operations. Commands handle creating, updating, or deleting data, while queries are responsible only for reading data. Each side can use its own model and even its own database, allowing them to be optimized and scaled independently. In many event-driven architectures, the command side publishes events after successful writes, and those events update the read model asynchronously. This introduces **eventual consistency**, but provides better scalability, improved read performance, and cleaner separation of responsibilities. CQRS is commonly used in large-scale systems with heavy read traffic and is often combined with Event Sourcing.

---

# Key Interview Points

- CQRS = **Command Query Responsibility Segregation**.
- Separates write operations from read operations.
- Commands modify data.
- Queries only retrieve data.
- Read and write databases can be different.
- Supports independent scaling.
- Often used with Kafka, RabbitMQ, and Event Sourcing.
- Read model is eventually consistent with the write model.
- Best suited for high-scale, event-driven systems.

---

# Summary

The **CQRS Pattern** separates the responsibilities of reading and writing data into independent components. This enables better scalability, faster query performance, and cleaner architecture, especially in microservices and event-driven systems. While it adds complexity and introduces eventual consistency, it is highly effective for applications with heavy read workloads and complex business logic.