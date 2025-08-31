#!/bin/bash
set -e

echo "🛡️  VERCEL COMMAND GUARD"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory (adminer/apps/api)
if [[ ! -f "vercel.json" ]] || [[ ! -d "public" ]]; then
    echo -e "${RED}❌ BLOCKED: Vercel command from wrong directory${NC}"
    echo ""
    echo "Current directory: $(pwd)"
    echo "Expected: /path/to/ADminerFinal/adminer/apps/api"
    echo ""
    echo "🚨 SECURITY: Vercel commands can only run from adminer/apps/api directory"
    echo "This prevents linking to wrong projects and deploying to wrong domains."
    echo ""
    echo "Solution:"
    echo "  cd /path/to/ADminerFinal/adminer/apps/api"
    echo "  Then run your Vercel command"
    exit 1
fi

# Check if we have a project lock file
LOCK_FILE="../../.vercel-lock.json"
if [[ ! -f "$LOCK_FILE" ]]; then
    echo -e "${YELLOW}⚠️  WARNING: No project lock file found${NC}"
    echo "Creating one now..."
    cat > "$LOCK_FILE" << 'EOF'
{
  "allowedProject": "adminer-monorepo-api",
  "allowedProjectId": "prj_RSTDkLR1HEMfLrbipoR9R5R2wkjf",
  "allowedDomain": "adminer.online",
  "workingDirectory": "adminer/apps/api",
  "lastVerified": "2025-08-31T02:35:00Z"
}
EOF
fi

echo -e "${GREEN}✅ Vercel command allowed from correct directory${NC}"
echo "📍 Working directory: $(pwd)"
echo "🔒 Project lock file: ../../.vercel-lock.json"
echo "🎯 Target project: adminer-monorepo-api"
echo "🌐 Target domain: adminer.online" 