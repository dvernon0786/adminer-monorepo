import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "../../../src/db/client";
import { orgs } from "../../../src/db/schema";
import { eq } from "drizzle-orm";

const DODO_API_BASE = process.env.DODO_API_BASE!;
const DODO_SECRET_KEY = process.env.DODO_SECRET_KEY!;
const DODO_FREE_PRODUCT_ID = process.env.DODO_FREE_PRODUCT_ID!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, orgId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!orgId) return res.status(400).json({ error: "Organization context required" });

    // Check if org already has free plan
    const [existingOrg] = await db.select().from(orgs).where(eq(orgs.id, orgId)).limit(1);
    if (!existingOrg) {
      return res.status(404).json({ error: "Organization not found" });
    }

    if (existingOrg.plan === "free") {
      return res.status(200).json({ ok: true, plan: "free", idempotent: true });
    }

    // TODO: Implement Dodo customer and subscription creation
    // For now, just update the org to free plan
    await db.update(orgs)
      .set({ 
        plan: "free", 
        quota_limit: 10,
        updated_at: new Date()
      })
      .where(eq(orgs.id, orgId));

    return res.status(200).json({ 
      ok: true, 
      plan: "free", 
      message: "Free plan activated (Dodo integration pending)" 
    });

  } catch (e: any) {
    console.error("bootstrap-free", e);
    return res.status(500).json({ error: e?.message ?? "Internal error" });
  }
} 