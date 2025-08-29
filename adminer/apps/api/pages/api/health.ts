import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({ 
    ok: true, 
    healthy: true,
    timestamp: new Date().toISOString(),
    message: "Simple health endpoint working"
  });
} 