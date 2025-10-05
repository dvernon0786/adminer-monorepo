// Load environment variables
require('dotenv').config({ path: '.env.local' });

const express = require('express');
const { serve } = require('inngest/express');
const { inngest } = require('../../src/inngest/client.js');
const { jobCreatedFunction, aiAnalyze } = require('../../src/inngest/functions.js');

const app = express();

// FIXED: Add body parsing middleware BEFORE Inngest handler
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create Inngest serve handler
const inngestHandler = serve({
  client: inngest,
  functions: [jobCreatedFunction, aiAnalyze],
  logLevel: 'info'
});

// Mount Inngest handler
app.use('/api/inngest', inngestHandler);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', functions: 2 });
});

// Job creation endpoint for testing
app.post('/api/jobs', async (req, res) => {
  try {
    const { keyword, limit = 10 } = req.body;
    const userId = req.headers['x-user-id'] || 'test-user-123';
    const workspaceId = req.headers['x-workspace-id'] || 'test-workspace-123';
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: keyword'
      });
    }
    
    // Generate job ID
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`Creating job: ${jobId} for user: ${userId}`);
    
    // Send event to Inngest
    const inngestResult = await inngest.send({
      name: 'job.created',
      data: {
        jobId,
        keyword,
        limit: parseInt(limit),
        orgId: userId,
        userId: userId,
        workspaceId: workspaceId,
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'api',
          version: '1.0',
          workspaceType: 'personal'
        }
      }
    });
    
    console.log('✅ Inngest event sent successfully:', inngestResult);
    
    res.json({
      success: true,
      message: 'Job created successfully',
      data: { 
        jobId, 
        keyword, 
        limit: parseInt(limit),
        userId,
        workspaceId,
        status: 'queued'
      },
      timestamp: new Date().toISOString(),
      inngest: {
        status: 'sent',
        eventId: inngestResult.ids?.[0] || 'unknown'
      }
    });
    
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: err.message });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🚀 Local Inngest server running on http://localhost:${PORT}`);
  console.log(`📡 Inngest endpoint: http://localhost:${PORT}/api/inngest`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Body parsing middleware enabled`);
});
