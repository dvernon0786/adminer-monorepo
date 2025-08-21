import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { unauth } from "../../lib/util";

type HealthPayload = {
  status: "healthy";
  message: string;
};
type AuthPayload = {
  status: "healthy";
  auth: {
    userId: string;
    orgId: string | null;
  };
};
type ErrorPayload = { error: string };
type Data = HealthPayload | AuthPayload | ErrorPayload;

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const action = typeof req.query.action === "string" ? req.query.action : undefined;

  // Health endpoint is public (no auth required)
  if (action === "health") {
    res.status(200).json({ 
      status: "healthy", 
      message: "API is working - health endpoint is public" 
    });
    return;
  }

  // All other actions require authentication
  const { userId, orgId } = getAuth(req);
  if (!userId) return unauth(res);

  if (action === "quota/status") {
    if (!orgId) {
      res
        .status(400)
        .json({ error: "Organization context is required for this endpoint. Please select or join an organization." });
      return;
    }
    res.status(200).json({ status: "healthy", auth: { userId, orgId } });
    return;
  }

  res.status(400).json({ error: "Unsupported action" });
} 