import { db } from "../db/client";
import { orgs } from "../db/schema";
import { eq, sql } from "drizzle-orm";

export async function bumpMonthlyUsage(orgId: string, amount = 1) {
  await db.execute(sql`UPDATE orgs
    SET monthly_usage = monthly_usage + ${amount}, updated_at = NOW()
    WHERE id = ${orgId}`);
} 