import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { getPlanAndUsage } from '../../../lib/quota';

export const runtime = "edge";

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

  if (action === 'health') {
    return NextResponse.json({ ok: true, healthy: true }, { status: 200 });
  }

  if (action === 'quota/status') {
    try {
      const { orgId } = await auth();
      if (!orgId) {
        return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
      }

      const { quota, used, planCode } = await getPlanAndUsage(orgId);
      const remaining = Math.max(0, quota - used);
      const upgradeUrl = `${process.env.APP_BASE_URL}/upgrade`;

      if (remaining <= 0) {
        return NextResponse.json({
          ok: false,
          error: "quota_exceeded",
          planCode,
          quota,
          used,
          upgradeUrl,
          message: `Quota exceeded for plan ${planCode}. Upgrade to continue.`
        }, { status: 402 });
      }

      // Legacy compatibility layer
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
          name: planCode === 'free-10' ? 'Free' : planCode === 'pro-500' ? 'Pro' : 'Enterprise',
          quota,
          period: 'monthly',
        },
      };

      return NextResponse.json(body);
    } catch (e: any) {
      console.error('Quota status error:', e);
      // Don't fall back to default response - return 401 if auth fails
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }
  }

  // legacy shim
  if (action === 'billing/quota') {
    try {
      const { orgId } = await auth();
      if (!orgId) {
        return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
      }

      const { quota, used, planCode } = await getPlanAndUsage(orgId);
      const remaining = Math.max(0, quota - used);
      const upgradeUrl = `${process.env.APP_BASE_URL}/upgrade`;

      if (remaining <= 0) {
        return NextResponse.json({
          ok: false,
          error: "quota_exceeded",
          planCode,
          quota,
          used,
          upgradeUrl,
          message: `Quota exceeded for plan ${planCode}. Upgrade to continue.`
        }, { status: 402 });
      }

      // Legacy compatibility layer
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
          name: planCode === 'free-10' ? 'Free' : planCode === 'pro-500' ? 'Pro' : 'Enterprise',
          quota,
          period: 'monthly',
        },
      };

      return NextResponse.json(body);
    } catch (e: any) {
      console.error('Legacy quota error:', e);
      // Don't fall back to default response - return 401 if auth fails
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }
  }

  return NextResponse.json({ ok: false, error: 'unknown_action' }, { status: 400 });
}

export const dynamic = 'force-dynamic'; 