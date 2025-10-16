# AWS Secrets Manager Configuration

This project uses AWS Secrets Manager to store sensitive production secrets securely.

## Architecture

### Sensitive Secrets (AWS Secrets Manager)

These secrets are stored in AWS Secrets Manager and fetched at container startup:

- `DATABASE_URL` - PostgreSQL connection string
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key for S3
- `AWS_ACCESS_KEY_ID` - AWS access key ID for S3
- `JWT_TOKEN_SECRET` - JWT signing secret

### Non-Sensitive Config (.env.prod)

Non-sensitive configuration remains in `.env.prod`:

- Application settings (PORT, NODE_ENV)
- AWS region and S3 bucket name
- Typesense configuration
- CORS origins
- Other public configuration

## Setup Instructions

### 1. Verify Secrets in AWS Secrets Manager

Your secrets are already stored in AWS Secrets Manager under the name `griffin/prod/env`.

To verify they exist:

```bash
aws secretsmanager get-secret-value \
    --secret-id griffin/prod/env \
    --region us-east-1
```

The secret should contain the following key-value pairs:

- `DATABASE_URL`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ACCESS_KEY_ID`
- `JWT_TOKEN_SECRET`

### 2. Configure AWS Credentials for Docker

You have two options:

#### Option A: Environment Variables (Local/Testing)

```bash
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=<your-access-key>
export AWS_SECRET_ACCESS_KEY=<your-secret-key>
export AWS_SECRET_NAME=griffin/prod/env
```

Then run:

```bash
./build-prod.sh
./run-prod.sh
```

#### Option B: IAM Roles (Production on AWS)

If running on EC2, ECS, or EKS:

1. Attach an IAM role to your instance/task with the policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:griffin/prod/env-*"
    }
  ]
}
```

2. Update `docker-compose.prod.yml` to remove explicit AWS credentials
3. The container will automatically use the IAM role

### 3. Create .env.prod File

Copy the template and customize:

```bash
cp env.prod.template .env.prod
```

Edit `.env.prod` with your non-sensitive configuration.

## How It Works

1. **Build Time**: The `Dockerfile.api` includes AWS CLI and the `docker-entrypoint.sh` script
2. **Runtime**: When the container starts:
   - `docker-entrypoint.sh` runs first
   - It fetches secrets from AWS Secrets Manager
   - Exports them as environment variables
   - Validates critical secrets are present
   - Starts the Node.js application

## Troubleshooting

### Container fails to start with AWS credentials error

- Verify AWS credentials are set: `aws sts get-caller-identity`
- Check the secret exists: `aws secretsmanager describe-secret --secret-id griffin/prod/env`
- Verify IAM permissions to read the secret

### "Secret not found" error

- Ensure the secret name matches: default is `griffin/prod/env`
- Check the AWS region is correct
- Use `AWS_SECRET_NAME` env var to override if your secret has a different name

### Application can't connect to database

- Verify the `DATABASE_URL` in AWS Secrets Manager is correct
- Test: `aws secretsmanager get-secret-value --secret-id griffin/prod/env`

## Security Best Practices

1. ✅ Never commit `.env.prod` to git
2. ✅ Rotate secrets regularly in AWS Secrets Manager
3. ✅ Use IAM roles instead of access keys when running on AWS
4. ✅ Apply least-privilege IAM policies
5. ✅ Enable CloudTrail logging for secrets access
6. ✅ Use different secrets for dev/staging/prod environments

## Local Development

For local development, continue using `.env` (not `.env.prod`) without AWS Secrets Manager.
The secrets integration is only active in production Docker containers.
