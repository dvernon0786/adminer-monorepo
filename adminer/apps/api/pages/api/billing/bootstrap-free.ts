import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@clerk/nextjs/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"method_not_allowed" });

  try {
    const { orgId } = await auth();
    if (!orgId) return res.status(200).json({
      ok: true,
      bootstrapped: false,
      planCode: "free-10",
      message: "No org; continue as guest"
    });

    // For now, just return success without database operations
    // TODO: Implement actual plan creation when database is ready
    return res.status(200).json({ 
      ok: true, 
      bootstrapped: true, 
      planCode: "free-10",
      message: "Free plan activated (database integration pending)"
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "server_error" });
  }
} 