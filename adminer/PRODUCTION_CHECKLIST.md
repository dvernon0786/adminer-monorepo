# 🚀 Production Deployment Checklist - Dodo Integration

## ✅ **Pre-Deployment Validation**

### Environment Variables
- [x] `DODO_API_KEY` set in local `.env.local`
- [x] `DODO_FREE_PRODUCT_ID` set in local `.env.local`
- [x] `DODO_PRO_PRODUCT_ID` set in local `.env.local`
- [x] `DODO_ENT_PRODUCT_ID` set in local `.env.local`
- [x] `DODO_API_BASE` set in local `.env.local`
- [x] Environment guard script validates all variables
- [x] Build process includes guard in `prebuild`

### Dodo Products Created
- [x] Free Plan ($0/month) - `pdt_p9B60RZVHvwIqwf9NqVok`
- [x] Pro Plan ($99/month) - `pdt_s0PgUjCizbqoZ39H7ENMU`
- [x] Enterprise Plan ($199/month) - `pdt_yn9UPVQDP3wUrQdLky4Nz`

### Code Quality
- [x] All tests passing (`npm run test:billing`)
- [x] Environment guard working
- [x] Bootstrap-free API compiles
- [x] Dashboard components render correctly
- [x] Gradient styling applied consistently

## 🚀 **Vercel Deployment Steps**

### 1. Set Environment Variables in Vercel
```bash
# Go to Vercel Dashboard → Project → Environment Variables
# Add these for both Production and Preview:

DODO_API_KEY=<your_rotated_api_key>
DODO_FREE_PRODUCT_ID=pdt_p9B60RZVHvwIqwf9NqVok
DODO_PRO_PRODUCT_ID=pdt_s0PgUjCizbqoZ39H7ENMU
DODO_ENT_PRODUCT_ID=pdt_yn9UPVQDP3wUrQdLky4Nz
DODO_API_BASE=https://test.dodopayments.com
DODO_MODE=test
```

### 2. Deploy to Preview
```bash
git push origin main
# Check Vercel preview deployment
```

### 3. Verify Preview Deployment
- [ ] Environment guard passes
- [ ] Build completes successfully
- [ ] API endpoints respond correctly
- [ ] Dashboard renders without errors

### 4. Deploy to Production
```bash
# Merge to main or manually deploy
# Verify production environment variables
```

## 🧪 **Post-Deployment Testing**

### API Endpoints
- [ ] `/api/consolidated?action=health` returns 200
- [ ] `/api/consolidated?action=quota/status` returns 401 (unauthenticated)
- [ ] `/api/billing/bootstrap-free` works with Clerk auth

### Dashboard Functionality
- [ ] Signed-out state shows sign-in gate
- [ ] Signed-in state shows full dashboard
- [ ] Pricing modal opens from header button
- [ ] Quota badge clickable and opens pricing
- [ ] Gradient styling visible throughout

### Dodo Integration
- [ ] Free plan users get $0 subscription
- [ ] Pro/Enterprise upgrades work
- [ ] Webhooks update database correctly
- [ ] Quota enforcement works (402 responses)

## 🔒 **Security Checklist**

- [x] **ROTATE DODO API KEY** - Use new key in production
- [x] Environment variables not committed to git
- [x] API keys only in Vercel environment variables
- [x] Test mode enabled for Dodo
- [x] Webhook secrets configured

## 🚨 **Rollback Plan**

If issues arise:

1. **Feature Flag Toggle**
   ```bash
   # Add to Vercel environment variables
   NEXT_PUBLIC_ENABLE_PRICING_MODAL=false
   ```

2. **Revert Dodo Integration**
   ```bash
   # Comment out BootstrapFree component
   # Disable bootstrap-free API route
   # Remove environment guard from prebuild
   ```

3. **CSS Rollback**
   ```bash
   # Remove gradient utilities if conflicts arise
   # Revert to original button styles
   ```

## 📊 **Monitoring & Alerts**

- [ ] Set up Vercel function monitoring
- [ ] Monitor Dodo webhook delivery
- [ ] Track subscription creation success rates
- [ ] Alert on quota enforcement failures

## 🎯 **Success Criteria**

- [ ] Users can sign up and get free plan automatically
- [ ] Upgrade flow works end-to-end
- [ ] Quota enforcement prevents abuse
- [ ] No console errors in production
- [ ] All gradient styling renders correctly
- [ ] Pricing modal accessible from multiple entry points

---

**Status**: 🟡 Ready for Preview Deployment
**Next Action**: Deploy to Vercel Preview and test with real Clerk authentication 