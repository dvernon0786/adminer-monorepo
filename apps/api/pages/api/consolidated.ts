import type { NextApiRequest, NextApiResponse } from "next";

type HealthPayload = {
  status: "healthy";
  message: string;
};

type ErrorPayload = { error: string };

type Data = HealthPayload | ErrorPayload;

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const action = typeof req.query.action === "string" ? req.query.action : undefined;

  if (action === "health") {
    res.status(200).json({
      status: "healthy",
      message: "API is working without Clerk middleware"
    });
    return;
  }

  res.status(400).json({ error: "Unsupported action" });
} 