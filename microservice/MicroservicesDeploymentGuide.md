# Microservices Deployment Guide (Step-by-Step)

# 1. Deployment Overview

A typical production microservices deployment looks like this:

```text
                        Users
                          |
                          |
                    CloudFront/CDN
                          |
                     Load Balancer
                          |
                     API Gateway
                          |
       ------------------------------------------------
       |              |              |                |
 User Service   Order Service   Payment Service   Product Service
       |              |              |                |
       ------------------------------------------------
                          |
                    Message Broker
                     (Kafka/RabbitMQ)
                          |
                   Background Workers
                          |
       ------------------------------------------------
       |              |               |
 PostgreSQL      Redis Cache      Elasticsearch
                          |
                     Monitoring
          Prometheus + Grafana + ELK + Jaeger
```

---

# 2. What Do You Need Before Deployment?

## Source Code

```
GitHub
GitLab
Bitbucket
```

---

## Containerization

Every microservice should have:

```
Dockerfile
```

Example:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm","start"]
```

---

## Environment Variables

Never hardcode credentials.

Example:

```env
PORT=3000

DATABASE_URL=postgres://...

JWT_SECRET=xxxx

REDIS_URL=redis://...

KAFKA_BROKER=...

AWS_ACCESS_KEY=...

AWS_SECRET_KEY=...
```

---

## Reverse Proxy

Usually:

- NGINX
- Traefik
- HAProxy

---

## Database

Examples:

- PostgreSQL
- MySQL
- MongoDB

---

## Cache

```
Redis
```

---

## Message Broker

Examples:

```
Kafka

RabbitMQ

AWS SQS
```

---

## Storage

Examples:

```
Amazon S3

Azure Blob Storage

MinIO
```

---

## Monitoring

Need:

```
Prometheus

Grafana

Jaeger

ELK Stack
```

---

## CI/CD

Examples:

```
GitHub Actions

GitLab CI

Jenkins

Azure DevOps
```

---

# 3. Step-by-Step Deployment Process

---

## Step 1

Write your microservice.

Example:

```
Order Service

Payment Service

User Service
```

---

## Step 2

Create Dockerfile

Example:

```dockerfile
FROM node:20

WORKDIR /app

COPY . .

RUN npm install

CMD ["npm","start"]
```

---

## Step 3

Build Docker Image

```bash
docker build -t order-service .
```

---

## Step 4

Run Container Locally

```bash
docker run -p 3000:3000 order-service
```

Verify:

```
localhost:3000
```

---

## Step 5

Push Image

Example:

```
Docker Hub

Amazon ECR

Azure ACR

Google Artifact Registry
```

```bash
docker push myrepo/order-service:v1
```

---

## Step 6

Provision Infrastructure

Examples:

```
AWS EC2

EKS

GKE

AKS

DigitalOcean

Azure VM
```

---

## Step 7

Deploy Database

Example:

```
PostgreSQL

MongoDB
```

Production best practices:

```
Managed Database

Amazon RDS

Cloud SQL

Azure Database
```

---

## Step 8

Deploy Redis

```
Redis

Elasticache
```

---

## Step 9

Deploy Kafka/RabbitMQ

Example:

```
Kafka Cluster

RabbitMQ Cluster
```

---

## Step 10

Deploy Microservices

Example:

```
User Service

↓

Order Service

↓

Payment Service

↓

Notification Service
```

---

## Step 11

Configure Service Discovery

Examples:

```
Kubernetes DNS

Consul

Eureka
```

---

## Step 12

Deploy API Gateway

Examples:

```
Kong

NGINX

Spring Cloud Gateway

AWS API Gateway
```

---

## Step 13

Configure Load Balancer

Examples:

```
AWS ALB

NGINX

HAProxy
```

---

## Step 14

Configure HTTPS

Install SSL.

Examples:

```
Let's Encrypt

AWS ACM
```

---

## Step 15

Deploy Monitoring

Install:

```
Prometheus

↓

Grafana

↓

Jaeger

↓

ELK
```

---

## Step 16

Deploy Logging

```
Fluent Bit

↓

