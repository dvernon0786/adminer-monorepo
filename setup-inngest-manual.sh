#!/bin/bash

# Quick manual Inngest setup script
echo "🔧 Manual Inngest Setup"
echo "======================="
echo ""

echo "1. Go to Inngest Cloud Dashboard:"
echo "   https://app.inngest.com"
echo ""

echo "2. Create account or log in"
echo ""

echo "3. Get your keys from Settings:"
echo "   - Event Key (INNGEST_EVENT_KEY)"
echo "   - Signing Key (INNGEST_SIGNING_KEY)"
echo ""

echo "4. Set Vercel environment variables:"
echo "   - Go to your Vercel project settings"
echo "   - Add INNGEST_EVENT_KEY"
echo "   - Add INNGEST_SIGNING_KEY"
echo ""

echo "5. Sync your app:"
echo "   - In Inngest Cloud, click 'Sync new app'"
echo "   - Use URL: https://adminer-api.vercel.app/api/inngest"
echo ""

echo "6. Test the setup:"
echo "   curl -X PUT https://adminer-api.vercel.app/api/inngest"
echo ""

echo "✅ This bypasses the Vercel integration error completely!"
