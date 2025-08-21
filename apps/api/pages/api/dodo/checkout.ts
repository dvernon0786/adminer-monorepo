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

    // Map plan to Dodo product ID
    const productId = 
      plan === 'pro' ? process.env.DODO_PRODUCT_PRO :
      plan === 'enterprise' ? process.env.DODO_PRODUCT_ENTERPRISE :
      process.env.DODO_PRODUCT_FREE

    if (!productId) {
      return res.status(500).json({ error: 'Product configuration missing' })
    }

    // Create subscription with payment link
    const response = await fetch('https://api.dodopayments.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DODO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: productId,
        customer: { email },
        payment_link: true, // Returns hosted checkout URL
        metadata: { 
          orgId: userId,
          plan: plan,
          source: 'adminer-web'
        }
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