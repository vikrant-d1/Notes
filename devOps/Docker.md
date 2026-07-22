# 🐳 Docker Interview Preparation

### Single-Stage Dockerfile Example

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy dependency files first for better Docker caching
COPY --chown=node:node package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy application code with correct ownership
COPY --chown=node:node . .

ENV NODE_ENV=production

EXPOSE 4000

# Run as non-root user for security
USER node

CMD ["node", "server.js"]
```

### Problems with a Single-Stage Build

* Includes development dependencies in the final image.
* Produces a larger image size.
* Results in slower deployments.
* Increases security vulnerabilities by including unnecessary packages and tools.

---

## Production Multi-Stage Dockerfile

The following Dockerfile demonstrates a production-ready multi-stage build for a Node.js/Express application.

```dockerfile
# Stage 1: Install production dependencies
FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev


# Stage 2: Production image
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .

USER node

EXPOSE 4000

CMD ["node", "index.js"]

```

---

## Build the Docker Image

Run the following command to build the Docker image:

```bash
docker build -t node-api .
```

---

## Run the Container

Start the container and expose port `3000`:

```bash
docker run -p 3000:3000 node-api
```

The application will be accessible at:

```text
http://localhost:3000
```

---

## Benefits of Multi-Stage Builds

### Smaller Image Size

Only the required application files and dependencies are included in the final image.

### Improved Security

Build tools, temporary files, and unnecessary packages are excluded from the runtime image.

### Faster Deployments

Smaller images are quicker to transfer and deploy across environments.

### Better Maintainability

Separates the build process from the runtime environment, making Dockerfiles easier to understand and maintain.

---

## Best Practices

* Use `npm ci` instead of `npm install` for reproducible builds.
* Use a non-root user (`USER node`) whenever possible.
* Add a `.dockerignore` file to exclude unnecessary files.
* Set `NODE_ENV=production` for production workloads.
* Use health checks to monitor container health.
* Keep base images updated to receive security patches.

---


### Code changes reflect immediately.
```
docker run \
-p 3000:3000 \
-v $(pwd):/app \
-v /app/node_modules \
my-app
```

### docker-compose file
```dockerfile
version: '3'
services:
  ecommerce-ui:
    image: vikrant011/commerce-ui:1.0.0
    container_name: ecommerce-ui
    ports:
      - "4000:4000"
    environment:
      - REACT_APP_PROFILE_API_HOST=http://profile-management
      - REACT_APP_PRODUCT_API_HOST=http://product-catalog
      - REACT_APP_INVENTORY_API_HOST=http://product-inventory
      - REACT_APP_ORDER_API_HOST=http://order-management
      - REACT_APP_SHIPPING_API_HOST=http://shipping-and-handling
      - REACT_APP_CONTACT_API_HOST=http://contact-support-team
    depends_on:
      - profile-management
      - product-catalog
      - product-inventory
      - shipping-and-handling
      - contact-support-team
      - order-management
  shipping-and-handling:
    image: vikrant011/shipping-and-handling:2.0.0
    container_name: shipping-and-handling
    depends_on:
      - mongodb_shipping
    environment:
      - MONGO_URI=mongodb://mongodb_shipping:27017/shipping_db
    ports:
      - "8080:8080"

  mongodb_shipping:
    image: mongo
    container_name: mongodb_shipping
    volumes:
      - mongodb_shipping_data:/data/db
  contact-support-team:
    image: vikrant011/contact-support-team:2.0.0
    container_name: contact-support-team
    depends_on:
      - mongodb_contact_support
    environment:
      - MONGODB_HOST=mongodb_contact_support
      - MONGODB_PORT=27017
      - MONGODB_DATABASE=contact_support_db
    ports:
      - "8000:8000"
  mongodb_contact_support:
    image: mongo
    container_name: mongodb_contact_support
    volumes:
      - mongodb_contact_support_data:/data/db
  product-catalog:
    image: vikrant011/product-catalog:2.0.0
    container_name: product-catalog
    depends_on:
      - mongodb_product_catalog
    environment:
      - MONGODB_HOST=mongodb_product_catalog
      - MONGODB_PORT=27017
      - MONGODB_DATABASE=catalog_db
    ports:
      - "3001:3001"
  mongodb_product_catalog:
    image: mongo
    container_name: mongodb_product_catalog
    volumes:
      - mongodb_product_catalog_data:/data/db

  order-management:
    image: vikrant011/order-management:2.0.0
    container_name: order-management
    depends_on:
      - mongodb_order_management
    ports:
      - "9090:9090"
    environment:
      - PRODUCT_INVENTORY_API_HOST=http://product-inventory
      - PRODUCT_CATALOG_API_HOST=http://product-catalog
      - SHIPPING_HANDLING_API_HOST=http://shipping-and-handling
      - SPRING_DATA_MONGODB_URI=mongodb://mongodb_order_management:27017/order_management

  mongodb_order_management: # Port 27017
    image: mongo 
    container_name: mongodb_order_management
    volumes:
      - mongodb_order_management_data:/data/db
  product-inventory:
    image: vikrant011/product-inventory:2.0.0
    container_name: product-inventory
    environment:
      - POSTGRES_HOST=postgres_product_inventtory
      - POSTGRES_PORT=5432
      - POSTGRES_DB=product_inventory
      - POSTGRES_USER=inventory_user
      - POSTGRES_PASSWORD=inventory_password
    ports:
      - "3002:3002"
  postgres_product_inventtory: # posrt 5432
    image: postgres
    container_name: postgres_product_inventtory
    environment:
      - POSTGRES_PASSWORD=inventory_password
      - POSTGRES_USER=inventory_user
      - POSTGRES_DB=product_inventory
    volumes:
      - postgres_product_inventtory_data:/var/lib/postgresql
  profile-management:
    image: vikrant011/profile-management:2.0.0
    container_name: profile-management
    ports:
      - "3003:3003"
    depends_on:
      - mysql_profile_management
    environment:
      - MYSQL_HOST=mysql_profile_management
      - MYSQL_PORT=3306
      - MYSQL_USER=profile_user
      - MYSQL_PASSWORD=profile_password
      - MYSQL_DATABASE=profile_management
    
  mysql_profile_management: #Port 3306
    image: mysql:8.0
    container_name: mysql_profile_management
    environment:
      - MYSQL_DATABASE=profile_management
      - MYSQL_USER=profile_user
      - MYSQL_PASSWORD=profile_password
      - MYSQL_ROOT_PASSWORD=root_password 
    volumes:
      - mysql_profile_management_data:/var/lib/mysql

