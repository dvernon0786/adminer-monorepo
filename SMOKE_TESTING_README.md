# Smoke Testing System

This project includes a comprehensive smoke testing system to verify end-to-end functionality across different subscription plans.

## Overview

The smoke tests verify:
- **SPA Availability**: Root and dashboard routes serve the Single Page Application
- **Health Endpoint**: API health check returns `healthy` status
- **Authentication**: Protected endpoints require valid JWT tokens
- **Quota System**: Different plans (Free, Pro, Enterprise) have correct quota behavior
- **Job Creation**: Plan-specific limits and quota enforcement
- **Webhook Endpoints**: Dodo webhook endpoint exists and responds

## Files

- `scripts/smoke.sh` - Main smoke test script
- `scripts/smoke-local.env.example` - Local environment configuration template
- `.github/workflows/smoke.yml` - GitHub Actions workflow for production testing

## Quick Start

### 1. Local Testing

```bash
# Copy and configure environment
cp scripts/smoke-local.env.example scripts/smoke-local.env

# Edit scripts/smoke-local.env and add your Clerk JWT tokens
# DOMAIN=https://www.adminer.online
# CLERK_JWT_FREE=eyJ...
# CLERK_JWT_PRO=eyJ...
# CLERK_JWT_ENT=eyJ...

# Run tests
source scripts/smoke-local.env && scripts/smoke.sh
```

### 2. Production Testing

The GitHub Actions workflow automatically runs on:
- Manual trigger (`workflow_dispatch`)
- Successful production deployments

## Required Environment Variables

### Required
- `DOMAIN` - Your application domain (e.g., `https://www.adminer.online`)
- `CLERK_JWT_FREE` - JWT token for an org on Free plan
- `CLERK_JWT_PRO` - JWT token for an org on Pro plan
- `CLERK_JWT_ENT` - JWT token for an org on Enterprise plan

### Optional
- `ORG_ID_FREE`, `ORG_ID_PRO`, `ORG_ID_ENT` - Org IDs for logging
- Route overrides (see Configuration section)
- JSON key overrides (see Configuration section)

## Configuration

### Route Overrides

If your API routes differ from defaults, you can override them:

```bash
export ROUTE_HEALTH="/api/health"
export ROUTE_QUOTA="/api/quota/status"
export ROUTE_JOBS_CREATE="/api/jobs"
```

### JSON Key Overrides

If your API response structure differs, you can override JSON keys:

```bash
export KEY_ALLOWED="maxAllowed"
export KEY_REQ="limit"
export KEY_IMPORTED="adsImported"
```

## Test Coverage

### 1. SPA & Routes
- ✅ Root serves SPA with proper HTML markers
- ✅ Dashboard route accessible (may redirect for SPA)

### 2. Health Check
- ✅ `/api/consolidated?action=health` returns `{status: "healthy"}`

### 3. Authentication
- ✅ Unauthenticated requests to protected endpoints return 401
- ✅ Authenticated requests with valid JWT tokens succeed

### 4. Quota System
- ✅ **Free Plan**: `perKeywordCap=10`, no monthly limits
- ✅ **Pro Plan**: Numeric monthly limits and usage tracking
- ✅ **Enterprise Plan**: Numeric monthly limits

### 5. Job Creation
- ✅ **Free**: Clamps requests to ≤10 ads per keyword
- ✅ **Pro**: Respects monthly remaining quota (200 or 402)
- ✅ **Enterprise**: Large requests allowed unless exhausted

### 6. Webhook
- ✅ Dodo webhook endpoint exists and responds (not 404)

## Expected API Behavior

### Quota Endpoint (`/api/consolidated?action=quota/status`)

```json
// Free Plan
{
  "plan": "free",
  "perKeywordCap": 10,
  "limit": null,
  "remaining": null
}

// Pro/Enterprise Plan
{
  "plan": "pro",
  "limit": 1000,
  "used": 150,
  "remaining": 850
}
```

### Job Creation (`/api/jobs/create`)

```json
// Success Response
{
  "requested": 200,
  "allowed": 10,
  "imported": 10,
  "jobId": "job_123"
}

// Quota Exceeded (402)
{
  "code": "QUOTA_EXCEEDED",
  "message": "Monthly quota exceeded"
}
```

## Troubleshooting

### Common Issues

1. **JWT Token Expired**: Refresh your Clerk session tokens
2. **Wrong Endpoints**: Use route overrides if your API differs
3. **JSON Key Mismatch**: Use key overrides for different response structures
4. **Quota Mismatch**: Ensure test orgs are on correct plans

### Debug Mode

The script creates temporary files for debugging:
- `/tmp/headers.txt` - HTTP response headers
- `/tmp/body.txt` - HTTP response body

### GitHub Actions Artifacts

On failure, the workflow uploads logs as artifacts for debugging.

## Integration

### CI/CD Pipeline

The smoke tests run automatically after production deployments to ensure:
- No regressions in core functionality
- Quota system works correctly
- Authentication flows function
- SPA serves properly

### Local Development

Run smoke tests locally before deploying to catch issues early:
```bash
# Test against staging
export DOMAIN="https://staging.adminer.online"
scripts/smoke.sh

# Test against local
export DOMAIN="http://localhost:3000"
scripts/smoke.sh
```

## Security Notes

- JWT tokens should have minimal required permissions
- Consider using CI-scoped tokens for production testing
- Tokens should be rotated regularly
- Never commit actual JWT tokens to version control

## Contributing

When adding new features:
1. Update smoke tests to cover new functionality
2. Add new environment variables if needed
3. Update this README with new test coverage
4. Ensure tests pass locally before pushing 