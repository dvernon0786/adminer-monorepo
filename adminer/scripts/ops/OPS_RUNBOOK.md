# 🔧 Adminer Billing System - Ops Runbook

## 🚨 **Emergency Commands (Copy/Paste)**

### **0) Preflight Check**
```bash
bash scripts/smoke/preflight_check_simple.sh
```

### **1) System Health Check**
```bash
# 200 = good, 503 = degraded
curl -s -o /dev/null -w "%{http_code}\n" $BASE/api/admin/diagnostics

# See why degraded
curl -s $BASE/api/admin/diagnostics | jq '.checks[] | select(.ok==false)'
```

### **2) Preview Tonight's Impact**
```bash
curl -s $BASE/api/admin/diagnostics | jq '.checks[] | select(.name=="dry_run_candidates") | .details'
```

### **3) Emergency Stop (Feature Flag)**
```bash
# Vercel
vercel env pull && sed -i 's/BILLING_AUTODOWNGRADE_ENABLED=true/BILLING_AUTODOWNGRADE_ENABLED=false/' .env && vercel deploy

# Or flip in your secrets manager
# Set BILLING_AUTODOWNGRADE_ENABLED=false
```

### **4) Manual Downgrade (Admin Only)**
```bash
# Dry run first
curl -X POST "$BASE/api/admin/downgrade-canceled?dryRun=1" \
  -H "Authorization: Bearer YOUR_CLERK_JWT"

# Execute if confident
curl -X POST "$BASE/api/admin/downgrade-canceled" \
  -H "Authorization: Bearer YOUR_CLERK_JWT"
```

## 📊 **Daily Monitoring Commands**

### **System Status**
```bash
# Full diagnostics
curl -s $BASE/api/admin/diagnostics | jq .

# Just billing health
curl -s $BASE/api/admin/diagnostics | jq '.checks[] | select(.name | test("billing|dodo|dry_run")) | {name, ok, details}'
```

### **Audit Trail**
```bash
# Recent billing changes
curl -s $BASE/api/admin/diagnostics | jq '.checks[] | select(.name=="billing_audit_recent") | .details'

# Dry run candidates count
curl -s $BASE/api/admin/diagnostics | jq '.checks[] | select(.name=="dry_run_candidates") | .details.count'
```

## 🚀 **Deployment Commands**

### **Database Migrations**
```bash
# Run in order
psql "$DATABASE_URL" -f apps/api/scripts/create-tables.sql
psql "$DATABASE_URL" -f apps/api/scripts/2025-01-22_billing.sql
psql "$DATABASE_URL" -f apps/api/scripts/2025-08-22_add_current_period_end.sql
psql "$DATABASE_URL" -f apps/api/scripts/2025-08-22_billing_audit.sql
psql "$DATABASE_URL" -f apps/api/scripts/2025-08-22_billing_performance.sql
psql "$DATABASE_URL" -f apps/api/scripts/2025-08-22_billing_view.sql
```

### **Smoke Testing**
```bash
# Full smoke test
bash scripts/smoke/adminer_smoke.sh

# Quick health check
bash scripts/smoke/preflight_check_simple.sh
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Diagnostics Returning 503**
```bash
# Check which checks are failing
curl -s $BASE/api/admin/diagnostics | jq '.checks[] | select(.ok==false) | {name, error}'
```

#### **Inngest Function Not Running**
```bash
# Check Inngest dashboard
# Verify cron schedule: 30 21 * * * (21:30 UTC daily)
# Check feature flag: BILLING_AUTODOWNGRADE_ENABLED=true
```

#### **Database Connection Issues**
```bash
# Test connection
psql "$DATABASE_URL" -c "select now()"

# Check environment
echo $DATABASE_URL
```

### **Performance Issues**
```bash
# Check if indexes exist
psql "$DATABASE_URL" -c "select indexname from pg_indexes where tablename = 'orgs' and indexname like '%billing%';"

# Check view
psql "$DATABASE_URL" -c "select * from billing_downgrade_candidates limit 5;"
```

## 📋 **Alert Rules (Set in Your Monitoring)**

### **Critical Alerts**
- `dry_run_candidates.count > 0` for 3 consecutive days → Investigate billing issues
- `dodo_health.last_event == null` for 24h after go-live → Check webhook integration
- `billing_audit_recent.last_24h == 0` and `dry_run_candidates.count > 0` → Audit writes failing

### **Performance Alerts**
- Diagnostics response time > 5 seconds → Database performance issue
- Inngest function duration > 30 seconds → Downgrade process slow

## 🎯 **Success Metrics**

### **Green Indicators**
- ✅ All diagnostics checks passing (200 status)
- ✅ `dry_run_candidates.count` stable or decreasing
- ✅ `billing_audit_recent.last_24h` > 0 when candidates exist
- ✅ Inngest function completing successfully

### **Red Flags**
- ❌ Diagnostics returning 503
- ❌ `dry_run_candidates.count` increasing daily
- ❌ No audit trail entries for downgrades
- ❌ Inngest function failing or timing out

---

**Remember**: This system is designed to be boring in production. If you're getting alerts, something needs attention! 🚀 