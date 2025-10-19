#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Building Production Docker Images (UI2)${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Build API
echo -e "${GREEN}Building API...${NC}"
docker compose -f docker-compose.prod.ui2.yml build api

# Build UI2
echo -e "\n${GREEN}Building UI2...${NC}"
docker compose -f docker-compose.prod.ui2.yml build ui2

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Build Complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo "Images created:"
echo "  - griffin-api:latest"
echo "  - griffin-ui2:latest"

echo -e "\n${YELLOW}To push to a registry:${NC}"
echo "  docker push griffin-api:latest"
echo "  docker push griffin-ui2:latest"

echo -e "\n${YELLOW}To start the containers:${NC}"
echo "  docker compose -f docker-compose.prod.ui2.yml up -d"


