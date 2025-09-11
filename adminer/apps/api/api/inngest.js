module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Handle different HTTP methods
  if (req.method === 'GET') {
    res.status(200).json({
      message: 'Inngest endpoint active',
      method: 'GET',
      timestamp: new Date().toISOString(),
      status: 'ready'
    });
  } else if (req.method === 'POST' || req.method === 'PUT') {
    res.status(200).json({
      message: 'Inngest webhook received',
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString(),
      status: 'processed'
    });
  } else {
    res.status(405).json({
      error: 'Method not allowed',
      allowed: ['GET', 'POST', 'PUT'],
      received: req.method
    });
  }
};