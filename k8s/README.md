# Kubernetes Deployment Guide

This directory contains all the Kubernetes manifests and deployment scripts for the Notes application.

## Architecture

- **Namespace**: `prod`
- **Services**:
  - `notes-ui`: Frontend application (React + Nginx)
  - `notes-api`: Backend API (Node.js + NestJS)

## Prerequisites

1. Kubernetes cluster accessible via `kubectl`
2. Docker installed and configured
3. Access to the Docker registry at `nas.malfin.com:10100`
4. `.env.prod` file with production environment variables

## Quick Start

### 1. Build and Push Images

```bash
./build-and-push-k8s.sh
```

This script will:
- Get the current git short hash
- Build Docker images for UI and API
- Tag images with the git hash
- Push images to `nas.malfin.com:10100`
- Update deployment manifests with the image tags

### 2. Deploy to Kubernetes

```bash
./deploy-k8s.sh
```

This script will:
- Create the `prod` namespace
- Create Kubernetes secret from `.env.prod`
- Deploy the API with deployment and service
- Deploy the UI with deployment and service
- Wait for deployments to be ready
- Display deployment status

## Manual Deployment Steps

If you prefer to deploy manually:

### 1. Create Namespace
```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Create API Secret
```bash
./create-api-secret.sh
```

Or manually:
```bash
kubectl create secret generic notes-api-secret \
  --from-env-file=.env.prod \
  -n prod
```

### 3. Deploy API
```bash
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/api-service.yaml
```

### 4. Deploy UI
```bash
kubectl apply -f k8s/ui-deployment.yaml
kubectl apply -f k8s/ui-service.yaml
```

## Configuration Details

### UI Configuration
- **Image**: `nas.malfin.com:10100/notes-ui:<git-hash>`
- **Port**: 80
- **Service Type**: NodePort (30300)
- **Resources**:
  - CPU: 2000m (2 cores)
  - Memory: 64Mi request / 128Mi limit

### API Configuration
- **Image**: `nas.malfin.com:10100/notes-api:<git-hash>`
- **Port**: 80 (exposed internally as 10301)
- **Service Type**: ClusterIP
- **Resources**:
  - CPU: 2000m (2 cores)
  - Memory: 64Mi request / 128Mi limit
- **Environment Variables**: Loaded from `notes-api-secret` secret

### Networking
- UI is accessible via NodePort on port 30300
- API is only accessible internally at `notes-api.prod.svc.cluster.local:10301`
- Nginx in the UI container proxies `/api/*` requests to the API service

## Environment Variables

The API requires the following environment variables (stored in `.env.prod`):

### Required Secrets (in Kubernetes secret)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_TOKEN_SECRET`: Secret key for JWT token generation
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key

### Non-sensitive Configuration (in deployment manifest)
- `PORT=80`
- `NODE_ENV=production`
- `USE_AWS_SECRETS=false`
- `AWS_REGION=us-east-1`
- `AWS_S3_BUCKET=griffin-uploads-prod`
- `TYPESENSE_HOST=typesense`
- `TYPESENSE_PORT=8108`
- `TYPESENSE_PROTOCOL=http`
- `TYPESENSE_API_KEY=xyz`
- `API_PREFIX=/api`
- `CORS_ORIGIN=http://localhost:10200`

## Accessing the Application

Once deployed, access the UI at:
```
http://<node-ip>:30300
```

To get your node IP:
```bash
kubectl get nodes -o wide
```

## Useful Commands

### View Deployment Status
```bash
kubectl get all -n prod
```

### View Logs
```bash
# UI logs
kubectl logs -n prod -l app=notes-ui --tail=100 -f

# API logs
kubectl logs -n prod -l app=notes-api --tail=100 -f
```

### Describe Resources
```bash
# Deployments
kubectl describe deployment notes-ui -n prod
kubectl describe deployment notes-api -n prod

# Services
kubectl describe service notes-ui -n prod
kubectl describe service notes-api -n prod

# Pods
kubectl get pods -n prod
kubectl describe pod <pod-name> -n prod
```

### Shell into Pod
```bash
# List pods
kubectl get pods -n prod

# Shell into UI pod
kubectl exec -it -n prod <ui-pod-name> -- /bin/sh

# Shell into API pod
kubectl exec -it -n prod <api-pod-name> -- /bin/sh
```

### Update Deployment
After building new images:
```bash
# Update the image tag in deployment files
# Then apply changes
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/ui-deployment.yaml

# Or restart deployments
kubectl rollout restart deployment/notes-api -n prod
kubectl rollout restart deployment/notes-ui -n prod
```

### Scale Deployments
```bash
kubectl scale deployment notes-ui --replicas=3 -n prod
kubectl scale deployment notes-api --replicas=3 -n prod
```

### Delete Deployment
```bash
# Delete everything in the namespace
kubectl delete namespace prod

# Or delete individual resources
kubectl delete -f k8s/
```

## Troubleshooting

### Pods not starting
```bash
# Check pod events
kubectl describe pod <pod-name> -n prod

# Check logs
kubectl logs <pod-name> -n prod

# Check if images are accessible
docker pull nas.malfin.com:10100/notes-ui:<git-hash>
docker pull nas.malfin.com:10100/notes-api:<git-hash>
```

### API cannot connect to database
```bash
# Check if secret is created correctly
kubectl get secret notes-api-secret -n prod
kubectl describe secret notes-api-secret -n prod

# Verify environment variables in pod
kubectl exec -it -n prod <api-pod-name> -- env | grep DATABASE_URL
```

### Cannot access UI
```bash
# Check service
kubectl get service notes-ui -n prod

# Check if NodePort is accessible
kubectl get nodes -o wide
curl http://<node-ip>:30300

# Check firewall rules if on cloud provider
```

## Health Checks

Both deployments include health checks:

### Liveness Probes
- UI: HTTP GET `/` on port 80
- API: HTTP GET `/api/health` on port 80

### Readiness Probes
- UI: HTTP GET `/` on port 80
- API: HTTP GET `/api/health` on port 80

## Rollback

To rollback to a previous deployment:
```bash
# View rollout history
kubectl rollout history deployment/notes-api -n prod
kubectl rollout history deployment/notes-ui -n prod

# Rollback to previous version
kubectl rollout undo deployment/notes-api -n prod
kubectl rollout undo deployment/notes-ui -n prod

# Rollback to specific revision
kubectl rollout undo deployment/notes-api -n prod --to-revision=2
```