volumes:
  mongodb_product_catalog_data:
  mongodb_contact_support_data:
  mongodb_shipping_data:
  mongodb_order_management_data:
  mysql_profile_management_data:
  postgres_product_inventtory_data:

```

```
docker compose down
docker compose up
```

### Simple Docker compose file
```
services:

  app:
    build: .
    container_name: node-app

    ports:
      - "3000:3000"

    env_file:
      - .env

    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:17-alpine

    container_name: postgres-db

    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: mydb

    ports:
      - "5432:5432"

    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:8-alpine

    container_name: redis-cache

    ports:
      - "6379:6379"

    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:

```


### Key Dockerfile Instructions

| Instruction | Purpose | Pro Tip |
|-------------|---------|---------|
| `FROM` | Base image | Always use specific tags, never `latest` in prod |
| `WORKDIR` | Set working directory | Avoids messy absolute paths |
| `COPY` vs `ADD` | Copy files in | Use `COPY` unless you need auto-extract tar |
| `RUN` | Execute commands | Chain with `&&` to reduce layers |
| `CMD` vs `ENTRYPOINT` | Default command | Use `ENTRYPOINT` for the executable, `CMD` for default args |
| `ENV` vs `ARG` | Variables | `ARG` = build-time only, `ENV` = persists in container |
| `EXPOSE` | Document port | Doesn't actually publish — that's `-p` flag |
| `HEALTHCHECK` | Container health monitoring | Critical for orchestration |
| `USER` | Run as non-root | Security must-have |
| `.dockerignore` | Exclude files from context | Always ignore `node_modules`, `.git`, `*.log` |

### Interview Q&A

**Q: What is the difference between CMD and ENTRYPOINT?**
A: `ENTRYPOINT` defines the executable that always runs. `CMD` provides default arguments that can be overridden at runtime. Best practice: use together.
```dockerfile
ENTRYPOINT ["python", "app.py"]
CMD ["--port", "8080"]  # overridable: docker run myimage --port 9090
```

**Q: How do you reduce Docker image size?**
A:
- Use multi-stage builds (build deps don't ship to prod)
- Use Alpine or distroless base images
- Chain RUN commands with `&&` and clean up in the same layer
- Use `.dockerignore` to exclude unnecessary files
- Remove caches: `apt-get clean`, `npm cache clean --force`, `pip --no-cache-dir`
- Order layers by change frequency (rarely changing first for cache hits)

**Q: Explain Docker layer caching. How do you optimize it?**
A: Each Dockerfile instruction creates a layer. Docker caches layers and reuses them if the instruction and all previous layers haven't changed. Optimization: put instructions that change less frequently first (like `COPY package.json` before `COPY .`), so dependency installs are cached even when source code changes.

**Q: What's the difference between `COPY` and `ADD`?**
A: `COPY` simply copies files. `ADD` has extra features: it can auto-extract tar archives and fetch URLs. Best practice: use `COPY` unless you specifically need tar extraction. Never use `ADD` to fetch URLs — use `RUN curl` or `RUN wget` instead for transparency.

---

## 4. Docker Compose

### Production-Ready Compose Example

```yaml
version: "3.8"

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
    ports:
      - "3000:3000"
    depends_on:
      api:
        condition: service_healthy
    environment:
      - REACT_APP_API_URL=http://api:4000
    networks:
      - frontend-net
    restart: unless-stopped

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./backend/uploads:/app/uploads
    networks:
      - frontend-net
      - backend-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M

  db:
    image: postgres:16-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
      POSTGRES_DB: myapp
    secrets:
      - db_password
    networks:
      - backend-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    networks:
      - backend-net
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - frontend
      - api
    networks:
      - frontend-net
    restart: unless-stopped

