import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "health") {
    return NextResponse.json(
      { healthy: true, ts: Date.now() },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "CDN-Cache-Control": "no-store"
        }
      }
    );
  }

  // ...existing logic for other actions...
} 