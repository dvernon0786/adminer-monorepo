#!/usr/bin/env node

// Quota enforcement test suite
const { neon } = require('@neondatabase/serverless');

const database = neon(process.env.DATABASE_URL);

async function testQuotaEnforcement() {
  console.log('🧪 Testing Quota Enforcement System...');
  
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

    // Test 2: Simulate quota consumption
    console.log('\n2️⃣ Simulating quota consumption...');
    await database.query(`
      UPDATE organizations 
      SET quota_used = 5 
      WHERE clerk_org_id = 'test-quota-org'
    `);
    console.log('✅ Quota set to 5/10 (50% used)');

    // Test 3: Test quota exceeded scenario
    console.log('\n3️⃣ Testing quota exceeded scenario...');
    await database.query(`
      UPDATE organizations 
      SET quota_used = 10 
      WHERE clerk_org_id = 'test-quota-org'
    `);
    console.log('✅ Quota set to 10/10 (100% used - should trigger paywall)');

    // Test 4: Test API endpoints
    console.log('\n4️⃣ Testing API endpoints...');
    
    // Test quota API
    const quotaResponse = await fetch('http://localhost:3002/api/quota', {
      headers: { 'x-org-id': 'test-quota-org' }
    });
    console.log(`Quota API Status: ${quotaResponse.status}`);
    
    if (quotaResponse.status === 402) {
      console.log('✅ Quota API correctly returns 402 when quota exceeded');
    } else {
      console.log('❌ Quota API should return 402 when quota exceeded');
    }

    // Test job creation API
    const jobResponse = await fetch('http://localhost:3002/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-org-id': 'test-quota-org'
      },
      body: JSON.stringify({ keyword: 'test', limit: 5 })
    });
    console.log(`Job Creation API Status: ${jobResponse.status}`);
    
    if (jobResponse.status === 402) {
      console.log('✅ Job Creation API correctly blocks when quota exceeded');
    } else {
      console.log('❌ Job Creation API should block when quota exceeded');
    }

    // Test 5: Reset quota for normal operation
    console.log('\n5️⃣ Resetting quota for normal operation...');
    await database.query(`
      UPDATE organizations 
      SET quota_used = 2 
      WHERE clerk_org_id = 'test-quota-org'
    `);
    console.log('✅ Quota reset to 2/10 (normal operation)');

    console.log('\n🎉 Quota enforcement tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testQuotaEnforcement();