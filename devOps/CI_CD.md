### Create Dockerfile:

```Dockerfile
# ---------- Dependencies ----------
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci


# ---------- Build ----------
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


# ---------- Production ----------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
```

### Create CI/CD Application
```YML
name: Next.js CI/CD

on:
  push:
    branches:
      - main

jobs:

  # ==============================
  # CI
  # ==============================
  test:
    name: Test and Build
    runs-on: ubuntu-latest

    steps:

      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

      - name: Run tests
        run: npm test -- --runInBand

      - name: Build Next.js
        run: npm run build


  # ==============================
  # CD
  # ==============================
  deploy:
    name: Deploy to EC2
    needs: test

    runs-on: ubuntu-latest

    if: github.ref == 'refs/heads/main'

    steps:

      - name: Configure SSH
        env:
          SSH_PRIVATE_KEY: ${{ secrets.EC2_SSH_KEY }}
          EC2_HOST: ${{ secrets.EC2_HOST }}
        run: |
          mkdir -p ~/.ssh

          echo "$SSH_PRIVATE_KEY" > ~/.ssh/ec2_key

          chmod 600 ~/.ssh/ec2_key

          ssh-keyscan -H "$EC2_HOST" >> ~/.ssh/known_hosts

      - name: Deploy application
        env:
          EC2_HOST: ${{ secrets.EC2_HOST }}
          EC2_USER: ${{ secrets.EC2_USER }}
        run: |
          ssh -i ~/.ssh/ec2_key \
          "$EC2_USER@$EC2_HOST" << 'EOF'

            set -e

            cd /home/ubuntu/nextjs-app

            echo "Pulling latest code..."
            git fetch origin
            git reset --hard origin/main

            echo "Building Docker image..."
            docker build -t nextjs-app:${{ github.sha }} .

            echo "Stopping old container..."
            docker rm -f nextjs-app || true

            echo "Starting new container..."
            docker run -d \
              --name nextjs-app \
              --restart unless-stopped \
              -p 127.0.0.1:3000:3000 \
              nextjs-app:${{ github.sha }}

            echo "Cleaning old Docker images..."
            docker image prune -f

            echo "Deployment completed."

          EOF
```

---

## 🔷 SECTION 1: CI/CD Fundamentals

---

### Q1. What is CI/CD? Why is it important?

**Answer:**

**CI (Continuous Integration)** is the practice of automatically integrating code changes from multiple contributors into a shared repository frequently — usually multiple times a day. Each integration is verified by an automated build and test.

**CD (Continuous Delivery/Deployment)** extends CI by automatically deploying integrated code to staging or production environments.

**Why it matters:**
- Catches bugs early through automated testing
- Reduces integration problems ("integration hell")
- Faster delivery of features to end users
- Consistent, repeatable deployments
- Reduces manual effort and human error

---

### Q2. What is the difference between Continuous Delivery and Continuous Deployment?

**Answer:**

| | Continuous Delivery | Continuous Deployment |
|---|---|---|
| **Definition** | Code is always in a deployable state and *can* be released at any time | Every passing build is *automatically* deployed to production |
| **Human intervention** | Manual approval required to deploy | Fully automated — no manual step |
| **Risk** | Lower (human gate before prod) | Higher (requires solid test coverage) |
| **Use case** | Regulated industries, careful releases | Fast-moving SaaS products |

---

### Q3. What are the key stages of a CI/CD pipeline?

**Answer:**

1. **Source** — Code is pushed to a version control system (e.g., GitHub)
2. **Build** — Code is compiled/bundled (e.g., `npm run build`, `mvn package`)
3. **Test** — Automated tests run (unit, integration, e2e)
4. **Static Analysis** — Code quality checks (linting, SAST, code coverage)
5. **Artifact Creation** — Docker image, JAR, ZIP, etc. is created
6. **Deploy to Staging** — Artifact deployed to a non-production environment
7. **Acceptance Testing** — Integration/smoke tests in staging
8. **Deploy to Production** — Manual or automated release
9. **Monitor** — Logs, metrics, and alerts post-deployment

---

### Q4. What is a build artifact?

**Answer:**

A build artifact is the output produced by a build process — it's the packaged, ready-to-deploy version of the application. Examples:
- A Docker image
- A `.jar` or `.war` file (Java)
- A compiled binary
- A `.zip` bundle (Lambda functions)
- An npm package

