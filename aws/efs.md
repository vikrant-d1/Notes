# EFS Interview Questions

## EFS Basics

1. **What is Amazon EFS?** *Answer:* Amazon EFS (Elastic File System) is a fully managed, serverless, elastic NFS (Network File System) that can be mounted simultaneously by thousands of EC2 instances, ECS tasks, Lambda functions, and on-premises servers. Unlike EBS (1 instance), EFS is shared storage — all connected clients see the same file system and updates in real time.

2. **What is the difference between EBS, EFS, and S3?** *Answer:*
   | | EBS | EFS | S3 |
   |---|---|---|---|
   | Type | Block storage | File storage (NFS) | Object storage |
   | Access | One EC2 at a time (mostly) | Thousands of instances simultaneously | Via HTTP API |
   | Protocol | iSCSI / block | NFS v4 | REST/HTTP |
   | Scaling | Fixed size (provision upfront) | Automatic, pay per GB | Unlimited, pay per GB |
   | Use case | OS disk, database | Shared content, home dirs, CMS | Backups, static files, data lake |
   | Region | Single AZ | Multi-AZ | Multi-AZ |

3. **How does EFS scale?** *Answer:* EFS scales automatically — you don't provision capacity upfront. As you add files, storage grows; as you delete files, storage shrinks. You pay only for the storage used. Throughput also scales automatically based on the storage size (Bursting mode) or you can provision specific throughput independently of storage size (Provisioned Throughput mode).

4. **What protocols does EFS support?** *Answer:* EFS supports NFSv4.0 and NFSv4.1 protocols. It can be mounted on Linux EC2 instances (not Windows), ECS containers, Lambda functions (via file system configuration), and on-premises servers via AWS Direct Connect or VPN. The EFS mount helper (`amazon-efs-utils`) simplifies mounting and encryption in transit.

5. **What are the EFS storage classes?** *Answer:*
   - **EFS Standard:** Multi-AZ storage for frequently accessed files. Highest durability (replicated across multiple AZs).
   - **EFS Standard-IA (Infrequent Access):** Lower cost, same durability. Retrieval fee per GB read. For files not accessed daily.
   - **EFS One Zone:** Single AZ. Lower cost, suitable for dev/test or data that can be recreated.
   - **EFS One Zone-IA:** Single AZ + infrequent access. Lowest cost tier.

---

## Performance

6. **What are EFS performance modes?** *Answer:*
   - **General Purpose (default):** Lowest per-operation latency. Best for latency-sensitive applications (web servers, CMS, development environments). Up to 35,000 IOPS.
   - **Max I/O:** Higher throughput and IOPS (scales beyond General Purpose limits) at the cost of higher latencies. Best for highly parallelized big data workloads (Hadoop, media processing).
   - Performance mode is set at file system creation and cannot be changed.

7. **What are EFS throughput modes?** *Answer:*
   - **Elastic Throughput (recommended):** Automatically scales throughput up and down based on workload needs. Pay for only what you use. Ideal for spiky or unpredictable workloads.
   - **Bursting Throughput:** Baseline throughput proportional to storage size (50 KB/s per GB). Can burst to 100 MB/s using burst credits. Good for workloads that burst periodically.
   - **Provisioned Throughput:** You specify throughput regardless of storage size. Good when you need more throughput than Bursting allows. You pay for provisioned throughput above the earned rate.

8. **How does EFS compare to FSx for Windows File Server?** *Answer:*
   - **EFS:** NFS-based, Linux/Unix only, serverless, scales automatically, cost-effective for shared Linux workloads.
   - **FSx for Windows:** SMB-based, Windows-native (Active Directory integration, DFS, Windows ACLs), for Windows workloads that need NTFS, DFS namespaces, or Windows authentication.

---

## Security & Access

9. **How do you control access to EFS?** *Answer:*
   - **Security Groups:** Control network access — the EFS mount target's security group must allow inbound NFS (port 2049) from the EC2/ECS security groups.
   - **EFS Resource-Based Policy:** JSON policy attached to the file system controlling which IAM principals can perform which EFS API actions.
   - **IAM Authorization:** Use IAM to control access to file system operations. Require TLS and IAM authentication with the `iam` option in the EFS mount helper.
   - **POSIX permissions:** Traditional Linux user/group file permissions work on EFS, since it presents as a standard NFS file system.

