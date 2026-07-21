# 🐳 Docker Interview Preparation

## Table of Contents

1. [Your Experience Narrative](#1-your-experience-narrative)
2. [Docker Fundamentals (Know Cold)](#2-docker-fundamentals)
3. [Dockerfile Mastery](#3-dockerfile-mastery)
4. [Docker Compose — Multi-Service Orchestration](#4-docker-compose)
5. [Networking Deep Dive](#5-networking-deep-dive)
6. [Storage & Volumes](#6-storage--volumes)
7. [Image Optimization & Registry](#7-image-optimization--registry)
8. [Security Best Practices](#8-security-best-practices)
9. [Docker in CI/CD Pipelines](#9-docker-in-cicd-pipelines)
10. [Orchestration — Swarm & Kubernetes Basics](#10-orchestration)
11. [Monitoring, Logging & Debugging](#11-monitoring-logging--debugging)
12. [Real-World Scenario Questions](#12-real-world-scenario-questions)
13. [Commands Cheat Sheet](#13-commands-cheat-sheet)
14. [Common Mistakes to Avoid in Interviews](#14-common-mistakes-to-avoid)
15. [Buzzwords & Trends for 2026](#15-buzzwords--trends-for-2026)

---

# Multi-Stage Dockerfile for Production Node.js Applications

## Why Use a Multi-Stage Docker Build?

A multi-stage Dockerfile is the standard production approach because it keeps the final image small, secure, and free of unnecessary build tools.

### Single-Stage Dockerfile Example

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy dependency files first for Docker layer caching
COPY package*.json ./

# Reproducible production-only installation
RUN npm ci --omit=dev

# Copy application source
COPY . .

ENV NODE_ENV=production

EXPOSE 4000

# Run as non-root user
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
```
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




# docker run --network=my-network -p 4000:4000 \\
# -e REACT_APP_PROFILE_API_HOST=http://profile-management \\
# -e REACT_APP_PRODUCT_API_HOST=http://product-catalog \\
# -e REACT_APP_INVENTORY_API_HOST=http://product-inventory \\
# -e REACT_APP_ORDER_API_HOST=http://order-management \\
# -e REACT_APP_SHIPPING_API_HOST=http://shipping-and-handling \\
# -e REACT_APP_CONTACT_API_HOST=http://contact-support-team \\
# --name ecommerce-ui rslim087/ecommerce-ui

# docker run -p 8080:8080 -e MONGO_URI=<mongo_uri> shipping-and-handling

# docker run -p 3003:3003 -e MYSQL_HOST=<mysql_host> -e MYSQL_PORT=<mysql_port> -e MYSQL_USER=<mysql_user> -e MYSQL_PASSWORD=<mysql_password> -e MYSQL_DATABASE=<mysql_database> authentication-microservice

# docker run -p 3002:3002 -e POSTGRES_HOST=<postgres_host> -e POSTGRES_PORT=<postgres_port> -e POSTGRES_DB=<postgres_db> -e POSTGRES_USER=<postgres_user> -e POSTGRES_PASSWORD=<postgres_password> product-inventory-microservice

# docker run -p 8000:8000 -e MONGODB_HOST=<mongo_host> -e MONGODB_PORT=<mongo_port> -e MONGODB_DATABASE=<mongo_database> contact-support-microservice

# docker run -p 3001:3001 -e MONGODB_HOST=<mongo_host> -e MONGODB_PORT=<mongo_port> -e MONGODB_DATABASE=<mongo_database> product-catalog-microservice

# docker run --network my-network \
#   -e PRODUCT_INVENTORY_API_HOST=http://product-inventory \
#   -e PRODUCT_CATALOG_API_HOST=http://product-catalog \
#   -e SHIPPING_HANDLING_API_HOST=http://shipping-and-handling \
#   -e SPRING_DATA_MONGODB_URI=mongodb://host:27017/name \
#   -e SPRING_DATA_MONGODB_DATABASE=order_management \
#   -p 9090:9090 --name order-management rslim087/order-management


```



```
docker compose down
docker compose up
```

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



### Key Projects to Reference

| Project | Docker Usage | Complexity |
|---------|-------------|------------|
| Full-stack SaaS app | Multi-stage builds, Compose with 6+ services | High |
| Microservices migration | Broke monolith into containerized services | High |
| CI/CD pipeline | Docker-in-Docker, build caching, auto-deploy | Medium-High |
| Dev environment standardization | Compose + .env files for entire team | Medium |
| Database migration tooling | Custom images with migration scripts | Medium |

---

## 2. Docker Fundamentals

### What is Docker and Why It Exists

Docker is a platform that packages applications and their dependencies into **containers** — lightweight, portable, isolated environments that share the host OS kernel. Unlike VMs, containers don't need a full guest OS, making them faster to start (milliseconds vs minutes) and much lighter on resources.

### Architecture — Know This Diagram

```
┌──────────────────────────────────────────┐
│              Docker Client (CLI)          │
│         docker build, run, push ...      │
└──────────────┬───────────────────────────┘
               │ REST API
┌──────────────▼───────────────────────────┐
│            Docker Daemon (dockerd)        │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ │
│  │ Images  │ │Containers│ │ Networks  │  │
│  └─────────┘ └──────────┘ └───────────┘ │
│  ┌─────────┐ ┌──────────┐               │
│  │ Volumes │ │  Plugins │               │
│  └─────────┘ └──────────┘               │
└──────────────┬───────────────────────────┘
               │
┌──────────────▼───────────────────────────┐
│          Docker Registry                  │
│    (Docker Hub / ECR / GCR / Private)    │
└──────────────────────────────────────────┘
```

### Containers vs Virtual Machines

| Feature | Container | Virtual Machine |
|---------|-----------|-----------------|
| OS | Shares host kernel | Full guest OS |
| Startup | Seconds | Minutes |
| Size | MBs | GBs |
| Isolation | Process-level (namespaces, cgroups) | Hardware-level (hypervisor) |
| Performance | Near-native | Overhead from hypervisor |
| Use case | Microservices, CI/CD | Legacy apps, full OS isolation |

### Interview Q&A

#### Q: What are namespaces and cgroups in Docker?
A: Namespaces provide **isolation** — each container gets its own PID, network, mount, UTS, IPC, and user namespace so it thinks it's the only process running. Cgroups (control groups) provide **resource limiting** — they cap how much CPU, memory, disk I/O, and network a container can use. Together, they make containers feel like lightweight VMs while sharing the host kernel.

#### Q: What is the container lifecycle?
A: `Created → Running → Paused → Stopped → Removed`. You manage this with `docker create`, `docker start`, `docker pause`, `docker stop`, `docker rm`.

**Q: What's the difference between `docker stop` and `docker kill`?**
A: `docker stop` sends SIGTERM first (graceful shutdown, 10s default timeout), then SIGKILL. `docker kill` sends SIGKILL immediately (no cleanup).

---

## 3. Dockerfile Mastery

### Multi-Stage Build — Your Go-To Example

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
CMD ["node", "dist/main.js"]
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

### Interview Q&A

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

### Network Drivers

| Driver | Use Case | Example |
|--------|----------|---------|
| `bridge` | Default, single-host container communication | Dev environments |
| `host` | Container shares host network stack | High-performance, no NAT overhead |
| `overlay` | Multi-host communication | Swarm / distributed apps |
| `macvlan` | Container gets its own MAC address on LAN | Legacy app integration |
| `none` | No networking | Security-isolated batch jobs |

### Key Concepts

```bash
# Create custom network
docker network create --driver bridge my-app-network

# Run containers on same network (they can reach each other by name)
docker run -d --name api --network my-app-network my-api
docker run -d --name db --network my-app-network postgres

# From api container: ping db  ← works via Docker DNS
```

### Interview Q&A

**Q: How does container-to-container communication work?**
A: Containers on the same user-defined bridge network can communicate using container names as hostnames. Docker has a built-in DNS server (127.0.0.11) that resolves container names to their IPs. The default bridge network doesn't support this — you must use a user-defined network.

**Q: What's the difference between `-p` and `--expose`?**
A: `--expose` makes a port available to other containers on the same network (inter-container). `-p 8080:3000` publishes port 3000 to the host's port 8080 (accessible from outside).

**Q: How would you handle a microservices setup where the frontend shouldn't talk to the database directly?**
A: Create separate networks — put frontend and API on a `frontend-net`, and put API and database on a `backend-net`. Only the API lives on both networks, acting as a gateway.

---

## 6. Storage & Volumes

### Three Types of Mounts

| Type | Managed by Docker? | Persists? | Use Case |
|------|-------------------|-----------|----------|
| **Volumes** (`docker volume create`) | Yes | Yes | Databases, persistent data |
| **Bind Mounts** (`-v /host:/container`) | No | Yes | Dev — mount source code |
| **tmpfs** | No | No (RAM only) | Secrets, temp caches |

### Interview Q&A

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

## 7. Image Optimization & Registry

### Image Size Comparison (Real-World)

```
node:20          → ~1.1 GB   ❌ Never use in prod
node:20-slim     → ~250 MB   ⚠️ OK
node:20-alpine   → ~140 MB   ✅ Good
distroless       → ~30 MB    ✅ Best (no shell, no package manager)
Multi-stage      → ~80 MB    ✅ Recommended approach
```

### Registry Workflow

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

## 8. Security Best Practices

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

## 9. Docker in CI/CD Pipelines

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

### Docker Swarm vs Kubernetes — Quick Comparison

| Feature | Docker Swarm | Kubernetes |
|---------|-------------|------------|
| Setup complexity | Simple (`docker swarm init`) | Complex (control plane, etcd, etc.) |
| Learning curve | Low | Steep |
| Scaling | Basic | Advanced (HPA, VPA, cluster autoscaler) |
| Ecosystem | Limited | Massive (Helm, Istio, ArgoCD, etc.) |
| Best for | Small teams, simple deployments | Large-scale, enterprise production |
| Market share | ~10% | ~82% of container users |

### What You Should Know for 6 Years Exp

**Swarm (show you've used it):**
```bash
docker swarm init
docker service create --replicas 3 --name api -p 4000:4000 myapi:latest
docker service scale api=5
docker stack deploy -c docker-compose.prod.yml myapp
```

**Kubernetes (show awareness, not necessarily deep expertise):**
- Pods, Deployments, Services, Ingress, ConfigMaps, Secrets
- Helm for package management
- "We migrated from Swarm to K8s when we hit 20+ services"

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

**Q: A container keeps restarting. How do you debug it?**
A: Step-by-step approach:
1. `docker logs <container>` — check application errors
2. `docker inspect <container>` — check exit code, OOM kill status
3. `docker stats` — check if it's hitting memory limits
4. Run interactively: `docker run -it --entrypoint /bin/sh myimage` — debug the startup
5. Check if healthcheck is misconfigured (failing too early)
6. Verify environment variables and mounted configs

**Q: How do you monitor Docker in production?**
A: Use Prometheus + Grafana. Docker exposes metrics at `/metrics` endpoint. cAdvisor collects container-level metrics (CPU, memory, network, disk). Set alerts for: high memory usage, restart loops, disk space on volumes.

---

## 12. Real-World Scenario Questions

### Scenario 1: "The app works locally but fails in Docker"

**Answer approach:** This is almost always a configuration/environment issue.
- Check environment variables — missing or different values?
- Check network — is the app trying to connect to `localhost` instead of the service name?
- Check file permissions — mounted volumes may have different ownership
- Check the base image — different OS libraries or versions
- Check timezone/locale differences

### Scenario 2: "Docker images are too large and builds are slow"

**Answer approach:**
- Audit with `docker image history myimage` to find large layers
- Implement multi-stage builds
- Switch to Alpine base images
- Optimize layer caching (install deps before copying source)
- Use `.dockerignore` (check if `node_modules` or `.git` is being copied)
- Use BuildKit with `--mount=type=cache` for package manager caches

### Scenario 3: "Database data was lost after redeploying"

**Answer approach:**
- The database wasn't using a named volume — data was in the container's writable layer
- Fix: define a named volume and mount it to the database's data directory
- Implement automated backups with a cron container or sidecar
- Test disaster recovery: restore from backup to a new volume

### Scenario 4: "How would you containerize a legacy monolith?"

**Answer approach (from your experience):**
- Start with a single container that runs the monolith as-is
- Set up Compose for local dev (app + database + any external deps)
- Gradually extract services into separate containers
- Use an Nginx/Traefik reverse proxy to route traffic
- Keep shared state in external services (database, Redis)
- Don't try to do it all at once — it's an iterative process over months

### Scenario 5: "How do you handle zero-downtime deployments?"

**Answer approach:**
- Use rolling updates (Swarm/K8s handle this natively)
- Implement health checks so the orchestrator knows when new containers are ready
- Use a load balancer (Nginx, Traefik, ALB) that drains connections
- Blue-green deployment: spin up new containers, switch traffic, tear down old
- Database migrations must be backward-compatible (expand-contract pattern)

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

## 14. Common Mistakes to Avoid in Interviews

| Mistake | Why It's Bad | What to Say Instead |
|---------|-------------|-------------------|
| Saying you use `latest` tag in production | Shows inexperience | "We pin to specific versions like `v2.1.0` or git SHA" |
| Not mentioning non-root users | Security red flag | "I always add a `USER` instruction — never run as root" |
| Confusing CMD and ENTRYPOINT | Basic knowledge gap | Explain both clearly with use cases |
| Saying "Docker is a VM" | Fundamental misunderstanding | "Containers share the host kernel, unlike VMs" |
| Not knowing multi-stage builds | This is expected at 6 years | Show a concrete example from your projects |
| Ignoring `.dockerignore` | Shows you haven't dealt with slow builds | "First thing I set up — keeps build context small" |
| Saying you only use `docker run` | No orchestration experience | Talk about Compose, Swarm, or K8s |
| Not mentioning health checks | Critical for production | "Every production service has a health check endpoint" |

---

## 15. Buzzwords & Trends for 2026

Show awareness of these to demonstrate you stay current:

- **Docker Scout / Trivy** — image vulnerability scanning integrated into CI
- **BuildKit** — next-gen builder with better caching, secrets, SSH forwarding
- **Multi-arch builds** — `docker buildx build --platform linux/amd64,linux/arm64`
- **Distroless images** — Google's minimal images with no shell or package manager
- **Docker Init** — auto-generates Dockerfile and Compose for your project
- **WebAssembly (Wasm) containers** — Docker now supports Wasm as a container runtime
- **Docker Desktop AI** — AI-assisted Dockerfile optimization (new in 2026)
- **OCI (Open Container Initiative)** — mention that Docker images follow OCI standards
- **Testcontainers** — spinning up real Docker containers for integration tests
- **Dev Containers** — VS Code dev environments defined in Docker

---

## Quick Revision: Top 20 Questions They WILL Ask

1. What is Docker and how is it different from a VM?
2. Explain Docker architecture (client, daemon, registry)
3. What are namespaces and cgroups?
4. Difference between CMD and ENTRYPOINT?
5. What is a multi-stage build and why use it?
6. How do you reduce Docker image size?
7. Explain Docker layer caching
8. What are Docker volumes? Types?
9. How does container networking work?
10. What's the difference between bridge, host, and overlay networks?
11. How do you manage secrets in Docker?
12. Explain Docker Compose and its use cases
13. What restart policies are available?
14. How do you debug a failing container?
15. How do you scan images for vulnerabilities?
16. Docker Swarm vs Kubernetes — when to use which?
17. How do you integrate Docker in CI/CD?
18. What is Docker Content Trust?
19. How do you handle logging in containerized apps?
20. Describe a production Docker issue you solved

---

> **Final Tip:** Don't just memorize answers. Practice by actually running these commands, building a small project with Docker Compose, and intentionally breaking things to learn debugging. Interviewers can tell the difference between memorized answers and real experience.

**Good luck with your interview! 🚀**
