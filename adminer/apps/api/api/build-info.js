module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const buildInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV || 'unknown',
    vercelRegion: process.env.VERCEL_REGION || 'unknown',
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID || 'unknown',
    buildTime: new Date().toISOString(),
    uptime: process.uptime()
  };
  
  res.status(200).json(buildInfo);
};