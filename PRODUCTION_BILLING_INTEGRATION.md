# 🚀 Production Billing System Integration Guide

## 🎯 Overview

**Complete production-grade billing system** that integrates Dodo payments, webhooks, and automated lifecycle management. This guide covers the final integration steps to make your billing system production-ready.

## 🔧 **Components Implemented**

### **1. Database Schema & Migrations**
- ✅ **0010_webhooks.sql**: Webhook events table for idempotency
- ✅ **0011_org_plan.sql**: Organization plan and external customer ID fields
- ✅ **Updated schema.ts**: Production-ready database schema

### **2. Production-Grade Dodo Webhook Handler**
- ✅ **File**: `apps/api/pages/api/dodo/webhook.ts`
- ✅ **Features**: HMAC verification, idempotency, subscription lifecycle management
- ✅ **Events**: `subscription.activated`, `subscription.updated`, `subscription.canceled`, `subscription.past_due`

### **3. One-Click Upgrade Endpoint**
- ✅ **File**: `apps/api/pages/api/billing/upgrade.ts`
- ✅ **Features**: Clerk authentication, Dodo API integration, hosted checkout URLs
- ✅ **Plans**: Pro and Enterprise upgrade support

### **4. Quota Endpoint with 402 Status**
- ✅ **File**: `apps/api/pages/api/consolidated.ts` (updated)
- ✅ **Features**: Quota exceeded detection, 402 Payment Required, upgrade hints
- ✅ **Integration**: Seamless upgrade flow from quota exceeded state

### **5. Clerk Protection Middleware**
- ✅ **File**: `apps/api/middleware.ts`
- ✅ **Features**: API route protection, webhook exclusion, SPA asset handling
- ✅ **Security**: Authentication required for all API endpoints except webhooks

### **6. Inngest Nightly Downgrade Function**
- ✅ **File**: `apps/api/src/inngest/functions/downgradeCanceledOrgs.ts`
- ✅ **Features**: Daily cron job, automated billing lifecycle, feature flag control
- ✅ **Schedule**: Runs at 02:00 UTC daily

## 🚀 **Deployment Steps**

### **Step 1: Database Migration**
```bash
# Run the new migrations
cd adminer/apps/api
npm run db:migrate

# Or manually execute the SQL files:
# - 0010_webhooks.sql
# - 0011_org_plan.sql
```

### **Step 2: Environment Variables**
Add these to your Vercel environment:

```bash
# Dodo Webhook (Production)
DODO_WEBHOOK_SECRET=whsec_your_production_secret

# Dodo Products (Production)
DODO_FREE_PRODUCT_ID=prod_free_xxx
DODO_PRO_PRODUCT_ID=prod_pro_xxx
DODO_ENT_PRODUCT_ID=prod_enterprise_xxx

# Dodo API (Production)
DODO_API_KEY=live_your_production_key
DODO_API_BASE=https://api.dodopayments.com

# Billing Automation
BILLING_AUTODOWNGRADE_ENABLED=true
```

### **Step 3: Dodo Dashboard Configuration**
1. **Webhook URL**: `https://your-domain.com/api/dodo/webhook`
2. **Webhook Secret**: Use the same value as `DODO_WEBHOOK_SECRET`
3. **Events**: Enable `subscription.activated`, `subscription.updated`, `subscription.canceled`, `subscription.past_due`

### **Step 4: Test the Integration**
```bash
# Test webhook signature verification
curl -X POST https://your-domain.com/api/dodo/webhook \
  -H "Content-Type: application/json" \
  -H "X-Dodo-Signature: invalid_signature" \
  -d '{"test": "data"}'
# Expected: 400 Bad Request

# Test authenticated upgrade endpoint
curl -X POST https://your-domain.com/api/billing/upgrade \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan": "pro", "customer_id": "test_customer"}'
# Expected: 200 with checkout_url or 502 if Dodo API issues
```

## 🧪 **Smoke Tests Checklist**

### **✅ Core Functionality**
- [ ] **GET /api/consolidated?action=health** returns healthy
- [ ] **New signup** auto-provisions Free plan (your bootstrap)
- [ ] **Over-quota Free** returns 402 with upgrade hints
- [ ] **POST /api/billing/upgrade** returns checkout_url
- [ ] **Completing checkout** triggers webhook → org.plan updates
- [ ] **Nightly Inngest** runs (simulate once via manual trigger)

