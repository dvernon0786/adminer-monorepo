const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

const consolidated = require('./api/consolidated.js');
const health = require('./api/health.js');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (pathname === '/api/consolidated') {
    consolidated(req, res);
  } else if (pathname === '/api/health') {
    health(req, res);
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Test server running' }));
  }
});

server.listen(3001, () => {
  console.log('Test server running on port 3001');
}); 