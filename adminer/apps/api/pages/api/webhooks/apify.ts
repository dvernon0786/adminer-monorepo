// apps/api/pages/api/webhooks/apify.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { inngest, EVT } from "../../../src/inngest";
import crypto from "crypto";

// Disable body parsing for webhook validation
export const config = { 
  api: { 
    bodyParser: false 
  } 
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).setHeader("Allow", "POST").end();
  }

  try {
    // Get raw body for webhook validation
    const rawBody = await getRawBody(req);
    if (!rawBody) {
      return res.status(400).json({ error: "No body received" });
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(req, rawBody)) {
      console.warn("Apify webhook signature verification failed");
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    // Parse the webhook payload
    const payload = JSON.parse(rawBody.toString());
    
    // Extract job ID from query parameter
    const { jobId } = req.query as { jobId: string };
    if (!jobId) {
      return res.status(400).json({ error: "Missing jobId parameter" });
    }

    // Validate webhook payload structure
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    // Extract run information
    const runId = payload.resource?.id || payload.data?.id || "unknown";
    const eventType = payload.eventType || payload.type || "unknown";
    
    // Determine if this is a completion or failure
    if (eventType === "RUN.SUCCEEDED" || eventType === "RUN.COMPLETED") {
      // Fetch dataset items from Apify
      const datasetItems = await fetchDatasetItems(runId);
      
      // Emit completion event to Inngest
      await inngest.send({
        name: EVT.ApifyRunCompleted,
        data: {
          jobId,
          runId,
          orgId: "unknown", // Will be validated in Inngest function
          datasetItems
        }
      });

      return res.status(200).json({ 
        ok: true, 
        message: "Webhook processed successfully",
        eventType: "completion"
      });

    } else if (eventType === "RUN.FAILED" || eventType === "RUN.ABORTED") {
      // Emit failure event to Inngest
      await inngest.send({
        name: EVT.ApifyRunFailed,
        data: {
          jobId,
          runId,
          orgId: "unknown", // Will be validated in Inngest function
          error: payload.error || "Apify run failed"
        }
      });

      return res.status(200).json({ 
        ok: true, 
        message: "Failure webhook processed successfully",
        eventType: "failure"
      });

    } else {
      // Unknown event type - log but don't fail
      console.log(`Unknown Apify webhook event type: ${eventType}`, { jobId, runId });
      return res.status(200).json({ 
        ok: true, 
        message: "Webhook received (unknown event type)",
        eventType: "unknown"
      });
    }

  } catch (error) {
    console.error("Apify webhook error:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

// Helper function to fetch dataset items from Apify
async function fetchDatasetItems(runId: string): Promise<any[]> {
  try {
    const token = process.env.APIFY_TOKEN;
    if (!token) {
      throw new Error("APIFY_TOKEN not configured");
    }

    // Try to get dataset items from the run
    const url = new URL(`https://api.apify.com/v2/runs/${runId}/dataset/items`);
    url.searchParams.set("token", token);
    url.searchParams.set("format", "json");
    url.searchParams.set("clean", "1");

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.status} ${response.statusText}`);
    }

    const items = await response.json();
    return Array.isArray(items) ? items : [];

  } catch (error) {
    console.error("Failed to fetch dataset items:", error);
    return [];
  }
}

// Helper function to verify webhook signature
function verifyWebhookSignature(req: NextApiRequest, body: Buffer): boolean {
  const secret = process.env.WEBHOOK_SECRET_APIFY;
  if (!secret) {
    console.warn("WEBHOOK_SECRET_APIFY not configured");
    return false;
  }

  const signature = req.headers["x-webhook-signature"] as string | undefined;
  if (!signature) {
    console.warn("Missing X-Webhook-Signature header");
    return false;
  }

  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex")}`;

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    console.warn("Webhook signature mismatch", {
      received: signature,
      expected: expectedSignature
    });
  }

  return isValid;
}

// Helper function to get raw body
async function getRawBody(req: NextApiRequest): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    
    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve(null);
      } else {
        resolve(Buffer.concat(chunks));
      }
    });
    
    req.on("error", () => {
      resolve(null);
    });
  });
} 