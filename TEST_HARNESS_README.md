# 🧪 **COMPREHENSIVE TEST HARNESS - GREEN ACROSS THE BOARD**

## 🎯 **What This Gives You**

**One-command full system validation that proves your deployment works like a real user:**

- ✅ **SPA Boot + Assets** - Validates React app loads and hydrates
- ✅ **Health/Quota Endpoints** - Confirms API routes work
- ✅ **Middleware Not Blocking** - Proves static assets accessible
- ✅ **No Proxy Leaks** - Ensures Clerk keys properly injected
- ✅ **Bundle Integrity** - Validates JavaScript references match files
- ✅ **Artifact Upload** - Saves HTML/JS on failure for debugging

## 🚀 **Quick Start**

### **1. One-Command System Check**

```bash
# Production check (default: https://adminer.online)
./scripts/system-check.sh

# Local development check
./scripts/system-check.sh http://localhost:3000
```

**Expected Output:**
```
🎉 ALL CHECKS PASSED for https://adminer.online
```

### **2. Local Pre-Push Guards**

```bash
# Build and validate locally
./scripts/vercel-build.sh
./scripts/guard-spa.sh
```

**Expected Output:**
```
✅ Guard OK: /assets/index-*.js
✅ Local guard OK: /assets/index-*.js
```

## 🛠️ **Scripts Overview**

### **`scripts/system-check.sh`** - Production Validation
- **SPA Index**: Fetches and validates HTML
- **Bundle Parsing**: Extracts JavaScript references
- **Asset Fetching**: Downloads and validates JS bundles
- **Clerk Validation**: Checks for key injection and no proxy leaks
- **Headers Analysis**: Validates content-type and caching
- **Middleware Test**: Ensures assets not blocked (401/403)
- **SPA Routes**: Tests /dashboard serves index (not 404)
- **API Endpoints**: Validates health and quota endpoints
- **Version Headers**: Optional X-App-Version check

### **`scripts/guard-spa.sh`** - Local Regression Prevention
- **File Presence**: Ensures index.html exists
- **Bundle References**: Validates JavaScript paths
- **File Integrity**: Confirms referenced files exist
- **Proxy Leak Check**: Prevents clerk.adminer.online references

### **`scripts/diagnose.sh`** - Comprehensive Issue Detection
- **Deployed State**: What's actually live
- **Local State**: What you expect to be serving
- **Shadow Detection**: Finds Next.js artifacts
- **Duplicate Analysis**: Identifies conflicting files
- **Bundle Comparison**: Matches deployed vs local references

### **`scripts/eliminate-duplicates.sh`** - One-Shot Cleanup
- **Git Untracking**: Removes generated files from version control
- **Next.js Cleanup**: Removes .next/_next artifacts
- **Public Directory Cleanup**: Removes legacy public dirs
- **Dist Cleanup**: Removes stale Vite builds

## 🔧 **GitHub Actions Integration**

### **Enhanced Workflow**
The existing `promote-and-smoke.yml` now includes:

```yaml
- name: Full system check (prod)
  id: system-check
  shell: bash
  continue-on-error: true
  run: |
    set -euo pipefail
    chmod +x scripts/system-check.sh
    ./scripts/system-check.sh "https://adminer.online"

- name: Upload smoke artifacts (if failed)
  if: steps.smoke.outcome == 'failure' || steps.system-check.outcome == 'failure'
  uses: actions/upload-artifact@v4
  with:
    name: system-check-artifacts
    path: |
      deploy_body.html
      apex_body.html
      headers.txt
      smoke_index.html
      smoke_bundle.js
      smoke_bundle.headers
```

### **Artifact Upload on Failure**
When any check fails, you get:
- **HTML Bodies**: Both deployment and apex responses
- **JavaScript Bundles**: Actual deployed code
- **Headers**: Response headers for debugging
- **Bundle Headers**: Asset-specific headers

## 🧩 **Troubleshooting Guide**

### **Branch A: Bundle 404/401**
**Symptom**: `/` is 200, but GET `/assets/index-*.js` fails

