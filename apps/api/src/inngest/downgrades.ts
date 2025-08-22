import { Inngest } from "inngest";
import { db } from "../db/client";
import { orgs } from "../db/schema";
import { and, isNotNull, lt, eq } from "drizzle-orm";

export const inngest = new Inngest({ id: "adminer" });

const GRACE_HOURS = Number(process.env.BILLING_CANCEL_GRACE_HOURS ?? 24);
const ENFORCE = process.env.BILLING_ENFORCEMENT_ENABLED === "true";

export const nightlyDowngrade = inngest.createFunction(
  { id: "nightly-downgrade", concurrency: { limit: 1 } },
  { cron: "0 3 * * *" }, // 03:00 UTC nightly
  async () => {
    if (!ENFORCE) return { skipped: true };

    const cutoff = new Date(Date.now() - GRACE_HOURS * 3600 * 1000);

    // Find canceled & past grace, not already free
    const canceled = await db
      .select()
      .from(orgs)
      .where(and(isNotNull(orgs.canceledAt), lt(orgs.canceledAt!, cutoff)));

    for (const o of canceled) {
      if (o.plan === "free") continue;
      await db.update(orgs)
        .set({
          plan: "free",
          monthlyLimit: 10,
          subscriptionStatus: "canceled",
          updatedAt: new Date(),
        })
        .where(eq(orgs.id, o.id));
    }

    return { processed: canceled.length };
  }
); 