
<img width="2914" height="1552" alt="image" src="https://github.com/user-attachments/assets/7b1e7e64-94d6-450e-ae1a-6a2fb5ac90e9" />

<img width="2934" height="1624" alt="image" src="https://github.com/user-attachments/assets/6e40be4a-6b2a-44f2-96f4-da7742baea63" />
<img width="2936" height="1538" alt="image" src="https://github.com/user-attachments/assets/3afaadcf-9aae-4727-9cd5-64551fbaa264" />
<img width="2920" height="1628" alt="image" src="https://github.com/user-attachments/assets/73feb2f4-5d17-4857-bd82-30986a08d90c" />
<img width="2288" height="1272" alt="image" src="https://github.com/user-attachments/assets/cb3212a2-5844-421a-b4ed-a73c69eeae29" />
<img width="2924" height="1554" alt="image" src="https://github.com/user-attachments/assets/50724a1e-9450-475a-bed7-503fd9de04cb" />
<img width="2932" height="1574" alt="image" src="https://github.com/user-attachments/assets/1c3502cf-b87d-423c-9078-2e1732fde39a" />
<img width="2930" height="1626" alt="image" src="https://github.com/user-attachments/assets/3b4bc71e-d182-4ae1-844d-83cbe4384de1" />
<img width="1822" height="1006" alt="image" src="https://github.com/user-attachments/assets/b46327f0-be97-4210-bf43-1461b89a8232" />
<img width="1820" height="998" alt="image" src="https://github.com/user-attachments/assets/fe06f6a1-386b-4f7c-a835-23b55274d190" />
<img width="2350" height="1556" alt="image" src="https://github.com/user-attachments/assets/0fb95e27-b450-4bee-8eb6-84097f595094" />
<img width="2936" height="1556" alt="image" src="https://github.com/user-attachments/assets/97d8ef9a-9547-408a-aa17-84096e0f9448" />
<img width="1818" height="1002" alt="image" src="https://github.com/user-attachments/assets/d4a265fa-6513-4b99-9b7a-ef16819e8538" />
<img width="2924" height="1534" alt="image" src="https://github.com/user-attachments/assets/16ae5f30-4e40-430d-9930-cdefbdf9f514" />
<img width="2932" height="1552" alt="image" src="https://github.com/user-attachments/assets/3b697b98-9d07-4548-96ab-912dc59817a1" />
<img width="1828" height="1000" alt="image" src="https://github.com/user-attachments/assets/624734a0-c51a-4b1d-98b7-5092240d1d7a" />
<img width="1718" height="954" alt="image" src="https://github.com/user-attachments/assets/b96f6f48-6053-43a6-8b32-37d337e53fb9" />

### 1. What is CloudFront?
Amazon CloudFront is a Content Delivery Network (CDN) service that distributes content globally through a network of edge locations, reducing latency by serving requests from the location closest to the user.

**Why it exists:** 
Without a CDN, every request travels to your origin server (e.g., S3 in us-east-1). A user in Mumbai hitting a server in Virginia adds ~200ms of network latency alone. CloudFront caches content at ~450+ edge locations worldwide.
What it serves:

- Static assets (HTML, CSS, JS, images, fonts)
- Videos (HLS/DASH streaming)
- APIs (REST, GraphQL)
- Dynamic content (with cache bypass)
- Software downloads

**Key benefits:**

- Low latency (edge caching)
- High availability (automatic failover)
- DDoS protection (integrated with AWS Shield Standard for free)
- Cost reduction (fewer origin requests = lower compute/bandwidth costs)


# ☁️ AWS Services — Quick Reference

A concise reference guide for 18 core AWS services, grouped by category.

---

## ⚡ Compute

### 🟠 Lambda
**Serverless Function Execution**
Run code without managing servers. Executes functions in response to events (HTTP requests, S3 uploads, DynamoDB streams, etc.). You pay only for the compute time your code consumes — no idle cost.
- **Use when:** Event-driven tasks, microservices, scheduled jobs
- **Key concept:** Max 15-min execution, stateless by design

