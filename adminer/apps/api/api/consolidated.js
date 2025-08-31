module.exports = function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  
  const { action } = req.query;
  
  try {
    if (action === "quota/status") {
      res.status(200).json({
        success: true,
        data: {
          used: 45,
          limit: 100,
          percentage: 45,
          plan: "free"
        }
      });
    } else if (action === "health") {
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(200).json({
        success: true,
        action: action || "unknown",
        message: "API endpoint working"
      });
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
}
