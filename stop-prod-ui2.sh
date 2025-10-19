#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Stopping Production Containers (UI2)${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}Stopping containers...${NC}"
docker compose -f docker-compose.prod.ui2.yml stop

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Containers Stopped${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}Container Status:${NC}"
docker compose -f docker-compose.prod.ui2.yml ps

echo -e "\n${YELLOW}To start again:${NC}"
echo "  ./run-prod-ui2.sh"

echo -e "\n${YELLOW}To completely remove containers (keeps data):${NC}"
echo "  docker compose -f docker-compose.prod.ui2.yml down"

echo -e "\n${RED}WARNING: Never run with -v flag in production!${NC}"
echo -e "${RED}That will delete all data permanently!${NC}"


