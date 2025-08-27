import type { NextApiRequest, NextApiResponse } from "next";
import { withAuthAndQuota, type AuthContext } from "../../src/lib/withAuthAndQuota";
import { getOrgById, getMonthlyUsage } from "../../src/lib/data-adapter";
import { getUpgradeUrl } from "../../src/lib/upgrade-links";
import { db } from "../../src/db/client";
import { sql } from "drizzle-orm";

// Development mode bypass check - read headers directly
const isDevMode = process.env.NODE_ENV === 'development' ||
                 process.env.DEV_MODE === 'true' ||
                 process.env.CLERK_BYPASS === 'true'

// Production handler using withAuthAndQuota
const productionHandler = async (req: Request, ctx: AuthContext) => {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || '';

  // ---- QUOTA STATUS ----
  if (action === 'quota/status') {
    const { plan, usage } = ctx;
    
    if (plan === 'free') {
      return new Response(JSON.stringify({
        plan: { key: 'free', name: 'Free' },
        usage: { adsImported: 0, month: new Date().toISOString().slice(0, 7) },
        limit: { monthlyCap: null, perRequestCap: 10 },
        remaining: null,
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    } else {
      const limit = plan === 'pro' ? 500 : 2000;
      const remaining = Math.max(0, limit - (usage || 0));
      
      return new Response(JSON.stringify({
        plan: { 
          key: plan, 
          name: plan === 'pro' ? 'Pro' : 'Enterprise' 
        },
        usage: { 
          adsImported: usage || 0, 
          month: new Date().toISOString().slice(0, 7) 
        },
        limit: { 
          monthlyCap: limit, 
          perRequestCap: limit 
        },
        remaining,
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
  }

  // Default response
  return new Response(JSON.stringify({ error: 'Unknown action' }), {
    status: 400,
    headers: { 'content-type': 'application/json' }
  });
};

// Development handler for local testing
const developmentHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { action } = req.query;

  // ---- HEALTH (always public) ----
  if (action === 'health') {
    return res.status(200).json({
      status: "healthy",
      t: Date.now()
    });
  }

  // ---- DATABASE PING (always public) ----
  if (action === 'db/ping') {
    try {
      // Simple query to test Neon connection
      const result = await db.execute(sql`SELECT 1 as ok`);
      return res.status(200).json({
        status: "ok",
        db: "connected",
        t: Date.now()
      });
    } catch (error) {
      console.error("DB ping failed:", error);
      return res.status(500).json({
        status: "error",
        error: "db_unreachable",
        t: Date.now()
      });
    }
  }

  // ---- QUOTA STATUS (development mode) ----
  if (action === 'quota/status') {
    try {
      // Defer Clerk & quota behind guarded dynamic imports.
      const clerkMod = await import('@clerk/nextjs/server').catch(() => null)
      if (!clerkMod || !('auth' in clerkMod)) {
        // If Clerk can't load, provide safe defaults so UI won't crash
        return res.status(200).json({
          ok: true,
          planCode: "free-10",
          quota: 10,
          used: 0,
          remaining: 10,
          guest: true,
          error: "auth_unavailable"
        });
      }
      
      const { auth } = clerkMod;
      const { orgId } = auth(req) || {};

      // Graceful guest mode to avoid frontend crashes
      if (!orgId) {
        return res.status(200).json({
          ok: true,
          planCode: "free-10",
          quota: 10,
          used: 0,
          remaining: 10,
          guest: true
        });
      }

      // Try to get real quota data
      try {
        const quotaMod = await import('../../src/lib/quota').catch(() => null)
        if (quotaMod && 'getPlanAndUsage' in quotaMod) {
          const { getPlanAndUsage } = quotaMod as { getPlanAndUsage: (orgId: string) => Promise<any> };
          const { quota, used, planCode } = await getPlanAndUsage(orgId);
          const remaining = Math.max(0, quota - used);
          return res.status(200).json({ ok: true, planCode, quota, used, remaining });
        }
      } catch (e) {
        // Fall through to safe defaults
      }

      // Safe defaults if quota lookup fails
      return res.status(200).json({
        ok: true,
        planCode: "free-10",
        quota: 10,
        used: 0,
        remaining: 10
      });

    } catch (e: any) {
      // Never throw 500 to client; provide safe defaults so UI won't crash
      return res.status(200).json({
        ok: false,
        planCode: "free-10",
        quota: 10,
        used: 0,
        remaining: 10,
        error: "quota_fallback",
        message: e?.message || "quota lookup failed"
      });
    }
  }

  // Default response
  return res.status(400).json({ error: 'Unknown action' });
};

// Main handler - choose between production and development
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { action } = req.query;
    
    // ---- CRITICAL: Health and DB ping are ALWAYS handled by development handler ----
    // These endpoints must NEVER fail, even in production
    if (action === 'health' || action === 'db/ping') {
      return developmentHandler(req, res);
    }

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
  } catch (error) {
    console.error('Consolidated API error:', error);
    // Never let the API crash - return a safe error response
    res.status(500).json({ 
      error: 'internal_server_error',
      message: process.env.NODE_ENV === 'development' ? String(error) : 'Internal server error'
    });
  }
} 