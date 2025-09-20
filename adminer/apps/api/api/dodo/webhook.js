import { neon } from '@neondatabase/serverless';
import { DodoClient } from '../../src/lib/dodo.js';

const sql = neon(process.env.DATABASE_URL);
const dodo = new DodoClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const payload = JSON.stringify(req.body);
    const signature = req.headers['dodo-signature'] || req.headers['x-dodo-signature'];

    console.log('DODO_WEBHOOK_RECEIVED:', {
      eventType: req.body.type,
      signature: signature ? 'present' : 'missing',
      timestamp: new Date().toISOString()
    });

    // Verify webhook signature
    if (!dodo.verifyWebhook(payload, signature)) {
      console.error('DODO_WEBHOOK_SIGNATURE_INVALID');
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    const event = req.body;
    const eventType = event.type;
    const eventId = event.id;

    // Check if event already processed (idempotency)
    const existingEvent = await sql`
      SELECT id FROM webhook_events 
      WHERE data->>'eventId' = ${eventId}
      LIMIT 1
    `;

    if (existingEvent[0]) {
      console.log('DODO_WEBHOOK_ALREADY_PROCESSED:', eventId);
      return res.status(200).json({
        success: true,
        message: 'Event already processed'
      });
    }

    // Process different event types
    switch (eventType) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;
      
      default:
        console.log('DODO_WEBHOOK_UNHANDLED_EVENT:', eventType);
    }

    // Log webhook event for tracking
    await sql`
      INSERT INTO webhook_events (
        id, event_type, org_id, data, processed_at
      ) VALUES (
        gen_random_uuid(),
        ${eventType},
        ${event.data?.object?.metadata?.orgId || 'unknown'},
        ${JSON.stringify({ eventId, ...event })},
        NOW()
      )
    `;

    console.log('DODO_WEBHOOK_PROCESSED:', eventType);

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('DODO_WEBHOOK_ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
}

async function handleCheckoutCompleted(event) {
  try {
    const session = event.data.object;
    const metadata = session.metadata;
    const orgId = metadata.orgId;
    const planCode = metadata.planCode;

    console.log('DODO_CHECKOUT_COMPLETED:', {
      sessionId: session.id,
      orgId,
      planCode,
      amount: session.amount_total
    });

    if (!orgId || !planCode) {
      throw new Error('Missing orgId or planCode in checkout session metadata');
    }

    // Determine plan details
    const planMap = {
      'pro-500': { plan: 'pro', quota: 500 },
      'ent-2000': { plan: 'enterprise', quota: 2000 }
    };

    const planDetails = planMap[planCode];
    if (!planDetails) {
      throw new Error(`Invalid plan code: ${planCode}`);
    }

    // Update organization plan and quota
    const updatedOrg = await sql`
      UPDATE organizations 
      SET 
        plan = ${planDetails.plan},
        quota_limit = ${planDetails.quota},
        dodo_customer_id = ${session.customer},
        billing_status = 'active',
        current_period_end = ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()},
        updated_at = NOW()
      WHERE id = ${orgId}
      RETURNING id, plan, quota_limit, quota_used
    `;

    if (!updatedOrg[0]) {
      throw new Error(`Organization not found: ${orgId}`);
    }

    // Create subscription record
    await sql`
      INSERT INTO subscriptions (
        id, org_id, dodo_subscription_id, plan, status, 
        current_period_start, current_period_end, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        ${orgId},
        ${session.subscription || session.id},
        ${planDetails.plan},
        'active',
        NOW(),
        ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()},
        NOW(),
        NOW()
      )
    `;

    console.log('DODO_PLAN_ACTIVATED:', {
      orgId,
      plan: planDetails.plan,
      quota: planDetails.quota,
      customerId: session.customer
    });

  } catch (error) {
    console.error('DODO_CHECKOUT_COMPLETED_ERROR:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(event) {
  try {
    const invoice = event.data.object;
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;

    console.log('DODO_PAYMENT_SUCCEEDED:', {
      invoiceId: invoice.id,
      customerId,
      subscriptionId,
      amount: invoice.amount_paid
    });

    // Update billing status
    await sql`
      UPDATE organizations 
      SET 
        billing_status = 'active',
        current_period_end = ${new Date(invoice.period_end * 1000).toISOString()},
        updated_at = NOW()
      WHERE dodo_customer_id = ${customerId}
    `;

    // Update subscription status
    await sql`
      UPDATE subscriptions 
      SET 
        status = 'active',
        current_period_end = ${new Date(invoice.period_end * 1000).toISOString()},
        updated_at = NOW()
      WHERE dodo_subscription_id = ${subscriptionId}
    `;

    console.log('DODO_BILLING_UPDATED:', { customerId, subscriptionId });

  } catch (error) {
    console.error('DODO_PAYMENT_SUCCEEDED_ERROR:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(event) {
  try {
    const subscription = event.data.object;
    
    console.log('DODO_SUBSCRIPTION_CREATED:', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status
    });

    // Subscription creation is handled in checkout completion
    
  } catch (error) {
    console.error('DODO_SUBSCRIPTION_CREATED_ERROR:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(event) {
  try {
    const subscription = event.data.object;
    
    console.log('DODO_SUBSCRIPTION_UPDATED:', {
      subscriptionId: subscription.id,
      status: subscription.status
    });

    // Update subscription status in database
    await sql`
      UPDATE subscriptions 
      SET 
        status = ${subscription.status},
        current_period_end = ${new Date(subscription.current_period_end * 1000).toISOString()},
        updated_at = NOW()
      WHERE dodo_subscription_id = ${subscription.id}
    `;

  } catch (error) {
    console.error('DODO_SUBSCRIPTION_UPDATED_ERROR:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(event) {
  try {
    const subscription = event.data.object;
    
    console.log('DODO_SUBSCRIPTION_DELETED:', {
      subscriptionId: subscription.id
    });

    // Update organization to free plan
    await sql`
      UPDATE organizations 
      SET 
        plan = 'free',
        quota_limit = 10,
        billing_status = 'cancelled',
        updated_at = NOW()
      WHERE dodo_customer_id = ${subscription.customer}
    `;

    // Update subscription status
    await sql`
      UPDATE subscriptions 
      SET 
        status = 'cancelled',
        updated_at = NOW()
      WHERE dodo_subscription_id = ${subscription.id}
    `;

  } catch (error) {
    console.error('DODO_SUBSCRIPTION_DELETED_ERROR:', error);
    throw error;
  }
}