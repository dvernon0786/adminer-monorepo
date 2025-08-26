import type { NextApiRequest, NextApiResponse } from "next";
import { withInternalSecurity } from "../../middleware/internal-security";

function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const mem = process.memoryUsage();
  const info = {
    upSeconds: Math.round(process.uptime()),
    node: process.version,
    vercelEnv: process.env.VERCEL_ENV ?? "local",
    rssMB: Math.round(mem.rss / 1024 / 1024),
    heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
    eventLoopDelayHintMs: 0 // keep simple; can add perf_hooks later if needed
  };

  res.json(info);
}

// Export with security middleware
export default withInternalSecurity(handler); 