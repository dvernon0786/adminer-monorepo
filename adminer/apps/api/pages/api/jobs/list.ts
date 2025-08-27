import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "../../../src/db/client";
import { jobs } from "../../../src/db/schema";
import { desc, eq } from "drizzle-orm";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") return res.status(405).json({ ok:false, error:"method_not_allowed" });

    // TODO: replace with real query
    // const rows = await db.select().from(jobs).where(...);
    const rows: any[] = []; // safe placeholder so UI renders without 500

    return res.status(200).json({ ok: true, items: rows });
  } catch (e: any) {
    // Never 500 to the client for listing; return empty list
    return res.status(200).json({ ok: false, items: [], error: "jobs_fallback" });
  }
} 