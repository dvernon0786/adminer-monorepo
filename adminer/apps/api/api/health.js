export default function handler(req, res) {
  try {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      error: "Health check failed",
      message: error.message
    });
  }
}
