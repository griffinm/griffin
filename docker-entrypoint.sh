#!/bin/bash
set -e

echo "🔐 Fetching secrets from AWS Secrets Manager..."

# Function to get secret from AWS Secrets Manager
get_secret() {
    local secret_name=$1
    local secret_key=$2
    
    # Fetch the secret value
    local secret_value=$(aws secretsmanager get-secret-value \
        --secret-id "$secret_name" \
        --query SecretString \
        --output text 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        # If secret_key is provided, parse JSON, otherwise use entire value
        if [ -n "$secret_key" ]; then
            echo "$secret_value" | jq -r ".$secret_key"
        else
            echo "$secret_value"
        fi
    else
        echo ""
    fi
}

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
    
    echo "✅ Secrets loaded successfully"
    
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
    exit 1
fi

echo "🚀 Starting application..."

# Execute the main command (passed as arguments to this script)
exec "$@"

