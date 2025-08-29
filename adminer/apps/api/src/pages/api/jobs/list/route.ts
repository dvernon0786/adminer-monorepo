export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Replace with real DB query when ready
    // const items = await db.select().from(jobs)...
    const items: any[] = [];
    return Response.json({ ok: true, items }, { status: 200 });
  } catch (e: any) {
    return Response.json({ ok: false, items: [], error: "jobs_fallback", message: e?.message }, { status: 200 });
  }
} 