#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}   Griffin Production Deployment      ${NC}"
echo -e "${BLUE}=======================================${NC}\n"

# Check if scripts exist
if [ ! -f "./build-prod.sh" ] || [ ! -f "./run-prod.sh" ]; then
    echo -e "${RED}❌ Error: Required scripts not found${NC}"
    exit 1
fi

# Step 1: Build
echo -e "${YELLOW}Step 1/2: Building Docker images...${NC}\n"
if ./build-prod.sh; then
    echo -e "\n${GREEN}✅ Build completed successfully${NC}\n"
else
    echo -e "\n${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 2: Deploy (run)
echo -e "${YELLOW}Step 2/2: Deploying containers...${NC}\n"
if ./run-prod.sh; then
    echo -e "\n${GREEN}✅ Deployment completed successfully${NC}\n"
else
    echo -e "\n${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo -e "${BLUE}=======================================${NC}"
echo -e "${GREEN}   🚀 Deployment Complete!            ${NC}"
echo -e "${BLUE}=======================================${NC}\n"

echo -e "${YELLOW}Your application is now running:${NC}"
echo "  UI:   http://localhost:10200"
echo "  API:  http://localhost:10200/api (proxied)"
echo "  API:  http://localhost:10100 (direct)"

echo -e "\n${YELLOW}Quick Commands:${NC}"
echo "  View logs:   docker compose -f docker-compose.prod.yml logs -f"
echo "  Stop all:    ./stop-prod.sh"
echo "  Restart:     docker compose -f docker-compose.prod.yml restart"

