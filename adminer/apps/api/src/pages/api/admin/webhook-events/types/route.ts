import { NextResponse } from "next/server";
import { db } from "@/db";
import { webhookEvents } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const types = await db.execute<{ type: string }>(sql`
    SELECT DISTINCT ${webhookEvents.type} type
    FROM ${webhookEvents}
    ORDER BY type ASC
  `);
  return NextResponse.json({ ok: true, types: types.rows.map(r => r.type) });
} 