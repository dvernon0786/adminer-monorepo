import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  // Hard bypass for CI health checks
  if (action === "health") {
    return new NextResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  }

  // ...existing logic for other actions
  // return NextResponse.json(...)
} 