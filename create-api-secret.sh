#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 Creating Kubernetes secret from .env.prod${NC}"
echo "================================================"

# Check if .env.prod exists
if [ ! -f ".env.prod" ]; then
    echo -e "${RED}❌ Error: .env.prod file not found${NC}"
    echo "Please create .env.prod with your production environment variables"
    exit 1
fi

echo -e "${YELLOW}📋 Reading .env.prod file...${NC}"

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
    if [[ -z "$line" ]] || [[ "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Skip lines that are just whitespace
    if [[ "$line" =~ ^[[:space:]]*$ ]]; then
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
        echo -e "${GREEN}  ✓ Added: $key${NC}"
    fi
done < .env.prod

echo ""
echo -e "${YELLOW}📝 Generated secret YAML:${NC}"
echo "  Location: $TEMP_SECRET"
echo ""

# Apply the secret to Kubernetes
echo -e "${GREEN}🚀 Applying secret to Kubernetes...${NC}"
kubectl apply -f $TEMP_SECRET

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Secret created successfully!${NC}"
    echo ""
    echo -e "${YELLOW}📊 Secret details:${NC}"
    kubectl get secret notes-api-secret -n prod
else
    echo -e "${RED}❌ Failed to create secret${NC}"
    echo "Secret YAML saved at: $TEMP_SECRET"
    exit 1
fi

# Clean up temp file
rm -f $TEMP_SECRET
echo ""
echo -e "${GREEN}🎉 Secret creation completed!${NC}"

