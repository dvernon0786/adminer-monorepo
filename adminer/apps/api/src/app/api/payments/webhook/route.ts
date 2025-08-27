import { NextResponse } from "next/server";
import { db } from "@/db";
import { orgs, plans } from "@/db/schema";
import { eq } from "drizzle-orm";

const DODO_WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET!;
const PRO_CODE = process.env.DODO_PRO_PLANCODE || "pro-500";
const ENT_CODE = process.env.DODO_ENTERPRISE_PLANCODE || "ent-2000";

// Optional: if you already have these in env, add them on Vercel too.
// Otherwise you can omit this mapping block entirely.
const DODO_PRO_PRODUCT_ID = process.env.DODO_PRO_PRODUCT_ID;
const DODO_ENT_PRODUCT_ID = process.env.DODO_ENT_PRODUCT_ID;

export const runtime = "edge";

async function verifySignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(DODO_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return signature === hex;
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
  const raw = await req.text();
  const sig = req.headers.get("dodo-signature");
  const ok = await verifySignature(raw, sig);
  if (!ok) return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });

  try {
    // Accept a flexible payload:
    // {
    //   "type": "subscription.updated",
    //   "orgId": "org_123",
    //   "plan": "pro" | "enterprise" | "free",
    //   "subscription": { "productId": "pdt_xxx" }
    // }
    const event = JSON.parse(raw) as any;
    const type = event?.type as string | undefined;
    const orgId = event?.orgId as string | undefined;
    const plan = event?.plan as string | undefined;
    const productId = event?.subscription?.productId as (string | undefined);

    if (!orgId) {
      return NextResponse.json({ ok: false, error: "missing_orgId" }, { status: 400 });
    }

    const planCode = mapToPlanCode({ plan, productId });

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

    return NextResponse.json({ ok: true, type, orgId, planCode, mappedBy: productId ? "productId" : "plan" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server_error" }, { status: 500 });
  }
} 