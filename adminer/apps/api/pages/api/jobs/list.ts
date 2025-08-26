import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "../../../src/db/client";
import { jobs } from "../../../src/db/schema";
import { desc, eq } from "drizzle-orm";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Get user's organization context
    const { orgId } = await getAuth(req);
    if (!orgId) return res.status(400).json({ error: "No organization found" });

    const rows = await db.select({
      id: jobs.id,
      status: jobs.status,
      keyword: jobs.keyword,
      contentType: jobs.contentType,
      pageName: jobs.pageName,
      summary: jobs.summary,
      rewrittenAdCopy: jobs.rewrittenAdCopy,
      keyInsights: jobs.keyInsights,
      competitorStrategy: jobs.competitorStrategy,
      recommendations: jobs.recommendations,
      imagePrompt: jobs.imagePrompt,
      videoPrompt: jobs.videoPrompt,
      createdAt: jobs.createdAt,
    })
    .from(jobs)
    .where(eq(jobs.orgId, orgId))
    .orderBy(desc(jobs.createdAt))
    .limit(50);
    
    res.json({ items: rows });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
} 