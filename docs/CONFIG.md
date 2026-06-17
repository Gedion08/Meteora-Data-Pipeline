# Configuration & Secrets Management

This document describes how to configure the Meteora Data Pipeline and manage secrets securely.

## Configuration

Configuration is managed through environment variables with validation using Zod schemas.

### Loading Configuration

The application automatically loads configuration from:

1. `.env` (root level, for local development)
2. `.env.{NODE_ENV}` (environment-specific overrides)
3. Environment variables (highest priority)

### Environment-Specific Configuration

#### Development (`.env.development`)

```
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_TRACING=true
DATABASE_POOL_MIN=1
DATABASE_POOL_MAX=5
```

**Use for**: Local development, testing, debugging

#### Staging (`.env.staging`)

```
NODE_ENV=staging
LOG_LEVEL=info
ENABLE_LOKI_LOGGING=true
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
```

**Use for**: Pre-production validation, integration tests

#### Production (`.env.production`)

```
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_LOKI_LOGGING=true
DATABASE_POOL_MIN=10
DATABASE_POOL_MAX=50
```

**Use for**: Production deployments

### Configuration Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NODE_ENV` | enum | development | Application environment |
| `DATABASE_URL` | string | - | PostgreSQL connection string |
| `DATABASE_POOL_MIN` | number | 2 | Min database connections |
| `DATABASE_POOL_MAX` | number | 10 | Max database connections |
| `DATA_DIR` | string | ./data | Output data directory |
| `LOG_LEVEL` | enum | info | Winston log level |
| `LOKI_URL` | string | - | Loki aggregation URL |
| `METRICS_PORT` | number | 9091 | Prometheus metrics port |
| `API_RETRY_ATTEMPTS` | number | 5 | Retry count for API calls |
| `API_RETRY_BASE_DELAY` | number | 300 | Base retry delay (ms) |
| `API_REQUEST_TIMEOUT` | number | 30000 | HTTP request timeout (ms) |
| `ENABLE_DATABASE_PERSISTENCE` | boolean | true | Persist to database |
| `ENABLE_TRACING` | boolean | true | Enable OpenTelemetry tracing |
| `ENABLE_LOKI_LOGGING` | boolean | false | Send logs to Loki |

## Secrets Management

### Local Development

Secrets are stored in `.env` (never committed):

```bash
# .env (gitignored)
DATABASE_URL="postgresql://user:password@localhost:5432/meteora"
LOKI_URL="http://localhost:3100"
```

### CI/CD (GitHub Actions)

Store secrets in GitHub Settings > Secrets and Variables > Actions:

1. Go to your repository settings
2. Click **Secrets and variables** > **Actions**
3. Create repository secrets:
   - `DATABASE_URL` — production database
   - `LOKI_URL` — log aggregation endpoint
   - `SLACK_WEBHOOK_URL` — alert notifications
   - `PAGERDUTY_KEY` — incident management

Use in workflows:

```yaml
- name: Deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: npm run pipeline
```

### Vault Integration (Recommended for Production)

For production, use HashiCorp Vault or similar secret managers:

```bash
# Fetch secrets from Vault
vault kv get secret/meteora/prod > /tmp/secrets.env
source /tmp/secrets.env
npm start
```

### Environment-Variable Precedence

Priority (highest to lowest):

1. Environment variables set in the process
2. `.env.{NODE_ENV}` file
3. `.env` file
4. Config schema defaults

### Secret Rotation

#### Rotating Database Credentials

1. Create new database user in production database
2. Update `DATABASE_URL` secret in GitHub/Vault
3. Deploy application with new credentials
4. Remove old database user
5. Monitor logs for errors

#### Rotating API Keys

1. Generate new API key in upstream service
2. Update corresponding secret
3. Deploy application
4. Revoke old key
5. Monitor metrics for issues

## Validation

Configuration is validated on startup using Zod schemas (see `src/config.ts`):

```typescript
const config = loadConfig(); // Throws error if validation fails
```

Invalid configurations will log detailed error messages:

```
Configuration validation failed:
  databaseUrl: Required
  metricsPort: Expected number, received string
```

## Audit Logging

Configuration changes should be logged:

- All sensitive config loads are logged at `debug` level
- Secrets are masked in logs (see `REDACTED`)
- Configuration errors are logged with full details

## Best Practices

✓ **DO**:
- Store secrets in `.env` or secret manager
- Use different credentials per environment
- Rotate secrets regularly
- Log configuration errors for debugging
- Use strong database passwords (16+ characters, mixed case, numbers, symbols)
- Validate configuration on startup
- Keep `.env` in `.gitignore`

✗ **DON'T**:
- Commit `.env` files to version control
- Log sensitive values in production
- Hardcode secrets in source code
- Use default passwords
- Mix secrets between environments
- Store credentials in Docker images
- Share credentials in plain text over unsecured channels

## Configuration Validation Errors

### Missing Required Variable

```
Configuration validation failed:
  databaseUrl: Required
```

**Solution**: Set `DATABASE_URL` environment variable or in `.env` file.

### Invalid Connection String

```
Configuration validation failed:
  databaseUrl: Invalid url
```

**Solution**: Ensure `DATABASE_URL` is a valid PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/db`).

### Port Out of Range

```
Configuration validation failed:
  metricsPort: Expected number between 1024 and 65535, received 80
```

**Solution**: Use a port between 1024-65535 (ports below 1024 require root).

## Troubleshooting

### Config not loading

```bash
# Check loaded environment
echo $NODE_ENV
# Verify .env file exists
ls -la .env .env.$(echo $NODE_ENV)
# Check file permissions
file .env
```

### Secrets not accessible in CI

1. Verify secret name in GitHub Actions
2. Ensure workflow file references correct secret: `${{ secrets.SECRET_NAME }}`
3. Check secret scope (repository vs organization)
4. Verify branch protection rules allow secrets

---

**Last Updated**: 2026-06-16
