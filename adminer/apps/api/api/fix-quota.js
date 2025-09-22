// Manual Quota Fix Endpoint - For immediate post-payment fixes
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 MANUAL_QUOTA_FIX_V6', {
      timestamp: new Date().toISOString(),
      body: req.body,
      headers: {
        'x-user-id': req.headers['x-user-id'],
        'user-agent': req.headers['user-agent']
      }
    });

    const { subscriptionId, plan, userId, email } = req.body;
    
    // Validate required fields
    if (!subscriptionId && !userId && !email) {
      return res.status(400).json({
        error: 'Missing required fields: need subscriptionId, userId, or email'
      });
    }

    // Determine plan details
    let targetPlan = plan || 'pro';
    let targetQuotaLimit = 500;
    let targetPlanCode = 'pro-500';

    if (plan === 'enterprise' || plan === 'ent-2000') {
      targetPlan = 'enterprise';
      targetQuotaLimit = 2000;
      targetPlanCode = 'ent-2000';
    }

    console.log('🎯 MANUAL_QUOTA_FIX_TARGET_V6', {
      targetPlan,
      targetQuotaLimit,
      targetPlanCode,
      subscriptionId,
      userId,
      email
    });

    let updateResult = [];

    // Try multiple update strategies
    if (userId) {
      // Update by user ID (clerk_org_id)
      const userUpdateResult = await sql`
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
        RETURNING id, clerk_org_id, name, plan, quota_limit, quota_used, plan_code
      `;
      updateResult = updateResult.concat(userUpdateResult);

      console.log('🔄 MANUAL_QUOTA_FIX_BY_USER_V6', {
        userId,
        updatedRows: userUpdateResult.length,
        result: userUpdateResult
      });
    }

    if (email && updateResult.length === 0) {
      // Update by email pattern
      const emailPrefix = email.split('@')[0];
      const emailUpdateResult = await sql`
        UPDATE organizations 
        SET 
          plan = ${targetPlan},
          plan_code = ${targetPlanCode},
          quota_limit = ${targetQuotaLimit},
          quota_used = 0,
          billing_status = 'active',
          updated_at = NOW()
        WHERE 
          clerk_org_id LIKE ${'%' + emailPrefix + '%'}
          OR name ILIKE ${'%' + emailPrefix + '%'}
        RETURNING id, clerk_org_id, name, plan, quota_limit, quota_used, plan_code
      `;
      updateResult = updateResult.concat(emailUpdateResult);

      console.log('🔄 MANUAL_QUOTA_FIX_BY_EMAIL_V6', {
        emailPrefix,
        updatedRows: emailUpdateResult.length,
        result: emailUpdateResult
      });
    }

    // If no specific match, update recent quota-exceeded organizations
    if (updateResult.length === 0) {
      const recentUpdateResult = await sql`
        UPDATE organizations 
        SET 
          plan = ${targetPlan},
          plan_code = ${targetPlanCode},
          quota_limit = ${targetQuotaLimit},
          quota_used = 0,
          billing_status = 'active',
          updated_at = NOW()
        WHERE 
          plan = 'free'
          AND quota_used >= quota_limit
          AND updated_at > NOW() - INTERVAL '2 hours'
        RETURNING id, clerk_org_id, name, plan, quota_limit, quota_used, plan_code
      `;
      updateResult = updateResult.concat(recentUpdateResult);

      console.log('🔄 MANUAL_QUOTA_FIX_BY_RECENT_V6', {
        updatedRows: recentUpdateResult.length,
        result: recentUpdateResult
      });
    }

    if (updateResult.length > 0) {
      // Log manual fix
      for (const org of updateResult) {
        await sql`
          INSERT INTO webhook_events (
            id, event_type, org_id, data, processed_at
          ) VALUES (
            gen_random_uuid(),
            'manual_quota_fix',
            ${org.id},
            ${JSON.stringify({
              subscriptionId: subscriptionId,
              oldPlan: 'free',
              newPlan: targetPlan,
              oldQuotaLimit: 10,
              newQuotaLimit: targetQuotaLimit,
              fixReason: 'post_payment_manual_fix',
              userId: userId,
              email: email
            })},
            NOW()
          )
        `;
      }

      console.log('✅ MANUAL_QUOTA_FIX_SUCCESS_V6', {
        organizationsUpdated: updateResult.length,
        subscriptionId: subscriptionId,
        newPlan: targetPlan,
        newQuotaLimit: targetQuotaLimit
      });

      return res.status(200).json({
        success: true,
        message: 'Quota updated successfully',
        organizationsUpdated: updateResult.length,
        organizations: updateResult.map(org => ({
          id: org.id,
          clerkOrgId: org.clerk_org_id,
          name: org.name,
          plan: org.plan,
          quotaLimit: org.quota_limit,
          quotaUsed: org.quota_used,
          planCode: org.plan_code
        })),
        newPlan: targetPlan,
        newQuotaLimit: targetQuotaLimit
      });

    } else {
      console.log('⚠️ MANUAL_QUOTA_FIX_NO_MATCH_V6', {
        subscriptionId,
        userId,
        email,
        targetPlan
      });

      return res.status(404).json({
        error: 'No organizations found to update',
        details: {
          subscriptionId,
          userId,
          email,
          targetPlan
        },
        suggestion: 'Check if user ID or email is correct'
      });
    }

  } catch (error) {
    console.error('💥 MANUAL_QUOTA_FIX_ERROR_V6', {
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      error: 'Manual quota fix failed',
      message: error.message
    });
  }
}