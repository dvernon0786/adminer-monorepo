# 🚨 Emergency Rollback & Recovery Procedures

## 🚀 Quick Rollback (Copy/Paste)

### **1. Promote Previous Deployment (Recommended)**
```bash
# In Vercel Dashboard:
# 1. Go to Deployments tab
# 2. Find the last working deployment
# 3. Click "Promote to Production"
# 4. Confirm the rollback
```

### **2. Emergency Environment Variable Changes**
```bash
# Disable internal endpoints immediately:
INTERNAL_ENDPOINTS_ENABLED=false

# Disable automated billing if needed:
BILLING_AUTODOWNGRADE_ENABLED=false

# Disable billing system entirely:
BILLING_ENABLED=false
```

### **3. Emergency Bypass Prebuild Guards (Last Resort)**
```bash
# Only use in absolute emergency - creates security risk
# Create hotfix branch and temporarily modify guard scripts
git checkout -b hotfix/emergency-bypass
# Edit guard scripts to return success immediately
git commit -m "EMERGENCY: Bypass prebuild guards"
git push origin hotfix/emergency-bypass
# Deploy hotfix branch
# REMEMBER: Revert immediately after fixing root cause
```

## 🔧 Detailed Recovery Procedures

### **When to Rollback**
- ✅ **Runtime errors** in production (500s, crashes)
- ✅ **Authentication failures** affecting all users
- ✅ **Database connection issues** causing downtime
- ✅ **Environment variable misconfiguration** breaking core functionality
- ❌ **Minor UI issues** (use feature flags instead)
- ❌ **Performance degradation** (monitor and optimize)

### **Rollback Priority Matrix**

| Issue Type | Rollback Speed | Rollback Method | Recovery Time |
|------------|----------------|-----------------|---------------|
| **Critical Security** | 🚨 IMMEDIATE | Promote Previous | 2-5 minutes |
| **System Down** | 🚨 IMMEDIATE | Promote Previous | 2-5 minutes |
| **Authentication Broken** | 🚨 IMMEDIATE | Promote Previous | 2-5 minutes |
| **Database Issues** | 🚨 IMMEDIATE | Promote Previous | 2-5 minutes |
| **Performance Issues** | 🟡 15 minutes | Feature Flags | 5-10 minutes |
| **UI/UX Issues** | 🟡 30 minutes | Feature Flags | 10-15 minutes |

## 🛡️ Feature Flag Emergency Controls

### **Instant Kill Switches**
```bash
# Disable automated billing system
BILLING_AUTODOWNGRADE_ENABLED=false

# Disable internal endpoints
INTERNAL_ENDPOINTS_ENABLED=false

# Disable billing entirely
BILLING_ENABLED=false

# Disable webhook processing
DODO_WEBHOOK_ENABLED=false
```

### **Feature Flag Status Check**
```bash
# Check current feature flag status
curl -s https://www.adminer.online/api/consolidated?action=health | jq '.features'

# Expected response:
{
  "billing": {
    "enabled": true,
    "autoDowngrade": true
  },
  "internal": {
    "enabled": false
  }
}
```

## 🔍 Post-Rollback Investigation

### **1. Immediate Actions (First 15 minutes)**
- [ ] **Confirm rollback success**: Check health endpoint
- [ ] **Verify user impact**: Test core user flows
- [ ] **Check monitoring**: Ensure no new errors
- [ ] **Notify team**: Update status and timeline

### **2. Root Cause Analysis (Next 2 hours)**
- [ ] **Review deployment logs**: Look for build/runtime errors
- [ ] **Check environment variables**: Verify all required vars are set
- [ ] **Test locally**: Reproduce issue in development
- [ ] **Review recent changes**: Identify what broke

### **3. Fix and Redeploy (Next 4 hours)**
- [ ] **Fix root cause**: Address the actual issue
- [ ] **Test thoroughly**: Ensure fix works locally
- [ ] **Deploy to preview**: Test in preview environment
- [ ] **Deploy to production**: Use normal deployment process

## 📊 Rollback Metrics & Learning

### **Track These Metrics**
- **Time to rollback**: Target < 5 minutes
- **Time to recovery**: Target < 4 hours
- **Rollback frequency**: Should decrease over time
- **Root cause categories**: Identify patterns

### **Post-Incident Review**
- [ ] **What went wrong?** Document the failure
- [ ] **Why did it happen?** Identify root cause
- [ ] **How can we prevent it?** Implement safeguards
- [ ] **What worked well?** Document successful procedures

## 🚨 Emergency Contacts & Escalation

### **Escalation Path**
1. **On-Call Engineer** (Immediate response)
2. **Tech Lead** (If not resolved in 15 minutes)
3. **Engineering Manager** (If not resolved in 1 hour)
4. **CTO/VP Engineering** (If not resolved in 4 hours)

### **Emergency Communication**
```bash
# Slack/Teams notification template
🚨 PRODUCTION INCIDENT
- Issue: [Brief description]
- Impact: [User impact level]
- Status: [Investigating/Fixing/Rolling back]
- ETA: [Expected resolution time]
- Rollback: [Yes/No/In Progress]
```

## 🔐 Security Considerations During Rollback

### **Never Do During Emergency**
- ❌ **Disable authentication** (security risk)
- ❌ **Expose internal endpoints** (security risk)
- ❌ **Bypass rate limiting** (security risk)
- ❌ **Skip environment validation** (security risk)

### **Safe Emergency Actions**
- ✅ **Disable non-critical features** (billing, analytics)
- ✅ **Use feature flags** for gradual rollback
- ✅ **Promote previous deployment** (safest option)
- ✅ **Temporarily disable webhooks** (if causing issues)

## 📋 Rollback Checklist

### **Pre-Rollback**
- [ ] **Assess impact**: How many users affected?
- [ ] **Choose method**: Promote previous vs feature flags
- [ ] **Prepare team**: Notify stakeholders
- [ ] **Document current state**: For post-mortem

### **During Rollback**
- [ ] **Execute rollback**: Use chosen method
- [ ] **Monitor health**: Watch for resolution
- [ ] **Test functionality**: Verify core features work
- [ ] **Update status**: Keep team informed

### **Post-Rollback**
- [ ] **Confirm stability**: No new errors
- [ ] **Investigate root cause**: Find what broke
- [ ] **Plan fix**: How to address the issue
- [ ] **Schedule review**: Learn from the incident

## 🎯 Success Criteria

### **Rollback Successful When**
- ✅ **Health endpoint returns 200**
- ✅ **Core user flows work**
- ✅ **No new error logs**
- ✅ **User impact resolved**
- ✅ **System stable for 15+ minutes**

### **Recovery Complete When**
- ✅ **Root cause identified and fixed**
- ✅ **Fix tested in preview environment**
- ✅ **Production deployment successful**
- ✅ **All features working normally**
- ✅ **Post-mortem completed**

---

## 📞 Quick Reference

| Action | Command | Expected Result |
|--------|---------|-----------------|
| **Health Check** | `npm run health` | 200 OK |
| **Billing Status** | `npm run billing` | JSON response |
| **Environment Check** | `npm run env:check` | All green |
| **Preflight Check** | `npm run preflight` | Build success |

**Remember**: When in doubt, **rollback first, investigate later**. User experience is more important than debugging in production. 