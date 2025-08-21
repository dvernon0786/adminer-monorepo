# 🚀 Complete Billing System Implementation

## Overview

This document covers the complete implementation of Adminer's billing system, including free plan activation, paid plan upgrades, quota enforcement, and webhook handling.

## 🏗️ Architecture

### Core Components

1. **Database Schema**: Enhanced `orgs` table with billing fields
2. **Quota Management**: Comprehensive quota tracking and enforcement
3. **Dodo Integration**: Payment processing and subscription management
4. **Webhook Handling**: Real-time subscription updates
5. **API Endpoints**: RESTful endpoints for all billing operations

### Database Tables

```sql
-- Organizations with billing support
orgs (id, name, plan, status, quota_limit, quota_used, dodo_customer_id, dodo_subscription_id, current_period_end)

-- Webhook events for idempotency
webhook_events (id, event_type, org_id, processed_at, data)

-- Quota usage tracking
quota_usage (id, org_id, job_id, created_at, billing_period)
```

## 🔧 Environment Variables

### Required Variables

```bash
# Dodo Configuration
DODO_MODE=test|live
DODO_API_BASE=https://test.dodopayments.com|https://api.dodopayments.com
DODO_SECRET_KEY=sk_test_...|sk_live_...
DODO_WEBHOOK_SECRET=whsec_...
DODO_PRICE_PRO=price_test_pro_...|price_live_pro_...
DODO_PRICE_ENTERPRISE=price_test_ent_...|price_live_ent_...
DODO_CURRENCY=usd

# App Configuration
APP_BASE_URL=https://your-domain.com
BILLING_ENABLED=true|false
```

### Plan Limits

- **Free**: 10 requests/month
- **Pro**: 500 requests/month  
- **Enterprise**: 2000 requests/month

## 📡 API Endpoints

### 1. Free Plan Activation
```http
POST /api/dodo/free
Content-Type: application/json

{
  "orgId": "org_123",
  "orgName": "My Organization"
}
```

**Response**: `200 OK` with plan details

### 2. Paid Plan Checkout
```http
POST /api/dodo/checkout
Content-Type: application/json

{
  "plan": "pro|enterprise",
  "email": "user@example.com"
}
```

**Response**: `200 OK` with checkout URL

### 3. Quota Status
```http
GET /api/consolidated?action=quota/status
```

**Response**: `200 OK` with quota information
```json
{
  "status": "healthy",
  "quota": {
    "plan": "free",
    "used": 5,
    "limit": 10,
    "remaining": 5,
    "upgradeUrl": "/api/dodo/checkout?plan=pro"
  }
}
```

### 4. Quota Enforcement
```http
POST /api/test-quota
Content-Type: application/json

{
  "orgId": "org_123",
  "simulateJob": true
}
```

**Quota Exceeded Response**: `402 Payment Required`
```json
{
  "code": "QUOTA_EXCEEDED",
  "message": "Quota exceeded. Current plan: free, Used: 10/10",
  "plan": "free",
  "limit": 10,
  "used": 10,
  "upgradeUrl": "/api/dodo/checkout?plan=pro"
}
```

### 5. Webhook Handler
```http
POST /api/dodo/webhook
Dodo-Signature: <hmac_signature>
Content-Type: application/json

{
  "id": "evt_123",
  "type": "subscription.activated",
  "data": {
    "customerId": "cust_123",
    "subscriptionId": "sub_123",
    "priceId": "price_pro_123"
  }
}
```

## 🔄 Webhook Events

### Supported Event Types

1. **subscription.created** - New subscription created
2. **subscription.activated** - Subscription activated
3. **subscription.updated** - Subscription updated
4. **subscription.canceled** - Subscription canceled
5. **subscription.past_due** - Payment past due
6. **invoice.payment_succeeded** - Payment successful

### Event Processing

- **Signature Verification**: HMAC SHA-256 verification
- **Idempotency**: Prevents duplicate processing
- **Database Updates**: Real-time org plan and quota updates
- **Quota Reset**: Automatic quota reset on payment success

