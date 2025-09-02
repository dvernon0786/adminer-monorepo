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
    // Load and execute the actual consolidated.js handler
    import('./pages/api/consolidated.js').then(module => {
      const handler = module.default;
      // Create a mock request object with query parameters
      const mockReq = {
        ...req,
        query: query,
        method: req.method
      };
      // Create a Next.js-compatible response object
      const mockRes = {
        ...res,
        status: (code) => {
          res.statusCode = code;
          return mockRes;
        },
        json: (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        },
        setHeader: (name, value) => {
          res.setHeader(name, value);
        },
        end: (data) => {
          res.end(data);
        }
      };
      handler(mockReq, mockRes);
    }).catch(err => {
      console.error('Error loading consolidated handler:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error', details: err.message }));
    });
    return;
  }

  if (pathname === '/api/health') {
    // Load and execute the actual health.js handler
    import('./pages/api/health.js').then(module => {
      const handler = module.default;
      // Create a mock request object with query parameters
      const mockReq = {
        ...req,
        query: query,
        method: req.method
      };
      // Create a Next.js-compatible response object
      const mockRes = {
        ...res,
        status: (code) => {
          res.statusCode = code;
          return mockRes;
        },
        json: (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        },
        setHeader: (name, value) => {
          res.setHeader(name, value);
        },
        end: (data) => {
          res.end(data);
        }
      };
      handler(mockReq, mockRes);
    }).catch(err => {
      console.error('Error loading health handler:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error', details: err.message }));
    });
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
