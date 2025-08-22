import { z } from "zod";
import { inngest } from "../client";
import { findDowngradeCandidates, downgradeOrgToFree } from "../../db/queries/billing";

type Candidate = Awaited<ReturnType<typeof findDowngradeCandidates>>[number];

const payloadSchema = z.object({
  dryRun: z.boolean().optional().default(process.env.DOWNGRADE_DRY_RUN === "true"),
  now: z.string().datetime().optional(),
});

export const downgradeNightly = inngest.createFunction(
  { id: "billing-downgrade-nightly", retries: 3, concurrency: 1 },
  { cron: "30 21 * * *" },
  async ({ step, event, logger }) => {
    if (process.env.BILLING_AUTODOWNGRADE_ENABLED !== "true") {
      return { ok: true, skipped: true, reason: "feature_flag_off" };
    }

    const input = payloadSchema.parse((event as any)?.data ?? {});
    const now = input.now ? new Date(input.now) : new Date();
    const dryRun = input.dryRun ?? false;

    await step.run("fetch-candidates", async () => {
      logger.info("Scanning for downgrade candidates", { now: now.toISOString(), dryRun });
    });

    const candidates = await step.run("query-db", () => findDowngradeCandidates(now));

    if (!candidates.length) {
      await step.run("no-op", async () => {
        logger.info("No candidates found");
      });
      return { downgraded: 0, candidates: 0, dryRun };
    }

    let downgraded = 0;
    // Process in small batches to avoid long transactions
    for (const org of candidates) {
      await step.run(`maybe-downgrade:${org.id}`, async () => {
        if (dryRun) {
          logger.info("DRY RUN: would downgrade org", { orgId: org.id, name: org.name, prevPlan: org.plan });
          return;
        }
        await downgradeOrgToFree(org.id);
        downgraded += 1;
        logger.info("Downgraded org to Free", { orgId: org.id });
      });
    }

    return { downgraded, candidates: candidates.length, dryRun };
  }
);