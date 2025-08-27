import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../../db/client";
import { jobs } from "../../db/schema";

export async function getMonthlyCompletedJobs(orgId: string): Promise<number> {
  // Start of current UTC month
  const startOfMonth = sql`date_trunc('month', now() at time zone 'utc')`;
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobs)
    .where(
      and(
        eq(jobs.orgId, orgId),
        eq(jobs.status, "completed"),
        gte(jobs.createdAt, startOfMonth)
      )
    );
  return Number(count ?? 0);
} 