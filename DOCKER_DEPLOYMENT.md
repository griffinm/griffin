# Griffin API Docker Deployment Guide

## Overview
This guide covers deploying the Griffin API using the multi-stage Dockerfile optimized for production.

## Prerequisites
- Docker installed on your system
- Access to a PostgreSQL database
- Access to Typesense (if using search functionality)
- Environment variables configured

## Environment Variables
Create a `.env` file or set the following environment variables:

```bash
# Database
DATABASE_URL="postgresql://griffin:griffin@db:5432/griffin"

# JWT Secret
JWT_SECRET="your-jwt-secret-here"

# AWS S3 (if using file uploads)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="your-region"
AWS_S3_BUCKET="your-bucket-name"

# Typesense (if using search)
TYPESENSE_API_KEY="xyz"
TYPESENSE_HOST="typesense:8108"
```

## Building the Docker Image

### Basic Build
```bash
docker build -f Dockerfile.api -t griffin-api:latest .
```

### Build with BuildKit (recommended)
```bash
DOCKER_BUILDKIT=1 docker build -f Dockerfile.api -t griffin-api:latest .
```

### Build for specific platform
```bash
docker buildx build --platform linux/amd64 -f Dockerfile.api -t griffin-api:latest .
```

## Running the Container

### Basic Run
```bash
docker run -p 3000:3000 --env-file .env griffin-api:latest
```

### Run with Docker Compose (recommended)
Add to your `docker-compose.yml`:

```yaml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://griffin:griffin@db:5432/griffin
      - JWT_SECRET=your-jwt-secret
    depends_on:
      - db
      - typesense
    restart: unless-stopped
```

## Database Setup

### Run Prisma Migrations
```bash
# Inside the container or locally
npx prisma migrate deploy
```

### Seed Database (optional)
```bash
npm run prisma:seed
```

## Testing the Deployment

### Health Check
```bash
curl http://localhost:3000/health
```

### Test API Endpoints
```bash
# Test basic connectivity
curl http://localhost:3000/api

# Test authentication (if implemented)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Production Considerations

### Security
- The Dockerfile runs as non-root user (`nestjs`)
- Only production dependencies are included
- Sensitive files are excluded via `.dockerignore`

### Performance
- Multi-stage build reduces final image size
- Dependencies are cached in separate layer
- Alpine Linux base image for minimal footprint

### Monitoring
- Health check endpoint included
- Structured logging recommended
- Consider adding metrics collection

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL format
   - Ensure database is accessible from container
   - Check network connectivity

2. **Prisma Client Errors**
   - Ensure Prisma schema is copied to container
   - Run `prisma generate` if needed
   - Check database migrations are applied

3. **Permission Errors**
   - Container runs as non-root user
   - Check file permissions in mounted volumes

### Debug Mode
Run container with shell access:
```bash
docker run -it --env-file .env griffin-api:latest /bin/sh
```

### View Logs
```bash
docker logs <container-id>
```

## Scaling

### Horizontal Scaling
- Use load balancer (nginx, traefik)
- Ensure stateless application design
- Use external database and cache

### Resource Limits
```yaml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Build Docker Image
  run: |
    docker build -f Dockerfile.api -t griffin-api:${{ github.sha }} .
    docker tag griffin-api:${{ github.sha }} griffin-api:latest

- name: Push to Registry
  run: |
    docker push griffin-api:${{ github.sha }}
    docker push griffin-api:latest
```
