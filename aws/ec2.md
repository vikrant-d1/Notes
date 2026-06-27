# EC2 Interview Questions

## EC2 Basics

1. **What is Amazon EC2?** *Answer:* Amazon EC2 (Elastic Compute Cloud) is a web service that provides resizable virtual servers (instances) in the cloud. It allows you to run applications on AWS infrastructure without investing in physical hardware.

2. **What are EC2 instance types?** *Answer:* EC2 instances are categorized into families based on use case:
   - **General Purpose (t3, m6i):** Balanced CPU/memory for web servers, dev environments
   - **Compute Optimized (c6i):** High CPU for batch processing, gaming servers
   - **Memory Optimized (r6i, x2i):** Large RAM for databases, in-memory caches
   - **Storage Optimized (i3, d2):** High IOPS for data warehouses, distributed file systems
   - **GPU Instances (p4, g5):** Machine learning, video rendering

3. **What is the difference between On-Demand, Reserved, Spot, and Savings Plans?** *Answer:*
   - **On-Demand:** Pay per hour/second, no commitment. Best for unpredictable workloads.
   - **Reserved Instances:** 1 or 3-year commitment, up to 72% discount. Best for steady-state workloads.
   - **Spot Instances:** Use spare AWS capacity at up to 90% discount. Can be interrupted with 2-minute warning. Best for fault-tolerant batch jobs.
   - **Savings Plans:** Flexible discount (up to 66%) in exchange for consistent usage commitment ($/hour).

4. **What is an AMI (Amazon Machine Image)?** *Answer:* An AMI is a pre-configured template that contains the OS, application server, and applications needed to launch an EC2 instance. It includes a root volume snapshot, launch permissions, and block device mappings.

5. **What is the difference between Stop, Terminate, and Hibernate an EC2 instance?** *Answer:*
   - **Stop:** Shuts down the instance; EBS data is preserved, RAM is cleared. You still pay for EBS storage.
   - **Terminate:** Permanently deletes the instance and (by default) its root EBS volume.
   - **Hibernate:** Saves RAM contents to EBS, allowing faster resume. Instance retains its state.

---

## Networking & Security

6. **What is a Security Group in EC2?** *Answer:* A Security Group acts as a virtual firewall at the instance level. It controls inbound and outbound traffic using rules based on protocol, port, and source/destination IP. Security groups are stateful — if you allow inbound traffic, the response is automatically allowed outbound.

7. **What is the difference between a Security Group and a NACL?** *Answer:*
   | Feature | Security Group | NACL |
   |---|---|---|
   | Level | Instance level | Subnet level |
   | Stateful | Yes | No (must define both in/out) |
   | Rules | Allow only | Allow and Deny |
   | Evaluation | All rules evaluated | Rules evaluated in number order |

8. **What is an Elastic IP?** *Answer:* An Elastic IP is a static, public IPv4 address that you can allocate to your AWS account. Unlike a dynamic public IP (which changes on instance restart), an Elastic IP persists and can be remapped to different instances. You are charged when the Elastic IP is not associated with a running instance.

9. **What is an EC2 Key Pair?** *Answer:* A Key Pair consists of a public key (stored by AWS) and a private key (you download). Used for SSH access to Linux instances or decrypting the administrator password for Windows instances. If you lose the private key, you cannot recover it.

10. **What is EC2 Instance Connect?** *Answer:* EC2 Instance Connect allows you to connect to your Linux instance using SSH directly from the AWS console or CLI without managing SSH keys. AWS pushes a temporary public key to the instance for the session.

---

## Storage

11. **What storage options are available for EC2?** *Answer:*
    - **EBS (Elastic Block Store):** Persistent block storage, like a hard drive attached to one instance. Data survives instance stop/start.
    - **Instance Store:** Temporary (ephemeral) storage physically attached to the host. Data is lost when the instance stops or terminates. Very fast I/O.
    - **EFS (Elastic File System):** Shared file storage mountable by multiple instances simultaneously (NFS-based).
    - **S3:** Object storage, accessed via API, not mounted directly.

12. **What are the types of EBS volumes?** *Answer:*
    - **gp3/gp2 (General Purpose SSD):** Balanced price/performance for most workloads
    - **io2/io1 (Provisioned IOPS SSD):** High performance for databases needing consistent IOPS
    - **st1 (Throughput Optimized HDD):** Low-cost HDD for sequential workloads like big data
    - **sc1 (Cold HDD):** Lowest cost for infrequently accessed data

---

## Auto Scaling & Load Balancing

13. **What is Auto Scaling?** *Answer:* EC2 Auto Scaling automatically adjusts the number of EC2 instances in a group based on demand. It uses launch templates/configurations, scaling policies (target tracking, step scaling, scheduled), and health checks to maintain the desired capacity.

14. **What is the difference between horizontal and vertical scaling?** *Answer:*
    - **Horizontal Scaling (Scale Out/In):** Adding/removing more instances. Preferred in cloud as it's more resilient and cost-effective.
    - **Vertical Scaling (Scale Up/Down):** Increasing/decreasing instance size (CPU/RAM). Requires downtime and has hardware limits.

15. **What are the types of Elastic Load Balancers?** *Answer:*
    - **ALB (Application Load Balancer):** Layer 7, routes based on URL path, host headers, HTTP methods. Best for microservices and HTTP/HTTPS.
    - **NLB (Network Load Balancer):** Layer 4, ultra-low latency, handles millions of requests per second. Best for TCP/UDP.
    - **GLB (Gateway Load Balancer):** Layer 3, used to deploy third-party virtual appliances (firewalls, IDS).
    - **CLB (Classic):** Legacy, supports Layer 4 and 7. Not recommended for new applications.

16. **What is a Launch Template?** *Answer:* A Launch Template defines the configuration for EC2 instances (AMI, instance type, key pair, security groups, user data, etc.) used by Auto Scaling Groups or when launching instances. It supports versioning, unlike the older Launch Configuration.

---

## Advanced Concepts

17. **What is EC2 Placement Groups?** *Answer:* Placement groups control how instances are placed on underlying hardware:
    - **Cluster:** All instances in same AZ, same rack. Lowest latency, high bandwidth (10 Gbps). Risk: single hardware failure.
    - **Spread:** Each instance on separate hardware. Up to 7 instances per AZ per group. Maximum availability.
    - **Partition:** Groups of instances on separate partitions (racks). Up to 7 partitions per AZ. Used for HDFS, HBase.

18. **What is EC2 User Data?** *Answer:* User Data is a script that runs automatically when an EC2 instance launches for the first time. Used to bootstrap the instance — install packages, configure software, pull code from S3, etc. It runs as root and only executes once by default on first boot.

19. **What is an EC2 Instance Profile?** *Answer:* An Instance Profile is a container for an IAM role that you attach to an EC2 instance. It allows the instance to make AWS API calls with the permissions defined in the IAM role, without hardcoding credentials in the application.

20. **What is EC2 Dedicated Hosts vs Dedicated Instances?** *Answer:*
    - **Dedicated Hosts:** Physical server fully dedicated to you. You have visibility into sockets and cores. Required for BYOL (Bring Your Own License) software like Windows Server or Oracle.
    - **Dedicated Instances:** Instances run on hardware dedicated to you, but AWS manages the placement. You don't see the physical host details.
