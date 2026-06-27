# CloudWatch Interview Questions

## CloudWatch Basics

1. **What is Amazon CloudWatch?** *Answer:* CloudWatch is AWS's unified monitoring and observability service. It collects metrics, logs, and traces from AWS services and your applications, enabling you to monitor performance, set alarms, visualize data on dashboards, and automatically react to operational changes.

2. **What are CloudWatch Namespaces?** *Answer:* A namespace is a container for CloudWatch metrics that isolates metrics from different applications or services. AWS services publish to namespaces like `AWS/EC2`, `AWS/Lambda`, `AWS/RDS`. Custom metrics go into user-defined namespaces. Metrics in different namespaces are never aggregated together.

3. **What are CloudWatch Dimensions?** *Answer:* Dimensions are key-value pairs that are part of a metric's identity and allow you to filter/aggregate metrics. Example: EC2 metrics have dimensions like `InstanceId` and `AutoScalingGroupName`. When you publish a custom metric, you can add up to 30 dimensions to slice the data (e.g., by environment, region, service).

4. **What is the difference between basic and detailed monitoring in EC2?** *Answer:*
   - **Basic Monitoring (free):** EC2 sends metrics to CloudWatch every 5 minutes.
   - **Detailed Monitoring (paid):** Metrics are sent every 1 minute. Required when you need faster Auto Scaling responses or tighter alarm granularity.

5. **What are CloudWatch high-resolution metrics?** *Answer:* Standard metrics have 1-minute resolution. High-resolution custom metrics can be published with 1-second, 5-second, 10-second, or 30-second granularity using the `StorageResolution` parameter. High-resolution alarms can evaluate every 10 or 30 seconds. Useful for detecting short-lived spikes that 1-minute metrics would miss.

---

## CloudWatch Alarms

6. **What are the three states of a CloudWatch Alarm?** *Answer:*
   - **OK:** The metric is within the defined threshold.
   - **ALARM:** The metric has breached the threshold for the specified number of consecutive evaluation periods.
   - **INSUFFICIENT_DATA:** Not enough data to determine the alarm state (e.g., metric not yet published, or data gaps).

7. **What alarm actions can CloudWatch trigger?** *Answer:*
   - Send notification via **SNS** (email, SMS, Lambda, SQS)
   - **Auto Scaling actions** (scale out/in EC2 instances)
   - **EC2 actions:** stop, terminate, reboot, or recover an instance
   - **Systems Manager OpsItem** creation
   - **EventBridge** events to trigger complex workflows

8. **What is a Composite Alarm?** *Answer:* A Composite Alarm combines multiple CloudWatch alarms using boolean logic (AND, OR, NOT). Example: alert only if CPU is high AND error rate is high (not just one). Reduces alarm noise by preventing false positives. Useful for representing the overall health of an application with one alarm.

9. **What is Anomaly Detection in CloudWatch?** *Answer:* Anomaly Detection uses ML to model the expected behavior of a metric based on its historical data (time of day, day of week patterns). It creates a dynamic band (upper/lower bounds) and triggers alarms when the metric falls outside this band. More accurate than static thresholds for metrics that naturally vary.

10. **What is a CloudWatch Alarm Math Expression?** *Answer:* Metric Math allows you to query and perform math on multiple CloudWatch metrics in a single expression. Example: calculate error rate as `(errors / requests) * 100`. You can use these expressions in dashboards and alarms without storing a separate derived metric.

---

## CloudWatch Logs

11. **What is a CloudWatch Log Group?** *Answer:* A Log Group is a logical container for log streams that share the same retention, monitoring, and access policies. Typically one log group per application or service (e.g., `/aws/lambda/my-function`, `/aws/ecs/my-app`). You set retention from 1 day to 10 years (default: never expire, but you pay for storage).

12. **What is CloudWatch Log Insights?** *Answer:* Log Insights is an interactive query engine for CloudWatch Logs. It uses a purpose-built query language to search and analyze log data at scale. You can filter, aggregate, sort, and visualize log data — like SQL for logs. Supports queries across multiple log groups. Queries are charged per GB of data scanned.

13. **What is a CloudWatch Metric Filter?** *Answer:* A Metric Filter extracts metric data from log events using pattern matching. Example: count the number of log lines containing "ERROR" and publish that count as a CloudWatch metric. You can then create alarms on this derived metric. Metric Filters don't retroactively process existing logs — they only apply to new incoming log events.

14. **What is CloudWatch Logs Subscription Filter?** *Answer:* A Subscription Filter delivers real-time log events to a destination for processing. Destinations:
    - **Lambda:** Process and transform logs in real-time
    - **Kinesis Data Streams:** High-throughput log forwarding to data lakes
    - **Kinesis Data Firehose:** Deliver logs to S3, Redshift, or Elasticsearch
    Only one subscription filter per log group (unless using cross-account subscriptions with Logs destinations).

15. **What is CloudWatch Logs Live Tail?** *Answer:* Live Tail lets you stream and query log events in real time directly in the CloudWatch console without writing queries. Useful for debugging during deployments or incidents — see log lines appear as they are generated. Supports multiple log groups simultaneously and basic filtering.

---

## CloudWatch Dashboards & Container Insights

16. **What are CloudWatch Dashboards?** *Answer:* Dashboards are customizable home pages in the CloudWatch console with widgets (line charts, bar charts, numbers, text, alarms). You can add metrics from different AWS services and regions into one view. Dashboards are global (not region-specific). They can be shared publicly via a URL. Charged per dashboard per month after 3 free dashboards.

17. **What is CloudWatch Container Insights?** *Answer:* Container Insights collects CPU, memory, disk, and network metrics from ECS, EKS, and Kubernetes clusters. It uses a CloudWatch agent deployed as a DaemonSet (EKS/K8s) or FireLens/built-in integration (ECS). Provides pre-built dashboards at the cluster, node, service, and pod/task level.

18. **What is CloudWatch Lambda Insights?** *Answer:* Lambda Insights is an enhanced monitoring solution for Lambda functions. It collects system-level metrics (CPU time, memory, disk usage, network) and logs cold start and invocation details. It uses a Lambda extension layer that runs alongside your function code. Provides a pre-built Lambda Insights dashboard.

19. **What is CloudWatch Application Insights?** *Answer:* Application Insights automatically sets up monitoring for .NET, Java, and SQL Server applications running on EC2 or ECS. It automatically discovers and configures metrics, logs, and alarms, and uses ML to detect anomalies and correlate related problems across resources (e.g., EC2 + RDS + ALB) into a single problem view.

20. **What is the difference between CloudWatch and AWS X-Ray?** *Answer:*
    | | CloudWatch | X-Ray |
    |---|---|---|
    | Focus | Metrics, logs, alarms | Distributed tracing |
    | Visibility | Per-service individual view | End-to-end request flow |
    | Use case | Monitor infrastructure health | Debug latency across microservices |
    | Data type | Time-series metrics, log lines | Traces (spans with timing and context) |
    | Best for | "Is my system healthy?" | "Why is this request slow?" |
