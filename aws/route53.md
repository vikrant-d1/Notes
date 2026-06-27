# Route 53 Interview Questions

## Route 53 Basics

1. **What is Amazon Route 53?** *Answer:* Route 53 is AWS's highly available and scalable cloud DNS (Domain Name System) web service. It translates human-readable domain names (example.com) into IP addresses. It also provides domain registration, DNS routing, and health checking of resources. Named after port 53 — the standard DNS port. It offers a 100% availability SLA for the DNS service.

2. **What are the core features of Route 53?** *Answer:*
   - **Domain Registration:** Buy and manage domain names directly in AWS
   - **DNS Resolution:** Authoritative DNS for your domains
   - **Health Checks:** Monitor endpoint availability
   - **Traffic Routing Policies:** Intelligent routing based on latency, geolocation, weights, etc.
   - **Private DNS:** Resolve names within VPCs only
   - **DNSSEC:** Domain Name System Security Extensions for signed zones

3. **What DNS record types does Route 53 support?** *Answer:*
   - **A:** Maps hostname → IPv4 address
   - **AAAA:** Maps hostname → IPv6 address
   - **CNAME:** Maps hostname → another hostname (cannot be used for zone apex/root domain)
   - **Alias:** AWS-specific. Maps hostname → AWS resource (ALB, CloudFront, S3, another Route 53 record). Works at zone apex. Free DNS queries.
   - **MX:** Mail exchange server
   - **TXT:** Text data (domain verification, SPF, DKIM)
   - **NS:** Name server records (which servers are authoritative for a domain)
   - **SOA:** Start of Authority — metadata about the DNS zone
   - **SRV:** Service location (port + hostname)
   - **CAA:** Certification Authority Authorization

4. **What is a Hosted Zone?** *Answer:* A Hosted Zone is a container for DNS records for a specific domain. Two types:
   - **Public Hosted Zone:** Routes internet traffic for a public domain. Accessible from the internet.
   - **Private Hosted Zone:** Routes traffic within one or more VPCs using private IP addresses. Not accessible from the internet. Used for internal service names like `db.internal.company.com`.

5. **What is the difference between a CNAME and an Alias record?** *Answer:*
   | | CNAME | Alias |
   |---|---|---|
   | Zone apex (root domain) | Cannot be used | Yes, supported |
   | Target | Any hostname | AWS resources only |
   | DNS query charge | Charged per query | Free for AWS targets |
   | TTL | You set it | AWS controls it (auto-refreshes) |
   | Works with | Any DNS target | ALB, NLB, CloudFront, S3, API Gateway, Elastic IP, VPC Endpoint, another Route 53 record |

---

## Routing Policies

6. **What is Simple Routing Policy?** *Answer:* Simple routing returns a single resource for a domain. No health checks supported. If you specify multiple values (multiple IPs), Route 53 returns all of them in random order — the client picks one. Use for single endpoints where routing logic isn't needed.

7. **What is Weighted Routing Policy?** *Answer:* Weighted routing distributes traffic across multiple resources based on assigned weights. Example: weight 70 to us-east-1, weight 30 to us-west-2 = 70%/30% split. Setting a weight of 0 stops sending traffic to that record. Useful for: blue/green deployments, A/B testing, gradually shifting traffic to a new region. Supports health checks.

8. **What is Latency-Based Routing?** *Answer:* Route 53 routes users to the AWS region with the lowest network latency for their location. Route 53 measures latency between user locations and AWS regions and returns the record with the lowest latency. Not based on geographic proximity — it's actual measured network latency. Supports health checks (fails over to next-lowest latency region if primary is unhealthy).

9. **What is Failover Routing Policy?** *Answer:* Failover routing implements active-passive failover. A primary record handles traffic when healthy; Route 53 automatically routes to the secondary record when the primary health check fails. Health checks are mandatory for the primary record. Used for disaster recovery — primary in us-east-1, secondary in eu-west-1.

