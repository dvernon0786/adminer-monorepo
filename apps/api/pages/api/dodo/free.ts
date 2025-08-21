import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.end(JSON.stringify({ error: 'Method not allowed' }))
      return
    }

    // Temporarily skip auth for testing
    // const { userId } = getAuth(req)
    // if (!userId) {
    //   res.statusCode = 401
    //   res.end(JSON.stringify({ error: 'Unauthorized' }))
    //   return
    // }

    // Use Next.js built-in body parsing
    const { orgId, orgName } = req.body || {}
    if (!orgId) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'orgId is required' }))
      return
    }

    // For now, let's skip the database operations and just return success
    // This will help us test the endpoint without database setup
    console.log('Free plan request:', { orgId, orgName, userId: 'test-user' })

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      ok: true,
      plan: 'free',
      quotaLimit: 10,
      message: 'Free plan activated successfully (database operations temporarily disabled)'
    }))

  } catch (err: any) {
    console.error(err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Internal error', detail: err.message }))
  }
} 