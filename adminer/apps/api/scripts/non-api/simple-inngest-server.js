// SIMPLE INNGEST SERVER - WORKING VERSION
const express = require('express');
const { serve } = require('inngest/express');
const { Inngest } = require('inngest');

// Create Inngest client with proper local dev configuration
const inngest = new Inngest({
  id: "adminer-jobs",
  name: "Adminer Job Processor",
  eventKey: "local-test-key",
  signingKey: "local-test-signing-key",
  isDev: true,
  // CRITICAL: Point to local dev server
  eventBaseUrl: "http://localhost:3001",
  apiBaseUrl: "http://localhost:3001"
});

// Import our function
const { jobCreatedFunction } = require('./src/inngest/functions.js');

const app = express();
app.use(express.json());

// Create Inngest serve handler
const inngestHandler = serve({
  client: inngest,
  functions: [jobCreatedFunction],
  logLevel: 'info'
});

// Mount Inngest handler
app.use('/api/inngest', inngestHandler);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    functions: 1, 
    timestamp: new Date().toISOString(),
    inngestConfig: {
      eventBaseUrl: inngest.eventBaseUrl,
      apiBaseUrl: inngest.apiBaseUrl,
      isDev: inngest.isDev
    }
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Simple Inngest server is running',
    functions: ['job-created'],
    inngestClient: inngest.id
  });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🚀 Simple Inngest server running on http://localhost:${PORT}`);
  console.log(`📡 Inngest endpoint: http://localhost:${PORT}/api/inngest`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log('✅ Inngest client configured for local dev server');
});