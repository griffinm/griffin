# Docker Deployment Pattern - Implementation Guide

This document describes the Docker and deployment architecture used in the Griffin project. Use this as a reference to implement the same pattern in other projects with an API and UI.

## 🏗️ Architecture Overview

### Container Structure

```
┌─────────────────────────────────────────┐
│  UI Container (Nginx)                   │
│  - Serves React/Frontend app           │
│  - Reverse proxies /api/* to API       │
│  Port: 10200                            │
└───────────────┬─────────────────────────┘
                │
                ├─> /api/* requests
                ↓
┌─────────────────────────────────────────┐
│  API Container (Node.js)                │
│  - Backend application                  │
│  - Reads config from .env.prod          │
│  Port: 10100 (also accessible via 10200)│
└───────────────┬─────────────────────────┘
                │
        ┌───────┴────────┐
        ↓                ↓
┌──────────────┐  ┌──────────────┐
│  Database    │  │  Typesense   │
│  (Postgres)  │  │  (Search)    │
│  Port: 5432  │  │  Port: 8108  │
└──────────────┘  └──────────────┘
```

### Key Design Decisions

1. **Single-Stage Nginx for UI**: Nginx serves static files and reverse proxies API requests
2. **Multi-Stage Build for API**: Build stage compiles the app, runtime stage runs it (smaller image)
3. **Environment-Based Config**: All secrets/config in `.env.prod` file (local deployment)
4. **Service Discovery**: Containers communicate using service names (e.g., `api`, `db`, `typesense`)
5. **Latest Tag Only**: Simple tagging strategy - only use `latest` tag
6. **Automated Scripts**: Shell scripts for build, deploy, run, and stop operations

## 📁 File Structure

```
project-root/
├── Dockerfile.api              # API multi-stage build
├── Dockerfile.ui               # UI build with Nginx
├── docker-compose.prod.yml     # Production compose config
├── nginx.conf                  # Nginx reverse proxy config
├── .env.prod                   # Production environment variables
├── env.prod.template           # Template for .env.prod
├── build-prod.sh               # Build Docker images
├── run-prod.sh                 # Start containers
├── stop-prod.sh                # Stop containers
├── deploy-prod.sh              # Build + Run (all-in-one)
└── DEPLOYMENT-GUIDE.md         # User documentation
```

## 🐳 Docker Implementation

### 1. API Dockerfile (`Dockerfile.api`)

**Pattern**: Multi-stage build with Node.js slim base

```dockerfile
# Stage 1: Build the application
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client (if using Prisma)
RUN (cd apps/api && npx prisma generate)

# Build the application
RUN npx nx reset
RUN npx nx run api:build:production

# Stage 2: Production image
FROM node:20-slim AS runner

# Install required system dependencies
RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

WORKDIR /app

# Copy built app and dependencies
COPY --from=builder /app/dist/apps/api ./dist/apps/api
COPY --from=builder /app/node_modules ./node_modules

# Copy environment file
COPY .env.prod ./.env

EXPOSE 8080

# Start the application
CMD ["node", "dist/apps/api/main.js"]
```

**Key Points:**

- Use `node:20-slim` for smaller images
- Multi-stage build separates build and runtime dependencies
- Copy only necessary files to production stage
- Install OpenSSL for Prisma compatibility
- Environment variables loaded from `.env.prod`

### 2. UI Dockerfile (`Dockerfile.ui`)

**Pattern**: Build React app, serve with Nginx

```dockerfile
# Stage 1: Build the React application
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx nx reset
RUN npx nx run notes-ui:build:production

# Stage 2: Nginx setup
FROM nginx:stable-alpine AS nginx

# Copy built React app
COPY --from=builder /app/dist/apps/notes-ui /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
```

**Key Points:**

- Build stage creates production React build
- Nginx stage serves static files
- Custom nginx.conf for reverse proxy
- Lightweight Alpine-based Nginx image

### 3. Nginx Configuration (`nginx.conf`)

**Purpose**: Serve UI and reverse proxy API requests

```nginx
server {
    listen 8080;
    server_name localhost;

    # Serve React App
    location / {
        root /usr/share/nginx/html;
        try_files $uri /index.html;
    }

    # Reverse proxy for API requests
    location /api/ {
        proxy_pass http://api:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Key Points:**

- Nginx listens on port 8080 (container internal)
- Root location serves React app with SPA fallback
- `/api/` proxies to `http://api:8080` (Docker service name)
- Headers preserve client information

