import { openai, geminiFlash } from "./clients";
import {
  STRATEGIC_ANALYSIS_PROMPT,
  IMAGE_ANALYSIS_STEP1_PROMPT,
  IMAGE_ANALYSIS_JSON_PROMPT,
  VIDEO_ANALYSIS_STEP1_PROMPT,
  VIDEO_ANALYSIS_JSON_PROMPT,
  THUMBNAIL_ANALYSIS_JSON_PROMPT
} from "./prompts";
import { MAX_INLINE_VIDEO_BYTES, ALLOWED_VIDEO_MIME } from "./config";
import { headContentLength, fetchAsBufferWithCap } from "./net";
import type { Classified } from "./classify";

export async function runTextStrategyAnalysis(rawAd: any): Promise<{
  summary: string;
  rewrittenAdCopy: string;
  keyInsights: string[];
  competitorStrategy: string;
  recommendations: string[];
}> {
  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: STRATEGIC_ANALYSIS_PROMPT },
      { role: "user", content: JSON.stringify(rawAd) }
    ],
    response_format: { type: "json_object" }
  });

  const content = resp.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}

export async function runImageAnalysis(imageUrl: string): Promise<any> {
  // GPT-4o vision: send text + image url, ask for JSON
  const messages: any[] = [
    {
      role: "system",
      content: IMAGE_ANALYSIS_STEP1_PROMPT
    },
    {
      role: "user",
      content: [
        { type: "text", text: IMAGE_ANALYSIS_JSON_PROMPT },
        { type: "image_url", image_url: { url: imageUrl } }
      ]
    }
  ];

  const resp = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    messages,
    response_format: { type: "json_object" }
  });

  const content = resp.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}

export async function runThumbnailAnalysis(thumbnailUrl: string): Promise<any> {
  const messages: any[] = [
    { role: "system", content: "Analyze ad thumbnail for CTR potential in JSON." },
    { role: "user", content: THUMBNAIL_ANALYSIS_JSON_PROMPT(thumbnailUrl) }
  ];

  const resp = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    messages,
    response_format: { type: "json_object" }
  });

  const content = resp.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}

function guessExtFromMime(m?: string | null) {
  if (!m) return "mp4";
  if (m.includes("mp4")) return "mp4";
  if (m.includes("quicktime")) return "mov";
  if (m.includes("webm")) return "webm";
  return "mp4";
}

export async function runVideoAnalysis(videoUrl: string): Promise<any> {
  // Enforce sd url includes https://video per your rule
  if (!videoUrl.includes("https://video")) {
    return { skipped: true, reason: "sd url not whitelisted", url: videoUrl };
  }

  // Preflight head check
  const headLen = await headContentLength(videoUrl);
  if (!headLen || headLen > MAX_INLINE_VIDEO_BYTES) {
    return { skipped: true, reason: !headLen ? "no content-length" : "file too large", contentLength: headLen ?? null };
  }

  // Download with cap
  const { buf, mime } = await fetchAsBufferWithCap(videoUrl, MAX_INLINE_VIDEO_BYTES);
  if (!buf) {
    return { skipped: true, reason: "download exceeded cap" };
  }
  const mimeType = ALLOWED_VIDEO_MIME.find(m => mime?.includes(m)) ?? "video/mp4";
  const ext = guessExtFromMime(mime);

  // Build Gemini prompt (inline_data path for <20MB)
  // Docs: inline video for smaller files (<20MB) rather than Files API
  const model = geminiFlash();
  const base64 = buf.toString("base64");

  const prompt = `${VIDEO_ANALYSIS_STEP1_PROMPT}\n\n${VIDEO_ANALYSIS_JSON_PROMPT}\n`;
  const result = await model.generateContent({
    contents: [
      { role: "user", parts: [{ text: prompt }] },
      { role: "user", parts: [{ inlineData: { mimeType, data: base64 } }] }
    ]
  });

  const text = (await result.response.text()) || "{}";
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return { contentSummary: "", recommendations: [], parseError: true, raw: cleaned.slice(0, 2000) };
  }
}

/**
 * Main orchestrator per ad:
 * - Always run text strategic analysis on the raw ad object
 * - If image present: run image analysis on first image
 * - If video present: run video analysis on first sd url
 * Returns the row update payload.
 */
export async function analyzeAd(c: Classified, rawAd: any) {
  const base = await runTextStrategyAnalysis(rawAd);

  let imagePrompt: any = null;
  let videoPrompt: any = null;

  if (c.images.length > 0) {
    imagePrompt = await runImageAnalysis(c.images[0]);
  }

  if (c.videos.length > 0) {
    videoPrompt = await runVideoAnalysis(c.videos[0]);
  }

  return {
    summary: base.summary ?? null,
    rewrittenAdCopy: base.rewrittenAdCopy ?? null,
    keyInsights: base.keyInsights ?? null,
    competitorStrategy: base.competitorStrategy ?? null,
    recommendations: base.recommendations ?? null,
    imagePrompt,
    videoPrompt,
  };
} 