# API Gateway Interview Questions

## API Gateway Basics

1. **What is Amazon API Gateway?** *Answer:* API Gateway is a fully managed service for creating, publishing, maintaining, monitoring, and securing REST, HTTP, and WebSocket APIs. It acts as the "front door" for applications to access backend services (Lambda, EC2, ECS, other HTTP endpoints). It handles traffic management, authorization, throttling, monitoring, and API versioning.

2. **What are the three types of APIs in API Gateway?** *Answer:*
   - **REST API:** Feature-rich API with usage plans, API keys, custom authorizers, request/response transformations, caching, and AWS WAF integration. More expensive and complex.
   - **HTTP API:** Simpler, faster, and up to 71% cheaper than REST API. Supports Lambda, HTTP backends, JWT authorizers, OIDC/OAuth 2.0. Best for most use cases unless you need REST-specific features.
   - **WebSocket API:** Two-way real-time communication between clients and server (chat apps, live dashboards, multiplayer games). Maintains persistent connections.

3. **What is the difference between REST API and HTTP API in API Gateway?** *Answer:*
   | Feature | REST API | HTTP API |
   |---|---|---|
   | Cost | Higher (~$3.50/million) | Lower (~$1/million) |
   | Caching | Yes | No |
   | Usage Plans / API Keys | Yes | No |
   | AWS WAF | Yes | No |
   | Custom Domain | Yes | Yes |
   | Lambda Proxy | Yes | Yes |
   | JWT Authorizers | No (use Lambda) | Yes (built-in) |
   | Private integrations | Yes | Yes |

4. **What are the integration types in API Gateway?** *Answer:*
   - **Lambda Proxy:** Entire request forwarded to Lambda as an event. Lambda returns the full HTTP response. Simplest for Lambda.
   - **Lambda Custom:** You control the mapping between the HTTP request and the Lambda event using Velocity templates.
   - **HTTP Proxy:** Forwards request as-is to an HTTP endpoint.
   - **HTTP Custom:** You transform request/response with mapping templates.
   - **AWS Service:** Directly integrate with AWS services (DynamoDB, SQS, Step Functions) without Lambda.
   - **Mock:** Returns a response without calling any backend. Useful for testing.

5. **What is a Stage in API Gateway?** *Answer:* A Stage is a named reference to a deployment (e.g., `dev`, `staging`, `prod`). Stages allow you to run multiple environments from the same API. Each stage has its own URL, settings (throttling, logging, caching), and can have stage variables (like environment-specific Lambda ARNs or database endpoints).

---

## Authorization & Security

6. **What are the authorization options in API Gateway?** *Answer:*
   - **IAM Authorization:** Clients sign requests with AWS Signature v4. Validates against IAM policies. Best for internal AWS services and machine-to-machine communication.
   - **Cognito User Pool Authorizer (REST API):** Validates JWT tokens issued by Cognito. Simple for user-facing APIs.
   - **JWT Authorizer (HTTP API):** Validates JWTs from any OIDC-compliant provider (Cognito, Auth0, Okta). Checks issuer, audience, and signature.
   - **Lambda Authorizer (Custom):** A Lambda function validates any token/header and returns an IAM policy. Most flexible — supports any auth scheme (API keys, OAuth, custom headers).

7. **What is a Lambda Authorizer?** *Answer:* A Lambda Authorizer (formerly Custom Authorizer) is a Lambda function you write to validate the incoming token and return an IAM policy document. Two types:
   - **Token-based:** Receives a bearer token (e.g., JWT, OAuth token) in the Authorization header.
   - **Request-based:** Receives the full request context (headers, query params, stage variables) — for cookie-based auth or complex validation.
   API Gateway caches the resulting policy for a configurable TTL (0-3600 seconds) to reduce Lambda invocations.

8. **What is API Gateway Resource Policy?** *Answer:* A Resource Policy is a JSON policy attached to a REST API that controls which principals can invoke the API. Use cases:
   - Restrict API access to specific IP ranges
   - Allow cross-account access (only specific AWS accounts can call the API)
   - Allow access only from specific VPCs (private APIs)
   Resource policies work alongside authorization — both must allow the request.

9. **What is a Private API in API Gateway?** *Answer:* A Private API is accessible only from within a VPC via a VPC Endpoint (Interface Endpoint for `execute-api`). It is not accessible over the internet. Use for internal microservices that should never be exposed publicly. You control which VPCs can access it via the Resource Policy.

