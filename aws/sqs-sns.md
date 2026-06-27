# SQS & SNS Interview Questions

## SQS Basics

1. **What is Amazon SQS?** *Answer:* Amazon SQS (Simple Queue Service) is a fully managed message queuing service that decouples and scales microservices, distributed systems, and serverless applications. Producers send messages to a queue; consumers poll and process messages independently. Messages are stored durably until processed.

2. **What are the types of SQS queues?** *Answer:*
   - **Standard Queue:** At-least-once delivery (messages may be delivered more than once), best-effort ordering, nearly unlimited throughput. Use when order doesn't matter or duplicates are handled by the consumer.
   - **FIFO Queue:** Exactly-once processing, guaranteed order (First-In-First-Out), limited to 300 TPS (3,000 with batching). Use when order and exactly-once processing are critical (financial transactions, order processing).

3. **What is the SQS visibility timeout?** *Answer:* When a consumer receives a message, it becomes invisible to other consumers for the visibility timeout period (default 30 seconds, max 12 hours). If the consumer processes and deletes the message before the timeout, it's gone. If not (consumer crashed), the message becomes visible again for another consumer to pick up. Prevents two consumers from processing the same message simultaneously.

4. **What is the SQS message retention period?** *Answer:* Messages can be retained in the queue from 1 minute to 14 days (default 4 days). If not consumed and deleted within the retention period, messages are automatically deleted. For long-retention needs, design consumers to be fast or use a database to store work items instead.

5. **What is SQS Long Polling vs Short Polling?** *Answer:*
   - **Short Polling (default):** Consumer sends a receive request and gets an immediate response — even if the queue is empty (empty response). Expensive if the queue is often empty (many empty API calls).
   - **Long Polling:** Consumer waits up to 20 seconds for a message to arrive. Reduces empty responses, decreases API calls, and lowers costs. Always prefer long polling (set `WaitTimeSeconds` = 20).

---

## SQS Advanced

6. **What is a Dead Letter Queue (DLQ)?** *Answer:* A DLQ is a queue where messages that couldn't be processed successfully are sent after a specified number of failed attempts (maxReceiveCount). This prevents poison-pill messages from blocking the queue forever. You inspect and reprocess DLQ messages separately after fixing the underlying issue.

7. **What is SQS Message Deduplication?** *Answer:* In FIFO queues, deduplication prevents duplicate messages from being processed within a 5-minute window. You set a deduplication ID (content-based hash or custom ID). If two messages with the same dedup ID are sent within 5 minutes, SQS accepts the second but doesn't deliver it to consumers.

8. **What is SQS Message Group ID?** *Answer:* In FIFO queues, the Message Group ID groups related messages. Messages within the same group are processed in order (FIFO), one at a time. Different groups can be processed in parallel. Example: use customer ID as the group ID to ensure each customer's orders are processed in order, while orders from different customers are processed concurrently.

9. **What is SQS Extended Client Library?** *Answer:* SQS has a 256 KB message size limit. The Extended Client Library (available for Java) enables sending large messages by storing the payload in S3 and sending only an S3 pointer in the SQS message. The consumer retrieves the full message from S3. Useful for large data payloads.

10. **How does SQS integrate with Lambda?** *Answer:* Lambda can be configured as an event source for SQS. Lambda polls the queue, retrieves batches of messages (up to 10,000 for Standard, 10 for FIFO), and invokes your function with the batch. If the function returns an error, the entire batch is retried (or specific messages via `batchItemFailures`). Lambda manages scaling — adds more concurrent invocations as the queue depth grows.

---

## SNS Basics

11. **What is Amazon SNS?** *Answer:* Amazon SNS (Simple Notification Service) is a fully managed pub/sub messaging service. Publishers send messages to a Topic; all subscribers receive the message simultaneously. Supports multiple protocols: SQS, Lambda, HTTP/HTTPS, Email, SMS, and mobile push notifications (APNs, FCM/GCM).

12. **What is a SNS Topic?** *Answer:* A Topic is a logical access point and communication channel. Publishers send messages to a topic, and SNS delivers those messages to all subscribers. Each topic has an ARN. Topics support access policies to control who can publish/subscribe.

13. **What is the difference between SNS and SQS?** *Answer:*
    | | SNS | SQS |
    |---|---|---|
    | Pattern | Publish/Subscribe (push) | Queue (pull) |
    | Message delivery | All subscribers at once | One consumer per message |
    | Persistence | No (lost if no subscriber) | Up to 14 days |
    | Consumers | Many (fan-out) | One consumer at a time |
    | Best for | Event notification, fan-out | Task queue, decoupling |

14. **What is SNS Fan-Out Pattern?** *Answer:* Fan-out sends one event to multiple downstream systems. An SNS topic delivers to multiple SQS queues (subscribers). Each SQS queue has its own consumer(s) that process the event independently, at their own pace. Example: order placed → SNS → (fulfillment queue) + (analytics queue) + (email notification queue). This decouples producers from consumers.

15. **What is SNS FIFO?** *Answer:* SNS FIFO Topics deliver messages in strict order and support exactly-once delivery, similar to SQS FIFO. SNS FIFO can only fan-out to SQS FIFO queues (not HTTP, email, etc.). Used when subscribers need to process events in the same order they occurred (e.g., stock price updates, bank transactions).

---

## Kinesis

16. **What is Amazon Kinesis?** *Answer:* Kinesis is a family of services for real-time data streaming. Components:
    - **Kinesis Data Streams:** Collect and process real-time data streams. Low-latency, ordered, replay-able.
    - **Kinesis Data Firehose:** Fully managed delivery service to S3, Redshift, Elasticsearch, HTTP endpoints. No coding needed.
    - **Kinesis Data Analytics:** Real-time SQL or Flink queries on streaming data.
    - **Kinesis Video Streams:** Stream video from devices to AWS for processing/ML.

17. **What is the difference between SQS and Kinesis?** *Answer:*
    | | SQS | Kinesis Data Streams |
    |---|---|---|
    | Ordering | FIFO queue only | Per shard, ordered |
    | Retention | Up to 14 days | 1-365 days |
    | Consumers | One consumer per message | Multiple consumers, same data |
    | Replay | No | Yes (within retention period) |
    | Throughput | Auto-scales | Fixed shards (1 MB/s write per shard) |
    | Best for | Task queues | Real-time analytics, event sourcing |

18. **What is a Kinesis Shard?** *Answer:* A shard is the base throughput unit of a Kinesis Data Stream. Each shard supports 1 MB/s or 1,000 records/sec for writes, and 2 MB/s for reads. You choose the number of shards based on your data volume. Shards can be split (scale up) or merged (scale down). Data is distributed across shards based on the partition key hash.

---

## EventBridge

19. **What is Amazon EventBridge?** *Answer:* EventBridge is a serverless event bus for event-driven architectures. It routes events from AWS services, SaaS applications (Salesforce, Zendesk), or custom apps to targets (Lambda, SQS, Step Functions, other accounts). You define Rules with event patterns (filter criteria) and targets. Supports event archiving and replay.

20. **What is the difference between EventBridge and SNS?** *Answer:*
    | | EventBridge | SNS |
    |---|---|---|
    | Event routing | Content-based filtering (any field) | Topic-based |
    | Sources | AWS services, SaaS, custom | Any publisher to topic |
    | Schema registry | Yes, with schema discovery | No |
    | Replay | Yes, archive and replay | No |
    | Targets | 20+ AWS services, cross-account | Limited protocols |
    | Best for | Complex event routing, SaaS integration | Simple notifications, fan-out |
