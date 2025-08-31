#!/bin/bash
set -e

echo "🔒 VERIFYING VERCEL PROJECT LINKING"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check working directory
echo "📍 Checking working directory..."
if [[ ! -f "vercel.json" ]] || [[ ! -d "apps" ]]; then
    echo -e "${RED}❌ ERROR: Must run from adminer root directory${NC}"
    echo "Current directory: $(pwd)"
    echo "Expected: /path/to/ADminerFinal/adminer"
    echo ""
    echo "Solution: cd to the adminer directory first"
    exit 1
fi
echo -e "${GREEN}✅ Working directory: $(pwd)${NC}"

# Step 2: Check if Vercel project is linked
echo "🔗 Checking Vercel project linking..."
if [[ ! -f ".vercel/project.json" ]]; then
    echo -e "${RED}❌ ERROR: No Vercel project linked${NC}"
    echo ""
    echo "Solution: Run from adminer root directory:"
    echo "  vercel link --project adminer-monorepo-api"
    exit 1
fi
echo -e "${GREEN}✅ Vercel project linked${NC}"

# Step 3: Verify project ID
echo "🆔 Verifying project ID..."
LOCK_FILE=".vercel-lock.json"
if [[ ! -f "$LOCK_FILE" ]]; then
    echo -e "${YELLOW}⚠️  WARNING: No project lock file found${NC}"
    echo "Creating one now..."
    cat > "$LOCK_FILE" << 'EOF'
{
  "allowedProject": "adminer-monorepo-api",
  "allowedProjectId": "prj_RSTDkLR1HEMfLrbipoR9R5R2wkjf",
  "allowedDomain": "adminer.online",
  "workingDirectory": "adminer",
  "lastVerified": "2025-08-31T02:25:00Z"
}
EOF
fi

EXPECTED_PROJECT_ID=$(jq -r '.allowedProjectId' "$LOCK_FILE")
CURRENT_PROJECT_ID=$(jq -r '.projectId' .vercel/project.json 2>/dev/null || echo "none")

if [[ "$CURRENT_PROJECT_ID" != "$EXPECTED_PROJECT_ID" ]]; then
    echo -e "${RED}❌ ERROR: Wrong project linked${NC}"
    echo "Expected: $EXPECTED_PROJECT_ID (adminer-monorepo-api)"
    echo "Current: $CURRENT_PROJECT_ID"
    echo ""
    echo "Solution: Remove wrong link and relink:"
    echo "  rm -rf .vercel"
    echo "  vercel link --project adminer-monorepo-api"
    exit 1
fi
echo -e "${GREEN}✅ Project ID verified: $CURRENT_PROJECT_ID${NC}"

# Step 4: Verify project name
echo "📋 Verifying project name..."
PROJECT_NAME=$(jq -r '.name // "unknown"' .vercel/project.json 2>/dev/null || echo "unknown")
if [[ "$PROJECT_NAME" != "adminer-monorepo-api" ]]; then
    echo -e "${YELLOW}⚠️  WARNING: Project name mismatch${NC}"
    echo "Expected: adminer-monorepo-api"
    echo "Current: $PROJECT_NAME"
    echo "This might indicate a linking issue"
fi

# Step 5: Check for subdirectory .vercel files
echo "🔍 Checking for subdirectory Vercel links..."
SUBDIR_VERCEL=$(find . -name ".vercel" -type d | grep -v "^\./.vercel$" | head -1)
if [[ -n "$SUBDIR_VERCEL" ]]; then
    echo -e "${YELLOW}⚠️  WARNING: Found .vercel in subdirectory${NC}"
    echo "Location: $SUBDIR_VERCEL"
    echo "This can cause project linking confusion"
    echo ""
    echo "Recommendation: Remove subdirectory .vercel files:"
    echo "  find . -name '.vercel' -type d | grep -v '^\./.vercel$' | xargs rm -rf"
fi

echo ""
echo -e "${GREEN}🎯 PROJECT VALIDATION COMPLETED SUCCESSFULLY${NC}"
echo "✅ Working directory: $(pwd)"
echo "✅ Project linked: adminer-monorepo-api"
echo "✅ Project ID: $CURRENT_PROJECT_ID"
echo "✅ Ready for deployment to adminer.online" 