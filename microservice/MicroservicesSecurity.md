# Microservices Security

## What is Microservices Security?

**Microservices Security** is the practice of protecting each microservice, its APIs, communication channels, data, and infrastructure from unauthorized access and cyber attacks.

Unlike a monolithic application, where security is often centralized, **each microservice must be secured independently** because services communicate over a network.

---

# Why Do We Need Microservices Security?

Consider an E-commerce application:

```
                 Client
                    |
                    |
             API Gateway
                    |
    ---------------------------------------
    |             |            |          |
 User Service  Order Service Payment Service Product Service
                    |
                 PostgreSQL
```

If one service is compromised, attackers may gain access to other services if proper security measures are not implemented.

Security should exist at every layer.

---

# Security Layers in Microservices

```
                 Internet
                     |
              Firewall / WAF
                     |
              Load Balancer
                     |
               API Gateway
                     |
       --------------------------------
       |              |              |
 Authentication   Authorization   Rate Limiting
                     |
               Microservices
                     |
      Service-to-Service Security
                     |
               Database Security
```

---

# 1. Authentication

Authentication verifies **who the user is**.

Common methods:

- JWT (JSON Web Token)
- OAuth 2.0
- OpenID Connect (OIDC)
- API Keys
- AWS Cognito
- Auth0
- Keycloak

Example:

```
User Login

↓

Authentication Service

↓

JWT Token

↓

Client
```

The client includes the JWT token in every request.

```
Authorization: Bearer <JWT_TOKEN>
```

---

# 2. Authorization

Authorization determines **what the authenticated user is allowed to do**.

Example:

```
Admin

↓

Create Product
```

```
Customer

↓

View Product
```

Role-Based Access Control (RBAC):

| Role | Permission |
|------|------------|
| Admin | CRUD Operations |
| Customer | Read Products |
| Seller | Manage Own Products |

---

# 3. API Gateway Security

All external traffic should pass through an API Gateway.

Responsibilities:

- JWT validation
- Rate limiting
- Authentication
- Request routing
- SSL termination
- IP filtering
- Request logging

Example:

```
Client

↓

API Gateway

↓

Order Service
```

Examples:

- Kong
- NGINX
- AWS API Gateway
- Spring Cloud Gateway

---

# 4. Service-to-Service Authentication

Microservices should not trust each other automatically.

Secure communication using:

- Mutual TLS (mTLS)
- Service Mesh (Istio, Linkerd)
- Service Accounts
- OAuth 2.0 Client Credentials

Example:

```
Order Service

⇄ mTLS ⇄

Payment Service
```

---

# 5. HTTPS / TLS Encryption

Always encrypt data in transit.

```
Client

↓

HTTPS

↓

API Gateway

↓

HTTPS

↓

Microservices
```

Never expose HTTP in production.

---

# 6. Mutual TLS (mTLS)

Both client and server authenticate each other.

```
Order Service

⇄ Encrypted Connection ⇄

Payment Service
```

Benefits:

- Encryption
- Identity verification
- Prevents impersonation

---

# 7. Secrets Management

Never hardcode:

- Database passwords
- JWT secrets
- API keys
- AWS credentials

Store secrets in:

- Kubernetes Secrets
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault

Example:

```
Application

↓

Secrets Manager

↓

Database Password
```

---

# 8. Database Security

Best practices:

- Encrypt data at rest
- Enable SSL connections
- Use least-privilege database users
- Rotate passwords regularly
- Enable database auditing

Example:

```
Application

↓

Read-Only User

↓

Database
```

---

# 9. API Rate Limiting

Prevent abuse and DDoS attacks.

Example:

```
100 Requests / Minute
```

If exceeded:

```
HTTP 429

Too Many Requests
```

Tools:

- Kong
- NGINX
- AWS API Gateway

---

# 10. Input Validation

Never trust client input.

Example:

```
POST /users
```

Validate:

- Email
- Password
- Mobile Number
- IDs

Protect against:

- SQL Injection
- NoSQL Injection
- XSS
- Command Injection

---

# 11. Logging & Auditing

Log:

- Login attempts
- Failed authentication
- Sensitive operations
- Permission changes
- API access

Example:

```
2026-06-29

User 101

Deleted Product 500
```

---

# 12. Monitoring

Monitor:

- Failed logins
- Unauthorized requests
- High error rates
- Suspicious traffic
- API latency

Tools:

- Prometheus
- Grafana
- ELK Stack
- CloudWatch

