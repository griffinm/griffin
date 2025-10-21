# Griffin UI2 Production Deployment Guide

Quick reference for deploying and managing the Griffin UI2 application in production.

## 🚀 Quick Start

### One-Command Deployment

```bash
./deploy-prod-ui2.sh
```

This single command will:

1. Build Docker images with latest tags
2. Deploy all containers (Typesense, API, UI2)
3. Show status and URLs

## 📋 Available Scripts

### Main Scripts

| Script                | Purpose                   | Usage                   |
| --------------------- | ------------------------- | ----------------------- |
| `deploy-prod-ui2.sh`  | **All-in-one deployment** | `./deploy-prod-ui2.sh`  |
| `build-prod-ui2.sh`   | Build Docker images only  | `./build-prod-ui2.sh`   |
| `run-prod-ui2.sh`     | Start containers only     | `./run-prod-ui2.sh`     |
| `stop-prod-ui2.sh`    | Stop all containers       | `./stop-prod-ui2.sh`    |

### Typical Workflows

#### First Time Deployment

```bash
# Deploy UI2
./deploy-prod-ui2.sh
```

#### Update After Code Changes

```bash
./deploy-prod-ui2.sh
```

**Note:** Running `deploy-prod-ui2.sh` multiple times is safe. It rebuilds images and restarts API/UI2 containers while:

- ✅ Preserving Typesense data (never recreated)
- ✅ Preserving the shared network
- ✅ Only updating API and UI2 containers

#### Restart Without Rebuilding

```bash
docker compose -f docker-compose.prod.ui2.yml restart
```

#### Stop Everything

```bash
./stop-prod-ui2.sh
```

## 📦 What Gets Built

Each build creates Docker images with the `latest` tag:

```
griffin-api:latest
griffin-ui2:latest
```

The `latest` tag is overwritten with each new build.

## 🌐 Service Access

After deployment:

| Service        | URL                        | Purpose                             |
| -------------- | -------------------------- | ----------------------------------- |
| **UI2**        | http://localhost:10301     | Frontend application                |
| **API**        | http://localhost:10301/api | Backend API (proxied through nginx) |
| **API Direct** | http://localhost:10301     | Backend API (direct access)         |
| **Typesense**  | http://localhost:8109      | Search engine                       |

**Note:** The UI2 nginx server acts as a reverse proxy, forwarding all `/api/*` requests to the API container. This enables same-origin requests and avoids CORS issues.

## 🔧 Common Tasks

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.ui2.yml logs -f

# Specific service
docker logs -f ui2-api
docker logs -f ui2-ui
```

### Check Container Status

```bash
docker compose -f docker-compose.prod.ui2.yml ps
```

### Restart a Service

```bash
docker restart ui2-api
docker restart ui2-ui
```

### Access Container Shell

```bash
# Access API container
docker exec -it ui2-api bash

# Access UI2 container
docker exec -it ui2-ui sh
```

### Stop Containers (preserves network, volumes, containers)

```bash
# Stops containers, keeps network and data
./stop-prod-ui2.sh
# or
docker compose -f docker-compose.prod.ui2.yml stop
```

### Remove Containers Only (keeps network and data)

```bash
# Removes containers but preserves network and Typesense data
docker compose -f docker-compose.prod.ui2.yml down
```

**Critical Notes:**

- ✅ `./stop-prod-ui2.sh` preserves everything (network, volumes, containers)
- ✅ `down` removes containers but keeps network and volumes
- ❌ **NEVER** use `down -v` in production - it will PERMANENTLY DELETE all data!
- ✅ Typesense is **never** recreated during normal deployments
- ✅ Typesense volume `typesense-data-prod-ui2` persists across all operations
- ✅ Network `prod-network` is shared across multiple apps and never deleted

### List All Images

```bash
# View all griffin images
docker images | grep griffin
```

### Remove Old/Dangling Images

```bash
# Remove dangling images (untagged)
docker image prune

# Remove all unused images
docker image prune -a
```

## 🐛 Troubleshooting

### Container exits immediately

- Check logs: `docker logs ui2-api` or `docker logs ui2-ui`
- Verify the images were built successfully
- Ensure the shared `prod-network` exists

### Can't connect to API/UI2

- Check containers are running: `docker ps`
- Check ports aren't in use: `lsof -i :10101` and `lsof -i :10201`
- View container logs for errors

### Typesense connection errors

- Ensure Typesense container is running: `docker ps | grep ui2-typesense`
- Check Typesense logs: `docker logs ui2-typesense`

## 📝 Notes

- All scripts include error checking and will stop if any step fails
- The shared `prod-network` allows UI2 to coexist with other applications
- Timestamp tags allow rollback to specific versions if needed

## 🔗 Shared Network

The deployment uses a shared Docker network called `prod-network`. This allows containers from different applications to communicate with each other if needed. The network is created automatically when you run the deployment script.

