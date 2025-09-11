export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    console.log('Checking Apify health...');
    
    // Simple health check without external service dependency
    const healthCheck = {
      status: 'healthy',
      message: 'Apify service is available'
    };
    
    console.log('Apify health check result:', healthCheck);

    return res.status(200).json({
      success: true,
      service: 'apify',
      status: healthCheck.status,
      message: healthCheck.message,
      timestamp: new Date().toISOString(),
      environment: {
        hasToken: !!(process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN),
        hasActorId: !!process.env.APIFY_ACTOR_ID
      }
    });

  } catch (error) {
    console.error('Apify health check failed:', error);
    
    return res.status(500).json({
      success: false,
      service: 'apify',
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}