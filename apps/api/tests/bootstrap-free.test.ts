import { describe, it, expect, vi, beforeEach } from "vitest";
import { bootstrapFree, type DB, type DodoConfig } from "../src/lib/billing/bootstrapFree";

// A minimal fake fetch that we can steer per test
function createFakeFetch() {
  const calls: any[] = [];
  const impl = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    // default 404 unless a handler overrides in test
    return new Response("", { status: 404, statusText: "Not Found" }) as any;
  });
  return { fetch: impl, calls };
}

const dodoCfg: DodoConfig = {
  apiBase: "https://test.dodopayments.com",
  secretKey: "sk_test_fake",
  freeProductId: "prod_free_123",
};

const clerkCtx = {
  userId: "user_1",
  user: {
    firstName: "A",
    lastName: "User",
    emailAddresses: [{ emailAddress: "a.user@example.com" }] as any,
  },
};

describe("bootstrapFree()", () => {
  let fakeDb: DB;
  let fetchKit: ReturnType<typeof createFakeFetch>;

  beforeEach(() => {
    fetchKit = createFakeFetch();

    // default DB state: user without dodoCustomerId; org not free
    fakeDb = {
      selectUserByClerkId: vi.fn(async (id: string) =>
        id === "user_1" ? { id: "db_user_1", orgId: "org_1", dodoCustomerId: null } : undefined
      ),
      selectOrgById: vi.fn(async (id: string) =>
        id === "org_1" ? { id: "org_1", plan: "pro", quota: 500 } : undefined
      ),
      updateUserDodoCustomer: vi.fn(async () => {}),
      updateOrgPlanAndQuota: vi.fn(async () => {}),
    };
  });

  it("provisions Dodo customer + free subscription and updates DB", async () => {
    // Fake Dodo /customers OK
    fetchKit.fetch.mockImplementationOnce(async (_url, _init) =>
      new Response(JSON.stringify({ customer_id: "cus_123" }), { status: 200 }) as any
    );
    // Fake Dodo /subscriptions OK
    fetchKit.fetch.mockImplementationOnce(async (_url, _init) =>
      new Response(JSON.stringify({ subscription_id: "sub_abc" }), { status: 200 }) as any
    );

    const result = await bootstrapFree({
      db: fakeDb,
      dodo: dodoCfg,
      clerk: clerkCtx as any,
      fetchImpl: fetchKit.fetch as any,
    });

    expect(result).toEqual({ ok: true, plan: "free", subscriptionId: "sub_abc" });

    // DB calls
    expect(fakeDb.updateUserDodoCustomer).toHaveBeenCalledWith("db_user_1", "cus_123");
    expect(fakeDb.updateOrgPlanAndQuota).toHaveBeenCalledWith("org_1", "free", 10, "sub_abc");

    // Fetch calls
    expect(fetchKit.fetch).toHaveBeenCalledTimes(2);
    const [custCall, subCall] = (fetchKit.fetch as any).mock.calls;
    expect(custCall[0]).toMatch(/\/customers$/);
    expect(subCall[0]).toMatch(/\/subscriptions$/);
  });

  it("is idempotent when org already on free", async () => {
    // org already free
    fakeDb.selectOrgById = vi.fn(async () => ({ id: "org_1", plan: "free", quota: 10 }));

    const result = await bootstrapFree({
      db: fakeDb,
      dodo: dodoCfg,
      clerk: clerkCtx as any,
      fetchImpl: fetchKit.fetch as any,
    });

    expect(result).toEqual({ ok: true, plan: "free", idempotent: true });
    expect(fetchKit.fetch).not.toHaveBeenCalled();
    expect(fakeDb.updateUserDodoCustomer).not.toHaveBeenCalled();
    expect(fakeDb.updateOrgPlanAndQuota).not.toHaveBeenCalled();
  });

  it("re-throws when Dodo customer create fails", async () => {
    // Dodo /customers returns 500
    fetchKit.fetch.mockImplementationOnce(async () => new Response("", { status: 500, statusText: "Boom" }) as any);

    await expect(
      bootstrapFree({
        db: fakeDb,
        dodo: dodoCfg,
        clerk: clerkCtx as any,
        fetchImpl: fetchKit.fetch as any,
      })
    ).rejects.toThrow(/Dodo customer create failed/i);

    expect(fetchKit.fetch).toHaveBeenCalledTimes(1);
    expect(fakeDb.updateUserDodoCustomer).not.toHaveBeenCalled();
    expect(fakeDb.updateOrgPlanAndQuota).not.toHaveBeenCalled();
  });
}); 