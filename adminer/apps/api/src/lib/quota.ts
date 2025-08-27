import { db } from "@/db"; // your Drizzle db client
import { usage, orgs, plans } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

export function getYearMonth(now = new Date()) {
  return now.toISOString().slice(0, 7); // 'YYYY-MM'
}

export async function getPlanAndUsage(orgId: string) {
  const yyyymm = getYearMonth();

  const [org] = await db.select().from(orgs).where(eq(orgs.id, orgId));
  if (!org) return { quota: 10, used: 0, planCode: "free-10", yyyymm };

  const [plan] = await db.select().from(plans).where(eq(plans.code, org.planCode));
  const quota = plan?.monthlyQuota ?? 10;

  const [row] = await db
    .select()
    .from(usage)
    .where(and(eq(usage.orgId, orgId), eq(usage.yyyymm, yyyymm)));

  const used = row?.used ?? 0;
  return { quota, used, planCode: org.planCode, yyyymm };
}

export async function incUsage(orgId: string, by = 1) {
  const yyyymm = getYearMonth();
  // Parameterized upsert (Edge-safe)
  await db.execute(sql`
    INSERT INTO usage (org_id, yyyymm, used)
    VALUES (${orgId}, ${yyyymm}, ${by})
    ON CONFLICT (org_id, yyyymm)
    DO UPDATE SET used = usage.used + ${by};
  `);
}

// Add the missing functions that are being imported
export async function getQuotaStatus(orgId: string) {
  try {
    const { quota, used } = await getPlanAndUsage(orgId);
    
    if (used >= quota) {
      return {
        ok: false,
        reason: `Quota exceeded: ${used}/${quota}`,
        quota,
        used
      };
    }
    
    return {
      ok: true,
      quota,
      used,
      remaining: quota - used
    };
  } catch (error) {
    return {
      ok: false,
      reason: `Error checking quota: ${error instanceof Error ? error.message : 'Unknown error'}`,
      quota: 0,
      used: 0
    };
  }
}

export async function consumeQuota(orgId: string, amount = 1) {
  return incUsage(orgId, amount);
} 