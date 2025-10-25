#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Building and pushing Kubernetes images${NC}"
echo "================================================"

# Get git short hash for tagging
GIT_HASH=$(git rev-parse --short HEAD)
echo -e "${YELLOW}📌 Git hash: ${GIT_HASH}${NC}"

# Docker registry
REGISTRY="nas.malfin.com:10100"
echo -e "${YELLOW}📦 Registry: ${REGISTRY}${NC}"
echo ""

# Build and push UI image
echo -e "${GREEN}🏗️  Building UI image...${NC}"
docker build -f Dockerfile.ui2 -t ${REGISTRY}/notes-ui:${GIT_HASH} .
echo -e "${GREEN}✅ UI image built${NC}"

echo -e "${GREEN}📤 Pushing UI image...${NC}"
docker push ${REGISTRY}/notes-ui:${GIT_HASH}
echo -e "${GREEN}✅ UI image pushed${NC}"
echo ""

# Build and push API image
echo -e "${GREEN}🏗️  Building API image...${NC}"
docker build -f Dockerfile.api -t ${REGISTRY}/notes-api:${GIT_HASH} .
echo -e "${GREEN}✅ API image built${NC}"

echo -e "${GREEN}📤 Pushing API image...${NC}"
docker push ${REGISTRY}/notes-api:${GIT_HASH}
echo -e "${GREEN}✅ API image pushed${NC}"
echo ""

# Update deployment manifests with the new image tag
echo -e "${GREEN}📝 Updating deployment manifests with image tag...${NC}"
sed -i "s|IMAGE_TAG|${GIT_HASH}|g" k8s/api-deployment.yaml
sed -i "s|IMAGE_TAG|${GIT_HASH}|g" k8s/ui-deployment.yaml
echo -e "${GREEN}✅ Deployment manifests updated${NC}"
echo ""

echo -e "${GREEN}🎉 Build and push completed successfully!${NC}"
echo -e "${YELLOW}Images:${NC}"
echo "  - ${REGISTRY}/notes-ui:${GIT_HASH}"
echo "  - ${REGISTRY}/notes-api:${GIT_HASH}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Run ./create-api-secret.sh to create the API secret"
echo "  2. Run ./deploy-k8s.sh to deploy to Kubernetes"

