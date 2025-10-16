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

# Create the prod network if it doesn't exist
if ! docker network inspect prod >/dev/null 2>&1; then
    echo -e "${YELLOW}Creating shared 'prod' network...${NC}"
    docker network create prod
    echo -e "${GREEN}✓ Network 'prod' created${NC}\n"
else
    echo -e "${GREEN}✓ Network 'prod' already exists${NC}\n"
fi

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

# Start containers (database and typesense will not be recreated if already running)
echo -e "${GREEN}Starting containers...${NC}"
docker compose -f docker-compose.prod.yml up -d --no-recreate typesense
docker compose -f docker-compose.prod.yml up -d api ui

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
echo "  Typesense: http://localhost:8108"

echo -e "\n${YELLOW}Useful Commands:${NC}"
echo "  View logs:      docker compose -f docker-compose.prod.yml logs -f"
echo "  View API logs:  docker logs -f griffin-api"
echo "  View UI logs:   docker logs -f griffin-ui"
echo "  Stop all:       docker compose -f docker-compose.prod.yml down"
echo "  Restart API:    docker restart griffin-api"
echo "  Restart UI:     docker restart griffin-ui"

