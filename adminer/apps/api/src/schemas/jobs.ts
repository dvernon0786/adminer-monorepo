import { z } from "zod";

export const StartJobBody = z.object({
  keyword: z.string().min(1),
  limit: z.number().int().min(1).max(2000),
}).passthrough(); // allow extra Apify params

export type StartJobBodyType = z.infer<typeof StartJobBody>; 