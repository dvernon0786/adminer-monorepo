# 🔧 Complete Inngest Sync Fix Guide

## 🎯 Problem Summary
Inngest Cloud is currently configured to sync with the wrong URL:
- **Current (Wrong)**: `https://adminer.online/api/inngest` 
- **Should Be**: `https://adminer-api.vercel.app/api/inngest`

## ✅ Verification Complete
- ✅ API endpoint verified: `https://adminer-api.vercel.app/api/inngest`
- ✅ Sync endpoint tested and working
- ✅ All 5 functions properly defined
- ✅ CORS configuration correct

## 🔧 Manual Fix Required

### Step 1: Access Inngest Cloud Dashboard
1. Go to: https://app.inngest.com
2. Login to your account
3. Navigate to your apps/projects

### Step 2: Find Your App
Look for one of these:
- App name: "adminer-jobs"
- App ID: "adminer-jobs"
- Or create a new app if none exists

### Step 3: Update Sync URL
1. Go to **App Settings** or **Configuration**
2. Find the **Sync URL** or **Serve URL** field
3. Update it to: `https://adminer-api.vercel.app/api/inngest`
4. **Save** the configuration

### Step 4: Test the Sync
Run this command to verify the sync works:
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

### Step 5: Verify in Dashboard
After updating the URL, check that all 5 functions are visible:
- `job-created` - Job Created Handler
- `quota-exceeded` - Quota Exceeded Handler
- `subscription-updated` - Subscription Updated Handler
- `apify-run-completed` - Apify Run Completed Handler
- `apify-run-failed` - Apify Run Failed Handler

## 🧪 Testing Your Fix

### Test 1: Sync Command
```bash
curl -X PUT https://adminer-api.vercel.app/api/inngest
```

### Test 2: Health Check
```bash
curl -X GET https://adminer-api.vercel.app/api/inngest
```

### Test 3: Create Test Job
```bash
curl -X POST https://adminer-api.vercel.app/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"keyword":"test keyword","limit":5}'
```

## 🏗️ Architecture Confirmation

✅ **Correct Setup**:
- Inngest endpoint: `adminer/apps/api/api/inngest.js` (correct location)
- API deployment: `adminer-api.vercel.app` (correct deployment)
- Function definitions: All 5 functions properly defined
- CORS configuration: Properly configured

❌ **Only Issue**: Inngest Cloud pointing to wrong URL

## 🚨 Troubleshooting

### If sync still fails:
1. Check that the URL is exactly: `https://adminer-api.vercel.app/api/inngest`
2. Verify no trailing slashes or extra characters
3. Test the URL in a browser first
4. Check Vercel deployment status

### If functions don't appear:
1. Wait 1-2 minutes after updating the URL
2. Try triggering a re-sync in the dashboard
3. Check the Inngest Cloud logs for errors
4. Verify environment variables are set correctly

## 📞 Support
If you continue to have issues:
1. Check Inngest Cloud dashboard logs
2. Verify Vercel function logs
3. Test with the provided curl commands
4. Contact Inngest support if needed
