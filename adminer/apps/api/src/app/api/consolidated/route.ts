import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
// import db etc if you compute used from DB

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
};

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
      period: "monthly",
    },
  };

  return body;
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");

  if (action === "quota/status") {
    try {
      const { orgId } = await auth();
      const body = computePlan(orgId ?? undefined);
      return Response.json(body, { status: 200 });
    } catch (e: any) {
      // Never 500 to client; keep UI alive
      const body = computePlan(undefined);
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
      const body = computePlan(orgId ?? undefined);
      return Response.json(body, { status: 200 });
    } catch (e: any) {
      const body = computePlan(undefined);
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
      const body = computePlan(orgId ?? undefined);
      return Response.json(body, { status: 200 });
    } catch (e: any) {
      const body = computePlan(undefined);
      return Response.json(body, { status: 200 });
    }
  }

  return Response.json({ ok: false, error: "Unsupported POST action" }, { status: 400 });
} 