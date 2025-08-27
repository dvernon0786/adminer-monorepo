import { NextResponse } from "next/server";
import { headers } from "next/server";
import { db } from "@/db";
import { orgs, plans, webhookEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

// Prefer DODO_WEBHOOK_KEY; fall back to legacy var so existing envs keep working
const WEBHOOK_KEY =
  process.env.DODO_WEBHOOK_KEY ??
  process.env.DODO_WEBHOOK_SECRET ?? // legacy
  "";

const PRO_CODE = process.env.DODO_PRO_PLANCODE || "pro-500";
const ENT_CODE = process.env.DODO_ENTERPRISE_PLANCODE || "ent-2000";

// Optional: if you already have these in env, add them on Vercel too.
// Otherwise you can omit this mapping block entirely.
const DODO_PRO_PRODUCT_ID = process.env.DODO_PRO_PRODUCT_ID;
const DODO_ENT_PRODUCT_ID = process.env.DODO_ENT_PRODUCT_ID;

if (!WEBHOOK_KEY) {
  // Fail fast on boot if missing
  console.warn("[payments/webhook] Missing DODO_WEBHOOK_KEY");
}

// Use nodejs runtime for compatibility
export const runtime = "nodejs";

// Manual Standard Webhooks verification following the spec
async function verifyStandardWebhook(
  rawBody: string, 
  webhookId: string, 
  timestamp: string, 
  signature: string
): Promise<boolean> {
  if (!WEBHOOK_KEY || !webhookId || !timestamp || !signature) {
    return false;
  }

  try {
    // Standard Webhooks format: webhook-id.webhook-timestamp.payload
    const payload = `${webhookId}.${timestamp}.${rawBody}`;
    
    // Create HMAC-SHA256 signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(WEBHOOK_KEY);
    const payloadData = encoder.encode(payload);
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBytes = await crypto.subtle.sign("HMAC", cryptoKey, payloadData);
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    
    return signature === expectedSignature;
  } catch (error) {
    console.error("Webhook verification error:", error);
    return false;
  }
}

function mapToPlanCode(input: { plan?: string | null; productId?: string | null }) {
  // Highest confidence: explicit productId mapping
  if (input.productId) {
    if (DODO_PRO_PRODUCT_ID && input.productId === DODO_PRO_PRODUCT_ID) return PRO_CODE;
    if (DODO_ENT_PRODUCT_ID && input.productId === DODO_ENT_PRODUCT_ID) return ENT_CODE;
  }
  // Fallback: plan string
  if (input.plan === "pro") return PRO_CODE;
  if (input.plan === "enterprise") return ENT_CODE;
  return "free-10";
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const h = headers();

    // Prefer Standard Webhooks header names; accept legacy header for backward-compat
    const webhookId = h.get("webhook-id") ?? "";
    const timestamp = h.get("webhook-timestamp") ?? "";
    const signature = h.get("webhook-signature") ?? h.get("dodo-signature") ?? "";

    // Verify signature per Standard Webhooks spec
    if (!(await verifyStandardWebhook(rawBody, webhookId, timestamp, signature))) {
      return NextResponse.json(
        { ok: false, error: "invalid signature" },
        { status: 401 }
      );
    }

    // Idempotency: ensure we process each webhook-id once
    if (webhookId) {
      const already = await db.query.webhookEvents.findFirst({ 
        where: eq(webhookEvents.id, webhookId),
        columns: { id: true }
      });
      if (already) {
        return NextResponse.json({ ok: true, duplicate: true, id: webhookId });
      }
      
      // Store webhook event for idempotency
      await db.insert(webhookEvents).values({ 
        id: webhookId, 
        type: "unknown" 
      });
    }

    // Accept a flexible payload:
    // {
    //   "type": "subscription.updated",
    //   "orgId": "org_123",
    //   "plan": "pro" | "enterprise" | "free",
    //   "subscription": { "productId": "pdt_xxx" }
    // }
    const event = JSON.parse(rawBody) as any;
    const type = event?.type as string | undefined;
    const orgId = event?.orgId as string | undefined;
    const plan = event?.plan as string | undefined;
    const productId = event?.subscription?.productId as (string | undefined);

    if (!orgId) {
      return NextResponse.json({ ok: false, error: "missing_orgId" }, { status: 400 });
    }

    const planCode = mapToPlanCode({ plan, productId });

    // Update webhook event with actual type and raw payload
    if (webhookId) {
      await db
        .update(webhookEvents)
        .set({ type: type || "unknown", raw: rawBody })
        .where(eq(webhookEvents.id, webhookId));
    }

    // Ensure plans exist
    await db.insert(plans).values([
      { code: "free-10", name: "Free", monthlyQuota: 10 },
      { code: PRO_CODE, name: "Pro", monthlyQuota: 500 },
      { code: ENT_CODE, name: "Enterprise", monthlyQuota: 2000 },
    ]).onConflictDoNothing();

    // Upsert org
    const now = new Date().toISOString();
    await db
      .insert(orgs)
      .values({ id: orgId, planCode, updatedAt: now })
      .onConflictDoUpdate({ target: orgs.id, set: { planCode, updatedAt: now } });

    return NextResponse.json({ 
      ok: true, 
      id: webhookId, 
      type, 
      orgId, 
      planCode, 
      mappedBy: productId ? "productId" : "plan" 
    });
  } catch (err: any) {
    // Distinguish 401 signature vs 400 payload
    const isSigError = /signature|verify/i.test(String(err?.message ?? ""));
    return NextResponse.json(
      { ok: false, error: isSigError ? "invalid signature" : "bad request" },
      { status: isSigError ? 401 : 400 }
    );
  }
}

export async function GET() {
  // Consistent with adaptor docs: non-POST => 405
  return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
} 