# Lambda Interview Questions

## Lambda Basics

1. **What is AWS Lambda?** *Answer:* AWS Lambda is a serverless compute service that lets you run code without provisioning or managing servers. You upload your code, configure triggers, and Lambda runs your function in response to events. You pay only for the compute time consumed — there is no charge when your code is not running.

2. **What are Lambda's key limits?** *Answer:*
   - **Execution timeout:** Maximum 15 minutes per invocation
   - **Memory:** 128 MB to 10,240 MB (CPU scales proportionally)
   - **Package size:** 50 MB (zipped), 250 MB (unzipped), 10 GB (container image)
   - **Concurrent executions:** 1,000 per region (soft limit, can be increased)
   - **Ephemeral storage (/tmp):** 512 MB to 10,240 MB
   - **Environment variables:** 4 KB total

3. **What programming languages does Lambda support?** *Answer:* Lambda supports Node.js, Python, Java, Go, C#/.NET, Ruby, and any other language via custom runtimes (using the Lambda Runtime API). You can also package your function as a Docker container image.

4. **What is a Lambda trigger?** *Answer:* A trigger is an AWS service or resource that invokes your Lambda function. Common triggers:
   - API Gateway / ALB (HTTP requests)
   - S3 (object created/deleted)
   - DynamoDB Streams / Kinesis (stream records)
   - SQS (messages)
   - SNS (notifications)
   - CloudWatch Events / EventBridge (scheduled or event-based)
   - Cognito (authentication flows)

5. **What are the three invocation models for Lambda?** *Answer:*
   - **Synchronous (push):** Caller waits for Lambda to finish and returns the response. Used by API Gateway, ALB, SDK direct calls.
   - **Asynchronous (event):** Lambda queues the event and returns immediately. Caller doesn't wait. Used by S3, SNS, EventBridge. Lambda retries twice on failure.
   - **Polling (stream/queue):** Lambda polls SQS, Kinesis, or DynamoDB Streams and invokes the function with batches of records.

---

## Performance & Scaling

6. **What is a Cold Start in Lambda?** *Answer:* A cold start occurs when a new Lambda execution environment is initialized — AWS must download your code, start the runtime, and run your initialization code (outside the handler). This adds latency (100ms to 1+ second depending on language and package size). Cold starts happen when: first invocation, no warm container available, scaling out to handle more concurrency. Java and .NET have longer cold starts than Node.js and Python.

7. **How can you reduce Lambda cold starts?** *Answer:*
   - **Provisioned Concurrency:** Pre-warms a specified number of execution environments so they're always ready. No cold starts, but you pay even when idle.
   - **Use lighter runtimes:** Python/Node.js have faster init than Java/.NET
   - **Minimize package size:** Smaller packages load faster
   - **Move initialization outside the handler:** Database connections, SDK clients, config loading — do this once at the module level, reuse across invocations
   - **Lambda SnapStart (Java):** Snapshots the initialized execution environment and restores it on demand

8. **What is Lambda Concurrency?** *Answer:* Concurrency is the number of function instances serving requests simultaneously. Lambda scales automatically by launching new instances for concurrent requests. Types:
   - **Unreserved Concurrency:** Shared pool for all functions in the account (default 1,000 per region)
   - **Reserved Concurrency:** Guarantees a maximum number of concurrent executions for a specific function (and limits it to that number)
   - **Provisioned Concurrency:** Pre-initialized execution environments for consistent low-latency

9. **What is a Lambda Execution Environment?** *Answer:* Each Lambda invocation runs in an isolated execution environment (microVM using Firecracker). The environment includes the runtime, your code, and the /tmp file system. AWS may reuse the same environment for subsequent invocations of the same function — this is the "warm" state that avoids cold starts. Variables and objects initialized outside the handler persist across warm invocations.

