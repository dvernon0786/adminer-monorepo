export default function handler(req, res) {
  const { action } = req.query;
  
  if (action === 'quota/status') {
    res.status(200).json({
      success: true,
      data: {
        used: 45,
        limit: 100,
        percentage: 45
      }
    });
  } else {
    res.status(200).json({ success: true, action });
  }
}
