# Short Polling vs Long Polling – Interview Questions & Answers

## Table of Contents

* What is Polling?
* What is Short Polling?
* What is Long Polling?
* Short Polling vs Long Polling
* Interview Questions
* Cross Questions
* Real-World Scenarios
* Best Practices

---

# What is Polling?

**Polling** is a communication technique where the **client repeatedly checks the server** to determine whether new data is available.

It is commonly used when the server cannot directly push updates to the client.

---

# Q1. What is Short Polling?

### Answer

**Short Polling** is a technique where the client sends requests to the server at **fixed intervals** (for example, every 5 or 10 seconds) to check if new data is available.

The server immediately responds regardless of whether new data exists.

### Flow

```
Client               Server

Request ---------->
             No Data
<---------- Response

(wait 5 sec)

Request ---------->
             No Data
<---------- Response

(wait 5 sec)

Request ---------->
             New Data
<---------- Response
```

### Example

A dashboard refreshes every **10 seconds** to check for new notifications.

### Advantages

* Very easy to implement
* Works with every browser
* Good for applications with infrequent updates

### Disadvantages

* Creates unnecessary requests
* Consumes more bandwidth
* Increases server load
* Updates may be delayed

---

# Q2. What is Long Polling?

### Answer

**Long Polling** is a technique where the client sends a request, but the server **does not respond immediately**.

Instead, the server keeps the HTTP connection open until:

* New data becomes available, or
* A timeout occurs.

Once the client receives the response, it immediately sends another request.

### Flow

```
Client                     Server

Request ------------------>

             Waiting...
             Waiting...

          New Data Arrives

<---------------- Response

Immediately

Request ------------------>
```

### Example

A chat application waits for a new message instead of requesting every few seconds.

### Advantages

* Near real-time updates
* Fewer unnecessary requests
* Better network utilization
* Lower latency

### Disadvantages

* More difficult to implement
* Keeps HTTP connections open
* Doesn't scale as well as WebSockets

---

# Short Polling vs Long Polling

| Feature           | Short Polling       | Long Polling               |
| ----------------- | ------------------- | -------------------------- |
| Request Frequency | Fixed Interval      | After Previous Response    |
| Server Response   | Immediate           | Waits Until Data Available |
| Network Usage     | High                | Low                        |
| Latency           | High                | Low                        |
| Real-Time         | ❌ No                | ✅ Almost Real-Time         |
| Server Resources  | Many Requests       | Long-Lived Connections     |
| Complexity        | Easy                | Medium                     |
| Best Use Cases    | Dashboards, Reports | Chat, Notifications        |

---

# Interview Questions & Answers

---

## Q1. What is Polling?

### Answer

Polling is a technique where the client periodically checks the server for new data.

---

## Q2. What is Short Polling?

### Answer

Short Polling sends requests at regular intervals. The server responds immediately, even if there is no new data.

---

## Q3. What is Long Polling?

### Answer

Long Polling keeps the request open until the server has new data or the request times out. The client then immediately sends another request.

---

## Q4. What is the difference between Short Polling and Long Polling?

### Answer

| Short Polling                    | Long Polling                         |
| -------------------------------- | ------------------------------------ |
| Requests sent at fixed intervals | Requests wait until new data arrives |
| More HTTP requests               | Fewer HTTP requests                  |
| Higher latency                   | Lower latency                        |
| More bandwidth usage             | Less bandwidth usage                 |
| Easier to implement              | Slightly more complex                |

---

## Q5. Which is better for real-time applications?

### Answer

Long Polling is better because updates are delivered as soon as they are available.

However, **WebSockets** are the preferred solution for true real-time communication.

---

## Q6. Why is Short Polling inefficient?

### Answer

Because the client continuously sends requests even when there is no new data, leading to:

* Increased bandwidth usage
* Higher server load
* Many unnecessary HTTP requests

---

## Q7. Why is Long Polling more efficient?

### Answer

Long Polling waits until data is available before responding, reducing unnecessary requests and network traffic.

---

## Q8. Does Long Polling keep the connection open?

### Answer

Yes.

The server keeps the HTTP connection open until:

* New data arrives
* The request times out

---

## Q9. Can Long Polling replace WebSockets?

### Answer

No.

Long Polling provides near real-time communication, but WebSockets are faster and more efficient because they maintain a persistent bidirectional connection.

---

## Q10. When should you use Short Polling?

### Answer

Use Short Polling when:

* Updates are infrequent
* A small delay is acceptable
* Simplicity is more important than efficiency

Examples:

* Dashboard refresh
* System health monitoring
* Weather updates

---

## Q11. When should you use Long Polling?

### Answer

Use Long Polling when:

* Near real-time updates are required
* WebSockets are unavailable
* HTTP infrastructure must be used

Examples:

* Chat applications
* Notification systems
* Order status tracking

---

# Cross Questions

---

## Q1. Which polling method generates more HTTP requests?

**Answer:**

Short Polling.

---

## Q2. Which polling method has lower latency?

**Answer:**

Long Polling.

---

## Q3. Which polling method consumes more bandwidth?

**Answer:**

Short Polling.

---

## Q4. Which polling method is easier to implement?

**Answer:**

Short Polling.

---

## Q5. Which polling method is suitable for chat applications?

**Answer:**

Long Polling.

---

## Q6. Which technology is better than both polling methods?

**Answer:**

WebSockets.

---

## Q7. Why are WebSockets better?

**Answer:**

Because they:

* Maintain a single persistent connection
* Support full-duplex communication
* Reduce HTTP overhead
* Deliver true real-time updates

---

# Real-World Scenarios

## Scenario 1: Dashboard

A monitoring dashboard refreshes every **30 seconds**.

**Best Choice:** Short Polling

Reason:

Real-time updates are not required.

---

## Scenario 2: Chat Application

Users should receive messages instantly.

**Best Choice:** Long Polling (or ideally WebSockets)

Reason:

Users shouldn't wait for the next polling interval.

---

## Scenario 3: Food Delivery App

Customers should receive order updates immediately.

**Best Choice:** Long Polling

---

## Scenario 4: Stock Market Prices

Prices change every second.

**Best Choice:** WebSockets

Reason:

Polling cannot efficiently handle continuous updates.

---

# Best Practices

### Use Short Polling when:

* Updates are infrequent
* Simplicity is preferred
* Delays are acceptable

### Use Long Polling when:

* Near real-time updates are needed
* WebSockets are unavailable

### Use WebSockets when:

* Building chat applications
* Multiplayer games
* Live notifications
* Stock market dashboards
* Collaborative editing tools

---

# Interview One-Liners

### Short Polling

> "The client repeatedly sends requests to the server at fixed intervals to check for new data."

---

### Long Polling

> "The client sends a request, and the server keeps it open until new data is available or a timeout occurs."

---

### WebSockets

> "WebSockets establish a persistent, bidirectional connection between the client and server, enabling true real-time communication with minimal overhead."

---

# Interview Tip

If asked:

> **"Which would you choose for a modern chat application?"**

A strong answer is:

> "I would choose **WebSockets** because they provide a persistent, full-duplex connection with low latency. If WebSockets are unavailable due to infrastructure constraints, I would use **Long Polling** as the fallback. I would avoid **Short Polling** because it generates unnecessary requests and increases server load."
