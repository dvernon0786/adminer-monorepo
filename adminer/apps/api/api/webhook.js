import { webhookDb, orgDb, subscriptionDb } from '../src/lib/db.js';
import { DodoClient } from '../src/lib/dodo.cjs';

const dodo = new DodoClient();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
    // Store webhook event for audit trail
    const webhookEvent = await webhookDb.store(type, 'dodo', req.body);

    // Process the event based on type
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

    // Mark webhook as processed
    await webhookDb.markProcessed(webhookEvent.id);

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
}

async function handleCheckoutCompleted(data) {
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

  // Update organization plan and quota
  await orgDb.update(orgId, {
    plan: plan.plan,
    quotaLimit: plan.quotaLimit,
    quotaUsed: 0 // Reset quota on upgrade
  });

  // Create subscription record
  await subscriptionDb.upsert({
    orgId,
    dodoSubscriptionId: data.subscription?.id || 'unknown',
    plan: plan.plan,
    status: 'active'
  });

  return { status: 'checkout_processed', plan: plan.plan, quotaLimit: plan.quotaLimit };
}

async function handleSubscriptionUpdate(data) {
  const orgId = data?.metadata?.orgId;
  if (!orgId) {
    throw new Error('Missing orgId in subscription update');
  }

  const plan = data.plan?.id || 'free';
  const subscriptionStatus = data.status || 'active';

  // Update organization
  await orgDb.update(orgId, { plan });

  // Update subscription
  await subscriptionDb.upsert({
    orgId,
    dodoSubscriptionId: data.id,
    plan,
    status: subscriptionStatus
  });

  return { status: 'subscription_updated', plan, subscriptionStatus };
}

async function handleSubscriptionCancelled(data) {
  const orgId = data?.metadata?.orgId;
  if (!orgId) {
    throw new Error('Missing orgId in subscription cancellation');
  }

  // Downgrade to free plan
  await orgDb.update(orgId, {
    plan: 'free',
    quotaLimit: 100
  });

  // Update subscription status
  await subscriptionDb.upsert({
    orgId,
    dodoSubscriptionId: data.id,
    plan: 'free',
    status: 'cancelled'
  });

  return { status: 'subscription_cancelled', plan: 'free' };
}

async function handlePaymentSucceeded(data) {
  // Payment succeeded - ensure subscription is active
  const orgId = data?.metadata?.orgId;
  if (orgId) {
    await subscriptionDb.upsert({
      orgId,
      dodoSubscriptionId: data.subscription || 'unknown',
      plan: data.plan || 'pro',
      status: 'active'
    });
  }

  return { status: 'payment_processed' };
}

async function handleInvoicePayment(_data) {
  // Invoice payment succeeded
  return { status: 'invoice_payment_processed' };
}