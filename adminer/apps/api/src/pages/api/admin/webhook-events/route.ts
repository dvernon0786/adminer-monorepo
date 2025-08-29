import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { webhookEvents } from "@/db/schema";
import { and, desc, gte, ilike, lte, sql } from "drizzle-orm";

type Query = {
  q?: string;          // search in id or type
  type?: string;       // exact match on type
  from?: string;       // ISO date
  to?: string;         // ISO date
  limit?: string;      // number (default 50, max 200)
  cursor?: string;     // pagination: seenAt,id (URL-safe)
};

export async function GET(req: Request) {
  const { userId, sessionClaims } = await auth();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  // Optional: email/domain/role allowlist
  const email = (sessionClaims?.email as string | undefined)?.toLowerCase();
  const isAdmin =
    !!email &&
    ["you@company.com", "dev@company.com"].includes(email); // replace with your admins
  if (!isAdmin) return NextResponse.json({ ok: false }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const type = (searchParams.get("type") || "").trim();
  const from = (searchParams.get("from") || "").trim();
  const to = (searchParams.get("to") || "").trim();
  const limitParam = Number(searchParams.get("limit") || "50");
  const limit = Math.min(Math.max(limitParam, 1), 200);

  // cursor format: `${seen_at_iso},${id}`
  const cursor = (searchParams.get("cursor") || "").trim();
  let cursorSeenAt: Date | null = null;
  let cursorId: string | null = null;
  if (cursor) {
    const [ts, id] = cursor.split(",");
    if (ts && id) {
      cursorSeenAt = new Date(ts);
      cursorId = id;
    }
  }

  const where = and(
    q ? sql`(${webhookEvents.id} ILIKE ${"%" + q + "%"} OR ${webhookEvents.type} ILIKE ${"%" + q + "%"})` : undefined,
    type ? ilike(webhookEvents.type, type) : undefined,
    from ? gte(webhookEvents.seenAt, new Date(from)) : undefined,
    to ? lte(webhookEvents.seenAt, new Date(to)) : undefined,
    // keyset pagination (seenAt DESC, id DESC)
    cursorSeenAt && cursorId
      ? sql`(${webhookEvents.seenAt}, ${webhookEvents.id}) < (${cursorSeenAt!.toISOString()}, ${cursorId!})`
      : undefined
  );

  const rows = await db
    .select({
      id: webhookEvents.id,
      type: webhookEvents.type,
      source: webhookEvents.source,
      seenAt: webhookEvents.seenAt,
      raw: webhookEvents.raw
    })
    .from(webhookEvents)
    .where(where)
    .orderBy(desc(webhookEvents.seenAt), desc(webhookEvents.id))
    .limit(limit + 1);

  let nextCursor: string | null = null;
  if (rows.length > limit) {
    const last = rows[limit - 1];
    nextCursor = `${last.seenAt.toISOString()},${last.id}`;
    rows.splice(limit); // trim extra
  }

  return NextResponse.json({
    ok: true,
    nextCursor,
    items: rows
  });
} 