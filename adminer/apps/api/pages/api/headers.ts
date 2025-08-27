import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.DEBUG_HEADERS !== "1") {
    return res.status(404).end();
  }

  const headers: Record<string, string | string[] | undefined> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    // Echo all headers so you can inspect what's actually arriving
    headers[k] = v;
  }

  res.status(200).json({
    path: req.query.path ?? "/",
    sawHeaderCSP: req.headers["content-security-policy"] ?? null,
    note: "If sawHeaderCSP is null, another layer may be setting/stripping CSP. Check Vercel/Cloudflare.",
    headers,
  });
} 