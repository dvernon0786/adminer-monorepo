# 🚀 Vercel Production Deployment Runbook

## 🎯 Overview

**One-page production deployment guide** for your Adminer monorepo with:
- Root monorepo structure
- API in `apps/api` 
- SPA built into `apps/api/public`
- Clerk-protected API endpoints
- Dodo webhook integration
- Inngest background jobs
- Apify scraping callbacks
- Neon PostgreSQL database

## 🚀 Quick Start: Production Deployment

### **0) Pre-flight (Local Validation)**

```bash
# Navigate to API directory
cd adminer/apps/api

# Run prebuild guards and build
npm run prebuild && npm run build

# Build web app and integrate with API (from repo root)
cd adminer/apps/web && npm run build

# Copy SPA bundle to API public directory
rsync -av --delete dist/ ../api/public/

# Verify integration
test -f ../api/public/index.html  # Should exist
```

### **1) Create Vercel Project (Monorepo)**

#### **Project Settings**
- **Project Root**: `apps/api`
- **Framework Preset**: Next.js (or "Other" if plain Node pages router)
- **Build Command**: `npm run prebuild && npm run build`
- **Install Command**: `npm ci`
- **Output Directory**: `.vercel/output` (Next.js default)
- **Include files outside root**: **Toggle ON** (so `apps/api/public` exists at build time)

#### **Alternative: vercel.json Configuration**
```json
{
  "buildCommand": "cd apps/api && npm run prebuild && npm run build",
  "installCommand": "cd apps/api && npm ci",
  "framework": "nextjs",
  "rootDirectory": "apps/api"
}
```

## 🔐 Environment Variables

### **Vercel → Project → Settings → Environment Variables**

Set for **Preview** and **Production** scopes:

#### **Clerk Authentication**
```bash
CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
CLERK_JWT_ISSUER=https://YOUR-CLERK-DOMAIN
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
```

**Important**: Add your Vercel preview domain + production domain to Clerk allowed origins.

#### **Neon PostgreSQL**
```bash
DATABASE_URL=postgres://USER:PASS@HOST:PORT/DB?sslmode=require
# Optional: Pooled connection
POSTGRES_PRISMA_URL=postgres://USER:PASS@HOST:PORT/DB?sslmode=require&pgbouncer=true
```

#### **Dodo Payments**
```bash
DODO_API_KEY=live_xxx
DODO_WEBHOOK_SECRET=whsec_xxx
DODO_FREE_PRODUCT_ID=plan_free_xxx
DODO_PRO_PRODUCT_ID=plan_pro_xxx
DODO_ENTERPRISE_PRODUCT_ID=plan_enterprise_xxx
APP_BASE_URL=https://your-production-domain.com
```

#### **Inngest Workflows**
```bash
INNGEST_EVENT_KEY=ek_live_xxx
INNGEST_SIGNING_KEY=sk_live_xxx
INNGEST_ENV=production
```

#### **Apify Scraping**
```bash
APIFY_TOKEN=apify_xxx
APIFY_DEFAULT_ACTOR=your-actor-id
APIFY_WEBHOOK_SECRET=your-webhook-secret
```

#### **Security & Misc**
```bash
NODE_ENV=production
LOG_LEVEL=info
INTERNAL_ENDPOINTS_ENABLED=false  # Production security
```

## 🔗 Webhooks & External Integrations

### **Dodo Webhook**
- **URL**: `https://your-domain.com/api/dodo/webhook`
- **Method**: POST / JSON
- **Verification**: HMAC SHA-256 using `DODO_WEBHOOK_SECRET`
- **Events**: `subscription.created`, `subscription.updated`, `subscription.canceled`, `invoice.paid`, `invoice.payment_failed`
- **Expected Behavior**: Update org plan in DB, emit quota/reset if relevant

### **Apify Webhook**
- **URL**: `https://your-domain.com/api/apify/webhook`
- **Method**: POST / JSON
- **Events**: `run finished` → emit `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           apify/run.completed` to Inngest
- **Security**: Add shared secret header `X-APIFY-SECRET=<random>`, store as `APIFY_WEBHOOK_SECRET` and verify

