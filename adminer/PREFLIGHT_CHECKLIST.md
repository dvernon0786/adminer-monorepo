# 🚦 Pre-flight Checklist: Production Deployment

## Overview
This checklist ensures your Adminer application is ready for production deployment with the new ads-based quota system.

## ✅ **Environment Variables (Vercel → Project → Settings → Env)**

### Core
- [ ] `CLERK_PUBLISHABLE_KEY` - Production Clerk key
- [ ] `CLERK_SECRET_KEY` - Production Clerk secret
- [ ] `DATABASE_URL` - Neon PostgreSQL connection string

### Payments
- [ ] `DODO_SECRET` - Production Dodo secret
- [ ] `DODO_WEBHOOK_SECRET` - Production webhook secret

### Inngest
- [ ] `INNGEST_EVENT_KEY` - Production server key
- [ ] `INNGEST_SIGNING_KEY` - Production signing key

### Apify
- [ ] `APIFY_TOKEN` - Production Apify token
- [ ] `APIFY_ACTOR_ID` - Production actor ID
- [ ] `WEBHOOK_SECRET_APIFY` - Custom webhook secret for verification

### AI
- [ ] `OPENAI_API_KEY` - Production OpenAI key
- [ ] `GEMINI_API_KEY` - Production Gemini key

### Security / Misc
- [ ] `NEXT_PUBLIC_APP_URL` - Set to `https://www.adminer.online`

## 🗄️ **Database Migrations**

### Confirm Drizzle Migrations Include:
- [ ] **0015_quota_ads_by_import.sql** - New ads-based quota system
- [ ] **0014_jobs_analysis_columns.sql** - AI analysis columns
- [ ] **0013_jobs_enhanced.sql** - Enhanced job schema
- [ ] **0012_quota_tracking.sql** - Quota tracking fields
- [ ] **0011_org_plan.sql** - Organization plans
- [ ] **0010_webhooks.sql** - Webhook events

### Migration Steps:
1. **Local Test**: Run migrations locally first
2. **Production**: Deploy and run migrations on production database
3. **Verify**: Check that new fields exist in jobs table

```bash
# Local migration test
cd adminer/apps/api
npm run db:migrate

# Production (after deployment)
# Run via your database management tool or CLI
```

## 🧪 **Smoke Tests**

### Run Smoke Tests:
```bash
# Make executable
chmod +x scripts/smoke.sh

# Run locally
./scripts/smoke.sh http://localhost:3000

# Run against production
./scripts/smoke.sh https://www.adminer.online
```

### Expected Results:
1. **Health**: 200 + `{"status":"healthy"}`
2. **Quota (unauth)**: 401 (unauthorized)
3. **Quota (auth)**: 200 with quota info
4. **Dodo webhook**: 400/401 (no signature)
5. **Jobs list**: 200 (empty page ok)
6. **Start job**: 202/200 (job created)
7. **Apify webhook**: 401 (bad signature)
8. **Quota limits**: 402 for exceeded quota

## 🤖 **GitHub Actions: Automated Smoke Testing**

### Workflow Setup:
- [ ] **File Created**: `.github/workflows/smoke-prod.yml`
- [ ] **Secret Added**: `CLERK_TEST_BEARER` in repository secrets
- [ ] **Auto-trigger**: Runs on every production deployment
- [ ] **Manual Trigger**: Can be run manually via GitHub UI

### Workflow Features:
- ✅ **Automatic**: Triggers on Vercel deployment success
- ✅ **Health Check**: Waits for endpoint to be ready
- ✅ **Comprehensive**: All 8 smoke tests
- ✅ **Artifacts**: Logs and results saved
- ✅ **Summary**: Results posted to GitHub

## 🧪 **Integration Tests (Manual/CLI)**

### 1. Quota 402 Path Test
```bash
# Set CLERK_TOKEN environment variable
export CLERK_TOKEN="your_bearer_token"

# Test quota limits (Free plan with 10 ads limit)
./scripts/test-quota-402.sh https://www.adminer.online
```

**Expected**: Last call returns HTTP 402 with upgrade link

### 2. Apify End-to-End Test
```bash
# Test complete job lifecycle
./scripts/test-apify-e2e.sh https://www.adminer.online
```

**Expected Flow**: Job → queued → running → completed

**Verify**:
- [ ] `rawData` populated
- [ ] Analysis columns filled
- [ ] Content type detection working
- [ ] Video handling (skipReason for large files)

