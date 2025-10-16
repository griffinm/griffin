# AI Implementation Prompt - Docker Deployment Pattern

Copy and customize this prompt to have an AI implement the same Docker deployment pattern in another project.

---

## 📋 PROMPT FOR AI

I need you to implement a production Docker deployment setup for my project following this exact pattern:

### Architecture Requirements

1. **Multi-Container Setup**:

   - API container (Node.js backend)
   - UI container (React frontend served by Nginx)
   - Database container (PostgreSQL)
   - Optional: Additional services (Redis, Typesense, etc.)

2. **Networking**:

   - UI Nginx reverse proxies `/api/*` requests to API container
   - All containers communicate using Docker service names
   - UI accessible externally on port 10200
   - API accessible externally on port 10100 (and via 10200/api/)

3. **Configuration**:
   - All secrets/config in `.env.prod` file
   - Service names used for inter-container communication (e.g., `DATABASE_URL=postgresql://user:pass@db:5432/mydb`)
   - Simple tagging strategy: only use `latest` tag

### Files to Create

#### 1. `Dockerfile.api` (Multi-stage build)

```dockerfile
# Stage 1: Builder
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx nx reset
RUN npx nx run <api-project>:build:production

# Stage 2: Runner
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/dist/apps/<api-app> ./dist/apps/<api-app>
COPY --from=builder /app/node_modules ./node_modules
COPY .env.prod ./.env
EXPOSE 8080
CMD ["node", "dist/apps/<api-app>/main.js"]
```

#### 2. `Dockerfile.ui` (Build + Nginx)

```dockerfile
# Stage 1: Builder
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx nx reset
RUN npx nx run <ui-project>:build:production

# Stage 2: Nginx
FROM nginx:stable-alpine AS nginx
COPY --from=builder /app/dist/apps/<ui-app> /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

#### 3. `nginx.conf`

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

#### 4. `docker-compose.prod.yml`

```yaml
name: <project>-notes # or <project>-app, etc.

volumes:
  db-data-prod:

networks:
  prod:
    external: true # Shared network across multiple apps

services:
  db:
    container_name: <project>-db
    image: postgres:17
    volumes:
      - db-data-prod:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=<user>
      - POSTGRES_PASSWORD=<password>
    ports:
      - 5432:5432
    networks:
      - prod

  api:
    container_name: <project>-api
    image: <project>-api:latest
    build:
      context: .
      dockerfile: Dockerfile.api
    ports:
      - '10100:8080'
    depends_on:
      - db
    restart: on-failure
    networks:
      - prod

  ui:
    container_name: <project>-ui
    image: <project>-ui:latest
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

#### 5. `.env.prod` (Example structure)

```bash
# Database (use service name!)
DATABASE_URL="postgresql://user:pass@db:5432/dbname"

# API Keys
AWS_ACCESS_KEY_ID="xxx"
AWS_SECRET_ACCESS_KEY="xxx"
AWS_REGION=us-east-1

# Application
PORT=8080
NODE_ENV=production
JWT_TOKEN_SECRET=your-secret

# Other services (use service names!)
REDIS_HOST=redis
REDIS_PORT=6379
```

#### 6. Shell Scripts

**`build-prod.sh`**:

```bash
#!/bin/bash
set -e
echo "Building Docker images..."
docker compose -f docker-compose.prod.yml build api
docker compose -f docker-compose.prod.yml build ui
echo "✓ Build complete: <project>-api:latest, <project>-ui:latest"
```

**`run-prod.sh`**:

```bash
#!/bin/bash
set -e
echo "Starting containers..."

# Create the prod network if it doesn't exist
if ! docker network inspect prod >/dev/null 2>&1; then
    echo "Creating shared 'prod' network..."
    docker network create prod
    echo "✓ Network 'prod' created"
fi

# CRITICAL: Never recreate database in production
docker compose -f docker-compose.prod.yml up -d --no-recreate db typesense
docker compose -f docker-compose.prod.yml up -d api ui
docker compose -f docker-compose.prod.yml ps
echo "✓ Containers started (database preserved)"
echo "  UI:  http://localhost:10200"
echo "  API: http://localhost:10200/api (proxied)"
echo "  API: http://localhost:10100 (direct)"
```

