#!/bin/bash
set -e

echo "Cache bust: $(date)"

# Unset Clerk environment variables
unset CLERK_FRONTEND_API CLERK_PROXY_URL

# Change to root directory (where package.json is located)
cd ../..

# Clean cache directories
rm -rf adminer/apps/web/dist adminer/apps/api/public/assets

# Run build commands from root
npm run prebuild --workspace @adminer/api
npm run build --workspace @adminer/api
npm run spa:integrate --workspace @adminer/api

echo "Build completed successfully" 