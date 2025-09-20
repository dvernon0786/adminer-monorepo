#!/usr/bin/env node

// Debug script to query quota usage records
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/adminer'
});

async function debugQuotaUsage() {
  console.log('🔍 Debugging Quota Usage...\n');
  
  try {
    // Get user's organization ID
    const userId = 'user_32oosLU98c1ROIwwwvjPXWOpr9U';
    
    console.log('1️⃣ Getting organization details...');
    const orgResult = await pool.query(`
      SELECT id, clerk_org_id, name, quota_used, quota_limit, plan, created_at, updated_at
      FROM organizations 
      WHERE clerk_org_id = $1
    `, [userId]);
    
    if (orgResult.rows.length === 0) {
      console.log('❌ Organization not found for user:', userId);
      return;
    }
    
    const org = orgResult.rows[0];
    console.log('   Organization:', {
      id: org.id,
      clerk_org_id: org.clerk_org_id,
      name: org.name,
      quota_used: org.quota_used,
      quota_limit: org.quota_limit,
      plan: org.plan,
      created_at: org.created_at,
      updated_at: org.updated_at
    });
    
    console.log('\n2️⃣ Getting quota usage records...');
    const quotaUsageResult = await pool.query(`
      SELECT id, org_id, job_id, type, amount, description, created_at
      FROM quota_usage 
      WHERE org_id = $1
      ORDER BY created_at DESC
    `, [org.id]);
    
    console.log(`   Found ${quotaUsageResult.rows.length} quota usage records:`);
    quotaUsageResult.rows.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.type}: ${record.amount} units`);
      console.log(`      Job ID: ${record.job_id || 'N/A'}`);
      console.log(`      Description: ${record.description || 'N/A'}`);
      console.log(`      Created: ${record.created_at}`);
      console.log('');
    });
    
    console.log('3️⃣ Getting job records...');
    const jobsResult = await pool.query(`
      SELECT id, org_id, type, status, input, created_at, updated_at
      FROM jobs 
      WHERE org_id = $1
      ORDER BY created_at DESC
    `, [org.id]);
    
    console.log(`   Found ${jobsResult.rows.length} job records:`);
    jobsResult.rows.forEach((job, index) => {
      console.log(`   ${index + 1}. Job ID: ${job.id}`);
      console.log(`      Type: ${job.type}`);
      console.log(`      Status: ${job.status}`);
      console.log(`      Input: ${JSON.stringify(job.input)}`);
      console.log(`      Created: ${job.created_at}`);
      console.log(`      Updated: ${job.updated_at}`);
      console.log('');
    });
    
    console.log('4️⃣ Calculating total quota consumed...');
    const totalConsumed = quotaUsageResult.rows.reduce((sum, record) => sum + record.amount, 0);
    console.log(`   Total quota consumed from records: ${totalConsumed}`);
    console.log(`   Organization quota_used: ${org.quota_used}`);
    console.log(`   Difference: ${org.quota_used - totalConsumed}`);
    
    if (org.quota_used !== totalConsumed) {
      console.log('⚠️  MISMATCH: Organization quota_used does not match quota_usage records!');
    } else {
      console.log('✅ Quota usage records match organization quota_used');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

debugQuotaUsage();