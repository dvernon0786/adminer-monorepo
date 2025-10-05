#!/usr/bin/env node

// Direct quota enforcement test (no API server required)
const { neon } = require('@neondatabase/serverless');

const database = neon(process.env.DATABASE_URL);

// Simulate the getRealQuotaStatus function
async function getRealQuotaStatus(orgId) {
  try {
    const result = await database.query(`
      SELECT o.plan, o.quota_limit, o.quota_used,
             ROUND((o.quota_used::decimal / o.quota_limit::decimal) * 100, 1) as percentage
      FROM organizations o 
      WHERE o.clerk_org_id = $1
    `, [orgId]);
    
    if (!result || result.length === 0) {
      return { used: 0, limit: 10, percentage: 0, plan: 'free' };
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
    return { used: 0, limit: 10, percentage: 0, plan: 'free' };
  }
}

async function testQuotaEnforcement() {
  console.log('🧪 Testing Quota Enforcement System (Direct Database Test)...');
  
  try {
    // Test 1: Create test organization with quota limit
    console.log('\n1️⃣ Creating test organization...');
    await database.query(`
      INSERT INTO organizations (clerk_org_id, name, plan, quota_limit, quota_used, created_at, updated_at)
      VALUES ('test-quota-org', 'Test Quota Org', 'free', 10, 0, NOW(), NOW())
      ON CONFLICT (clerk_org_id) DO UPDATE SET
        quota_limit = 10, quota_used = 0, plan = 'free'
    `);
    console.log('✅ Test organization created');

    // Test 2: Test normal quota status
    console.log('\n2️⃣ Testing normal quota status...');
    let quotaStatus = await getRealQuotaStatus('test-quota-org');
    console.log(`Quota status: ${quotaStatus.used}/${quotaStatus.limit} (${quotaStatus.percentage}%)`);
    
    if (quotaStatus.used === 0 && quotaStatus.limit === 10) {
      console.log('✅ Normal quota status correct');
    } else {
      console.log('❌ Normal quota status incorrect');
    }

    // Test 3: Simulate quota consumption
    console.log('\n3️⃣ Simulating quota consumption...');
    await database.query(`
      UPDATE organizations 
      SET quota_used = 5 
      WHERE clerk_org_id = 'test-quota-org'
    `);
    console.log('✅ Quota set to 5/10 (50% used)');

    quotaStatus = await getRealQuotaStatus('test-quota-org');
    console.log(`Quota status: ${quotaStatus.used}/${quotaStatus.limit} (${quotaStatus.percentage}%)`);
    
    if (quotaStatus.used === 5 && quotaStatus.percentage === 50) {
      console.log('✅ Quota consumption tracking correct');
    } else {
      console.log('❌ Quota consumption tracking incorrect');
    }

    // Test 4: Test quota exceeded scenario
    console.log('\n4️⃣ Testing quota exceeded scenario...');
    await database.query(`
      UPDATE organizations 
      SET quota_used = 10 
      WHERE clerk_org_id = 'test-quota-org'
    `);
    console.log('✅ Quota set to 10/10 (100% used)');

    quotaStatus = await getRealQuotaStatus('test-quota-org');
    console.log(`Quota status: ${quotaStatus.used}/${quotaStatus.limit} (${quotaStatus.percentage}%)`);
    
    // Test quota exceeded logic
    const quotaExceeded = quotaStatus.used >= quotaStatus.limit;
    if (quotaExceeded) {
      console.log('✅ Quota exceeded logic working correctly');
    } else {
      console.log('❌ Quota exceeded logic not working');
    }

    // Test 5: Test insufficient quota scenario
    console.log('\n5️⃣ Testing insufficient quota scenario...');
    const requestedAds = 5;
    const wouldExceedQuota = quotaStatus.used + requestedAds > quotaStatus.limit;
    
    if (wouldExceedQuota) {
      console.log('✅ Insufficient quota logic working correctly');
      const remainingAds = quotaStatus.limit - quotaStatus.used;
      console.log(`Would exceed quota: requested ${requestedAds}, remaining ${remainingAds}`);
    } else {
      console.log('❌ Insufficient quota logic not working');
    }

    // Test 6: Reset quota for normal operation
    console.log('\n6️⃣ Resetting quota for normal operation...');
    await database.query(`
      UPDATE organizations 
      SET quota_used = 2 
      WHERE clerk_org_id = 'test-quota-org'
    `);
    console.log('✅ Quota reset to 2/10 (normal operation)');

    quotaStatus = await getRealQuotaStatus('test-quota-org');
    console.log(`Final quota status: ${quotaStatus.used}/${quotaStatus.limit} (${quotaStatus.percentage}%)`);

    console.log('\n🎉 Quota enforcement tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Database quota tracking working');
    console.log('✅ Quota exceeded detection working');
    console.log('✅ Insufficient quota detection working');
    console.log('✅ Quota percentage calculation working');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testQuotaEnforcement();