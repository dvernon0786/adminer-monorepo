// Minimal Inngest endpoint for testing
export default async function handler(req, res) {
  try {
    res.status(200).json({
      success: true,
      message: 'Inngest endpoint working',
      method: req.method,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}