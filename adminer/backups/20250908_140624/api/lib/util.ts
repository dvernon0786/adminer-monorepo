import type { NextApiResponse } from "next";

/** Consistent unauthenticated response for handlers (defensive fallback). */
export function unauth(res: NextApiResponse) {
  res.status(401).json({ error: "unauthenticated" } as const);
} 