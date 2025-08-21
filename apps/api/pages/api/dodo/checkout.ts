import { NextApiRequest, NextApiResponse } from 'next'
import { auth } from '@clerk/nextjs/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get authenticated user
    const { userId } = await auth()
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { plan, email } = req.body as { plan: 'pro' | 'enterprise'; email: string }

    if (!plan || !email) {
      return res.status(400).json({ error: 'Missing plan or email' })
    }

    // Only allow pro and enterprise plans (free is handled by /api/dodo/free)
    if (plan === 'free') {
      return res.status(400).json({ error: 'Free plan should use /api/dodo/free endpoint' })
    }

    // Map plan to Dodo price ID
    const priceId = 
      plan === 'pro' ? process.env.DODO_PRICE_PRO :
      plan === 'enterprise' ? process.env.DODO_PRICE_ENTERPRISE :
      null

    if (!priceId) {
      return res.status(500).json({ error: 'Price configuration missing for this plan' })
    }

    // Get Dodo configuration
    const DODO_API_BASE = process.env.DODO_API_BASE || 'https://api.dodopayments.com'
    const DODO_SECRET_KEY = process.env.DODO_SECRET_KEY!
    const APP_BASE_URL = process.env.APP_BASE_URL || 'https://www.adminer.online'

    // Create subscription with payment link
    const response = await fetch(`${DODO_API_BASE}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DODO_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        price_id: priceId,  // Use price_id instead of product_id
        customer: { email },
        payment_link: true, // Returns hosted checkout URL
        metadata: { 
          orgId: userId,
          plan: plan,
          source: 'adminer-web'
        },
        success_url: `${APP_BASE_URL}/dashboard?upgrade=success`,
        cancel_url: `${APP_BASE_URL}/pricing?upgrade=cancelled`
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Dodo API error:', errorData)
      return res.status(response.status).json({ 
        error: 'Payment service error',
        details: errorData
      })
    }

    const data = await response.json()
    
    // Return the hosted checkout URL
    return res.json({ 
      url: data.payment_link,
      subscriptionId: data.id,
      plan: plan
    })

  } catch (error) {
    console.error('Checkout error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
} 