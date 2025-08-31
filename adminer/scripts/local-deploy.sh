#!/bin/bash
set -e

echo "🚀 LOCAL DEPLOYMENT WITH PROJECT VALIDATION"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verify working directory and project linking
echo "🔒 Validating project configuration..."
if [[ ! -f "scripts/verify-vercel-project.sh" ]]; then
    echo -e "${RED}❌ ERROR: Must run from adminer root directory${NC}"
    echo "Current directory: $(pwd)"
    echo "Expected: /path/to/ADminerFinal/adminer"
    exit 1
fi

# Run project validation
./scripts/verify-vercel-project.sh

# Step 2: Run atomic build
echo "🔒 Running atomic build..."
cd apps/api
npm run build:atomic

# Step 3: Deploy to Vercel
echo "🚀 Deploying to Vercel..."
cd ../..
vercel --prod

echo ""
echo -e "${GREEN}✅ Local deployment completed with project validation!${NC}"
echo "🌐 Check your dashboard at: https://adminer.online/dashboard"
echo ""
echo "🔍 To verify deployment:"
echo "  curl -s https://adminer.online/dashboard | grep -o 'index-[^"]*\.js'" 