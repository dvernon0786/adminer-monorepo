export default function handler(req, res) {
  res.status(200).json({
    message: 'Adminer API is running',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      '/api/test',
      '/api/inngest', 
      '/api/health'
    ]
  });
}