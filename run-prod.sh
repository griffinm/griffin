#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Starting Production Containers${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if images exist
echo -e "\n${YELLOW}Checking for images...${NC}"
if ! docker image inspect griffin-api:latest >/dev/null 2>&1; then
    echo -e "${RED}Error: griffin-api:latest not found${NC}"
    echo -e "${YELLOW}Run ./build-prod.sh first to build the images${NC}"
    exit 1
fi

if ! docker image inspect griffin-ui:latest >/dev/null 2>&1; then
    echo -e "${RED}Error: griffin-ui:latest not found${NC}"
    echo -e "${YELLOW}Run ./build-prod.sh first to build the images${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Images found${NC}\n"

# Start containers
echo -e "${GREEN}Starting containers...${NC}"
docker compose -f docker-compose.prod.yml up -d

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Containers Started!${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Show container status
echo "Container Status:"
docker compose -f docker-compose.prod.yml ps

echo -e "\n${YELLOW}Service URLs:${NC}"
echo "  UI:   http://localhost:10200"
echo "  API:  http://localhost:10200/api (proxied through nginx)"
echo "  API:  http://localhost:10100 (direct)"
echo "  DB:   localhost:5432"
echo "  Typesense: http://localhost:8108"

echo -e "\n${YELLOW}Useful Commands:${NC}"
echo "  View logs:      docker compose -f docker-compose.prod.yml logs -f"
echo "  View API logs:  docker logs -f griffin-api-prod"
echo "  View UI logs:   docker logs -f griffin-ui-prod"
echo "  Stop all:       docker compose -f docker-compose.prod.yml down"
echo "  Restart API:    docker restart griffin-api-prod"
echo "  Restart UI:     docker restart griffin-ui-prod"

