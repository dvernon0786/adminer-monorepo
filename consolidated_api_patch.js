// Enhanced Dodo checkout handling for consolidated API
// This replaces the existing dodo checkout section

} else if (path === '/api/dodo/checkout') {
  try {
    console.log('🔗 DODO_CHECKOUT_API_CALLED', {
      timestamp: new Date().toISOString(),
      method: req.method,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-user-id': req.headers['x-user-id']
      },
      body: req.body
    });

    const { plan, email, orgId, orgName } = req.body;
    const userId = req.headers['x-user-id'] || req.body.userId;
    const workspaceId = req.headers['x-workspace-id'] || userId;

    // Validate required fields
    if (!plan || !email || !userId) {
      console.log('❌ DODO_VALIDATION_ERROR', { plan, email, userId });
      return res.status(400).json({
        error: 'Missing required fields: plan, email, userId'
      });
    }

    // Generate proper UUID if needed
    const generateUuidFromClerkId = (clerkId) => {
      if (clerkId && clerkId.startsWith('user_')) {
        const crypto = require('crypto');
        return crypto.randomUUID();
      }
      return clerkId;
    };

    const finalOrgId = orgId || workspaceId || userId;
    const orgUuid = generateUuidFromClerkId(finalOrgId);

    console.log('🏢 DODO_ORG_PROCESSING', {
      originalId: finalOrgId,
      generatedUuid: orgUuid,
      plan: plan
    });

    // Get or create organization
    let organization;
    try {
      let orgResult = await sql`
        SELECT * FROM organizations 
        WHERE clerk_org_id = ${finalOrgId} OR id = ${orgUuid}
        LIMIT 1
      `;

      if (orgResult.length === 0) {
        console.log('🆕 DODO_CREATING_ORGANIZATION', orgUuid);
        orgResult = await sql`
          INSERT INTO organizations (
            id, clerk_org_id, name, plan, plan_code, quota_used, quota_limit, 
            quota_unit, created_at, updated_at
          ) VALUES (
            ${orgUuid},
            ${finalOrgId},
            ${orgName || 'Personal Workspace'},
            'free',
            'free-10',
            0,
            10,
            'ads_scraped',
            NOW(),
            NOW()
          ) RETURNING *
        `;
      }

      organization = orgResult[0];
      console.log('✅ DODO_ORGANIZATION_READY', {
        id: organization.id,
        name: organization.name,
        currentPlan: organization.plan
      });

    } catch (dbError) {
      console.error('💥 DODO_ORG_DB_ERROR', dbError);
      return res.status(500).json({
        error: 'Database error creating organization',
        details: dbError.message
      });
    }

    // Map plan codes to product IDs
    const planToProductId = {
      'pro-500': 'prod_pro_plan',
      'ent-2000': 'prod_enterprise_plan',
      'free-10': 'prod_free_plan'
    };
    
    const productId = planToProductId[plan];
    if (!productId) {
      console.log('❌ DODO_INVALID_PLAN', { plan, availablePlans: Object.keys(planToProductId) });
      return res.status(400).json({
        error: `Invalid plan: ${plan}`,
        availablePlans: Object.keys(planToProductId)
      });
    }

    console.log('📦 DODO_PRODUCT_MAPPING', {
      plan: plan,
      productId: productId
    });

    // Create checkout session with Dodo
    const checkoutSessionData = {
      product_cart: [
        {
          product_id: productId,
          quantity: 1
        }
      ],
      customer: {
        email: email,
        name: orgName || email.split('@')[0] || 'Customer'
      },
      return_url: `${process.env.DODO_PAYMENTS_RETURN_URL || 'https://adminer.online'}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.DODO_PAYMENTS_RETURN_URL || 'https://adminer.online'}/dashboard?payment=cancelled`,
      metadata: {
        organization_id: organization.id,
        plan: plan,
        source: 'adminer_quota_modal',
        user_id: userId,
        workspace_id: workspaceId
      }
    };

    console.log('🚀 DODO_CREATING_CHECKOUT_SESSION', {
      productId: productId,
      customerEmail: email,
      organizationId: organization.id
    });

    // Call DodoClient
    const checkoutSession = await dodo.createCheckoutSession(checkoutSessionData);

    console.log('📋 DODO_CHECKOUT_SESSION_RESULT', {
      success: checkoutSession.success,
      hasCheckoutUrl: !!checkoutSession.checkout_url,
      sessionId: checkoutSession.session_id,
      mockMode: checkoutSession.mock_mode,
      error: checkoutSession.error
    });

    // Handle DodoClient errors
    if (!checkoutSession.success || checkoutSession.error) {
      console.log('❌ DODO_CLIENT_ERROR', {
        error: checkoutSession.error,
        fallbackRequired: checkoutSession.fallback_required
      });

      // Return error response with details
      return res.status(500).json({
        success: false,
        error: 'Dodo checkout session creation failed',
        details: checkoutSession.error,
        message: 'Please try again or contact support'
      });
    }

    // Log successful checkout session
    try {
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
            productId: productId,
            checkoutUrl: checkoutSession.checkout_url,
            email: email,
            mockMode: checkoutSession.mock_mode || false
          })},
          NOW()
        )
      `;
      console.log('✅ DODO_SESSION_LOGGED');
    } catch (logError) {
      console.log('⚠️ DODO_SESSION_LOG_ERROR', logError.message);
      // Continue even if logging fails
    }

    // Return successful response
    const response = {
      success: true,
      checkout_url: checkoutSession.checkout_url,
      session_id: checkoutSession.session_id,
      plan: checkoutSession.plan,
      mock_mode: checkoutSession.mock_mode || false,
      message: checkoutSession.message,
      immediate_activation: checkoutSession.immediate_activation || false,
      redirect_url: checkoutSession.redirect_url
    };

    console.log('🎯 DODO_CHECKOUT_API_SUCCESS', {
      sessionId: response.session_id,
      hasCheckoutUrl: !!response.checkout_url,
      mockMode: response.mock_mode,
      immediateActivation: response.immediate_activation
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('💥 DODO_CHECKOUT_API_ERROR', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Return comprehensive error response
    return res.status(500).json({
      success: false,
      error: 'Checkout API failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      support: 'Please contact support if this issue persists'
    });
  }
}
