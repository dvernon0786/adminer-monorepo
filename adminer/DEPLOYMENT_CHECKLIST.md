# 🚀 DEPLOYMENT CHECKLIST

## 🚨 CRITICAL: Never Deploy from Wrong Directory

**❌ WRONG - Never do this:**
```bash
cd adminer/apps/api
vercel link --project adminer-monorepo-api  # WRONG!
vercel --prod                              # WRONG!
```

**✅ CORRECT - Always do this:**
```bash
cd adminer                                 # Start from root
./scripts/verify-vercel-project.sh         # Validate first
./scripts/local-deploy.sh                  # Deploy safely
```

## 🔒 Pre-Deployment Validation

### Step 1: Working Directory Check
- [ ] **Current directory**: `/path/to/ADminerFinal/adminer`
- [ ] **Files present**: `vercel.json`, `apps/` directory
- [ ] **NOT in subdirectory**: Never run from `apps/api/` or `apps/web/`

### Step 2: Project Linking Verification
- [ ] **Project linked**: `adminer-monorepo-api`
- [ ] **Project ID**: `prj_RSTDkLR1HEMfLrbipoR9R5R2wkjf`
- [ ] **Domain target**: `adminer.online`
- [ ] **Validation script**: `./scripts/verify-vercel-project.sh` passes

### Step 3: Build Preparation
- [ ] **Frontend built**: `apps/web/dist/` contains latest build
- [ ] **Bundle sync**: HTML and JS bundles match
- [ ] **API routes**: Native Vercel API routes present

## 🚀 Deployment Process

### Option A: Automated Deployment (Recommended)
```bash
cd adminer
./scripts/local-deploy.sh
```

### Option B: Manual Step-by-Step
```bash
cd adminer

# 1. Validate project
./scripts/verify-vercel-project.sh

# 2. Build frontend
cd apps/web
npm ci && npm run build
cd ../..

# 3. Copy to API
cd apps/api
rm -rf public && mkdir -p public
cp -r ../web/dist/* public/
cd ../..

# 4. Deploy
vercel --prod
```

## ✅ Post-Deployment Verification

### Step 1: Check Deployment Status
```bash
vercel ls
# Should show latest deployment as "Ready"
```

### Step 2: Verify Bundle Update
```bash
curl -s https://adminer.online/dashboard | grep -o 'index-[^"]*\.js'
# Should show NEW bundle hash, not old one
```

### Step 3: Test Dashboard
- [ ] **URL**: `https://adminer.online/dashboard`
- [ ] **Status**: Dashboard loads (not blank screen)
- [ ] **Bundle**: JavaScript loads without 404 errors

## 🛡️ Safety Guards

### Project Lock File
- **Location**: `.vercel-lock.json`
- **Purpose**: Prevents linking to wrong projects
- **Auto-creation**: Scripts will create if missing

### Validation Scripts
- **`verify-vercel-project.sh`**: Validates project linking
- **`guard-vercel.sh`**: Prevents Vercel commands from wrong directories
- **`local-deploy.sh`**: Safe deployment with validation

### Directory Enforcement
- **Root only**: Vercel commands only work from `adminer/` directory
- **Subdirectory blocking**: Scripts prevent deployment from `apps/api/` or `apps/web/`

## 🚨 Troubleshooting

### Wrong Project Linked
```bash
# Remove wrong link
rm -rf .vercel

# Link to correct project
vercel link --project adminer-monorepo-api

# Verify
./scripts/verify-vercel-project.sh
```

### Rate Limit Hit
```bash
# Wait for reset (usually 10-15 minutes)
# Check status
vercel ls

# Try deployment again
./scripts/local-deploy.sh
```

### Bundle Mismatch
```bash
# Force rebuild
cd apps/web
npm run build
cd ../..

# Copy to API
cd apps/api
rm -rf public && mkdir -p public
cp -r ../web/dist/* public/
cd ../..

# Deploy
vercel --prod
```

## 📚 Key Principles

1. **Always start from root**: `cd adminer`
2. **Validate before deploy**: Run verification scripts
3. **Use automation**: Prefer `./scripts/local-deploy.sh`
4. **Check results**: Verify bundle updates and dashboard functionality
5. **Document issues**: Update this checklist with new problems/solutions

## 🔗 Related Scripts

- **`scripts/verify-vercel-project.sh`**: Project validation
- **`scripts/guard-vercel.sh`**: Command protection
- **`scripts/local-deploy.sh`**: Safe deployment
- **`scripts/local-atomic-build.sh`**: Frontend build 