import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../../src/db/client'
import { orgs, webhook_events } from '../../../src/db/schema'
import { eq } from 'drizzle-orm'
import { resetQuotaForNewPeriod } from '../../../src/lib/quota'
import crypto from 'crypto'

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
}

interface DodoWebhookEvent {
  id: string
  type: string
  data: {
    customerId?: string
    subscriptionId?: string
    priceId?: string
    currentPeriodEnd?: string
    status?: string
    [key: string]: any
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Read raw body for signature verification
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(chunk)
    const rawBody = Buffer.concat(chunks)
    const body = rawBody.toString('utf8')

    // Verify webhook signature
    const signature = req.headers['dodo-signature'] as string
    if (!signature) {
      console.error('Missing Dodo signature header')
      return res.status(400).json({ error: 'Missing signature' })
    }

    const webhookSecret = process.env.DODO_WEBHOOK_SECRET!
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature')
      return res.status(401).json({ error: 'Invalid signature' })
    }

    // Parse webhook event
    let event: DodoWebhookEvent
    try {
      event = JSON.parse(body)
    } catch (error) {
      console.error('Invalid JSON payload:', error)
      return res.status(400).json({ error: 'Invalid JSON payload' })
    }

    // Check idempotency
    const existingEvent = await db.select().from(webhook_events).where(eq(webhook_events.id, event.id)).limit(1)
    if (existingEvent.length > 0) {
      console.log('Webhook event already processed:', event.id)
      return res.status(200).json({ received: true, message: 'Event already processed' })
    }

    // Record webhook event for idempotency
    await db.insert(webhook_events).values({
      id: event.id,
      event_type: event.type,
      org_id: 'unknown', // Will be updated when we find the org
      data: body
    })

    console.log('Processing webhook event:', event.type, event.id)

    // Handle different event types
    switch (event.type) {
      case 'subscription.created':
      case 'subscription.activated':
      case 'subscription.updated':
        await handleSubscriptionUpdate(event)
        break
      
      case 'subscription.canceled':
      case 'subscription.past_due':
        await handleSubscriptionDowngrade(event)
        break
      
      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(event)
        break
      
      default:
        console.log('Unhandled webhook event type:', event.type)
    }

    // Update webhook event with org_id if we found it
    if (event.data.customerId) {
      const org = await db.select().from(orgs).where(eq(orgs.dodo_customer_id, event.data.customerId)).limit(1)
      if (org.length > 0) {
        await db.update(webhook_events)
          .set({ org_id: org[0].id })
          .where(eq(webhook_events.id, event.id))
      }
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleSubscriptionUpdate(event: DodoWebhookEvent) {
  const { customerId, subscriptionId, priceId, currentPeriodEnd, status } = event.data
  
  if (!customerId || !subscriptionId) {
    console.error('Missing required data for subscription update:', event.data)
    return
  }

  // Find org by Dodo customer ID
  const org = await db.select().from(orgs).where(eq(orgs.dodo_customer_id, customerId)).limit(1)
  if (!org.length) {
    console.error('Org not found for customer ID:', customerId)
    return
  }

  // Determine plan from price ID
  let plan = 'free'
  if (priceId === process.env.DODO_PRICE_PRO) {
    plan = 'pro'
  } else if (priceId === process.env.DODO_PRICE_ENTERPRISE) {
    plan = 'enterprise'
  }

  // Update org with new subscription details
  await db.update(orgs)
    .set({
      plan,
      status: status || 'active',
      dodo_customer_id: customerId,
      dodo_subscription_id: subscriptionId,
      current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
      updated_at: new Date()
    })
    .where(eq(orgs.id, org[0].id))

  console.log(`Updated org ${org[0].id} to plan ${plan}`)
}

async function handleSubscriptionDowngrade(event: DodoWebhookEvent) {
  const { customerId } = event.data
  
  if (!customerId) {
    console.error('Missing customer ID for subscription downgrade:', event.data)
    return
  }

  // Find org by Dodo customer ID
  const org = await db.select().from(orgs).where(eq(orgs.dodo_customer_id, customerId)).limit(1)
  if (!org.length) {
    console.error('Org not found for customer ID:', customerId)
    return
  }

  // Downgrade to free plan
  await db.update(orgs)
    .set({
      plan: 'free',
      status: 'canceled',
      updated_at: new Date()
    })
    .where(eq(orgs.id, org[0].id))

  console.log(`Downgraded org ${org[0].id} to free plan`)
}

async function handlePaymentSuccess(event: DodoWebhookEvent) {
  const { customerId, subscriptionId } = event.data
  
  if (!customerId || !subscriptionId) {
    console.error('Missing required data for payment success:', event.data)
    return
  }

  // Find org by Dodo customer ID
  const org = await db.select().from(orgs).where(eq(orgs.dodo_customer_id, customerId)).limit(1)
  if (!org.length) {
    console.error('Org not found for customer ID:', customerId)
    return
  }

  // Reset quota for new billing period
  await resetQuotaForNewPeriod(org[0].id)
  
  // Update status to active
  await db.update(orgs)
    .set({
      status: 'active',
      updated_at: new Date()
    })
    .where(eq(orgs.id, org[0].id))

  console.log(`Reset quota for org ${org[0].id} after successful payment`)
} 