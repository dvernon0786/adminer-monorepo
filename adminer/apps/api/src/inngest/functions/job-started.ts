// apps/api/src/inngest/functions/job-started.ts
import { inngest } from "../client";
import { EVT } from "../events";
import { db } from "../../db/client";
import { jobs } from "../../db/schema";
import { eq } from "drizzle-orm";
import { getQuotaStatus, consumeQuota } from "../../lib/quota";

export const onJobStarted = inngest.createFunction(
  { id: "on-job-started" },
  { event: EVT.JobStarted },
  async ({ event, step }) => {
    const { jobId, orgId, keyword } = event.data;

    // Step 1: Check quota before proceeding
    const quotaCheck = await step.run("check-quota", async () => {
      const quotaStatus = await getQuotaStatus(orgId);
      if (!quotaStatus.ok) {
        throw new Error(`Quota exceeded: ${quotaStatus.reason}`);
      }
      return quotaStatus;
    });

    // Step 2: Update job status to running
    await step.run("update-status", async () => {
      await db.update(jobs)
        .set({ 
          status: "running", 
          updatedAt: new Date() 
        })
        .where(eq(jobs.id, jobId));
    });

    // Step 3: Trigger Apify run
    const apifyResult = await step.run("trigger-apify", async () => {
      const actorId = process.env.APIFY_ACTOR_ID;
      const token = process.env.APIFY_TOKEN;
      
      if (!actorId || !token) {
        throw new Error("Apify configuration missing");
      }

      // Use sync endpoint for immediate processing (300s timeout)
      const url = new URL(
        `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items`
      );
      url.searchParams.set("token", token);
      url.searchParams.set("format", "json");
      url.searchParams.set("clean", "1");

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          input: { keyword },
          // Add webhook for completion notification
          webhooks: [{
            eventTypes: ["RUN.SUCCEEDED", "RUN.FAILED"],
            requestUrl: `${process.env.APP_BASE_URL}/api/webhooks/apify?jobId=${jobId}`,
            isInactive: false
          }]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apify sync failed: ${errorText}`);
      }

      const datasetItems = await response.json();
      return { datasetItems, runId: `sync-${Date.now()}` };
    });

    // Step 4: Save raw data and mark as completed
    await step.run("save-results", async () => {
      await db.update(jobs)
        .set({ 
          rawData: apifyResult.datasetItems,
          apifyRunId: apifyResult.runId,
          status: "completed",
          updatedAt: new Date()
        })
        .where(eq(jobs.id, jobId));
    });

    // Step 5: Consume quota
    await step.run("consume-quota", async () => {
      await consumeQuota(orgId, 1);
    });

    // Step 6: Trigger analysis (async)
    await step.run("trigger-analysis", async () => {
      // Emit event for AI analysis
      await inngest.send({
        name: EVT.JobCompleted,
        data: {
          jobId,
          orgId,
          analysis: { status: "pending", timestamp: new Date().toISOString() }
        }
      });
    });

    return { 
      jobId, 
      status: "completed", 
      runId: apifyResult.runId,
      quotaRemaining: (quotaCheck as any).remaining - 1
    };
  }
); 