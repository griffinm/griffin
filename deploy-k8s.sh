#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying to Kubernetes${NC}"
echo "================================================"
echo ""

# Step 1: Create namespace
echo -e "${BLUE}📦 Step 1: Creating namespace...${NC}"
kubectl apply -f k8s/namespace.yaml
echo -e "${GREEN}✅ Namespace created/verified${NC}"
echo ""

# Step 2: Create API secret
echo -e "${BLUE}🔐 Step 2: Creating API secret...${NC}"
./create-api-secret.sh
echo ""

# Step 3: Deploy API
echo -e "${BLUE}🔧 Step 3: Deploying API...${NC}"
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/api-service.yaml
echo -e "${GREEN}✅ API deployment created${NC}"
echo ""

# Step 4: Deploy UI
echo -e "${BLUE}🎨 Step 4: Deploying UI...${NC}"
kubectl apply -f k8s/ui-deployment.yaml
kubectl apply -f k8s/ui-service.yaml
echo -e "${GREEN}✅ UI deployment created${NC}"
echo ""

# Wait for deployments to be ready
echo -e "${YELLOW}⏳ Waiting for deployments to be ready...${NC}"
echo ""

echo -e "${BLUE}Waiting for API deployment...${NC}"
kubectl rollout status deployment/notes-api -n prod --timeout=300s
echo -e "${GREEN}✅ API is ready${NC}"
echo ""

echo -e "${BLUE}Waiting for UI deployment...${NC}"
kubectl rollout status deployment/notes-ui -n prod --timeout=300s
echo -e "${GREEN}✅ UI is ready${NC}"
echo ""

# Display deployment information
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "================================================"
echo ""

echo -e "${YELLOW}📊 Deployment Status:${NC}"
echo ""
kubectl get deployments -n prod
echo ""

echo -e "${YELLOW}🌐 Services:${NC}"
echo ""
kubectl get services -n prod
echo ""

echo -e "${YELLOW}📦 Pods:${NC}"
echo ""
kubectl get pods -n prod
echo ""

echo -e "${YELLOW}🔗 Access Information:${NC}"
echo ""
echo "UI: http://<node-ip>:30300"
echo "API (internal): notes-api.prod.svc.cluster.local:10301"
echo ""

echo -e "${GREEN}✨ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Useful commands:${NC}"
echo "  View logs:"
echo "    kubectl logs -n prod -l app=notes-ui"
echo "    kubectl logs -n prod -l app=notes-api"
echo ""
echo "  Describe pods:"
echo "    kubectl describe pods -n prod -l app=notes-ui"
echo "    kubectl describe pods -n prod -l app=notes-api"
echo ""
echo "  Shell into pod:"
echo "    kubectl exec -it -n prod <pod-name> -- /bin/sh"
echo ""
echo "  Delete deployment:"
echo "    kubectl delete namespace prod"

