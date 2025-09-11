export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: 'Minimal consolidated API working',
    timestamp: new Date().toISOString()
  });
}