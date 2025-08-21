import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import "../../src/env"; // boot-time assert (server-only)
import { unauth } from "../../lib/util";

type HealthPayload = {
  status: "healthy";
  auth: { userId: string; orgId: string | null };
};

type ErrorPayload = { error: string };

type Data = HealthPayload | ErrorPayload;

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  // Even though middleware protects /api/*, keep a defensive check here.
  const { userId, orgId } = getAuth(req);

  if (!userId) {
    return unauth(res);
  }

  const action = typeof req.query.action === "string" ? req.query.action : undefined;

  if (action === "health") {
    res.status(200).json({
      status: "healthy",
      auth: { userId, orgId: orgId ?? null }
    });
    return;
  }

  // Example: endpoint that requires an organization context (for quotas later)
  if (action === "quota/status") {
    if (!orgId) {
      res.status(400).json({
        error: "Organization context is required for this endpoint. Please select or join an organization."
      });
      return;
    }
    res.status(200).json({
      status: "healthy",
      auth: { userId, orgId }
    });
    return;
  }

  res.status(400).json({ error: "Unsupported action" });
} 