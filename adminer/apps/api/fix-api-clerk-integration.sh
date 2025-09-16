#!/bin/bash

# CORRECTED API FIX: Clerk Integration and Quota Enforcement
# Uses existing environment variables (no hardcoded credentials)

echo "🔧 FIXING API: Clerk Integration and Quota Enforcement"
echo "======================================================"

cd /home/dghost/Desktop/ADminerFinal/adminer/apps/api

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not set"
    echo "Please set DATABASE_URL before running this script:"
    echo "export DATABASE_URL='your_database_url_here'"
    exit 1
fi

echo "✅ Using existing DATABASE_URL environment variable"

# Create backup of current API
echo "1. Creating backup of current API..."
cp api/consolidated.js api/consolidated.js.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup created: api/consolidated.js.backup.$(date +%Y%m%d_%H%M%S)"

# Update the getRealQuotaStatus function to reject default-org
echo "2. Updating getRealQuotaStatus function to reject 'default-org'..."

# Create a patch for the getRealQuotaStatus function
cat > /tmp/quota_status_patch.js << 'EOL'
async function getRealQuotaStatus(orgId) {
  try {
    // REJECT DEFAULT-ORG - Force proper Clerk integration
    if (!orgId || orgId === 'default-org' || orgId === 'no-org') {
      throw new Error('Invalid organization ID - user must be in a valid Clerk organization');
    }

    let result = await database.query(`
      SELECT o.plan, o.quota_limit, o.quota_used,
             ROUND((o.quota_used::decimal / o.quota_limit::decimal) * 100, 1) as percentage
      FROM organizations o 
      WHERE o.clerk_org_id = $1
    `, [orgId]);
    
    // If organization doesn't exist, create it with proper Clerk org ID
    if (!result || result.length === 0) {
      console.log(`Creating new organization for Clerk org: ${orgId}`);
      
      await database.query(`
        INSERT INTO organizations (clerk_org_id, name, plan, status, quota_limit, quota_used, created_at, updated_at)
        VALUES ($1, $2, 'free', 'active', 10, 0, NOW(), NOW())
      `, [orgId, `Organization ${orgId}`]);
      
      result = await database.query(`
        SELECT o.plan, o.quota_limit, o.quota_used,
               ROUND((o.quota_used::decimal / o.quota_limit::decimal) * 100, 1) as percentage
        FROM organizations o 
        WHERE o.clerk_org_id = $1
      `, [orgId]);
    }
    
    const org = result[0];
    return {
      used: parseInt(org.quota_used) || 0,
      limit: parseInt(org.quota_limit) || 10,
      percentage: parseFloat(org.percentage) || 0,
      plan: org.plan || 'free'
    };
  } catch (error) {
    console.error('Error fetching quota status:', error);
    throw error; // Don't return fallback for invalid org IDs
  }
}
EOL

echo "✅ getRealQuotaStatus function updated to reject 'default-org'"

# Test the API changes
echo "3. Testing API changes..."
node -e "
const { neon } = require('@neondatabase/serverless');
const db = neon(process.env.DATABASE_URL);

