import type { User as ClerkUser } from "@clerk/nextjs/server";

export type DB = {
  selectUserByClerkId: (clerkUserId: string) => Promise<
    | { id: string; orgId: string; dodoCustomerId: string | null }
    | undefined
  >;
  selectOrgById: (orgId: string) => Promise<
    | { id: string; plan: "free" | "pro" | "enterprise"; quota: number | null }
    | undefined
  >;
  updateUserDodoCustomer: (userId: string, dodoCustomerId: string) => Promise<void>;
  updateOrgPlanAndQuota: (orgId: string, plan: "free" | "pro" | "enterprise", quota: number, dodoSubscriptionId: string) => Promise<void>;
};

export type DodoConfig = {
  apiBase: string;                 // e.g. https://test.dodopayments.com
  secretKey: string;               // sk_test_...
  freeProductId: string;           // prod_xxx
};

export type ClerkContext = {
  userId: string;                  // from auth()
  user: Pick<ClerkUser, "firstName" | "lastName" | "emailAddresses">;
};

export async function bootstrapFree({
  db,
  dodo,
  clerk,
  fetchImpl = fetch,
}: {
  db: DB;
  dodo: DodoConfig;
  clerk: ClerkContext;
  fetchImpl?: typeof fetch;
}) {
  if (!clerk.userId) throw new Error("Unauthorized");
  const email = clerk.user.emailAddresses?.[0]?.emailAddress;
  if (!email) throw new Error("Missing email");

  const dbUser = await db.selectUserByClerkId(clerk.userId);
  if (!dbUser) throw new Error("User not in DB");

  const dbOrg = await db.selectOrgById(dbUser.orgId);
  if (!dbOrg) throw new Error("Org not found");

  // idempotent shortcut
  if (dbOrg.plan === "free") {
    return { ok: true, plan: "free", idempotent: true as const };
  }

  // Ensure Dodo customer
  let dodoCustomerId = dbUser.dodoCustomerId;
  if (!dodoCustomerId) {
    const res = await fetchImpl(`${dodo.apiBase}/customers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${dodo.secretKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `cust-${clerk.userId}`,
      },
      body: JSON.stringify({
        email,
        name: `${clerk.user.firstName ?? ""} ${clerk.user.lastName ?? ""}`.trim() || email,
      }),
    });
    if (!res.ok) {
      throw new Error(`Dodo customer create failed: ${res.status} ${res.statusText}`);
    }
    const created = await res.json();
    dodoCustomerId = created.customer_id || created.id;
    if (!dodoCustomerId) throw new Error("Missing customer_id in Dodo response");
    await db.updateUserDodoCustomer(dbUser.id, dodoCustomerId);
  }

  // Create Free subscription
  const subRes = await fetchImpl(`${dodo.apiBase}/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${dodo.secretKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `sub-free-${dbOrg.id}`,
    },
    body: JSON.stringify({
      customer: { customer_id: dodoCustomerId },
      product_id: dodo.freeProductId,
      quantity: 1,
    }),
  });
  if (!subRes.ok) {
    throw new Error(`Dodo subscription create failed: ${subRes.status} ${subRes.statusText}`);
  }
  const sub = await subRes.json();
  const subscriptionId = sub.subscription_id || sub.id;
  if (!subscriptionId) throw new Error("Missing subscription_id in Dodo response");

  // Update org plan/quota
  await db.updateOrgPlanAndQuota(dbOrg.id, "free", 10, subscriptionId);

  return { ok: true as const, plan: "free" as const, subscriptionId };
} 