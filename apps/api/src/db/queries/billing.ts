import { db } from "../client";
import { orgs } from "../schema";
import { and, or, lt, eq, isNotNull } from "drizzle-orm";
import dayjs from "dayjs";

type Candidate = typeof orgs.$inferSelect;

export async function findDowngradeCandidates(now = new Date()): Promise<Candidate[]> {
  // Adjust these column names to match your schema exactly:
  // subscriptionStatus, canceledAt, currentPeriodEnd
  return db
    .select()
    .from(orgs)
    .where(
      or(
        eq(orgs.subscriptionStatus, "canceled"),
        eq(orgs.subscriptionStatus, "incomplete_expired"),
        // Past-due + period ended:
        and(
          isNotNull(orgs.canceledAt),
          lt(orgs.currentPeriodEnd, now)
        ),
        // Safety: some providers mark ended subs without 'canceled'
        and(
          lt(orgs.currentPeriodEnd, now),
          isNotNull(orgs.dodoSubscriptionId)
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
      monthlyLimit: 10,           // match your Free tier
      subscriptionStatus: "canceled_downgraded",
      updatedAt: new Date(),
    })
    .where(eq(orgs.id, orgId));
}