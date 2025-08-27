import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
// import { getPlanAndUsage } from "@/lib/quota"; // keep when DB is ready

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shape(quota:number, used:number, planCode:string, guest=false) {
  const remaining = Math.max(0, quota - used);
  // Legacy + current fields, so UI never crashes:
  const payload = {
    ok: true,
    planCode,
    quota,
    used,
    remaining,
    guest,
    // Legacy compatibility object:
    usage: {
      used,
      quota,
      remaining,
      adsImported: false,   // <- prevents `adsImported` undefined
    },
  };
  return payload;
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");

  if (action === "health") {
    return Response.json({ ok: true, healthy: true }, { status: 200 });
  }

  if (action === "quota/status") {
    try {
      const { orgId } = await auth();

      // Guest-safe defaults (no Clerk = still safe)
      if (!orgId) {
        return Response.json(shape(10, 0, "free-10", true), { status: 200 });
      }

      // If your DB/helper is ready, replace with real lookup; else safe defaults:
      // const { quota, used, planCode } = await getPlanAndUsage(orgId);
      const quota = 10, used = 0, planCode = "free-10";
      return Response.json(shape(quota, used, planCode), { status: 200 });

    } catch (e:any) {
      // Never 500 to client; keep UI alive
      return Response.json(shape(10, 0, "free-10", true), { status: 200 });
    }
  }

  return Response.json({ ok: false, error: "unknown_action" }, { status: 400 });
} 