# RDS Interview Questions

## RDS Basics

1. **What is Amazon RDS?** *Answer:* Amazon RDS (Relational Database Service) is a managed service that makes it easy to set up, operate, and scale a relational database in the cloud. AWS handles hardware provisioning, database setup, patching, and backups. Supported engines: MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, and Aurora.

2. **What databases does RDS support?** *Answer:* RDS supports 6 database engines:
   - **MySQL** — most popular open-source relational DB
   - **PostgreSQL** — advanced open-source with JSON support
   - **MariaDB** — MySQL fork with community-driven development
   - **Oracle** — enterprise commercial database
   - **Microsoft SQL Server** — Microsoft's enterprise database
   - **Amazon Aurora** — AWS's cloud-native MySQL/PostgreSQL-compatible engine (5x faster than MySQL)

3. **What are the benefits of using RDS over self-managed databases?** *Answer:*
   - Automated backups and point-in-time recovery
   - Multi-AZ for high availability and automatic failover
   - Read Replicas for scaling reads
   - Automated OS and engine patching
   - Easy vertical scaling (change instance class)
   - Storage auto-scaling
   - Built-in monitoring via CloudWatch

4. **What is RDS storage auto-scaling?** *Answer:* RDS Storage Auto Scaling automatically increases storage capacity when free space is running low, without downtime. You set a maximum storage threshold and RDS scales storage automatically when it crosses the threshold. You only pay for the storage used.

---

## High Availability

5. **What is RDS Multi-AZ?** *Answer:* Multi-AZ deploys a standby replica of your database in a different Availability Zone within the same region. AWS synchronously replicates data to the standby. In case of planned maintenance, AZ failure, or instance failure, RDS automatically fails over to the standby — typically within 1-2 minutes. The connection endpoint remains the same. Used for high availability, NOT for read scaling.

6. **What is the difference between Multi-AZ and Read Replicas?** *Answer:*
   | Feature | Multi-AZ | Read Replica |
   |---|---|---|
   | Purpose | High Availability / Failover | Read Scaling |
   | Replication | Synchronous | Asynchronous |
   | Readable | No (standby is passive) | Yes |
   | Regions | Same region, different AZ | Same region or cross-region |
   | Failover | Automatic | Manual promotion |

7. **What are RDS Read Replicas?** *Answer:* Read Replicas are read-only copies of your primary DB instance, updated asynchronously. Used to offload read traffic from the primary, improving overall performance. You can have up to 15 read replicas (Aurora) or 5 (other engines). Read Replicas can be in the same region or cross-region. They can be promoted to standalone databases.

8. **What is RDS automated backup?** *Answer:* RDS automatically takes daily full backups (during the backup window) and captures transaction logs every 5 minutes. This enables point-in-time recovery to any second within your retention period (1-35 days). Backups are stored in S3 and are automatically managed. The backup window should be scheduled during low-traffic periods.

9. **What is the difference between RDS Snapshots and Automated Backups?** *Answer:*
   - **Automated Backups:** Enabled by default, daily snapshots + transaction logs, automatically deleted when instance is deleted, retention 1-35 days.
   - **Manual Snapshots:** Triggered by you, persist even after the instance is deleted, no expiration (you delete manually). Used before major changes.

---

## Amazon Aurora

10. **What is Amazon Aurora?** *Answer:* Aurora is AWS's cloud-native relational database, compatible with MySQL and PostgreSQL. It separates compute from storage — the shared storage layer replicates data 6 ways across 3 AZs automatically. Key advantages: 5x faster than MySQL, 3x faster than PostgreSQL, auto-scales storage up to 128 TB, up to 15 low-latency read replicas, and failover in under 30 seconds.

11. **What is Aurora Serverless?** *Answer:* Aurora Serverless automatically starts up, shuts down, and scales compute capacity based on application demand. You don't need to choose an instance size — you specify ACU (Aurora Capacity Units) min/max. Ideal for infrequent, intermittent, or unpredictable workloads. V2 supports fine-grained scaling (increments of 0.5 ACU).

12. **What is Aurora Global Database?** *Answer:* Aurora Global Database spans multiple AWS regions, with one primary region for writes and up to 5 secondary regions for reads. Replication lag is typically under 1 second. Enables disaster recovery with a Recovery Point Objective (RPO) of ~1 second and Recovery Time Objective (RTO) of < 1 minute for cross-region failover.

---

## Security & Monitoring

13. **How do you secure an RDS database?** *Answer:*
    - Deploy in a **private subnet** inside a VPC
    - Use **Security Groups** to restrict access (only allow app servers)
    - Enable **encryption at rest** using KMS (must be enabled at creation)
    - Enable **SSL/TLS** for encryption in transit
    - Use **IAM database authentication** instead of static passwords
    - Enable **CloudTrail** for API call logging
    - Use **Secrets Manager** to rotate database passwords automatically

14. **What is RDS encryption?** *Answer:* RDS supports encryption at rest using AWS KMS. Once enabled (at instance creation), all data, backups, read replicas, and snapshots are encrypted. You cannot enable encryption on an existing unencrypted instance — you must take a snapshot, encrypt the snapshot, and restore from the encrypted snapshot.

15. **What is IAM Database Authentication?** *Answer:* IAM Database Authentication lets you authenticate to RDS MySQL and PostgreSQL using AWS IAM credentials instead of a database password. The application calls AWS to get a temporary auth token (valid for 15 minutes), then uses that token as the database password. No static credentials stored in the application.

16. **What is RDS Enhanced Monitoring?** *Answer:* Enhanced Monitoring provides real-time metrics for the OS running your DB instance (CPU, memory, file system, disk I/O at the process level) with granularity down to 1 second. Unlike CloudWatch (which monitors the hypervisor), Enhanced Monitoring uses an agent on the instance to collect OS-level metrics.

---

## Performance & Scaling

17. **What is RDS Proxy?** *Answer:* RDS Proxy is a fully managed, highly available database proxy that sits between your application and RDS. It pools and shares database connections, reducing the stress on the database from thousands of Lambda functions or containers opening connections. Also supports IAM authentication and Secrets Manager, and automatically routes to the correct instance during failover.

18. **When would you use DynamoDB over RDS?** *Answer:*
    - **Use RDS when:** Complex queries, JOINs, transactions (ACID), structured schema, existing SQL tools
    - **Use DynamoDB when:** Massive scale (millions of TPS), predictable single-digit millisecond latency, key-value or document data, serverless architectures, flexible schema

19. **What is the difference between vertical and horizontal scaling in RDS?** *Answer:*
    - **Vertical Scaling:** Change the instance class (e.g., db.t3.medium → db.r6g.xlarge). Requires a brief downtime. Increases CPU, RAM, and network capacity.
    - **Horizontal Scaling:** Add Read Replicas to handle more read traffic. Writes still go to primary. For write scaling, consider Aurora or DynamoDB.

20. **What happens during an RDS failover?** *Answer:* In a Multi-AZ setup, if the primary instance fails, RDS automatically fails over to the standby by updating the DNS record to point to the standby's IP address. The CNAME record is updated in about 60-120 seconds. Applications should use the RDS endpoint (not hardcoded IPs) and implement retry logic for seamless failover.