10. **What is EFS Access Points?** *Answer:* EFS Access Points are application-specific entry points into an EFS file system. Each access point enforces a specific root directory (the application only sees its directory, not the full file system) and a POSIX user/group identity (overriding the client's identity). Useful for multi-tenant setups where multiple applications or teams share one EFS file system securely.

11. **What is encryption in EFS?** *Answer:* EFS supports two types of encryption:
    - **Encryption at rest:** Enabled at file system creation using AWS KMS. Encrypts all data, metadata, and backups. Cannot be enabled on an existing unencrypted file system.
    - **Encryption in transit:** Use TLS when mounting via the EFS mount helper (`-o tls`). Encrypts data between the client and EFS. Can be enforced via a resource policy condition (`aws:SecureTransport: true`).

---

## Use Cases & Advanced

12. **What is EFS Lifecycle Management?** *Answer:* EFS automatically moves files that haven't been accessed for a specified period (7, 14, 30, 60, or 90 days) to the cheaper IA storage class. When accessed again, files can optionally be moved back to Standard. This is transparent to applications — they see the same file path regardless of which storage class the file is in.

13. **How does EFS work with Lambda?** *Answer:* Lambda functions can mount EFS file systems via an EFS Access Point. The Lambda function must be configured in a VPC (same VPC as the EFS mount targets). This enables Lambda to read/write shared files, use large ML models, share state between invocations (via the file system), and work with files larger than Lambda's 10 GB ephemeral /tmp storage.

14. **What is EFS Replication?** *Answer:* EFS Replication automatically replicates file system data to another AWS region for disaster recovery. The replication lag is typically under 1 minute. The replica is read-only by default but can be promoted to standalone (breaking replication) for failover. AWS manages the replication — no replication agent or infrastructure to manage.

15. **What is Amazon FSx for Lustre and how does it differ from EFS?** *Answer:* FSx for Lustre is a high-performance parallel file system for compute-intensive workloads (ML training, HPC, video processing). It delivers hundreds of GB/s throughput and millions of IOPS with sub-millisecond latencies. EFS is NFS-based and optimized for general-purpose shared file storage. FSx for Lustre can directly integrate with S3 as a data repository.

16. **When would you choose EFS over EBS?** *Answer:* Choose EFS when:
    - Multiple EC2 instances or containers need shared access to the same files simultaneously
    - You need elastic storage that grows/shrinks automatically
    - Building shared home directories, content management systems (WordPress), or development environments
    - Running containers that need persistent shared storage across tasks/pods
    Choose EBS when: one instance needs high-performance block storage (databases, OS), you need provisioned IOPS, or running Windows workloads.

17. **What is a EFS Mount Target?** *Answer:* A Mount Target is the network endpoint in a VPC subnet that EC2 instances use to connect to EFS. You create one mount target per AZ (in its own subnet) for high availability. Each mount target has a private IP address and an associated security group. EC2 instances mount EFS using the mount target's DNS name or IP, and NFS (port 2049) must be allowed in the security group.

18. **How do you set up high availability for EFS?** *Answer:* EFS Standard automatically replicates data across multiple AZs — you don't need to configure HA yourself. For access HA: create one mount target in each AZ where your instances run. Each instance mounts the mount target in its own AZ for optimal performance and resilience. If one AZ fails, instances in other AZs continue accessing EFS through their local mount targets.

19. **What is the maximum file size in EFS?** *Answer:* EFS supports files up to 47.9 TB in size. There is no limit on the number of files or the total file system size — it grows elastically. However, individual file operations are limited by the NFS protocol. Very large single-file reads/writes benefit from FSx for Lustre's parallel access pattern rather than EFS's sequential NFS access.

20. **How does EFS billing work?** *Answer:* EFS charges based on:
    - **Storage used** (not provisioned): Per GB per month, different rates for Standard vs IA storage classes
    - **Provisioned Throughput** (if using Provisioned mode): Per MB/s per month above the earned bursting rate
    - **Data access** (IA only): Per GB read from Infrequent Access storage
    - **Replication** (if enabled): Per GB replicated
    Elastic Throughput: pay only for actual throughput above the free included amount. No upfront costs, no minimum fees.
