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

- `scripts/smoke.sh` — Main smoke test script
- `scripts/smoke-local.env.example` — Local environment configuration template
- `.github/workflows/smoke.yml` — GitHub Actions workflow for production testing

## Quick Start

### 1) Local

```bash
cp scripts/smoke-local.env.example scripts/smoke-local.env
# Fill in DOMAIN and three Clerk JWTs
source scripts/smoke-local.env
chmod +x scripts/smoke.sh
scripts/smoke.sh
```

### 2) Production (GitHub Actions)

Triggers on workflow_dispatch and successful Production deployments.

Set these GitHub Secrets:

- `PROD_DOMAIN`
- `PROD_CLERK_JWT_FREE`, `PROD_CLERK_JWT_PRO`, `PROD_CLERK_JWT_ENT`
- Optional: `PROD_ORG_ID_FREE`, `PROD_ORG_ID_PRO`, `PROD_ORG_ID_ENT`

## Required Environment Variables

**Required:**
- `DOMAIN`
- `CLERK_JWT_FREE`, `CLERK_JWT_PRO`, `CLERK_JWT_ENT`

**Optional:**
- `ORG_ID_FREE`, `ORG_ID_PRO`, `ORG_ID_ENT`
- Route overrides and JSON key overrides (see script header)

## Expected API Behavior

**Quota** (`/api/consolidated?action=quota/status`)
```json
// Free
{ "plan": "free", "perKeywordCap": 10, "limit": null, "remaining": null }

// Pro/Enterprise
{ "plan": "pro", "limit": 500, "used": 150, "remaining": 350 }
```

**Job Create** (`/api/jobs/create`)
```json
// Success
{ "requested": 200, "allowed": 10, "imported": 10, "jobId": "job_123" }

// Quota Exceeded (402)
{ "code": "QUOTA_EXCEEDED", "message": "Monthly quota exceeded" }
```

## Troubleshooting

- **401s** → Check JWTs; refresh Clerk tokens.
- **Wrong endpoints** → Use route overrides.
- **JSON key mismatch** → Use key overrides.
- **Free plan wrong** → Ensure org's plan is free in DB.
- **Runner cache error** → Our workflow uses monorepo-safe cache patterns.

Artifacts (`/tmp/headers.txt`, `/tmp/body.txt`) are uploaded on CI failure for fast diagnosis. 