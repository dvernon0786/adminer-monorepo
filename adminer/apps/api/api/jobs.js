import { createJob, checkQuota } from '../src/lib/inngest.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'POST') {
      // Create new job
      const { type, input } = req.body;
      const orgId = req.headers['x-org-id'] || 'test-org';
      
      if (!type || !input) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: type, input'
        });
      }
      
      // Check quota before creating job
      const quotaAmount = getQuotaAmount(type, input);
      await checkQuota(orgId, quotaAmount);
      
      // Create job
      const job = await createJob(orgId, type, input);
      
      res.status(201).json({
        success: true,
        data: {
          jobId: job.id,
          type: job.type,
          status: job.status,
          createdAt: job.createdAt
        }
      });
      
    } else if (req.method === 'GET') {
      // Get jobs for organization
      const _orgId = req.headers['x-org-id'] || 'test-org';
      const { type: _type, status: _status, limit = 50 } = req.query;
      
      // In a real implementation, this would query the database
      // For now, return mock data
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
    
    if (error.message === 'Quota limit exceeded') {
      res.status(402).json({
        success: false,
        error: 'Quota limit exceeded',
        upgradeUrl: 'https://adminer.online/upgrade'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
}

// Helper function to determine quota consumption
function getQuotaAmount(type, input) {
  switch (type) {
    case 'scrape':
      return Math.ceil((input.pages || 1) / 10); // 1 quota per 10 pages
    case 'analyze':
      return Math.ceil((input.dataSize || 1000) / 1000); // 1 quota per 1KB
    case 'export':
      return Math.ceil((input.recordCount || 1000) / 1000); // 1 quota per 1K records
    default:
      return 1;
  }
}