10. **What is Geolocation Routing?** *Answer:* Geolocation routes based on the geographic location of the DNS query origin (user's location). You create records for specific continents, countries, or US states. Most specific match wins (country > continent > default). The "Default" record handles locations that don't match any specific record. Use cases: serve localized content, comply with data sovereignty laws, restrict access to specific regions.

11. **What is Geoproximity Routing?** *Answer:* Geoproximity routes based on the geographic proximity of users and resources. You can also apply a bias (positive or negative) to expand or shrink the geographic region a resource covers. Requires Route 53 Traffic Flow. Unlike Geolocation (country-based), Geoproximity uses actual coordinates and lets you fine-tune the boundary between regions.

12. **What is Multi-Value Routing?** *Answer:* Multi-Value returns up to 8 healthy records for each DNS query. Unlike Simple routing, it supports health checks — unhealthy records are filtered out. Clients receive multiple IPs and can choose any healthy one, providing basic client-side load balancing. Not a replacement for a load balancer — it's DNS-level load balancing without session stickiness or connection draining.

13. **What is IP-Based Routing?** *Answer:* IP-Based routing lets you route traffic based on the client's IP address (CIDR blocks). You provide a list of CIDR blocks and map each CIDR to a specific DNS record. Use cases: route ISP customers to the nearest endpoint, route known corporate IP ranges to private resources. More granular than geolocation — works with specific IP ranges, not just countries.

---

## Health Checks

14. **What are Route 53 Health Checks?** *Answer:* Health checks monitor the health of endpoints (HTTP, HTTPS, TCP) and CloudWatch alarms. Route 53 uses a global network of health checkers to poll your endpoint. If the endpoint fails (based on threshold — default 3 consecutive failures), Route 53 marks it unhealthy and stops routing to it (in policies that support health checks). Health checks can be used in calculated health checks (combine multiple with AND/OR/NOT logic).

15. **What are the types of Route 53 Health Checks?** *Answer:*
    - **Endpoint Health Checks:** Monitor a specific IP or domain. Checks HTTP status code (must be 2xx/3xx), optionally validates body content.
    - **Calculated Health Checks:** Combine child health checks using boolean logic. Mark parent healthy only if X of Y children are healthy.
    - **CloudWatch Alarm Health Checks:** Check the state of a CloudWatch alarm. Useful for monitoring private resources (RDS, internal services) — Route 53 health checkers can't reach private endpoints directly, but can check CloudWatch alarms.

16. **What is the difference between health checks for public vs private resources?** *Answer:*
    - **Public resources:** Route 53 health checkers access the endpoint directly from global locations. Simple — provide the IP or hostname.
    - **Private resources (in VPC):** Route 53 health checkers cannot access private IPs directly. Solution: create a CloudWatch Metric + Alarm on the private resource (e.g., RDS CPU, ALB healthy hosts), then create a Route 53 Health Check that monitors that CloudWatch Alarm.

---

## Advanced Features

17. **What is Route 53 Resolver?** *Answer:* Route 53 Resolver provides DNS resolution for VPCs. It has two types of endpoints for hybrid cloud:
    - **Inbound Endpoint:** On-premises DNS servers forward queries for AWS resource names to Route 53 Resolver. On-premises can resolve `rds-instance.vpc.internal`.
    - **Outbound Endpoint:** Route 53 Resolver forwards queries for specific domains (e.g., `corp.internal`) to on-premises DNS servers. VPC instances can resolve on-premises hostnames.
    Also supports DNS Firewall to block/allow domains at the VPC level.

18. **What is DNSSEC in Route 53?** *Answer:* DNSSEC (Domain Name System Security Extensions) adds cryptographic signatures to DNS records to prevent DNS spoofing/cache poisoning attacks. Route 53 supports DNSSEC signing for public hosted zones. Requires KMS for key management. Records are signed with a private key; resolvers validate signatures with the public key. Adds complexity but is required for certain compliance standards.

19. **What is Route 53 Traffic Flow?** *Answer:* Traffic Flow is a visual editor for creating complex routing configurations using a tree of routing policies. You combine geolocation, latency, weighted, and failover policies in one visual diagram. Example: route EU users to Dublin by geolocation → within EU, use latency between Dublin and Frankfurt → apply weighted 90/10 between versions. Versioned policies can be rolled back. Reusable across multiple hosted zones.

20. **How would you design a global active-active multi-region architecture using Route 53?** *Answer:*
    - Deploy the application in multiple regions (us-east-1, eu-west-1, ap-southeast-1)
    - Create Route 53 **Latency-Based** records for each region's ALB
    - Enable **health checks** on each region's endpoint
    - Route 53 automatically routes users to the lowest-latency healthy region
    - Use **Aurora Global Database** for database replication across regions
    - If a region fails, health checks detect it and Route 53 stops routing there (within 60 seconds)
    - For stricter SLA, use Route 53 **Application Recovery Controller** to manage routing and ARC readiness checks
