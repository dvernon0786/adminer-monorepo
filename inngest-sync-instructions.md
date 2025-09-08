# 🔧 Inngest Cloud Sync Instructions

## Current Issue
Inngest Cloud is currently configured to sync with the wrong URL:
- **Current (Wrong)**: `https://adminer.online/api/inngest` 
- **Should Be**: `https://adminer-api.vercel.app/api/inngest`

## Fix Steps

### 1. Go to Inngest Cloud Dashboard
- Visit: https://app.inngest.com
- Login to your account

### 2. Find Your App
- Look for app: "adminer-jobs"
- Or create a new app if it doesn't exist

### 3. Update Sync URL
- Go to App Settings or Configuration
- Update the sync URL to: `https://adminer-api.vercel.app/api/inngest`
- Save the configuration

### 4. Test Sync
Run this command to test the sync:
```bash
curl -X PUT https://adminer-api.vercel.app/api/inngest
```

Expected response:
```json
{
  "success": true,
  "message": "Inngest app synced successfully",
  "appId": "adminer-jobs",
  "appName": "Adminer Job Pipeline",
  "functions": [...]
}
```

### 5. Verify in Dashboard
- Check that all 5 functions are visible:
  - job-created
  - quota-exceeded
  - subscription-updated
  - apify-run-completed
  - apify-run-failed

## Architecture Confirmation

✅ **Correct Setup**:
- Inngest endpoint: `adminer/apps/api/api/inngest.js` (correct location)
- API deployment: `adminer-api.vercel.app` (correct deployment)
- Function definitions: All 5 functions properly defined
- CORS configuration: Properly configured

❌ **Only Issue**: Inngest Cloud pointing to wrong URL
