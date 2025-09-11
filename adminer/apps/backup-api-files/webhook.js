export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Health check for webhook endpoint
      return res.status(200).json({
        success: true,
        message: 'Apify webhook endpoint is ready',
        timestamp: new Date().toISOString(),
        method: 'GET',
        note: 'Webhook validation disabled - using synchronous API calls'
      });
    } else if (req.method === 'POST') {
      // Handle webhook payload (simplified without signature validation)
      const payload = req.body;
      
      console.log('Apify webhook received (no validation):', {
        eventType: payload?.eventType,
        runId: payload?.data?.runId,
        status: payload?.data?.status,
        hasData: !!payload?.data
      });
      
      return res.status(200).json({
        success: true,
        message: 'Webhook received successfully (no validation)',
        timestamp: new Date().toISOString(),
        method: 'POST',
        eventType: payload?.eventType,
        note: 'Webhook validation disabled - using synchronous API calls'
      });
    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}