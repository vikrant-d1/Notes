# Service Mesh

## What is a Service Mesh?

A **Service Mesh** is a dedicated infrastructure layer that manages **service-to-service communication** in a microservices architecture.

Instead of implementing networking features like **load balancing, security, retries, service discovery, traffic routing, and monitoring** inside every microservice, a Service Mesh handles them transparently using **sidecar proxies**.

The application focuses only on business logic, while the Service Mesh manages all network communication.

---

# Why Do We Need a Service Mesh?

Consider three microservices:

```
User Service
Order Service
Payment Service
```

Without a Service Mesh, every service must implement:

- Authentication
- TLS Encryption
- Retry Logic
- Circuit Breaker
- Load Balancing
- Logging
- Monitoring
- Metrics Collection

This results in duplicated code across all services.

---

With a Service Mesh:

```
Application

↓

Sidecar Proxy

↓

Network

↓

Sidecar Proxy

↓

Application
```

All networking concerns are handled by the sidecar proxies.

---

# How a Service Mesh Works

```
                    +----------------------+
                    |      Client          |
                    +----------+-----------+
                               |
                               |
                               V
     -------------------------------------------------------
                    Kubernetes Cluster
     -------------------------------------------------------

+----------------------+         +----------------------+
| User Service Pod     |         | Order Service Pod    |
|                      |         |                      |
| +------------------+ |         | +------------------+ |
| | User Service     | |         | | Order Service    | |
| +------------------+ |         | +------------------+ |
|          |           |         |          |           |
| localhost|           |         | localhost|           |
|          V           |         |          V           |
| +------------------+ | <-----> | +------------------+ |
| | Envoy Sidecar    | |         | | Envoy Sidecar    | |
| +------------------+ |         | +------------------+ |
+----------------------+         +----------------------+
```

All network traffic flows through the sidecar proxies.

---

# Responsibilities of a Service Mesh

A Service Mesh provides:

- Service Discovery
- Load Balancing
- Mutual TLS (mTLS)
- Authentication
- Authorization
- Traffic Routing
- Retry Policies
- Circuit Breaker
- Rate Limiting
- Distributed Tracing
- Logging
- Metrics Collection
- Fault Injection
- Canary Deployment
- Blue-Green Deployment

---

# Components of a Service Mesh

## 1. Data Plane

The **Data Plane** consists of sidecar proxies (usually Envoy) that intercept all incoming and outgoing traffic.

Responsibilities:

- Forward requests
- Encrypt traffic
- Retry failed requests
- Collect metrics
- Apply routing rules

Example:

```
Application

↓

Envoy Proxy

↓

Network
```

---

## 2. Control Plane

The **Control Plane** manages and configures all sidecar proxies.

Responsibilities:

- Service discovery
- Security policies
- Traffic rules
- Certificate management
- Configuration updates

Example:

```
              Control Plane
                   |
     ------------------------------
     |             |             |
 Envoy A       Envoy B      Envoy C
```

---

# Real-World Example

Suppose an **Order Service** calls a **Payment Service**.

Without a Service Mesh:

```
Order Service

↓

Payment Service
```

The Order Service must handle:

- TLS
- Retries
- Timeouts
- Logging
- Metrics

---

With a Service Mesh:

```
Order Service

↓

Envoy Proxy

↓

Envoy Proxy

↓

Payment Service
```

The proxies handle networking features automatically.

---

# Traffic Flow

```
Client

↓

User Service

↓

Envoy Proxy

↓

Network

↓

Envoy Proxy

↓

Order Service
```

Applications never communicate directly.

---

# Service Mesh Features

## Load Balancing

```
Payment Service

Instance 1

Instance 2

Instance 3
```

Requests are automatically distributed among instances.

---

## Automatic Retries

If a request fails:

```
Attempt 1

↓

Failed

↓

Retry Automatically

↓

Success
```

---

## Circuit Breaker

If a service becomes unhealthy:

```
Payment Service

Unavailable

↓

Circuit Opens

↓

Requests are blocked temporarily
```

This prevents cascading failures.

---

## Mutual TLS (mTLS)

Every service communication is encrypted.

```
User Service

⇄ Secure TLS Connection ⇄

Order Service
```

No application code changes are required.

---

## Observability

The Service Mesh automatically collects:

- Request count
- Error rate
- Latency
- Response time
- CPU usage
- Memory usage

These metrics are commonly visualized using:

- Prometheus
- Grafana
- Jaeger

---

# Popular Service Mesh Technologies

| Technology | Description |
|------------|-------------|
| Istio | Most popular Service Mesh for Kubernetes |
| Linkerd | Lightweight and easy to operate |
| Consul Connect | Service networking by HashiCorp |
| Kuma | Service Mesh built on Envoy |
| AWS App Mesh | Managed Service Mesh on AWS |

---

