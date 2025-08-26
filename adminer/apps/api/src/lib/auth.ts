import type { NextApiRequest } from "next";
import { getAuth } from "@clerk/nextjs/server"; // works in Vercel functions
import { db } from "../db/client";
import { orgs } from "../db/schema";
import { eq } from "drizzle-orm";

export type PlanKey = "free" | "pro" | "enterprise";

export async function requireOrgFromClerk(req: NextApiRequest): Promise<{ orgId: string; plan: PlanKey }>{
  const { userId, orgId } = getAuth(req as any);
  if (!userId) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  if (!orgId) throw Object.assign(new Error("No organization selected"), { statusCode: 400 });

  // Fetch plan from DB
  const row = await db.select({ plan: orgs.plan }).from(orgs).where(eq(orgs.id, orgId)).limit(1);
  const plan = (row[0]?.plan ?? "free") as PlanKey;
  return { orgId, plan };
} 