---

### 🟠 Fargate
**Serverless Container Engine**
Run Docker containers without provisioning or managing EC2 instances. Works with both ECS and EKS. You define CPU and memory; AWS handles the underlying infrastructure.
- **Use when:** Containerized apps without wanting to manage servers
- **Key concept:** No cluster management, pay per task

---

### 🟠 App Runner
**Deploy Web Apps Instantly**
Fully managed service to deploy web apps and APIs directly from source code (GitHub) or a container image. Handles load balancing, auto-scaling, TLS, and health checks automatically.
- **Use when:** Rapid deployment of HTTP services without DevOps overhead
- **Key concept:** Source-to-URL in minutes

---

## 🌐 Networking

### 🟣 API Gateway
**Managed API Front Door**
Create, publish, secure, and monitor REST, HTTP, and WebSocket APIs at any scale. Acts as the entry point for backend services like Lambda, EC2, or any HTTP endpoint.
- **Use when:** Exposing backend services as APIs
- **Key concept:** Supports REST, HTTP, and WebSocket protocols

---

### 🟣 AppSync
**Managed GraphQL & Real-Time API**
Build GraphQL APIs that connect to DynamoDB, Lambda, RDS, and more. Supports real-time data subscriptions and offline data sync for mobile/web apps.
- **Use when:** GraphQL APIs, real-time updates, offline-first apps
- **Key concept:** Subscriptions push live data to clients

---

## 🗄️ Database

### 🟣 DynamoDB
**Serverless NoSQL Database**
Fully managed key-value and document database delivering single-digit millisecond performance at any scale. Automatically scales throughput and storage with zero downtime.
- **Use when:** High-traffic apps, session storage, shopping carts, leaderboards
- **Key concept:** Partition key + optional sort key; on-demand or provisioned capacity

---

## 🔗 Integration & Workflow

### 🩷 EventBridge
**Serverless Event Bus**
Routes events between AWS services, SaaS apps (Salesforce, Zendesk, etc.), and custom apps. Define rules to filter and route events to targets like Lambda, SQS, or Step Functions.
- **Use when:** Decoupled event-driven architectures, SaaS integrations
- **Key concept:** Schema registry + rule-based routing

---

### 🩷 Step Functions
**Visual Workflow Orchestration**
Coordinate multiple AWS services into reliable serverless workflows using state machines defined in JSON/YAML. Handles retries, error handling, and parallel execution.
- **Use when:** Multi-step workflows, order processing, data pipelines
- **Key concept:** States: Task, Choice, Parallel, Wait, Map

---

## 📨 Messaging

### 🩷 Amazon SNS
**Pub/Sub Notification Service**
Fan-out messages to multiple subscribers simultaneously. Publishers send to a "topic"; subscribers (Lambda, SQS, email, SMS, HTTP endpoints) receive copies of every message.
- **Use when:** Broadcast notifications, fan-out to multiple services
- **Key concept:** Push-based; one message → many consumers

---

### 🩷 Amazon SQS
**Managed Message Queue**
Decouple and scale microservices with a fully managed message queue. Producers push messages; consumers poll and process them at their own pace. Guarantees at-least-once delivery.
- **Use when:** Async task processing, decoupling services, load leveling
- **Key concept:** Standard (best-effort order) vs FIFO (strict order, exactly-once)

---

## 🔐 Security & Identity

### 🔴 Cognito
**User Authentication & Authorization**
Manages user sign-up, sign-in, and access control. Supports OAuth 2.0, SAML, social login (Google, Facebook), MFA, and issues JWT tokens for your apps.
- **Use when:** App user authentication, federated identity, token-based auth
- **Key concept:** User Pools (auth) + Identity Pools (AWS credentials)

---

## 🗂️ Storage

