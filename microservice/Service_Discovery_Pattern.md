# Service Discovery Pattern

## What is Service Discovery?

**Service Discovery** is a microservices pattern that allows services to automatically locate and communicate with each other without hardcoding IP addresses or hostnames.

In cloud and containerized environments, service instances are frequently created, destroyed, or moved, causing their IP addresses to change. Service Discovery solves this problem by maintaining a registry of available service instances.

---

# Why Do We Need Service Discovery?

Consider the following microservices:

```
User Service
Order Service
Payment Service
Notification Service
```

The **Order Service** needs to communicate with the **Payment Service**.

### Without Service Discovery

```
http://192.168.1.15:8080/pay
```

If the Payment Service restarts or scales to another server, its IP address changes and the request fails.

### With Service Discovery

```
http://payment-service/pay
```

The actual IP address is resolved automatically by the Service Registry.

---

# How Service Discovery Works

```
                   +-------------------------+
                   |    Service Registry     |
                   | (Eureka / Consul / etc) |
                   +-----------+-------------+
                               ^
                      Register  |
                               |
      +------------------------+----------------------+
      |                                               |
+-------------+                               +-------------+
| User Service|                               |Payment Service|
+-------------+                               +-------------+
      |                                              ^
      |-------------- Query Registry ----------------|
      |
      | Receives Current IP Address
      |
      +-------------> Sends Request ------------------>
```

---

# Step-by-Step Flow

## Step 1: Service Registration

When the Payment Service starts:

```
IP   : 10.0.1.15
Port : 8080
```

It registers itself with the Service Registry.

```
Service Name:
payment-service

Address:
10.0.1.15:8080
```

---

## Step 2: Service Discovery

The Order Service wants to call the Payment Service.

Instead of using an IP address:

```
payment-service
```

It asks the Service Registry.

Registry responds:

```
10.0.1.15:8080
```

---

## Step 3: Communication

```
Order Service
      |
      |
      V
Payment Service
```

If the Payment Service moves to another machine or container, it registers the new address automatically.

---

# Types of Service Discovery

## 1. Client-Side Service Discovery

The client is responsible for discovering service instances.

```
Client
   |
   |----> Service Registry
   |
Gets Service Address
   |
Calls Service
```

### Examples

- Netflix Eureka
- Apache ZooKeeper

### Advantages

- Fast
- Client performs load balancing
- No extra network hop

### Disadvantages

- Client contains discovery logic
- More complex client implementation

---

## 2. Server-Side Service Discovery

The client sends requests to a load balancer.

```
Client
   |
   V
Load Balancer
   |
Service Registry
   |
Target Service
```

### Examples

- Kubernetes Service
- AWS Elastic Load Balancer
- NGINX
- HAProxy

### Advantages

- Simple client
- Centralized load balancing
- Easy to maintain

### Disadvantages

- Additional network hop
- Load balancer becomes an important infrastructure component

---

# Popular Service Discovery Tools

| Tool | Description |
|------|-------------|
| Netflix Eureka | Service discovery for Spring Cloud applications |
| HashiCorp Consul | Service discovery, health checks, and key-value store |
| Apache ZooKeeper | Distributed coordination and service discovery |
| etcd | Distributed key-value store used by Kubernetes |
| Kubernetes DNS | Built-in service discovery inside Kubernetes clusters |

---

# Health Checks

Service Registry continuously checks whether a service is healthy.

Example:

```
Payment Service

Heartbeat every 30 seconds
```

If the heartbeat stops:

```
Payment Service
      X

Registry removes it
```

Clients will no longer receive the unhealthy instance.

---

# Load Balancing

Suppose there are three Payment Service instances.

```
Payment-1
Payment-2
Payment-3
```

The registry returns:

```
10.1.1.1
10.1.1.2
10.1.1.3
```

Requests are distributed:

```
Request 1 → Payment-1

Request 2 → Payment-2

Request 3 → Payment-3
```

Load balancing strategies include:

- Round Robin
- Least Connections
- Random
- Weighted Round Robin

---

# Real-World Example

Consider a Food Delivery application.

```
Customer Service

Restaurant Service

Payment Service

Delivery Service

Notification Service
```

Initially:

```
Payment Service

1 Instance
```

During high traffic:

```
Payment Service

10 Instances
```

The Service Registry automatically updates all available instances.

Other services continue calling:

```
payment-service
```

without changing any code.

---

# Advantages

- Eliminates hardcoded IP addresses
- Supports auto-scaling
- Handles dynamic infrastructure
- Improves fault tolerance
- Enables automatic load balancing
- Simplifies service-to-service communication
- Works well with containers and Kubernetes

---

# Disadvantages

- Additional infrastructure to maintain
- Registry becomes a critical component
- Requires health monitoring
- Slight increase in network overhead

---

# Service Discovery vs Hardcoded URLs

| Hardcoded URL | Service Discovery |
|---------------|------------------|
| Fixed IP Address | Dynamic Service Lookup |
| Difficult to scale | Easy auto-scaling |
| Manual updates | Automatic updates |
| Poor fault tolerance | High fault tolerance |
| Limited flexibility | Highly flexible |

---

# Interview Answer (2 Minutes)

> **Service Discovery** is a microservices pattern that enables services to locate each other dynamically without hardcoding IP addresses or hostnames. Every service registers itself with a **Service Registry** (such as Eureka, Consul, or Kubernetes DNS) when it starts. When another service needs to communicate, it queries the registry to obtain the current address of the target service. This is essential in cloud environments where service instances frequently change due to scaling or restarts. Service Discovery improves scalability, fault tolerance, and load balancing. There are two approaches: **Client-Side Discovery**, where the client queries the registry directly, and **Server-Side Discovery**, where a load balancer or platform such as Kubernetes handles service discovery transparently.

---

# Key Interview Points

- Service Discovery eliminates hardcoded IP addresses.
- Services register themselves with a Service Registry.
- Supports dynamic scaling and containerized deployments.
- Health checks remove unhealthy instances.
- Enables load balancing across multiple service instances.
- Two approaches:
  - Client-Side Discovery
  - Server-Side Discovery
- Common tools:
  - Netflix Eureka
  - Consul
  - ZooKeeper
  - etcd
  - Kubernetes DNS

---

# Architecture Diagram

```
                  +-------------------------+
                  |    Service Registry     |
                  | Eureka / Consul / etcd  |
                  +-----------+-------------+
                              ^
                  Register     |
                              |
        +---------------------+----------------------+
        |                                            |
+---------------+                            +---------------+
| User Service  |                            | Payment Service|
+---------------+                            +---------------+
        |                                            ^
        |------------ Discover Service --------------|
        |
        | Current Address Returned
        |
        +------------ Request ----------------------->

```

---

# Summary

Service Discovery is a core microservices pattern that enables services to find each other dynamically. It removes the need for hardcoded network addresses, supports auto-scaling, health checks, load balancing, and fault tolerance, making it essential for modern cloud-native and Kubernetes-based applications.