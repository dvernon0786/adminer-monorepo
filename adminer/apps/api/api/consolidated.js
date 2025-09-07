export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action } = req.query;
  
  if (action === 'quota/status') {
    // Get organization ID from headers (in real app, this would come from Clerk auth)
    const orgId = req.headers['x-org-id'] || 'test-org';
    
    // Return mock data for now
    res.status(200).json({
      success: true,
      data: {
        used: 45,
        limit: 100,
        percentage: 45,
        plan: 'free'
      }
    });
  } else if (action === 'health') {
    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } else if (action === 'quota/consume') {
    // New endpoint for consuming quota
    const { amount, type, description } = req.body;
    const orgId = req.headers['x-org-id'] || 'test-org';
    
    if (!amount || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: amount, type'
      });
    }
    
    // Return mock success for now
    res.status(200).json({
      success: true,
      data: {
        orgId,
        amount,
        type,
        description,
        message: 'Quota consumption logged (mock)'
      }
    });
  } else if (action === 'env-check') {
    // Environment variables check
    res.status(200).json({
      success: true,
        environment: {
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasApifyToken: !!process.env.APIFY_TOKEN,
          hasApifyActorId: !!process.env.APIFY_ACTOR_ID,
          nodeEnv: process.env.NODE_ENV
        },
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(200).json({ 
      success: true, 
      action: action || 'unknown',
      message: 'API endpoint working',
      availableActions: ['quota/status', 'quota/consume', 'health', 'env-check']
    });
  }
}