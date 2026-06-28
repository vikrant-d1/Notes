# Event Sourcing in Microservices

## What is Event Sourcing?

**Event Sourcing** is a design pattern where **every change to an application's state is stored as an immutable event instead of updating the current state directly**.

Instead of storing only the latest data, Event Sourcing stores **the complete history of all changes**.

The current state of an entity can be rebuilt at any time by replaying its events.

---

# Traditional Database vs Event Sourcing

## Traditional Approach

When a customer changes their address:

```
Customer Table

Before

Name    : John
Address : Delhi

↓

UPDATE

↓

After

Name    : John
Address : Mumbai
```

The previous address is lost unless an audit log exists.

---

## Event Sourcing Approach

Instead of updating the record, every change is stored as an event.

```
CustomerCreated

↓

AddressUpdated

↓

PhoneUpdated

↓

EmailUpdated
```

Nothing is deleted or overwritten.

Every event is permanently stored.

---

# Why Do We Need Event Sourcing?

Imagine an e-commerce application.

Customer places an order.

Later:

- Payment succeeds
- Shipment starts
- Order delivered
- Order returned

With a normal database:

```
Order Status

Delivered
```

We only know the latest state.

With Event Sourcing:

```
OrderCreated

↓

PaymentCompleted

↓

OrderPacked

↓

OrderShipped

↓

OrderDelivered

↓

OrderReturned
```

The complete business history is available.

---

# How Event Sourcing Works

```
                 Client
                    |
                    V
             Order Service
                    |
          ------------------
          | Create Event    |
          ------------------
                    |
                    V
              Event Store
                    |
      ------------------------------
      |            |               |
      V            V               V
   Read Model   Analytics     Audit Logs
```

---

# Example Events

Customer places an order.

Instead of:

```sql
UPDATE orders
SET status='SHIPPED';
```

We store:

```
Event 1

OrderCreated

↓

Event 2

PaymentCompleted

↓

Event 3

OrderPacked

↓

Event 4

OrderShipped
```

---

# Event Store

Instead of storing data like this:

```
Orders Table

Order ID

Status

Customer
```

We store events.

| Event ID | Order ID | Event | Time |
|----------|----------|----------------|------------|
| 1 | 101 | OrderCreated | 10:00 |
| 2 | 101 | PaymentCompleted | 10:02 |
| 3 | 101 | OrderPacked | 10:15 |
| 4 | 101 | OrderShipped | 11:00 |

---

# Rebuilding State

Current order status is not stored directly.

Instead:

```
Replay Events

↓

OrderCreated

↓

PaymentCompleted

↓

OrderPacked

↓

OrderShipped

↓

Current State

↓

SHIPPED
```

---

# Architecture Diagram

```
                Client
                   |
                   V
             Order Service
                   |
          Create Domain Event
                   |
                   V
             Event Store
                   |
     ---------------------------------
     |               |               |
     V               V               V
 Read Database   Kafka Broker   Audit System
     |               |
     V               V
 REST APIs     Other Microservices
```

---

# Event Flow Example

Customer places an order.

```
POST /orders

↓

OrderCreated Event

↓

Event Store

↓

Kafka

↓

Inventory Service

↓

Payment Service

↓

Notification Service

↓

Read Database Updated
```

Every microservice reacts to the event independently.

---

# Event Sourcing + CQRS

These patterns are commonly used together.

```
Command

↓

Create Event

↓

Event Store

↓

Kafka

↓

Update Read Database

↓

GET Requests
```

Commands write events.

Queries read from the Read Model.

---

# Snapshot

If an entity has thousands of events:

```
OrderCreated

PaymentCompleted

Packed

Shipped

Delivered

Returned

Refunded

...
```

Replaying all events becomes slow.

Solution:

Take periodic snapshots.

```
Snapshot

↓

Replay Only New Events
```

Example:

```
Snapshot

Event #900

↓

Replay Events

901-1000
```

This greatly improves performance.

---

# Advantages

- Complete audit history.
- Easy debugging.
- Time travel (view state at any point in time).
- Easy integration with Kafka and event-driven systems.
- Supports CQRS naturally.
- Excellent traceability.
- Events are immutable.

---

# Challenges

- More complex than CRUD.
- Storage grows continuously.
- Event versioning is required as schemas evolve.
- Rebuilding state can be slow without snapshots.
- Eventual consistency with read models.

---

# Best Practices

- Events should be immutable.
- Give each event a unique ID.
- Include timestamps and metadata.
- Use snapshots for long event streams.
- Version events for backward compatibility.
- Keep event names meaningful (e.g., `OrderCreated`, not `UpdateOrder`).
- Make event consumers idempotent.

---

# Real-World Example

### Banking System

Instead of storing only the account balance:

```
Balance = ₹50,000
```

Store every transaction:

```
AccountCreated

↓

MoneyDeposited ₹20,000

↓

MoneyWithdrawn ₹5,000

↓

MoneyDeposited ₹35,000
```

Current balance is calculated by replaying the events.

This provides a complete audit trail for compliance.

---

# Event Sourcing vs Traditional CRUD

| Traditional CRUD | Event Sourcing |
|------------------|----------------|
| Stores current state | Stores every state change |
| Updates rows | Appends events |
| Limited audit history | Complete history |
| Difficult to replay history | Easy to rebuild state |
| Simpler | More complex |

---

# Event Sourcing vs Transactional Outbox

| Event Sourcing | Transactional Outbox |
|----------------|----------------------|
| Events are the source of truth | Database state is the source of truth |
| Stores every business event | Stores temporary events for publishing |
| Used to rebuild application state | Used to reliably publish messages |
| Event store is permanent | Outbox events are deleted or archived after publishing |

---

# When Should You Use Event Sourcing?

Use Event Sourcing when:

- Audit history is important.
- Financial systems (Banking, Payments).
- Order management systems.
- Healthcare applications.
- Inventory management.
- Event-driven microservices.
- Systems requiring regulatory compliance.

Avoid Event Sourcing when:

- Building a simple CRUD application.
- History is not required.
- Team is unfamiliar with event-driven architecture.
- Simplicity is more important than auditability.

---

# Interview Answer (2 Minutes)

> **Event Sourcing** is a design pattern where every change to an application's state is stored as an immutable event instead of updating the database directly. For example, instead of updating an order's status to "Shipped," the system stores events such as `OrderCreated`, `PaymentCompleted`, `OrderPacked`, and `OrderShipped`. The current state is reconstructed by replaying these events. In microservices, these events can also be published to a message broker like Kafka so that other services, such as Inventory, Payment, or Notification, can react asynchronously. Event Sourcing provides a complete audit trail, supports time travel and debugging, and works well with CQRS. However, it introduces additional complexity, requires event versioning, and often uses snapshots to improve performance.

---

# Key Interview Points

- Stores **events**, not just the latest state.
- Events are **immutable** (never updated or deleted).
- Current state is rebuilt by replaying events.
- Provides a complete audit history.
- Often used with **CQRS** and **Kafka**.
- Supports event-driven microservices.
- Uses **snapshots** for better performance.
- Best suited for banking, payments, order management, and other systems where historical changes matter.

---

# Summary

**Event Sourcing** is a pattern in which every state change is recorded as a permanent event. Instead of storing only the current state, the application stores the full sequence of events, allowing the current state to be reconstructed at any time. It improves auditability, traceability, and integration with event-driven architectures, making it a popular choice for complex microservices.