import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "../../src/db/client";
import { orgs } from "../../src/db/schema";
import { eq } from "drizzle-orm";

const PLAN_LIMITS: Record<"free" | "pro" | "enterprise", number> = {
  free: 10,
  pro: 500,
  enterprise: 2000,
};

type Plan = keyof typeof PLAN_LIMITS;

function normalizeUsageLimit(row: any) {
  // Support either "monthlyLimit/monthlyUsage" or "limit/used"
  const limit = Number(
    row?.monthlyLimit ?? row?.limit ?? PLAN_LIMITS[(row?.plan as Plan) || "free"]
  );
  const used = Number(row?.monthlyUsage ?? row?.used ?? 0);
  return { limit: isFinite(limit) ? limit : 0, used: isFinite(used) ? used : 0 };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const action = String(req.query.action || "health");

  if (action === "health") {
    return res.status(200).json({ status: "healthy" });
  }

  // Both new and legacy flags
  const isQuota =
    action === "quota/status" ||
    action === "quota" ||
    action === "billing/quota";

  if (!isQuota) {
    return res.status(400).json({ error: "Unsupported action" });
  }

  const auth = getAuth(req);
  if (!auth?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!auth?.orgId) {
    // If you allow personal-tenant usage, adapt here. For now, org required.
    return res.status(400).json({ error: "No active organization" });
  }

  // Load org
  const [row] = await db.select().from(orgs).where(eq(orgs.id, auth.orgId)).limit(1);
  if (!row) {
    return res.status(404).json({ error: "Organization not found" });
  }

  const plan = (row.plan as Plan) || "free";
  const { limit, used } = normalizeUsageLimit(row);
  const enforcedLimit = PLAN_LIMITS[plan] ?? limit; // trust constant first
  const remaining = Math.max(0, enforcedLimit - used);

  const payload = {
    plan,
    limits: { total: enforcedLimit, used, remaining },
    upgrade: {
      pro: process.env.DODO_CHECKOUT_PRO_URL || null,
      enterprise: process.env.DODO_CHECKOUT_ENT_URL || null,
    },
  };

  // Over quota → 402 Payment Required
  if (used >= enforcedLimit) {
    return res.status(402).json({
      code: "payment_required",
      message:
        plan === "free"
          ? "Free plan quota exceeded. Upgrade to unlock more usage."
          : "Plan quota exceeded.",
      ...payload,
    });
  }

  // Within quota → 200 OK
  return res.status(200).json({
    code: "ok",
    ...payload,
  });
} 