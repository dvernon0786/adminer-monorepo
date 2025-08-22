// apps/api/pages/api/dodo/upgrade.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "../../../src/db/client"; // your Drizzle client
import { orgs } from "../../../src/db/schema"; // your Drizzle schema
import { eq } from "drizzle-orm";

// Centralized plan config
const PLAN_LIMITS: Record<"free" | "pro" | "enterprise", number> = {
  free: 10,
  pro: 500,
  enterprise: 2000,
};

type Body = {
  plan: "free" | "pro" | "enterprise";
  // Optional overrides for dynamic routing
  successUrl?: string;
  cancelUrl?: string;
};

// Helper: ensure org row exists and return id
async function ensureOrg(orgId: string, userId: string) {
  // Upsert pattern: try update; if 0 rows, insert
  const updated = await db
    .update(orgs)
    .set({ updatedAt: new Date() })
    .where(eq(orgs.id, orgId));
  // @ts-ignore drizzle returns {rowCount?: number} depending on driver
  if (!updated?.rowCount) {
    await db.insert(orgs).values({
      id: orgId,
      name: `Org ${orgId.slice(0, 8)}`, // fallback name
      plan: "free",
      monthlyLimit: PLAN_LIMITS.free,
      monthlyUsage: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return orgId;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const auth = getAuth(req);
  const userId = auth?.userId ?? null;
  const orgId = auth?.orgId ?? null;

  if (!userId) return res.status(401).json({ error: "Unauthorized: no user" });
  if (!orgId) return res.status(400).json({ error: "Bad Request: no active org" });

  const body: Body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const plan = body?.plan;

  if (!plan || !["free", "pro", "enterprise"].includes(plan)) {
    return res.status(400).json({ error: "Invalid or missing plan" });
  }

  await ensureOrg(orgId, userId);

  // FREE: apply immediately — no redirect, no checkout URL
  if (plan === "free") {
    await db
      .update(orgs)
      .set({
        plan: "free",
        monthlyLimit: PLAN_LIMITS.free,
        // keep current `monthlyUsage`; do NOT reset usage silently unless you intend to
        updatedAt: new Date(),
      })
      .where(eq(orgs.id, orgId));

    return res.status(200).json({
      status: "ok",
      plan: "free",
      limit: PLAN_LIMITS.free,
      message: "Free plan applied immediately (no checkout required).",
    });
  }

  // PAID: redirect using hosted checkout links (static), include metadata
  const isPro = plan === "pro";
  const redirectBase =
    (isPro ? process.env.DODO_CHECKOUT_PRO_URL : process.env.DODO_CHECKOUT_ENT_URL) || "";

  if (!redirectBase) {
    return res.status(500).json({
      error:
        "Missing checkout URL for paid plan. Ensure DODO_CHECKOUT_PRO_URL / DODO_CHECKOUT_ENT_URL are set.",
    });
  }

  // Attach simple metadata as query params (for reconciliation in webhook if needed)
  const url = new URL(redirectBase);
  url.searchParams.set("orgId", orgId);
  url.searchParams.set("userId", userId);
  if (body?.successUrl) url.searchParams.set("success_url", body.successUrl);
  if (body?.cancelUrl) url.searchParams.set("cancel_url", body.cancelUrl);

  return res.status(200).json({
    status: "redirect",
    plan,
    url: url.toString(),
  });
} 