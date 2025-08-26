// apps/api/pages/api/jobs/start.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { requireOrgFromClerk } from "../../../src/lib/auth";
import { computeRemaining, perRequestCapFor } from "../../../src/lib/quota";
import { db } from "../../../src/db/client";
import { jobs } from "../../../src/db/schema";
import { StartJobBody } from "../../../src/schemas/jobs";
import { randomUUID } from "crypto";

export default async function startJob(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Parse + validate body
  let body: any;
  try { 
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body; 
  } catch { 
    return res.status(400).json({ error: "Invalid JSON" }); 
  }
  
  const parsed = StartJobBody.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request", issues: parsed.error.flatten() });
  }
  
  const { keyword, limit, ...apifyParams } = parsed.data;

  try {
    // Auth + plan
    const { orgId, plan } = await requireOrgFromClerk(req as any);

    // Compute caps
    const { remaining } = await computeRemaining(orgId, plan);
    const perReq = perRequestCapFor(plan);

    const allowed = Math.max(0, Math.min(limit, perReq, remaining));
    if (allowed <= 0) {
      const upgrade = plan === "free" ? "/api/dodo/checkout/pro" : "/pricing#enterprise";
      return res.status(402).json({
        error: "Quota exceeded",
        upgrade,
        details: { plan, remaining, perRequestCap: perReq }
      });
    }

    // Create job row immediately; adsImported initially 0 (will be updated when Apify completes)
    const jobId = randomUUID();
    await db.insert(jobs).values({
      id: jobId,
      orgId,
      requestedBy: "system", // Will be updated with actual user ID
      keyword,
      status: "queued",
      adsRequested: limit,
      adsImported: 0,
      input: apifyParams,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Emit your orchestration (Inngest) event here
    // await inngest.send("keyword/requested", { data: { jobId, orgId, keyword, allowed, apifyParams } });

    return res.status(200).json({ 
      jobId, 
      keyword, 
      requested: limit, 
      allowed, 
      status: "queued" 
    });
  } catch (e: any) {
    const code = e.statusCode || 500;
    return res.status(code).json({ error: e.message || "start job failed" });
  }
} 