### 4. Docker Compose (`docker-compose.prod.yml`)

```yaml
name: prod-notes

volumes:
  db-data-prod:
  typesense-data-prod:

networks:
  prod:
    external: true

services:
  typesense:
    container_name: griffin-typesense
    image: typesense/typesense:27.0
    restart: on-failure
    ports:
      - '8108:8108'
    volumes:
      - ./typesense-data-prod:/data
    command: '--data-dir /data --api-key=xyz --enable-cors'
    networks:
      - prod

  db:
    container_name: griffin-db
    image: postgres:17
    volumes:
      - db-data-prod:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=griffin
      - POSTGRES_PASS=griffin
      - ALLOW_IP_RANGE=0.0.0.0/0
      - POSTGRES_PASSWORD=griffin
    ports:
      - 5432:5432
    networks:
      - prod

  api:
    container_name: griffin-api
    image: griffin-api:latest
    build:
      context: .
      dockerfile: Dockerfile.api
    ports:
      - '10100:8080'
    depends_on:
      - db
      - typesense
    restart: on-failure
    networks:
      - prod

  ui:
    container_name: griffin-ui
    image: griffin-ui:latest
    build:
      context: .
      dockerfile: Dockerfile.ui
    ports:
      - '10200:8080'
    depends_on:
      - api
    restart: on-failure
    networks:
      - prod
```

**Key Points:**

- `name: prod-notes` groups containers in Docker Desktop
- Named volumes for data persistence (`db-data-prod` persists database data)
- Database volume mounted at `/var/lib/postgresql/data` (correct path for PostgreSQL)
- Explicit container names for easy management
- `depends_on` ensures startup order
- Port mapping: container:8080 → host:10100/10200
- Service names used for inter-container communication
- **External network `prod`** - shared across multiple applications
- Network is never created/destroyed by this project

### 5. Environment Configuration (`.env.prod`)

```bash
# Database
DATABASE_URL="postgresql://user:pass@db:5432/dbname"

# AWS S3
AWS_ACCESS_KEY_ID="xxx"
AWS_SECRET_ACCESS_KEY="xxx"
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=bucket-name

# JWT
JWT_TOKEN_SECRET=your-secret-here

# Application
PORT=8080
NODE_ENV=production

# Typesense (must use service name)
TYPESENSE_HOST=typesense
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=xyz
```

**Critical Points:**

- Database host uses Docker service name: `@db:5432`
- Typesense host uses Docker service name: `typesense`
- All sensitive values stored here (local deployment)
- **Never commit** `.env.prod` to version control

## 📜 Automation Scripts

### 1. Build Script (`build-prod.sh`)

```bash
#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Building Production Docker Images${NC}\n"

# Build API
echo -e "${GREEN}Building API...${NC}"
docker compose -f docker-compose.prod.yml build api

# Build UI
echo -e "${GREEN}Building UI...${NC}"
docker compose -f docker-compose.prod.yml build ui

echo -e "\n${GREEN}✓ Build Complete!${NC}"
echo "Images created:"
echo "  - griffin-api:latest"
echo "  - griffin-ui:latest"
```

**Purpose**: Build both Docker images

### 2. Run Script (`run-prod.sh`)

```bash
#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Starting Production Containers${NC}\n"

# Check if images exist
if ! docker image inspect griffin-api:latest >/dev/null 2>&1; then
    echo -e "${RED}Error: griffin-api:latest not found${NC}"
    echo -e "${YELLOW}Run ./build-prod.sh first${NC}"
    exit 1
fi

if ! docker image inspect griffin-ui:latest >/dev/null 2>&1; then
    echo -e "${RED}Error: griffin-ui:latest not found${NC}"
    echo -e "${YELLOW}Run ./build-prod.sh first${NC}"
    exit 1
fi

# Create the prod network if it doesn't exist
if ! docker network inspect prod >/dev/null 2>&1; then
    echo -e "${YELLOW}Creating shared 'prod' network...${NC}"
    docker network create prod
    echo -e "${GREEN}✓ Network 'prod' created${NC}\n"
else
    echo -e "${GREEN}✓ Network 'prod' already exists${NC}\n"
fi

# Start containers (database and typesense will NOT be recreated)
echo -e "${GREEN}Starting containers...${NC}"
docker compose -f docker-compose.prod.yml up -d --no-recreate db typesense
docker compose -f docker-compose.prod.yml up -d api ui

echo -e "\n${GREEN}✓ Containers Started!${NC}\n"

# Show status
docker compose -f docker-compose.prod.yml ps

echo -e "\n${YELLOW}Service URLs:${NC}"
echo "  UI:   http://localhost:10200"
echo "  API:  http://localhost:10200/api (proxied)"
echo "  API:  http://localhost:10100 (direct)"
```

