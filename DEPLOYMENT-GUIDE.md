# Griffin Production Deployment Guide

Quick reference for deploying and managing the Griffin application in production.

## 🚀 Quick Start

### One-Command Deployment

```bash
./deploy-prod.sh
```

This single command will:

1. Build Docker images with timestamp tags
2. Deploy all containers
3. Show status and URLs

## 📋 Available Scripts

### Main Scripts

| Script           | Purpose                   | Usage              |
| ---------------- | ------------------------- | ------------------ |
| `deploy-prod.sh` | **All-in-one deployment** | `./deploy-prod.sh` |
| `build-prod.sh`  | Build Docker images only  | `./build-prod.sh`  |
| `run-prod.sh`    | Start containers only     | `./run-prod.sh`    |
| `stop-prod.sh`   | Stop all containers       | `./stop-prod.sh`   |

### Typical Workflows

#### First Time Deployment

```bash
# 1. Ensure .env.prod exists with non-sensitive config
cp env.prod.template .env.prod
# Edit .env.prod with your settings

# 2. Ensure AWS credentials are configured
aws configure  # or export AWS_ACCESS_KEY_ID, etc.

# 3. Deploy
./deploy-prod.sh
```

#### Update After Code Changes

```bash
./deploy-prod.sh
```

#### Restart Without Rebuilding

```bash
docker compose -f docker-compose.prod.yml restart
```

#### Stop Everything

```bash
./stop-prod.sh
```

## 🔐 AWS Configuration

The deployment requires AWS credentials to fetch secrets from Secrets Manager.

### Method 1: AWS CLI Profile (Recommended)

```bash
aws configure
./deploy-prod.sh  # Automatically uses credentials from ~/.aws
```

### Method 2: Environment Variables

```bash
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=<your-key>
export AWS_SECRET_ACCESS_KEY=<your-secret>
export AWS_SECRET_NAME=griffin/prod/env
./deploy-prod.sh
```

### Method 3: IAM Roles (AWS EC2/ECS)

If running on AWS infrastructure, attach an IAM role with Secrets Manager access.
No manual credential setup needed.

## 📦 What Gets Built

Each build creates Docker images with multiple tags:

```
griffin-api:20251016-143022  (timestamp)
griffin-api:20251016         (date)
griffin-api:latest           (latest)

griffin-ui:20251016-143022   (timestamp)
griffin-ui:20251016          (date)
griffin-ui:latest            (latest)
```

**Automatic Cleanup:** The build script automatically keeps only the 3 most recent timestamp-tagged images and removes older ones to save disk space.

## 🌐 Service Access

After deployment:

| Service        | URL                        | Purpose                             |
| -------------- | -------------------------- | ----------------------------------- |
| **UI**         | http://localhost:10200     | Frontend application                |
| **API**        | http://localhost:10200/api | Backend API (proxied through nginx) |
| **API Direct** | http://localhost:10100     | Backend API (direct access)         |
| **Database**   | localhost:5432             | PostgreSQL                          |
| **Typesense**  | http://localhost:8108      | Search engine                       |

**Note:** The UI nginx server acts as a reverse proxy, forwarding all `/api/*` requests to the API container. This enables same-origin requests and avoids CORS issues.

## 🔧 Common Tasks

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker logs -f griffin-api-prod
docker logs -f griffin-ui-prod
```

### Check Container Status

```bash
docker compose -f docker-compose.prod.yml ps
```

### Restart a Service

```bash
docker restart griffin-api-prod
docker restart griffin-ui-prod
```

### Access Container Shell

```bash
docker exec -it griffin-api-prod bash
```

### Remove Everything (including volumes)

```bash
docker compose -f docker-compose.prod.yml down -v
```

### List All Images

```bash
# View all griffin images
docker images | grep griffin

# View by date
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}" | grep griffin
```

### Manually Remove Old Images

```bash
# Remove specific image
docker rmi griffin-api:20251015-120000

# Remove all old images (if needed)
docker image prune -a --filter "label!=keep"
```

## 🐛 Troubleshooting

### Build fails with "Secret not found"

- Verify secret exists: `aws secretsmanager describe-secret --secret-id griffin/prod/env`
- Check AWS credentials: `aws sts get-caller-identity`

### Container exits immediately

- Check logs: `docker logs griffin-api-prod`
- Verify `.env.prod` exists and is valid
- Ensure all required secrets are in AWS Secrets Manager

### Can't connect to API/UI

- Check containers are running: `docker ps`
- Check ports aren't in use: `lsof -i :10100` and `lsof -i :10200`
- View container logs for errors

### Database connection errors

- Ensure DATABASE_URL in AWS Secrets Manager is correct
- Check database container is running: `docker ps | grep griffin-db`

## 📚 Additional Documentation

- **AWS Secrets Setup**: See `AWS-SECRETS-README.md`
- **Environment Variables**: See `env.prod.template`

## 🔄 CI/CD Integration

For automated deployments, you can use these scripts in your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Deploy to Production
  run: |
    export AWS_ACCESS_KEY_ID=${{ secrets.AWS_ACCESS_KEY_ID }}
    export AWS_SECRET_ACCESS_KEY=${{ secrets.AWS_SECRET_ACCESS_KEY }}
    ./deploy-prod.sh
```

## 📝 Notes

- All scripts include error checking and will stop if any step fails
- AWS credentials from `~/.aws/credentials` are automatically detected
- Timestamp tags allow rollback to specific versions if needed
- Production secrets are never stored in code or Docker images