Artifacts are stored in artifact registries (e.g., Docker Hub, AWS ECR, Nexus, GitHub Packages) and referenced by deployment pipelines.

---

### Q5. What is a pipeline as code?

**Answer:**

Pipeline as code means defining your CI/CD pipeline configuration in a file stored alongside the application source code (in version control). Benefits:
- Versioned, auditable, and reviewable just like application code
- Reusable across branches and repositories
- No need to configure pipelines manually in a UI

**Examples:**
- GitHub Actions: `.github/workflows/pipeline.yml`
- GitLab CI: `.gitlab-ci.yml`
- Jenkins: `Jenkinsfile`
- CircleCI: `.circleci/config.yml`

---

### Q6. What is a blue-green deployment?

**Answer:**

Blue-green deployment is a release strategy that maintains two identical production environments:
- **Blue** = current live environment
- **Green** = new version being deployed

Traffic is switched from Blue → Green once the new version is validated. If issues arise, rollback is instant by switching back to Blue.

**Advantages:** Zero downtime, instant rollback  
**Disadvantages:** Requires double infrastructure cost

---

### Q7. What is a canary deployment?

**Answer:**

A canary deployment gradually rolls out changes to a small subset of users first (e.g., 5%), monitors for errors or degraded metrics, then progressively increases the rollout (10% → 50% → 100%).

**Advantages:** Reduces blast radius of bugs, real-world validation before full release  
**Disadvantages:** More complex to implement and monitor

---

### Q8. What is a rollback strategy in CI/CD?

**Answer:**

A rollback strategy defines how to revert to a previous stable version when a deployment fails. Common approaches:
- **Re-deploy the previous artifact** — trigger the pipeline with the last known good version
- **Feature flags** — disable a faulty feature without redeploying
- **Blue-green switch** — revert traffic to the previous environment
- **Database rollbacks** — using migration tools with down migrations (e.g., Flyway, Liquibase)

---

### Q9. What is the difference between a build pipeline and a release pipeline?

**Answer:**

| | Build Pipeline | Release Pipeline |
|---|---|---|
| **Purpose** | Compile, test, and package code | Deploy artifacts to environments |
| **Triggered by** | Code commit/pull request | Successful build or manual approval |
| **Output** | Build artifact | Running application in an environment |
| **Example tools** | GitHub Actions, Jenkins | Spinnaker, ArgoCD, Azure Release Pipelines |

---

### Q10. What are environment variables and secrets in CI/CD?

**Answer:**

**Environment variables** are key-value pairs injected into pipeline steps at runtime (e.g., `NODE_ENV=production`).

**Secrets** are sensitive environment variables (e.g., API keys, passwords, tokens) that must be:
- Encrypted at rest
- Never printed in logs
- Scoped to specific pipelines or environments

**How secrets are managed:**
- GitHub Actions: `Settings > Secrets and variables`
- AWS: AWS Secrets Manager or Parameter Store
- HashiCorp Vault
- Kubernetes: `kubectl create secret`

---

## 🔷 SECTION 2: GitHub & GitHub Actions

---

### Q11. What is GitHub Actions?

**Answer:**

GitHub Actions is GitHub's built-in CI/CD platform that allows you to automate workflows directly from your GitHub repository. It uses YAML files stored in `.github/workflows/` to define automation.

Key features:
- Event-driven (push, PR, schedule, manual trigger)
- Marketplace of reusable actions
- Matrix builds (test across multiple OS/versions simultaneously)
- Self-hosted or GitHub-hosted runners
- Deep integration with GitHub (PRs, issues, releases)

---

### Q12. Explain the key components of a GitHub Actions workflow file.

**Answer:**

```yaml
name: CI Pipeline           # Workflow name

on:                         # Trigger events
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:                       # One or more jobs
  build:                    # Job name
    runs-on: ubuntu-latest  # Runner OS

    steps:                  # Sequential steps
      - name: Checkout code
        uses: actions/checkout@v4     # Reusable action

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install              # Shell command

      - name: Run tests
        run: npm test
```

**Key components:**
- `name` — Workflow identifier
- `on` — Events that trigger the workflow
- `jobs` — Independent units of work (can run in parallel)
- `steps` — Sequential tasks within a job
- `uses` — References a reusable Action
- `run` — Executes a shell command
- `runs-on` — Specifies the runner environment

---

### Q13. What is the difference between `uses` and `run` in GitHub Actions?

