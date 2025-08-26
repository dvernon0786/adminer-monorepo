# 🚀 ADminer Production Ops Runbook

## 🚨 **Emergency Response (Read First)**

### **Build Fails Early?**
- **Read the banners** - missing keys are clearly listed
- **Check Vercel scope** (Preview vs Production)
- **Verify environment variables** are set in correct scope

### **Runtime Crash on Boot?**
- `runtime-env-check.cjs` will print which keys are missing
- **Redeploy with corrected envs** - don't try to fix in production
- Check Vercel environment variable scope

### **Webhook Errors?**
- Hit the internal `/api/_internal/dodo-webhook-check` route
- If **204 response**: signature wiring is OK—problem is downstream logic
- If **400 response**: check signature format and webhook secret

## 🔧 **Quick Commands (Muscle Memory)**

```bash
# Build & Deploy
make build          # Full prebuild + build
make dev            # Development with env validation
make smoke          # Post-deploy validation

# Health Checks
make health         # Quick status (200 = good, 503 = degraded)
make billing        # Billing intelligence
make candidates     # Current downgrade candidates

# Environment
make env-check      # Validate environment variables
make preflight      # Comprehensive pre-deploy check
```

## 📊 **Health Check Responses**

### **System Health (200 = Good)**
```bash
curl -s http://localhost:3000/api/admin/diagnostics | jq '.checks[] | select(.ok==true) | .name'
```

### **Billing Intelligence**
```bash
curl -s http://localhost:3000/api/admin/diagnostics | jq '.checks[] | select(.name | test("billing|dodo|dry_run"))'
```

### **Downgrade Candidates**
```bash
curl -s http://localhost:3000/api/admin/diagnostics | jq '.checks[] | select(.name=="dry_run_candidates") | .details'
```

## 🛡️ **Environment Guards**

### **Prebuild Validation**
```bash
cd apps/api && npm run prebuild
```
- **Dodo Guard**: Validates API key, webhook secret, product IDs
- **Clerk Guard**: Validates publishable and secret keys
- **Scope Detection**: Shows Vercel environment (Preview/Production/Local)

### **Runtime Safety**
- **Server Boot Check**: `runtime-env-check.cjs` prevents broken deployments
- **Early Exit**: Crashes immediately if critical envs missing
- **Scope Hints**: Clear environment identification in logs

## 🔍 **Debugging Endpoints**

### **Webhook Signature Check**
```bash
# Test webhook signature parsing (no DB mutations)
curl -X POST "http://localhost:3000/api/_internal/dodo-webhook-check" \
  -H "dodo-signature: test123" \
  -H "dodo-timestamp: $(date +%s)" \
  -d '{"test": "data"}'
```

### **Runtime Telemetry** (if enabled)
```bash
# Quick system snapshot (requires INTERNAL_ENDPOINTS_ENABLED=true)
curl -s "http://localhost:3000/api/_internal/runtime" | jq .
```

## 📝 **Log Analysis**

### **Build Logs**
- **Look for banners**: `==== [Prebuild Guard: *] ====`
- **Environment scope**: `ℹ️  Environment scope: production`
- **Summary tables**: Masked environment variable overview

### **Runtime Logs**
- **Startup stamp**: `level=info ts=... msg="server starting" commit=abc1234 branch=main scope=production`
- **Environment check**: `==== [Runtime Env Check] ====`
- **Scope hints**: Clear environment identification

### **Greppable Format**
```bash
# Find all error logs
grep 'level=error' logs/*.log

# Find environment scope
grep 'Environment scope:' logs/*.log

# Find missing environment variables
grep 'Missing.*env vars' logs/*.log
```

## 🚀 **Deployment Checklist**

### **Pre-Deploy**
```bash
make preflight      # Comprehensive environment check
make env-check      # Validate all required variables
```

### **Post-Deploy**
```bash
make smoke          # End-to-end validation
make health         # Quick health check
```

### **Environment Variables**
- **Dodo**: API key, webhook secret, product IDs
- **Clerk**: Publishable and secret keys
- **Internal**: `INTERNAL_ENDPOINTS_ENABLED=true` (optional)

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Build Fails with Missing Envs**
```bash
# Check Vercel scope
echo "VERCEL_ENV: $VERCEL_ENV"
echo "VERCEL: $VERCEL"

# Verify environment variables
cd apps/api && npm run prebuild
```

#### **Runtime Crashes**
```bash
# Check runtime environment check
cd apps/api && node src/runtime-env-check.cjs

# Verify critical variables
echo "DODO_API_KEY: ${DODO_API_KEY:+***}"
echo "CLERK_SECRET_KEY: ${CLERK_SECRET_KEY:+***}"
```

#### **Webhook Failures**
```bash
# Test signature parsing
curl -X POST "/api/_internal/dodo-webhook-check" \
  -H "dodo-signature: $(echo -n "$(date +%s).{}" | openssl dgst -sha256 -hmac "$DODO_WEBHOOK_SECRET" | cut -d' ' -f2)" \
  -H "dodo-timestamp: $(date +%s)" \
  -d '{}'
```

### **Recovery Steps**

1. **Identify the issue** using logs and debugging endpoints
2. **Fix environment variables** in Vercel (correct scope)
3. **Redeploy** - don't try to fix in production
4. **Validate** using smoke tests and health checks

## 📞 **Escalation**

### **When to Escalate**
- **Build failures** that persist after env fixes
- **Runtime crashes** that prevent server startup
- **Webhook failures** that affect billing operations
- **Performance issues** that impact user experience

### **Information to Provide**
- **Environment scope** (Preview/Production)
- **Error logs** with timestamps
- **Environment variable status** (masked)
- **Health check results**
- **Recent changes** or deployments

---

**💡 Pro Tip**: Use `make` commands for muscle memory. The system is designed to fail fast and provide clear error messages. When in doubt, check the logs and use the debugging endpoints. 