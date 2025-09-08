const { db, orgs, webhookEvents } = require('../../../src/lib/db.js');
const { DodoClient } = require('../../../src/lib/dodo.cjs');
const { eq } = require('drizzle-orm');

const dodo = new DodoClient();

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', allowed: 'POST' });
  }

  const signature = req.headers['dodo-signature'] || req.headers['x-dodo-signature'];
  const eventId = req.headers['dodo-event-id'] || req.headers['x-dodo-event-id'] || `webhook-${Date.now()}`;
  
  // Safely stringify request body
  let payload;
  try {
    payload = JSON.stringify(req.body);
  } catch (error) {
    console.error('Failed to stringify webhook payload:', error);
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  console.log('Webhook received:', { 
    eventId, 
    type: req.body?.type, 
    hasSignature: !!signature,
    bodySize: payload.length,
    hasData: !!req.body?.data
  });

  // Verify webhook signature
  if (!signature || !dodo.verifyWebhook(payload, signature)) {
    console.error('Invalid webhook signature', { 
      signature: signature ? 'present' : 'missing', 
      hasSecret: !!process.env.DODO_SECRET_KEY 
    });
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const { type, data } = req.body;
  
  // Validate required fields
  if (!type) {
    return res.status(400).json({ error: 'Missing event type' });
  }
  
  if (!data) {
    return res.status(400).json({ error: 'Missing event data' });
  }

  try {
    // Check for duplicate events (idempotency)
    const existingEvent = await db
      .select({ id: webhookEvents.id })
      .from(webhookEvents)
      .where(eq(webhookEvents.id, eventId))
      .limit(1);

    if (existingEvent.length > 0) {
      console.log('Duplicate webhook event ignored:', eventId);
      return res.status(200).json({ status: 'duplicate_ignored', eventId });
    }

    // Store webhook event for audit trail
    await db.insert(webhookEvents).values({
      id: eventId,
      eventType: type,
      orgId: data?.metadata?.orgId || 'unknown',
      data: payload,
      type: type,
      payload: req.body,
      receivedAt: new Date(),
      processedAt: new Date(),
    });

    // Process the event based on type with comprehensive error handling
    let result = {};
    switch (type) {
      case 'checkout.session.completed':
        result = await handleCheckoutCompleted(data);
        break;
      case 'subscription.created':
      case 'subscription.updated':
        result = await handleSubscriptionUpdate(data);
        break;
      case 'subscription.cancelled':
        result = await handleSubscriptionCancelled(data);
        break;
      case 'payment.succeeded':
        result = await handlePaymentSucceeded(data);
        break;
      case 'invoice.payment_succeeded':
        result = await handleInvoicePayment(data);
        break;
      default:
        console.log('Unhandled webhook event type:', type);
        result = { status: 'unhandled', type };
    }

    console.log('Webhook processed successfully:', { eventId, type, result });
    res.status(200).json({ 
      status: 'processed', 
      eventId, 
      type,
      result 
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Processing failed', 
      message: error.message,
      eventId 
    });
  }
};

async function handleCheckoutCompleted(data) {
  // Comprehensive null checks for metadata
  const metadata = data?.metadata;
  if (!metadata) {
    throw new Error('Missing metadata in checkout event');
  }

  const orgId = metadata.orgId;
  const planCode = metadata.planCode;

  if (!orgId || !planCode) {
    throw new Error(`Missing required metadata: orgId=${!!orgId}, planCode=${!!planCode}`);
  }

  console.log('Processing checkout completion:', { orgId, planCode });

  const planDetails = {
    'pro-500': { plan: 'pro', quotaLimit: 500 },
    'ent-2000': { plan: 'enterprise', quotaLimit: 2000 }
  };

  const plan = planDetails[planCode];
  if (!plan) {
    throw new Error(`Invalid plan code: ${planCode}`);
  }

  // Safe access to nested subscription data
  const currentPeriodEnd = data?.subscription?.current_period_end 
    ? new Date(data.subscription.current_period_end * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days from now

  await db.update(orgs)
    .set({
      plan: plan.plan,
      planCode: planCode,
      billingStatus: 'active',
      dodoCustomerId: data?.customer_id || null,
      dodoSubscriptionId: data?.subscription_id || null,
      currentPeriodEnd: currentPeriodEnd,
      quotaLimit: plan.quotaLimit,
      quotaUsed: 0,
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    })
    .where(eq(orgs.id, orgId));

  console.log(`Subscription activated: org=${orgId}, plan=${planCode}, quota=${plan.quotaLimit}`);
  return { 
    action: 'subscription_activated', 
    orgId, 
    plan: plan.plan, 
    quotaLimit: plan.quotaLimit 
  };
}

async function handleSubscriptionUpdate(data) {
  const orgId = data?.metadata?.orgId;
  if (!orgId) {
    throw new Error('Missing orgId in subscription metadata');
  }

  const billingStatus = data?.status === 'active' ? 'active' : 'inactive';
  const currentPeriodEnd = data?.current_period_end 
    ? new Date(data.current_period_end * 1000)
    : null;
  
  const updateData = {
    billingStatus: billingStatus,
    updatedAt: new Date(),
  };
  
  if (currentPeriodEnd) {
    updateData.currentPeriodEnd = currentPeriodEnd;
  }

  await db.update(orgs)
    .set(updateData)
    .where(eq(orgs.id, orgId));

  console.log(`Subscription updated: org=${orgId}, status=${billingStatus}`);
  return { action: 'subscription_updated', orgId, billingStatus };
}

async function handleSubscriptionCancelled(data) {
  const orgId = data?.metadata?.orgId;
  if (!orgId) {
    throw new Error('Missing orgId in cancellation metadata');
  }

  await db.update(orgs)
    .set({
      billingStatus: 'cancelled',
      cancelAtPeriodEnd: true,
      updatedAt: new Date(),
    })
    .where(eq(orgs.id, orgId));

  console.log(`Subscription cancelled: org=${orgId}`);
  return { action: 'subscription_cancelled', orgId };
}

async function handlePaymentSucceeded(data) {
  const orgId = data?.metadata?.orgId;
  const customerId = data?.customer_id;
  const amount = data?.amount;
  
  console.log('Payment succeeded:', { orgId, customerId, amount });
  return { action: 'payment_logged', orgId, amount };
}

async function handleInvoicePayment(data) {
  const orgId = data?.metadata?.orgId;
  const invoiceId = data?.id;
  
  console.log('Invoice payment succeeded:', { orgId, invoiceId });
  
  if (orgId) {
    await db.update(orgs)
      .set({
        quotaUsed: 0,
        billingStatus: 'active',
        updatedAt: new Date(),
      })
      .where(eq(orgs.id, orgId));
  }
  
  return { action: 'usage_reset', orgId, invoiceId };
}
