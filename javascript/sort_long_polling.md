# Short Polling vs Long Polling – Interview Questions & Answers



# What is Polling?

**Polling** is a communication technique where the **client repeatedly checks the server** to determine whether new data is available.

It is commonly used when the server cannot directly push updates to the client.

---

# Q1. What is Short Polling?

### Answer

**Short Polling** is a technique where the client sends requests to the server at **fixed intervals** (for example, every 5 or 10 seconds) to check if new data is available.

The server immediately responds regardless of whether new data exists.

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