## 🛡️ Quota Enforcement

### Middleware Integration

```typescript
import { withQuotaCheck } from '../lib/quota-middleware'

export default withQuotaCheck({
  incrementOnSuccess: true,
  jobIdField: 'jobId'
})(yourHandler)
```

### Features

- **Automatic Quota Checking**: Before allowing actions
- **Quota Incrementation**: On successful operations
- **Feature Flag Support**: `BILLING_ENABLED` toggle
- **Upgrade Recommendations**: Smart upgrade URLs

## 🧪 Testing

### Local Testing

```bash
# Start the API server
cd adminer/apps/api
npm run dev

# Run comprehensive tests
cd ../..
./adminer/scripts/test-billing-flow.sh
```

### Test Coverage

- ✅ Free plan activation
- ✅ Quota enforcement (10/10 allowed, 11th blocked)
- ✅ Upgrade checkout generation
- ✅ Webhook signature verification
- ✅ Database operations
- ✅ Error handling (402 responses)

## 🚀 Production Deployment

### 1. Database Setup

```bash
# Run migration in production
psql $DATABASE_URL -f adminer/apps/api/scripts/create-tables.sql
```

### 2. Environment Configuration

```bash
# Set production variables in Vercel
DODO_MODE=live
DODO_SECRET_KEY=sk_live_...
DODO_PRICE_PRO=price_live_pro_...
DODO_PRICE_ENTERPRISE=price_live_ent_...
BILLING_ENABLED=true
```

### 3. Dodo Dashboard Setup

1. Create products in Dodo dashboard
2. Set up price IDs for Pro/Enterprise plans
3. Configure webhook endpoint: `https://your-domain.com/api/dodo/webhook`
4. Test webhook delivery

### 4. Monitoring

- **Webhook Logs**: Monitor webhook processing
- **Quota Usage**: Track user consumption
- **Upgrade Funnel**: Monitor free → paid conversions
- **Error Rates**: Watch for 402 responses

## 🔒 Security Features

- **Signature Verification**: All webhooks verified
- **Idempotency**: Prevents duplicate processing
- **Authentication**: Clerk integration for all endpoints
- **Rate Limiting**: Built-in quota enforcement
- **Feature Flags**: Easy rollback capability

## 📊 Business Logic

### Plan Upgrades

1. **Free → Pro**: $99/month, 500 requests
2. **Free → Enterprise**: $199/month, 2000 requests
3. **Pro → Enterprise**: $199/month, 2000 requests

### Quota Management

- **Monthly Reset**: Quota resets on payment success
- **Grace Periods**: Configurable for past due subscriptions
- **Auto-Downgrade**: Cancelled subscriptions → free plan
- **Upgrade Prompts**: Smart CTAs when quota low

## 🎯 Success Metrics

- **Free Plan Activation**: Track conversion from signup
- **Upgrade Conversion**: Monitor free → paid upgrades
- **Quota Utilization**: Track usage patterns
- **Churn Prevention**: Identify at-risk users
- **Revenue Growth**: Monitor subscription revenue

## 🚨 Troubleshooting

### Common Issues

1. **Webhook Failures**: Check signature verification
2. **Quota Not Updating**: Verify database connections
3. **Checkout Errors**: Validate Dodo price IDs
4. **Authentication Issues**: Check Clerk configuration

### Debug Steps

1. Check server logs for webhook processing
2. Verify environment variables are set
3. Test database connectivity
4. Validate Dodo API credentials
5. Check webhook endpoint accessibility

## 🔮 Future Enhancements

- **Usage Analytics**: Detailed consumption tracking
- **Predictive Upgrades**: AI-powered upgrade suggestions
- **Custom Plans**: Flexible pricing tiers
- **Team Management**: Multi-user quota sharing
- **API Rate Limiting**: Real-time throttling

---

**Status**: 🎯 **100% Complete** - Production Ready

Your billing system is now fully implemented and ready for production deployment! 🚀 