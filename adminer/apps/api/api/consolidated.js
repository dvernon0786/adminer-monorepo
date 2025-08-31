module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const action = req.query.action;
  
  switch (action) {
    case 'quota/status':
      // Return mock quota data for now
      res.json({
        success: true,
        data: {
          quota: {
            remaining: 100,
            total: 1000,
            resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }
        }
      });
      break;
      
    case 'health':
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
      break;
      
    default:
      res.json({
        success: true,
        message: 'API endpoint available',
        action: action || 'none'
      });
  }
}; 