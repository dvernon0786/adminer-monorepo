import type { NextApiRequest, NextApiResponse } from "next";
import getRawBody from "raw-body";
import crypto from "crypto";
import { db } from "../../../src/db/client";
import { orgs, webhookEvents } from "../../../src/db/schema";
import { eq } from "drizzle-orm";

export const config = {
  api: { bodyParser: false }, // raw body required for HMAC
};

function safeTimingEqual(a: string, b: string) {
  const aBuf = new Uint8Array(Buffer.from(a, "utf8"));
  const bBuf = new Uint8Array(Buffer.from(b, "utf8"));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

type DodoEvent = {
  id: string;
  type: string; // e.g., "subscription.created" | "subscription.updated" | "subscription.canceled"
  data: any;
};

const PLAN_LIMITS: Record<"free" | "pro" | "enterprise", number> = {
  free: 10,
  pro: 500,
  enterprise: 2000,
};

function planFromProduct(product: string): "free" | "pro" | "enterprise" {
  const p = product.toLowerCase();
  if (p.includes("enterprise")) return "enterprise";
  if (p.includes("pro")) return "pro";
  return "free";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "OPTIONS") {
    // Handle CORS preflight
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(204).end();
  }
  
  if (req.method !== "POST") {
    // Explicit 405 with Allow: POST for better client behavior and tests
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const secret = process.env.DODO_WEBHOOK_SECRET;
  if (!secret) return res.status(500).json({ error: "Missing DODO_WEBHOOK_SECRET" });

  const raw = (await getRawBody(req)).toString("utf8");
  const sig = req.headers["x-dodo-signature"];
  if (typeof sig !== "string") return res.status(400).json({ error: "Missing signature" });

  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (!safeTimingEqual(expected, sig)) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  let evt: DodoEvent;
  try {
    evt = JSON.parse(raw);
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  // Idempotency
  const exists = await db.select().from(webhookEvents).where(eq(webhookEvents.id, evt.id)).limit(1);
  if (exists.length > 0) return res.status(200).json({ ok: true, idempotent: true });

  const { type, data } = evt;

  await db.transaction(async (tx: any) => {
    await tx.insert(webhookEvents).values({ id: evt.id, source: "dodo" });

    // Map payload (adjust field names to your Dodo payload)
    // Use external_id for webhook lookups instead of orgId
    const orgExternalId: string | undefined = data?.metadata?.orgExternalId ?? 
                                            data?.orgExternalId ?? 
                                            data?.metadata?.orgId ?? 
                                            data?.orgId;
    const customerId: string | undefined = data?.customerId;
    const subscriptionId: string | undefined = data?.subscriptionId;
    const status: string = data?.status ?? "active";
    const product: string = data?.product ?? "pro";
    const periodEnd: string | undefined = data?.currentPeriodEnd;

    // ✅ Guard: fail fast if missing (prevents silent data loss)
    if (!orgExternalId) {
      console.warn("Webhook rejected: missing orgExternalId", { eventType: type, id: evt.id });
      return res.status(400).json({ error: "missing_orgExternalId" });
    }

    const nextPlan = type === "subscription.canceled"
      ? "free"
      : planFromProduct(product);

    const nextLimit = PLAN_LIMITS[nextPlan as keyof typeof PLAN_LIMITS];

    const patch: Partial<typeof orgs.$inferInsert> = {
      plan: nextPlan as any,
      subscriptionStatus: status,
      quota_monthly: nextLimit,
      dodoCustomerId: customerId,
      dodoSubscriptionId: subscriptionId,
      currentPeriodEnd: periodEnd ? new Date(periodEnd) : null,
      canceledAt: type === "subscription.canceled" ? new Date() : null,
      updatedAt: new Date(),
    };

    // Look up org by external_id instead of id
    const [org] = await tx.select().from(orgs).where(eq(orgs.externalId, orgExternalId)).limit(1);
    if (!org) {
      // choose policy: reject or upsert
      // reject is safest so billing never detaches from quota
      console.warn("Webhook rejected: org not found by external_id", { orgExternalId, eventType: type, id: evt.id });
      return res.status(404).json({ error: "org_not_found_by_external_id" });
    }

    await tx.update(orgs).set(patch).where(eq(orgs.externalId, orgExternalId));
  });

  return res.status(200).json({ ok: true });
} 