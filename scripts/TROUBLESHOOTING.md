# Smoke Test Troubleshooting Guide

## Fast Triage Order (Fastest to Fix)

### 1. 404 on /dashboard
**Symptom**: `/dashboard` returns 404 instead of 200
**Root Cause**: Middleware not rewriting; ensure Accept: text/html is being sent
**Quick Fix**: 
- Check that `/index.html` is 200 (not 308)
- Verify middleware is executing (`/__mw-check` returns 200)
- Ensure `Accept: text/html` header is being sent

### 2. /index.html returns 308
**Symptom**: `/index.html` returns 308 redirect
**Root Cause**: cleanUrls regression
**Quick Fix**: 
- Disable cleanUrls in `apps/api/vercel.json`
- Set `"cleanUrls": false`
- Redeploy immediately

### 3. No x-mw: spa-rewrite header
**Symptom**: Missing `x-mw: spa-rewrite` header on SPA routes
**Root Cause**: Middleware matcher or exclusions wrong
**Quick Fix**:
- Confirm middleware excludes `/api`, `/_next`, `/assets`
- Verify it rewrites HTML requests to `/index.html`
- Check middleware matcher configuration

### 4. Assets 404
**Symptom**: Static assets return 404
**Root Cause**: SPA integration not copied to `apps/api/public/` during build
**Quick Fix**:
- Re-run your `spa:integrate` step in build
- Verify SPA files exist in `apps/api/public/`
- Check build process integration

## Smoke Test Commands

### Local Testing (10-second preflight)
```bash
chmod +x scripts/smoke.sh
scripts/smoke.sh
```

### Environment-Specific Testing
```bash
# Production
BASE_URL=https://adminer.online scripts/smoke.sh

# Staging
BASE_URL=https://staging.adminer.online scripts/smoke.sh

# Preview (if using Vercel)
BASE_URL=$(vercel alias ls | awk '/preview/{print $1; exit}') scripts/smoke.sh
```

### Makefile Commands
```bash
make smoke        # Local testing
make smoke-prod   # Production testing
make smoke-stg    # Staging testing
```

## Rollback Commands

### Manual Rollback
```bash
chmod +x scripts/rollback.sh
scripts/rollback.sh
```

### Vercel CLI Rollback
```bash
# List recent deployments
vercel ls adminer.online --limit 5

# Rollback to specific deployment
vercel alias set <deployment-id> adminer.online
```

## Common Issues & Solutions

### Submodule Issues
```bash
# Reinitialize submodules
git submodule sync --recursive
git submodule update --init --recursive
```

### Middleware Not Executing
```bash
# Test middleware ping
curl -s "https://adminer.online/__mw-check"

# Check middleware file exists
ls -la apps/api/middleware.ts
```

### SPA Files Missing
```bash
# Check SPA presence
ls -la apps/api/public/index.html

# Re-run SPA integration
cd apps/api && npm run spa:integrate
```

## Emergency Procedures

### Immediate Rollback
1. **Stop the deployment** if possible
2. **Run rollback script**: `scripts/rollback.sh`
3. **Verify rollback**: `scripts/smoke.sh`
4. **Investigate root cause**

### Hot Fix Deployment
1. **Fix the issue** locally
2. **Test locally**: `scripts/smoke.sh`
3. **Deploy fix**: `git push origin main`
4. **Wait for smoke tests** to pass
5. **Monitor production** for stability

## Prevention Checklist

- [ ] **Pre-push hook** enabled (`.husky/pre-push`)
- [ ] **PR smoke tests** passing
- [ ] **Local smoke tests** passing before push
- [ ] **cleanUrls disabled** in vercel.json
- [ ] **Middleware exclusions** properly configured
- [ ] **SPA integration** working in build process
- [ ] **Submodules** properly initialized in CI

## Success Metrics

✅ **All smoke tests pass locally** before pushing
✅ **PR smoke tests pass** before merging
✅ **Post-deploy smoke tests pass** before considering deployment successful
✅ **Rollback capability** tested and working
✅ **Monitoring** in place for production health 