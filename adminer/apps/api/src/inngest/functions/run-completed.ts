import { inngest } from "../client";
import { EVT } from "../events";
import { db } from "../../db/client";
import { jobs } from "../../db/schema";
import { eq } from "drizzle-orm";
import { normalizeAd, passesPrefilter } from "../../ai/classify";
import { analyzeAd } from "../../ai/run-analysis";

export const onApifyRunCompleted = inngest.createFunction(
  { id: "on-apify-run-completed" },
  { event: EVT.ApifyRunCompleted },
  async ({ event, step }) => {
    const { jobId, data } = event.data as { jobId: string; data: any };

    // 1) Save raw_data immediately
    await step.run("save-raw", async () => {
      await db.update(jobs)
        .set({ rawData: data, updatedAt: new Date() })
        .where(eq(jobs.id, jobId));
    });

    // 2) Determine best ad item (you can iterate all; here we pick the first qualifying)
    const items: any[] = Array.isArray(data) ? data : (data?.items ?? []);
    let picked: any = null;
    let classified: ReturnType<typeof normalizeAd> | null = null;

    await step.run("prefilter-and-pick", async () => {
      for (const ad of items) {
        const c = normalizeAd(ad);
        if (passesPrefilter(c)) {
          picked = ad;
          classified = c;
          break;
        }
      }
    });

    if (!picked || !classified) {
      await step.run("no-qualifying-ad", async () => {
        await db.update(jobs)
          .set({
            status: "completed",
            error: "No qualifying ads after prefilter (likes>=1 & active=true)",
            updatedAt: new Date(),
          })
          .where(eq(jobs.id, jobId));
      });
      return { ok: true, reason: "no-qualifying-ad" };
    }

    // 3) Run AI analysis based on content type
    const analysis = await step.run("ai-analysis", async () => analyzeAd(classified!, picked));

    // 4) Persist structured columns
    await step.run("save-structured", async () => {
      await db.update(jobs).set({
        adArchiveId: classified!.adArchiveId?.toString(),
        pageProfileUri: classified!.pageProfileUri ?? null,
        pageId: classified!.pageId?.toString(),
        pageName: classified!.pageName ?? null,
        contentType: classified!.contentType,
        isActive: classified!.isActive,

        summary: analysis.summary,
        rewrittenAdCopy: analysis.rewrittenAdCopy,
        keyInsights: analysis.keyInsights,
        competitorStrategy: analysis.competitorStrategy,
        recommendations: analysis.recommendations,

        imagePrompt: analysis.imagePrompt,
        videoPrompt: analysis.videoPrompt,

        status: "completed",
        updatedAt: new Date(),
      }).where(eq(jobs.id, jobId));
    });

    return { ok: true };
  }
); 