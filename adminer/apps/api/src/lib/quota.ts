import { db } from "../db/client";
import { jobs, orgs } from "../db/schema";
import { and, eq, sql } from "drizzle-orm";
import type { PlanKey } from "./auth";

export function perRequestCapFor(plan: PlanKey){
  if (plan === "free") return 10;
  if (plan === "pro") return 500;
  return 2000;
}

export function monthlyCapFor(plan: PlanKey): number | null {
  if (plan === "free") return null; // no monthly cap for Free
  if (plan === "pro") return 500;
  return 2000;
}

export async function getMonthlyUsageAds(orgId: string): Promise<number> {
  // SUM(ads_imported) for current month
  const rows = await db.execute(sql`SELECT COALESCE(SUM(ads_imported),0) AS used
    FROM jobs
    WHERE org_id = ${orgId}
      AND date_trunc('month', created_at) = date_trunc('month', now())`);
  const used = Number((rows as any).rows?.[0]?.used ?? 0);
  return used;
}

export async function computeRemaining(orgId: string, plan: PlanKey){
  const cap = monthlyCapFor(plan);
  const used = await getMonthlyUsageAds(orgId);
  const remaining = cap === null ? Number.MAX_SAFE_INTEGER : Math.max(0, cap - used);
  return { cap, used, remaining };
}

export function monthResetIso(){
  const now = new Date();
  const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return reset.toISOString();
}

// Additional functions needed by other parts of the codebase
export async function getQuotaStatus(orgId: string) {
  const org = await db.select().from(orgs).where(eq(orgs.id, orgId)).limit(1);
  if (!org.length) return { ok: false, reason: 'no_org' };

  const orgData = org[0];
  const plan = orgData.plan || 'free';
  const limit = orgData.quota_monthly || 10;
  const used = orgData.quota_used_month || 0;
  const remaining = Math.max(0, limit - used);
  
  // Use current month for now to avoid type issues
  const month = new Date().toISOString().slice(0, 7);

  return { 
    ok: true, 
    remaining, 
    plan, 
    used, 
    limit, 
    month 
  };
}

export async function consumeQuota(orgId: string, n: number = 1): Promise<void> {
  if (n <= 0) return;
  
  await db.update(orgs)
    .set({ 
      quota_used_month: sql`${orgs.quota_used_month} + ${n}`,
      updatedAt: new Date()
    })
    .where(eq(orgs.id, orgId));
} 