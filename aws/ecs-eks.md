# ECS & EKS Interview Questions

## ECS Basics

1. **What is Amazon ECS?** *Answer:* Amazon ECS (Elastic Container Service) is a fully managed container orchestration service for running Docker containers on AWS. You define your application as tasks and services, and ECS handles scheduling, scaling, and managing containers on a cluster. ECS integrates natively with other AWS services (ALB, IAM, CloudWatch, Secrets Manager).

2. **What is the difference between ECS and EKS?** *Answer:*
   | | ECS | EKS |
   |---|---|---|
   | Orchestrator | AWS-proprietary | Kubernetes (open-source) |
   | Learning curve | Lower, simpler | Higher (Kubernetes knowledge needed) |
   | Portability | AWS only | Portable to any Kubernetes cluster |
   | Cost | No control plane cost | $0.10/hour for EKS control plane |
   | Best for | AWS-native workloads, simpler setups | Teams already using K8s, multi-cloud |

3. **What are the ECS launch types?** *Answer:*
   - **Fargate:** Serverless. AWS manages the underlying EC2 instances. You only define CPU/memory per task. No cluster management needed. Pay per task.
   - **EC2:** You manage EC2 instances in the cluster. More control, lower cost at scale, supports GPU instances. Requires more operational overhead (patching, scaling).

4. **What is an ECS Task Definition?** *Answer:* A Task Definition is a blueprint for your application — like a Dockerfile but for a set of containers. It defines: container images, CPU/memory, port mappings, environment variables, logging configuration, IAM task role, volumes, and network mode. Task Definitions are versioned; updates create new revisions.

5. **What is the difference between an ECS Task and an ECS Service?** *Answer:*
   - **Task:** A single running instance of a Task Definition. Like running `docker run`. Can be one-off (batch job, cron) or long-running.
   - **Service:** Maintains a specified number of running Tasks at all times. Handles restarts if a task fails, integrates with ALB for load balancing, and manages rolling deployments.

---

## Networking & IAM

6. **What is the awsvpc network mode in ECS?** *Answer:* In `awsvpc` mode, each ECS task gets its own Elastic Network Interface (ENI) with a dedicated private IP address (just like an EC2 instance). This enables task-level security groups, direct IP routing, and integration with ALB target groups at the task level. Required for Fargate. Preferred for EC2 launch type too.

7. **What is the ECS Task Role vs Task Execution Role?** *Answer:*
   - **Task Role:** The IAM role that the application code inside the container assumes. Grants permissions your app needs (e.g., read S3, write DynamoDB). Attached to the Task Definition.
   - **Task Execution Role:** Used by the ECS agent/Fargate to pull container images from ECR, write logs to CloudWatch, and retrieve secrets from Secrets Manager. AWS provides a managed policy: `AmazonECSTaskExecutionRolePolicy`.

8. **What is Amazon ECR?** *Answer:* Amazon ECR (Elastic Container Registry) is a fully managed Docker container registry. It stores, manages, and deploys container images. Integrated with ECS, EKS, and CodePipeline for CI/CD. Supports image scanning for vulnerabilities (using Inspector), lifecycle policies to auto-delete old images, and cross-region/cross-account replication.

---

## Scaling & Deployments

9. **How does ECS Auto Scaling work?** *Answer:* ECS Service Auto Scaling adjusts the number of running tasks based on CloudWatch metrics. Policies:
   - **Target Tracking:** Automatically adjusts tasks to maintain a target metric (e.g., CPU utilization at 70%)
   - **Step Scaling:** Increase/decrease tasks by specific amounts when alarms cross thresholds
   - **Scheduled Scaling:** Scale at specific times (predictable traffic patterns)
   Fargate auto-scales compute automatically; EC2 launch type also needs cluster capacity auto-scaling via ASG.

10. **What are ECS deployment strategies?** *Answer:*
    - **Rolling Update:** Gradually replace old tasks with new tasks. Define minimum healthy percent and maximum percent to control speed and availability.
    - **Blue/Green Deployment (via CodeDeploy):** Run old (blue) and new (green) simultaneously, then shift traffic. Supports canary (10% first, then 100%) or linear (10% every X minutes) strategies. Instant rollback by re-routing traffic.

