#!/usr/bin/env node

// Emergency quota reset script
const { neon } = require('@neondatabase/serverless');

async function resetQuotaEmergency() {
  console.log('🚨 EMERGENCY QUOTA RESET: Starting...');
  
  try {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not configured');
      return;
    }
    
    const sql = neon(process.env.DATABASE_URL);
    console.log('🚨 EMERGENCY QUOTA RESET: Database connected');
    
    const userId = 'user_32oosLU98c1ROIwwwvjPXWOpr9U';
    
    // Get current quota status
    console.log('🔍 Getting current quota status...');
    const currentQuota = await sql`
      SELECT id, clerk_org_id, name, quota_used, quota_limit, plan
      FROM organizations 
      WHERE clerk_org_id = ${userId}
      LIMIT 1
    `;
    
    if (currentQuota.length === 0) {
      console.error('❌ Organization not found for user:', userId);
      return;
    }
    
    const org = currentQuota[0];
    console.log('📊 Current quota status:', {
      id: org.id,
      clerk_org_id: org.clerk_org_id,
      name: org.name,
      quota_used: org.quota_used,
      quota_limit: org.quota_limit,
      plan: org.plan
    });
    
    // Reset quota to 0
    console.log('🚨 Resetting quota to 0...');
    const resetResult = await sql`
      UPDATE organizations 
      SET quota_used = 0, updated_at = NOW()
      WHERE clerk_org_id = ${userId}
      RETURNING id, clerk_org_id, quota_used, quota_limit
    `;
    
    console.log('✅ Reset result:', resetResult);
    
    // Verify reset
    console.log('🔍 Verifying reset...');
    const verifyResult = await sql`
      SELECT id, clerk_org_id, name, quota_used, quota_limit, plan
      FROM organizations 
      WHERE clerk_org_id = ${userId}
      LIMIT 1
    `;
    
    console.log('✅ Verification result:', verifyResult[0]);
    
    if (verifyResult[0].quota_used === 0) {
      console.log('🎉 SUCCESS: Quota reset to 0');
    } else {
      console.log('❌ FAILED: Quota still not 0');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

resetQuotaEmergency();