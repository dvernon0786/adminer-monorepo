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
  // Allow only safe methods for this endpoint
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method || '')) {
    res.setHeader('Allow', 'GET, HEAD, OPTIONS')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const action = (req.query.action || '').toString()

  if (action === 'health') {
    // super lightweight health; no DB, no external calls
    return res.status(200).json({ status: 'healthy' })
  }

  // Keep the legacy shim path if you use it elsewhere
  if (action === 'billing/quota') {
    return res.status(200).json({ ok: true, shim: true })
  }

  return res.status(400).json({ error: 'Unknown action' })
} 