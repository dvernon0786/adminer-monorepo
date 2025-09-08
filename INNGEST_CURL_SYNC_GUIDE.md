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
