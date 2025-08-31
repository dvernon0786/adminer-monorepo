const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Middleware to parse query parameters
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// API endpoint for consolidated actions
app.get('/api/consolidated', (req, res) => {
  const { action } = req.query;
  
  if (action === 'quota/status') {
    res.json({
      success: true,
      data: {
        used: 45,
        limit: 100,
        percentage: 45
      }
    });
  } else {
    res.json({ success: true, action });
  }
});

// API endpoint for health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Local server running at http://localhost:${port}`);
  console.log(`📡 API endpoints:`);
  console.log(`   GET /api/consolidated?action=quota/status`);
  console.log(`   GET /api/health`);
  console.log(`🌐 SPA routes: /, /dashboard, etc.`);
}); 