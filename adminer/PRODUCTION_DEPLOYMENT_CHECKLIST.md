# 🚀 Production Deployment Checklist

## 🎯 Overview

**Complete production deployment guide** that integrates all our final polish items, security hardening, and Vercel runbook procedures.

## 📋 Pre-Deployment Checklist

### **✅ Local Validation (Run First)**

```bash
# Navigate to adminer directory
cd adminer

# 1. Run preflight checks
npm run preflight

# 2. Build and integrate SPA
npm run spa:integrate

# 3. Run micro-smoke test
npm run micro:smoke

# 4. Validate environment configuration
npm run vercel:validate
```

**Expected Results:**
- ✅ Prebuild guards pass
- ✅ SPA builds and integrates successfully
- ✅ Micro-smoke test passes
- ✅ Environment validation shows all green

### **✅ Security Hardening Verification**

- [ ] **Secret Leak Prevention**: No `process.env` values in error messages
- [ ] **Internal Endpoint Security**: Production defaults configured
- [ ] **Rate Limiting**: Internal endpoints protected against abuse
- [ ] **Security Headers**: XSS protection, content type validation
- [ ] **Environment Guards**: All prebuild checks pass

### **✅ Cross-Platform Scripts**

- [ ] **Windows Compatibility**: npm scripts work on all platforms
- [ ] **Build Commands**: `npm run build:all` works correctly
- [ ] **Development**: `npm run dev:api:env` works with environment guards
- [ ] **Validation**: `npm run micro:smoke` and `npm run vercel:validate` functional

## 🚀 Vercel Configuration

### **✅ Project Setup**

- [ ] **Project Root**: Set to `apps/api`
- [ ] **Framework**: Next.js (or "Other" for plain Node)
- [ ] **Build Command**: `npm run prebuild && npm run build`
- [ ] **Install Command**: `npm ci`
- [ ] **Include files outside root**: **Toggle ON** (for `apps/api/public`)

### **✅ Environment Variables (Preview + Production)**

#### **Clerk Authentication**
- [ ] `CLERK_PUBLISHABLE_KEY=pk_live_xxx`
- [ ] `CLERK_SECRET_KEY=sk_live_xxx`
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx`
- [ ] **Clerk Dashboard**: Add Vercel preview + production domains to allowed origins

#### **Neon PostgreSQL**
- [ ] `DATABASE_URL=postgres://USER:PASS@HOST:PORT/DB?sslmode=require`
- [ ] **Optional**: `POSTGRES_PRISMA_URL` for pooled connections

#### **Dodo Payments**
- [ ] `DODO_API_KEY=live_xxx`
- [ ] `DODO_WEBHOOK_SECRET=whsec_xxx`
- [ ] `DODO_FREE_PRODUCT_ID=plan_free_xxx`
- [ ] `DODO_PRO_PRODUCT_ID=plan_pro_xxx`
- [ ] `DODO_ENTERPRISE_PRODUCT_ID=plan_enterprise_xxx`
- [ ] `APP_BASE_URL=https://your-production-domain.com`

#### **Inngest Workflows**
- [ ] `INNGEST_EVENT_KEY=ek_live_xxx`
- [ ] `INNGEST_SIGNING_KEY=sk_live_xxx`
- [ ] `INNGEST_ENV=production`

#### **Apify Scraping**
- [ ] `APIFY_TOKEN=apify_xxx`
- [ ] `APIFY_DEFAULT_ACTOR=your-actor-id`
- [ ] `APIFY_WEBHOOK_SECRET=your-webhook-secret`

#### **Security & Production**
- [ ] `NODE_ENV=production`
- [ ] `LOG_LEVEL=info`
- [ ] `INTERNAL_ENDPOINTS_ENABLED=false` (Production security)
- [ ] `BILLING_AUTODOWNGRADE_ENABLED=true` (Enable automated billing)

## 🔗 External Service Configuration

