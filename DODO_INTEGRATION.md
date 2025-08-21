# 🚀 Dodo Payments Integration Guide

This guide covers the complete setup and implementation of Dodo Payments for subscription management in ADminer.

## 📋 Overview

Dodo Payments provides a simple, developer-friendly way to handle subscriptions and payments. Our integration includes:

- **Dynamic checkout links** for each pricing plan
- **Webhook handling** for subscription lifecycle events
- **Automatic plan upgrades** based on payment success
- **Secure signature verification** for webhooks

## 🛠️ Setup Steps

### 1. Create Dodo Account & Products

1. **Sign up** at [Dodo Payments](https://dodopayments.com)
2. **Create subscription products** in your dashboard:
   - **Free Plan**: `prod_free_xxxxx` (0 price)
   - **Pro Plan**: `prod_pro_xxxxx` ($99/month)
   - **Enterprise Plan**: `prod_enterprise_xxxxx` ($199/month)

3. **Note the product IDs** for environment variables

### 2. Configure Environment Variables

#### Local Development (`.env.local`)
```bash
# Dodo Payments (Test Mode)
DODO_MODE=test
DODO_API_KEY=your_test_api_key
DODO_WEBHOOK_SECRET=your_test_webhook_secret
DODO_PRODUCT_FREE=prod_free_xxxxx
DODO_PRODUCT_PRO=prod_pro_xxxxx
DODO_PRODUCT_ENTERPRISE=prod_enterprise_xxxxx
```

#### Production (Vercel Environment Variables)
```bash
# Dodo Payments (Production)
DODO_MODE=live
DODO_API_KEY=your_live_api_key
DODO_WEBHOOK_SECRET=your_live_webhook_secret
DODO_PRODUCT_FREE=prod_free_xxxxx
DODO_PRODUCT_PRO=prod_pro_xxxxx
DODO_PRODUCT_ENTERPRISE=prod_enterprise_xxxxx
```

### 3. Configure Webhook Endpoint

1. **In Dodo Dashboard**: Set webhook URL to:
   ```
   https://www.adminer.online/api/dodo/webhook
   ```

2. **Events to listen for**:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.cancelled`
   - `payment.succeeded`

## 🔧 API Endpoints

### Checkout API (`/api/dodo/checkout`)

Creates a subscription and returns a hosted checkout URL.

**Request:**
```typescript
POST /api/dodo/checkout
{
  "plan": "pro" | "enterprise",
  "email": "user@example.com"
}
```

**Response:**
```typescript
{
  "url": "https://checkout.dodopayments.com/...",
  "subscriptionId": "sub_xxxxx",
  "plan": "pro"
}
```

### Webhook API (`/api/dodo/webhook`)

Handles subscription lifecycle events from Dodo.

**Security:** Verifies webhook signature using HMAC SHA-256

**Events Handled:**
- **Subscription Created/Updated**: Updates user plan and quota
- **Payment Succeeded**: Marks subscription as active
- **Subscription Cancelled**: Downgrades user to free plan

## 💻 Frontend Integration

### Pricing Component Updates

The `Pricing.tsx` component now includes:

- **Plan-specific upgrade buttons** for signed-in users
- **Loading states** during checkout processing
- **Error handling** with toast notifications
- **Automatic redirect** to Dodo hosted checkout

### Upgrade Flow

```typescript
const handleUpgrade = async (planId: string) => {
  // 1. Validate user email
  // 2. Call checkout API
  // 3. Redirect to Dodo checkout
  // 4. Handle success/failure
}
```

## 🔒 Security Features

### Webhook Verification

All webhooks are verified using HMAC SHA-256 signatures:

```typescript
function verifySignature(signature: string, body: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(body, 'utf8')
  const expectedSignature = `sha256=${hmac.digest('hex')}`
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

### Authentication Required

- **Checkout API**: Requires Clerk authentication
- **Webhook API**: Verifies Dodo signature
- **User data**: Scoped to authenticated user only

## 📊 Plan & Quota Mapping

| Plan | Monthly Price | Ad Analyses | Features |
|------|---------------|-------------|----------|
| **Free** | $0 | 10 | Basic insights, email support |
| **Pro** | $99 | 500 | Advanced AI, priority support |
| **Enterprise** | $199 | 2000 | Custom integrations, API access |

## 🧪 Testing

### Test Mode

1. **Use test API keys** in development
2. **Test webhook delivery** using Dodo's webhook testing tools
3. **Verify signature verification** works correctly

### Test Cards

Dodo provides test card numbers for development:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`

## 🚀 Production Deployment

### Vercel Setup

1. **Set environment variables** in Vercel dashboard
2. **Configure webhook URL** in Dodo dashboard
3. **Test webhook delivery** to production endpoint
4. **Monitor webhook logs** for any issues

### Monitoring

- **Checkout success rates** in Dodo dashboard
- **Webhook delivery status** in Vercel function logs
- **User plan upgrades** in your application logs

## 🔄 Subscription Lifecycle

```
User clicks upgrade → Checkout API → Dodo hosted checkout → 
Payment success → Webhook received → Plan updated → User redirected
```

## 🐛 Troubleshooting

### Common Issues

1. **Webhook signature verification fails**
   - Check `DODO_WEBHOOK_SECRET` is correct
   - Verify webhook URL is accessible

2. **Checkout API returns error**
   - Validate `DODO_API_KEY` is correct
   - Check product IDs exist in Dodo dashboard

3. **Webhook not received**
   - Verify webhook URL in Dodo dashboard
   - Check Vercel function logs for errors

### Debug Logging

All API endpoints include comprehensive logging:
- Checkout requests and responses
- Webhook events and processing
- Error details and stack traces

## 📚 Resources

- [Dodo Payments Documentation](https://docs.dodopayments.com)
- [Subscription API Guide](https://docs.dodopayments.com/subscriptions)
- [Webhook Integration](https://docs.dodopayments.com/webhooks)
- [Test Mode Setup](https://docs.dodopayments.com/testing)

## 🎯 Next Steps

1. **Complete Dodo dashboard setup** with products
2. **Test checkout flow** end-to-end
3. **Implement database updates** for plan changes
4. **Add subscription management** in user dashboard
5. **Monitor and optimize** conversion rates

---

**Need help?** Check the Dodo documentation or review the API logs for detailed error information. 