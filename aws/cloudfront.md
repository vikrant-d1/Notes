# CloudFront & Route 53 Interview Questions

## CloudFront Basics

1. **What is Amazon CloudFront?** *Answer:* CloudFront is AWS's Content Delivery Network (CDN). It distributes content globally through a network of 450+ edge locations, serving requests from the location closest to the user. This reduces latency, increases transfer speeds, and offloads traffic from your origin servers.

2. **What can CloudFront serve?** *Answer:*
   - Static files: HTML, CSS, JavaScript, images, fonts
   - Dynamic content: API responses, personalized pages
   - Video: live streaming (HLS) and on-demand (HLS/DASH)
   - Software downloads and large files
   - WebSocket connections

3. **What are CloudFront Origins?** *Answer:* An origin is where CloudFront fetches content when it's not in cache. Supported origins:
   - **S3 Bucket:** Serve static websites or files. Use Origin Access Control (OAC) to prevent direct S3 access.
   - **Custom HTTP Origin:** Any HTTP server — EC2, ALB, on-premises server, or third-party URL.
   - **API Gateway:** Serve APIs with CloudFront in front for caching and edge security.
   - **MediaStore/MediaPackage:** For video streaming workflows.

4. **How does CloudFront caching work?** *Answer:* When a user requests content, CloudFront checks the edge cache first. If found (cache hit), it serves from cache immediately. If not (cache miss), it fetches from the origin, serves the user, and caches it for the TTL duration. Cache behavior is controlled by Cache-Control and Expires headers from the origin, or CloudFront cache policies you define.

5. **What is a CloudFront Distribution?** *Answer:* A Distribution is the CloudFront configuration that links your domain to your origins and defines behaviors (caching, security, routing). Two types:
   - **Web Distribution:** For websites and APIs (HTTP/HTTPS). Most common.
   - **RTMP Distribution (legacy):** For Adobe Flash media streaming. Deprecated.

---

## Performance & Caching

6. **What is TTL in CloudFront?** *Answer:* TTL (Time To Live) determines how long CloudFront caches an object before requesting a fresh copy from the origin.
   - **Default TTL:** 86,400 seconds (24 hours)
   - **Min TTL:** 0 (re-validate every request)
   - **Max TTL:** 31,536,000 seconds (1 year)
   Set via Cache-Control headers from origin, or override with CloudFront cache policies.

7. **How do you invalidate CloudFront cache?** *Answer:* Cache invalidation removes objects from edge caches before TTL expires. You can invalidate specific paths (`/images/logo.png`) or wildcards (`/images/*` or `/*`). First 1,000 invalidation paths per month are free; additional paths cost $0.005 each. Alternative: use versioned file names (e.g., `style.v2.css`) to avoid invalidation altogether.

8. **What is CloudFront Cache Hit Ratio?** *Answer:* Cache Hit Ratio is the percentage of requests served from CloudFront's cache vs. forwarded to the origin. Higher ratio = better performance and lower origin load. Improve it by: setting appropriate TTLs, caching based on fewer headers/cookies/query strings, using separate distributions for static vs. dynamic content.

9. **What is Transfer Acceleration vs CloudFront?** *Answer:*
   - **CloudFront:** Caches content at edge for downloads. Best for globally serving static/dynamic content to many users.
   - **S3 Transfer Acceleration:** Accelerates file uploads to S3 using CloudFront edge locations. Data is uploaded to the nearest edge and forwarded over AWS's backbone to S3.

---

## Security

10. **How do you secure content with CloudFront?** *Answer:*
    - **HTTPS:** Enforce HTTPS with custom SSL certificate via ACM
    - **Origin Access Control (OAC):** Restrict S3 origin to only accept requests from CloudFront
    - **Signed URLs/Cookies:** Restrict access to authorized users
    - **WAF Integration:** Attach a Web ACL to block malicious requests
    - **Field-Level Encryption:** Encrypt sensitive form fields at the edge
    - **Geo Restriction:** Block or allow specific countries