### **✅ Dodo Webhook**
- [ ] **URL**: `https://your-domain.com/api/dodo/webhook`
- [ ] **Method**: POST / JSON
- [ ] **Verification**: HMAC SHA-256 using `DODO_WEBHOOK_SECRET`
- [ ] **Events**: `subscription.created`, `subscription.updated`, `subscription.canceled`, `invoice.paid`, `invoice.payment_failed`
- [ ] **Test**: Send test webhook and verify 200 response

### **✅ Apify Webhook**
- [ ] **URL**: `https://your-domain.com/api/apify/webhook`
- [ ] **Method**: POST / JSON
- [ ] **Security**: `X-APIFY-SECRET` header validation
- [ ] **Events**: `run finished` → emit `apify/run.completed` to Inngest
- [ ] **Test**: Send test webhook and verify proper response

### **✅ Inngest Handler**
- [ ] **URL**: `https://your-domain.com/api/inngest`
- [ ] **Status**: Handler responds correctly (not 404/500)
- [ ] **Dashboard**: Functions visible in Inngest dashboard

## 🌐 SPA Integration & Routing

### **✅ Build Process**
- [ ] **Web App Build**: `cd apps/web && npm run build` succeeds
- [ ] **SPA Integration**: `npm run spa:integrate` copies bundle to `apps/api/public`
- [ ] **File Verification**: `test -f apps/api/public/index.html` passes
- [ ] **Static Assets**: CSS, JS, and other assets copied correctly

### **✅ Routing Configuration**
- [ ] **Next.js Routing**: If using Next.js, let it handle routing naturally
- [ ] **Vercel Rewrites**: If needed, configure rewrites for SPA fallback
- [ ] **SPA Fallback**: Unknown routes serve the main app

## 🔄 GitHub Integration

### **✅ Auto-Deploy Setup**
- [ ] **Repository Connected**: GitHub repo linked to Vercel
- [ ] **Production Branch**: `main` branch triggers production deployment
- [ ] **Preview Branches**: PRs create preview deployments
- [ ] **Required Checks**: Build success required before merge

### **✅ Branch Protection**
- [ ] **Build Check**: `npm run prebuild && npm run build` must pass
- [ ] **Optional**: Lint/tests (Jest / Playwright) pass
- [ ] **Status Checks**: All required checks pass before merge

## 🧪 Post-Deployment Validation

### **✅ Smoke Tests (Run After Deployment)**

```bash
# 1. Health Check
curl -sS https://www.adminer.online/api/consolidated?action=health | jq .

# 2. Authentication Gate (Should Not Leak)
curl -si https://adminer.online/api/consolidated?action=quota/status

# 3. Dodo Webhook Verification
curl -si -X POST https://www.adminer.online/api/dodo/webhook \
  -H 'Content-Type: application/json' \
  -H 'X-Dodo-Signature: t=..., v1=...' \
  --data '{"type":"subscription.updated","data":{...}}'

# 4. Inngest Handler Status
curl -sS https://adminer.online/api/inngest | head -5

# 5. SPA Routes
# Visit /dashboard in browser
```

**Expected Results:**
- ✅ Health endpoint: 200 OK
- ✅ Auth gate: 401/403 (not 500)
- ✅ Webhook: 400/401/422 (rejected), NOT 500
- ✅ Inngest: Friendly message or 405 for GET
- ✅ SPA: Dashboard renders, sign-in works, pricing modal functional

### **✅ Production Validation Commands**

```bash
# Use our npm scripts for quick validation
npm run health              # Quick health check
npm run billing             # Billing system status
npm run micro:smoke         # 30-second smoke test
npm run vercel:validate     # Environment validation
```

## 📊 Monitoring & Observability

### **✅ Vercel Monitoring**
- [ ] **Function Logs**: Accessible at Project → Deployments → "View Functions Logs"
- [ ] **Error Alerts**: Configured for build failure or function errors
- [ ] **Performance Metrics**: Function execution times and cold start metrics
- [ ] **Build Logs**: Prebuild guards show clear banners

