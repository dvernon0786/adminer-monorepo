import type { NextApiRequest, NextApiResponse } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { bootstrapFree } from "@/lib/billing/bootstrapFree";
import { db } from "@/db";
import { users, orgs } from "@/db/schema";
import { eq } from "drizzle-orm";

const DODO_API_BASE = process.env.DODO_API_BASE!;
const DODO_SECRET_KEY = process.env.DODO_SECRET_KEY!;
const DODO_FREE_PRODUCT_ID = process.env.DODO_FREE_PRODUCT_ID!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = auth();
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await currentUser();
    if (!user) return res.status(401).json({ error: "No Clerk user" });

    const result = await bootstrapFree({
      dodo: {
        apiBase: DODO_API_BASE,
        secretKey: DODO_SECRET_KEY,
        freeProductId: DODO_FREE_PRODUCT_ID,
      },
      clerk: {
        userId,
        user,
      },
      db: {
        async selectUserByClerkId(clerkUserId) {
          const [u] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
          return u as any;
        },
        async selectOrgById(id) {
          const [o] = await db.select().from(orgs).where(eq(orgs.id, id)).limit(1);
          return o as any;
        },
        async updateUserDodoCustomer(userId, dodoCustomerId) {
          await db.update(users).set({ dodoCustomerId }).where(eq(users.id, userId));
        },
        async updateOrgPlanAndQuota(orgId, plan, quota, dodoSubscriptionId) {
          await db.update(orgs).set({ plan, quota, dodoSubscriptionId }).where(eq(orgs.id, orgId));
        },
      },
    });

    return res.status(200).json(result);
  } catch (e: any) {
    console.error("bootstrap-free", e);
    return res.status(500).json({ error: e?.message ?? "Internal error" });
  }
} 