const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  console.log(`${req.method} ${pathname}`);

  // API endpoints
  if (pathname === '/api/consolidated') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const { action } = query;
    
    if (action === 'quota/status') {
      res.end(JSON.stringify({
        success: true,
        data: {
          used: 45,
          limit: 100,
          percentage: 45
        }
      }));
    } else {
      res.end(JSON.stringify({ success: true, action }));
    }
    return;
  }

  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Apify endpoints
  if (pathname === '/api/apify/health') {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      service: 'apify',
      status: 'healthy',
      message: 'Apify service is running',
      timestamp: new Date().toISOString(),
      environment: {
        hasToken: !!process.env.APIFY_TOKEN,
        hasActorId: !!process.env.APIFY_ACTOR_ID,
        hasWebhookSecret: !!process.env.WEBHOOK_SECRET_APIFY
      }
    }));
    return;
  }

  if (pathname === '/api/apify/webhook') {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      message: 'Apify webhook endpoint is ready',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Serve static files
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, 'public', filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback - serve index.html for all routes
      fs.readFile(path.join(__dirname, 'public', 'index.html'), (err2, data2) => {
        if (err2) {
          res.writeHead(404);
          res.end('Not found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data2);
        }
      });
    } else {
      const ext = path.extname(filePath);
      const contentType = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.ico': 'image/x-icon'
      }[ext] || 'text/plain';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

const port = 3000;
server.listen(port, () => {
  console.log(`🚀 Simple server running at http://localhost:${port}`);
  console.log(`📡 API endpoints:`);
  console.log(`   GET /api/consolidated?action=quota/status`);
  console.log(`   GET /api/health`);
  console.log(`🌐 SPA routes: /, /dashboard, etc.`);
});
