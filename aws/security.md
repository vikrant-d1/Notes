# AWS Security Interview Questions

## Core Security Services

1. **What is AWS Shield?** *Answer:* AWS Shield is a managed DDoS (Distributed Denial of Service) protection service. Two tiers:
   - **Shield Standard:** Automatically enabled for all AWS customers at no cost. Protects against common Layer 3/4 DDoS attacks (SYN floods, UDP reflection).
   - **Shield Advanced:** Paid service (~$3,000/month). Provides enhanced DDoS protection, real-time attack visibility, 24/7 DDoS Response Team (DRT) access, and cost protection (credits for scaling costs during attacks). Best for high-risk applications (e-commerce, gaming, finance).

2. **What is AWS WAF (Web Application Firewall)?** *Answer:* AWS WAF filters malicious web traffic at Layer 7 (HTTP/HTTPS). You define Web ACLs with rules to allow, block, or count requests. Protects against: SQL injection, XSS, OWASP Top 10, bot traffic, IP reputation lists. Can be deployed in front of CloudFront, ALB, API Gateway, or AppSync. Integrates with AWS Managed Rules for pre-configured protections.

3. **What is AWS KMS (Key Management Service)?** *Answer:* KMS is a managed service that makes it easy to create and control cryptographic keys used to encrypt your data. It integrates with most AWS services for server-side encryption (S3, EBS, RDS, DynamoDB). Keys never leave KMS unencrypted. You can use AWS-managed keys (free), customer-managed keys (CMKs, $1/month), or import your own key material.

4. **What is AWS Secrets Manager?** *Answer:* Secrets Manager stores, rotates, and retrieves secrets (database passwords, API keys, OAuth tokens). It can automatically rotate credentials (e.g., RDS passwords) without application downtime. Applications retrieve secrets at runtime via API — no hardcoded credentials. Secrets are encrypted with KMS. Charges per secret per month + per API call.

5. **What is the difference between Secrets Manager and SSM Parameter Store?** *Answer:*
   | | Secrets Manager | SSM Parameter Store |
   |---|---|---|
   | Cost | ~$0.40/secret/month | Free (Standard), small fee for Advanced |
   | Auto Rotation | Yes, built-in | No (requires custom Lambda) |
   | Cross-account | Yes | More complex |
   | Use case | Rotating credentials | Configuration, non-rotating secrets |

---

## Threat Detection & Monitoring

6. **What is Amazon GuardDuty?** *Answer:* GuardDuty is a managed threat detection service that continuously monitors for malicious activity and unauthorized behavior in your AWS account. It analyzes CloudTrail logs, VPC Flow Logs, and DNS logs using ML and threat intelligence feeds. Detects: cryptocurrency mining, unauthorized access, credential exfiltration, unusual API calls. Findings are sent to Security Hub or EventBridge for remediation.

7. **What is AWS Security Hub?** *Answer:* Security Hub provides a centralized view of your security posture across AWS accounts and services. It aggregates, organizes, and prioritizes security findings from GuardDuty, Inspector, Macie, IAM Access Analyzer, and third-party tools. It runs automated compliance checks against frameworks like CIS AWS Foundations Benchmark and PCI DSS.

8. **What is Amazon Inspector?** *Answer:* Inspector is an automated vulnerability management service that scans EC2 instances and container images for software vulnerabilities and unintended network exposure. It integrates with AWS Systems Manager (no agent required for EC2 scans) and provides a risk score for each finding. Inspector v2 also scans Lambda functions.

9. **What is Amazon Macie?** *Answer:* Macie uses ML to automatically discover, classify, and protect sensitive data in S3. It detects PII (personally identifiable information), financial data, credentials, and other sensitive content. Generates findings when sensitive data is found in misconfigured (publicly accessible) buckets. Useful for data privacy compliance (GDPR, HIPAA, PCI).

10. **What is AWS CloudTrail?** *Answer:* CloudTrail records API calls made in your AWS account — who made the call, what was called, when, and from where (IP address). By default, CloudTrail stores 90 days of management events for free in the console. For longer retention, send logs to S3 and CloudWatch Logs. Essential for security auditing, compliance, and incident investigation.

---

## Network Security

