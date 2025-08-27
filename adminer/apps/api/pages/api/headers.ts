import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path = "/" } = req.query;

  // Fake a request against Next's headers config to extract what would apply.
  // In production, just echo the current request's headers.
  const headers: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (key.toLowerCase().startsWith("content-security-policy") || key.toLowerCase().includes("sec") || key.toLowerCase().startsWith("x-")) {
      headers[key] = value;
    }
  }

  res.status(200).json({
    requestedPath: path,
    headers,
  });
} 