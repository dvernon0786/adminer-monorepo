import { db } from "../client";
import { orgs } from "../schema";
import { and, or, lt, eq, isNotNull } from "drizzle-orm";
import dayjs from "dayjs";

type Candidate = typeof orgs.$inferSelect;

export async function findDowngradeCandidates(now = new Date()): Promise<Candidate[]> {
  // Adjust these column names to match your schema exactly:
  // billing_status, cancel_at_period_end, current_period_end
  return db
    .select()
    .from(orgs)
    .where(
      or(
        eq(orgs.billing_status, "canceled"),
        eq(orgs.billing_status, "incomplete_expired"),
        // Past-due + period ended:
        and(
          eq(orgs.cancel_at_period_end, true),
          lt(orgs.current_period_end, now)
        ),
        // Safety: some providers mark ended subs without 'canceled'
        and(
          lt(orgs.current_period_end, now),
          isNotNull(orgs.dodo_subscription_id)
        )
      )
    );
}

export async function downgradeOrgToFree(orgId: string) {
  // Update plan + limits atomically. Keep dodo ids for audit, but mark status terminal.
  await db
    .update(orgs)
    .set({
      plan: "free",
      quota_limit: 10,           // match your Free tier
      billing_status: "canceled_downgraded",
      updated_at: new Date(),
    })
    .where(eq(orgs.id, orgId));
}