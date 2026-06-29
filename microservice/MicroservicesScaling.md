# Microservices Scaling

# What is Scaling?

**Scaling** is the process of increasing or decreasing the resources available to a microservice so it can handle more or fewer user requests while maintaining good performance and availability.

The goal of scaling is to:

- Handle more traffic
- Improve performance
- Increase availability
- Reduce downtime
- Optimize infrastructure costs

---

# Why Do We Need Scaling?

Suppose an e-commerce website receives:

```
Normal Day

↓

1,000 Users
```

During a sale:

```
100,000 Users
```

A single instance of the **Order Service** cannot handle all requests.

Without scaling:

```
Users

↓

Order Service

↓

Server Overloaded

↓

Slow Response

↓

Timeout

↓

Application Crash
```

Scaling solves this problem by adding more resources or more instances.

---

# Types of Scaling

There are two main types:

1. Vertical Scaling (Scale Up)
2. Horizontal Scaling (Scale Out)

---

# 1. Vertical Scaling (Scale Up)

Increase the resources of the existing server.

Example:

```
Before

CPU : 2 Core

RAM : 4 GB
```

Upgrade to:

```
CPU : 8 Core

RAM : 32 GB
```

Architecture:

```
Users

↓

One Bigger Server

↓

Order Service
```

### Advantages

- Easy to implement.
- No application changes.
- Good for small applications.

### Disadvantages

- Hardware limits.
- Expensive.
- Single point of failure.
- Downtime during upgrades.

---

# 2. Horizontal Scaling (Scale Out)

Add multiple instances of the same microservice.

```
               Load Balancer
                     |
      --------------------------------
      |              |              |
      V              V              V
 Order-1        Order-2        Order-3
```

Requests are distributed among all instances.

### Advantages

- High availability.
- Better fault tolerance.
- Easy auto-scaling.
- No single point of failure.

### Disadvantages

- More infrastructure.
- Requires stateless services.
- More operational complexity.

---

# Stateless Microservices

For horizontal scaling, services should be **stateless**.

❌ Bad:

```
Session Stored

Inside Server Memory
```

If the server crashes:

```
Session Lost
```

---

✅ Good:

```
JWT

or

Redis Session
```

Any instance can handle the request.

---

# Scaling Architecture

```
                 Users
                    |
                    V
             Load Balancer
                    |
      -----------------------------------
      |          |          |           |
      V          V          V           V
 Order-1    Order-2    Order-3    Order-4
                    |
                PostgreSQL
```

---

# Auto Scaling

Instead of manually adding servers, Kubernetes or cloud platforms can automatically create or remove instances.

Example:

```
CPU > 70%

↓

Create New Pod
```

When traffic decreases:

```
CPU < 20%

↓

Remove Extra Pods
```

---

# Kubernetes Horizontal Pod Autoscaler (HPA)

```
Traffic Increases

↓

CPU = 85%

↓

HPA

↓

Create More Pods

↓

Traffic Balanced
```

Example YAML:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

# Database Scaling

Microservices often scale independently from the database.

### Read Replicas

```
Application

↓

Primary Database

↓

Read Replica 1

↓

Read Replica 2
```

Reads go to replicas.

Writes go to the primary database.

---

### Database Partitioning

```
Customer Data

↓

Shard 1

Shard 2

Shard 3
```

Each shard stores part of the data.

---

# Cache Scaling

Use Redis.

```
Application

↓

Redis

↓

Database
```

Frequently accessed data is served from Redis, reducing database load.

---

# Load Balancing

Load balancer distributes traffic.

```
Client

↓

Load Balancer

↓

Service-1

Service-2

Service-3
```

Algorithms:

- Round Robin
- Least Connections
- Weighted Round Robin
- IP Hash

---

# Message Queue Scaling

Instead of processing everything synchronously:

```
Order Service

↓

Kafka

↓

Worker-1

Worker-2

Worker-3
```

Workers can be scaled independently.

---

# Independent Scaling

One of the biggest advantages of microservices.

Example:

```
User Service

2 Pods
```

```
Payment Service

15 Pods
```

```
Notification Service

25 Pods
```