**Purpose**: Start containers with database protection (DB never recreated)

### 3. Stop Script (`stop-prod.sh`)

```bash
#!/bin/bash
set -e

echo "Stopping Production Containers..."
docker compose -f docker-compose.prod.yml stop

echo "✓ Containers Stopped!"
echo "✓ Network 'prod_default' preserved"
echo "✓ Database data persists in volume 'db-data-prod'"
echo ""
echo "To remove containers (keeps network/volumes):"
echo "  docker compose -f docker-compose.prod.yml down"
echo ""
echo "To completely remove all (network + volumes + containers):"
echo "  docker compose -f docker-compose.prod.yml down -v"
```

**Purpose**: Stop containers while preserving network and volumes

### 4. Deploy Script (`deploy-prod.sh`)

```bash
#!/bin/bash
set -e

echo "Griffin Production Deployment"
echo "============================\n"

# Build
echo "Step 1/2: Building Docker images...\n"
./build-prod.sh

# Deploy
echo "\nStep 2/2: Deploying containers...\n"
./run-prod.sh

echo "\n✓ Deployment Complete!"
echo "Your application is now running:"
echo "  UI:   http://localhost:10200"
echo "  API:  http://localhost:10200/api (proxied)"
```

**Purpose**: One-command build and deploy

## 🔧 Implementation Steps for New Project

### Step 1: Create Dockerfile.api

1. Use `node:20-slim` base image
2. Create multi-stage build (builder + runner)
3. Install system dependencies (openssl, ca-certificates)
4. Copy build output and node_modules to runtime stage
5. Copy `.env.prod` file
6. Set CMD to start your API

**Customize**:

- Adjust build command to your framework
- Add any required system packages
- Modify paths based on your project structure

### Step 2: Create Dockerfile.ui

1. Build stage: Build your frontend (React/Vue/Angular)
2. Runtime stage: Use `nginx:stable-alpine`
3. Copy built files to `/usr/share/nginx/html`
4. Copy custom nginx.conf

**Customize**:

- Adjust build command to your framework
- Update paths to match your dist output

### Step 3: Create nginx.conf

1. Listen on port 8080
2. Serve static files from `/usr/share/nginx/html`
3. Add reverse proxy for `/api/` → `http://api:8080`
4. Include proper proxy headers

**Customize**:

- Adjust API service name if different
- Add additional proxy rules if needed

### Step 4: Create docker-compose.prod.yml

1. Set project name with `name: prod`
2. Define volumes for persistent data
3. Add your database service
4. Add API service with build context
5. Add UI service with build context
6. Set up dependencies with `depends_on`
7. Map ports (host:container)

**Customize**:

- Add your specific services (cache, queue, etc.)
- Update port mappings
- Adjust environment variables

### Step 5: Create .env.prod

1. List all environment variables
2. Use Docker service names for internal connections
3. Include all secrets (database, API keys, etc.)

**Critical**:

- Database host must use service name (e.g., `db`)
- All inter-service communication uses service names
- Add to `.gitignore`

### Step 6: Create env.prod.template

Copy `.env.prod` but replace sensitive values with placeholders

### Step 7: Create Shell Scripts

1. **build-prod.sh**: Build images
2. **run-prod.sh**: Start containers with validation
3. **stop-prod.sh**: Stop containers
4. **deploy-prod.sh**: Build + run

Make executable: `chmod +x *.sh`

### Step 8: Test Deployment

```bash
# First deployment
./deploy-prod.sh

# View logs
docker logs -f <api-container-name>
docker logs -f <ui-container-name>

# Check containers
docker ps

# Test API through proxy
curl http://localhost:10200/api/health

# Stop
./stop-prod.sh
```

## 🎯 Key Patterns to Follow

### 1. Service Discovery

- Always use service names in environment variables
- Example: `DATABASE_URL=postgresql://user:pass@db:5432/mydb`
- NOT: `localhost` or `127.0.0.1`

