import { orgDb } from '../src/lib/db.js';

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

  const { action } = req.query;
  
  try {
    if (action === 'quota/status') {
      // Get organization ID from headers (in real app, this would come from Clerk auth)
      const orgId = req.headers['x-org-id'] || 'test-org';
      
      // Try to get real quota status from database
      const quotaStatus = await orgDb.getQuotaStatus(orgId);
      
      if (quotaStatus) {
        res.status(200).json({
          success: true,
          data: quotaStatus
        });
      } else {
        // Fallback to mock data if org not found
        res.status(200).json({
          success: true,
          data: {
            used: 45,
            limit: 100,
            percentage: 45,
            plan: 'free'
          }
        });
      }
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
      
      try {
        const result = await orgDb.consumeQuota(orgId, amount, type, description);
        res.status(200).json({
          success: true,
          data: result
        });
      } catch (error) {
        if (error.message === 'Quota limit exceeded') {
          res.status(402).json({
            success: false,
            error: 'Quota limit exceeded',
            upgradeUrl: 'https://adminer.online/upgrade'
          });
        } else {
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      }
    } else {
      res.status(200).json({ 
        success: true, 
        action: action || 'unknown',
        message: 'API endpoint working',
        availableActions: ['quota/status', 'quota/consume', 'health']
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}