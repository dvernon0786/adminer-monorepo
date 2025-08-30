import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;

  if (action === "health") {
    return res.status(200).json({ status: "healthy" });
  }

  if (action === "quota/status") {
    return res.status(200).json({ quota: "ok" });
  }

  return res.status(404).json({ error: "Not found" });
} 