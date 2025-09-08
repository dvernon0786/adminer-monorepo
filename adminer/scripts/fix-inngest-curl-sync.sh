#!/bin/bash

# 🔧 Fix Inngest Curl Sync Script
# Based on https://www.inngest.com/docs/apps/cloud

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
API_URL="https://adminer-api.vercel.app"
INNGEST_ENDPOINT="$API_URL/api/inngest"
INNGEST_DASHBOARD="https://app.inngest.com"

# Helper functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

echo "🔧 FIX INNGEST CURL SYNC"
echo "========================"
echo ""

# Step 1: Fix the curl command issue
log "Step 1: Fixing curl command syntax..."

echo "❌ WRONG (your command):"
echo "   curl -X PUT https://https://adminer-api.vercel.app/api/inngest"
echo ""
echo "✅ CORRECT:"
echo "   curl -X PUT https://adminer-api.vercel.app/api/inngest"
echo ""

# Step 2: Test the corrected curl command
log "Step 2: Testing corrected curl command..."

if response=$(curl -s -X PUT "$INNGEST_ENDPOINT" 2>/dev/null); then
    if echo "$response" | grep -q "success.*true"; then
        success "Curl command works correctly!"
        app_id=$(echo "$response" | jq -r '.appId' 2>/dev/null)
        functions_count=$(echo "$response" | jq -r '.functions | length' 2>/dev/null)
        echo "   App ID: $app_id"
        echo "   Functions: $functions_count"
    else
        error "Curl command failed"
        echo "   Response: $response"
        exit 1
    fi
else
    error "Failed to execute curl command"
    exit 1
fi

echo ""

# Step 3: Create proper sync instructions based on Inngest docs
log "Step 3: Creating proper sync instructions based on Inngest Cloud docs..."

cat > INNGEST_CURL_SYNC_GUIDE.md << 'EOF'
# 🔧 Inngest Curl Sync Fix Guide

