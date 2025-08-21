import { NextApiRequest, NextApiResponse } from 'next'
import { withQuotaCheck } from '../../src/lib/quota-middleware'

async function testQuotaHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { orgId, simulateJob } = req.body || {}
    
    if (!orgId) {
      return res.status(400).json({ error: 'orgId is required' })
    }

    if (simulateJob) {
      // Simulate a job creation that would increment quota
      // This is handled by the quota middleware
      return res.status(200).json({
        success: true,
        message: 'Job created successfully (quota incremented)',
        orgId,
        timestamp: new Date().toISOString()
      })
    }

    // Just return quota info without incrementing
    return res.status(200).json({
      success: true,
      message: 'Quota check passed',
      orgId,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Test quota error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Wrap with quota check middleware
export default withQuotaCheck({
  incrementOnSuccess: true,
  jobIdField: 'simulateJob'
})(testQuotaHandler) 