**Answer:**

| | `uses` | `run` |
|---|---|---|
| **Purpose** | Executes a pre-built, reusable Action | Runs a shell command directly |
| **Source** | GitHub Marketplace or local path | Shell (bash, powershell, etc.) |
| **Example** | `uses: actions/checkout@v4` | `run: npm test` |
| **Customization** | Via `with:` parameters | Full shell scripting |

---

### Q14. What are GitHub Actions runners?

**Answer:**

A runner is a server that executes workflow jobs. Two types:

**GitHub-hosted runners:**
- Managed by GitHub, free within usage limits
- Available for Ubuntu, Windows, macOS
- Fresh environment for each job
- Example: `runs-on: ubuntu-latest`

**Self-hosted runners:**
- Your own infrastructure (on-prem, cloud VM, container)
- Greater control over environment, hardware, and cost
- Required for private network access
- Example: `runs-on: self-hosted`

---

### Q15. How do you pass data between jobs in GitHub Actions?

**Answer:**

Using **job outputs** and **artifacts**:

**Job Outputs** (for small values):
```yaml
jobs:
  job1:
    outputs:
      version: ${{ steps.get_version.outputs.version }}
    steps:
      - id: get_version
        run: echo "version=1.2.3" >> $GITHUB_OUTPUT

  job2:
    needs: job1
    steps:
      - run: echo "Version is ${{ needs.job1.outputs.version }}"
```

**Artifacts** (for files):
```yaml
# Upload in job1
- uses: actions/upload-artifact@v4
  with:
    name: build-output
    path: dist/

# Download in job2
- uses: actions/download-artifact@v4
  with:
    name: build-output
```

---

### Q16. What is a matrix strategy in GitHub Actions?

**Answer:**

Matrix strategy allows you to run a job across multiple combinations of variables (e.g., different OS, Node versions) in parallel.

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [18, 20, 22]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm test
```

This creates **3 × 3 = 9 parallel jobs**, testing all combinations.

---

### Q17. How do you secure secrets in GitHub Actions?

**Answer:**

1. **Store secrets in GitHub Settings** → Secrets and variables → Actions (never hardcode in YAML)
2. **Access via `${{ secrets.SECRET_NAME }}`** in workflows
3. **Secrets are automatically masked** in logs
4. **Limit scope** — use environment-level secrets for production
5. **Rotate secrets regularly** and use expiring tokens
6. **Avoid printing secrets** — never `echo ${{ secrets.MY_SECRET }}`

```yaml
steps:
  - name: Deploy
    env:
      API_KEY: ${{ secrets.API_KEY }}
    run: deploy.sh
```

---

### Q18. What is the `GITHUB_TOKEN` and when is it used?

**Answer:**

`GITHUB_TOKEN` is an automatically generated token provided by GitHub for each workflow run. It allows workflows to interact with the GitHub API (create PRs, comment on issues, push to repo, publish packages) without manual token configuration.

```yaml
steps:
  - name: Create Release
    uses: actions/create-release@v1
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Permissions:** Limited to the repository, expires when the job finishes, and has configurable read/write scopes.

---

### Q19. How do you trigger a workflow manually in GitHub Actions?

**Answer:**

Use the `workflow_dispatch` event, which adds a "Run workflow" button in the GitHub UI:

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production
```

You can also trigger it via GitHub CLI: `gh workflow run workflow-name.yml`

---

### Q20. What is caching in GitHub Actions and why is it important?

**Answer:**

Caching stores dependencies between workflow runs to avoid re-downloading them every time, significantly reducing build times.

```yaml
- name: Cache Node modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

**How it works:**
- On first run: cache miss → dependencies downloaded → cache saved
- On subsequent runs: cache hit → dependencies restored from cache

**Common use cases:** npm/yarn packages, pip packages, Maven/Gradle dependencies, Docker layers

---

## 🔷 SECTION 3: GitHub & Git Best Practices

---

### Q21. What is a branching strategy? Describe GitFlow vs Trunk-Based Development.

**Answer:**

A branching strategy defines how and when code branches are created, merged, and deleted.

**GitFlow:**
- Long-lived branches: `main`, `develop`, `release/*`, `hotfix/*`, `feature/*`
- Features developed in `feature/*`, merged into `develop`, released via `release/*`
- Good for: versioned software with scheduled releases
- Downside: complex, prone to merge conflicts

