# 🔄 Inngest App Sync Instructions

## Current Status
- ✅ **API Endpoint**: Working correctly
- ✅ **Sync Endpoint**: Responding with function definitions
- ✅ **Functions**: 5 functions properly defined
- ❌ **Inngest Cloud**: App not synced

## Step-by-Step Sync Process

### Method 1: Create New App (Recommended)

1. **Go to Inngest Cloud Dashboard**
   - Visit: https://app.inngest.com
   - Login to your account

2. **Create New App**
   - Click "Create App" or "New App"
   - App Name: `adminer-jobs`
   - Environment: `Production`

3. **Configure Sync URL**
   - Set Sync URL to: `https://adminer-api.vercel.app/api/inngest`
   - Click "Save" or "Create"

4. **Verify Sync**
   - Wait 1-2 minutes
   - Check that functions appear in the dashboard
   - You should see 5 functions:
     - job-created
     - quota-exceeded
     - subscription-updated
     - apify-run-completed
     - apify-run-failed

### Method 2: Update Existing App

1. **Go to Inngest Cloud Dashboard**
   - Visit: https://app.inngest.com
   - Login to your account

2. **Find Your App**
   - Look for app: "adminer-jobs"
   - Or any existing app you want to use

3. **Update Sync URL**
   - Go to App Settings or Configuration
   - Find "Sync URL" or "Serve URL" field
   - Update to: `https://adminer-api.vercel.app/api/inngest`
   - Click "Save"

4. **Trigger Re-sync**
   - Look for "Sync" or "Re-sync" button
   - Click it to trigger immediate sync
   - Wait 1-2 minutes

### Method 3: Manual Sync via API

If the dashboard doesn't work, try manual sync:

```bash
# Test the sync endpoint
curl -X PUT https://adminer-api.vercel.app/api/inngest

# Expected response:
{
  "success": true,
  "message": "Inngest app synced successfully",
  "appId": "adminer-jobs",
  "appName": "Adminer Job Pipeline",
  "functions": [...]
}
```

## Troubleshooting

### If sync still fails:

1. **Check URL Format**
   - Ensure URL is exactly: `https://adminer-api.vercel.app/api/inngest`
   - No trailing slashes or extra characters

2. **Test URL in Browser**
   - Open: https://adminer-api.vercel.app/api/inngest
   - Should return JSON response

3. **Check Vercel Deployment**
   - Verify adminer-api is deployed and running
   - Check Vercel function logs for errors

4. **Environment Variables**
   - Ensure INNGEST_SIGNING_KEY is set in Vercel
   - Check that all required env vars are configured

### Common Issues:

- **Wrong URL**: Make sure you're using `adminer-api.vercel.app` not `adminer.online`
- **CORS Issues**: The endpoint has CORS configured, should work
- **Authentication**: Some Inngest Cloud features may require authentication
- **Timing**: Wait 1-2 minutes after updating URL before checking

## Verification

After syncing, you should see:

1. **In Inngest Cloud Dashboard**:
   - App name: "adminer-jobs"
   - 5 functions listed
   - Functions show as "Active" or "Ready"

2. **Test Job Creation**:
   ```bash
   curl -X POST https://adminer-api.vercel.app/api/jobs \
     -H "Content-Type: application/json" \
     -d '{"keyword":"test keyword","limit":5}'
   ```

3. **Check Function Runs**:
   - Go to "Runs" tab in Inngest dashboard
   - Should see function executions when jobs are created

## Support

If you continue to have issues:
1. Check Inngest Cloud dashboard logs
2. Verify Vercel function logs
3. Test with the provided curl commands
4. Contact Inngest support if needed