volumes:
  postgres-data:
  redis-data:

networks:
  frontend-net:
  backend-net:

secrets:
  db_password:
    file: ./secrets/db_password.txt
```


**Q: What's the difference between `depends_on` and healthcheck-based dependency?**
A: Basic `depends_on` only waits for the container to start, not for the service inside to be ready. With `condition: service_healthy`, Compose waits until the healthcheck passes — critical for databases that take seconds to initialize.

**Q: How do you manage environment-specific configs?**
A: Use multiple Compose files with override pattern:
```bash
# Base config
docker-compose.yml
# Dev overrides (mount source code, debug ports)
docker-compose.override.yml      # auto-loaded in dev
# Production overrides
docker-compose.prod.yml

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Q: What restart policies are available?**
A: `no` (default), `always`, `on-failure[:max-retries]`, `unless-stopped`. For production services, use `unless-stopped` — it restarts on crash and on daemon restart, but respects manual stops.

---

## 5. Networking Deep Dive

```bash
# Create custom network
docker network create --driver bridge my-app-network

# Run containers on same network (they can reach each other by name)
docker run -d --name api --network my-app-network my-api
docker run -d --name db --network my-app-network postgres

# From api container: ping db  ← works via Docker DNS
```

**Q: How does container-to-container communication work?**
A: Containers on the same user-defined bridge network can communicate using container names as hostnames. Docker has a built-in DNS server (127.0.0.11) that resolves container names to their IPs. The default bridge network doesn't support this — you must use a user-defined network.

