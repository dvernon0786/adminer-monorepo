import type { NextApiRequest, NextApiResponse } from "next";
import { withAuthAndQuota, type AuthContext } from "../../../src/lib/withAuthAndQuota";
import { getOrgById, getMonthlyUsage } from "../../../src/lib/data-adapter";
import { getUpgradeUrl } from "../../../src/lib/upgrade-links";
import { db } from "../../../src/db/client";
import { jobs, orgs } from "../../../src/db/schema";
import { eq, sql } from "drizzle-orm";

// Development mode bypass check - read headers directly
const isDevMode = process.env.NODE_ENV === 'development' ||
                 process.env.DEV_MODE === 'true' ||
                 process.env.CLERK_BYPASS === 'true'

// Production handler using withAuthAndQuota
const productionHandler = async (req: Request, ctx: AuthContext) => {
  const { plan, orgId, userId } = ctx;
  
  if (!orgId || !plan) {
    return new Response(JSON.stringify({ error: "Organization context required" }), {
      status: 403,
      headers: { 'content-type': 'application/json' }
    });
  }

  const body = await req.json();
  const { keyword, limit } = body;

  if (!keyword || typeof limit !== 'number' || limit <= 0) {
    return new Response(JSON.stringify({ error: "Invalid request: keyword and limit required" }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  // Calculate allowed ads based on plan
  let allowedAds = limit;
  if (plan === 'free') {
    // Free plan: clamp to 10 ads per keyword
    allowedAds = Math.min(limit, 10);
  } else {
    // Pro/Enterprise: check monthly quota
    const usage = ctx.usage || 0;
    const planLimit = plan === 'pro' ? 500 : 2000;
    const remaining = planLimit - usage;
    
    if (remaining <= 0) {
      const upgradeUrl = getUpgradeUrl(plan);
      return new Response(JSON.stringify({
        code: "QUOTA_EXCEEDED",
        message: "Monthly quota exceeded",
        plan: plan,
        limit: planLimit,
        used: usage,
        remaining: 0,
        ...(upgradeUrl ? { upgradeUrl } : {})
      }), {
        status: 402,
        headers: { 'content-type': 'application/json' }
      });
    }
    allowedAds = Math.min(limit, remaining);
  }

  // Create job with proper quota tracking
  const jobId = crypto.randomUUID();
  const job = await db.insert(jobs).values({
    id: jobId,
    orgId,
    requestedBy: userId,
    keyword,
    adsRequested: limit,
    adsImported: allowedAds,
    status: 'queued',
    quotaDebit: plan === 'free' ? 0 : allowedAds, // Free plan doesn't consume quota
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();

  // Update org quota usage (only for Pro/Enterprise)
  if (plan !== 'free' && allowedAds > 0) {
    await db.update(orgs)
      .set({
        quota_used_month: sql`${orgs.quota_used_month} + ${allowedAds}`,
        updatedAt: new Date()
      })
      .where(eq(orgs.id, orgId));
  }

  return new Response(JSON.stringify({
    requested: limit,
    allowed: allowedAds,
    imported: allowedAds,
    jobId: jobId
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};

// Development mode handler (existing logic)
const developmentHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let userId: string | null = null;
    let orgId: string | null = null;
    let plan: string = 'free';

    if (isDevMode) {
      // Use development mode headers
      userId = req.headers['x-dev-user-id'] as string;
      orgId = req.headers['x-dev-org-id'] as string;
      plan = req.headers['x-dev-plan'] as string || 'free';

      if (!userId || !orgId) {
        return res.status(400).json({ error: "Development mode requires x-dev-user-id and x-dev-org-id headers" });
      }

      console.log('Development mode: using mock auth headers', { userId, orgId, plan });
    } else {
      // Use real Clerk authentication (only import when needed)
      try {
        const { getAuth } = await import("@clerk/nextjs/server");
        const auth = await getAuth(req);
        userId = auth.userId;
        orgId = auth.orgId || null;

        if (!userId || !orgId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        // Get org plan from database
        const org = await db.select().from(orgs).where(eq(orgs.id, orgId)).limit(1);
        if (org.length > 0) {
          plan = org[0].plan || 'free';
        }
      } catch (error) {
        console.error('Clerk import error:', error);
        return res.status(500).json({ error: 'Authentication service unavailable' });
      }
    }

    const { keyword, limit } = req.body;
    if (!keyword || typeof limit !== 'number' || limit <= 0) {
      return res.status(400).json({ error: "Invalid request: keyword and limit required" });
    }

    // Calculate allowed ads based on plan
    let allowedAds = limit;
    if (plan === 'free') {
      // Free plan: clamp to 10 ads per keyword
      allowedAds = Math.min(limit, 10);
    } else {
      // Pro/Enterprise: check monthly quota (mock data for dev mode)
      if (isDevMode) {
        // Use mock quota data for development
        const mockRemaining = plan === 'pro' ? 450 : 1800;
        if (mockRemaining <= 0) {
          return res.status(402).json({
            code: "QUOTA_EXCEEDED",
            message: "Monthly quota exceeded",
            plan: plan,
            limit: plan === 'pro' ? 500 : 2000,
            used: plan === 'pro' ? 50 : 200,
            remaining: 0
          });
        }
        allowedAds = Math.min(limit, mockRemaining);
      } else {
        // Real quota check for production
        const org = await db.select().from(orgs).where(eq(orgs.id, orgId!)).limit(1);
        if (!org.length) {
          return res.status(404).json({ error: "Org not found" });
        }

        const orgData = org[0];
        const remaining = (orgData.quota_monthly || 0) - (orgData.quota_used_month || 0);
        if (remaining <= 0) {
          return res.status(402).json({
            code: "QUOTA_EXCEEDED",
            message: "Monthly quota exceeded",
            plan: orgData.plan,
            limit: orgData.quota_monthly,
            used: orgData.quota_used_month,
            remaining: 0
          });
        }
        allowedAds = Math.min(limit, remaining);
      }
    }

    // For development mode, just return mock response
    if (isDevMode) {
      return res.status(200).json({
        requested: limit,
        allowed: allowedAds,
        imported: allowedAds,
        jobId: 'dev-job-' + Date.now()
      });
    }

    // Create job with proper quota tracking (production mode)
    const jobId = crypto.randomUUID();
    const job = await db.insert(jobs).values({
      id: jobId,
      orgId,
      requestedBy: userId,
      keyword,
      adsRequested: limit,
      adsImported: allowedAds,
      status: 'queued',
      quotaDebit: plan === 'free' ? 0 : allowedAds, // Free plan doesn't consume quota
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Update org quota usage (only for Pro/Enterprise)
    if (plan !== 'free' && allowedAds > 0) {
      await db.update(orgs)
        .set({
          quota_used_month: sql`${orgs.quota_used_month} + ${allowedAds}`,
          updatedAt: new Date()
        })
        .where(eq(orgs.id, orgId));
    }

    return res.status(200).json({
      requested: limit,
      allowed: allowedAds,
      imported: allowedAds,
      jobId: jobId
    });

  } catch (error) {
    console.error('Job creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Main handler - choose between production and development
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (isDevMode) {
    // Development mode - use existing logic
    return developmentHandler(req, res);
  } else {
    // Production mode - use withAuthAndQuota middleware
    const wrappedHandler = withAuthAndQuota(productionHandler, {
      getOrgById,
      getMonthlyUsage,
      getUpgradeUrl,
      issuer: process.env.CLERK_ISSUER,
      requireOrg: true,
    });

    // Convert NextApiRequest to Request for the middleware
    const request = new Request(req.url || '', {
      method: req.method,
      headers: req.headers as any,
      body: req.body ? JSON.stringify(req.body) : undefined,
    });

    const response = await wrappedHandler(request);
    
    // Convert Response back to NextApiResponse
    const data = await response.json();
    res.status(response.status).json(data);
  }
} 