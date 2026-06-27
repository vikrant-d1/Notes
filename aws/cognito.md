# Cognito Interview Questions

## Cognito Basics

1. **What is Amazon Cognito?** *Answer:* Cognito is a fully managed authentication, authorization, and user management service for web and mobile applications. It handles sign-up, sign-in, social login, MFA, and grants temporary AWS credentials to users. It scales to millions of users without infrastructure management.

2. **What are the two main components of Cognito?** *Answer:*
   - **User Pools:** A user directory service for authentication. Handles sign-up/sign-in, stores user profiles, manages passwords, supports MFA, and issues JWT tokens (ID, Access, Refresh).
   - **Identity Pools (Federated Identities):** Provides temporary AWS IAM credentials to users — authenticated (from User Pools, Google, Facebook, SAML) or unauthenticated (guest). Enables direct access to AWS services like S3 or DynamoDB from client apps.

3. **What is a Cognito User Pool?** *Answer:* A User Pool is a managed user directory. It provides:
   - Sign-up and sign-in (username/password, email/phone)
   - Social login (Google, Facebook, Apple, Amazon) via OAuth 2.0
   - Enterprise SSO via SAML 2.0 and OIDC
   - MFA (TOTP, SMS)
   - Password policies and account recovery
   - Lambda triggers for custom authentication flows
   - Returns JWT tokens (ID token, Access token, Refresh token)

4. **What is a Cognito Identity Pool?** *Answer:* An Identity Pool exchanges an identity token (from a User Pool, Google, Facebook, SAML, or even unauthenticated) for temporary AWS credentials via STS AssumeRoleWithWebIdentity. Your app uses these credentials to call AWS APIs directly (e.g., upload to S3, query DynamoDB). You define IAM roles for authenticated and unauthenticated users with appropriate permissions.

5. **What is the difference between User Pools and Identity Pools?** *Answer:*
   | | User Pool | Identity Pool |
   |---|---|---|
   | Purpose | Authentication (who are you?) | Authorization (what AWS resources can you access?) |
   | Returns | JWT tokens | Temporary AWS credentials |
   | Stores users | Yes, managed user directory | No, just maps identities to IAM roles |
   | Use case | Login/Signup for your app | Access AWS services directly from client |

---

## Authentication Flows

6. **What tokens does Cognito User Pool issue?** *Answer:* After successful authentication, Cognito issues three JWT tokens:
   - **ID Token:** Contains user claims (email, name, custom attributes, groups). Used to identify the user in your backend. Valid for 1 hour.
   - **Access Token:** Used to authorize API calls to the User Pool API (e.g., update user attributes). Also used by API Gateway for authorization. Valid for 1 hour.
   - **Refresh Token:** Long-lived token (default 30 days) used to get new ID and Access tokens without re-authentication. Store securely.

7. **How does social login work with Cognito?** *Answer:* You configure a social identity provider (Google, Facebook, Apple) in the User Pool with the OAuth client ID and secret. Cognito federates the login — the user authenticates with Google's login page, Google redirects back with an authorization code, Cognito exchanges it for tokens, creates/updates the user in the User Pool, and returns Cognito JWT tokens to your app.

8. **What are Cognito Hosted UI?** *Answer:* Cognito provides a pre-built, customizable web UI for sign-up, sign-in, MFA, and password reset. You can customize it with your logo and CSS. It handles the OAuth/OIDC flows for social login. Use the Hosted UI when you don't want to build your own login pages. It uses the standard OAuth 2.0 Authorization Code flow.

9. **What is the Cognito Advanced Security Feature (ASF)?** *Answer:* ASF uses ML to analyze user sign-in activity and detect malicious behavior (compromised credentials, anomalous sign-ins from new devices/locations). It can:
   - Assign risk scores to each sign-in attempt
   - Automatically block high-risk sign-ins or require MFA
   - Send email notifications to users about suspicious activity
   Available as an add-on feature with additional cost.

10. **What are Cognito Lambda Triggers?** *Answer:* Lambda triggers allow you to customize Cognito behavior at various points in the authentication flow:
    - **Pre Sign-up:** Validate or auto-confirm user registration
    - **Post Confirmation:** Send welcome email, add user to groups
    - **Pre Authentication:** Block sign-ins based on custom logic
    - **Post Authentication:** Log sign-ins, update analytics
    - **Pre Token Generation:** Add/modify claims in JWT tokens
    - **Custom Authentication:** Implement passwordless or custom challenge-response flows
    - **Migrate User:** Migrate users from a legacy system on first sign-in