Only heavily used services are scaled.

---

# CDN Scaling

Static files:

```
Images

CSS

JavaScript
```

Stored in:

```
CloudFront

Cloudflare
```

Reduces load on backend services.

---

# Scaling on AWS

```
Users

↓

Application Load Balancer

↓

Amazon EKS

↓

Pods

↓

Amazon RDS

↓

ElastiCache

↓

Amazon MSK
```

Services Used:

- Amazon EKS
- Auto Scaling Groups
- Application Load Balancer (ALB)
- Amazon RDS
- Amazon ElastiCache
- Amazon MSK (Kafka)

---

# Scaling Strategy

```
Traffic

↓

API Gateway

↓

Load Balancer

↓

Microservice Pods

↓

Redis Cache

↓

Database
```

---

# Best Practices

- Design services to be stateless.
- Use Kubernetes Horizontal Pod Autoscaler (HPA).
- Configure readiness and liveness probes.
- Use Redis for caching.
- Scale databases with read replicas.
- Use message queues for asynchronous processing.
- Monitor CPU, memory, latency, and request rates.
- Set sensible autoscaling thresholds.
- Use CDN for static content.
- Perform load testing before production.

---

# Real-World Example

### Flash Sale

Normally:

```
Order Service

2 Pods
```

Flash Sale Starts:

```
Traffic = 10x

↓

HPA Detects CPU > 70%

↓

Scale to 20 Pods

↓

Traffic Distributed
```

After the sale:

```
CPU < 20%

↓

Scale Back to 2 Pods
```

This saves costs while maintaining performance.

---

# Interview Scenario

### Q: How would you scale an Order Service during a Black Friday sale?

### Answer:

1. Make the service stateless using JWT instead of in-memory sessions.
2. Deploy multiple replicas behind a Load Balancer.
3. Enable Kubernetes Horizontal Pod Autoscaler (HPA) based on CPU and memory usage.
4. Use Redis to cache frequently accessed data.
5. Offload background tasks (emails, invoices) to Kafka or RabbitMQ.
6. Use database read replicas for read-heavy workloads.
7. Serve static assets through a CDN.
8. Monitor the system using Prometheus and Grafana.
9. Configure alerts for high CPU, memory, latency, and error rates.

---

# Horizontal vs Vertical Scaling

| Vertical Scaling | Horizontal Scaling |
|------------------|--------------------|
| Increase server resources | Add more service instances |
| Limited by hardware | Virtually unlimited |
| May require downtime | Minimal or no downtime |
| Simpler | More scalable |
| Single point of failure | High availability |

---

# Interview Answer (2 Minutes)

> **Microservices are typically scaled horizontally** by adding more instances of individual services behind a load balancer. Each service should be stateless so that any instance can process any request. In Kubernetes, the **Horizontal Pod Autoscaler (HPA)** automatically increases or decreases the number of pods based on metrics like CPU or memory usage. To improve scalability further, we use **Redis** for caching, **database read replicas** for read-heavy workloads, **Kafka or RabbitMQ** for asynchronous processing, and a **CDN** for static content. Unlike monolithic applications, each microservice can be scaled independently based on demand. For example, during a flash sale, the Payment Service might scale to 20 pods while the User Service remains at 2 pods.

---

# Key Interview Points

- Two types of scaling:
  - Vertical Scaling (Scale Up)
  - Horizontal Scaling (Scale Out)
- Prefer **Horizontal Scaling** for microservices.
- Keep services **stateless**.
- Use **Load Balancers** to distribute traffic.
- Enable **Kubernetes HPA** for automatic scaling.
- Scale databases with **read replicas** and **sharding**.
- Use **Redis** for caching.
- Use **Kafka/RabbitMQ** for asynchronous workloads.
- Monitor using **Prometheus** and **Grafana**.
- Scale each microservice independently.

---

# Summary

Microservices scale by adding more instances of services, distributing traffic through load balancers, and automatically adjusting capacity with tools like Kubernetes HPA. Supporting technologies such as Redis, Kafka, read replicas, and CDNs help ensure applications remain fast, reliable, and cost-effective under varying workloads.