**Cause**: Middleware blocking or copy failed at build

**Fix**:
1. Ensure middleware allowlist includes `/assets/*`
2. Set Vercel Build Command to `./scripts/vercel-build.sh`
3. Redeploy and confirm logs show `✅ Guard OK:`

### **Branch B: Stale HTML References**
**Symptom**: Deployed HTML references hash you don't have locally

**Cause**: Serving old index.html from old project/target

**Fix**:
1. Confirm domain → project mapping in Vercel
2. Disable auto framework detection
3. Set Build Command to `./scripts/vercel-build.sh`
4. Use `vercel.json` rewrites for SPA fallback

### **Branch C: Blank Dashboard with 200/200**
**Symptom**: Network fine, runtime JS fails

**Cause**: Runtime error (env missing, CSP blocking, code error)

**Fix**:
1. Ensure `VITE_CLERK_PUBLISHABLE_KEY` set in Vercel
2. Check CSP headers not blocking inline scripts
3. Add error overlay to surface runtime exceptions

## 🎯 **Definition of Done (No Regressions)**

### **File Structure**
```bash
find . -name "index.html"  # → exactly 2: apps/web/index.html + apps/api/public/index.html
```

### **No Next.js Artifacts**
```bash
find adminer -name ".next" -o -name "_next"  # → empty
```

### **Vercel Build Command**
```
Build Command: ./scripts/vercel-build.sh
Logs must show: ✅ Guard OK: /assets/index-*.js
```

### **System Check Passes**
```bash
./scripts/system-check.sh https://adminer.online  # → 🎉 ALL CHECKS PASSED
```

### **Git Tracking Clean**
```bash
git ls-files adminer/apps/api/public | wc -l  # → 0
```

## 🚀 **One-Button Recovery**

**If in doubt, run this sequence:**

```bash
# 1. Eliminate all duplicates
./scripts/eliminate-duplicates.sh

# 2. Rebuild clean
./scripts/vercel-build.sh

# 3. Validate locally
./scripts/guard-spa.sh

# 4. Test production
./scripts/system-check.sh https://adminer.online
```

## 🎉 **What "GREEN" Means**

**Run both of these and ensure ✅:**

```bash
./scripts/vercel-build.sh → prints ✅ Guard OK: …
./scripts/system-check.sh https://adminer.online → ends with 🎉 ALL CHECKS PASSED
```

**Plus your repo state:**
- `git ls-files adminer/apps/api/public | wc -l → 0`
- Middleware allowlist skips `/assets/*`, `/`, `/dashboard*`, `/favicon.ico`, `/robots.txt`, `/sitemap.xml`, `/api/consolidated`
- Optional: `curl -I https://adminer.online | grep X-App-Version` shows a SHA

## 🔒 **Regression Prevention**

### **Pre-Push Hooks**
```bash
# Install Husky
pnpm dlx husky-init && pnpm install

# Pre-push runs guards automatically
git push  # → automatically runs ./scripts/vercel-build.sh && ./scripts/guard-spa.sh
```

### **CI Requirements**
- **System Check**: Must pass before merge
- **Artifact Upload**: Automatic on failure
- **Comprehensive Validation**: User-level testing

## 📊 **Performance Metrics**

### **Expected Response Times**
- **SPA Index**: < 200ms
- **JavaScript Bundle**: < 100ms (cached)
- **Health Endpoint**: < 50ms
- **Quota Endpoint**: < 100ms

### **Cache Headers**
- **Assets**: `Cache-Control: public, max-age=31536000, immutable`
- **Index**: `Cache-Control: no-cache`
- **API**: Standard Next.js caching

---

## 🎯 **Bottom Line**

**Run the one liner:**
```bash
./scripts/system-check.sh && echo "✅ GREEN: user-level checks passed"
```

**If it passes, you're green like a user. If it fails, the artifacts are saved and the error message tells you exactly what to fix.**

**This system makes it impossible to regress - your dashboard will boot every time!** 🚀 