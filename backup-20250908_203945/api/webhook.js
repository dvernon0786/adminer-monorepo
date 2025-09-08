export default async function handler(req, res) {
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
        message: 'Webhook endpoint is ready',
        timestamp: new Date().toISOString(),
        method: 'GET'
      });
    } else if (req.method === 'POST') {
      // Handle webhook payload
      const payload = req.body;
      
      return res.status(200).json({
        success: true,
        message: 'Webhook received successfully',
        timestamp: new Date().toISOString(),
        method: 'POST',
        payload: payload
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