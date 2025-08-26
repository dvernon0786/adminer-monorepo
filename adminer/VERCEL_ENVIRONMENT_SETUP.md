# 🔧 Vercel Environment Variables Setup Guide

## 🎯 **Required Environment Variables for Production**

### **Vercel Project Settings** → **Environment Variables**

Set these environment variables with the correct **scopes**:

## 🔐 **Clerk Authentication**

| Variable | Value | Scope | Notes |
|----------|--------|--------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Preview + Production | Get from Clerk dashboard |
| `CLERK_SECRET_KEY` | `sk_live_...` | Preview + Production | Keep secret! |

## 🌐 **App Configuration**

| Variable | Value | Scope | Notes |
|----------|--------|--------|--------|
| `NEXT_PUBLIC_APP_URL` | `https://www.adminer.online` | Production | Your production domain |
| `NEXT_PUBLIC_APP_URL` | `https://preview-xyz.vercel.app` | Preview | Your preview domain |
| `APP_BASE_URL` | `https://www.adminer.online` | Production | Same as above |
| `NODE_ENV` | `production` | Production | Auto-set by Vercel |

## 🗄️ **Database**

| Variable | Value | Scope | Notes |
|----------|--------|--------|--------|
| `DATABASE_URL` | `postgresql://...` | Preview + Production | Your Neon DB URL |

## 💳 **Dodo Payments**

| Variable | Value | Scope | Notes |
|----------|--------|--------|--------|
| `DODO_MODE` | `live` | Production | Live mode for prod |
| `DODO_MODE` | `test` | Preview | Test mode for preview |
| `DODO_API_BASE` | `https://api.dodopayments.com` | Production | Live API |
| `DODO_API_BASE` | `https://test.dodopayments.com` | Preview | Test API |
| `DODO_API_KEY` | `dodo_live_...` | Production | Live API key |
| `DODO_API_KEY` | `dodo_test_...` | Preview | Test API key |
| `DODO_SECRET_KEY` | `dodo_live_...` | Production | Live secret |
| `DODO_SECRET_KEY` | `dodo_test_...` | Preview | Test secret |
| `DODO_WEBHOOK_SECRET` | `whsec_...` | Preview + Production | Webhook validation |
| `DODO_PRODUCT_FREE` | `prod_...` | Preview + Production | Free plan product ID |
| `DODO_PRICE_PRO` | `price_live_...` | Production | Pro pricing ID |
| `DODO_PRICE_PRO` | `price_test_...` | Preview | Test pro pricing |
| `DODO_PRICE_ENTERPRISE` | `price_live_...` | Production | Enterprise pricing |
| `DODO_PRICE_ENTERPRISE` | `price_test_...` | Preview | Test enterprise pricing |
| `DODO_CURRENCY` | `usd` | Preview + Production | Currency code |

## 🔄 **Billing Configuration**

| Variable | Value | Scope | Notes |
|----------|--------|--------|--------|
| `BILLING_ENABLED` | `true` | Preview + Production | Enable billing features |
| `BILLING_AUTODOWNGRADE_ENABLED` | `true` | Production | Auto downgrade in prod |
| `BILLING_AUTODOWNGRADE_ENABLED` | `false` | Preview | Disable in preview |

## ⚡ **Inngest**

| Variable | Value | Scope | Notes |
|----------|--------|--------|--------|
| `INNGEST_EVENT_KEY` | `your_prod_key` | Production | Production event key |
| `INNGEST_EVENT_KEY` | `testing` | Preview | Test event key |
| `INNGEST_SIGNING_KEY` | `signkey_prod_...` | Production | Production signing key |
| `INNGEST_SIGNING_KEY` | `signkey_test_...` | Preview | Test signing key |

## 🔒 **Security**

| Variable | Value | Scope | Notes |
|----------|--------|--------|--------|
| `INTERNAL_ENDPOINTS_ENABLED` | `false` | Production | ⚠️ IMPORTANT: Disable in prod |
| `INTERNAL_ENDPOINTS_ENABLED` | `true` | Preview | Enable for testing |

## 🏗️ **Vercel Project Configuration**

### **Build Settings**

1. **Framework Preset**: `Next.js`
2. **Root Directory**: `apps/api`
3. **Build Command**: `npm run prebuild && npm run build`
4. **Output Directory**: `.next`
5. **Install Command**: `npm install`
6. **Node.js Version**: `20.x`

### **Include Files Outside Root Directory**

✅ **Enable this setting** to include `apps/api/public` directory

## 🚀 **Quick Setup Commands**

### **1. Set Production Environment Variables**

```bash
# Replace with your actual values
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY pk_live_YOUR_KEY production
vercel env add CLERK_SECRET_KEY sk_live_YOUR_SECRET production
vercel env add NEXT_PUBLIC_APP_URL https://www.adminer.online production
vercel env add DATABASE_URL postgresql://YOUR_DB_URL production
vercel env add DODO_MODE live production
vercel env add DODO_API_KEY dodo_live_YOUR_KEY production
vercel env add INTERNAL_ENDPOINTS_ENABLED false production
```

### **2. Set Preview Environment Variables**

```bash
# Preview environment with test keys
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY pk_test_YOUR_KEY preview
vercel env add CLERK_SECRET_KEY sk_test_YOUR_SECRET preview
vercel env add DODO_MODE test preview
vercel env add DODO_API_KEY dodo_test_YOUR_KEY preview
vercel env add INTERNAL_ENDPOINTS_ENABLED true preview
```

## ✅ **Environment Validation**

After setting variables, verify them:

### **1. Check Vercel Dashboard**

Go to **Project Settings** → **Environment Variables** and ensure:
- ✅ All required variables are set
- ✅ Correct scopes (Preview/Production)
- ✅ No sensitive values visible

### **2. Test Build**

Deploy to preview and check build logs:
- ✅ Prebuild guards pass
- ✅ No environment variable errors
- ✅ Build completes successfully

### **3. Run Production Verification**

After deployment:

```bash
# Run the verification script
./scripts/verify-production.sh

# Should show all green checkmarks
```

## 🚨 **Security Checklist**

- ✅ **Production keys only** in production scope
- ✅ **Test keys only** in preview scope
- ✅ **INTERNAL_ENDPOINTS_ENABLED=false** in production
- ✅ **No secrets in build logs** or client-side code
- ✅ **Database URL** points to production database
- ✅ **Webhook secrets** are properly set

## 🔍 **Troubleshooting**

### **Build Fails with Environment Errors**

1. Check variable names match exactly (case-sensitive)
2. Ensure all required variables are set in correct scope
3. Verify no extra spaces in variable values
4. Check build logs for specific missing variables

### **Authentication Doesn't Work**

1. Verify Clerk keys are correct for the environment
2. Check domain configuration in Clerk dashboard
3. Ensure publishable key starts with correct prefix (pk_live_ or pk_test_)

### **Dodo Integration Issues**

1. Verify API keys match the environment (live vs test)
2. Check webhook secret is set correctly
3. Ensure product/price IDs exist in Dodo dashboard

## 🎉 **Ready for Deployment!**

Once all environment variables are set correctly:

1. **Deploy to Preview** first to test
2. **Verify everything works** in preview
3. **Deploy to Production** when ready
4. **Run verification script** to confirm

Your CSP configuration will automatically work with these environment variables! 🚀