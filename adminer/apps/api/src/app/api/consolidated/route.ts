import { NextRequest, NextResponse } from 'next/server';

type Plan = {
  code: string;
  name: string;
  quota: number;
  period: 'monthly';
};

const PLAN_FALLBACK: Plan = { code: 'free-10', name: 'Free', quota: 10, period: 'monthly' };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'quota/status') {
    try {
      // TODO: fetch real org/user plan & usage here
      const plan: Plan = PLAN_FALLBACK; // replace when DB is wired
      const used = 0; // compute actual usage
      const remaining = Math.max(0, plan.quota - used);

      return NextResponse.json({
        ok: true,
        // legacy fields (keep for backward compatibility)
        planCode: plan.code,
        quota: plan.quota,
        used,
        remaining,
        usage: { adsImported: false },
        // new fields your SPA expects
        limit: { monthlyCap: plan.quota, period: plan.period },
        // normalized plan object so `t.plan.name` is always safe
        plan: {
          code: plan.code,
          name: plan.name,
          quota: plan.quota,
          period: plan.period,
        },
      });
    } catch (e) {
      // Never break the SPA: return a safe fallback shape
      return NextResponse.json({
        ok: true,
        planCode: PLAN_FALLBACK.code,
        quota: PLAN_FALLBACK.quota,
        used: 0,
        remaining: PLAN_FALLBACK.quota,
        usage: { adsImported: false },
        limit: { monthlyCap: PLAN_FALLBACK.quota, period: PLAN_FALLBACK.period },
        plan: { ...PLAN_FALLBACK },
      });
    }
  }

  // health or other actions...
  if (action === 'health') {
    return NextResponse.json({ ok: true, service: 'consolidated', status: 'healthy' });
  }

  return NextResponse.json({ ok: false, error: 'unknown_action' }, { status: 400 });
}

export const dynamic = 'force-dynamic'; 