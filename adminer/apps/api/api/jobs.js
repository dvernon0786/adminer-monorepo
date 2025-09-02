export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      // Create new job
      const { type, input, keyword, ...additionalParams } = req.body;
      const orgId = req.headers['x-org-id'] || 'test-org';
      
      // Handle both old format (type, input) and new format (keyword, additionalParams)
      const jobType = type || 'scrape';
      const jobInput = input || { keyword, ...additionalParams };
      
      if (!jobInput || (!jobInput.keyword && !jobInput.url)) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: keyword or url'
        });
      }
      
      // Mock job creation for now
      const jobId = `job-${Date.now()}`;
      
      res.status(201).json({
        success: true,
        data: {
          jobId,
          type: jobType,
          status: 'created',
          createdAt: new Date().toISOString()
        }
      });
      
    } else if (req.method === 'GET') {
      // Get jobs for organization
      const orgId = req.headers['x-org-id'] || 'test-org';
      const { type, status, limit = 50 } = req.query;
      
      // Return mock data
      res.status(200).json({
        success: true,
        data: {
          jobs: [
            {
              id: 'job-1',
              type: 'scrape',
              status: 'completed',
              createdAt: new Date().toISOString(),
              completedAt: new Date().toISOString()
            },
            {
              id: 'job-2',
              type: 'analyze',
              status: 'running',
              createdAt: new Date(Date.now() - 30000).toISOString()
            }
          ],
          total: 2,
          limit: parseInt(limit)
        }
      });
      
    } else {
      res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
    
  } catch (error) {
    console.error('Jobs API Error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}