**Q: What's the difference between `-p` and `--expose`?**
A: `--expose` makes a port available to other containers on the same network (inter-container). `-p 8080:3000` publishes port 3000 to the host's port 8080 (accessible from outside).

**Q: How would you handle a microservices setup where the frontend shouldn't talk to the database directly?**
A: Create separate networks — put frontend and API on a `frontend-net`, and put API and database on a `backend-net`. Only the API lives on both networks, acting as a gateway.

---

**Q: When would you use a named volume vs a bind mount?**
A: Named volumes for production data (databases, uploads) — Docker manages the storage, it's portable, and works across platforms. Bind mounts for development — mount your source code so you get live reload without rebuilding.

**Q: How do you back up a Docker volume?**
A:
```bash
docker run --rm \
  -v my-db-volume:/source:ro \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/db-backup-$(date +%Y%m%d).tar.gz -C /source .
```

**Q: What happens to data when a container is removed?**
A: Data in the container's writable layer is lost. Data in volumes persists. This is why databases MUST use volumes.

---


```bash
# Tag and push to private registry
docker tag myapp:latest registry.company.com/myapp:v2.1.0
docker push registry.company.com/myapp:v2.1.0

# Pull in production
docker pull registry.company.com/myapp:v2.1.0
```

### Interview Q&A

**Q: How do you handle image versioning?**
A: Never use `latest` in production. Use semantic versioning (`v2.1.0`) or git SHA (`myapp:abc123f`). In CI, tag with both: `myapp:v2.1.0` and `myapp:abc123f` for traceability.

**Q: What is a Docker image manifest?**
A: A JSON document that describes the image — its layers, architecture, OS, and config. Multi-arch images use a **manifest list** to point to platform-specific variants (amd64, arm64).

**Q: How do you scan images for vulnerabilities?**
A: Use tools like Trivy, Snyk, or Docker Scout. In CI:
```bash
trivy image --severity HIGH,CRITICAL myapp:latest
# Fail the pipeline if critical CVEs are found
```

---

### The Big 8 — Mention These in Interviews

1. **Run as non-root** — Always use `USER` instruction
2. **Use minimal base images** — Alpine or distroless
3. **Scan images** — Trivy/Snyk in CI pipeline
4. **Don't store secrets in images** — Use Docker secrets, Vault, or env at runtime
5. **Read-only filesystem** — `docker run --read-only`
6. **Drop capabilities** — `--cap-drop ALL --cap-add NET_BIND_SERVICE`
7. **Use trusted base images** — Official images or verified publishers
8. **Pin versions** — Both base image and package versions

### Interview Q&A

**Q: How do you manage secrets in Docker?**
A: Never bake secrets into images (no `ENV PASSWORD=xxx` in Dockerfile). Options:
- **Docker Secrets** (Swarm mode) — encrypted at rest, mounted as files
- **Environment variables** at runtime via `.env` file (acceptable for dev)
- **HashiCorp Vault** or **AWS Secrets Manager** injected at runtime
- **BuildKit secrets** for build-time secrets: `RUN --mount=type=secret,id=npmrc`

**Q: What is Docker Content Trust?**
A: DCT uses digital signatures to verify image integrity. When enabled (`DOCKER_CONTENT_TRUST=1`), Docker only pulls/runs signed images, preventing tampered image attacks.

**Q: How do you limit container resources?**
A:
```bash
docker run -d \
  --memory="512m" \
  --memory-swap="1g" \
  --cpus="1.5" \
  --pids-limit=100 \
  myapp
```

---

### GitHub Actions Example

```yaml
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ghcr.io/myorg/myapp:${{ github.sha }}
            ghcr.io/myorg/myapp:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Scan image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ghcr.io/myorg/myapp:${{ github.sha }}
          severity: "CRITICAL,HIGH"
          exit-code: "1"
```

### Interview Q&A

