// apps/api/src/inngest/functions/job-completed.ts
import { inngest } from "../client";
import { EVT } from "../events";
import { db } from "../../db/client";
import { jobs } from "../../db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export const onJobCompleted = inngest.createFunction(
  { id: "on-job-completed" },
  { event: EVT.JobCompleted },
  async ({ event, step }) => {
    const { jobId, orgId, analysis } = event.data;

    // Step 1: Fetch job data for analysis
    const jobData = await step.run("fetch-job", async () => {
      const job = await db.query.jobs.findFirst({
        where: eq(jobs.id, jobId),
        columns: {
          rawData: true,
          keyword: true,
          status: true
        }
      });

      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      if (job.status !== "completed") {
        throw new Error(`Job ${jobId} is not in completed status`);
      }

      return job;
    });

    // Step 2: Perform AI analysis on the raw data
    const aiAnalysis = await step.run("ai-analysis", async () => {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key not configured");
      }

      try {
        const systemPrompt = `You are an expert advertising analyst. Analyze the provided ad dataset and return a JSON response with the following structure:
{
  "winnerScore": number (0-100, where 100 is the best performing ad),
  "highlights": string[] (3-5 key insights about the ads),
  "reasons": string (explanation of the winner score),
  "summary": string (brief overview of the dataset)
}

Focus on:
- Ad performance indicators
- Creative elements that stand out
- Market positioning and messaging
- Competitive advantages`;

        const userPrompt = `Analyze this ad dataset for keyword "${jobData.keyword}":
${JSON.stringify(jobData.rawData).slice(0, 8000)} // Limit to prevent token overflow

Return only valid JSON.`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.1,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" },
          max_tokens: 1000
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error("No response from OpenAI");
        }

        // Parse and validate the response
        const parsed = JSON.parse(content);
        
        // Validate required fields
        if (typeof parsed.winnerScore !== 'number' || parsed.winnerScore < 0 || parsed.winnerScore > 100) {
          throw new Error("Invalid winnerScore in AI response");
        }
        if (!Array.isArray(parsed.highlights) || parsed.highlights.length === 0) {
          throw new Error("Invalid highlights in AI response");
        }
        if (typeof parsed.reasons !== 'string' || parsed.reasons.length === 0) {
          throw new Error("Invalid reasons in AI response");
        }

        return {
          ...parsed,
          timestamp: new Date().toISOString(),
          model: "gpt-4o-mini",
          status: "completed"
        };

      } catch (error) {
        console.error("AI analysis failed:", error);
        
        // Return fallback analysis on failure
        return {
          winnerScore: 50,
          highlights: ["Analysis temporarily unavailable"],
          reasons: "AI analysis failed, using fallback scoring",
          summary: "Dataset processed but analysis incomplete",
          timestamp: new Date().toISOString(),
          model: "fallback",
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    });

    // Step 3: Update job with analysis results
    await step.run("update-analysis", async () => {
      await db.update(jobs)
        .set({ 
          updatedAt: new Date()
        })
        .where(eq(jobs.id, jobId));
    });

    // Step 4: Log completion
    await step.run("log-completion", async () => {
      console.log(`Job ${jobId} analysis completed:`, {
        orgId,
        keyword: jobData.keyword,
        winnerScore: aiAnalysis.winnerScore,
        timestamp: aiAnalysis.timestamp
      });
    });

    return { 
      jobId, 
      status: "analysis_completed",
      analysis: aiAnalysis,
      timestamp: new Date().toISOString()
    };
  }
); 