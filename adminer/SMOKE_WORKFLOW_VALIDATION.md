# Smoke Workflow Validation Checklist

## 🚀 **Workflow Hardening Complete!**

Your GitHub Actions smoke workflow has been enhanced with production-specific hardening features.

### ✅ **What's Been Added**

1. **Production-Specific Job Naming**: `smoke_prod` for clear identification
2. **Improved Health Checks**: More resilient health endpoint waiting
3. **Better Error Handling**: Proper exit codes and failure detection
4. **Production Artifacts**: `smoke-logs-prod` naming for clarity

---

## 🔍 **Quick Validation Steps**

### **1. Confirm Workflow is Live**
- [ ] Go to **Actions → Smoke tests (Production)**
- [ ] Verify you see **"Run workflow"** button
- [ ] Check for recent workflow runs

### **2. Test Manual Trigger**
- [ ] Click **"Run workflow"** → **"Run workflow"**
- [ ] Wait for completion (should take ~2-3 minutes)
- [ ] Verify **summary** is posted to the run
- [ ] Check **artifacts** include:
  - `smoke.log`
  - `/tmp/*.out` files
  - `scripts/smoke.sh`

### **3. Verify Production Auto-Trigger**
- [ ] Make a small change and push to main
- [ ] Wait for Vercel to deploy to Production
- [ ] Check **Actions** tab for auto-triggered run
- [ ] Verify job name shows **"smoke_prod"**
- [ ] Confirm it runs against `https://www.adminer.online`

---

## 🛡️ **Hardening Features Implemented**

### **Production-Specific Guarding**
```yaml
smoke_prod:
  if: >
    github.event_name == 'workflow_dispatch' ||
    (github.event_name == 'deployment_status' &&
     github.event.deployment_status.state == 'success' &&
     (contains(github.event.deployment.environment, 'Production') ||
      contains(github.event.deployment.environment, 'production'))) ||
    (github.event_name == 'push' && github.ref == 'refs/heads/main')
```

### **Flake-Resistant Health Wait**
- **24 attempts** with 5-second intervals (2 minutes total)
- **Early exit** on first healthy response
- **Proper error handling** with exit codes

### **Fail-Fast Script Execution**
- **`set -eo pipefail`** ensures any test failure stops execution
- **Non-zero exit** on smoke test failures
- **Always upload artifacts** for debugging

### **Production Artifacts**
- **`smoke-logs-prod`** naming for clear identification
- **Comprehensive logging** including all test outputs
- **Script preservation** for reproducibility

---

## 🎯 **Next Steps (Optional but Recommended)**

### **Make it a Required Check**
1. Go to **Repository Settings → Branches**
2. Click **"Add rule"** for `main` branch
3. Enable **"Require status checks to pass"**
4. Add **"Smoke tests (Production) / smoke_prod"** as required
5. This blocks merges if smoke tests fail (safety net)

### **Monitor Production Deployments**
- Every Vercel Production deployment will auto-trigger smoke tests
- Results posted to deployment summaries
- Immediate feedback on production health
- Artifacts available for troubleshooting

---

## 🔧 **Troubleshooting**

### **If Workflow Doesn't Auto-Trigger**
- Check Vercel GitHub integration is enabled
- Verify deployment environment contains "Production" or "production"
- Check GitHub Actions permissions for the repository

### **If Tests Fail**
- Download artifacts for detailed logs
- Check `/tmp/*.out` files for specific test failures
- Verify production domain is accessible from GitHub Actions

### **If Health Check Times Out**
- Production might need longer to stabilize
- Consider increasing wait time in workflow
- Check if health endpoint is responding correctly

---

## 🎉 **You're All Set!**

Your production environment now has:
- ✅ **Automated quality gates** on every deployment
- ✅ **Immediate feedback** on production health
- ✅ **Comprehensive logging** for debugging
- ✅ **Production-specific** workflow naming
- ✅ **Resilient health checks** with proper error handling

**The workflow will automatically run on your next Vercel Production deployment!** 🚀 