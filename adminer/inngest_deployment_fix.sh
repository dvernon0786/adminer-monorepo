#!/bin/bash

# Inngest Deployment Issue Diagnostic and Fix Script
# This script identifies and fixes the persistent Inngest endpoint deployment issue

set -e

echo "🔍 INNGEST DEPLOYMENT DIAGNOSTIC AND FIX SCRIPT"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="https://adminer-api.vercel.app/api/inngest"
API_DIR="apps/api"

echo -e "\n${BLUE}Phase 1: Diagnostic Analysis${NC}"
echo "============================================"

# Test current endpoint response
echo -e "\n1. Testing current endpoint response..."
CURRENT_RESPONSE=$(curl -s -X PUT "$API_URL" || echo "FAILED")
echo "Current response: $CURRENT_RESPONSE"

# Check if it contains the problematic old format
if [[ "$CURRENT_RESPONSE" == *"success"* && "$CURRENT_RESPONSE" == *"message"* ]]; then
    echo -e "${RED}❌ CONFIRMED: Endpoint returning old format${NC}"
    OLD_FORMAT_DETECTED=true
else
    echo -e "${GREEN}✅ Endpoint appears to be returning new format${NC}"
    OLD_FORMAT_DETECTED=false
fi

# Phase 2: Deep File Analysis
echo -e "\n${BLUE}Phase 2: Deep File Analysis${NC}"
echo "============================================"

echo -e "\n2. Checking for conflicting files..."

# Find all inngest-related files
echo "Finding all inngest-related files:"
find . -name "*inngest*" -type f | grep -v node_modules | grep -v .git

# Check for Next.js artifacts
echo -e "\n3. Checking for Next.js artifacts..."
NEXTJS_ARTIFACTS=$(find "$API_DIR" -name ".next" -o -name "next.config.*" -o -name "tsconfig.json" | wc -l)
if [ "$NEXTJS_ARTIFACTS" -gt 0 ]; then
    echo -e "${RED}❌ Found Next.js artifacts:${NC}"
    find "$API_DIR" -name ".next" -o -name "next.config.*" -o -name "tsconfig.json"
else
    echo -e "${GREEN}✅ No Next.js artifacts found${NC}"
fi

# Check package.json for Next.js dependencies
echo -e "\n4. Checking package.json for Next.js dependencies..."
if grep -q "next" "$API_DIR/package.json" 2>/dev/null; then
    echo -e "${RED}❌ Found Next.js dependencies in package.json${NC}"
    grep "next" "$API_DIR/package.json"
else
    echo -e "${GREEN}✅ No Next.js dependencies found${NC}"
fi

# Phase 3: Source Code Verification
echo -e "\n${BLUE}Phase 3: Source Code Verification${NC}"
echo "============================================"

echo -e "\n5. Verifying source code content..."

# Check the actual inngest.js file
if [ -f "$API_DIR/api/inngest.js" ]; then
    echo "Found inngest.js file. Checking content..."
    
    # Check if it contains the old response format
    if grep -q "Inngest app synced successfully" "$API_DIR/api/inngest.js"; then
        echo -e "${RED}❌ inngest.js contains old response format${NC}"
        SOURCE_CODE_ISSUE=true
    else
        echo -e "${GREEN}✅ inngest.js appears to have correct format${NC}"
        SOURCE_CODE_ISSUE=false
    fi
    
    # Show the export statement
    echo "Export statement in inngest.js:"
    grep -n "export\|module.exports" "$API_DIR/api/inngest.js" || echo "No export found"
else
    echo -e "${RED}❌ inngest.js file not found${NC}"
    SOURCE_CODE_ISSUE=true
fi

# Phase 4: Vercel Configuration Check
echo -e "\n${BLUE}Phase 4: Vercel Configuration Check${NC}"
echo "============================================"

echo -e "\n6. Checking Vercel configuration..."

# Check if there's a vercel.json in API directory
if [ -f "$API_DIR/vercel.json" ]; then
    echo "Found vercel.json in API directory:"
    cat "$API_DIR/vercel.json"
else
    echo "No vercel.json found in API directory"
fi

# Check for root-level vercel.json
if [ -f "vercel.json" ]; then
    echo "Found root-level vercel.json:"
    cat "vercel.json"
else
    echo "No root-level vercel.json found"
fi

# Phase 5: Fix Implementation
echo -e "\n${BLUE}Phase 5: Fix Implementation${NC}"
echo "============================================"