11. **What are CloudFront Signed URLs vs Signed Cookies?** *Answer:*
    - **Signed URL:** Access to a single specific file. Contains expiration, IP restrictions. Best for distributing individual files (paid content downloads, temporary access links).
    - **Signed Cookie:** Access to multiple files under a pattern. Set once in the browser, applies to all matching requests. Best for subscribers accessing a protected section (premium video library, members-only area).

12. **What is Origin Access Control (OAC)?** *Answer:* OAC is the mechanism that ensures S3 bucket objects can only be accessed through CloudFront, not directly via the S3 URL. CloudFront signs requests to S3 using its service principal. The S3 bucket policy only allows requests signed by the specific CloudFront distribution. This prevents bypassing CloudFront (and its security policies/pricing) via direct S3 access.

---

## Route 53

13. **What is Amazon Route 53?** *Answer:* Route 53 is AWS's managed DNS (Domain Name System) service. It translates human-readable domain names into IP addresses. It also provides domain registration, health checks, and traffic routing policies. Named after port 53 (DNS port). It's a global, highly available service with 100% uptime SLA.

14. **What DNS record types does Route 53 support?** *Answer:*
    - **A Record:** Maps hostname to IPv4 address
    - **AAAA Record:** Maps hostname to IPv6 address
    - **CNAME:** Maps hostname to another hostname (cannot be used for root domain)
    - **Alias Record:** AWS-specific, maps hostname to an AWS resource (ALB, CloudFront, S3, etc.). Can be used for root domain. Free of charge.
    - **MX:** Mail server records
    - **TXT:** Text records (domain verification, SPF)
    - **NS:** Name server records

15. **What is the difference between a CNAME and an Alias Record?** *Answer:*
    | | CNAME | Alias |
    |---|---|---|
    | Root domain | Cannot use (e.g., example.com) | Yes, can use for root domain |
    | Target | Any hostname | AWS resources only |
    | DNS charge | Charged per query | Free for AWS targets |
    | TTL | Configurable | Managed by Route 53 |

16. **What are Route 53 Routing Policies?** *Answer:*
    - **Simple:** Single resource. No health checks. Basic DNS lookup.
    - **Weighted:** Distribute traffic by percentage across multiple resources. A/B testing, canary deploys.
    - **Latency-Based:** Route to the region with lowest latency for the user. Best for multi-region apps.
    - **Failover:** Active-passive setup with health checks. Routes to secondary if primary is unhealthy.
    - **Geolocation:** Route based on user's geographic location (country/continent). Content localization, compliance.
    - **Geoproximity:** Route based on distance from a bias point. Adjust traffic by expanding/shrinking the geographic area.
    - **Multi-Value:** Return multiple IPs, with health checks. Client-side load balancing. Not a replacement for ALB.

17. **What are Route 53 Health Checks?** *Answer:* Health Checks monitor endpoints (HTTP, HTTPS, TCP) and return their status. Route 53 uses health check results to route traffic away from unhealthy endpoints in routing policies that support it (Failover, Weighted, Latency, etc.). Health checks can also monitor CloudWatch alarms — useful for checking internal resources (databases, queues).

18. **What is Route 53 Resolver?** *Answer:* Route 53 Resolver is the DNS resolver built into every VPC. It resolves DNS queries for AWS resources (EC2 instances, RDS endpoints) and private hosted zones. Resolver Endpoints extend this to on-premises:
    - **Inbound Endpoint:** On-premises can resolve AWS resource names
    - **Outbound Endpoint:** VPC can forward DNS queries to on-premises DNS servers

19. **What is a Private Hosted Zone?** *Answer:* A Private Hosted Zone is a DNS namespace that resolves within one or more specific VPCs only. Resources in those VPCs can use names like `db.internal.mycompany.com` that resolve to private IPs, invisible to the public internet. Useful for internal service discovery and cleaner internal architecture.

20. **What is Route 53 Traffic Flow?** *Answer:* Traffic Flow is a visual editor for creating complex routing configurations using a combination of routing policies. You build a tree of rules — e.g., first check geolocation (serve EU users from Dublin), then check latency (for US users, pick us-east-1 or us-west-2), then apply weighted routing for canary deployments. More maintainable than creating many individual records.
