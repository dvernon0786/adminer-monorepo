import { neon } from '@neondatabase/serverless';
import { DodoClient } from '../../src/lib/dodo.js';

const sql = neon(process.env.DATABASE_URL);
const dodo = new DodoClient();

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
    const { plan, email, orgId, orgName } = req.body;
    const userId = req.headers['x-user-id'] || req.body.userId;

    console.log('DODO_CHECKOUT_REQUEST:', {
      plan,
      email,
      orgId,
      orgName,
      userId,
      timestamp: new Date().toISOString()
    });

    // Validate required fields
    if (!plan) {
      return res.status(400).json({
        success: false,
        error: 'Plan is required'
      });
    }

    if (!userId && !orgId) {
      return res.status(400).json({
        success: false,
        error: 'User ID or Organization ID is required'
      });
    }

    // Use userId as orgId if orgId not provided (personal workspaces)
    const finalOrgId = orgId || userId;

    // Get or create organization
    let org = await sql`
      SELECT * FROM organizations 
      WHERE clerk_org_id = ${finalOrgId} OR id = ${finalOrgId}
      LIMIT 1
    `;

    if (!org[0]) {
      // Create organization if it doesn't exist
      org = await sql`
        INSERT INTO organizations (
          id, clerk_org_id, name, plan, quota_limit, quota_used, created_at
        ) VALUES (
          gen_random_uuid(),
          ${finalOrgId},
          ${orgName || 'Personal Workspace'},
          'free',
          10,
          0,
          NOW()
        ) RETURNING *
      `;
    }

    const organization = org[0];

    // Validate plan upgrade path
    const planHierarchy = { 'free': 0, 'pro': 1, 'enterprise': 2 };
    const currentPlanLevel = planHierarchy[organization.plan] || 0;
    const requestedPlan = plan.includes('pro') ? 'pro' : plan.includes('ent') ? 'enterprise' : 'free';
    const requestedPlanLevel = planHierarchy[requestedPlan] || 0;

    if (requestedPlanLevel <= currentPlanLevel && organization.plan !== 'free') {
      return res.status(400).json({
        success: false,
        error: `Cannot downgrade from ${organization.plan} to ${requestedPlan}`
      });
    }

    // Create Dodo checkout session
    const checkoutSession = await dodo.createCheckoutSession(
      plan,
      organization.id,
      organization.name,
      email
    );

    if (!checkoutSession.success) {
      throw new Error('Failed to create checkout session');
    }

    // For free plan, activate immediately
    if (checkoutSession.immediate_activation) {
      await sql`
        UPDATE organizations 
        SET plan = 'free', quota_limit = 10, updated_at = NOW()
        WHERE id = ${organization.id}
      `;

      return res.status(200).json({
        success: true,
        message: 'Free plan activated',
        redirect_url: '/dashboard?plan=free&activated=true',
        immediate_activation: true
      });
    }

    // Log checkout session for tracking
    await sql`
      INSERT INTO webhook_events (
        id, event_type, org_id, data, processed_at
      ) VALUES (
        gen_random_uuid(),
        'checkout_session_created',
        ${organization.id},
        ${JSON.stringify({
          sessionId: checkoutSession.session_id,
          plan: plan,
          amount: checkoutSession.plan.price,
          email: email
        })},
        NOW()
      )
    `;

    console.log('DODO_CHECKOUT_SUCCESS:', {
      orgId: organization.id,
      sessionId: checkoutSession.session_id,
      checkoutUrl: checkoutSession.checkout_url,
      plan
    });

    return res.status(200).json({
      success: true,
      checkout_url: checkoutSession.checkout_url,
      session_id: checkoutSession.session_id,
      plan: checkoutSession.plan
    });

  } catch (error) {
    console.error('DODO_CHECKOUT_API_ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create checkout session'
    });
  }
}