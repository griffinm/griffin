#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║     Complete Kubernetes Deployment Pipeline           ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# STEP 1: Get Git Hash
# ============================================
echo -e "${BLUE}📌 Step 1: Getting git hash...${NC}"
GIT_HASH=$(git rev-parse --short HEAD)
echo -e "${GREEN}   ✓ Git hash: ${GIT_HASH}${NC}"
echo ""

# Docker registry
REGISTRY="nas.malfin.com:10100"
echo -e "${YELLOW}   Registry: ${REGISTRY}${NC}"
echo ""

# ============================================
# STEP 2: Build and Push Docker Images
# ============================================
echo -e "${BLUE}🏗️  Step 2: Building Docker images...${NC}"
echo ""

# Build UI
echo -e "${YELLOW}   Building UI image...${NC}"
docker build -f Dockerfile.ui2 -t ${REGISTRY}/notes-ui:${GIT_HASH} .
echo -e "${GREEN}   ✓ UI image built${NC}"

# Build API
echo -e "${YELLOW}   Building API image...${NC}"
docker build -f Dockerfile.api -t ${REGISTRY}/notes-api:${GIT_HASH} .
echo -e "${GREEN}   ✓ API image built${NC}"
echo ""

# Push UI
echo -e "${YELLOW}   Pushing UI image...${NC}"
docker push ${REGISTRY}/notes-ui:${GIT_HASH}
echo -e "${GREEN}   ✓ UI image pushed${NC}"

# Push API
echo -e "${YELLOW}   Pushing API image...${NC}"
docker push ${REGISTRY}/notes-api:${GIT_HASH}
echo -e "${GREEN}   ✓ API image pushed${NC}"
echo ""

# ============================================
# STEP 3: Update Kubernetes Manifests
# ============================================
echo -e "${BLUE}📝 Step 3: Updating Kubernetes manifests...${NC}"

# Create backup of original manifests
cp k8s/api-deployment.yaml k8s/api-deployment.yaml.bak
cp k8s/ui-deployment.yaml k8s/ui-deployment.yaml.bak

# Update image tags in manifests
sed -i "s|image: nas.malfin.com:10100/notes-api:.*|image: nas.malfin.com:10100/notes-api:${GIT_HASH}|g" k8s/api-deployment.yaml
sed -i "s|image: nas.malfin.com:10100/notes-ui:.*|image: nas.malfin.com:10100/notes-ui:${GIT_HASH}|g" k8s/ui-deployment.yaml

echo -e "${GREEN}   ✓ Manifests updated with image tag: ${GIT_HASH}${NC}"
echo ""

# ============================================
# STEP 4: Create Namespace
# ============================================
echo -e "${BLUE}📦 Step 4: Creating namespace...${NC}"
kubectl apply -f k8s/namespace.yaml
echo -e "${GREEN}   ✓ Namespace 'prod' created/verified${NC}"
echo ""

# ============================================
# STEP 5: Create API Secret
# ============================================
echo -e "${BLUE}🔐 Step 5: Creating API secret from .env.prod...${NC}"

# Check if .env.prod exists
if [ ! -f ".env.prod" ]; then
    echo -e "${RED}   ✗ Error: .env.prod file not found${NC}"
    echo "   Please create .env.prod with your production environment variables"
    exit 1
fi

# Create a temporary file for the secret
TEMP_SECRET=$(mktemp)

# Start the secret YAML
cat > $TEMP_SECRET << 'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: notes-api-secret
  namespace: prod
type: Opaque
data:
EOF

