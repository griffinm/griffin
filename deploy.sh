#!/bin/bash
set -e 

./create-api-secret.sh
./build-and-push-k8s.sh
./deploy-k8s.sh