10. **What is Lambda Layers?** *Answer:* Lambda Layers allow you to package libraries, dependencies, or custom runtimes separately from your function code. Multiple functions can share the same layer. Benefits: smaller deployment packages, shared code/dependencies, layer versioning. A function can use up to 5 layers, and total size (function + layers) cannot exceed 250 MB unzipped.

---

## Integration & Configuration

11. **What is the difference between Lambda and EC2?** *Answer:*
    | | Lambda | EC2 |
    |---|---|---|
    | Management | Fully managed, serverless | You manage OS, patches, scaling |
    | Pricing | Per request + duration | Per hour (even when idle) |
    | Scaling | Automatic, per request | Manual or Auto Scaling |
    | Max runtime | 15 minutes | No limit |
    | Use case | Event-driven, short tasks | Long-running, stateful apps |

12. **What is Lambda Dead Letter Queue (DLQ)?** *Answer:* A DLQ captures events that Lambda failed to process (after retries) during asynchronous invocations. You can configure an SQS queue or SNS topic as the DLQ. This prevents events from being silently lost. Modern alternative: Lambda Destinations offers more flexibility (success and failure routing to SQS, SNS, EventBridge, or another Lambda).

13. **What is Lambda Destinations?** *Answer:* Lambda Destinations allow you to configure separate targets for successful and failed asynchronous invocations. On success, you might send the result to another Lambda or EventBridge. On failure, you might send to SQS for manual review. More flexible than DLQ as it handles both success and failure paths and includes the function's response.

14. **How does Lambda access resources in a VPC?** *Answer:* By default, Lambda runs in an AWS-managed VPC with internet access but cannot reach resources in your VPC (like RDS or ElastiCache). You can configure Lambda to run in your VPC by specifying subnets and security groups. Lambda creates an ENI in your subnet to access private resources. Note: VPC Lambda has no internet access by default — you need a NAT Gateway for internet access.

15. **What is Lambda@Edge?** *Answer:* Lambda@Edge runs Lambda functions at CloudFront edge locations, closer to users. Triggered by CloudFront events (viewer request/response, origin request/response). Used for: A/B testing, URL rewrites, authentication at the edge, dynamic content customization. Limitations: max 5 seconds timeout (1 second for viewer events), no VPC access, no environment variables.

---

## Advanced Concepts

16. **What is the Lambda Execution Role?** *Answer:* The execution role is an IAM role that Lambda assumes when executing your function. It defines what AWS services and resources your function can access (e.g., read from S3, write to DynamoDB, publish to SNS). You should follow least privilege — only grant permissions your function actually needs.

17. **How do you manage environment variables in Lambda?** *Answer:* Lambda supports environment variables (up to 4 KB total) that are injected into your function's runtime. For sensitive values, use AWS KMS to encrypt environment variables at rest. Better practice: use AWS Secrets Manager or SSM Parameter Store at runtime — this avoids storing secrets in Lambda config and enables rotation.

18. **What is Lambda Power Tuning?** *Answer:* Lambda Power Tuning (an AWS open-source tool) helps you find the optimal memory configuration for your function. Since CPU scales proportionally with memory, more memory can actually make a function run faster and cost less overall (despite the higher per-ms rate). You test multiple memory settings and compare cost vs performance.

19. **What is the difference between Lambda and Fargate for running containers?** *Answer:*
    - **Lambda containers:** Up to 10 GB image, 15-min max, pay per invocation. Best for event-driven, short-lived tasks.
    - **Fargate:** No time limit, full container control, always-on or task-based. Best for long-running services, web servers, batch jobs.

20. **How do you monitor and debug Lambda functions?** *Answer:*
    - **CloudWatch Logs:** Lambda automatically sends logs. Use structured JSON logging.
    - **CloudWatch Metrics:** Invocations, errors, duration, throttles, concurrent executions
    - **X-Ray:** Distributed tracing to visualize and debug Lambda function calls and their downstream AWS service calls
    - **Lambda Insights:** Enhanced monitoring with system-level metrics (CPU, memory, disk, network)