11. **What is AWS Network Firewall?** *Answer:* AWS Network Firewall is a managed, stateful network firewall and intrusion detection/prevention system (IDS/IPS) for your VPC. It operates at the subnet level and supports stateful packet inspection, domain-based filtering, and Suricata-compatible rules. Deployed in a dedicated firewall subnet, traffic is routed through it via route tables.

12. **What is Amazon Cognito?** *Answer:* Cognito provides authentication, authorization, and user management for web and mobile apps. Two components:
    - **User Pools:** User directory for sign-up/sign-in. Supports MFA, password policies, social login (Google, Facebook), SAML federation. Returns JWT tokens.
    - **Identity Pools:** Grant temporary AWS credentials to authenticated or guest users to access AWS services directly. Integrates with User Pools or external IdPs.

13. **What is AWS Certificate Manager (ACM)?** *Answer:* ACM provisions, manages, and renews SSL/TLS certificates for use with AWS services (CloudFront, ALB, API Gateway). ACM certificates are free for use with integrated AWS services and auto-renew. You cannot use ACM certificates on EC2 instances directly. For certificates on EC2, you'd use an external CA or import a third-party certificate into ACM.

14. **What is AWS Firewall Manager?** *Answer:* Firewall Manager is a security management service to centrally configure and manage firewall rules across all accounts in an AWS Organization. Manages WAF rules, Shield Advanced protections, Security Groups, Network Firewall policies, and Route 53 Resolver DNS Firewall rules. Ensures new accounts automatically get required security policies.

---

## Compliance & Governance

15. **What is AWS Config?** *Answer:* AWS Config continuously monitors and records AWS resource configurations and evaluates them against desired configurations (Config Rules). It provides a configuration history and change notifications. Use cases: detect drift from desired state (e.g., S3 bucket made public), compliance auditing (ensure all EBS volumes are encrypted), troubleshoot changes (who changed what, when).

16. **What is the Shared Responsibility Model?** *Answer:* AWS and the customer share security responsibilities:
    - **AWS is responsible for:** Security OF the cloud — physical hardware, data centers, global network, hypervisor, managed service infrastructure.
    - **Customer is responsible for:** Security IN the cloud — OS patching (EC2), network configuration, security groups, IAM, data encryption, application security.
    - The boundary shifts based on service type: more customer responsibility for IaaS (EC2), less for managed services (RDS, Lambda).

17. **What is AWS Organizations and Service Control Policies (SCPs)?** *Answer:* AWS Organizations lets you centrally manage multiple AWS accounts. SCPs are policies applied to OUs (Organizational Units) or accounts that set maximum permissions — they don't grant permissions, but restrict what IAM policies can allow. An SCP denying S3 access means no one in that account can access S3, regardless of IAM policies. SCPs don't affect the management account.

18. **What is AWS Audit Manager?** *Answer:* Audit Manager continuously collects evidence of your AWS usage to simplify compliance auditing. It maps your AWS usage to requirements in industry standards (SOC 2, PCI DSS, HIPAA, GDPR) and generates reports. It automates evidence collection from AWS services, reducing the manual effort of compliance audits.

19. **What is the difference between KMS Customer Managed Keys and AWS Managed Keys?** *Answer:*
    - **AWS Managed Keys:** Created and managed by AWS for specific services (e.g., `aws/s3`). Free. Rotate automatically every 3 years. You cannot control the key policy, use them outside the specific service, or disable them.
    - **Customer Managed Keys (CMK):** You create and control them. $1/month + $0.03 per 10,000 API calls. Can set key policies, enable/disable, rotate annually. Can be used across multiple services or shared across accounts.

20. **How would you respond to a compromised IAM credential?** *Answer:* Incident response steps:
    1. **Immediately deactivate** the compromised access key via IAM console or CLI
    2. **Delete** the access key (don't just deactivate if compromised)
    3. **Review CloudTrail** to identify all API calls made with the credential
    4. **Check for unauthorized resources** (EC2, IAM users, policies) created by the attacker
    5. **Review and revoke** any IAM permissions or roles granted by the attacker
    6. **Rotate all credentials** associated with the compromised user
    7. **Enable GuardDuty** if not already active for ongoing threat detection
    8. **Report** to AWS security if needed via AWS Support