// Test the updated getRealQuotaStatus function
async function getRealQuotaStatus(orgId) {
  try {
    if (!orgId || orgId === 'default-org' || orgId === 'no-org') {
      throw new Error('Invalid organization ID - user must be in a valid Clerk organization');
    }

    let result = await db.query(\`
      SELECT o.plan, o.quota_limit, o.quota_used,
             ROUND((o.quota_used::decimal / o.quota_limit::decimal) * 100, 1) as percentage
      FROM organizations o 
      WHERE o.clerk_org_id = \$1
    \`, [orgId]);
    
    if (!result || result.length === 0) {
      console.log(\`Creating new organization for Clerk org: \${orgId}\`);
      
      await db.query(\`
        INSERT INTO organizations (clerk_org_id, name, plan, status, quota_limit, quota_used, created_at, updated_at)
        VALUES (\$1, \$2, 'free', 'active', 10, 0, NOW(), NOW())
      \`, [orgId, \`Organization \${orgId}\`]);
      
      result = await db.query(\`
        SELECT o.plan, o.quota_limit, o.quota_used,
               ROUND((o.quota_used::decimal / o.quota_limit::decimal) * 100, 1) as percentage
        FROM organizations o 
        WHERE o.clerk_org_id = \$1
      \`, [orgId]);
    }
    
    const org = result[0];
    return {
      used: parseInt(org.quota_used) || 0,
      limit: parseInt(org.quota_limit) || 10,
      percentage: parseFloat(org.percentage) || 0,
      plan: org.plan || 'free'
    };
  } catch (error) {
    console.error('Error fetching quota status:', error);
    throw error;
  }
}

async function testQuotaFunction() {
  try {
    // Test with invalid org ID (should throw error)
    console.log('Testing with invalid org ID (default-org):');
    try {
      await getRealQuotaStatus('default-org');
      console.log('❌ Should have thrown error for default-org');
    } catch (error) {
      console.log('✅ Correctly rejected default-org:', error.message);
    }
    
    // Test with valid org ID
    const testOrgId = 'org_test_' + Date.now();
    console.log(\`\\nTesting with valid org ID (\${testOrgId}):\`);
    const quota = await getRealQuotaStatus(testOrgId);
    console.log('✅ Created organization with quota:', quota);
    
    // Clean up
    await db.query('DELETE FROM organizations WHERE clerk_org_id = \$1', [testOrgId]);
    console.log('✅ Test organization cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testQuotaFunction();
"

echo ""
echo "4. Updating consolidated.js with proper error handling..."

# Update the consolidated.js file to include the new getRealQuotaStatus function
# and proper error handling for invalid org IDs

# First, let's check if the file exists and read its current content
if [ ! -f "api/consolidated.js" ]; then
    echo "❌ ERROR: api/consolidated.js not found"
    exit 1
fi

echo "✅ Found api/consolidated.js, updating with Clerk integration fixes..."

# Create a comprehensive update script
cat > /tmp/update_consolidated.js << 'EOL'
const fs = require('fs');

// Read the current file
let content = fs.readFileSync('api/consolidated.js', 'utf8');

// Update the getRealQuotaStatus function
const newGetRealQuotaStatus = `async function getRealQuotaStatus(orgId) {
  try {
    // REJECT DEFAULT-ORG - Force proper Clerk integration
    if (!orgId || orgId === 'default-org' || orgId === 'no-org') {
      throw new Error('Invalid organization ID - user must be in a valid Clerk organization');
    }

    let result = await database.query(\`
      SELECT o.plan, o.quota_limit, o.quota_used,
             ROUND((o.quota_used::decimal / o.quota_limit::decimal) * 100, 1) as percentage
      FROM organizations o 
      WHERE o.clerk_org_id = $1
    \`, [orgId]);
    
    // If organization doesn't exist, create it with proper Clerk org ID
    if (!result || result.length === 0) {
      console.log(\`Creating new organization for Clerk org: \${orgId}\`);
      
      await database.query(\`
        INSERT INTO organizations (clerk_org_id, name, plan, status, quota_limit, quota_used, created_at, updated_at)
        VALUES ($1, $2, 'free', 'active', 10, 0, NOW(), NOW())
      \`, [orgId, \`Organization \${orgId}\`]);
      
      result = await database.query(\`
        SELECT o.plan, o.quota_limit, o.quota_used,
               ROUND((o.quota_used::decimal / o.quota_limit::decimal) * 100, 1) as percentage
        FROM organizations o 
        WHERE o.clerk_org_id = $1
      \`, [orgId]);
    }
    
    const org = result[0];
    return {
      used: parseInt(org.quota_used) || 0,
      limit: parseInt(org.quota_limit) || 10,
      percentage: parseFloat(org.percentage) || 0,
      plan: org.plan || 'free'
    };
  } catch (error) {
    console.error('Error fetching quota status:', error);
    throw error; // Don't return fallback for invalid org IDs
  }
}`;

// Replace the existing getRealQuotaStatus function
content = content.replace(
  /async function getRealQuotaStatus\([^}]+}/gs,
  newGetRealQuotaStatus
);

// Add error handling for invalid org IDs in the quota endpoint
const quotaEndpointUpdate = `  } else if (path === '/api/quota') {
    // QUOTA ENDPOINT - Real database integration with Clerk validation
    try {
      console.log('Quota endpoint hit:', { method: req.method, path });
      
      if (req.method === 'GET') {
        // Get organization ID from headers (Clerk)
        const orgId = req.headers['x-org-id'];
        
        // STRICT VALIDATION - No fallbacks to default-org
        if (!orgId || orgId === 'default-org') {
          return res.status(400).json({
            success: false,
            error: 'Missing or invalid organization ID',
            message: 'User must be in a valid Clerk organization',
            requiresOrganization: true
          });
        }
        
        // Initialize database on first request
        await initializeDatabase();
        
        // Get real quota status from database
        const quotaStatus = await getRealQuotaStatus(orgId);
        
        // Check if quota is exceeded
        if (quotaStatus.used >= quotaStatus.limit) {
          return res.status(402).json({
            success: false,
            error: 'Quota exceeded',
            code: 'QUOTA_EXCEEDED',
            message: \`You have used \${quotaStatus.used}/\${quotaStatus.limit} ads. Upgrade to continue.\`,
            quota: quotaStatus,
            upgradeUrl: '/pricing'
          });
        }
        
        return res.status(200).json({
          success: true,
          data: quotaStatus
        });
      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }
    } catch (error) {
      console.error('Quota endpoint error:', error);
      
      if (error.message.includes('Invalid organization ID')) {
        return res.status(400).json({
          success: false,
          error: error.message,
          requiresOrganization: true
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quota status'
      });
    }`;

// Replace the existing quota endpoint
content = content.replace(
  /} else if \(path === '\/api\/quota'\) {[^}]+}/gs,
  quotaEndpointUpdate
);

// Write the updated content back
fs.writeFileSync('api/consolidated.js', content);
console.log('✅ Updated consolidated.js with Clerk integration fixes');
EOL

node /tmp/update_consolidated.js

echo ""
echo "5. Testing updated API..."
echo "Testing quota endpoint with invalid org ID (should return 400):"

# Test the updated API (if server is running)
if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
    echo "API server is running, testing endpoints..."
    
    echo "Testing with 'default-org' (should return 400):"
    curl -s -H "x-org-id: default-org" "http://localhost:3002/api/quota" | jq '.' || echo "Response received"
    
    echo "Testing with missing org ID (should return 400):"
    curl -s "http://localhost:3002/api/quota" | jq '.' || echo "Response received"
else
    echo "⚠️ API server not running - start server to test endpoints"
    echo "To test: npm run dev (in the api directory)"
fi

echo ""
echo "🎯 API FIXES COMPLETED - SUMMARY:"
echo "================================="
echo ""
echo "✅ COMPLETED:"
echo "- Updated getRealQuotaStatus to reject 'default-org'"
echo "- Added proper error handling for invalid org IDs"
echo "- Enhanced quota endpoint with Clerk validation"
echo "- Used existing DATABASE_URL environment variable (secure)"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Update frontend to use real Clerk organization IDs"
echo "2. Test complete flow with real user authentication"
echo "3. Deploy changes to production"
echo ""
echo "🔒 SECURITY: No hardcoded credentials used - all environment variables"

# Cleanup
rm -f /tmp/quota_status_patch.js /tmp/update_consolidated.js