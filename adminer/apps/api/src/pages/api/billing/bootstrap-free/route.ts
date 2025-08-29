import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { orgId } = await auth();

    // Always return a safe shape so the SPA can continue.
    // If not signed in, just report guest state.
    if (!orgId) {
      return new Response(
        JSON.stringify({ ok: true, bootstrapped: false, planCode: "free-10", guest: true }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    // For now, just return success without database operations
    // TODO: Implement actual plan creation when database is ready
    return new Response(
      JSON.stringify({ 
        ok: true, 
        bootstrapped: true, 
        planCode: "free-10",
        message: "Free plan activated (database integration pending)"
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (e: any) {
    // Never return 405/500 to the SPA for bootstrap
    return new Response(
      JSON.stringify({ ok: true, bootstrapped: false, planCode: "free-10", error: "bootstrap_fallback", message: e?.message }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }
} 