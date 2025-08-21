import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { orgId, orgName } = req.body || {}
    
    if (!orgId) {
      return res.status(400).json({ error: 'orgId is required' })
    }

    console.log('Test free plan request:', { orgId, orgName })

    // Return mock success response
    return res.status(200).json({
      ok: true,
      plan: 'free',
      quotaLimit: 10,
      message: 'Free plan activated successfully (test endpoint)'
    })

  } catch (error) {
    console.error('Test endpoint error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
} 