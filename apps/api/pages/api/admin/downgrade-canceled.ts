import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { findDowngradeCandidates, downgradeOrgToFree } from "../../../src/db/queries/billing";

type Candidate = Awaited<ReturnType<typeof findDowngradeCandidates>>[number];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed', 
      message: 'This endpoint only accepts POST requests',
      allowedMethods: ['POST'],
      receivedMethod: req.method
    });
  }

  // Production security: enforce auth in prod, dev bypass only skips auth
  const isProd = process.env.NODE_ENV === "production";
  const allowUnAuth = process.env.ALLOW_UNAUTH_DEV === "true";
  const autoEnabled = process.env.BILLING_AUTODOWNGRADE_ENABLED === "true";

  // auth fence: dev may bypass, prod must be authenticated by middleware (already set up)
  if (isProd && allowUnAuth) {
    console.warn("[Admin Downgrade] ALLOW_UNAUTH_DEV is ignored in production");
  }

  let userId = null;
  if (!isProd && allowUnAuth) {
    console.log("[Admin Downgrade] Dev bypass enabled - skipping authentication");
    userId = "dev-bypass-user";
  } else {
    // Basic authentication check - you may want to enhance this with proper admin role checking
    const auth = getAuth(req);
    userId = auth.userId;
    if (!userId) {
      console.log("[Admin Downgrade] Authentication failed - no userId");
      return res.status(403).json({ error: "Forbidden - Authentication required" });
    }
  }

  // TODO: Add your admin check here
  // if (!isAdmin(userId)) return res.status(403).json({ error: "Forbidden - Admin access required" });

  // feature flag: hard stop if disabled
  if (!autoEnabled) {
    return res.status(200).json({ ok: true, skipped: true, reason: "feature_flag_off" });
  }

  const dryRun = req.query.dryRun === "1";
  const now = new Date();

  console.log(`[Admin Downgrade] ${dryRun ? 'DRY RUN' : 'EXECUTE'} requested at ${now.toISOString()} by user ${userId}`);

  try {
    const candidates = await findDowngradeCandidates(now);
    console.log(`[Admin Downgrade] Found ${candidates.length} candidates for downgrade`);
    
    if (dryRun) {
      console.log(`[Admin Downgrade] DRY RUN: Would downgrade ${candidates.length} organizations`);
      return res.json({ 
        dryRun: true, 
        candidates: candidates.map((org: Candidate) => ({ 
          id: org.id, 
          name: org.name, 
          plan: org.plan,
          billing_status: org.billing_status,
          current_period_end: org.current_period_end
        })) 
      });
    }

    // Process downgrades
    console.log(`[Admin Downgrade] EXECUTING: Downgrading ${candidates.length} organizations`);
    let downgraded = 0;
    for (const org of candidates) {
      console.log(`[Admin Downgrade] Downgrading org: ${org.id} (${org.name}) from ${org.plan} to free`);
      await downgradeOrgToFree(org.id);
      downgraded++;
    }
    console.log(`[Admin Downgrade] Successfully downgraded ${downgraded} organizations`);
    
    res.json({ 
      downgraded: candidates.length,
      candidates: candidates.length,
      message: `Successfully downgraded ${candidates.length} organizations to free plan`
    });
  } catch (error) {
    console.error('[Admin Downgrade] Error during downgrade process:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}