# Saga Pattern (Microservices)

## What is the Saga Pattern?

The **Saga Pattern** is a microservices design pattern used to manage **distributed transactions** across multiple microservices **without using Two-Phase Commit (2PC)**.

A Saga breaks a large business transaction into a sequence of **local transactions**. Each service performs its own transaction and, if successful, triggers the next step. If any step fails, previously completed steps are **undone using compensating transactions**.

**Key Idea:**

> Every service commits its own local transaction. If a later step fails, previously completed steps are compensated (rolled back logically).

---

# Why Do We Need Saga?

Suppose an e-commerce application has the following services:

- Order Service
- Payment Service
- Inventory Service
- Notification Service

When a customer places an order:

1. Create Order
2. Reserve Inventory
3. Process Payment
4. Send Notification

If Payment fails after Inventory has already been reserved, we must release the reserved inventory and cancel the order.

Without Saga:

```
Order Created ✅

Inventory Reserved ✅

Payment Failed ❌

Inventory Still Reserved ❌

Order Still Exists ❌
```

The system becomes inconsistent.

---

# Solution: Saga Pattern

```
Create Order

↓

Reserve Inventory

↓

Process Payment

↓

Send Notification

If any step fails

↓

Execute Compensating Transactions
```

---

# How Saga Works

```
              Customer
                  |
                  V
           Place Order
                  |
                  V
          Order Service
                  |
                  V
       Inventory Service
                  |
                  V
        Payment Service
                  |
                  V
     Notification Service
```

If Payment fails:

```
Cancel Payment

↓

Release Inventory

↓

Cancel Order
```

---

# Saga Flow

```
Order Created

↓

Inventory Reserved

↓

Payment Successful

↓

Notification Sent

↓

Saga Completed
```

Failure Scenario:

```
Order Created

↓

Inventory Reserved

↓

Payment Failed

↓

Release Inventory

↓

Cancel Order
```

---

# Types of Saga Pattern

There are **two ways** to implement a Saga:

1. Choreography Saga
2. Orchestration Saga

---

# 1. Choreography Saga

In **Choreography**, there is **no central coordinator**.

Each microservice listens for events and decides what to do next.

```
Order Service

↓

OrderCreated Event

↓

Inventory Service

↓

InventoryReserved Event

↓

Payment Service

↓

PaymentCompleted Event

↓

Notification Service
```

Every service reacts to events independently.

---

## Architecture

```
Order Service

↓

OrderCreated Event

↓

Kafka

↓

Inventory Service

↓

InventoryReserved Event

↓

Kafka

↓

Payment Service

↓

PaymentCompleted Event

↓

Kafka

↓

Notification Service
```

---

## Advantages

- No central coordinator.
- Loosely coupled services.
- Easy to add new services.
- High scalability.

---

## Disadvantages

- Difficult to understand complex flows.
- Hard to debug.
- Event chains become difficult to track.
- Risk of cyclic dependencies.

---

# 2. Orchestration Saga

In **Orchestration**, a **Saga Orchestrator** controls the entire workflow.

The orchestrator tells each service what to do.

```
Order Service

↓

Saga Orchestrator

↓

Inventory Service

↓

Payment Service

↓

Notification Service
```

If any step fails, the orchestrator invokes compensating transactions.

---

## Architecture

```
                  Client
                     |
                     V
              Saga Orchestrator
                     |
      ---------------------------------
      |               |               |
      V               V               V
 Order Service  Inventory Service Payment Service
                     |
                     V
             Notification Service
```

---

## Failure Example

```
Create Order ✅

↓

Reserve Inventory ✅

↓

Payment Failed ❌

↓

Release Inventory

↓

Cancel Order
```

The orchestrator coordinates the rollback.

---

## Advantages

- Easier to understand.
- Centralized workflow.
- Easier debugging.
- Better monitoring.

---

## Disadvantages

- Single coordinator adds complexity.
- Orchestrator can become a bottleneck.
- Additional component to maintain.

---

# Compensating Transactions

A **Compensating Transaction** reverses the effect of a previously completed local transaction.

Example:

| Completed Transaction | Compensating Transaction |
|-----------------------|--------------------------|
| Create Order | Cancel Order |
| Reserve Inventory | Release Inventory |
| Charge Payment | Refund Payment |
| Book Hotel | Cancel Hotel Booking |
| Reserve Flight | Cancel Flight Reservation |

---

# Real-World Example

### Online Shopping

```
Customer Places Order

↓

Order Service

↓

Inventory Service

↓

Payment Service

↓

Shipping Service

↓

Notification Service
```

If Shipping fails:

```
Cancel Shipment

↓

Refund Payment

↓

Release Inventory

↓

Cancel Order
```

---

# Architecture Diagram

```
                  Customer
                      |
                      V
               Place Order
                      |
                      V
              Saga Orchestrator
                      |
      ---------------------------------------
      |             |             |          |
      V             V             V          V
 Order Service Inventory Service Payment Service Notification
      |             |             |
      |-------------Compensating Transactions---------|
```

---

# Saga vs Two-Phase Commit (2PC)

| Saga Pattern | Two-Phase Commit (2PC) |
|---------------|------------------------|
| Uses local transactions | Uses distributed transaction |
| Eventual consistency | Strong consistency |
| High scalability | Lower scalability |
| No global database lock | Global locks possible |
| Compensation on failure | Atomic commit/rollback |
| Preferred for microservices | Common in monolithic systems |

---

# Choreography vs Orchestration

| Choreography | Orchestration |
|--------------|---------------|
| Event-driven | Coordinator-driven |
| No central controller | Central Saga Orchestrator |
| Loose coupling | Easier monitoring |
| Harder debugging | Easier debugging |
| Better for simple workflows | Better for complex workflows |

---

# Advantages

- Eliminates distributed transactions (2PC).
- High scalability.
- Better fault tolerance.
- Supports eventual consistency.
- Services remain loosely coupled.
- Ideal for cloud-native microservices.

---

# Challenges

- Eventual consistency (not immediate consistency).
- Requires compensating transactions.
- More complex error handling.
- Difficult debugging in large event-driven systems.
- Duplicate event handling (consumers should be idempotent).

---

# Best Practices

- Design compensating transactions carefully.
- Keep each local transaction small.
- Make event consumers idempotent.
- Use correlation IDs to trace a Saga.
- Implement retries with exponential backoff.
- Monitor long-running Sagas.
- Use a Dead Letter Queue (DLQ) for failed events.

---

# Real Interview Scenario

### Flight Booking System

Customer books:

- Flight
- Hotel
- Taxi

Workflow:

```
Reserve Flight

↓

Reserve Hotel

↓

Book Taxi
```

If Hotel booking fails:

```
Cancel Flight Reservation

↓

Stop Taxi Booking
```

This ensures the customer is not charged for a partial booking.

---

# Interview Answer (2 Minutes)

> The **Saga Pattern** is a microservices design pattern used to manage distributed transactions without using Two-Phase Commit (2PC). It breaks a business transaction into multiple local transactions executed by different services. Each service commits its own transaction and then triggers the next step. If any step fails, the system executes **compensating transactions** to undo the effects of previously completed steps. Saga can be implemented in two ways: **Choreography**, where services communicate through events without a central controller, and **Orchestration**, where a Saga Orchestrator coordinates the workflow. The Saga Pattern provides **eventual consistency**, high scalability, and loose coupling, making it the preferred approach for modern microservices.

---

# Key Interview Points

- Solves distributed transaction problems.
- Replaces Two-Phase Commit (2PC).
- Uses local transactions.
- Maintains **eventual consistency**.
- Supports **compensating transactions**.
- Two implementations:
  - Choreography (event-driven)
  - Orchestration (central coordinator)
- Commonly used with Kafka, RabbitMQ, AWS SQS, and other message brokers.
- Consumers should be idempotent.

---

# Summary

The **Saga Pattern** enables reliable distributed transactions in microservices by breaking a business process into a series of local transactions. If every step succeeds, the Saga completes successfully. If any step fails, compensating transactions undo the completed work, ensuring the system remains **eventually consistent** without requiring distributed database transactions.