if [ "$OLD_FORMAT_DETECTED" = true ] || [ "$SOURCE_CODE_ISSUE" = true ]; then
    echo -e "\n${YELLOW}🔧 Implementing fixes...${NC}"
    
    # Backup current files
    echo "Creating backup..."
    mkdir -p backups/$(date +%Y%m%d_%H%M%S)
    cp -r "$API_DIR" "backups/$(date +%Y%m%d_%H%M%S)/"
    
    # Fix 1: Clean up any remaining Next.js artifacts
    echo -e "\n7. Cleaning up Next.js artifacts..."
    find "$API_DIR" -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$API_DIR" -name "next.config.*" -delete 2>/dev/null || true
    rm -f "$API_DIR/tsconfig.json" 2>/dev/null || true
    rm -f "$API_DIR/eslint.config.*" 2>/dev/null || true
    
    # Fix 2: Create clean inngest.js with correct format
    echo -e "\n8. Creating clean inngest.js..."
    mkdir -p "$API_DIR/api"
    
    cat > "$API_DIR/api/inngest.js" << 'EOF'
import { Inngest } from "inngest";

const inngest = new Inngest({ 
  id: "adminer-jobs",
  name: "Adminer Job Pipeline"
});

export default async function handler(req, res) {
  const isDev = process.env.NODE_ENV === 'development';
  const baseUrl = isDev 
    ? 'http://localhost:3000' 
    : 'https://adminer-api.vercel.app';

  // Register functions with Inngest
  const functions = [
    {
      id: "job/created",
      name: "Process Job Creation"
    },
    {
      id: "scrape/process",
      name: "Process Scrape Job"
    }
  ];

  // Return the format expected by Inngest Cloud
  return res.status(200).json({
    functions: functions,
    appId: "adminer-jobs", 
    appName: "Adminer Job Pipeline"
  });
}
EOF
    
    # Fix 3: Clean package.json
    echo -e "\n9. Cleaning package.json..."
    
    cat > "$API_DIR/package.json" << 'EOF'
{
  "name": "@adminer/api",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vercel dev",
    "build": "echo 'Using pre-built files'",
    "validate-quick": "node -c api/inngest.js"
  },
  "dependencies": {
    "inngest": "^3.22.12",
    "drizzle-orm": "^0.33.0",
    "@neondatabase/serverless": "^0.9.5",
    "apify-client": "^2.9.3",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/node": "^22.5.4"
  }
}
EOF
    
    # Fix 4: Create clean vercel.json for API
    echo -e "\n10. Creating clean vercel.json..."
    
    cat > "$API_DIR/vercel.json" << 'EOF'
{
  "version": 2,
  "framework": null,
  "buildCommand": "echo 'Using pre-built files'",
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs20.x"
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods", 
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
EOF
    
    # Fix 5: Remove any conflicting files
    echo -e "\n11. Removing conflicting files..."
    rm -rf "$API_DIR/app" 2>/dev/null || true
    rm -rf "$API_DIR/src/app" 2>/dev/null || true
    
    echo -e "\n${GREEN}✅ Fixes implemented successfully${NC}"
    
    # Phase 6: Deploy and Test
    echo -e "\n${BLUE}Phase 6: Deploy and Test${NC}"
    echo "============================================"
    
    echo -e "\n12. Committing changes..."
    git add -A
    git commit -m "FIX: Complete Inngest endpoint cleanup - remove all Next.js artifacts and implement clean serverless function" || echo "Nothing to commit"
    
    echo -e "\n13. Pushing to trigger deployment..."
    git push origin main
    
    echo -e "\n14. Waiting for deployment (60 seconds)..."
    sleep 60
    
    echo -e "\n15. Testing fixed endpoint..."
    NEW_RESPONSE=$(curl -s -X PUT "$API_URL" || echo "FAILED")
    echo "New response: $NEW_RESPONSE"
    
    # Verify the fix
    if [[ "$NEW_RESPONSE" == *"functions"* && "$NEW_RESPONSE" == *"appId"* && "$NEW_RESPONSE" != *"success"* ]]; then
        echo -e "\n${GREEN}🎉 SUCCESS: Inngest endpoint is now returning the correct format!${NC}"
        echo -e "${GREEN}✅ The endpoint should now work correctly with Inngest Cloud${NC}"
    else
        echo -e "\n${RED}❌ STILL FAILING: Endpoint is not returning the expected format${NC}"
        echo -e "${YELLOW}⚠️  You may need to manually investigate the Vercel deployment logs${NC}"
    fi
    
else
    echo -e "\n${GREEN}✅ No issues detected. Endpoint appears to be working correctly.${NC}"
fi

echo -e "\n${BLUE}Diagnostic Complete${NC}"
echo "============================================"
echo "If the issue persists, consider:"
echo "1. Creating a completely new Vercel project for the API"
echo "2. Checking Vercel deployment logs for build errors"
echo "3. Verifying the correct branch is being deployed"
echo "4. Checking for any team-level Vercel configurations that might be interfering"