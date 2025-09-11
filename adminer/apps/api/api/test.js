module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.status(200).json({
    success: true,
    message: 'API test endpoint working',
    timestamp: new Date().toISOString(),
    method: req.method,
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    headers: req.headers,
    url: req.url
  });
};