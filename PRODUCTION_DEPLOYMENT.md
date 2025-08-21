# Production Deployment Guide - ADminer

## 🚨 Critical: Fix Clerk Development Keys Warning

### **Current Issue**
Your production deployment is using Clerk development keys, which causes:
- Rate limiting warnings
- Domain mismatch issues
- "loaded with development keys" console warnings

### **Step 1: Create Production Clerk Instance**

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a **new Production instance** for `adminer.online`
3. Note down your production keys:
   - `pk_live_...` (Publishable Key)
   - `sk_live_...` (Secret Key)

### **Step 2: Update Vercel Environment Variables**

In your Vercel project dashboard:

**Project → Settings → Environment Variables**

Add these **Production** environment variables:

```bash
# Client-side (SPA)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY_HERE

# Server-side (API)
CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY_HERE

# Optional: JWT verification
CLERK_JWT_KEY=your_jwt_key_if_needed
```

### **Step 3: Update Local Environment Files**

**Web App (`adminer/apps/web/.env`):**
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY_HERE
VITE_APP_URL=https://www.adminer.online
NODE_ENV=production
```

**API (`adminer/apps/api/.env`):**
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY_HERE
CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY_HERE
NEXT_PUBLIC_APP_URL=https://www.adminer.online
NODE_ENV=production
```

### **Step 4: Configure Clerk Domains**

In your Clerk Production instance dashboard:

**Allowed Origins:**
- `https://www.adminer.online`
- `https://adminer.online`

**Authorized Redirect URLs:**
- `https://www.adminer.online/*`
- `https://adminer.online/*`

### **Step 5: Rebuild and Deploy**

1. **Rebuild SPA with production keys:**
   ```bash
   cd adminer/apps/web
   npm run build
   ```

2. **Sync to API public directory:**
   ```bash
   cd /home/dghost/Desktop/ADminerFinal
   ./scripts/sync-spa.sh
   ```

3. **Deploy to production:**
   ```bash
   git add .
   git commit -m "fix: Update to production Clerk keys and fix CORS image issues"
   git push origin main
   ```

## 🔧 Additional Fixes Applied

### **OpaqueResponseBlocking Image Issue**
- ✅ Added `crossOrigin="anonymous"` to Unsplash images
- ✅ Images already use direct `images.unsplash.com` links (good)
- ✅ No more CORS-related canvas tainting

### **SPA Asset Serving**
- ✅ Static assets now serve with correct MIME types
- ✅ JS: `application/javascript`
- ✅ CSS: `text/css`
- ✅ SPA routes: `text/html`

## 🧪 Production Testing Checklist

After deployment, verify:

- [ ] **No Clerk development key warnings** in console
- [ ] **Static assets load correctly** (JS/CSS with proper MIME types)
- [ ] **SPA loads without errors** at `/` and `/dashboard`
- [ ] **Authentication works** (sign in/out flows)
- [ ] **API endpoints protected** (`/api/*` returns 401 when not authenticated)
- [ ] **Images load without CORS issues**

## 🚀 Deployment Commands

```bash
# 1. Update environment files with production keys
# 2. Rebuild SPA
cd adminer/apps/web && npm run build

# 3. Sync to API
cd /home/dghost/Desktop/ADminerFinal
./scripts/sync-spa.sh

# 4. Deploy
git add .
git commit -m "fix: Production Clerk keys and CORS fixes"
git push origin main
```

## 📋 Environment Variable Summary

| App | Variable | Value | Purpose |
|-----|----------|-------|---------|
| Web | `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Clerk client auth |
| API | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Clerk client auth |
| API | `CLERK_SECRET_KEY` | `sk_live_...` | Clerk server auth |
| Both | `NODE_ENV` | `production` | Environment flag |

## ⚠️ Important Notes

1. **Never commit production keys** to Git
2. **Use Vercel environment variables** for production secrets
3. **Test authentication flows** after deployment
4. **Monitor Vercel Function Logs** for any middleware errors
5. **Keep CI guard scripts** to prevent regressions

## 🆘 Troubleshooting

If you still see issues after deployment:

1. **Check Vercel Function Logs** for middleware errors
2. **Verify environment variables** are set correctly
3. **Clear browser cache** and test in incognito mode
4. **Check Clerk dashboard** for domain configuration
5. **Run local tests** with production keys to verify 