import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { getMonthlyCompletedJobs } from '../../../lib/db/usage';
// import db etc if you compute used from DB

type Plan = {
  code: string;
  name: string;
  quota: number;
  period: 'monthly';
};

type QuotaShape = {
  ok: boolean;
  planCode: string;
  quota: number;
  used: number;
  remaining: number;
  usage: {
    used: number;
    quota: number;
    remaining: number;
    adsImported: boolean;
  };
  limit: {
    monthlyCap: number;
    period: string;
  };
  plan: {
    code: string;
    name: string;
    quota: number;
    period: string;
  };
};

const PLAN_FALLBACK: Plan = { code: 'free-10', name: 'Free', quota: 10, period: 'monthly' };

// quick helper — adapt to your real plan logic
function computePlan(userId?: string) {
  // e.g., map org to plan; default free plan
  const planCode = "free-10";
  const quota = 10;
  const used = 0; // TODO: read from jobs table if you track consumption
  const remaining = Math.max(0, quota - used);

  const body: QuotaShape = {
    ok: true,
    planCode,
    quota,
    used,
    remaining,
    usage: {
      used,
      quota,
      remaining,
      adsImported: false,
    },
    limit: {
      monthlyCap: quota,
      period: 'monthly',
    },
    plan: {
      code: planCode,
      name: PLAN_FALLBACK.name, // Use fallback name for consistency
      quota,
      period: 'monthly',
    },
  };

  return body;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'quota/status') {
    try {
      // TODO: resolve orgId from Clerk/JWT/session; fallback for now
      const orgId = req.headers.get('x-org-id') ?? 'demo-org';
      const plan: Plan = PLAN_FALLBACK; // replace with real plan lookup
      const used = await getMonthlyCompletedJobs(orgId);
      const remaining = Math.max(0, plan.quota - used);

      // Enforce quota: return 402 with upgrade URL
      if (used >= plan.quota) {
        return NextResponse.json(
          { ok: false, code: "quota_exceeded", upgradeUrl: "/billing" },
          { status: 402 }
        );
      }

      return NextResponse.json({
        ok: true,
        // legacy fields (keep for backward compatibility)
        planCode: plan.code,
        quota: plan.quota,
        used,
        remaining,
        usage: { used, quota: plan.quota, remaining, adsImported: false },
        // new fields your SPA expects
        limit: { monthlyCap: plan.quota, period: plan.period },
        // normalized plan object so `t.plan.name` is always safe
        plan: { code: plan.code, name: plan.name, quota: plan.quota, period: plan.period },
      });
    } catch (e: any) {
      // Never 500 to client; keep UI alive
      const body = computePlan(undefined);
      return NextResponse.json(body, { status: 200 });
    }
  }

  if (action === 'health') {
    return NextResponse.json({ ok: true, healthy: true }, { status: 200 });
  }

  // Back-compat shim if old clients call billing/quota
  if (action === 'billing/quota') {
    try {
      const { orgId } = await auth();
      const body = computePlan(orgId ? orgId : undefined);
      return NextResponse.json(body, { status: 200 });
    } catch (e: any) {
      const body = computePlan(undefined);
      return NextResponse.json(body, { status: 200 });
    }
  }

  return NextResponse.json({ ok: false, error: 'unknown_action' }, { status: 400 });
}

export const dynamic = 'force-dynamic'; 