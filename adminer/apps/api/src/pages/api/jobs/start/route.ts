import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPlanAndUsage, incUsage } from "@/lib/quota";

export const runtime = "edge";

export async function POST() {
  const { orgId } = auth();
  if (!orgId) return NextResponse.json({}, { status: 401 });

  const { quota, used } = await getPlanAndUsage(orgId);
  if (used >= quota) {
    return NextResponse.json({
      ok: false,
      error: "quota_exceeded",
      upgradeUrl: `${process.env.APP_BASE_URL}/upgrade`,
    }, { status: 402 });
  }

  // ...create job, emit Inngest, etc...
  await incUsage(orgId, 1); // increment now (or on completion if you prefer)

  return NextResponse.json({ ok: true, status: "queued" }, { status: 202 });
} 