### 3. AI Analysis Test
```bash
# Test different content types
./scripts/test-ai-analysis.sh https://www.adminer.online
```

**Expected Results**:
- [ ] **Text-only**: `contentType=text`, text analysis complete
- [ ] **Image+Text**: `contentType=image+text`, image analysis complete
- [ ] **Video+Text**: `contentType=text+video`, video analysis complete

## 🧱 **SPA Integration Scripts**

### Scripts Created:
- [ ] **`copy-spa.mjs`**: Copies web build to API public
- [ ] **`guard-spa.mjs`**: Verifies SPA assets present

### Package.json Updates:
- [ ] **`prevercel`**: Runs before Vercel deployment
- [ ] **`vercel-build`**: Builds web app and copies to API

### Usage:
```bash
# Manual SPA integration
cd adminer/apps/api
npm run vercel-build

# Verify SPA assets
node scripts/guard-spa.mjs
```

## 🔐 **Webhook Verification (Apify)**

### Apify Actor Settings → Webhooks:
- [ ] **Run Started**: `POST https://www.adminer.online/api/webhooks/apify-start`
- [ ] **Run Succeeded/Failed**: `POST https://www.adminer.online/api/webhooks/apify`

### Required Header:
- [ ] **`X-Webhook-Signature`**: `sha256=HMAC_BODY_WITH_WEBHOOK_SECRET_APIFY`

### Implementation:
- [ ] **Signature Verification**: HMAC SHA256 with `WEBHOOK_SECRET_APIFY`
- [ ] **Security**: Returns 401 if verification fails
- [ ] **Logging**: Minimal fields logged on success

## 🧭 **Inngest Routing Verification**

### `/api/inngest` Should Register:
- [ ] **`jobStarted`** - Job creation events
- [ ] **`apifyRunCompleted`** - Apify run success
- [ ] **`apifyRunStarted`** - Apify run start
- [ ] **`downgradeNightly`** - Nightly downgrade checks
- [ ] **`downgradeCanceledOrgs`** - Canceled org cleanup

### Test Event Emission:
```bash
# Emit test events (optional)
cd adminer/apps/api
node scripts/emit-job.ts
```

## 🚀 **Deployment Steps**

### 1. Pre-deployment
- [ ] All environment variables set in Vercel
- [ ] Database migrations tested locally
- [ ] Smoke tests pass locally
- [ ] SPA integration scripts working

### 2. Deploy to Production
- [ ] Push to main branch
- [ ] Vercel automatically deploys
- [ ] Database migrations run
- [ ] SPA assets copied

### 3. Post-deployment Verification
- [ ] GitHub Actions smoke tests run automatically
- [ ] Manual smoke tests pass
- [ ] Integration tests pass
- [ ] Webhook verification working
- [ ] AI analysis functioning

## 🔍 **Troubleshooting**

### Common Issues:
1. **Environment Variables**: Check Vercel project settings
2. **Database**: Verify migration success
3. **SPA Assets**: Ensure web build completed
4. **Webhooks**: Check signature verification
5. **Quota System**: Verify new fields populated

### Debug Commands:
```bash
# Check environment
curl -i https://www.adminer.online/api/consolidated?action=health

# Verify quota system
curl -H "Authorization: Bearer $TOKEN" \
  https://www.adminer.online/api/consolidated?action=quota/status

# Test job creation
curl -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"test","limit":5}' \
  https://www.adminer.online/api/jobs/start
```

## 📊 **Success Criteria**

### ✅ **Ready for Production When**:
- [ ] All environment variables configured
- [ ] Database migrations successful
- [ ] Smoke tests passing (8/8)
- [ ] Integration tests working
- [ ] SPA integration complete
- [ ] Webhook verification active
- [ ] Inngest functions registered
- [ ] GitHub Actions workflow active

### 🎯 **Expected Results**:
- **Quota System**: Ads-based quota working correctly
- **Job Processing**: Complete lifecycle from creation to analysis
- **AI Analysis**: Text, image, and video analysis functioning
- **Security**: Webhook verification and authentication working
- **Monitoring**: Automated smoke testing on deployments

---

**Status**: 🚦 **PRE-FLIGHT CHECKLIST READY** - Complete deployment preparation guide
**Last Updated**: January 2025
**Next Action**: Run through checklist items before production deployment 