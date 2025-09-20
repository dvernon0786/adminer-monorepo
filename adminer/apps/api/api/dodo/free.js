import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-workspace-id');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { orgId, orgName } = req.body;
    const userId = req.headers['x-user-id'] || req.body.userId;

    console.log('FREE_PLAN_REQUEST:', {
      orgId,
      orgName,
      userId,
      timestamp: new Date().toISOString()
    });

    // Use userId as orgId if orgId not provided (personal workspaces)
    const finalOrgId = orgId || userId;

    if (!finalOrgId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID or User ID is required'
      });
    }

    // Get or create organization
    let org = await sql`
      SELECT * FROM organizations 
      WHERE clerk_org_id = ${finalOrgId} OR id = ${finalOrgId}
      LIMIT 1
    `;

    if (!org[0]) {
      // Create organization
      org = await sql`
        INSERT INTO organizations (
          id, clerk_org_id, name, plan, quota_limit, quota_used, 
          billing_status, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          ${finalOrgId},
          ${orgName || 'Personal Workspace'},
          'free',
          10,
          0,
          'active',
          NOW(),
          NOW()
        ) RETURNING *
      `;
    } else {
      // Update existing organization to free plan
      org = await sql`
        UPDATE organizations 
        SET 
          plan = 'free',
          quota_limit = 10,
          billing_status = 'active',
          updated_at = NOW()
        WHERE id = ${org[0].id}
        RETURNING *
      `;
    }

    const organization = org[0];

    // Create free subscription record
    await sql`
      INSERT INTO subscriptions (
        id, org_id, dodo_subscription_id, plan, status,
        current_period_start, current_period_end, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        ${organization.id},
        ${'free_' + Date.now()},
        'free',
        'active',
        NOW(),
        ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}, -- 1 year
        NOW(),
        NOW()
      )
      ON CONFLICT (org_id) DO UPDATE SET
        plan = 'free',
        status = 'active',
        updated_at = NOW()
    `;

    console.log('FREE_PLAN_ACTIVATED:', {
      orgId: organization.id,
      plan: organization.plan,
      quota: organization.quota_limit
    });

    return res.status(200).json({
      success: true,
      message: 'Free plan activated successfully',
      organization: {
        id: organization.id,
        name: organization.name,
        plan: organization.plan,
        quota_limit: organization.quota_limit,
        quota_used: organization.quota_used
      }
    });

  } catch (error) {
    console.error('FREE_PLAN_API_ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to activate free plan'
    });
  }
}