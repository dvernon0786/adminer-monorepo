import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;

  if (action === 'health') {
    return res.status(200).json({ 
      ok: true, 
      healthy: true,
      timestamp: new Date().toISOString(),
      message: "Health check endpoint working"
    });
  }

  if (action === 'quota/status') {
    // Temporarily simplified to avoid import issues
    return res.status(200).json({
      ok: true,
      planCode: 'free-10',
      quota: 10,
      used: 0,
      remaining: 10,
      usage: {
        used: 0,
        quota: 10,
        remaining: 10,
        adsImported: false,
      },
      limit: {
        monthlyCap: 10,
        period: 'monthly',
      },
      plan: {
        code: 'free-10',
        name: 'Free',
        quota: 10,
        period: 'monthly',
      },
    });
  }

  // Default response for unknown actions
  return res.status(400).json({ 
    ok: false, 
    error: "unknown_action",
    message: "Unknown action specified",
    availableActions: ["health", "quota/status"]
  });
} 