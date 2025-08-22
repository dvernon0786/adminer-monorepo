import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { unauth } from "../../lib/util";
import { getQuotaInfo } from "../../src/lib/quota";

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
  status: "healthy";
  quota: {
    plan: string;
    used: number;
    limit: number;
    remaining: number;
    upgradeUrl: string;
  };
};
type QuotaExceededPayload = {
  error: "quota_exceeded";
  usage: number;
  limit: number;
  plan: string;
  upgrade: {
    pro: string;
    enterprise: string;
    docs: string;
  };
};
type ErrorPayload = { error: string };
type Data = HealthPayload | AuthPayload | QuotaPayload | QuotaExceededPayload | ErrorPayload;

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

    try {
      // Get comprehensive quota information using the new quota system
      const quotaInfo = await getQuotaInfo(orgId);
      
      // Check if quota is exceeded
      if (quotaInfo.used > quotaInfo.limit) {
        // Return 402 Payment Required with upgrade hints
        return res.status(402).json({
          error: "quota_exceeded",
          usage: quotaInfo.used,
          limit: quotaInfo.limit,
          plan: quotaInfo.plan,
          upgrade: {
            pro: "/api/billing/upgrade?plan=pro",
            enterprise: "/api/billing/upgrade?plan=enterprise",
            docs: "Upgrade to increase limits",
          },
        });
      }
      
      // Quota is within limits, return normal response
      res.status(200).json({
        status: "healthy",
        quota: quotaInfo
      });
      return;
    } catch (error) {
      console.error('Quota error:', error);
      res.status(500).json({ error: "Failed to fetch quota information" });
      return;
    }
  }

  res.status(400).json({ error: "Unsupported action" });
} 