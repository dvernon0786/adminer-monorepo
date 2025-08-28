import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "health") {
    return NextResponse.json({ ok: true }, { 
      status: 200, 
      headers: { "cache-control": "no-store" } 
    });
  }

  // ...existing logic for other actions
  // return NextResponse.json(...)
} 