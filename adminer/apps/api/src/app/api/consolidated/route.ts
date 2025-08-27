import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
// import db etc if you compute used from DB

const PLAN_FALLBACK = { code: 'free-10', name: 'Free', quota: 10, period: 'monthly' };

type QuotaShape = {
  ok: boolean;
  planCode: string;
  quota: number;         // new
  used: number;          // new
  remaining: number;     // new
  // legacy block expected by old SPA code:
  usage: {
    used: number;
    quota: number;
    remaining: number;
    adsImported: boolean;
  };
  // NEW: add the shape the SPA is referencing
  limit: {
    monthlyCap: number;
    period: "monthly";
  };
  // NEW: add plan object so t.plan.name is always safe
  plan: {
    code: string;
    name: string;
    quota: number;
    period: string;
  };
};

// quick helper — adapt to your real plan logic
function buildQuotaPayload(userOrgPlan?: { code: string; name: string; quota: number }) {
  const plan = userOrgPlan ?? PLAN_FALLBACK;
  const used = 0; // compute real usage if you have it
  const remaining = Math.max(0, plan.quota - used);

  const body: QuotaShape = {
    ok: true,
    planCode: plan.code,
    quota: plan.quota,
    used,
    remaining,
    usage: {
      used,
      quota: plan.quota,
      remaining,
      adsImported: false,
    },
    limit: {
      monthlyCap: plan.quota,
      period: 'monthly',
    },
    // add a normalized plan object so `t.plan.name` is always safe
    plan: { 
      code: plan.code, 
      name: plan.name, 
      quota: plan.quota, 
      period: 'monthly' 
    },
  };

  return body;
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");

  if (action === "quota/status") {
    try {
      const { orgId } = await auth();
      const body = buildQuotaPayload(orgId ? { code: 'free-10', name: 'Free', quota: 10 } : undefined);
      return Response.json(body, { status: 200 });
    } catch (e: any) {
      // Never 500 to client; keep UI alive
      const body = buildQuotaPayload();
      return Response.json(body, { status: 200 });
    }
  }

  if (action === "health") {
    return Response.json({ ok: true, healthy: true }, { status: 200 });
  }

  // Back-compat shim if old clients call billing/quota
  if (action === "billing/quota") {
    try {
      const { orgId } = await auth();
      const body = buildQuotaPayload(orgId ? { code: 'free-10', name: 'Free', quota: 10 } : undefined);
      return Response.json(body, { status: 200 });
    } catch (e: any) {
      const body = buildQuotaPayload();
      return Response.json(body, { status: 200 });
    }
  }

  return Response.json({ ok: false, error: "Unknown action" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");

  // optional bootstrap endpoint, returns same shape to keep SPA happy
  if (action === "quota/status") {
    try {
      const { orgId } = await auth();
      const body = buildQuotaPayload(orgId ? { code: 'free-10', name: 'Free', quota: 10 } : undefined);
      return Response.json(body, { status: 200 });
    } catch (e: any) {
      const body = buildQuotaPayload();
      return Response.json(body, { status: 200 });
    }
  }

  return Response.json({ ok: false, error: "Unsupported POST action" }, { status: 400 });
} 