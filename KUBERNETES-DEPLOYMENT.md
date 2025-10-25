# Kubernetes Deployment Summary

## Overview
This document provides a quick reference for deploying the Notes application to Kubernetes.

## Files Created

### Dockerfiles (Updated)
- `Dockerfile.ui2` - UI container image (port changed from 8080 to 80)
- `Dockerfile.api` - API container image (port changed from 8080 to 80)
- `nginx.conf` - Nginx configuration (listen port changed to 80)

### Kubernetes Manifests (`k8s/` directory)
- `namespace.yaml` - Creates the `prod` namespace
- `api-secret.yaml` - Template for API secrets (populated by script)
- `api-deployment.yaml` - API deployment configuration
- `api-service.yaml` - API ClusterIP service (port 10301 → 80)
- `ui-deployment.yaml` - UI deployment configuration
- `ui-service.yaml` - UI NodePort service (port 30300)

### Deployment Scripts
- `build-and-push-k8s.sh` - Builds and pushes Docker images
- `create-api-secret.sh` - Creates Kubernetes secret from .env.prod
- `deploy-k8s.sh` - Deploys all resources to Kubernetes

## Quick Deployment

```bash
# 1. Build and push images (tags with git hash)
./build-and-push-k8s.sh

# 2. Deploy to Kubernetes (creates namespace, secrets, and deployments)
./deploy-k8s.sh
```

## Configuration Summary

### UI Service (notes-ui)
- **Container Port**: 80
- **Service Type**: NodePort
- **External Port**: 30300
- **CPU**: 2000m (2 cores)
- **Memory**: 64Mi request / 128Mi limit
- **Access**: `http://<node-ip>:30300`

### API Service (notes-api)
- **Container Port**: 80
- **Service Type**: ClusterIP
- **Internal Port**: 10301
- **CPU**: 2000m (2 cores)
- **Memory**: 64Mi request / 128Mi limit
- **Access**: Internal only via `notes-api.prod.svc.cluster.local:10301`

### Image Registry
- **Registry**: `nas.malfin.com:10100`
- **UI Image**: `nas.malfin.com:10100/notes-ui:<git-hash>`
- **API Image**: `nas.malfin.com:10100/notes-api:<git-hash>`

### Namespace
- **Name**: `prod`

### Secrets
API secrets are stored in Kubernetes Secret `notes-api-secret` and include:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_TOKEN_SECRET` - JWT secret key
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key

Note: The secret is created from the `.env.prod` file using the `create-api-secret.sh` script.

## Architecture

```
┌─────────────────────────────────────────────┐
│         Kubernetes Cluster (prod)           │
│                                             │
│  ┌──────────────────┐   ┌───────────────┐ │
│  │   notes-ui       │   │  notes-api    │ │
│  │   (NodePort)     │   │  (ClusterIP)  │ │
│  │   Port: 30300    │   │  Port: 10301  │ │
│  │                  │   │               │ │
│  │  ┌────────────┐  │   │ ┌───────────┐ │ │
│  │  │   Nginx    │──┼───┼→│  NestJS   │ │ │
│  │  │  (Port 80) │  │   │ │ (Port 80) │ │ │
│  │  └────────────┘  │   │ └───────────┘ │ │
│  │                  │   │               │ │
│  │  Serves React    │   │  API + DB     │ │
│  │  Proxies /api/*  │   │  Postgres     │ │
│  └──────────────────┘   │  Typesense    │ │
│         ↑               └───────────────┘ │
│         │                      ↓           │
│    External Access         Internal        │
└─────────────────────────────────────────────┘
              │
       User requests
    http://<node-ip>:30300
```

## Environment Variables

The API deployment uses two sources for environment variables:

1. **Kubernetes Secret** (sensitive data):
   - DATABASE_URL
   - JWT_TOKEN_SECRET
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY

2. **Deployment Manifest** (non-sensitive config):
   - PORT=80
   - NODE_ENV=production
   - USE_AWS_SECRETS=false
   - AWS_REGION=us-east-1
   - AWS_S3_BUCKET=griffin-uploads-prod
   - TYPESENSE_HOST=typesense
   - TYPESENSE_PORT=8108
   - TYPESENSE_PROTOCOL=http
   - TYPESENSE_API_KEY=xyz
   - API_PREFIX=/api
   - CORS_ORIGIN=http://localhost:10200

## Dependencies

- **Postgres**: Already deployed in the cluster, accessible via hostname `postgres`
- **Typesense**: Already deployed in the cluster, accessible via hostname `typesense` on port 8108

## Next Steps

1. Ensure `.env.prod` file exists with all required secrets
2. Ensure Docker registry `nas.malfin.com:10100` is accessible
3. Ensure kubectl is configured to access your Kubernetes cluster
4. Run `./build-and-push-k8s.sh` to build and push images
5. Run `./deploy-k8s.sh` to deploy to Kubernetes
6. Access the application at `http://<node-ip>:30300`

## Monitoring

Check deployment status:
```bash
kubectl get all -n prod
```

View logs:
```bash
kubectl logs -n prod -l app=notes-ui --tail=50 -f
kubectl logs -n prod -l app=notes-api --tail=50 -f
```

## Cleanup

To remove the deployment:
```bash
kubectl delete namespace prod
```

For more detailed information, see `k8s/README.md`.

