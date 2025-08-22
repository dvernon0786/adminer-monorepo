import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { eq, or } from 'drizzle-orm'
import { db } from '../../../src/db/client'
import { orgs, webhook_events } from '../../../src/db/schema'

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
}

// ---- Types (adapt to your actual Dodo event payloads) ----

type DodoEvent = {
  id: string // unique event id from Dodo
  type:
    | "subscription.created"
    | "subscription.activated"
    | "subscription.updated"
    | "subscription.canceled"
    | "subscription.past_due"
  data: {
    customerId: string
    subscriptionId: string
    priceId?: string | null // present on created/updated/activated
    status?: string // active | canceled | past_due | trialing ...
    currentPeriodEnd?: string | null // ISO date
    cancelAtPeriodEnd?: boolean | null
  }
  createdAt?: string // ISO (optional)
}

// ---- Signature Verification ----

function parseSignatureHeader(sigHeader: string | null) {
  if (!sigHeader) return { ts: undefined as number | undefined, v1: undefined as string | undefined }
  // Accept either raw hex or a Stripe-like format: "t=timestamp,v1=hex"
  const parts = sigHeader.split(",")
  let ts: number | undefined
  let v1: string | undefined
  for (const p of parts) {
    const [k, v] = p.split("=")
    if (k === "t" && v) ts = Number(v)
    if (k === "v1" && v) v1 = v
  }
  if (!v1 && parts.length === 1) {
    // Header provided as plain hex digest
    v1 = sigHeader.trim()
  }
  return { ts, v1 }
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

function verifySignature({ rawBody, sigHeader, secret, toleranceSec = 5 * 60 }: {
  rawBody: string
  sigHeader: string | null
  secret: string
  toleranceSec?: number
}) {
  const { ts, v1 } = parseSignatureHeader(sigHeader)
  if (!v1) return false
  if (ts && Math.abs(Math.floor(Date.now() / 1000) - ts) > toleranceSec) {
    return false // too old or too new
  }
  const payload = ts ? `${ts}.${rawBody}` : rawBody
  const computed = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex")
  return safeEqual(computed, v1)
}

function planFromPriceId(priceId?: string | null): "free" | "pro" | "enterprise" {
  if (!priceId) return "free"
  if (process.env.DODO_PRICE_PRO && priceId === process.env.DODO_PRICE_PRO) return "pro"
  if (process.env.DODO_PRICE_ENTERPRISE && priceId === process.env.DODO_PRICE_ENTERPRISE) return "enterprise"
  return "free" // default fallback
}

async function upsertOrgForActiveOrUpdate(data: DodoEvent["data"]) {
  const { customerId, subscriptionId, priceId, currentPeriodEnd, status, cancelAtPeriodEnd } = data
  const plan = planFromPriceId(priceId)

  const updates = {
    plan,
    dodo_customer_id: customerId,
    dodo_subscription_id: subscriptionId,
    current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
    status: status ?? "active",
    updated_at: new Date(),
  } as const

  // Try update by customerId or subscriptionId; if no row updated, you may insert or log.
  const existing = await db
    .select({ id: orgs.id })
    .from(orgs)
    .where(or(eq(orgs.dodo_customer_id, customerId), eq(orgs.dodo_subscription_id, subscriptionId)))

  if (existing.length > 0) {
    await db
      .update(orgs)
      .set(updates)
      .where(or(eq(orgs.dodo_customer_id, customerId), eq(orgs.dodo_subscription_id, subscriptionId)))
    return existing[0].id
  }

  // If you want to auto-create an org when missing, do it here.
  // For safety, we only log (no blind insert) to avoid orphaned orgs.
  console.warn("[dodo:webhook] No matching org; customerId=", customerId, "subscriptionId=", subscriptionId)
  return null
}

async function markOrgCanceled(data: DodoEvent["data"]) {
  const { customerId, subscriptionId, currentPeriodEnd } = data

  const existing = await db
    .select({ id: orgs.id })
    .from(orgs)
    .where(or(eq(orgs.dodo_customer_id, customerId), eq(orgs.dodo_subscription_id, subscriptionId)))

  if (existing.length === 0) return null

  // Policy: downgrade to Free at period end. Store flag now; your cron can perform the actual downgrade when time passes.
  await db
    .update(orgs)
    .set({
      status: "canceled",
      current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
      updated_at: new Date(),
    })
    .where(or(eq(orgs.dodo_customer_id, customerId), eq(orgs.dodo_subscription_id, subscriptionId)))

  return existing[0].id
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.DODO_WEBHOOK_SECRET
  if (!secret) {
    return res.status(500).json({ error: "Missing DODO_WEBHOOK_SECRET" })
  }

  // Read raw body for signature verification
  const chunks: Uint8Array[] = []
  for await (const chunk of req) chunks.push(chunk)
  const rawBody = Buffer.concat(chunks).toString('utf8')
  
  // Handle header extraction safely
  const sigHeaderRaw = req.headers['dodo-signature'] || req.headers['Dodo-Signature'] || req.headers['x-dodo-signature']
  const sigHeader = Array.isArray(sigHeaderRaw) ? sigHeaderRaw[0] : sigHeaderRaw || null

  const valid = verifySignature({ rawBody, sigHeader, secret })
  if (!valid) {
    return res.status(400).json({ error: "Invalid signature" })
  }

  let event: DodoEvent
  try {
    event = JSON.parse(rawBody)
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON" })
  }

  // Idempotency: avoid re-processing the same event
  try {
    await db.insert(webhook_events).values({
      id: event.id,
      event_type: event.type,
      org_id: 'unknown', // Will be updated when we find the org
      data: rawBody,
      processed_at: new Date(),
    })
  } catch (err: any) {
    // If unique violation, consider it already processed
    if (String(err?.message || "").includes("duplicate") || String(err?.code || "") === "23505") {
      return res.status(200).json({ ok: true, idempotent: true })
    }
    console.error("[dodo:webhook] failed to persist event id", event.id, err)
    return res.status(500).json({ error: "Failed to record event" })
  }

  try {
    switch (event.type) {
      case "subscription.created":
      case "subscription.activated":
      case "subscription.updated": {
        const orgId = await upsertOrgForActiveOrUpdate(event.data)
        if (orgId) {
          // Update webhook event with org_id
          await db.update(webhook_events)
            .set({ org_id: orgId })
            .where(eq(webhook_events.id, event.id))
        }
        break
      }
      case "subscription.canceled":
      case "subscription.past_due": {
        const orgId = await markOrgCanceled(event.data)
        if (orgId) {
          // Update webhook event with org_id
          await db.update(webhook_events)
            .set({ org_id: orgId })
            .where(eq(webhook_events.id, event.id))
        }
        break
      }
      default:
        // ignore unrecognized events to be forward-compatible
        break
    }
  } catch (err) {
    console.error("[dodo:webhook] handler error", err)
    return res.status(500).json({ error: "Handler error" })
  }

  return res.status(200).json({ ok: true })
} 