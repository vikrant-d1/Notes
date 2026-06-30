# Observability in Microservices

## What is Observability?

Observability is the ability to understand the internal state of a microservices system by analyzing **logs, metrics, and distributed traces**. It helps engineers monitor system health, troubleshoot issues, and identify the root cause of failures.

---

## Three Pillars of Observability

### 1. Logs
Logs are records of application events.

**Examples:**
- User login
- API requests
- Database errors
- Exception stack traces

**Tools:**
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Loki
- Fluentd

---

### 2. Metrics
Metrics are numerical measurements that indicate system health and performance.

**Examples:**
- CPU usage
- Memory usage
- Request count
- Response time (Latency)
- Error rate
- Throughput

**Tools:**
- Prometheus
- Grafana
- Datadog
- CloudWatch

---

### 3. Distributed Tracing
Distributed tracing tracks a request as it flows through multiple microservices.

**Example Flow:**

```
Client
   │
   ▼
API Gateway
   │
   ▼
User Service
   │
   ▼
Order Service
   │
   ▼
Payment Service
   │
   ▼
Notification Service
```

If the request fails or becomes slow, tracing identifies exactly which service caused the problem.

**Tools:**
- Jaeger
- Zipkin
- OpenTelemetry

---

## Popular Observability Stack

| Component | Popular Tools |
|-----------|---------------|
| Metrics | Prometheus, Grafana |
| Logging | ELK Stack, Loki |
| Tracing | Jaeger, Zipkin |
| Telemetry Collection | OpenTelemetry |

---

## Benefits

- Monitor application health in real time
- Detect failures quickly
- Reduce downtime
- Find root causes faster
- Improve performance
- Troubleshoot distributed systems efficiently

---

## Interview Answer (1 Minute)

Observability is the ability to understand the internal state of a microservices application using **logs, metrics, and distributed traces**. Logs capture application events, metrics monitor system performance like CPU usage, latency, and error rates, while traces show how a request travels across multiple services. Common tools include **Prometheus** and **Grafana** for metrics, **ELK Stack** or **Loki** for logging, **Jaeger** or **Zipkin** for tracing, and **OpenTelemetry** for telemetry collection. Observability enables teams to quickly detect issues, identify root causes, and ensure the reliability and performance of microservices.
