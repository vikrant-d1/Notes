# Circuit Breaker Pattern (Microservices)

## What is the Circuit Breaker Pattern?

The **Circuit Breaker Pattern** is a resilience pattern used in microservices to **prevent repeated calls to a failing service**.

When a downstream service (such as Payment Service) becomes slow or unavailable, the Circuit Breaker temporarily **stops sending requests** to that service instead of repeatedly attempting failed calls.

This prevents:

- Cascading failures
- Resource exhaustion
- Increased response times
- Poor user experience

---

# Why Do We Need Circuit Breaker?

Suppose an **Order Service** calls the **Payment Service**.

```
Order Service

↓

Payment Service
```

Normally:

```
Order Service

↓

Payment Service

↓

Payment Successful
```

But if the Payment Service crashes:

```
Order Service

↓

Payment Service

↓

Timeout

↓

Retry

↓

Timeout

↓

Retry

↓

Timeout
```

Problems:

- Threads become blocked.
- CPU and memory usage increase.
- Response times grow.
- Other services may also fail (cascading failure).

---

# Solution: Circuit Breaker

Instead of continuously calling the failed service:

```
Order Service

↓

Circuit Breaker

↓

Payment Service
```

If the Payment Service fails multiple times, the Circuit Breaker **opens** and blocks further requests.

---

# How Circuit Breaker Works

```
              Client
                 |
                 V
          Order Service
                 |
                 V
         Circuit Breaker
                 |
         -----------------
         |               |
         V               X
 Payment Service      Request Blocked
```

The Circuit Breaker sits between the client service and the downstream service.

---

# Three States of Circuit Breaker

## 1. Closed State (Normal)

Everything is working.

```
Client

↓

Order Service

↓

Circuit Breaker (Closed)

↓

Payment Service
```

All requests are allowed.

---

## 2. Open State (Failure)

Suppose the Payment Service keeps failing.

```
Request 1 → Failed

Request 2 → Failed

Request 3 → Failed

↓

Failure Threshold Reached

↓

Circuit Opens
```

Now:

```
Client

↓

Order Service

↓

Circuit Breaker (Open)

↓

Payment Service ❌

↓

Request Rejected Immediately
```

No request reaches the Payment Service.

---

## 3. Half-Open State (Recovery)

After a timeout (e.g., 30 seconds), the Circuit Breaker allows **a few test requests**.

```
Circuit Breaker

↓

Test Request

↓

Payment Service
```

### If the test succeeds:

```
Circuit

↓

Closed
```

Normal traffic resumes.

### If the test fails:

```
Circuit

↓

Open Again
```

The service is given more time to recover.

---

# State Transition Diagram

```
          Success
      +-------------+
      |             |
      V             |
   +--------+   Failure Threshold
   | Closed |--------------------+
   +--------+                    |
        ^                        |
        |                        V
 Test   |                  +-----------+
Success |                  |   Open    |
        |                  +-----------+
        |                        |
        |     Timeout            |
        +------------------------+
                 |
                 V
          +---------------+
          |  Half-Open    |
          +---------------+
                 |
      -------------------------
      |                       |
      V                       V
 Success                  Failure
      |                       |
      V                       V
   Closed                  Open
```

---

# Example

Suppose:

```
Failure Threshold = 5

Timeout = 30 seconds
```

Flow:

```
Request 1 → Failed

Request 2 → Failed

Request 3 → Failed

Request 4 → Failed

Request 5 → Failed

↓

Circuit Opens
```

For the next 30 seconds:

```
All Requests

↓

Rejected Immediately
```

After 30 seconds:

```
One Test Request

↓

Success

↓

Circuit Closed
```

---

# Architecture Diagram

```
                Client
                   |
                   V
             Order Service
                   |
                   V
          Circuit Breaker
                   |
          -------------------
          |                 |
          V                 X
    Payment Service   Request Blocked
```

---

# Fallback Mechanism

Instead of returning an error, a fallback response can be returned.

Example:

```
Payment Service Down

↓

Fallback

↓

"Payment service is temporarily unavailable.
Please try again later."
```

Or:

```
Cached Response

↓

User Receives Previous Data
```

---

# Real-World Example

### Food Delivery Application

Customer places an order.

```
Order Service

↓

Payment Service
```

If the Payment Service is unavailable:

```
Circuit Opens

↓

Order Service

↓

Return Friendly Error

↓

User Notified
```

The Payment Service is not overloaded with repeated requests while recovering.

---

# Popular Circuit Breaker Libraries

| Library | Language |
|----------|----------|
| Resilience4j | Java / Spring Boot |
| Hystrix *(Deprecated)* | Java |
| Polly | .NET |
| Opossum | Node.js |
| Istio | Kubernetes Service Mesh |

---

# Circuit Breaker vs Retry

| Retry | Circuit Breaker |
|--------|-----------------|
| Retries failed requests | Stops sending requests after repeated failures |
| Good for temporary failures | Good for persistent failures |
| May increase load | Reduces load on failing service |
| Can be combined with Circuit Breaker | Often used together |

---

# Circuit Breaker vs Timeout

| Timeout | Circuit Breaker |
|----------|-----------------|
| Waits for a limited time | Prevents repeated requests |
| Applied to individual requests | Monitors overall service health |
| Doesn't remember previous failures | Tracks failure history |

---

# Advantages

- Prevents cascading failures.
- Protects downstream services.
- Reduces unnecessary retries.
- Improves system stability.
- Faster failure detection.
- Better user experience with fallbacks.
- Improves overall resilience.

---

# Challenges

- Choosing the right failure threshold.
- Choosing appropriate timeout values.
- Implementing meaningful fallback responses.
- Additional configuration and monitoring.

---

# Best Practices

- Combine with Retry and Timeout policies.
- Use exponential backoff for retries.
- Provide fallback responses when possible.
- Monitor Circuit Breaker metrics.
- Configure thresholds based on production traffic.
- Log all state transitions (Closed → Open → Half-Open).

---

# Real Interview Scenario

### Payment Service Failure

```
Customer Places Order

↓

Order Service

↓

Payment Service (Down)

↓

5 Consecutive Failures

↓

Circuit Opens

↓

Next Requests Blocked

↓

After 30 Seconds

↓

One Test Request

↓

Success

↓

Circuit Closed
```

---

# Interview Answer (2 Minutes)

> The **Circuit Breaker Pattern** is a resilience pattern used in microservices to prevent repeated requests to a failing service. It sits between the calling service and the target service, monitoring failures. When the number of failures exceeds a configured threshold, the circuit changes from the **Closed** state to the **Open** state and immediately rejects further requests, preventing cascading failures and reducing resource usage. After a configured timeout, it enters the **Half-Open** state and allows a few test requests. If those requests succeed, the circuit closes and normal traffic resumes. If they fail, the circuit opens again. Circuit Breakers are commonly implemented using **Resilience4j**, **Polly**, **Opossum**, or **Istio**, and are often combined with retries, timeouts, and fallback mechanisms.

---

# Key Interview Points

- Prevents cascading failures.
- Stops repeated calls to unhealthy services.
- Three states:
  - Closed
  - Open
  - Half-Open
- Supports fallback responses.
- Often used with Retry and Timeout.
- Improves fault tolerance and resilience.
- Popular libraries:
  - Resilience4j
  - Polly
  - Opossum
  - Istio

---

# Summary

The **Circuit Breaker Pattern** protects microservices from repeatedly calling failing downstream services. By temporarily blocking requests after repeated failures and allowing controlled recovery through the Half-Open state, it improves application stability, prevents cascading failures, and enhances user experience in distributed systems.