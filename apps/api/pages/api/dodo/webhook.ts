import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

// Verify Dodo webhook signature
function verifySignature(signature: string, body: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(body, 'utf8')
  const expectedSignature = `sha256=${hmac.digest('hex')}`
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const signature = req.headers['x-dodo-signature'] as string
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET

    if (!signature || !webhookSecret) {
      console.error('Missing webhook signature or secret')
      return res.status(400).json({ error: 'Invalid webhook' })
    }

    // Verify webhook signature
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    if (!verifySignature(signature, rawBody, webhookSecret)) {
      console.error('Invalid webhook signature')
      return res.status(400).json({ error: 'Invalid signature' })
    }

    const event = JSON.parse(rawBody)
    console.log('Dodo webhook received:', event.type)

    // Handle subscription lifecycle events
    if (event.type === 'subscription.created' || event.type === 'subscription.updated') {
      const { status, product_id, customer, metadata } = event.data
      const orgId = metadata?.orgId
      const plan = metadata?.plan

      if (!orgId || !plan) {
        console.error('Missing orgId or plan in webhook metadata')
        return res.status(400).json({ error: 'Invalid metadata' })
      }

      // Map product to plan and quota
      const quota = 
        plan === 'pro' ? 500 :
        plan === 'enterprise' ? 2000 : 10

      // TODO: Update your database with the new plan and quota
      // await updateOrgPlanInDb({ orgId, plan, quota, status })
      
      console.log(`Updated org ${orgId} to ${plan} plan with ${quota} quota`)
    }

    // Handle payment success events
    if (event.type === 'payment.succeeded') {
      const { subscription_id, amount, currency } = event.data
      console.log(`Payment succeeded for subscription ${subscription_id}: ${amount} ${currency}`)
      
      // TODO: Update subscription status, mark invoice as paid, etc.
      // await markSubscriptionPaid(subscription_id)
    }

    // Handle subscription cancellation
    if (event.type === 'subscription.cancelled') {
      const { subscription_id, metadata } = event.data
      const orgId = metadata?.orgId
      
      if (orgId) {
        // TODO: Downgrade org to free plan
        // await updateOrgPlanInDb({ orgId, plan: 'free', quota: 10, status: 'cancelled' })
        console.log(`Subscription cancelled for org ${orgId}`)
      }
    }

    res.json({ received: true, processed: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Configure Next.js to parse raw body for webhook verification
export const config = {
  api: {
    bodyParser: false,
  },
} 