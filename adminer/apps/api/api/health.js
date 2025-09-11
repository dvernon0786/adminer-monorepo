export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV || 'unknown',
    vercelRegion: process.env.VERCEL_REGION || 'unknown',
    endpoint: '/api/health'
  });
}