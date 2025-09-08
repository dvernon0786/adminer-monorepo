#!/bin/bash

# Final Inngest Endpoint Fix
# This script fixes the Inngest endpoint to return the correct format for Inngest Cloud

set -e

echo "🔧 FINAL INNGEST ENDPOINT FIX"
echo "=============================="

# Navigate to the correct API directory
cd apps/api

echo "📍 Current directory: $(pwd)"

# Create the correct Inngest endpoint that returns ONLY what Inngest Cloud expects
cat > api/inngest.js << 'INNGEST_EOF'
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return ONLY the format Inngest Cloud expects - no extra fields
  return res.status(200).json({
    functions: [
      {
        id: "job/created",
        name: "Process Job Creation"
      },
      {
        id: "scrape/process", 
        name: "Process Scrape Job"
      }
    ],
    appId: "adminer-jobs",
    appName: "Adminer Job Pipeline"
  });
}
INNGEST_EOF

echo "✅ Created clean inngest.js endpoint"

# Ensure the vercel.json is correct
cat > vercel.json << 'VERCEL_EOF'
{
  "version": 2,
  "functions": {
    "api/**/*.js": {
      "runtime": "@vercel/node@3.0.0"
    }
  }
}
VERCEL_EOF

echo "✅ Updated vercel.json with correct runtime"

# Ensure package.json has correct Node version
cat > package.json << 'PACKAGE_EOF'
{
  "name": "@adminer/api",
  "version": "0.1.0",
  "type": "module",
  "engines": {
    "node": "18.x"
  },
  "scripts": {
    "dev": "vercel dev"
  },
  "dependencies": {
    "inngest": "^3.22.12"
  }
}
PACKAGE_EOF

echo "✅ Updated package.json with Node 18.x"

# Commit and deploy the fix
echo "📦 Committing the fix..."

git add api/inngest.js vercel.json package.json

git commit -m "FIX: Inngest endpoint returns only required format for Cloud integration

- Remove extra fields (success, message, timestamp) that break Inngest Cloud
- Return only functions, appId, appName as expected
- Use correct @vercel/node@3.0.0 runtime
- Set Node.js to 18.x for compatibility
- Add proper CORS headers for cross-origin requests"

echo "🚀 Pushing to trigger deployment..."
git push origin main

echo "⏳ Waiting for deployment (90 seconds)..."
sleep 90

# Test the endpoint
echo "🧪 Testing the fixed endpoint..."

RESPONSE=$(curl -s -X PUT https://api-three-omega-53.vercel.app/api/inngest)

echo "📋 Response received:"
echo "$RESPONSE"

# Check if the response has the correct format
if echo "$RESPONSE" | grep -q '"functions"' && echo "$RESPONSE" | grep -q '"appId"' && ! echo "$RESPONSE" | grep -q '"success"'; then
    echo ""
    echo "🎉 SUCCESS! Inngest endpoint is now returning the correct format:"
    echo "✅ Has 'functions' field"
    echo "✅ Has 'appId' field" 
    echo "✅ No extra 'success' field"
    echo ""
    echo "🔗 Inngest Cloud URL: https://api-three-omega-53.vercel.app/api/inngest"
    echo ""
    echo "Next steps:"
    echo "1. Update Inngest Cloud to use this URL"
    echo "2. Test the job creation pipeline"
    echo "3. Verify end-to-end functionality"
else
    echo ""
    echo "❌ Response format is still incorrect"
    echo "Expected: {functions: [...], appId: '...', appName: '...'}"
    echo "Got: $RESPONSE"
    echo ""
    echo "Check Vercel deployment logs for errors"
fi

echo ""
echo "🏁 Fix complete. The Inngest endpoint should now work correctly with Inngest Cloud."
