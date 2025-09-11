export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method === 'GET') {
    res.status(200).json({
      message: 'Inngest endpoint ready',
      timestamp: new Date().toISOString(),
      status: 'active',
      endpoint: '/api/inngest'
    });
  } else if (req.method === 'POST' || req.method === 'PUT') {
    res.status(200).json({
      message: 'Inngest webhook received',
      method: req.method,
      timestamp: new Date().toISOString(),
      body: req.body || {},
      status: 'processed',
      endpoint: '/api/inngest'
    });
  } else {
    res.status(405).json({
      error: 'Method not allowed',
      allowed: ['GET', 'POST', 'PUT'],
      received: req.method
    });
  }
}