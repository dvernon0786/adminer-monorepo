// apps/api/pages/api/jobs/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "../../../src/db/client";
import { jobs } from "../../../src/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get authenticated user and org
    const { userId, orgId } = await getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (!orgId) {
      return res.status(400).json({ error: "Organization not found" });
    }

    // Parse query parameters
    const { 
      status, 
      limit = "50", 
      offset = "0",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    // Validate and parse parameters
    const limitNum = Math.min(parseInt(limit as string) || 50, 100); // Max 100
    const offsetNum = Math.max(parseInt(offset as string) || 0, 0);
    
    // Build query conditions
    let whereConditions = eq(jobs.orgId, orgId);
    
    if (status && typeof status === "string") {
      const validStatuses = ["queued", "running", "completed", "failed"];
      if (validStatuses.includes(status)) {
        whereConditions = eq(jobs.status, status as any);
      }
    }

    // Build order by clause
    let orderByClause;
    switch (sortBy) {
      case "updatedAt":
        orderByClause = sortOrder === "asc" ? jobs.updatedAt : desc(jobs.updatedAt);
        break;
      case "keyword":
        orderByClause = sortOrder === "asc" ? jobs.keyword : desc(jobs.keyword);
        break;
      case "status":
        orderByClause = sortOrder === "asc" ? jobs.status : desc(jobs.status);
        break;
      default:
        orderByClause = sortOrder === "asc" ? jobs.createdAt : desc(jobs.createdAt);
    }

    // Fetch jobs with pagination
    const jobsList = await db.select({
      id: jobs.id,
      keyword: jobs.keyword,
      status: jobs.status,
      createdAt: jobs.createdAt,
      updatedAt: jobs.updatedAt,
      error: jobs.error,
      quotaDebit: jobs.quotaDebit,
      apifyRunId: jobs.apifyRunId,
      contentType: jobs.contentType,
      pageName: jobs.pageName,
      summary: jobs.summary,
      rewrittenAdCopy: jobs.rewrittenAdCopy,
      keyInsights: jobs.keyInsights,
      competitorStrategy: jobs.competitorStrategy,
      recommendations: jobs.recommendations
    })
    .from(jobs)
    .where(whereConditions)
    .orderBy(orderByClause)
    .limit(limitNum)
    .offset(offsetNum);

    // Get total count for pagination
    const totalCount = await db.select({ count: jobs.id })
      .from(jobs)
      .where(whereConditions);

    const total = parseInt(String(totalCount[0]?.count || 0));

    // Return response
    return res.status(200).json({
      jobs: jobsList,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total
      },
      filters: {
        status: status || null,
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error("Jobs fetch error:", error);
    
    if (error instanceof Error) {
      return res.status(500).json({ 
        error: "Internal server error", 
        message: error.message 
      });
    }
    
    return res.status(500).json({ 
      error: "Internal server error", 
      message: "An unexpected error occurred" 
    });
  }
} 