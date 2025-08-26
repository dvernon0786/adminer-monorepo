#!/bin/bash
set -e

echo "Cache bust: $(date)"
rm -rf adminer/apps/web/dist adminer/apps/api/public/assets

# Unset Clerk environment variables
unset CLERK_FRONTEND_API CLERK_PROXY_URL

# Change to adminer directory and run build
cd adminer
npm run prebuild --workspace @adminer/api
npm run build --workspace @adminer/api
npm run spa:integrate --workspace @adminer/api

echo "Build completed successfully" 