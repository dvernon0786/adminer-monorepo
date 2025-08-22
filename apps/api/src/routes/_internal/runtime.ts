import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (process.env.INTERNAL_ENDPOINTS_ENABLED !== "true") {
    return res.status(404).end();
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