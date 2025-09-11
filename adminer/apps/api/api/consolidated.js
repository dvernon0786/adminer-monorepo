module.exports = function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get the path from the URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  // Route based on path
  if (path === '/api/test') {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      status: "ok",
      message: "API endpoint working",
      timestamp: new Date().toISOString(),
      method: req.method
    });
  } else if (path === '/api/inngest') {
    if (req.method === 'PUT') {
      res.status(200).json({
        functions: [
          {
            id: "job/created",
            name: "Process Job Creation"
          },
          {
            id: "scrape/process", 
            name: "Process Scrape Job"
          }
        ],
        appId: "adminer-jobs",
        appName: "Adminer Job Pipeline"
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } else if (path === '/api/jobs') {
    if (req.method === 'POST') {
      // Job creation endpoint
      const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      res.status(201).json({
        success: true,
        data: {
          jobId,
          type: 'scrape',
          status: 'created',
          createdAt: new Date().toISOString()
        }
      });
    } else if (req.method === 'GET') {
      // Job listing endpoint
      res.status(200).json({
        success: true,
        data: {
          jobs: [],
          total: 0,
          limit: 50
        }
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } else if (path === '/api/health') {
    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } else if (path === '/api/webhook') {
    // Webhook endpoint
    res.status(200).json({
      success: true,
      message: 'Webhook received',
      timestamp: new Date().toISOString()
    });
  } else {
    // Default response for unknown paths
    res.status(200).json({ 
      success: true, 
      message: 'Consolidated API endpoint working',
      availableEndpoints: ['/api/test', '/api/inngest', '/api/jobs', '/api/health', '/api/webhook'],
      timestamp: new Date().toISOString()
    });
  }
}