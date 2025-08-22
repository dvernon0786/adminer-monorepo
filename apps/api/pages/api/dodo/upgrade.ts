import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";

const PLAN_TO_URL: Record<string, string | undefined> = {
  pro: process.env.DODO_CHECKOUT_PRO_URL,
  enterprise: process.env.DODO_CHECKOUT_ENT_URL,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, orgId } = getAuth(req);
  if (!userId || !orgId) return res.status(401).json({ error: "Unauthorized" });

  const { plan } = req.body as { plan: "pro" | "enterprise" };
  if (!plan || !PLAN_TO_URL[plan]) return res.status(400).json({ error: "Invalid plan" });

  // Optionally append orgId as metadata
  const url = new URL(PLAN_TO_URL[plan]!);
  url.searchParams.set("orgId", orgId);

  res.status(200).json({ url: url.toString() });
} 