---

# 13. Network Security

Restrict communication.

Example:

```
Order Service

↓

Payment Service

✓ Allowed
```

```
Internet

↓

Payment Service

✗ Blocked
```

Use:

- Kubernetes Network Policies
- AWS Security Groups
- Firewalls

---

# 14. Security Headers

Use HTTP security headers:

```
Content-Security-Policy

Strict-Transport-Security

X-Frame-Options

X-Content-Type-Options
```

---

# 15. Dependency Security

Regularly scan third-party packages.

Node.js:

```
npm audit
```

Other tools:

- Snyk
- Dependabot
- Trivy
- OWASP Dependency-Check

---

# 16. Container Security

Before deployment:

- Scan Docker images
- Use minimal base images
- Run as non-root user
- Remove unused packages

Tools:

- Trivy
- Docker Scout
- Clair

---

# 17. Kubernetes Security

Secure:

- RBAC
- Secrets
- Network Policies
- Pod Security Standards
- Admission Controllers

Example:

```
Developer

↓

Limited Kubernetes Permissions
```

---

# 18. Service Mesh Security

Using Istio or Linkerd:

Provides:

- mTLS
- Traffic encryption
- Authentication
- Authorization
- Traffic policies

without changing application code.

---

# Security Architecture

```
                Internet
                    |
              Firewall / WAF
                    |
             Load Balancer
                    |
              API Gateway
                    |
          JWT Authentication
                    |
       ----------------------------------
       |          |          |          |
 User     Order    Payment   Product
 Service  Service  Service   Service
       |          |          |
       -------- mTLS ---------
                    |
             PostgreSQL
                    |
             Encrypted Storage
```

---

# Common Security Threats

| Threat | Prevention |
|---------|------------|
| SQL Injection | Parameterized Queries |
| XSS | Input Validation & Output Encoding |
| CSRF | CSRF Tokens |
| DDoS | Rate Limiting & WAF |
| Credential Theft | MFA & Secure Password Policies |
| Unauthorized Access | JWT + RBAC |
| Data Leakage | Encryption |
| Container Escape | Least Privilege & Image Scanning |

---

# Best Practices

- Use HTTPS everywhere.
- Implement JWT or OAuth 2.0 authentication.
- Apply RBAC or ABAC for authorization.
- Enable mTLS for service-to-service communication.
- Store secrets securely.
- Encrypt data in transit and at rest.
- Validate all user input.
- Implement API rate limiting.
- Scan dependencies and container images regularly.
- Enable centralized logging and monitoring.
- Follow the Principle of Least Privilege.
- Keep software updated with security patches.

---

# Real-World Example

### E-commerce Application

```
Client

↓

API Gateway

↓

JWT Authentication

↓

Order Service

↓

mTLS

↓

Payment Service

↓

Encrypted PostgreSQL
```

Security Features:

- JWT Authentication
- RBAC Authorization
- HTTPS
- mTLS
- API Rate Limiting
- Secrets Manager
- Prometheus Monitoring
- ELK Logging

---

# Interview Answer (2 Minutes)

> **Microservices Security** is the process of securing each microservice, its APIs, communication channels, and data. Unlike monolithic applications, every microservice communicates over a network, so security must be applied at multiple layers. This includes authentication using JWT or OAuth 2.0, authorization using RBAC, HTTPS and mutual TLS (mTLS) for encrypted communication, API Gateway security, secrets management with tools like HashiCorp Vault or AWS Secrets Manager, rate limiting, input validation, centralized logging, monitoring, and network policies. In Kubernetes, Service Mesh technologies such as Istio provide mTLS and traffic security automatically. The goal is to ensure confidentiality, integrity, and availability while preventing unauthorized access and attacks.

---

# Key Interview Points

- Authentication (JWT, OAuth 2.0, OIDC)
- Authorization (RBAC, ABAC)
- API Gateway security
- HTTPS and mTLS
- Service-to-service authentication
- Secrets management
- API rate limiting
- Input validation
- Logging and monitoring
- Database encryption
- Container and Kubernetes security
- Service Mesh (Istio, Linkerd)

---

# Summary

**Microservices Security** is a layered approach to protecting distributed applications. It secures users, APIs, inter-service communication, infrastructure, containers, databases, and cloud resources using authentication, authorization, encryption, monitoring, and network controls. A well-secured microservices architecture minimizes attack surfaces while maintaining scalability and reliability.