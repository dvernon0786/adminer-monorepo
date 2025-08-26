// apps/api/src/inngest/functions/apify-webhook.ts
import { inngest } from "../client";
import { EVT } from "../events";
import { db } from "../../db/client";
import { jobs } from "../../db/schema";
import { eq } from "drizzle-orm";

export const onApifyWebhook = inngest.createFunction(
  { id: "on-apify-webhook" },
  { event: EVT.ApifyRunCompleted },
  async ({ event, step }) => {
    const { jobId, runId, orgId, datasetItems } = event.data;

    // Step 1: Validate webhook data
    const validation = await step.run("validate-webhook", async () => {
      if (!jobId || !runId || !orgId) {
        throw new Error("Missing required webhook data");
      }

      // Verify job exists and belongs to org
      const job = await db.query.jobs.findFirst({
        where: eq(jobs.id, jobId),
        columns: {
          orgId: true,
          status: true,
          keyword: true
        }
      });

      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      if (job.orgId !== orgId) {
        throw new Error(`Job ${jobId} does not belong to org ${orgId}`);
      }

      return job;
    });

    // Step 2: Update job with raw data and mark as completed
    await step.run("update-job", async () => {
      await db.update(jobs)
        .set({ 
          rawData: datasetItems,
          apifyRunId: runId,
          status: "completed",
          updatedAt: new Date()
        })
        .where(eq(jobs.id, jobId));
    });

    // Step 3: Trigger AI analysis
    await step.run("trigger-analysis", async () => {
      await inngest.send({
        name: EVT.JobCompleted,
        data: {
          jobId,
          orgId,
          analysis: { status: "pending", timestamp: new Date().toISOString() }
        }
      });
    });

    // Step 4: Log successful webhook processing
    await step.run("log-success", async () => {
      console.log(`Apify webhook processed successfully:`, {
        jobId,
        runId,
        orgId,
        keyword: validation.keyword,
        datasetItemsCount: Array.isArray(datasetItems) ? datasetItems.length : 0,
        timestamp: new Date().toISOString()
      });
    });

    return { 
      jobId, 
      runId, 
      status: "webhook_processed",
      datasetItemsCount: Array.isArray(datasetItems) ? datasetItems.length : 0,
      timestamp: new Date().toISOString()
    };
  }
);

// Function for handling Apify run failures
export const onApifyRunFailed = inngest.createFunction(
  { id: "on-apify-run-failed" },
  { event: EVT.ApifyRunFailed },
  async ({ event, step }) => {
    const { jobId, runId, orgId, error } = event.data;

    // Step 1: Update job status to failed
    await step.run("mark-failed", async () => {
      await db.update(jobs)
        .set({ 
          status: "failed",
          error: error || "Apify run failed",
          updatedAt: new Date()
        })
        .where(eq(jobs.id, jobId));
    });

    // Step 2: Log failure for debugging
    await step.run("log-failure", async () => {
      console.error(`Apify run failed for job ${jobId}:`, {
        runId,
        orgId,
        error,
        timestamp: new Date().toISOString()
      });
    });

    return { 
      jobId, 
      runId, 
      status: "failed",
      error,
      timestamp: new Date().toISOString()
    };
  }
); 