10. **How do you protect API Gateway from abuse?** *Answer:*
    - **Throttling:** Set default (10,000 RPS) and burst limits (5,000). Configure per-route limits.
    - **Usage Plans + API Keys:** Define request quotas (per day/week/month) and rate limits per customer API key.
    - **WAF:** Attach AWS WAF to filter SQL injection, XSS, bot traffic, IP reputation lists.
    - **Cognito/JWT Authorizer:** Ensure only authenticated users can call APIs.
    - **Lambda Authorizer:** Custom validation logic.

---

## Performance & Deployment

11. **What is API Gateway Caching?** *Answer:* API Gateway REST APIs can cache backend responses to reduce latency and backend load. You enable caching per stage with a TTL (default 300 seconds, 0-3600). Cache capacity: 0.5 GB to 237 GB. Caching is per method (GET by default). Cache can be invalidated by a client sending `Cache-Control: max-age=0` (if you allow it).

12. **What is API Gateway throttling?** *Answer:* Throttling limits the rate of API requests to protect backend services. Limits:
    - **Account-level:** 10,000 req/sec (soft limit), burst up to 5,000
    - **Stage/method-level:** Override per stage or individual method
    - **Usage Plan:** Per-key rate limits for different customers
    When throttled, API Gateway returns HTTP 429 (Too Many Requests). Configure exponential backoff in clients.

13. **What is a Canary Deployment in API Gateway?** *Answer:* Canary deployments let you shift a percentage of production traffic to a new API deployment for testing. Example: send 10% of traffic to the new stage, monitor for errors, then promote to 100%. You define the canary percentage and stage variables in the deployment settings. The canary and production share the same stage but use different Lambda versions.

14. **What are Stage Variables in API Gateway?** *Answer:* Stage variables are key-value pairs you define per stage (like environment variables). They can be referenced in integration URIs (e.g., use different Lambda aliases per stage: `my-function:${stageVariables.lambdaAlias}`), mapping templates, and access logs. This allows one API definition to point to different backends across dev/staging/prod.

---

## WebSocket & Advanced

15. **What is a WebSocket API in API Gateway?** *Answer:* WebSocket APIs maintain persistent, stateful connections between clients and the server. API Gateway manages connections and routes messages to backends (Lambda, HTTP). Three system routes:
    - **$connect:** When a client establishes a WebSocket connection
    - **$disconnect:** When a connection closes
    - **$default:** For messages that don't match a custom route
    Backends can push messages to clients at any time using the Connection URL and the client's connection ID.

16. **What is API Gateway Request Validation?** *Answer:* API Gateway can validate incoming requests against a model (JSON Schema) before forwarding to the backend. It validates: request body, query string parameters, headers. Invalid requests are rejected with 400 Bad Request — the backend never sees them. Reduces Lambda invocations for invalid requests and offloads input validation from your code.

17. **What is the maximum payload size for API Gateway?** *Answer:* API Gateway has a maximum payload size of 10 MB for request and response bodies for REST and HTTP APIs. For WebSocket APIs, the maximum frame/message size is 32 KB (128 KB for the total message). For large file uploads, use pre-signed S3 URLs instead — upload directly to S3 bypassing API Gateway.

18. **What is API Gateway Logging?** *Answer:* API Gateway supports two types of logging:
    - **Execution Logging:** Logs request/response details, authorizer results, and integration calls to CloudWatch Logs. Useful for debugging. Can log full request/response data (impacts performance).
    - **Access Logging:** Logs who called your API (custom format like JSON with fields like IP, method, status, latency). Similar to web server access logs. Used for analytics.

19. **How does API Gateway integrate with Lambda?** *Answer:* The two integration modes:
    - **Lambda Proxy Integration:** API Gateway passes the entire HTTP request to Lambda as a structured event (method, path, headers, body, query params, stage variables). Lambda returns a response object with statusCode, headers, and body. Simple and flexible — most common approach.
    - **Lambda Non-Proxy (Custom):** You write Velocity Template Language (VTL) mapping templates to transform the request before passing to Lambda and transform Lambda's response before sending to the client.

20. **What is the difference between API Gateway and ALB for routing traffic to Lambda?** *Answer:*
    | | API Gateway | ALB |
    |---|---|---|
    | Features | Auth, throttling, caching, WAF, usage plans | Simple HTTP routing |
    | Cost | Per request + data | Per LCU (hour-based) |
    | Protocols | REST, HTTP, WebSocket | HTTP/HTTPS |
    | Best for | Public APIs with auth, quotas, monitoring | High-volume, simple routing; VPC-internal services |
    | Response streaming | No | No |
    Use API Gateway for API management features; use ALB when you need high throughput at lower cost with simpler routing.
