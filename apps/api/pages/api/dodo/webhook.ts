import type { NextApiRequest, NextApiResponse } from "next";
const getRawBody = require("raw-body");
import * as crypto from "crypto";
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
  if (req.method !== "POST") return res.status(405).end();

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
  const exists = await db.query.webhookEvents.findFirst({ where: eq(webhookEvents.id, evt.id) });
  if (exists) return res.status(200).json({ ok: true, idempotent: true });

  const { type, data } = evt;

  await db.transaction(async (tx: any) => {
    await tx.insert(webhookEvents).values({ id: evt.id, source: "dodo" });

    // Map payload (adjust field names to your Dodo payload)
    const orgId: string = data?.metadata?.orgId ?? data?.orgId;
    const customerId: string | undefined = data?.customerId;
    const subscriptionId: string | undefined = data?.subscriptionId;
    const status: string = data?.status ?? "active";
    const product: string = data?.product ?? "pro";
    const periodEnd: string | undefined = data?.currentPeriodEnd;

    if (!orgId) throw new Error("Missing orgId in webhook data");

    const nextPlan = type === "subscription.canceled"
      ? "free"
      : planFromProduct(product);

    const nextLimit = PLAN_LIMITS[nextPlan as keyof typeof PLAN_LIMITS];

    const patch: Partial<typeof orgs.$inferInsert> = {
      plan: nextPlan as any,
      subscriptionStatus: status,
      monthlyLimit: nextLimit,
      dodoCustomerId: customerId,
      dodoSubscriptionId: subscriptionId,
      currentPeriodEnd: periodEnd ? new Date(periodEnd) : null,
      canceledAt: type === "subscription.canceled" ? new Date() : null,
      updatedAt: new Date(),
    };

    await tx.update(orgs).set(patch).where(eq(orgs.id, orgId));
  });

  return res.status(200).json({ ok: true });
} 