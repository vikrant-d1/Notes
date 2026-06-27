# VPC Interview Questions

## VPC Basics

1. **What is a Virtual Private Cloud (VPC) in AWS?** *Answer:* A VPC is a virtual network dedicated to your AWS account. It allows you to launch Amazon Web Services resources into a virtual network that you've defined.

2. **Why would you use a VPC in AWS?** *Answer:* VPC provides isolated network resources, allowing you to have control over network configuration. It's useful for security, custom routing, and connecting resources in a controlled manner.

3. **Can you have multiple VPCs within a single AWS account?** *Answer:* Yes, you can create multiple VPCs within a single AWS account. The default limit is 5 VPCs per region, but this can be increased by contacting AWS support.

4. **What is the default VPC?** *Answer:* The default VPC is created for each AWS account in each region. It's ready for use and includes default subnets, route tables, and security group rules.

5. **What is a CIDR block in VPC?** *Answer:* CIDR (Classless Inter-Domain Routing) is the IP address range assigned to a VPC (e.g., 10.0.0.0/16). The /16 means the first 16 bits are fixed, giving you 65,536 IP addresses. AWS allows CIDR blocks from /16 to /28.

---

## Subnets & Routing

6. **What is the difference between a public and private subnet?** *Answer:*
   - **Public Subnet:** Has a route to an Internet Gateway (IGW). Resources can have public IPs and be reachable from the internet.
   - **Private Subnet:** No direct route to the internet. Resources can only access the internet via a NAT Gateway or NAT Instance (outbound only). Databases and internal services go here.

7. **What is an Internet Gateway (IGW)?** *Answer:* An Internet Gateway is a horizontally scaled, redundant, highly available VPC component that allows communication between your VPC and the internet. It provides a target in your VPC route tables for internet-routable traffic and performs NAT for instances with public IPv4 addresses.

8. **What is a NAT Gateway?** *Answer:* A NAT (Network Address Translation) Gateway allows instances in a private subnet to connect to the internet or other AWS services while preventing the internet from initiating connections with those instances. It is managed by AWS, highly available within an AZ, and supports 5 Gbps to 100 Gbps bandwidth.

9. **What is a Route Table?** *Answer:* A Route Table contains a set of rules (routes) that determine where network traffic from your subnet is directed. Each subnet must be associated with a route table. The default route table allows local VPC traffic; you add routes to direct traffic to gateways.

10. **What is a subnet CIDR and how many IP addresses does AWS reserve in each subnet?** *Answer:* AWS reserves 5 IP addresses in each subnet:
    - x.x.x.0 — Network address
    - x.x.x.1 — VPC router
    - x.x.x.2 — DNS server
    - x.x.x.3 — Reserved for future use
    - x.x.x.255 — Broadcast (not supported, but reserved)
    So a /24 subnet gives 256 - 5 = 251 usable IPs.

---

## Security

11. **What is the difference between Security Groups and Network ACLs?** *Answer:*
    | Feature | Security Group | Network ACL |
    |---|---|---|
    | Level | Instance/ENI level | Subnet level |
    | Stateful | Yes | No |
    | Rules | Allow only | Allow and Deny |
    | Rule order | All rules evaluated | Numbered order (lowest first) |
    | Default | Deny all inbound, allow all outbound | Allow all in/out |

12. **What is a Network ACL (NACL)?** *Answer:* A NACL is an optional layer of security acting as a stateless firewall at the subnet level. Because it's stateless, you must explicitly allow both inbound and outbound traffic. Rules are evaluated in order by rule number, and the first matching rule applies.

13. **What is VPC Flow Logs?** *Answer:* VPC Flow Logs capture information about IP traffic going to and from network interfaces in your VPC. They can be published to CloudWatch Logs or S3. Used for network monitoring, security analysis, and troubleshooting connectivity issues.

---

## Connectivity

14. **What is VPC Peering?** *Answer:* VPC Peering creates a direct network connection between two VPCs, allowing them to communicate using private IP addresses as if they were in the same network. Key constraints: no transitive peering (A↔B and B↔C does NOT mean A↔C), no overlapping CIDR blocks allowed.

15. **What is AWS Transit Gateway?** *Answer:* Transit Gateway is a network hub that connects multiple VPCs, AWS accounts, and on-premises networks through a single gateway. Unlike VPC Peering, it supports transitive routing — making it ideal for hub-and-spoke architectures at scale.

16. **What is AWS VPN?** *Answer:* AWS VPN creates an encrypted connection between your on-premises network and your VPC over the public internet. Consists of:
    - **Customer Gateway (CGW):** Your on-premises VPN device
    - **Virtual Private Gateway (VGW):** AWS side of the VPN connection
    - Supports IPSec protocol

17. **What is AWS Direct Connect?** *Answer:* Direct Connect provides a dedicated private network connection between your data center and AWS, bypassing the public internet. Offers consistent network performance, lower latency, and potentially lower data transfer costs. Bandwidth options: 1 Gbps, 10 Gbps, or 100 Gbps.

18. **What is the difference between VPN and Direct Connect?** *Answer:*
    | | VPN | Direct Connect |
    |---|---|---|
    | Connection | Over public internet | Dedicated private line |
    | Latency | Variable | Consistent, low |
    | Setup time | Minutes | Weeks |
    | Cost | Lower | Higher |
    | Encryption | Yes (IPSec) | No (must add MACsec) |

---

## Advanced Concepts

19. **What is a VPC Endpoint?** *Answer:* A VPC Endpoint allows private connectivity to AWS services (S3, DynamoDB, etc.) from within your VPC without going through the internet, NAT Gateway, or VPN. Two types:
    - **Gateway Endpoint:** For S3 and DynamoDB only. Free, adds a route to your route table.
    - **Interface Endpoint (PrivateLink):** Creates an ENI in your subnet with a private IP for most other AWS services. Hourly charge applies.

20. **What is an Elastic Network Interface (ENI)?** *Answer:* An ENI is a virtual network card you can attach to an EC2 instance. Each instance gets a primary ENI (eth0). You can attach additional ENIs for network segmentation, failover, or dual-homing. Each ENI has a private IP, optionally a public IP, MAC address, and security groups.

21. **What is an Egress-Only Internet Gateway?** *Answer:* An Egress-Only Internet Gateway allows IPv6 traffic from instances in a private subnet to reach the internet, while preventing the internet from initiating connections to those instances. It is the IPv6 equivalent of a NAT Gateway (since IPv6 addresses are public by design, there's no NAT — this gateway just blocks inbound).

22. **How would you design a highly available 3-tier architecture in a VPC?** *Answer:* Deploy across at least 2 AZs:
    - **Public subnets (per AZ):** Application Load Balancer
    - **Private subnets - App tier (per AZ):** EC2 instances in Auto Scaling Group
    - **Private subnets - Data tier (per AZ):** RDS Multi-AZ or Aurora
    - NAT Gateways in each public subnet (one per AZ for HA)
    - Security groups to control traffic between tiers
