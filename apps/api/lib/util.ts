import type { NextApiResponse } from "next";

/**
 * Consistent unauthenticated response.
 * Use this whenever a request lacks a valid session.
 * Returns 401 with a stable JSON shape: { error: "unauthenticated" }.
 */
export function unauth(res: NextApiResponse) {
  res.status(401).json({ error: "unauthenticated" } as const);
} 