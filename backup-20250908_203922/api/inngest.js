export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    functions: [
      {
        id: "job/created",
        name: "Process Job Creation"
      },
      {
        id: "scrape/process", 
        name: "Process Scrape Job"
      }
    ],
    appId: "adminer-jobs",
    appName: "Adminer Job Pipeline"
  });
}