**`stop-prod.sh`**:

```bash
#!/bin/bash
set -e
echo "Stopping containers..."
docker compose -f docker-compose.prod.yml stop
echo "✓ Containers stopped (network and volumes preserved)"
```

**`deploy-prod.sh`**:

```bash
#!/bin/bash
set -e
echo "Deploying..."
./build-prod.sh
./run-prod.sh
echo "✓ Deployment complete!"
```

Make all executable: `chmod +x *.sh`

#### 7. `env.prod.template`

Copy `.env.prod` with placeholder values for documentation.

### Critical Requirements

1. **Service Names**: All inter-container communication MUST use service names

   - ✅ `DATABASE_URL=postgresql://user:pass@db:5432/mydb`
   - ❌ `DATABASE_URL=postgresql://user:pass@localhost:5432/mydb`

2. **Nginx Proxy**: UI must reverse proxy `/api/*` to API container

   - Enables same-origin requests
   - Avoids CORS issues

3. **Port Mapping**:

   - Internal: Containers use standard ports (8080, 5432)
   - External: Map to 10100 (API), 10200 (UI)

4. **Environment File**:

   - All config in `.env.prod`
   - Copied during build (not runtime)
   - Must rebuild when config changes

5. **Tagging**: Only use `latest` tag (no timestamps/versions)

6. **Volume Persistence**:

   - Database data persists in named volume `db-data-prod`
   - Mount at `/var/lib/postgresql/data` (correct PostgreSQL path)
   - Data survives container restarts/rebuilds
   - Only deleted with `docker compose down -v`

7. **External Network**:
   - All containers connect to external `prod` network
   - Network is shared across multiple applications
   - Never created/destroyed by compose down
   - Created on first run if doesn't exist

### My Project Details

**Project Name**: [YOUR_PROJECT_NAME]

**Monorepo Structure**:

```
project-root/
├── apps/
│   ├── api/          # NestJS API
│   └── frontend/     # React UI
├── package.json
└── nx.json
```

**Build Commands**:

- API: `npx nx run api:build:production`
- UI: `npx nx run frontend:build:production`

**Start Commands**:

- API: `node dist/apps/api/main.js`

**Services Needed**:

- PostgreSQL 17
- [Add any other services: Redis, MongoDB, etc.]

**Environment Variables** (that need to go in .env.prod):

```
DATABASE_URL
JWT_SECRET
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
[List all your env vars]
```

### Deliverables

Please create all the files listed above with proper customization for my project. Ensure:

1. All placeholders (`<project>`, `<api-project>`, `<ui-app>`) are replaced
2. Scripts are properly formatted with error handling
3. `.env.prod` includes all necessary variables
4. Service names are used consistently
5. Documentation includes deployment instructions

### Testing

After implementation, I should be able to run:

```bash
./deploy-prod.sh
```

And access:

- UI: http://localhost:10200
- API: http://localhost:10200/api

---

## 📝 Example Filled Prompt

Here's an example with filled-in details:

**Project Name**: TaskManager

**Monorepo Structure**:

```
task-manager/
├── apps/
│   ├── backend/      # Express API
│   └── web/          # React UI
├── package.json
└── nx.json
```

**Build Commands**:

- API: `npx nx run backend:build:production`
- UI: `npx nx run web:build:production`

**Services**:

- PostgreSQL 17
- Redis 7

**Environment Variables**:

```
DATABASE_URL
REDIS_URL
JWT_SECRET
SMTP_HOST
SMTP_USER
SMTP_PASS
```

Replace `<project>` with `taskmanager`, `<api-project>` with `backend`, `<ui-app>` with `web`, etc.

---

## 🎯 Success Criteria

After implementation, you should have:

- ✅ 4 Docker files (2 Dockerfiles, 1 compose, 1 nginx.conf)
- ✅ 4 Shell scripts (build, run, stop, deploy)
- ✅ 2 Environment files (.env.prod, env.prod.template)
- ✅ One-command deployment: `./deploy-prod.sh`
- ✅ Working reverse proxy through Nginx
- ✅ All services communicating via service names
