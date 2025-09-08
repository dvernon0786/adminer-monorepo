export default async function handler(req, res) {
  return res.status(200).json({
    message: "Test endpoint working",
    timestamp: new Date().toISOString(),
    method: req.method
  });
}