**Trunk-Based Development:**
- All developers commit directly to `main` (or via very short-lived feature branches)
- Feature flags hide incomplete work
- Good for: CI/CD-heavy teams, SaaS, microservices
- Requires: strong automated testing and feature flags

Most modern teams practicing CI/CD prefer **Trunk-Based Development**.

---

### Q22. What is a Pull Request (PR) and what should a good PR include?

**Answer:**

A Pull Request is a request to merge code from one branch into another. It facilitates code review before merging.

**A good PR should include:**
- **Small, focused scope** — one feature or fix per PR
- **Descriptive title** — concise summary of changes
- **Description** — what changed, why, how to test
- **Link to issue/ticket** — traceability
- **Screenshots/recordings** — for UI changes
- **Test coverage** — new tests for new code
- **Passing CI checks** — all pipeline checks green

---

### Q23. What is a GitHub webhook and how is it used in CI/CD?

**Answer:**

A webhook is an HTTP callback that GitHub sends to a configured URL when specific events occur (push, PR opened, release created, etc.).

**Use in CI/CD:**
- Trigger Jenkins builds when code is pushed
- Notify Slack when a deployment succeeds
- Update JIRA ticket status on PR merge
- Trigger custom deployment scripts

**Setup:** Repository Settings → Webhooks → Add webhook → Enter payload URL + select events

---

### Q24. What is GitHub Environments and how does it help with deployments?

**Answer:**

GitHub Environments allow you to define deployment targets (e.g., `staging`, `production`) with:
- **Protection rules** — require manual approval before deploying
- **Environment secrets** — secrets scoped to a specific environment
- **Deployment history** — track what was deployed and when
- **Wait timers** — delay deployment after approval

```yaml
jobs:
  deploy-prod:
    environment:
      name: production
      url: https://myapp.com
    steps:
      - run: ./deploy.sh
```

---

### Q25. How would you prevent secrets from leaking in CI/CD pipelines?

**Answer:**

1. **Use secret managers** — GitHub Secrets, AWS Secrets Manager, Vault
2. **Never log secrets** — avoid `echo`, `print`, or debug commands with secret values
3. **Mask secrets in logs** — most CI tools auto-mask registered secrets
4. **Use OIDC (OpenID Connect)** instead of long-lived credentials — GitHub Actions can assume AWS/GCP roles without storing keys
5. **Rotate secrets regularly** — set expiration policies
6. **Limit secret scope** — environment-level secrets, not org-wide
7. **Audit access** — review who has access to secrets regularly
8. **Scan for secrets in code** — tools like `truffleHog`, `gitleaks`, GitHub Secret Scanning

---

## 🔷 SECTION 4: Scenario-Based Questions

---

### Q26. Your CI pipeline passes but the app breaks in production. What went wrong?

**Answer:**

Common root causes:
- **Tests don't cover production scenarios** — unit tests pass but integration fails
- **Environment differences** — different env vars, OS, or dependency versions
- **Infrastructure drift** — staging and production configs are out of sync
- **Missing smoke tests** in production after deploy
- **Database migrations not applied** or breaking changes in schema
- **External service differences** — staging uses mock, production uses real API

**Fixes:**
- Use containerization (Docker) to ensure environment parity
- Run smoke/sanity tests post-deployment in production
- Use Infrastructure as Code to keep environments consistent
- Add integration and e2e tests to the pipeline

---

### Q27. How would you design a CI/CD pipeline for a microservices application?

**Answer:**

**Per-service pipelines:**
- Each microservice has its own pipeline triggered on changes to its directory
- Use path filters: `on: push: paths: ['services/auth/**']`

**Shared pipeline stages:**
1. Lint + unit test per service
2. Build Docker image and push to registry
3. Deploy to staging (using Helm/ArgoCD)
4. Run integration tests against staging
5. Manual approval gate for production
6. Deploy to production with canary rollout

**Additional concerns:**
- Contract testing between services (e.g., Pact)
- Centralized secrets management
- Service dependency ordering in deployment
- Observability: shared logging, tracing, alerting

---

### Q28. How do you handle database migrations in a CI/CD pipeline?

**Answer:**

1. **Use a migration tool** — Flyway, Liquibase, Alembic, or Prisma Migrate
2. **Run migrations as part of deployment** — before the app starts (or as a pre-deploy step)
3. **Backward-compatible migrations** — new schema should work with old and new app version during rolling deployments
4. **Never delete columns immediately** — deprecate first, remove in a future release
5. **Test migrations in staging** before production
6. **Store migration scripts in version control** alongside the application code
7. **Rollback plan** — write `down` migrations or backup before migration

