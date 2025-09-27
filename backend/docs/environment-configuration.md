# Environment Configuration Guide

## Overview

This guide covers environment-specific configuration for the AI Content Workflow Backend, including development, staging, and production environments. The application uses environment variables for configuration management, following the [12-factor app methodology](https://12factor.net/).

## Configuration Strategy

### Environment Variables

The application reads configuration from environment variables, with fallback to `.env` files for development. Production environments should use container orchestration secrets or environment variable injection.

### Configuration Hierarchy
1. **System environment variables** (highest priority)
2. **Container/orchestration environment**
3. **`.env` files** (development only)
4. **Default values** (lowest priority)

## Environment Types

### Development Environment

#### Setup
```bash
# Copy example environment file
cp .env.example .env

# Edit with your local configuration
nano .env
```

#### Configuration File: `.env`
```bash
# Application
NODE_ENV=development
PORT=8080
APP_VERSION=1.0.0-dev

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_content_workflow
DB_USER=postgres
DB_PASS=postgres
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10

# Frontend
FRONTEND_URL=http://localhost:3000

# AI Services
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
USE_FAKE_AI=false

# Development Tools
LOG_LEVEL=debug
ENABLE_GRAPHQL_PLAYGROUND=true
ENABLE_CORS=true

# Testing
TEST_DB_NAME=ai_content_test
USE_FAKE_AI_IN_TESTS=true
```

### Staging Environment

#### Docker Compose: `docker-compose.staging.yml`
```yaml
version: '3.8'
services:
  backend:
    build: .
    environment:
      - NODE_ENV=staging
      - PORT=8080
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=ai_content_staging
      - DB_USER=${DB_USER}
      - DB_PASS=${DB_PASS}
      - DB_SSL=true
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - FRONTEND_URL=https://staging.example.com
      - LOG_LEVEL=info
      - ENABLE_GRAPHQL_PLAYGROUND=true
    ports:
      - "8080:8080"
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=ai_content_staging
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASS}
    volumes:
      - postgres_staging_data:/var/lib/postgresql/data

volumes:
  postgres_staging_data:
```

### Production Environment

#### Environment Variables (Kubernetes/Docker)
```yaml
# Kubernetes ConfigMap & Secret example
apiVersion: v1
kind: ConfigMap
metadata:
  name: ai-content-backend-config
data:
  NODE_ENV: "production"
  PORT: "8080"
  DB_HOST: "postgres-service"
  DB_PORT: "5432"
  DB_NAME: "ai_content_production"
  DB_SSL: "true"
  DB_POOL_MIN: "5"
  DB_POOL_MAX: "20"
  FRONTEND_URL: "https://app.example.com"
  LOG_LEVEL: "warn"
  ENABLE_GRAPHQL_PLAYGROUND: "false"
  ENABLE_CORS: "true"

---
apiVersion: v1
kind: Secret
metadata:
  name: ai-content-backend-secrets
type: Opaque
data:
  DB_USER: <base64-encoded-username>
  DB_PASS: <base64-encoded-password>
  OPENAI_API_KEY: <base64-encoded-key>
  ANTHROPIC_API_KEY: <base64-encoded-key>
```

## Configuration Categories

### 1. Application Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment type | `development` | No |
| `PORT` | Server port | `8080` | No |
| `APP_VERSION` | Application version | `1.0.0` | No |
| `LOG_LEVEL` | Logging level | `info` | No |

#### Valid Values
- `NODE_ENV`: `development`, `staging`, `production`
- `LOG_LEVEL`: `error`, `warn`, `info`, `debug`

### 2. Database Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | Database hostname | `localhost` | Yes |
| `DB_PORT` | Database port | `5432` | No |
| `DB_NAME` | Database name | `ai_content_workflow` | Yes |
| `DB_USER` | Database username | `postgres` | Yes |
| `DB_PASS` | Database password | - | Yes |
| `DB_SSL` | Enable SSL connection | `false` | No |
| `DB_POOL_MIN` | Min connections | `2` | No |
| `DB_POOL_MAX` | Max connections | `10` | No |

#### Connection String Format
```
postgresql://[user[:password]@][netloc][:port][/dbname][?param1=value1&...]
```

#### SSL Configuration
```bash
# Enable SSL with certificate verification
DB_SSL=true
DB_SSL_CA=/path/to/ca-certificate.pem
DB_SSL_CERT=/path/to/client-cert.pem
DB_SSL_KEY=/path/to/client-key.pem

# Disable SSL verification (not recommended for production)
DB_SSL_REJECT_UNAUTHORIZED=false
```

### 3. External Services

#### AI Service Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key | - | Yes* |
| `ANTHROPIC_API_KEY` | Anthropic API key | - | Yes* |
| `USE_FAKE_AI` | Use mock AI responses | `false` | No |
| `AI_TIMEOUT` | AI request timeout (ms) | `30000` | No |
| `AI_RATE_LIMIT` | Requests per minute | `60` | No |

*Required for AI features. Set `USE_FAKE_AI=true` for testing without keys.

#### Frontend Integration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` | Yes |
| `ENABLE_CORS` | Enable CORS | `true` | No |
| `CORS_ORIGINS` | Allowed CORS origins | `FRONTEND_URL` | No |

### 4. Security Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | JWT signing secret | - | No* |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` | No |
| `API_RATE_LIMIT` | API rate limit (req/min) | `1000` | No |
| `HELMET_CSP_ENABLED` | Enable CSP headers | `true` | No |

*Required when authentication is implemented.

### 5. Monitoring & Observability

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENABLE_METRICS` | Enable Prometheus metrics | `true` | No |
| `METRICS_PORT` | Metrics server port | `PORT` | No |
| `HEALTH_CHECK_ENABLED` | Enable health checks | `true` | No |
| `SENTRY_DSN` | Sentry error tracking | - | No |
| `NEW_RELIC_LICENSE_KEY` | New Relic APM key | - | No |

### 6. Development & Testing

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENABLE_GRAPHQL_PLAYGROUND` | GraphQL playground | `NODE_ENV !== 'production'` | No |
| `USE_FAKE_AI_IN_TESTS` | Mock AI in tests | `true` | No |
| `TEST_DB_NAME` | Test database name | `ai_content_test` | No |
| `ENABLE_REQUEST_LOGGING` | Log all requests | `NODE_ENV !== 'production'` | No |

## Environment-Specific Configurations

### Development Environment Features
```bash
# Enable development tools
ENABLE_GRAPHQL_PLAYGROUND=true
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true

# Hot reload configuration
USE_TS_NODE=true
WATCH_FILES=true

# Development database
DB_NAME=ai_content_dev
DB_SSL=false
```

### Staging Environment Features
```bash
# Staging-specific settings
NODE_ENV=staging
LOG_LEVEL=info
ENABLE_GRAPHQL_PLAYGROUND=true  # For testing

# Production-like database
DB_SSL=true
DB_POOL_MAX=15

# Staging AI keys (separate quota)
OPENAI_API_KEY=sk-staging-key
ANTHROPIC_API_KEY=sk-ant-staging-key
```

### Production Environment Features
```bash
# Production optimization
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_GRAPHQL_PLAYGROUND=false

# Production database
DB_SSL=true
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_CONNECTION_TIMEOUT=60000

# Production security
HELMET_CSP_ENABLED=true
API_RATE_LIMIT=500
JWT_SECRET=your-strong-production-secret

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-newrelic-key
```

## Configuration Validation

### Environment Validation Service
```typescript
// src/config/validation.ts
import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class EnvironmentConfig {
  @IsString()
  NODE_ENV: string = 'development';

  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  PORT: number = 8080;

  @IsString()
  DB_HOST: string = 'localhost';

  @IsString()
  DB_NAME: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  USE_FAKE_AI: boolean = false;
}
```

### Validation on Startup
```typescript
// src/config/index.ts
import { validateSync } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { EnvironmentConfig } from './validation';

export function validateEnvironment() {
  const config = plainToClass(EnvironmentConfig, process.env);
  const errors = validateSync(config);
  
  if (errors.length > 0) {
    console.error('Environment configuration errors:');
    errors.forEach(error => {
      console.error(`${error.property}: ${Object.values(error.constraints || {}).join(', ')}`);
    });
    process.exit(1);
  }
  
  return config;
}
```

## Secrets Management

### Development
Use `.env` files (never commit to version control):
```bash
# .env (not committed)
DB_PASS=local-dev-password
OPENAI_API_KEY=sk-your-dev-key
```

### Production Options

#### 1. Kubernetes Secrets
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ai-content-secrets
type: Opaque
stringData:
  database-password: "production-db-password"
  openai-api-key: "sk-production-key"
```

#### 2. AWS Systems Manager Parameter Store
```bash
# Store secrets
aws ssm put-parameter \
  --name "/ai-content/prod/database-password" \
  --value "production-password" \
  --type "SecureString"

# Retrieve in application
const password = await ssm.getParameter({
  Name: '/ai-content/prod/database-password',
  WithDecryption: true
}).promise();
```

#### 3. HashiCorp Vault
```bash
# Store secret
vault kv put secret/ai-content/prod \
  database-password="production-password" \
  openai-api-key="sk-production-key"

# Application retrieval
const secrets = await vault.read('secret/data/ai-content/prod');
```

#### 4. Azure Key Vault
```typescript
import { SecretClient } from "@azure/keyvault-secrets";

const client = new SecretClient(vaultUrl, credential);
const secret = await client.getSecret("database-password");
```

## Configuration Management Best Practices

### 1. Security
- ✅ Never commit secrets to version control
- ✅ Use environment-specific secrets
- ✅ Rotate secrets regularly
- ✅ Use least-privilege access
- ✅ Encrypt secrets at rest

### 2. Organization
- ✅ Group related configurations
- ✅ Use consistent naming conventions
- ✅ Document all variables
- ✅ Validate configuration on startup
- ✅ Use typed configuration objects

### 3. Environment Parity
- ✅ Keep environments as similar as possible
- ✅ Use same configuration structure across environments
- ✅ Automate environment setup
- ✅ Version configuration templates
- ✅ Test configuration changes in staging first

### 4. Operational
- ✅ Log configuration issues clearly
- ✅ Provide sensible defaults
- ✅ Make configuration changes auditable
- ✅ Support hot configuration reload where possible
- ✅ Monitor configuration drift

## Troubleshooting

### Common Issues

#### Database Connection Problems
```bash
# Check connection
DB_HOST=localhost DB_NAME=test npm run check-db

# Enable connection logging
DB_LOGGING=true npm start
```

#### AI Service Configuration
```bash
# Test with fake AI
USE_FAKE_AI=true npm start

# Check API key format
echo $OPENAI_API_KEY | cut -c1-10  # Should show "sk-proj-" or "sk-"
```

#### CORS Issues
```bash
# Enable all origins (development only)
CORS_ORIGINS="*" npm start

# Specific origins
CORS_ORIGINS="http://localhost:3000,https://app.example.com" npm start
```

### Configuration Debugging
```typescript
// Add to application startup
console.log('Configuration loaded:', {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  dbHost: process.env.DB_HOST,
  hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  frontendUrl: process.env.FRONTEND_URL
});
```

## Migration Guide

### From Development to Production
1. Review all environment variables
2. Update secrets management
3. Configure monitoring
4. Set appropriate resource limits
5. Enable security features
6. Test configuration in staging

### Configuration Checklist
- [ ] Database connection configured
- [ ] AI service keys configured
- [ ] CORS origins set correctly
- [ ] SSL/TLS enabled
- [ ] Monitoring enabled
- [ ] Logging level appropriate
- [ ] Secrets properly managed
- [ ] Resource limits configured

---

This configuration guide provides comprehensive coverage of environment setup for all deployment scenarios. Always test configuration changes in non-production environments first.