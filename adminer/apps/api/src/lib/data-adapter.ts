import { db } from "../db/client";
import { orgs } from "../db/schema";
import { eq } from "drizzle-orm";

export async function getOrgByExternalId(externalId: string) {
  const [org] = await db.select().from(orgs).where(eq(orgs.externalId, externalId)).limit(1);
  return org ?? null;
}

export async function getOrgById(id: string) {
  const [org] = await db.select().from(orgs).where(eq(orgs.id, id)).limit(1);
  return org ?? null;
}

export async function getMonthlyUsage(orgId: string) {
  // This function should be implemented based on your quota tracking logic
  // For now, returning a placeholder
  return 0;
} 