### **✅ Inngest Observability**
- [ ] **Dashboard Access**: Function runs, retries, dead-letters visible
- [ ] **Automated Billing**: Downgrade jobs running successfully
- [ ] **Function Status**: All functions healthy and responding

### **✅ External Service Monitoring**
- [ ] **Apify Dashboard**: Actor run history and success rates
- [ ] **Dodo Dashboard**: Webhook delivery status
- [ ] **Neon Dashboard**: Database connection and performance

## 🚨 Rollback & Safety

### **✅ Emergency Procedures**
- [ ] **ROLLBACK.md**: Emergency procedures documented and accessible
- [ ] **Feature Flags**: Emergency controls available
- [ ] **Instant Rollback**: Vercel "Promote previous deployment" ready
- [ ] **Database Safety**: Neon branches for migrations

### **✅ Feature Flag Controls**
```bash
# Emergency disable features
NEXT_PUBLIC_ENABLE_PRICING_MODAL=false
BILLING_AUTODOWNGRADE_ENABLED=false
INTERNAL_ENDPOINTS_ENABLED=false
```

## 🎯 Final "Green Light" Checklist

### **✅ Vercel Configuration**
- [ ] Project root = `apps/api`
- [ ] `npm run prebuild && npm run build` passes in Vercel
- [ ] Include files outside root = ON
- [ ] Build command includes prebuild guards

### **✅ Environment Variables**
- [ ] All env vars set in Preview + Production scopes
- [ ] Clerk allowed origins include both preview & prod domains
- [ ] Database URLs point to production Neon instance
- [ ] Dodo keys are live (not test) keys
- [ ] Inngest keys configured for production

### **✅ Webhook Configuration**
- [ ] Dodo webhook configured and verified
- [ ] Apify webhook configured with secret header
- [ ] Inngest handler reachable at `/api/inngest`
- [ ] Webhook endpoints return proper HTTP status codes

### **✅ SPA Integration**
- [ ] Web app builds successfully
- [ ] SPA bundle copied to `apps/api/public`
- [ ] `/dashboard` renders correctly
- [ ] Sign-in modal works with Clerk
- [ ] QuotaBadge → Pricing modal → hosted checkout flow OK

### **✅ Production Validation**
- [ ] Health endpoint returns 200
- [ ] Auth-guard endpoints return 401/403 (not 500)
- [ ] Webhook validation rejects invalid signatures
- [ ] SPA routes accessible and functional
- [ ] Logs clean after first job run

### **✅ Monitoring & Safety**
- [ ] Vercel function logs accessible
- [ ] Inngest dashboard shows function runs
- [ ] Apify webhook delivery confirmed
- [ ] Error alerts configured
- [ ] Rollback procedures documented

## 🚀 Deployment Commands Summary

### **Pre-Deployment**
```bash
cd adminer
npm run preflight          # Run prebuild guards
npm run spa:integrate      # Build and integrate SPA
npm run micro:smoke        # Quick validation
npm run vercel:validate    # Environment validation
```

### **Post-Deployment**
```bash
# Health checks
npm run health
npm run billing
npm run micro:smoke

# Emergency procedures
# Check ROLLBACK.md for detailed procedures
```

## 🎉 Success Criteria

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

## 🎯 Ready to Deploy!

Your Adminer application is now configured for **bulletproof production deployment** with:
- **Comprehensive security** with zero secret leak potential
- **Production-ready monitoring** with Vercel, Inngest, and Apify
- **Instant rollback capabilities** for any deployment issues
- **Automated validation** with prebuild guards and smoke tests
- **Enterprise-grade webhook security** for all external integrations

**Next step**: Deploy to Vercel and run the smoke tests! 🚀

---

## 📚 Related Documentation

- **VERCEL_PRODUCTION_RUNBOOK.md**: Detailed Vercel configuration guide
- **ROLLBACK.md**: Emergency procedures and rollback guide
- **FINAL_POLISH_IMPLEMENTATION.md**: Security hardening and final polish details
- **.cursor/scratchpad.md**: Project status and strategic planning 