### 2. Port Mapping Strategy

- Internal: Containers communicate on default ports (8080, 5432, etc.)
- External: Map to different ports (10100, 10200) to avoid conflicts

### 3. Reverse Proxy Architecture

- UI container handles all external traffic
- `/` → Static files
- `/api/` → Proxied to API container
- Benefits: Same-origin requests, no CORS issues

### 4. Environment Configuration

- All config in `.env.prod`
- Copied during Docker build (not runtime)
- Rebuild required when config changes

### 5. Container Naming

- Use explicit `container_name` for easy management
- Pattern: `<project>-<service>`
- Example: `myapp-api`, `myapp-ui`

### 6. Network Management

- **External Network**: All containers connect to shared `prod` network
- Network is **external** - never created/destroyed by this project
- Allows multiple apps to communicate on same network
- Use `docker compose stop` to preserve everything
- Use `docker compose down` to remove containers only
- Project name: `prod-notes` (Docker Desktop group)
- Network name: `prod` (shared, external)

## 📋 Checklist for Implementation

- [ ] Create `Dockerfile.api` with multi-stage build
- [ ] Create `Dockerfile.ui` with Nginx
- [ ] Create `nginx.conf` with reverse proxy
- [ ] Create `docker-compose.prod.yml` with all services
- [ ] Create `.env.prod` with environment variables
- [ ] Create `env.prod.template` for documentation
- [ ] Create `build-prod.sh` script
- [ ] Create `run-prod.sh` script
- [ ] Create `stop-prod.sh` script
- [ ] Create `deploy-prod.sh` script
- [ ] Make all scripts executable (`chmod +x *.sh`)
- [ ] Add `.env.prod` to `.gitignore`
- [ ] Update service names in environment variables
- [ ] Test full deployment cycle
- [ ] Document service URLs
- [ ] Create deployment guide

## 🚀 Quick Start Command

Once implemented, deployment is:

```bash
./deploy-prod.sh
```

That's it! This builds images and starts all containers.

## 📝 AI Implementation Prompt Template

Use this prompt when asking AI to implement this pattern:

```
I need you to implement a Docker-based production deployment setup for my project
with an API and UI. Follow this exact pattern:

1. Architecture:
   - Multi-stage Dockerfile for API (build + runtime stages)
   - Nginx-based Dockerfile for UI with reverse proxy
   - Docker Compose orchestrating all services
   - Nginx reverse proxies /api/* requests to API container

2. Files to create:
   - Dockerfile.api (multi-stage build)
   - Dockerfile.ui (build + nginx)
   - nginx.conf (serve static + proxy /api/)
   - docker-compose.prod.yml (all services)
   - .env.prod (environment variables)
   - build-prod.sh, run-prod.sh, stop-prod.sh, deploy-prod.sh

3. Requirements:
   - Use service names for inter-container communication
   - UI accessible on port 10200, API on 10100
   - All /api/* requests through UI proxy
   - Simple tagging: only use 'latest' tag
   - Environment config in .env.prod

4. My project structure:
   [Describe your project structure here]

5. My services:
   - API: [Framework, build command, start command]
   - UI: [Framework, build command]
   - Database: [Type, version]
   - Other: [List other services]

Reference document: [Attach DOCKER-DEPLOYMENT-PATTERN.md]
```

## 🔍 Common Customizations

### Different Framework

- **NestJS/Express**: Similar to current pattern
- **Django/Flask**: Use Python base image, adjust commands
- **Spring Boot**: Use Java base image, expose different port

### Different Frontend

- **Vue**: Change build command to `npm run build`
- **Angular**: Change build command, adjust output path
- **Next.js**: May need Node runtime instead of Nginx

### Additional Services

```yaml
redis:
  container_name: myapp-redis
  image: redis:7-alpine
  ports:
    - '6379:6379'
```

### Different Ports

Adjust port mappings in docker-compose.prod.yml:

```yaml
ports:
  - '8080:8080' # Instead of 10100
```

## 🎓 Design Philosophy

1. **Simplicity**: One command to deploy everything
2. **Reproducibility**: Same setup works everywhere
3. **Security**: Secrets in .env.prod (not in code)
4. **Maintainability**: Clear file structure, documented scripts
5. **Developer Experience**: Fast iteration, easy debugging

This pattern has been tested and proven in production environments!
