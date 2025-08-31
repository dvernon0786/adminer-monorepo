# 🚀 QUICK REFERENCE: Safe Vercel Operations

## 🚨 NEVER DO THIS
```bash
cd adminer                    # ❌ Wrong directory
vercel link --project adminer-monorepo-api  # ❌ Links wrong project
vercel --prod                # ❌ Deploys to wrong domain
```

## ✅ ALWAYS DO THIS
```bash
cd adminer/apps/api          # ✅ Start from deployment root
./../../scripts/verify-vercel-project.sh  # ✅ Validate first
./../../scripts/local-deploy.sh           # ✅ Deploy safely
```

## 🔒 Project Validation
```bash
# Quick check
./../../scripts/verify-vercel-project.sh

# Expected output:
# ✅ Working directory: /path/to/ADminerFinal/adminer/apps/api
# ✅ Project linked: adminer-monorepo-api
# ✅ Project ID: prj_RSTDkLR1HEMfLrbipoR9R5R2wkjf
# ✅ Ready for deployment to adminer.online
```

## 🚀 Safe Deployment Commands
```bash
# Automated (recommended)
./../../scripts/local-deploy.sh

# Manual validation
./../../scripts/verify-vercel-project.sh
vercel --prod
```

## 🛡️ Safety Guards
- **Project lock**: `../../.vercel-lock.json`
- **Validation**: `verify-vercel-project.sh`
- **Protection**: `guard-vercel.sh`
- **Automation**: `local-deploy.sh`

## 📍 Working Directory Rules
- **✅ Allowed**: `/adminer/apps/api` (deployment root)
- **❌ Blocked**: `/adminer` (root directory)

## 🔍 Verification Commands
```bash
# Check deployment status
vercel ls

# Verify bundle update
curl -s https://adminer.online/dashboard | grep -o 'index-[^"]*\.js'

# Test dashboard
open https://adminer.online/dashboard
```

## 🚨 Emergency Fixes
```bash
# Wrong project linked
rm -rf .vercel
vercel link --project adminer-monorepo-api

# Rate limit hit
# Wait 10-15 minutes, then retry

# Bundle mismatch
./../../scripts/local-deploy.sh  # Forces rebuild
``` 