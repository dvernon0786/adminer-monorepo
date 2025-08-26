# 🚀 Vercel Configuration Guide - ADminer

## 🔧 **Build & Output Settings**

### **Project Root**
- **Build Command**: `npm run build` (runs from `apps/api`)
- **Output Directory**: `.next` (Next.js default)
- **Install Command**: `npm ci` (root level)

### **Node Version**
- **Pin to Node 20** in Vercel settings to match CI
- **Engine Requirement**: `>=20.0.0` (already set in package.json)

### **Function Regions**
- **Keep stable** (e.g., `iad1` - Washington, D.C.)
- **Avoid region changes** to prevent webhook signature edge cases

## 🌍 **Environment Variables**

### **Required Scope: Production**
```
DODO_API_KEY=your_dodo_api_key
DODO_WEBHOOK_SECRET=your_webhook_secret
DODO_FREE_PRODUCT_ID=pdt_p9B60RZVHvwIqwf9NqVok
DODO_PRO_PRODUCT_ID=pdt_s0PgUjCizbqoZ39H7ENMU
DODO_ENT_PRODUCT_ID=pdt_yn9UPVQDP3wUrQdLky4Nz
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### **Required Scope: Preview**
```
# Same variables as Production
# Required for PR deployments and testing
```

### **Environment Variable Setup**
1. Go to **Vercel Dashboard** → **Project** → **Settings** → **Environment Variables**
2. Add each variable with correct scope
3. **Production**: Live deployments
4. **Preview**: PR deployments and testing

## 🚨 **Common Foot-Guns to Avoid**

### **Dodo Test vs Live**
- **Don't guard for live IDs** at build time unless targeting live environment
- **Preview builds will fail** if you require live-only product IDs
- **Use test mode** for all development and preview deployments

### **Clerk Allowed Origins**
- **Add your Vercel domain** to Clerk's allowed origins
- **Sign-in widgets fail silently** if domain not allowed
- **Include both**: `adminer.online` and `*.vercel.app` (for previews)

### **Webhook Secret Rotation**
- **Deploy first**, then rotate `DODO_WEBHOOK_SECRET`
- **Avoid mismatch** between deployed code and new secret
- **Test webhook endpoint** after rotation

## 🔍 **Post-Deploy Validation**

### **Run Smoke Tests**
```bash
# Test production
./scripts/smoke-test-production.sh

# Test preview deployment
./scripts/smoke-test-production.sh https://your-preview-url.vercel.app
```

### **Expected Results**
1. **Health Endpoint**: `200 OK`
2. **SPA Root**: `200 OK` (HTML content)
3. **Protected Routes**: `401 Unauthorized` (when signed out)
4. **Webhook Endpoint**: `400 Bad Request` (bad signature)
5. **Bootstrap Endpoint**: `401 Unauthorized` (no auth)

### **Build Log Verification**
Look for these guard messages in Vercel build logs:
```
==== [Prebuild Guard: Dodo] ====
✅ Dodo environment variables are set.
— Dodo Env Summary (masked) —

==== [Prebuild Guard: Clerk] ====
✅ Clerk environment variables are set.
— Clerk Env Summary (masked) —

==== [Runtime Env Check] ====
✅ Runtime env check passed.
```

## 🚀 **Deployment Checklist**

### **Before Deploy**
- [ ] All environment variables set in Vercel
- [ ] Correct scope (Production + Preview)
- [ ] Node version pinned to 20
- [ ] Function region stable

### **After Deploy**
- [ ] Build logs show guard messages
- [ ] Runtime env check passes
- [ ] Smoke tests pass
- [ ] Health endpoint responds
- [ ] Protected routes return 401
- [ ] Webhook endpoint handles bad signatures

### **Monitoring**
- [ ] Vercel function monitoring enabled
- [ ] Webhook delivery tracking
- [ ] Error rate monitoring
- [ ] Performance metrics

## 🔧 **Troubleshooting**

### **Build Fails**
1. **Check environment variables** are set correctly
2. **Verify scope** (Production vs Preview)
3. **Check Node version** matches requirement
4. **Review build logs** for guard messages

### **Runtime Errors**
1. **Check runtime env check** in logs
2. **Verify environment variables** are accessible
3. **Check function region** stability
4. **Review webhook configuration**

### **Authentication Issues**
1. **Verify Clerk keys** are correct
2. **Check allowed origins** in Clerk dashboard
3. **Test sign-in flow** in browser
4. **Review Clerk logs** for errors

---

**Status**: 🟡 Ready for Production Deployment
**Last Updated**: $(date)
**Next Action**: Deploy to Vercel and run smoke tests 