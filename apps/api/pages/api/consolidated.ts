import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "../../src/db/client";
import { orgs } from "../../src/db/schema";
import { eq } from "drizzle-orm";

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
type QuotaPayload = {
  plan: string;
  usage: number;
  limit: number;
  remaining: number;
  upgradeUrl: string | null;
};
type ErrorPayload = { error: string };
type Data = HealthPayload | AuthPayload | QuotaPayload | ErrorPayload;

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
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (action === "quota/status") {
    if (!orgId) {
      res
        .status(400)
        .json({ error: "Organization context is required for this endpoint. Please select or join an organization." });
      return;
    }

    try {
      const org = await db.select().from(orgs).where(eq(orgs.id, orgId)).limit(1).then(rows => rows[0]);
      if (!org) return res.status(404).json({ error: "Org not found" });

      const remaining = Math.max(0, org.monthlyLimit - org.monthlyUsage);
      const exceeded = remaining <= 0;

      const upgradeUrl = org.plan === "enterprise"
        ? null
        : (org.plan === "pro" ? process.env.DODO_CHECKOUT_ENT_URL : process.env.DODO_CHECKOUT_PRO_URL);

      const payload: QuotaPayload = {
        plan: org.plan,
        usage: org.monthlyUsage,
        limit: org.monthlyLimit,
        remaining,
        upgradeUrl: upgradeUrl || null,
      };

      if (exceeded) {
        res.status(402).json({ ...payload, error: "Quota exceeded. Consider upgrading." });
      } else {
        res.status(200).json(payload);
      }
      return;
    } catch (error) {
      console.error('Quota error:', error);
      res.status(500).json({ error: "Failed to fetch quota information" });
      return;
    }
  }

  res.status(400).json({ error: "Unsupported action" });
} 