# Read .env.prod and convert to base64 encoded key-value pairs
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    if [[ -z "$line" ]] || [[ "$line" =~ ^[[:space:]]*# ]] || [[ "$line" =~ ^[[:space:]]*$ ]]; then
        continue
    fi
    
    # Extract key and value
    if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        
        # Remove quotes from value if present
        value="${value%\"}"
        value="${value#\"}"
        
        # Base64 encode the value
        encoded_value=$(echo -n "$value" | base64 -w 0)
        
        # Add to secret
        echo "  $key: $encoded_value" >> $TEMP_SECRET
        echo -e "${GREEN}   ✓ Added: $key${NC}"
    fi
done < .env.prod

echo ""

# Apply the secret to Kubernetes
echo -e "${YELLOW}   Applying secret to Kubernetes...${NC}"
kubectl apply -f $TEMP_SECRET

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✓ Secret created successfully${NC}"
else
    echo -e "${RED}   ✗ Failed to create secret${NC}"
    exit 1
fi

# Clean up temp file
rm -f $TEMP_SECRET
echo ""

# ============================================
# STEP 6: Deploy API
# ============================================
echo -e "${BLUE}🔧 Step 6: Deploying API...${NC}"
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/api-service.yaml
echo -e "${GREEN}   ✓ API deployment and service created${NC}"
echo ""

# ============================================
# STEP 7: Deploy UI
# ============================================
echo -e "${BLUE}🎨 Step 7: Deploying UI...${NC}"
kubectl apply -f k8s/ui-deployment.yaml
kubectl apply -f k8s/ui-service.yaml
echo -e "${GREEN}   ✓ UI deployment and service created${NC}"
echo ""

# ============================================
# STEP 8: Wait for Deployments
# ============================================
echo -e "${BLUE}⏳ Step 8: Waiting for deployments to be ready...${NC}"
echo ""

echo -e "${YELLOW}   Waiting for API deployment...${NC}"
kubectl rollout status deployment/notes-api -n prod --timeout=300s
echo -e "${GREEN}   ✓ API is ready${NC}"
echo ""

echo -e "${YELLOW}   Waiting for UI deployment...${NC}"
kubectl rollout status deployment/notes-ui -n prod --timeout=300s
echo -e "${GREEN}   ✓ UI is ready${NC}"
echo ""

# ============================================
# STEP 9: Restore Original Manifests
# ============================================
echo -e "${BLUE}🔄 Step 9: Restoring manifest backups...${NC}"
mv k8s/api-deployment.yaml.bak k8s/api-deployment.yaml
mv k8s/ui-deployment.yaml.bak k8s/ui-deployment.yaml
echo -e "${GREEN}   ✓ Original manifests restored${NC}"
echo ""

# ============================================
# DEPLOYMENT COMPLETE
# ============================================
echo -e "${PURPLE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║            🎉 Deployment Complete! 🎉                  ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# Display Status
# ============================================
echo -e "${BLUE}📊 Deployment Status:${NC}"
echo ""
kubectl get deployments -n prod
echo ""

echo -e "${BLUE}🌐 Services:${NC}"
echo ""
kubectl get services -n prod
echo ""

echo -e "${BLUE}📦 Pods:${NC}"
echo ""
kubectl get pods -n prod
echo ""

echo -e "${BLUE}🔗 Access Information:${NC}"
echo ""
echo -e "  ${GREEN}UI:${NC}      http://<node-ip>:30300"
echo -e "  ${GREEN}API:${NC}     notes-api.prod.svc.cluster.local:10301 (internal)"
echo -e "  ${GREEN}Images:${NC}"
echo "    - ${REGISTRY}/notes-ui:${GIT_HASH}"
echo "    - ${REGISTRY}/notes-api:${GIT_HASH}"
echo ""

echo -e "${BLUE}📝 Useful Commands:${NC}"
echo ""
echo -e "  ${YELLOW}View logs:${NC}"
echo "    kubectl logs -n prod -l app=notes-ui --tail=50 -f"
echo "    kubectl logs -n prod -l app=notes-api --tail=50 -f"
echo ""
echo -e "  ${YELLOW}Shell into pod:${NC}"
echo "    kubectl get pods -n prod"
echo "    kubectl exec -it -n prod <pod-name> -- /bin/sh"
echo ""
echo -e "  ${YELLOW}Delete deployment:${NC}"
echo "    kubectl delete namespace prod"
echo ""

echo -e "${GREEN}✨ All done! Your application is now running in Kubernetes.${NC}"