---

### Q29. A team member accidentally pushed sensitive credentials to GitHub. What do you do?

**Answer:**

**Immediate steps:**
1. **Rotate/revoke the credentials immediately** — assume they're compromised
2. **Remove from Git history** — use `git filter-repo` or BFG Repo Cleaner (not just `git rm` — the secret is still in history)
3. **Force push** the cleaned history to the remote
4. **Notify stakeholders** if credentials accessed cloud resources
5. **Check audit logs** — AWS CloudTrail, GCP Audit Logs, etc. for unauthorized usage

**Prevention going forward:**
- Pre-commit hooks with `git-secrets` or `gitleaks`
- Enable GitHub Secret Scanning
- Developer education and code review practices
- Use OIDC instead of static credentials

---

### Q30. How would you implement zero-downtime deployments?

**Answer:**

Strategies:

1. **Rolling deployment** — replace old instances one at a time while others serve traffic
2. **Blue-green deployment** — maintain two environments, switch traffic atomically
3. **Canary deployment** — route a small % of traffic to new version, gradually increase
4. **Feature flags** — deploy code but hide new features behind a flag until ready

**Technical requirements:**
- Health checks so load balancer only sends traffic to healthy instances
- Backward-compatible API and DB changes
- Session stickiness or stateless services
- Container orchestration (Kubernetes) for graceful pod replacement

---

## 🔷 SECTION 5: Tools & Technologies

---

### Q31. Compare Jenkins, GitHub Actions, GitLab CI, and CircleCI.

**Answer:**

| Feature | Jenkins | GitHub Actions | GitLab CI | CircleCI |
|---|---|---|---|---|
| **Hosting** | Self-hosted | Cloud (GitHub) | Cloud/Self-hosted | Cloud/Self-hosted |
| **Config format** | Groovy (Jenkinsfile) | YAML | YAML | YAML |
| **Setup complexity** | High | Low | Medium | Low |
| **Cost** | Free (infra cost) | Free tier + paid | Free tier + paid | Free tier + paid |
| **Ecosystem** | Large plugin library | GitHub Marketplace | GitLab-native | Orbs |
| **Best for** | Legacy enterprise | GitHub-native projects | GitLab projects | Fast cloud CI |

---

### Q32. What is Docker's role in CI/CD?

**Answer:**

Docker enables **consistent, reproducible environments** throughout the CI/CD pipeline:

- **Build stage** — Build Docker image from Dockerfile
- **Test stage** — Run tests inside a container (same env as prod)
- **Artifact** — The Docker image IS the deployable artifact
- **Deploy stage** — Push image to registry, pull and run on servers

**Key benefits:**
- "Works on my machine" problem eliminated
- Easy rollback (tag-based versioning of images)
- Scales well with Kubernetes
- Enables parallel test runs in isolated containers

---

### Q33. What is ArgoCD and how does it implement GitOps?

**Answer:**

**ArgoCD** is a declarative, GitOps-based continuous delivery tool for Kubernetes.

**GitOps principle:** Git is the single source of truth for infrastructure and application state. Any desired state is declared in Git, and a controller continuously reconciles the actual state with the desired state.

**How ArgoCD works:**
1. You define Kubernetes manifests/Helm charts in a Git repo
2. ArgoCD watches the repo for changes
3. When a change is detected, ArgoCD automatically syncs the cluster
4. Drift (manual changes to the cluster) is detected and can be auto-corrected

**Benefits:** Audit trail via Git history, easy rollback (revert a commit), declarative, self-healing

---

## 🔷 Quick Reference: Common Interview Tips

---

- **Always explain the "why"** — don't just describe CI/CD, explain the problem it solves
- **Use real examples** — mention tools you've actually used (GitHub Actions, Jenkins, Docker, etc.)
- **Know the difference** between Continuous Delivery and Continuous Deployment
- **Understand security** — secrets management, OIDC, least-privilege access
- **Be ready to draw a pipeline** — whiteboard a typical CI/CD flow for a web app
- **Know failure scenarios** — what happens when tests fail, when prod breaks after deploy
- **Understand rollback strategies** — a very common follow-up question

---

*Good luck with your interview! 🚀*
