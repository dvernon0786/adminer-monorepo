const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.get('/api/consolidated', (req, res) => {
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
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Serve SPA for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'public')}`);
  console.log(`🔗 API endpoints available at: http://localhost:${PORT}/api/*`);
}); 