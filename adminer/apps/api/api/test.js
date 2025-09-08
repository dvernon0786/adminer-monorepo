export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: "ok",
    message: "API endpoint working",
    timestamp: new Date().toISOString(),
    method: req.method
  });
}