---

## Authorization & Access

11. **How do you use Cognito with API Gateway?** *Answer:* Two integration methods:
    - **Cognito User Pool Authorizer:** API Gateway validates the JWT token from Cognito. If valid, it passes the request to your backend. You configure the authorizer in API Gateway pointing to your User Pool. Simple, no custom code needed.
    - **Lambda Authorizer with Cognito:** A Lambda function validates the token and returns an IAM policy. More flexible — supports custom claims validation, multiple token sources.

12. **How do you implement role-based access control (RBAC) with Cognito?** *Answer:* Use Cognito User Pool Groups. Assign users to groups (e.g., "admin", "editor", "viewer"). In the Pre Token Generation Lambda trigger, add the group membership as a custom claim in the JWT. Your backend checks this claim to determine the user's role. Alternatively, map Cognito groups to IAM roles in Identity Pools for AWS resource access.

13. **What is Cognito User Pool Domain?** *Answer:* A domain is required to use the Cognito Hosted UI. It forms the base URL for the authentication endpoints (`/login`, `/signup`, `/oauth2/token`). Two options:
    - **Amazon domain:** `your-prefix.auth.us-east-1.amazoncognito.com` (free)
    - **Custom domain:** Your own domain with an ACM certificate (must be in us-east-1 for Cognito).

14. **What is Cognito Sync vs AppSync?** *Answer:*
    - **Cognito Sync (deprecated):** Synchronized user app data (preferences, state) across devices.
    - **AppSync:** Replaces Cognito Sync for data synchronization. Provides a full GraphQL API backed by DynamoDB, Lambda, or other sources. Better for complex real-time data synchronization with offline support.

---

## Security & Advanced

15. **How do you secure a mobile app with Cognito?** *Answer:* Recommended architecture:
    1. User signs in via Cognito User Pool → receives JWT tokens
    2. App stores tokens securely (Keychain on iOS, Keystore on Android)
    3. For API calls: include Access/ID token in `Authorization` header
    4. API Gateway/ALB validates the token via Cognito User Pool Authorizer
    5. For AWS service access: exchange ID token with Identity Pool for temporary IAM credentials
    6. Enable Cognito Advanced Security for risk-based authentication

16. **What is the Cognito Refresh Token flow?** *Answer:* The Refresh Token allows apps to get new ID and Access tokens without asking the user to log in again. Your app calls the Cognito token endpoint with the Refresh Token. Cognito validates it and returns new ID and Access tokens. If the Refresh Token is expired (default 30 days), the user must log in again. Refresh tokens can be revoked via the GlobalSignOut or RevokeToken APIs.

17. **How do you migrate users from an existing auth system to Cognito?** *Answer:* Use the **Migrate User Lambda Trigger**. When a user tries to sign in and doesn't exist in Cognito, the trigger fires. Your Lambda validates the credentials against your old system. If valid, it creates the user in Cognito with the same password and returns success. The user is transparently migrated on first login — no mass migration required, no password reset emails needed.

18. **What is Cognito MFA?** *Answer:* Cognito User Pools support:
    - **TOTP (Time-based One-Time Password):** Authenticator apps (Google Authenticator, Authy). Users scan a QR code to set up.
    - **SMS MFA:** Verification code sent via SMS (requires SNS). Higher cost, less secure than TOTP.
    MFA can be optional (user-enabled), required (enforced for all), or adaptive (required based on risk score when ASF is enabled).

19. **What is the Cognito token expiration and how do you handle it?** *Answer:*
    - **ID Token:** 5 minutes to 1 day (default 1 hour)
    - **Access Token:** 5 minutes to 1 day (default 1 hour)
    - **Refresh Token:** 60 minutes to 10 years (default 30 days)
    Handle expiration: catch 401 responses, use the Refresh Token to get new tokens silently, retry the request. Use AWS Amplify SDK which handles this automatically.

20. **What is the difference between Cognito and IAM for authentication?** *Answer:*
    - **IAM:** For AWS service-to-service authentication, internal AWS users, and developers. Users exist in AWS. For technical identities managing AWS infrastructure.
    - **Cognito:** For end-user authentication in web/mobile apps. Users can be external (anyone can sign up). Handles millions of users, social login, OAuth flows, and mobile SDKs. For human users accessing your application.
