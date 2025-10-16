#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Generate timestamp tag
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DATE_TAG=$(date +%Y%m%d)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Building Production Docker Images${NC}"
echo -e "${BLUE}Timestamp: ${TIMESTAMP}${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Build API
echo -e "${GREEN}Building API...${NC}"
docker compose -f docker-compose.prod.yml build api

# Tag API images
echo -e "${YELLOW}Tagging API image...${NC}"
docker tag griffin-api:latest griffin-api:${TIMESTAMP}
docker tag griffin-api:latest griffin-api:${DATE_TAG}

# Build UI
echo -e "\n${GREEN}Building UI...${NC}"
docker compose -f docker-compose.prod.yml build ui

# Tag UI images
echo -e "${YELLOW}Tagging UI image...${NC}"
docker tag griffin-ui:latest griffin-ui:${TIMESTAMP}
docker tag griffin-ui:latest griffin-ui:${DATE_TAG}

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Build Complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo "Images created:"
echo "  - griffin-api:${TIMESTAMP}"
echo "  - griffin-api:${DATE_TAG}"
echo "  - griffin-api:latest"
echo "  - griffin-ui:${TIMESTAMP}"
echo "  - griffin-ui:${DATE_TAG}"
echo "  - griffin-ui:latest"

# Cleanup old images - keep only 3 most recent
echo -e "\n${YELLOW}Cleaning up old images (keeping 3 most recent)...${NC}"

cleanup_old_images() {
    local image_prefix=$1
    
    # Get all timestamp-tagged images (exclude 'latest' and date-only tags)
    # Format: YYYYMMDD-HHMMSS
    local images=$(docker images --format "{{.Repository}}:{{.Tag}}" "${image_prefix}" | \
                   grep -E "${image_prefix}:[0-9]{8}-[0-9]{6}$" | \
                   sort -r)
    
    # Count images
    local count=$(echo "$images" | grep -c . || echo 0)
    
    if [ "$count" -gt 3 ]; then
        echo "  Found $count ${image_prefix} images, removing $((count - 3)) old ones..."
        
        # Skip first 3 (most recent) and remove the rest
        echo "$images" | tail -n +4 | while read -r image; do
            echo "    Removing: $image"
            docker rmi "$image" 2>/dev/null || true
        done
    else
        echo "  ${image_prefix}: $count images (no cleanup needed)"
    fi
}

cleanup_old_images "griffin-api"
cleanup_old_images "griffin-ui"

echo -e "${GREEN}✓ Cleanup complete${NC}"

echo -e "\n${YELLOW}To push to a registry:${NC}"
echo "  docker push griffin-api:${TIMESTAMP}"
echo "  docker push griffin-ui:${TIMESTAMP}"

echo -e "\n${YELLOW}To start the containers:${NC}"
echo "  docker compose -f docker-compose.prod.yml up -d"

