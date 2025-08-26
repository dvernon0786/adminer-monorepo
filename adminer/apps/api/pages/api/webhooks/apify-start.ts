// apps/api/pages/api/webhooks/apify-start.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { inngest, EVT } from "../../../src/inngest";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).setHeader("Allow", "POST").end();
  }

  try {
    // Extract job ID from query parameter
    const { jobId } = req.query as { jobId: string };
    if (!jobId) {
      return res.status(400).json({ error: "Missing jobId parameter" });
    }

    // Parse webhook payload
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const runId = body?.resource?.id || body?.data?.id || "unknown";

    // Emit run started event to Inngest
    await inngest.send({
      name: EVT.ApifyRunStarted,
      data: {
        jobId,
        runId,
        orgId: "unknown" // Will be validated in Inngest function
      }
    });

    return res.status(200).json({ 
      ok: true, 
      message: "Run start webhook processed successfully",
      jobId,
      runId
    });

  } catch (error) {
    console.error("Apify start webhook error:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
} 