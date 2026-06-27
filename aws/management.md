# AWS Management & Monitoring Interview Questions

## CloudWatch

1. **What is Amazon CloudWatch?** *Answer:* CloudWatch is AWS's monitoring and observability service. It collects metrics, logs, and events from AWS services and your applications. You can set alarms, visualize data in dashboards, and automate responses to operational changes. CloudWatch is the central hub for AWS monitoring.

2. **What are CloudWatch Metrics?** *Answer:* Metrics are time-series data points representing the performance of your systems. AWS services automatically publish metrics (e.g., EC2 CPU utilization, ALB request count, Lambda duration). You can also publish custom metrics from your applications. Default resolution is 1-minute; high-resolution metrics support 1-second granularity.

3. **What are CloudWatch Alarms?** *Answer:* Alarms monitor a metric over a time period and trigger actions when the metric crosses a threshold. States: OK, ALARM, INSUFFICIENT_DATA. Actions: send SNS notification, trigger Auto Scaling, stop/terminate/reboot EC2. Alarms can be based on static thresholds or anomaly detection (ML-based dynamic thresholds).

4. **What is CloudWatch Logs?** *Answer:* CloudWatch Logs collects, stores, and searches log files from AWS services and applications. Key concepts:
   - **Log Group:** Container for log streams (e.g., one per application)
   - **Log Stream:** Sequence of log events from a single source
   - **Metric Filter:** Extract metric data from log patterns (e.g., count error log entries)
   - **Subscription Filter:** Stream logs in real-time to Lambda, Kinesis, or Elasticsearch
   - **Log Insights:** Interactive query language for analyzing logs

5. **What is CloudWatch Container Insights?** *Answer:* Container Insights collects, aggregates, and summarizes metrics and logs from containerized applications (ECS, EKS, Kubernetes on EC2). It provides dashboards for cluster, service, and task-level metrics (CPU, memory, network, disk). Data is collected via a CloudWatch agent deployed as a DaemonSet (Kubernetes) or sidecar (ECS).

---

## CloudTrail

6. **What is AWS CloudTrail?** *Answer:* CloudTrail records API activity in your AWS account — every call made via the console, CLI, SDK, or another AWS service. Captures: who made the call, what action was taken, which resource was affected, when, and the source IP. Critical for security auditing, compliance, and incident investigation.

7. **What are the types of CloudTrail events?** *Answer:*
   - **Management Events:** API calls that manage AWS resources (creating EC2, deleting S3 bucket, modifying IAM). Logged by default.
   - **Data Events:** High-volume API calls on data (S3 object reads/writes, Lambda invocations, DynamoDB item-level operations). Not logged by default — extra cost.
   - **Insight Events:** Identify unusual API activity (e.g., a spike in IAM policy changes or resource deletions). Uses ML to detect anomalies.

8. **What is a CloudTrail Trail?** *Answer:* A Trail configures CloudTrail to deliver log files to an S3 bucket (and optionally to CloudWatch Logs and EventBridge). Without a trail, you can only view the last 90 days of management events in the CloudTrail console. Trails can be single-region or multi-region. Best practice: create a multi-region trail and enable log file validation.

---

## AWS Config

9. **What is AWS Config?** *Answer:* Config continuously records the configuration state of your AWS resources and evaluates configurations against desired rules. It answers: "What did this resource look like at a point in time? Who changed it? Is it compliant with our policies?" Config stores a configuration history in S3 and sends change notifications via SNS.

10. **What are AWS Config Rules?** *Answer:* Config Rules define the desired configuration state of your resources. Config evaluates resources against these rules and marks them as COMPLIANT or NON_COMPLIANT. Types:
    - **AWS Managed Rules:** Pre-built rules (e.g., `s3-bucket-public-read-prohibited`, `encrypted-volumes`)
    - **Custom Rules:** You write Lambda functions to evaluate resources
    - **Proactive Mode:** Evaluate resource configs before they are created (via CloudFormation)

---

## CloudFormation

11. **What is AWS CloudFormation?** *Answer:* CloudFormation is AWS's Infrastructure as Code (IaC) service. You define your AWS infrastructure in JSON or YAML templates, and CloudFormation provisions and manages those resources as a Stack. It handles dependencies automatically, rolls back on failure, and tracks drift (when resources differ from the template).

12. **What is a CloudFormation Stack?** *Answer:* A Stack is a collection of AWS resources managed as a single unit. All resources in a stack are created, updated, and deleted together. If creation fails, CloudFormation rolls back all resources. If updating fails, it rolls back to the previous working state. StackSets extend this across multiple accounts and regions.

13. **What are CloudFormation Nested Stacks?** *Answer:* Nested Stacks allow you to create reusable template components referenced in a parent stack. Instead of one massive template, you break infrastructure into modular templates (network, compute, database stacks) and compose them. The parent stack manages child stacks as resources.

14. **What is the difference between CloudFormation and Terraform?** *Answer:*
    | | CloudFormation | Terraform |
    |---|---|---|
    | Provider | AWS only | Multi-cloud (AWS, GCP, Azure) |
    | Language | JSON/YAML | HCL (HashiCorp Config Language) |
    | State | Managed by AWS | State file you manage (S3 backend) |
    | Rollback | Automatic | Manual or with `-auto-approve` caution |
    | Ecosystem | AWS native, deep integration | Huge provider ecosystem |

---

## Systems Manager (SSM)

15. **What is AWS Systems Manager?** *Answer:* Systems Manager is a suite of tools to manage, configure, and operate EC2 instances and on-premises servers at scale. Key capabilities: run commands remotely, patch management, session manager (SSH replacement), parameter store, inventory collection, and automation runbooks.

16. **What is SSM Session Manager?** *Answer:* Session Manager provides secure shell access to EC2 instances (and on-premises servers) without opening inbound ports, bastion hosts, or managing SSH keys. Sessions are logged to CloudWatch or S3. Access is controlled via IAM policies. Supports both interactive sessions and non-interactive (for automation).

17. **What is SSM Parameter Store?** *Answer:* Parameter Store provides secure, hierarchical storage for configuration data and secrets. Supports String, StringList, and SecureString (encrypted with KMS) types. Integrated with IAM for fine-grained access control. Free for standard parameters; advanced parameters support larger values and parameter policies (TTL, expiration notifications).

---

## EventBridge & SNS/SQS

18. **What is Amazon EventBridge?** *Answer:* EventBridge (formerly CloudWatch Events) is a serverless event bus that connects AWS services, SaaS applications, and your custom applications. Events flow from producers (EC2 state change, S3 upload, Scheduled cron) through rules to targets (Lambda, SQS, Step Functions, another account). Enables event-driven architectures across AWS services.

19. **What is the difference between SNS and SQS?** *Answer:*
    | | SNS (Simple Notification Service) | SQS (Simple Queue Service) |
    |---|---|---|
    | Model | Pub/Sub (push) | Queue (pull) |
    | Delivery | Push to all subscribers at once | One consumer per message |
    | Persistence | No (messages lost if no subscriber) | Yes (up to 14 days) |
    | Use case | Fan-out to multiple services | Decouple producer/consumer |
    | Protocols | HTTP, Email, Lambda, SQS | Pull (consumers poll) |

20. **What is the SNS Fan-Out pattern?** *Answer:* Fan-Out sends one message to multiple consumers simultaneously. An SNS topic delivers the message to multiple SQS queues (subscribers). Each queue has its own consumer(s) that process the event independently. Used when multiple systems need to react to the same event (e.g., order placed → trigger fulfillment queue, analytics queue, and notification queue simultaneously).
