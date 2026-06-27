# IAM Interview Questions

## IAM Basics

1. **What is AWS IAM?** *Answer:* IAM (Identity and Access Management) is an AWS service that controls who (authentication) can do what (authorization) in your AWS account. It is global (not region-specific) and free. IAM manages users, groups, roles, and policies.

2. **What is the IAM root user?** *Answer:* The root user is the account created when you first sign up for AWS. It has complete access to all AWS services and resources. Best practices: enable MFA on root, do not use root for everyday tasks, create IAM users instead. Root is required only for tasks like changing account settings, closing the account, or managing billing.

3. **What is an IAM User?** *Answer:* An IAM User is an entity you create in AWS to represent a person or application that interacts with AWS. A user has permanent credentials (username/password for console, access keys for CLI/API). Users can be assigned permissions directly or via groups.

4. **What is an IAM Group?** *Answer:* An IAM Group is a collection of IAM users. You attach policies to groups, and all users in the group inherit those permissions. Groups cannot be nested (no groups within groups). This makes permissions management easier — add/remove users from groups instead of editing each user's permissions.

5. **What is an IAM Role?** *Answer:* An IAM Role is an identity with specific permissions that can be temporarily assumed by trusted entities (EC2 instances, Lambda functions, other AWS accounts, users). Unlike users, roles have no permanent credentials — they issue temporary security credentials via STS. Roles are the preferred way to grant permissions to AWS services.

---

## Policies

6. **What is an IAM Policy?** *Answer:* A policy is a JSON document that defines permissions. It specifies Effect (Allow/Deny), Action (what AWS API calls), Resource (which resources), and optionally Condition. Types:
   - **Managed Policies:** AWS-managed (predefined) or customer-managed (you create). Can be attached to multiple identities.
   - **Inline Policies:** Embedded directly into a single user, group, or role. Deleted when the identity is deleted.

7. **What is the structure of an IAM Policy?** *Answer:*
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:GetObject", "s3:PutObject"],
         "Resource": "arn:aws:s3:::my-bucket/*",
         "Condition": {
           "StringEquals": { "aws:RequestedRegion": "us-east-1" }
         }
       }
     ]
   }
   ```
   - **Effect:** Allow or Deny
   - **Action:** API calls (e.g., s3:GetObject, ec2:*)
   - **Resource:** ARN of the resource
   - **Condition:** Optional constraints

8. **What is the IAM policy evaluation logic?** *Answer:* AWS evaluates policies in this order:
   1. **Explicit Deny** — if any policy has an explicit Deny, access is denied. Period.
   2. **Explicit Allow** — if no deny and any policy has an Allow, access is granted.
   3. **Implicit Deny** — default if no explicit Allow is found. Everything is denied by default.

9. **What is the difference between Identity-Based and Resource-Based Policies?** *Answer:*
   - **Identity-Based:** Attached to a user, group, or role. Specifies what that identity can do.
   - **Resource-Based:** Attached to a resource (like an S3 bucket or Lambda function). Specifies who can access that resource. Supports cross-account access without role assumption.

10. **What is an AWS Managed Policy vs Customer Managed Policy?** *Answer:*
    - **AWS Managed:** Predefined by AWS for common use cases (e.g., AmazonS3ReadOnlyAccess, AdministratorAccess). Automatically updated by AWS when new services/features are added.
    - **Customer Managed:** You create and manage them. More fine-grained control. You are responsible for updates.
    - **Inline Policy:** Directly embedded in one identity. Cannot be reused. Deleted with the identity.

---

## Roles & Authentication

11. **When should you use IAM Roles instead of IAM Users?** *Answer:* Use roles when:
    - EC2 instances or Lambda functions need AWS permissions (avoid hardcoding credentials)
    - Cross-account access is needed
    - Granting temporary access to users (assumed via STS)
    - Third-party identity providers (SAML/OIDC federation)
    Roles issue temporary credentials automatically and rotate them, making them more secure.

12. **What is AWS STS (Security Token Service)?** *Answer:* STS issues temporary security credentials (access key, secret key, session token) with a configurable expiration (15 minutes to 36 hours). Key API calls:
    - **AssumeRole:** Take on permissions of another role
    - **AssumeRoleWithWebIdentity:** For OIDC/OAuth (mobile apps, web federation)
    - **AssumeRoleWithSAML:** For enterprise SSO integration
    - **GetSessionToken:** MFA-protected API access

13. **What is IAM Role Trust Policy?** *Answer:* A Trust Policy is the resource-based policy attached to a role that defines who is allowed to assume that role (the principal). It's separate from the permission policy (what the role can do). Example: `"Principal": {"Service": "ec2.amazonaws.com"}` allows EC2 to assume the role.

14. **What is IAM Identity Center (formerly AWS SSO)?** *Answer:* IAM Identity Center provides single sign-on access to multiple AWS accounts and business applications. It integrates with external identity providers (Active Directory, Okta, etc.) and allows users to log in once with their corporate credentials to access all their AWS accounts.

15. **What is the difference between authentication and authorization in IAM?** *Answer:*
    - **Authentication:** Verifying identity (who are you?) — via username/password, access keys, or temporary credentials from STS.
    - **Authorization:** Determining permissions (what can you do?) — evaluated by IAM policies after authentication.

---

## Security Best Practices

16. **What is MFA in AWS IAM?** *Answer:* Multi-Factor Authentication adds a second layer of security by requiring a one-time code (from a virtual or hardware MFA device) in addition to the password. Best practices: enable MFA for the root user and all privileged IAM users. You can enforce MFA using IAM policy conditions.

17. **What is an IAM Access Key?** *Answer:* Access keys are long-term credentials consisting of an Access Key ID and Secret Access Key, used for programmatic access (CLI, SDK, API). Best practices: rotate access keys regularly, don't embed in code, use IAM roles for EC2/Lambda instead. Each user can have a maximum of 2 access keys.

18. **What is the Principle of Least Privilege?** *Answer:* Grant only the minimum permissions required to perform a task. Start with no permissions and grant only what is needed. Regularly review and remove unnecessary permissions. Use IAM Access Analyzer to identify overly permissive policies.

19. **What is IAM Access Analyzer?** *Answer:* IAM Access Analyzer analyzes resource policies (S3 buckets, KMS keys, SQS queues, etc.) to identify resources that are shared with external entities (outside your account or organization). It generates findings for public or cross-account access, helping you identify unintended access.

20. **What are IAM Permission Boundaries?** *Answer:* A Permission Boundary is an IAM managed policy set as the maximum permissions a user or role can have. Even if a policy grants more permissions, the effective permissions are the intersection of the identity's policies and the permission boundary. Useful for delegating permission management to developers while preventing privilege escalation.
