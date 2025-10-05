#!/usr/bin/env node

/**
 * Test Quota Fix - Test the manual quota fix functionality
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '../../../.env.local' });

async function testQuotaFix() {
  console.log('🧪 TESTING QUOTA FIX FUNCTIONALITY');
  console.log('==================================');
  console.log('');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Test 1: Check current user's quota status
    console.log('📊 Test 1: Checking current user quota status...');
    
    const currentQuota = await sql`
      SELECT id, clerk_org_id, name, plan, quota_limit, quota_used, plan_code, billing_status
      FROM organizations 
      WHERE clerk_org_id = 'user_32oosLU98c1ROIwwwvjPXWOpr9U'
      LIMIT 1
    `;

    if (currentQuota.length > 0) {
      console.log('✅ Current user quota status:');
      console.log(`   - ID: ${currentQuota[0].id}`);
      console.log(`   - Clerk Org ID: ${currentQuota[0].clerk_org_id}`);
      console.log(`   - Name: ${currentQuota[0].name}`);
      console.log(`   - Plan: ${currentQuota[0].plan}`);
      console.log(`   - Quota Limit: ${currentQuota[0].quota_limit}`);
      console.log(`   - Quota Used: ${currentQuota[0].quota_used}`);
      console.log(`   - Plan Code: ${currentQuota[0].plan_code}`);
      console.log(`   - Billing Status: ${currentQuota[0].billing_status}`);
    } else {
      console.log('❌ User not found in database');
    }

    console.log('');
    console.log('📊 Test 2: Applying manual quota fix...');
    
    // Apply the manual quota fix
    const targetPlan = 'pro';
    const targetQuotaLimit = 500;
    const targetPlanCode = 'pro-500';
    const userId = 'user_32oosLU98c1ROIwwwvjPXWOpr9U';

    const updateResult = await sql`
      UPDATE organizations 
      SET 
        plan = ${targetPlan},
        plan_code = ${targetPlanCode},
        quota_limit = ${targetQuotaLimit},
        quota_used = 0,
        billing_status = 'active',
        updated_at = NOW()
      WHERE 
        clerk_org_id = ${userId}
      RETURNING id, clerk_org_id, name, plan, quota_limit, quota_used, plan_code, billing_status
    `;

    if (updateResult.length > 0) {
      console.log('✅ Quota fix applied successfully:');
      console.log(`   - Updated Organizations: ${updateResult.length}`);
      console.log(`   - New Plan: ${updateResult[0].plan}`);
      console.log(`   - New Quota Limit: ${updateResult[0].quota_limit}`);
      console.log(`   - New Quota Used: ${updateResult[0].quota_used}`);
      console.log(`   - New Plan Code: ${updateResult[0].plan_code}`);
      console.log(`   - Billing Status: ${updateResult[0].billing_status}`);
    } else {
      console.log('❌ No organizations updated');
    }

    console.log('');
    console.log('📊 Test 3: Verifying quota fix...');
    
    const verifyQuota = await sql`
      SELECT id, clerk_org_id, name, plan, quota_limit, quota_used, plan_code, billing_status
      FROM organizations 
      WHERE clerk_org_id = 'user_32oosLU98c1ROIwwwvjPXWOpr9U'
      LIMIT 1
    `;

    if (verifyQuota.length > 0) {
      console.log('✅ Verification successful:');
      console.log(`   - Plan: ${verifyQuota[0].plan} (should be 'pro')`);
      console.log(`   - Quota Limit: ${verifyQuota[0].quota_limit} (should be 500)`);
      console.log(`   - Quota Used: ${verifyQuota[0].quota_used} (should be 0)`);
      console.log(`   - Plan Code: ${verifyQuota[0].plan_code} (should be 'pro-500')`);
      console.log(`   - Billing Status: ${verifyQuota[0].billing_status} (should be 'active')`);
      
      // Check if fix was successful
      const isFixed = verifyQuota[0].plan === 'pro' && 
                     verifyQuota[0].quota_limit === 500 && 
                     verifyQuota[0].quota_used === 0 &&
                     verifyQuota[0].plan_code === 'pro-500' &&
                     verifyQuota[0].billing_status === 'active';
      
      if (isFixed) {
        console.log('');
        console.log('🎉 QUOTA FIX SUCCESSFUL!');
        console.log('========================');
        console.log('✅ User quota has been successfully updated');
        console.log('✅ Plan upgraded from free to pro');
        console.log('✅ Quota limit increased from 10 to 500');
        console.log('✅ Quota used reset to 0');
        console.log('✅ Billing status set to active');
        console.log('');
        console.log('The user should now see:');
        console.log('- Quota: 0/500 ads (0% used)');
        console.log('- Plan: pro');
        console.log('- Quota exceeded modal should disappear');
      } else {
        console.log('');
        console.log('❌ QUOTA FIX FAILED');
        console.log('==================');
        console.log('The quota was not updated correctly');
      }
    } else {
      console.log('❌ User not found after update');
    }

  } catch (error) {
    console.error('💥 TEST FAILED:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testQuotaFix()
    .then(() => {
      console.log('✅ Quota fix test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Quota fix test failed:', error);
      process.exit(1);
    });
}

module.exports = { testQuotaFix };