---

## EKS Basics

11. **What is Amazon EKS?** *Answer:* Amazon EKS (Elastic Kubernetes Service) is a managed Kubernetes service that runs the Kubernetes control plane (API server, etcd) on AWS infrastructure. AWS handles control plane availability, scaling, and upgrades. You manage the worker nodes (EC2 or Fargate). EKS is certified Kubernetes-conformant — workloads run on EKS as they would on any Kubernetes cluster.

12. **What are EKS Node Groups?** *Answer:* Node Groups are collections of EC2 instances registered as Kubernetes worker nodes. Types:
    - **Managed Node Groups:** AWS provisions, updates, and terminates nodes in your account. Handles draining before termination.
    - **Self-Managed Nodes:** You launch and manage EC2 instances yourself. More control but more work.
    - **Fargate Profile:** Run pods serverlessly on Fargate — no node management at all.

13. **What is the difference between a Pod, Deployment, and Service in Kubernetes?** *Answer:*
    - **Pod:** Smallest deployable unit. Contains one or more containers sharing network and storage. Ephemeral — if it dies, it's gone.
    - **Deployment:** Manages a ReplicaSet of Pods. Ensures desired number of replicas run, handles rolling updates and rollbacks.
    - **Service:** Stable network endpoint for a set of Pods. Types: ClusterIP (internal), NodePort (external via node port), LoadBalancer (creates AWS NLB/ALB), ExternalName.

14. **What is the AWS Load Balancer Controller in EKS?** *Answer:* The AWS Load Balancer Controller is a Kubernetes controller that watches for Service (type LoadBalancer) and Ingress resources and automatically provisions AWS ALB or NLB. For Ingress resources, it creates an ALB with path-based routing, host-based routing, HTTPS, and target group bindings.

15. **What is EKS Anywhere?** *Answer:* EKS Anywhere allows you to create and manage Kubernetes clusters on your own infrastructure (on-premises or other clouds) using the same EKS APIs and tooling. It enables a consistent Kubernetes experience across environments, with optional connectivity to AWS for services like ECR, IAM, and CloudWatch.

---

## Advanced Concepts

16. **What is AWS App Mesh?** *Answer:* App Mesh is a service mesh that provides application-level networking for microservices. It uses Envoy proxy sidecars to intercept and control traffic between services. Provides: traffic routing (canary, A/B), retries, circuit breakers, observability (metrics, logs, traces via X-Ray), and mTLS between services. Works with ECS, EKS, and EC2.

17. **What is the difference between Docker Compose and ECS Task Definitions?** *Answer:* Docker Compose is for local multi-container development. ECS Task Definitions are the AWS-managed equivalent for production — they add IAM roles, logging to CloudWatch, Secrets Manager integration, networking configuration (awsvpc), health checks, and resource limits (CPU/memory at both task and container level).

18. **How do you pass secrets to containers in ECS/EKS?** *Answer:*
    - **ECS:** Reference secrets from Secrets Manager or SSM Parameter Store in the Task Definition. ECS fetches them at task launch and injects as environment variables or files. Never hardcode in Task Definition.
    - **EKS:** Use Kubernetes Secrets (base64 encoded, not truly secure) or the External Secrets Operator/AWS Secrets and Config Provider (ASCP) to sync Secrets Manager/SSM secrets to Kubernetes Secrets automatically.

19. **What is Horizontal Pod Autoscaler (HPA) in EKS?** *Answer:* HPA automatically scales the number of pod replicas in a Deployment based on CPU/memory utilization or custom metrics. It queries metrics from the Kubernetes Metrics Server and adjusts replicas to maintain the target. For scaling based on custom metrics (SQS queue depth, request rate), use KEDA (Kubernetes Event-Driven Autoscaling).

20. **What is Karpenter?** *Answer:* Karpenter is an open-source, AWS-built Kubernetes node autoscaler. Unlike the Cluster Autoscaler (which manages pre-defined node groups), Karpenter directly provisions the right EC2 instances for pending pods — selecting optimal instance types based on pod requirements (CPU, memory, GPU, architecture). It launches nodes in seconds and consolidates workloads to remove underutilized nodes.
