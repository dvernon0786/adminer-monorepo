import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth, currentUser } from "@clerk/nextjs/server";
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

    // Get user details from Clerk
    const user = await currentUser();
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      return res.status(400).json({ error: "User email required" });
    }

    const userEmail = user.emailAddresses[0].emailAddress;
    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.username || `User ${userId}`;

    // Create Dodo customer
    const customerResponse = await fetch(`${DODO_API_BASE}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DODO_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userEmail,
        name: userName,
        metadata: {
          clerk_user_id: userId,
          clerk_org_id: orgId
        }
      })
    });

    if (!customerResponse.ok) {
      const errorText = await customerResponse.text();
      console.error('Dodo customer creation failed:', customerResponse.status, errorText);
      return res.status(502).json({ 
        error: `Dodo customer creation failed: ${customerResponse.status}`,
        details: errorText
      });
    }

    const customerData = await customerResponse.json();
    const customerId = customerData.id;

    // Create Dodo subscription
    const subscriptionResponse = await fetch(`${DODO_API_BASE}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DODO_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: customerId,
        product_id: DODO_FREE_PRODUCT_ID,
        status: 'active',
        metadata: {
          clerk_user_id: userId,
          clerk_org_id: orgId,
          plan_type: 'free'
        }
      })
    });

    if (!subscriptionResponse.ok) {
      const errorText = await subscriptionResponse.text();
      console.error('Dodo subscription creation failed:', subscriptionResponse.status, errorText);
      return res.status(502).json({ 
        error: `Dodo subscription creation failed: ${subscriptionResponse.status}`,
        details: errorText
      });
    }

    const subscriptionData = await subscriptionResponse.json();
    const subscriptionId = subscriptionData.id;

    // Update org with Dodo IDs and free plan
    await db.update(orgs)
      .set({ 
        plan: "free", 
        quota_limit: 10,
        dodo_customer_id: customerId,
        dodo_subscription_id: subscriptionId,
        updated_at: new Date()
      })
      .where(eq(orgs.id, orgId));

    return res.status(200).json({ 
      ok: true, 
      plan: "free", 
      customerId,
      subscriptionId,
      message: "Free plan activated with Dodo subscription"
    });

  } catch (e: any) {
    console.error("bootstrap-free", e);
    return res.status(500).json({ error: e?.message ?? "Internal error" });
  }
} 