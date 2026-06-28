# Polling Publisher Pattern

## What is the Polling Publisher Pattern?

The **Polling Publisher Pattern** is a messaging pattern commonly used with the **Transactional Outbox Pattern**.

Instead of publishing events directly to a message broker after a database transaction, a **background worker periodically polls the Outbox table**, publishes pending events to the message broker (Kafka, RabbitMQ, AWS SQS, etc.), and marks them as processed.

It ensures **reliable event delivery** even if the message broker is temporarily unavailable.

---

# Why Do We Need It?

Suppose an **Order Service** creates an order.

### Without Polling Publisher

```
Save Order

↓

Publish Event to Kafka
```

If Kafka is down:

```
Order Saved ✅

Kafka Publish Failed ❌
```

The event is lost, and downstream services (Inventory, Payment, Notification) never receive it.

---

### With Polling Publisher

```
Save Order

↓

Save Event to Outbox Table

↓

Background Worker Polls Outbox

↓

Publish Event

↓

Mark Event as Published
```

Even if Kafka is unavailable, the event remains in the Outbox table until it is successfully published.

---

# How It Works

```
                 Client
                    |
                    V
             Order Service
                    |
        -------------------------
        | Database Transaction |
        -------------------------
        | Save Order           |
        | Save Outbox Event    |
        -------------------------
                    |
                 COMMIT
                    |
                    V
             Outbox Table
                    |
       Polling Publisher (Every 5 sec)
                    |
                    V
           Kafka / RabbitMQ
                    |
                    V
      Inventory / Payment / Notification
```

---

# Step-by-Step Flow

## Step 1: Client Creates Order

```
POST /orders
```

---

## Step 2: Start Transaction

```
BEGIN TRANSACTION
```

---

## Step 3: Save Order

```
Orders Table

Order #101
```

---

## Step 4: Save Event

```
Outbox Table

Event: OrderCreated

Status: PENDING
```

---

## Step 5: Commit Transaction

```
COMMIT
```

Now both the order and event are safely stored.

---

## Step 6: Polling Publisher Starts

Every few seconds:

```sql
SELECT *
FROM outbox_events
WHERE status = 'PENDING'
ORDER BY created_at
LIMIT 100;
```

---

## Step 7: Publish Event

```
Kafka

Topic:

OrderCreated
```

---

## Step 8: Update Status

```sql
UPDATE outbox_events
SET status='PUBLISHED',
    processed_at=NOW()
WHERE id=101;
```

---

# Architecture Diagram

```
                  Client
                     |
                     V
              Order Service
                     |
         -------------------------
         | Database Transaction |
         -------------------------
         | Orders Table         |
         | Outbox Table         |
         -------------------------
                     |
                  COMMIT
                     |
                     V
              Outbox Table
                     |
        Polling Publisher Worker
                     |
                     V
             Kafka / RabbitMQ
                     |
      -------------------------------
      |              |              |
      V              V              V
 Inventory      Payment      Notification
```

---

# Example Outbox Table

| ID | Event Type | Status | Created At |
|----|------------|---------|------------|
| 1 | OrderCreated | PENDING | 10:00 AM |
| 2 | PaymentCompleted | PENDING | 10:01 AM |
| 3 | OrderCancelled | PUBLISHED | 09:50 AM |

The polling publisher only processes events with:

```
status = PENDING
```

---

# Polling Interval

The publisher runs periodically.

Example:

```
Every 2 seconds

Every 5 seconds

Every 10 seconds
```

Choosing the interval depends on:

- Event volume
- Acceptable latency
- Database load

---

# Failure Scenario

Suppose Kafka is unavailable.

```
Polling Publisher

↓

Publish Failed
```

The event remains:

```
Status = PENDING
```

On the next polling cycle:

```
Retry

↓

Kafka Available

↓

Published Successfully

↓

Status = PUBLISHED
```

No event is lost.

---

# Duplicate Event Handling

Sometimes:

```
Publish Success

↓

Database Update Failed
```

The event remains marked as `PENDING`.

The next polling cycle republishes the event.

Therefore:

**Consumers must be idempotent.**

Example:

```
Event ID

OrderCreated-101
```

If already processed:

```
Ignore Duplicate
```

---

# Polling Publisher vs Change Data Capture (CDC)

| Polling Publisher | CDC (Debezium) |
|-------------------|----------------|
| Polls database periodically | Reads database transaction log |
| Easier to implement | More complex setup |
| Additional database queries | Minimal database impact |
| Slight publishing delay | Near real-time publishing |
| Good for small and medium systems | Better for high-throughput systems |

---

# Advantages

- Reliable event delivery
- Simple to implement
- Automatic retry support
- Prevents lost events
- Supports eventual consistency
- No distributed transactions (2PC)

---

# Disadvantages

- Continuous database polling
- Additional database load
- Slight delay between transaction and event publishing
- Consumers must handle duplicate events
- Background worker needs monitoring

---

# Best Practices

- Poll only `PENDING` events.
- Process events in batches (e.g., 100–500 records).
- Add indexes on `status` and `created_at`.
- Use exponential backoff for retries.
- Archive or delete processed events periodically.
- Include a unique event ID.
- Design consumers to be idempotent.

---

# Real-World Example

### E-commerce Order Processing

```
Customer Places Order

↓

Orders Table Updated

↓

Outbox Table Updated

↓

Polling Publisher

↓

Kafka

↓

Inventory Service

↓

Payment Service

↓

Notification Service
```

If Kafka is temporarily down, the Polling Publisher retries later until the event is successfully published.

---

# Polling Publisher vs Direct Publish

| Direct Publish | Polling Publisher |
|----------------|-------------------|
| Publishes immediately | Publishes asynchronously |
| Event may be lost | Reliable delivery |
| No retry mechanism | Automatic retries |
| Tight coupling to broker | Decoupled from broker |
| Risk of inconsistent state | Eventual consistency |

---

# Interview Answer (2 Minutes)

> The **Polling Publisher Pattern** is commonly used with the **Transactional Outbox Pattern**. Instead of publishing events directly after a database transaction, the application writes the event to an **Outbox table** in the same transaction as the business data. A background worker periodically polls the Outbox table for pending events, publishes them to a message broker such as Kafka or RabbitMQ, and then marks them as published. If publishing fails, the event remains pending and is retried during the next polling cycle. This pattern provides reliable event delivery, avoids the dual-write problem, and ensures eventual consistency without requiring distributed transactions.

---

# Key Interview Points

- Works together with the Transactional Outbox Pattern.
- A background worker polls the Outbox table.
- Publishes only `PENDING` events.
- Marks events as `PUBLISHED` after success.
- Retries failed events automatically.
- Solves the dual-write problem.
- Supports eventual consistency.
- Consumers should be idempotent to safely handle duplicate events.

---

# Summary

The **Polling Publisher Pattern** is a reliable mechanism for delivering events from an **Outbox table** to a message broker. It periodically scans for pending events, publishes them, retries failures, and marks successful events as processed. It is simple to implement and is widely used in event-driven microservices to ensure reliable, eventually consistent communication.