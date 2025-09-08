# 🔧 Fix Inngest Vercel Integration Error

## Error: "An error occurred while creating the account-purple-garden"

This error occurs when trying to install the Inngest integration in Vercel. Here are the solutions:

## Solution 1: Manual Setup (Recommended)

Instead of using the Vercel integration, set up Inngest manually:

### Step 1: Create Inngest Account
1. Go to: https://app.inngest.com
2. Sign up or log in to your account
3. Create a new app or use existing

### Step 2: Get Your Keys
1. In Inngest Cloud dashboard, go to Settings
2. Copy your Event Key and Signing Key
3. Note them down for Vercel environment variables

### Step 3: Set Vercel Environment Variables
In your Vercel project settings, add:
```
INNGEST_EVENT_KEY=your_event_key_here
INNGEST_SIGNING_KEY=your_signing_key_here
```

### Step 4: Sync Your App
1. Go to Inngest Cloud dashboard
2. Click "Sync new app"
3. Use URL: `https://adminer-api.vercel.app/api/inngest`
4. Wait for sync to complete

## Solution 2: Fix Vercel Integration

If you want to use the Vercel integration:

### Step 1: Check Vercel Project Settings
1. Go to your Vercel project dashboard
2. Check if there are any conflicting integrations
3. Remove any existing Inngest integrations

### Step 2: Clear Browser Cache
1. Clear your browser cache and cookies
2. Try the integration installation again

### Step 3: Try Different Browser
1. Use an incognito/private window
2. Or try a different browser entirely

### Step 4: Check Vercel Account Permissions
1. Ensure your Vercel account has proper permissions
2. Check if there are any account-level restrictions

## Solution 3: Alternative Setup

### Use Direct Inngest Cloud Setup
1. Skip the Vercel integration entirely
2. Set up Inngest directly through their cloud platform
3. Use manual sync as described in Solution 1

## Verification Steps

### 1. Test API Endpoint
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

## Common Issues and Solutions

### Issue: "Account creation failed"
- **Solution**: Try creating Inngest account directly at app.inngest.com
- **Alternative**: Use existing Inngest account if you have one

### Issue: "Integration already exists"
- **Solution**: Remove existing integration and try again
- **Check**: Look for conflicting integrations in Vercel

### Issue: "Permission denied"
- **Solution**: Check Vercel account permissions
- **Alternative**: Use manual setup instead of integration

### Issue: "Environment variables missing"
- **Solution**: Set INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY in Vercel
- **Check**: Verify variables are set for the correct environment

## Recommended Approach

**Use Solution 1 (Manual Setup)** because:
- ✅ More reliable than Vercel integration
- ✅ Full control over configuration
- ✅ Easier to troubleshoot
- ✅ Works with existing API endpoint

## Next Steps

1. **Skip the Vercel integration** for now
2. **Set up Inngest manually** using Solution 1
3. **Test the sync** with your existing API endpoint
4. **Verify everything works** before trying integration again

The API endpoint is already working correctly, so manual setup should resolve the issue immediately.
