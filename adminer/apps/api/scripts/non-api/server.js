// Load environment variables
require('dotenv').config({ path: '.env.local' });

const express = require('express');
const { serve } = require('inngest/express');
const { inngest } = require('./src/inngest/client.js');
const { jobCreatedFunction } = require('./src/inngest/functions.js');

const app = express();

// FIXED: Add body parsing middleware BEFORE Inngest handler
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
  res.json({ status: 'ok', functions: 1 });
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