### **Inngest Handler**
- **URL**: `https://your-domain.com/api/inngest`
- **Ensure**: Vercel routing points `/api/inngest` to your Inngest handler
- **Status**: If using official adapter, you're good to go

## 🌐 Routing & SPA Integration

### **SPA Bundle Integration**
```bash
# Build web app
cd adminer/apps/web && npm run build

# Copy to API public directory
rsync -av --delete dist/ ../api/public/

# Verify integration
test -f ../api/public/index.html
```

### **Vercel Routing (Optional but Recommended)**

If serving client SPA from `apps/api/public` and want all unknown routes to land on it:

```json
{
  "rewrites": [
    { "source": "/dashboard", "destination": "/index.html" },
    { "source": "/dashboard/:path*", "destination": "/index.html" }
  ]
}
```

**Note**: If using Next.js pages or app router, let Next handle routing naturally.

## 🔄 GitHub → Vercel Auto-deploy

### **Repository Connection**
1. Connect GitHub repo to Vercel
2. **Production branch**: `main`
3. **Preview branches**: PRs

### **Required Checks Protection**
Add required checks to protect production:
- ✅ Build succeeds
- ✅ (Optional) Lint/tests (Jest / Playwright)

## 🧪 Post-Deploy Smoke Tests (Production)

### **1. Health Check**
```bash
curl -sS https://www.adminer.online/api/consolidated?action=health | jq .
# Expected: 200 OK with health status
```

### **2. Authentication Gate (Should Not Leak)**
```bash
curl -si https://adminer.online/api/consolidated?action=quota/status
# Expected: 401/403 (Clerk middleware) or structured auth error
```

### **3. Dodo Webhook Verification (Dry Run)**
```bash
# Example: send signed payload (use your signing util locally)
curl -si -X POST https://www.adminer.online/api/dodo/webhook \
  -H 'Content-Type: application/json' \
  -H 'X-Dodo-Signature: t=..., v1=...' \
  --data '{"type":"subscription.updated","data":{...}}'
# Expected: 400/401/422 (rejected), NOT 500 (crash)
```

### **4. Inngest Handler Status**
```bash
curl -sS https://adminer.online/api/inngest | head -5
# Expected: Friendly message or 405 for GET (most adapters)
```

### **5. SPA Routes & User Experience**
- Visit `/dashboard` (unauthenticated → sign-in hero)
- Sign in with Clerk → form + tabs + table visible
- QuotaBadge → opens Pricing modal → CTA hits Dodo hosted checkout

## 📊 Monitoring & Observability

### **Vercel Monitoring**
- **Logs**: Project → Deployments → "View Functions Logs"
- **Alerts**: Add Slack/Email on build failure or function errors
- **Performance**: Function execution times and cold start metrics

### **Inngest Observability**
- **Dashboard**: Function runs, retries, dead-letters
- **Functions**: Monitor automated billing downgrade jobs
- **Retries**: Check for failed function executions

### **Apify Monitoring**
- **Dashboard**: Actor run history and success rates
- **Webhooks**: Delivery status and retry attempts
- **Performance**: Run completion times and resource usage

### **Database Monitoring**
- **Neon Dashboard**: Connection pool status and query performance
- **Migrations**: Track schema changes and rollback capabilities
- **Backups**: Verify automated backup schedules

## 🚨 Rollback & Safety

### **Instant Rollback**
- **Vercel**: Production → "Promote previous deployment"
- **Time**: 2-5 minutes to restore previous working version

### **Feature Flags**
```bash
# Emergency disable pricing features
NEXT_PUBLIC_ENABLE_PRICING_MODAL=false

# Disable automated billing
BILLING_AUTODOWNGRADE_ENABLED=false

# Disable internal endpoints
INTERNAL_ENDPOINTS_ENABLED=false
```

### **Database Safety**
- **Neon Branches**: Use for migrations, merge after verification
- **Rollback**: Point to previous database state if needed
- **Backups**: Automated daily backups with point-in-time recovery

## 🎨 Nice-to-Haves (Quick Wins)