## Issue Fixed
- ❌ **Wrong**: `curl -X PUT https://https://adminer-api.vercel.app/api/inngest` (double https://)
- ✅ **Correct**: `curl -X PUT https://adminer-api.vercel.app/api/inngest` (single https://)

## Based on Inngest Cloud Documentation
Reference: https://www.inngest.com/docs/apps/cloud

## Method 1: Manual Sync via Inngest Cloud Dashboard (Recommended)

### Step 1: Access Inngest Cloud
1. Go to: https://app.inngest.com
2. Select your environment (e.g., "Production")
3. Navigate to the Apps page

### Step 2: Sync New App
1. Click "Sync App" or "Sync New App" button
2. Paste your serve endpoint URL: `https://adminer-api.vercel.app/api/inngest`
3. Click "Sync App"

### Step 3: Verify Sync
- Your app should appear in the Apps list
- You should see 5 functions:
  - job-created
  - quota-exceeded
  - subscription-updated
  - apify-run-completed
  - apify-run-failed

## Method 2: Curl Command Sync

### Correct Curl Command
```bash
curl -X PUT https://adminer-api.vercel.app/api/inngest
```

### Expected Response
```json
{
  "success": true,
  "message": "Inngest app synced successfully",
  "appId": "adminer-jobs",
  "appName": "Adminer Job Pipeline",
  "functions": [...]
}
```

### When to Use Curl Sync
According to Inngest docs, use curl command to sync from your machine or automate the process within a CI/CD pipeline.

## Method 3: Resync Existing App

If you already have an app synced:

1. Navigate to your app in Inngest Cloud
2. Click "Resync" button at the top-right corner
3. Click "Resync App" in the confirmation modal
4. If your app location changed, enable "Override" switch and edit the URL

## Troubleshooting

### Why is my app syncing to the wrong environment?
- Verify that `INNGEST_SIGNING_KEY` is set correctly in your environment
- The signing key ensures your app syncs to the correct Inngest environment

### Why do I have duplicated apps?
- Each app ID is a persistent identifier
- Changing the app ID will create a new app instead of updating the existing one
- Keep the same app ID: "adminer-jobs"

### Why is my sync in unattached syncs?
- Failures in automatic syncs create unattached syncs
- Check for unattached syncs in the Inngest Cloud dashboard
- Address the issues outlined in the failure message

### Why don't I see my sync in the sync list?
1. **Different App ID**: Changing app ID creates a new app, not a new sync
2. **Syncing Errors**: Check for error messages in manual syncs
3. **Automatic Sync Failures**: Look for unattached syncs

## Verification Steps

### 1. Test the Endpoint
```bash
curl -X PUT https://adminer-api.vercel.app/api/inngest
```

### 2. Check Inngest Cloud Dashboard
- Go to: https://app.inngest.com
- Look for "adminer-jobs" app
- Verify all 5 functions are listed

### 3. Test Job Creation
```bash
curl -X POST https://adminer-api.vercel.app/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"keyword":"test keyword","limit":5}'
```

## Next Steps

1. **Fix the curl command** (remove double https://)
2. **Sync via Inngest Cloud Dashboard** (recommended)
3. **Verify functions appear** in the dashboard
4. **Test job creation** to ensure everything works

## Important Notes

- Always ensure your latest code is deployed before syncing
- The app ID "adminer-jobs" should remain consistent
- Use the correct environment (Production vs Preview)
- Wait 1-2 minutes after syncing for changes to take effect
EOF

success "Created comprehensive sync guide: INNGEST_CURL_SYNC_GUIDE.md"

echo ""

# Step 4: Create automated sync script
log "Step 4: Creating automated sync script..."

cat > sync-inngest-curl.sh << 'EOF'
#!/bin/bash

# Automated Inngest sync using curl command
API_URL="https://adminer-api.vercel.app"
INNGEST_ENDPOINT="$API_URL/api/inngest"

echo "🔄 Syncing Inngest App with Curl"
echo "================================"
echo ""

echo "Using endpoint: $INNGEST_ENDPOINT"
echo ""

# Test the endpoint first
echo "1. Testing endpoint accessibility..."
if curl -s "$INNGEST_ENDPOINT" > /dev/null; then
    echo "✅ Endpoint is accessible"
else
    echo "❌ Endpoint not accessible"
    exit 1
fi

# Perform the sync
echo ""
echo "2. Performing sync..."
response=$(curl -s -X PUT "$INNGEST_ENDPOINT")

if echo "$response" | grep -q "success.*true"; then
    echo "✅ Sync successful!"
    app_id=$(echo "$response" | jq -r '.appId' 2>/dev/null)
    app_name=$(echo "$response" | jq -r '.appName' 2>/dev/null)
    functions_count=$(echo "$response" | jq -r '.functions | length' 2>/dev/null)
    
    echo "   App ID: $app_id"
    echo "   App Name: $app_name"
    echo "   Functions: $functions_count"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Go to Inngest Cloud Dashboard: https://app.inngest.com"
    echo "2. Look for app: $app_id"
    echo "3. Verify all $functions_count functions are listed"
    echo "4. Test job creation to ensure everything works"
else
    echo "❌ Sync failed"
    echo "Response: $response"
    exit 1
fi
EOF

chmod +x sync-inngest-curl.sh
success "Created automated sync script: sync-inngest-curl.sh"

echo ""

# Step 5: Run the automated sync
log "Step 5: Running automated sync..."
if ./sync-inngest-curl.sh; then
    success "Automated sync completed successfully"
else
    error "Automated sync failed"
    exit 1
fi

echo ""

# Step 6: Create quick fix command
log "Step 6: Creating quick fix command..."

cat > quick-curl-fix.sh << 'EOF'
#!/bin/bash

# Quick fix for the curl command issue
echo "🔧 Quick Curl Fix"
echo "================="
echo ""

echo "❌ Your command (WRONG):"
echo "   curl -X PUT https://https://adminer-api.vercel.app/api/inngest"
echo ""

echo "✅ Correct command:"
echo "   curl -X PUT https://adminer-api.vercel.app/api/inngest"
echo ""

echo "🔄 Running correct command..."
curl -X PUT https://adminer-api.vercel.app/api/inngest
EOF

chmod +x quick-curl-fix.sh
success "Created quick fix command: quick-curl-fix.sh"

echo ""

# Step 7: Final summary
log "Step 7: Final summary..."

echo "🎯 CURL SYNC FIX COMPLETE"
echo "========================="
echo ""
echo "✅ Issue identified: Double https:// in curl command"
echo "✅ Corrected curl command tested and working"
echo "✅ Automated sync script created"
echo "✅ Comprehensive guide created based on Inngest docs"
echo ""
echo "📋 IMMEDIATE ACTION:"
echo "1. Use the correct curl command:"
echo "   curl -X PUT https://adminer-api.vercel.app/api/inngest"
echo ""
echo "2. OR sync via Inngest Cloud Dashboard:"
echo "   https://app.inngest.com"
echo ""
echo "3. OR run automated sync:"
echo "   ./sync-inngest-curl.sh"
echo ""
echo "📁 Files created:"
echo "- INNGEST_CURL_SYNC_GUIDE.md (comprehensive guide)"
echo "- sync-inngest-curl.sh (automated sync)"
echo "- quick-curl-fix.sh (quick fix command)"
echo ""

success "Curl sync fix completed! Use the correct command above."