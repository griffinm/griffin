#!/bin/bash
set -e

# Check if we should use AWS Secrets Manager or local env
USE_AWS_SECRETS="${USE_AWS_SECRETS:-true}"

if [ "$USE_AWS_SECRETS" = "true" ]; then
    echo "🔐 Fetching secrets from AWS Secrets Manager..."
    
    # Set the AWS Secrets Manager secret name (can be overridden via env var)
    SECRET_NAME="${AWS_SECRET_NAME:-griffin/prod/env}"
    
    echo "📦 Fetching from secret: $SECRET_NAME"
    
    # Fetch all secrets at once (assuming they're stored as JSON in one secret)
    SECRETS=$(aws secretsmanager get-secret-value \
        --secret-id "$SECRET_NAME" \
        --query SecretString \
        --output text 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        # Parse individual secrets from JSON
        export DATABASE_URL=$(echo "$SECRETS" | jq -r '.DATABASE_URL // empty')
        export AWS_SECRET_ACCESS_KEY=$(echo "$SECRETS" | jq -r '.AWS_SECRET_ACCESS_KEY // empty')
        export AWS_ACCESS_KEY_ID=$(echo "$SECRETS" | jq -r '.AWS_ACCESS_KEY_ID // empty')
        export JWT_TOKEN_SECRET=$(echo "$SECRETS" | jq -r '.JWT_TOKEN_SECRET // empty')
        
        echo "✅ Secrets loaded successfully from AWS"
        
        # Verify critical secrets are present
        if [ -z "$DATABASE_URL" ]; then
            echo "❌ ERROR: DATABASE_URL not found in secrets"
            exit 1
        fi
        
        if [ -z "$JWT_TOKEN_SECRET" ]; then
            echo "❌ ERROR: JWT_TOKEN_SECRET not found in secrets"
            exit 1
        fi
        
        echo "✅ All critical secrets validated"
    else
        echo "❌ ERROR: Failed to fetch secrets from AWS Secrets Manager"
        echo "Make sure AWS credentials are configured and the secret '$SECRET_NAME' exists"
        echo "Or set USE_AWS_SECRETS=false to use local .env file"
        exit 1
    fi
else
    echo "📋 Using local environment configuration..."
    
    # Source the local .env file if it exists
    if [ -f ".env" ]; then
        echo "✅ Loading environment variables from .env file"
        export $(cat .env | grep -v '^#' | xargs)
    else
        echo "⚠️  No .env file found, using environment variables from docker-compose"
    fi
    
    # Verify critical environment variables are set
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ ERROR: DATABASE_URL environment variable is required"
        echo "Set it in docker-compose.yml or .env file"
        exit 1
    fi
    
    echo "✅ Environment configuration loaded"
fi

echo "🚀 Starting application..."
echo "   PORT: ${PORT:-8080}"
echo "   NODE_ENV: ${NODE_ENV:-production}"
echo "   TYPESENSE_HOST: ${TYPESENSE_HOST:-localhost}"

# Execute the main command (passed as arguments to this script)
exec "$@"