### **Security Headers**
```javascript
// apps/api/next.config.js
module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { domains: [] },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=()" }
        ],
      },
    ];
  },
};
```

### **Robots & SEO**
```txt
# apps/api/public/robots.txt
User-agent: *
Disallow: /api/
Allow: /
```

### **Error Reporting**
- **Sentry**: Minimal error reporting for serverless functions
- **Logtail**: Structured logging and error aggregation
- **Runtime Diagnostics**: `/api/admin/diagnostics` endpoint for health checks

## 📋 Final "Green Light" Checklist

### **Vercel Configuration** ✅
- [ ] Project root = `apps/api`
- [ ] `npm run prebuild && npm run build` passes in Vercel
- [ ] Include files outside root = ON
- [ ] Build command includes prebuild guards

### **Environment Variables** ✅
- [ ] All env vars set in Preview + Production scopes
- [ ] Clerk allowed origins include both preview & prod domains
- [ ] Database URLs point to production Neon instance
- [ ] Dodo keys are live (not test) keys
- [ ] Inngest keys configured for production

### **Webhook Configuration** ✅
- [ ] Dodo webhook configured and verified
- [ ] Apify webhook configured with secret header
- [ ] Inngest handler reachable at `/api/inngest`
- [ ] Webhook endpoints return proper HTTP status codes

### **SPA Integration** ✅
- [ ] Web app builds successfully
- [ ] SPA bundle copied to `apps/api/public`
- [ ] `/dashboard` renders correctly
- [ ] Sign-in modal works with Clerk
- [ ] QuotaBadge → Pricing modal → hosted checkout flow OK

### **Production Validation** ✅
- [ ] Health endpoint returns 200
- [ ] Auth-guard endpoints return 401/403 (not 500)
- [ ] Webhook validation rejects invalid signatures
- [ ] SPA routes accessible and functional
- [ ] Logs clean after first job run

### **Monitoring & Safety** ✅
- [ ] Vercel function logs accessible
- [ ] Inngest dashboard shows function runs
- [ ] Apify webhook delivery confirmed
- [ ] Error alerts configured
- [ ] Rollback procedures documented

## 🚀 Deployment Commands

### **Local Preflight**
```bash
cd adminer
npm run preflight          # Run prebuild guards
npm run build:all          # Build API and web app
npm run micro:smoke        # Quick validation
```

### **Production Validation**
```bash
# Health check
npm run health

# Billing system status
npm run billing

# Environment validation
npm run vercel:validate

# Post-deploy smoke test
npm run micro:smoke
```

### **Emergency Procedures**
```bash
# Check ROLLBACK.md for detailed procedures
# Quick rollback: Vercel → Promote previous deployment
# Feature flags: Set environment variables to disable features
```

## 🎯 Success Metrics

### **Deployment Success**
- ✅ **Build Time**: < 5 minutes
- ✅ **Cold Start**: < 2 seconds
- ✅ **Health Check**: 200 OK
- ✅ **Authentication**: Clerk integration working
- ✅ **Webhooks**: External services responding

### **Performance Targets**
- ✅ **API Response**: < 500ms for authenticated requests
- ✅ **SPA Load**: < 3 seconds for dashboard
- ✅ **Webhook Processing**: < 2 seconds for Dodo/Apify
- ✅ **Background Jobs**: Inngest functions completing successfully

### **Security Validation**
- ✅ **No Secret Leaks**: Environment variables properly masked
- ✅ **Authentication Gates**: Protected endpoints return 401/403
- ✅ **Webhook Security**: Invalid signatures rejected
- ✅ **Internal Endpoints**: Disabled in production by default

---

## 🎉 Ready to Ship!

Your Adminer application is now configured for **bulletproof production deployment** with:
- **Comprehensive security** with zero secret leak potential
- **Production-ready monitoring** with Vercel, Inngest, and Apify
- **Instant rollback capabilities** for any deployment issues
- **Automated validation** with prebuild guards and smoke tests
- **Enterprise-grade webhook security** for all external integrations

**Next step**: Deploy to Vercel and run the smoke tests! 🚀 