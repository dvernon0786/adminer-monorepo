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