### **✅ Security & Validation**
- [ ] **Webhook signature verification** rejects invalid signatures
- [ ] **Clerk authentication** required for upgrade endpoint
- [ ] **Idempotency** prevents duplicate webhook processing
- [ ] **Rate limiting** protects internal endpoints
- [ ] **Environment guards** validate all required variables

### **✅ Error Handling**
- [ ] **Invalid webhook signatures** return 400 (not 500)
- [ ] **Missing authentication** returns 401
- **Quota exceeded** returns 402 with upgrade hints
- [ ] **Dodo API errors** return 502 with details
- [ ] **Database errors** are logged and handled gracefully

## 🔄 **User Flow Integration**

### **1. Free Plan Signup**
```
User signs up → Bootstrap Free plan → Clerk org created → Dodo customer created
```

### **2. Quota Exceeded Flow**
```
User hits quota limit → 402 response → Frontend shows upgrade modal → User selects plan → POST to /api/billing/upgrade → Redirect to Dodo checkout
```

### **3. Subscription Management**
```
Dodo webhook received → Signature verified → Idempotency checked → Org plan updated → User sees new limits immediately
```

### **4. Automated Downgrade**
```
Daily cron job → Check canceled subscriptions → Downgrade to Free → Reset quota limits
```

## 📊 **Monitoring & Observability**

### **Vercel Function Logs**
- **Webhook processing**: Monitor signature verification and database updates
- **Upgrade endpoint**: Track authentication and Dodo API calls
- **Quota endpoint**: Monitor 402 responses and upgrade flow

### **Inngest Dashboard**
- **Function runs**: Daily downgrade job execution
- **Retries**: Failed webhook processing attempts
- **Performance**: Function execution times and resource usage

### **Database Monitoring**
- **Webhook events**: Track event processing and idempotency
- **Org updates**: Monitor plan changes and subscription lifecycle
- **Performance**: Query execution times and index usage

## 🚨 **Emergency Procedures**

### **Disable Billing Automation**
```bash
# Set in Vercel environment
BILLING_AUTODOWNGRADE_ENABLED=false
```

### **Disable Webhook Processing**
```bash
# Set in Vercel environment
DODO_WEBHOOK_SECRET=disabled
```

### **Rollback Database Changes**
```sql
-- Revert plan changes if needed
UPDATE orgs SET plan = 'free' WHERE plan IN ('pro', 'enterprise');

-- Clear webhook events if needed
DELETE FROM webhook_events;
```

## 🎯 **Success Criteria**

### **Production Ready When**
- ✅ **All smoke tests pass** consistently
- ✅ **Webhook processing** handles production load
- ✅ **Upgrade flow** completes successfully end-to-end
- ✅ **Automated downgrades** run without errors
- ✅ **Error rates** are below 1% for all endpoints
- ✅ **Response times** are under 500ms for authenticated requests

### **Business Metrics**
- ✅ **Free to Pro conversions** are tracked and measurable
- ✅ **Subscription lifecycle** is fully automated
- ✅ **Quota enforcement** prevents abuse while enabling upgrades
- ✅ **Customer experience** is seamless from signup to upgrade

## 🚀 **Next Steps**

### **Immediate (Next 30 minutes)**
1. **Deploy the changes** to Vercel
2. **Run smoke tests** to verify integration
3. **Test webhook flow** with Dodo test events

### **Short Term (Next 2 hours)**
1. **Monitor production logs** for any errors
2. **Verify webhook delivery** in Dodo dashboard
3. **Test upgrade flow** with real Dodo checkout

### **Production Validation**
1. **Enable production Dodo keys** and webhook
2. **Monitor all metrics** and error rates
3. **Validate customer flows** in production environment

---

## 🎉 **Ready for Production Billing!**

Your Adminer application now has a **complete, production-grade billing system** that:
- ✅ **Handles the full subscription lifecycle** from signup to cancellation
- ✅ **Provides seamless upgrade flows** with hosted checkout
- ✅ **Enforces quota limits** with clear upgrade paths
- ✅ **Automates billing operations** with nightly cron jobs
- ✅ **Maintains security** with HMAC verification and authentication
- ✅ **Ensures reliability** with idempotency and error handling

**You're now 1 PR away from a shippable billing system!** 🚀

---

## 📚 **Related Documentation**

- **VERCEL_PRODUCTION_RUNBOOK.md**: Complete Vercel deployment guide
- **PRODUCTION_DEPLOYMENT_CHECKLIST.md**: Step-by-step deployment checklist
- **ROLLBACK.md**: Emergency procedures and rollback guide
- **FINAL_POLISH_IMPLEMENTATION.md**: Security hardening and final polish details 