**Q: How do you speed up Docker builds in CI?**
A:
- **BuildKit cache mounts** — cache npm/pip downloads between builds
- **Layer caching** — `cache-from` previous builds (registry-based or GHA cache)
- **Multi-stage builds** — only rebuild stages that changed
- **Parallel builds** — build independent services concurrently
- **`.dockerignore`** — reduce build context size

**Q: What is Docker-in-Docker (DinD) and when would you use it?**
A: DinD runs a Docker daemon inside a Docker container. Used in CI runners (Jenkins agents, GitLab runners) that need to build Docker images. Alternative: mount the host's Docker socket (`-v /var/run/docker.sock:/var/run/docker.sock`) — simpler but less isolated.

---

## 10. Orchestration

**Swarm (show you've used it):**
```bash
docker swarm init
docker service create --replicas 3 --name api -p 4000:4000 myapi:latest
docker service scale api=5
docker stack deploy -c docker-compose.prod.yml myapp
```

### Interview Q&A

**Q: When would you choose Swarm over Kubernetes?**
A: Swarm for smaller teams (< 10 services), when you want quick setup and already use Compose (stack deploy accepts compose files), and when you don't need advanced scheduling. Kubernetes when you need auto-scaling, service mesh, advanced rolling updates, or managing 50+ services.

---

## 11. Monitoring, Logging & Debugging

### Logging Strategies

```bash
# View logs
docker logs -f --tail 100 my-container

# Logging drivers
docker run -d \
  --log-driver=json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  myapp
```

**Production logging stack:** Application → Docker logging driver → Fluentd/Filebeat → Elasticsearch → Kibana

### Debugging Containers

```bash
# Execute into running container
docker exec -it my-container /bin/sh

# Inspect container details
docker inspect my-container

# View resource usage
docker stats

# Check why a container exited
docker logs my-container
docker inspect --format='{{.State.ExitCode}}' my-container

# Debug a failed build — run the last successful layer
docker run -it <last-successful-layer-id> /bin/sh

# Copy files from container for inspection
docker cp my-container:/app/logs/error.log ./debug/
```

### Interview Q&A
**Q: How do you monitor Docker in production?**
A: Use Prometheus + Grafana. Docker exposes metrics at `/metrics` endpoint. cAdvisor collects container-level metrics (CPU, memory, network, disk). Set alerts for: high memory usage, restart loops, disk space on volumes.

---

## 13. Commands Cheat Sheet

### Container Operations
```bash
docker run -d --name app -p 8080:3000 --restart unless-stopped myapp
docker exec -it app /bin/sh
docker logs -f --tail 50 app
docker stop app && docker rm app
docker ps -a                    # list all containers
docker stats                    # live resource usage
docker inspect app              # full container JSON
docker top app                  # processes inside container
```

### Image Operations
```bash
docker build -t myapp:v1.0 .
docker build -t myapp:v1.0 --no-cache .
docker images                   # list images
docker image prune -a           # remove unused images
docker history myapp:v1.0       # inspect layers
docker tag myapp:v1.0 registry.com/myapp:v1.0
docker push registry.com/myapp:v1.0
docker save myapp:v1.0 > myapp.tar     # export
docker load < myapp.tar                 # import
```

### Volume & Network
```bash
docker volume create my-data
docker volume ls
docker volume inspect my-data
docker network create my-net
docker network ls
docker network inspect my-net
```

### Cleanup
```bash
docker system prune -a --volumes  # nuclear option — removes everything unused
docker container prune             # remove stopped containers
docker image prune -a              # remove unused images
docker volume prune                # remove unused volumes
docker builder prune               # clear build cache
```

### Docker Compose
```bash
docker compose up -d               # start in background
docker compose down                # stop and remove
docker compose down -v             # also remove volumes
docker compose logs -f api         # follow logs for one service
docker compose exec api sh         # shell into running service
docker compose build --no-cache    # force rebuild
docker compose ps                  # service status
docker compose pull                # pull latest images
```

---



## Buzzwords & Trends for 2026

- **Docker Scout / Trivy** — image vulnerability scanning integrated into CI
- **Docker Init** — auto-generates Dockerfile and Compose for your project
- 
---

## Quick Revision: Top 20 Questions They WILL Ask

### What is Docker and how is it different from a VM?
 Docker packages an application with everything it needs into a container, so it runs consistently on different machines. Docker containers are lightweight because they share the host OS kernel, while Virtual Machines are heavier because each VM has its own complete operating system.

###  What are namespaces and cgroups?
Namespaces provide isolation, while cgroups provide resource management. Namespaces isolate things like processes, networking, mount points, hostnames, and users so each container gets an isolated view of the system. Cgroups control and account for resources such as CPU and memory. Docker uses these Linux kernel features together to provide container isolation and resource control without requiring a separate guest operating system for each container.

Remember:
**Namespace = what you can SEE.**
**Cgroup = how much you can USE.**

###  What is a multi-stage build and why use it?
A multi-stage build uses multiple FROM statements in a Dockerfile to separate the build environment from the runtime environment. For example, I can install TypeScript and dev dependencies and compile the application in a builder stage, then copy only the compiled output and production dependencies into the final image. This reduces image size, decreases the attack surface, and keeps the production image clean.

###  How do you reduce Docker image size?
I reduce Docker image size by using a minimal base image such as Alpine or slim where appropriate, using multi-stage builds to separate build-time and runtime dependencies, installing only production dependencies with npm ci --omit=dev, using .dockerignore, and copying only the files required at runtime. I also avoid unnecessary OS packages and clean temporary caches. A smaller image improves pull and deployment speed, storage efficiency, and can reduce the security attack surface.

###  Explain Docker layer caching?
Docker layer caching reuses unchanged layers from previous builds to speed up image creation. I optimize caching by placing instructions that change less frequently, such as copying dependency files and installing dependencies, before copying frequently changing application source code. When a layer changes, that layer and dependent subsequent layers need to be rebuilt.

###  What are Docker volumes? Types?
Docker volumes provide persistent storage outside a container’s writable layer, so data can survive container removal and recreation. The main mount/storage options are named volumes, anonymous volumes, bind mounts, and tmpfs mounts. I typically use named volumes for persistent data such as databases, bind mounts for local development and configuration, and tmpfs for temporary in-memory data.

###  How does container networking work?
Docker networking allows containers to communicate while maintaining network isolation. On a user-defined bridge network, containers can communicate using container or service names through Docker’s built-in DNS. To expose an application outside Docker, I publish ports using -p, such as 4000:4000. Docker supports network drivers such as bridge for single-host networking, overlay for multi-host networking, host for sharing the host network, and none for disabling networking.

###  What's the difference between bridge, host, and overlay networks?
Bridge networking is mainly used for isolated container communication on a single Docker host. Host networking removes most network isolation and lets the container use the host's network stack directly, which can reduce networking overhead but may cause port conflicts. Overlay networking creates a virtual network across multiple Docker hosts and is commonly used with Docker Swarm for multi-host container communication.

###  How do you manage secrets in Docker?
I never hardcode secrets in the Dockerfile, bake .env files into images, or commit secrets to Git. For local development, I may use an ignored .env file. In production, I inject secrets at runtime using Docker Secrets, Kubernetes Secrets with appropriate encryption/access controls, or preferably an external secrets manager such as AWS Secrets Manager or Vault. I use least-privilege access and rotate secrets regularly.

###  Explain Docker Compose and its use cases?
Docker Compose lets us define and run multi-container applications using a YAML file. For example, I can define a Node.js API, PostgreSQL database, and Redis cache along with their networks, volumes, environment variables, ports, and dependencies. With docker compose up, the complete environment can be started consistently. I mainly use Compose for local development, integration testing, and relatively simple deployments; for large-scale production orchestration, I would typically use Kubernetes or another orchestrator.

###  What restart policies are available?
Docker provides no, on-failure, always, and unless-stopped. I commonly use unless-stopped for long-running services because it automatically recovers from crashes and daemon restarts while respecting an intentional manual stop. For batch jobs, on-failure with a retry limit can be more appropriate.

###  How do you debug a failing container?
When a container fails, I first check its state and exit code using docker ps -a, then inspect application logs with docker logs. Next, I use docker inspect to verify environment variables, mounts, ports, networking, and runtime configuration.

If it is running, I use docker exec to inspect it internally. If it exits immediately, I start the image with an overridden entrypoint such as sh for debugging. I also check resource usage with docker stats and verify connectivity to dependencies such as databases or Redis. Once I identify the root cause, I fix the configuration or application, rebuild the image, and redeploy.

###  How do you scan images for vulnerabilities?
I scan container images during CI/CD using tools like Trivy, Docker Scout, Snyk, or registry-native scanners. After building the image, I scan the OS packages and application dependencies for known CVEs. I configure the pipeline to block deployment based on our severity and exception policy—for example, actionable critical or high vulnerabilities—then patch dependencies or the base image, rebuild, and scan again before pushing/deploying.

Scan it:
```
trivy image node-app:1.0
```

###  Docker Swarm vs Kubernetes — when to use which?
I would choose Kubernetes, likely Amazon EKS if we're standardizing on Kubernetes. We have many independently deployed microservices and variable traffic, so Kubernetes gives us stronger orchestration capabilities such as deployments, self-healing, service discovery, rolling updates, autoscaling, configuration/secrets management, and a mature cloud-native ecosystem.

If the application were much smaller, the team had limited orchestration requirements, and operational simplicity was the priority, Docker Swarm could be sufficient.

###  How do you integrate Docker in CI/CD?
We integrate Docker into CI/CD by automatically building a Docker image whenever code is pushed, running tests against the application, pushing the successful image to a container registry, and then deploying that same image to staging or production. This gives us consistent environments, reproducible deployments, easier rollbacks, and avoids the “works on my machine” problem.

**Commit → Build → Test → Docker Image → Registry → Deploy → Container**

```yml
name: Deploy Application

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Build Docker Image
        run: docker build -t my-app:${{ github.sha }} .

      - name: Run Tests
        run: docker run --rm my-app:${{ github.sha }} npm test

      - name: Push Docker Image
        run: |
          docker tag my-app:${{ github.sha }} registry/my-app:${{ github.sha }}
          docker push registry/my-app:${{ github.sha }}

      - name: Deploy
        run: |
          # Deploy the same image to your server/platform
          echo "Deploy registry/my-app:${{ github.sha }}"
```
###  How do you handle logging in containerized apps?
In containerized applications, I write logs to stdout and stderr instead of storing them inside the container. Docker or the orchestration platform collects these logs, and in production I send them to a centralized logging system such as CloudWatch, ELK, or Datadog. I prefer structured JSON logging with request IDs or correlation IDs so logs can be traced across services.

###  Describe a production Docker issue you solved?
“In one production project, our Node.js Docker container was restarting frequently under high traffic. I checked the container logs and monitoring metrics and found that the container was exceeding its memory limit and getting killed with an OOM error.

I investigated the application and found that a large amount of data was being loaded into memory at once. We changed the processing to use Node.js streams and batching, optimized the application memory usage, and configured appropriate container memory limits.

We also added health checks and monitoring so we could detect similar issues earlier. After these changes, the container became stable and production restarts stopped.”

**Problem → Investigation → Root cause → Fix → Result**
```yml
Problem:
Container restarting
        ↓
Investigation:
Docker logs + memory metrics
        ↓
Root Cause:
High memory usage → OOM
        ↓
Fix:
Streams + batching
Memory optimization
Container limits
Health checks
        ↓
Result:
Stable containers
No unexpected restarts
```

---
