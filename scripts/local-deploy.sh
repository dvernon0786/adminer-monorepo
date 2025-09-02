#!/bin/bash
set -e

echo "🚀 LOCAL DEPLOYMENT WITH ATOMIC BUILD"

# Step 1: Run atomic build
echo "🔒 Running atomic build..."
cd adminer/apps/api
npm run build

# Step 2: Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Local deployment completed with atomic build!"
echo "🌐 Check your dashboard at: https://adminer.online/dashboard" 