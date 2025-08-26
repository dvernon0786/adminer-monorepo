import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";

const DODO = process.env.DODO_API_BASE ?? "https://test.dodopayments.com";

const PLAN_TO_PRODUCT: Record<string, string | undefined> = {
  pro: process.env.DODO_PRO_PRODUCT_ID,
  enterprise: process.env.DODO_ENT_PRODUCT_ID,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { plan, customer_id } = req.body as { plan: "pro" | "enterprise"; customer_id: string };
    const product_id = PLAN_TO_PRODUCT[plan];
    
    if (!product_id) {
      return res.status(400).json({ error: "Unknown plan" });
    }

    const response = await fetch(`${DODO}/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DODO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer: { customer_id },
        product_id,
        quantity: 1,
        payment_link: true, // return a hosted checkout URL
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Dodo API error:", response.status, errorText);
      return res.status(502).json({ error: "Dodo error", detail: errorText });
    }

    const json = await response.json();
    const checkoutUrl = json?.payment_link_url ?? json?.url;
    
    if (!checkoutUrl) {
      return res.status(502).json({ error: "No checkout URL in response" });
    }

    return res.status(200).json({ checkout_url: checkoutUrl });
  } catch (error) {
    console.error("Upgrade endpoint error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 