#!/bin/bash

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables
REGISTRY="nas.malfin.com:10100"
API_IMAGE_NAME="notes-api"
UI_IMAGE_NAME="notes-ui"


log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_new_line() {
    echo ""
}

log_info "Starting build and push to docker for notes"

# Check it docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running"
    exit 1
fi
print_new_line

GIT_HASH=$(git rev-parse --short HEAD)
API_IMAGE="${REGISTRY}/${API_IMAGE_NAME}:${GIT_HASH}"
UI_IMAGE="${REGISTRY}/${UI_IMAGE_NAME}:${GIT_HASH}"
log_info "Revision for build: $GIT_HASH"
log_info "API imag name will be: $API_IMAGE"
log_info "UI image name will be: $UI_IMAGE"

print_new_line

# Build the API Image
log_info "Building API image..."
docker build -t "$API_IMAGE" -f Dockerfile.api . #> /dev/null 2>&1
log_success "API image built"

# Build the UI Image
log_info "Building UI image..."
docker build -t "$UI_IMAGE" -f Dockerfile.ui2 . > /dev/null 2>&1
log_success "UI image built"

# Push the images to the registry
log_info "Pushing images to registry..."
docker push "$API_IMAGE" > /dev/null 2>&1
log_success "API image pushed"
docker push "$UI_IMAGE" > /dev/null 2>&1
log_success "UI image pushed"

log_info "Build and push to docker for budgeting completed"
print_new_line
print_new_line
echo -e "${GREEN}═══════════════════════════════════════════════════════════$1${NC}"
echo -e "${GREEN}📊 Build and Push to Docker for Notes${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════$1${NC}" 
echo -e ""
echo -e "${GREEN}  API Image: $API_IMAGE$1${NC}"
echo -e "${GREEN}  UI Image: $UI_IMAGE$1${NC}"
echo -e ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════$1${NC}"
echo -e ""
echo -e "${GREEN}Build and push to docker for budgeting completed$1${NC}"
print_new_line
