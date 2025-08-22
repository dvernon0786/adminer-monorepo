import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "node:crypto";
import getRawBody from "raw-body";
import { db } from "../../../src/db/client"; // your Drizzle client
import { orgs, webhook_events } from "../../../src/db/schema"; // see migration below
import { eq } from "drizzle-orm";

export const config = { api: { bodyParser: false } };

const headerCandidates = ["x-dodo-signature", "dodo-signature"];

function safeEqual(a: string, b: string) {
  const ab = new Uint8Array(Buffer.from(a));
  const bb = new Uint8Array(Buffer.from(b));
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const raw = (await getRawBody(req)).toString("utf8");
    const sig = headerCandidates
      .map((h) => req.headers[h] as string | undefined)
      .find(Boolean);

    const secret = process.env.DODO_WEBHOOK_SECRET;
    if (!secret || !sig) {
      return res.status(400).json({ error: "Missing signature/secret" });
    }

    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (!safeEqual(sig, expected)) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const evt = JSON.parse(raw);
    const { id: eventId, type, data } = evt;

    // Idempotency: insert-if-not-exists
    try {
      await db.insert(webhook_events).values({
        id: eventId,
        type,
        payload: evt,
        received_at: new Date(),
      });
    } catch {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    // Map product_id -> plan
    const FREE = process.env.DODO_FREE_PRODUCT_ID!;
    const PRO = process.env.DODO_PRO_PRODUCT_ID!;
    const ENT = process.env.DODO_ENT_PRODUCT_ID!;
    const toPlan = (productId: string) =>
      productId === PRO ? "pro" : productId === ENT ? "enterprise" : "free";

    // Handle subscription events
    if (type === "subscription.activated" || type === "subscription.updated") {
      const productId = data?.product_id as string;
      const externalCustomerId = data?.customer?.customer_id as string; // you set this on creation
      const plan = toPlan(productId);
      if (externalCustomerId && plan) {
        await db.update(orgs).set({ plan }).where(eq(orgs.external_customer_id, externalCustomerId));
      }
    }

    if (type === "subscription.canceled" || type === "subscription.past_due") {
      const externalCustomerId = data?.customer?.customer_id as string;
      if (externalCustomerId) {
        await db.update(orgs).set({ plan: "free" }).where(eq(orgs.external_customer_id, externalCustomerId));
      }
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 