ElasticSearch

↓

Kibana
```

---

## Step 17

Configure Autoscaling

Example:

```
CPU > 70%

↓

Create New Pod
```

---

## Step 18

Configure Health Checks

```
/health

/ready

/live
```

Kubernetes uses these endpoints.

---

## Step 19

Configure CI/CD

Pipeline:

```
Git Push

↓

Run Tests

↓

Build Docker

↓

Push Image

↓

Deploy Kubernetes

↓

Smoke Test
```

---

## Step 20

Production Deployment

Strategies:

```
Rolling Deployment

Blue-Green

Canary
```

---

# Kubernetes Deployment Flow

```
Developer

↓

Git Push

↓

GitHub Actions

↓

Build Docker Image

↓

Push to Docker Registry

↓

Kubernetes Deployment

↓

Pods Created

↓

Service

↓

Ingress

↓

Users
```

---

# Deployment Architecture

```text
                    Internet
                        |
                 Load Balancer
                        |
                  API Gateway
                        |
----------------------------------------------------------
|        |          |          |          |              |
User   Order     Payment   Product   Notification   Inventory
Svc    Svc         Svc        Svc         Svc          Svc
|        |          |          |          |              |
----------------------------------------------------------
           |          |             |
      PostgreSQL    Redis       Kafka
                |
      -------------------------
      |          |            |
 Prometheus  Grafana      Jaeger
```

---

# Files Required

```
Dockerfile

docker-compose.yml

.env

nginx.conf

deployment.yaml

service.yaml

ingress.yaml

configmap.yaml

secret.yaml

hpa.yaml

github-actions.yml
```

---

# Example Folder Structure

```text
order-service/

│

├── src/

├── Dockerfile

├── .dockerignore

├── package.json

├── .env

├── deployment.yaml

├── service.yaml

├── ingress.yaml

├── configmap.yaml

├── secret.yaml

└── README.md
```

---

# AWS Deployment Example

```
GitHub

↓

GitHub Actions

↓

Amazon ECR

↓

Amazon EKS

↓

Application Load Balancer

↓

Microservices

↓

Amazon RDS

↓

Amazon ElastiCache

↓

Amazon MSK (Kafka)

↓

CloudWatch
```

---

# Best Practices

- Use Docker for every microservice.
- Use Kubernetes for orchestration.
- Store secrets in Kubernetes Secrets or AWS Secrets Manager.
- Never hardcode credentials.
- Use health checks (`/health`, `/ready`, `/live`).
- Enable autoscaling (HPA).
- Use centralized logging (ELK/Loki).
- Monitor with Prometheus and Grafana.
- Trace requests with Jaeger or OpenTelemetry.
- Use API Gateway for external traffic.
- Use Service Mesh (Istio/Linkerd) for advanced networking if needed.
- Automate deployments with CI/CD.
- Use rolling or canary deployments to reduce downtime.
- Regularly back up databases.

---

# Common Interview Question

### Q: How would you deploy a Node.js microservice to production?

### Answer:

1. Develop the microservice.
2. Create a Dockerfile and containerize the application.
3. Push the Docker image to a registry (Docker Hub, Amazon ECR, etc.).
4. Provision infrastructure (Kubernetes, EKS, AKS, GKE, or VMs).
5. Deploy databases, Redis, and Kafka/RabbitMQ.
6. Deploy the microservice using Kubernetes Deployments.
7. Expose it with a Kubernetes Service and Ingress or an API Gateway.
8. Configure SSL, environment variables, and secrets.
9. Enable health checks, autoscaling, and monitoring.
10. Set up a CI/CD pipeline for automated builds and deployments.
11. Validate the deployment with smoke tests and monitor logs, metrics, and traces.

---

# Summary

Deploying microservices involves much more than running application code. A production-ready deployment includes **containerization (Docker)**, **orchestration (Kubernetes)**, **networking (Ingress/API Gateway)**, **databases**, **caching**, **message brokers**, **monitoring**, **logging**, **security**, **CI/CD**, and **autoscaling**. Following these steps results in a scalable, resilient, and maintainable microservices platform.