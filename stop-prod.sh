#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Stopping Production Containers${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if containers are running
if [ "$(docker compose -f docker-compose.prod.yml ps -q | wc -l)" -eq 0 ]; then
    echo -e "${YELLOW}No containers are running${NC}"
    exit 0
fi

# Stop containers
echo -e "${GREEN}Stopping containers...${NC}"
docker compose -f docker-compose.prod.yml down

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Containers Stopped!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}Note:${NC} To remove volumes (database data), run:"
echo "  docker compose -f docker-compose.prod.yml down -v"

