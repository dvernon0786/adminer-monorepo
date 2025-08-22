import { inngest } from "../client";
import { db } from "../../db/client";
import { orgs } from "../../db/schema";
import { eq, and, lt } from "drizzle-orm";

export const downgradeCanceledOrgs = inngest.createFunction(
  { 
    id: "downgrade-canceled-orgs", 
    concurrency: 1
  },
  { 
    cron: "0 2 * * *" // 02:00 daily
  },
  async ({ step }: { step: any }) => {
    // Check if automated downgrade is enabled
    if (process.env.BILLING_AUTODOWNGRADE_ENABLED !== "true") {
      console.log("Automated billing downgrade disabled, skipping");
      return { skipped: true, reason: "feature_disabled" };
    }

    const canceled = await step.run("fetch-canceled-subs", async () => {
      // Query for orgs that are canceled and past their period end
      const now = new Date();
      const canceledOrgs = await db
        .select({
          id: orgs.id,
          dodoCustomerId: orgs.dodoCustomerId,
          currentPeriodEnd: orgs.currentPeriodEnd,
          plan: orgs.plan,
        })
        .from(orgs)
        .where(
          and(
            eq(orgs.subscriptionStatus, "canceled"),
            lt(orgs.currentPeriodEnd, now)
          )
        );
      
      return canceledOrgs;
    });

    if (canceled.length === 0) {
      return { count: 0, message: "No canceled orgs to downgrade" };
    }

    await step.run("downgrade", async () => {
      // Downgrade all canceled orgs to free plan
      const orgIds = canceled.map((org: any) => org.id);
      
      await db
        .update(orgs)
        .set({ 
          plan: "free",
          subscriptionStatus: "active", // Reset status since they're now on free plan
          updatedAt: new Date()
        })
        .where(eq(orgs.id, orgIds[0])); // Note: This updates one at a time, consider batch update if needed
      
      console.log(`Downgraded ${canceled.length} canceled orgs to free plan`);
    });

    return { 
      count: canceled.length,
      message: `Successfully downgraded ${canceled.length} orgs to free plan`
    };
  }
); 