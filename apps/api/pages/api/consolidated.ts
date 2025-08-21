import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { unauth } from "../../lib/util";

type HealthPayload = {
  status: "healthy";
  auth: { userId: string; orgId: string | null };
};
type ErrorPayload = { error: string };
type Data = HealthPayload | ErrorPayload;

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  // Middleware enforces auth, but keep a defensive check for clarity/tests:
  const { userId, orgId } = getAuth(req);
  if (!userId) return unauth(res);

  const action = typeof req.query.action === "string" ? req.query.action : undefined;

  if (action === "health") {
    res.status(200).json({ status: "healthy", auth: { userId, orgId: orgId ?? null } });
    return;
  }

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