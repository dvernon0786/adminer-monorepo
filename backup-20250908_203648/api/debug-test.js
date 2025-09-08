export default function handler(req, res) {
  console.log('Debug test function called');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasApifyToken: !!process.env.APIFY_TOKEN
  });
  
  res.status(200).json({
    success: true,
    message: 'Debug test function working',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasApifyToken: !!process.env.APIFY_TOKEN,
      hasApifyActorId: !!process.env.APIFY_ACTOR_ID
    }
  });
}