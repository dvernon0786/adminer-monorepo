import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get("action");

    if (action === "health") {
      return Response.json({ ok: true, healthy: true }, { status: 200 });
    }

    if (action === "quota/status") {
      try {
        const { orgId } = await auth();

        // Safe guest defaults so UI never crashes
        if (!orgId) {
          return Response.json({
            ok: true,
            planCode: "free-10",
            quota: 10,
            used: 0,
            remaining: 10,
            guest: true,
          }, { status: 200 });
        }

        // For now, return safe defaults
        // TODO: Implement actual quota lookup when database is ready
        return Response.json({
          ok: true,
          planCode: "free-10",
          quota: 10,
          used: 0,
          remaining: 10,
        }, { status: 200 });

      } catch (e: any) {
        return Response.json({
          ok: false,
          planCode: "free-10",
          quota: 10,
          used: 0,
          remaining: 10,
          error: "quota_guard",
          message: e?.message,
        }, { status: 200 });
      }
    }

    return Response.json({ ok: false, error: "unknown_action" }, { status: 400 });
  } catch (e: any) {
    // Absolute last-resort safety
    return Response.json({
      ok: false,
      planCode: "free-10",
      quota: 10,
      used: 0,
      remaining: 10,
      error: "consolidated_fallback",
      message: e?.message,
    }, { status: 200 });
  }
} 