### 🟢 Amazon S3
**Object Storage Service**
Store and retrieve any amount of data — files, images, videos, backups, static websites. Offers 11 nines (99.999999999%) durability with multiple storage classes for cost optimization.
- **Use when:** File storage, data lakes, static hosting, backups
- **Key concept:** Buckets + objects; lifecycle policies for cost management

---

### 🟢 Amazon EFS
**Elastic Shared File System**
Fully managed NFS file system for Linux workloads. Automatically grows and shrinks as you add/remove files. Can be mounted concurrently by thousands of EC2 instances or containers.
- **Use when:** Shared file storage across multiple servers/containers
- **Key concept:** POSIX-compliant; scales automatically; higher cost than S3

---

## 📊 Analytics

### 🟣 Athena
**Serverless SQL on S3**
Run standard SQL queries directly on data stored in S3 — CSV, JSON, Parquet, ORC — without loading it into a database. Pay only per query (per TB scanned).
- **Use when:** Ad-hoc analysis on S3 data, log analysis, cost-effective BI
- **Key concept:** Uses Apache Presto under the hood; works with AWS Glue catalog

---

### 🟣 Kinesis
**Real-Time Data Streaming**
Ingest, buffer, and process streaming data in real time — application logs, IoT sensor data, clickstreams, financial transactions. Retains data for up to 365 days.
- **Use when:** Real-time analytics, log ingestion, live dashboards
- **Key concept:** Kinesis Data Streams (custom processing) vs Firehose (managed delivery to S3/Redshift)

---

## 🔍 Observability

### 🟣 AWS X-Ray
**Distributed Tracing**
Trace requests as they travel through your microservices and serverless apps. Generates a service map showing latency, errors, and bottlenecks across Lambda, EC2, ECS, and more.
- **Use when:** Debugging latency/errors in distributed systems
- **Key concept:** Trace → Segments → Subsegments; sampling rules control cost

---

### 🩷 CloudWatch
**Monitoring & Observability Platform**
Unified monitoring for AWS resources. Collects logs, metrics, and events; creates dashboards and alarms; triggers automated actions via EventBridge or Lambda.
- **Use when:** Infrastructure monitoring, log aggregation, alerting
- **Key concept:** Metrics + Logs + Alarms + Dashboards; 15-month data retention

---

## 🚀 Deployment

### 🟠 Serverless Application Repository
**Reusable Serverless App Marketplace**
Discover, deploy, and publish serverless applications built on Lambda. Browse community or AWS-published components and deploy them into your account with one click.
- **Use when:** Reusing pre-built serverless components, sharing internal Lambda apps
- **Key concept:** SAM-based apps; public or private sharing

---

## 📌 Quick Comparison Table

| Service | Category | Serverless | Best For |
|---|---|---|---|
| Lambda | Compute | ✅ | Event-driven functions |
| Fargate | Compute | ✅ | Containerized apps |
| App Runner | Compute | ✅ | Web apps / APIs |
| API Gateway | Networking | ✅ | REST / WebSocket APIs |
| AppSync | Networking | ✅ | GraphQL APIs |
| DynamoDB | Database | ✅ | NoSQL at scale |
| EventBridge | Integration | ✅ | Event routing |
| Step Functions | Integration | ✅ | Workflow orchestration |
| SNS | Messaging | ✅ | Pub/Sub broadcast |
| SQS | Messaging | ✅ | Message queuing |
| Cognito | Security | ✅ | User auth & identity |
| S3 | Storage | ✅ | Object / file storage |
| EFS | Storage | ✅ | Shared file system |
| Athena | Analytics | ✅ | SQL on S3 |
| Kinesis | Analytics | ✅ | Real-time streaming |
| X-Ray | Observability | ✅ | Distributed tracing |
| CloudWatch | Observability | ✅ | Monitoring & alerts |
| Serverless App Repo. | Deployment | ✅ | Reusable Lambda apps |

---

*Last updated: 2025 | AWS Documentation: https://docs.aws.amazon.com*
