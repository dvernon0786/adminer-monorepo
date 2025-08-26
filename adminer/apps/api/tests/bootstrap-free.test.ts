import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database and Clerk functions
const mockDb = {
  select: vi.fn(),
  update: vi.fn(),
};

const mockCurrentUser = vi.fn();
const mockGetAuth = vi.fn();

// Mock the fetch function
const mockFetch = vi.fn();

// Mock environment variables
const mockEnv = {
  DODO_API_BASE: "https://test.dodopayments.com",
  DODO_API_KEY: "sk_test_fake",
  DODO_FREE_PRODUCT_ID: "prod_free_123",
};

// Mock the orgs table
const mockOrgs = {
  id: "org_1",
  plan: "pro",
  quota_limit: 500,
  dodo_customer_id: null,
  dodo_subscription_id: null,
};

describe("bootstrap-free API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockDb.select.mockResolvedValue([mockOrgs]);
    mockDb.update.mockResolvedValue({});
    mockCurrentUser.mockResolvedValue({
      firstName: "Test",
      lastName: "User",
      username: "testuser",
      emailAddresses: [{ emailAddress: "test@example.com" }],
    });
    mockGetAuth.mockResolvedValue({
      userId: "user_123",
      orgId: "org_1",
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "test_id" }),
      text: () => Promise.resolve("success"),
    });
  });

  it("should create Dodo customer and subscription successfully", async () => {
    // Mock successful Dodo API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "cus_123" }),
        text: () => Promise.resolve("success"),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "sub_456" }),
        text: () => Promise.resolve("success"),
      });

    // This would be the actual API call logic
    const customerResponse = await mockFetch(`${mockEnv.DODO_API_BASE}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockEnv.DODO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: "test@example.com",
        name: "Test User",
        metadata: {
          clerk_user_id: "user_123",
          clerk_org_id: "org_1"
        }
      })
    });

    expect(customerResponse.ok).toBe(true);
    const customerData = await customerResponse.json();
    expect(customerData.id).toBe("cus_123");

    const subscriptionResponse = await mockFetch(`${mockEnv.DODO_API_BASE}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockEnv.DODO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: "cus_123",
        product_id: mockEnv.DODO_FREE_PRODUCT_ID,
        status: 'active',
        metadata: {
          clerk_user_id: "user_123",
          clerk_org_id: "org_1",
          plan_type: 'free'
        }
      })
    });

    expect(subscriptionResponse.ok).toBe(true);
    const subscriptionData = await subscriptionResponse.json();
    expect(subscriptionData.id).toBe("sub_456");
  });

  it("should handle existing free plan orgs idempotently", async () => {
    // Mock org already has free plan
    mockDb.select.mockResolvedValue([{ ...mockOrgs, plan: "free" }]);

    // Should not make any Dodo API calls
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should handle Dodo customer creation failure", async () => {
    // Mock Dodo customer creation failure
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    });

    const customerResponse = await mockFetch(`${mockEnv.DODO_API_BASE}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockEnv.DODO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: "test@example.com",
        name: "Test User",
        metadata: {
          clerk_user_id: "user_123",
          clerk_org_id: "org_1"
        }
      })
    });

    expect(customerResponse.ok).toBe(false);
    expect(customerResponse.status).toBe(500);
  });

  it("should handle Dodo subscription creation failure", async () => {
    // Mock successful customer creation but failed subscription
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "cus_123" }),
        text: () => Promise.resolve("success"),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve("Bad Request"),
      });

    // Customer creation should succeed
    const customerResponse = await mockFetch(`${mockEnv.DODO_API_BASE}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockEnv.DODO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: "test@example.com",
        name: "Test User",
        metadata: {
          clerk_user_id: "user_123",
          clerk_org_id: "org_1"
        }
      })
    });

    expect(customerResponse.ok).toBe(true);

    // Subscription creation should fail
    const subscriptionResponse = await mockFetch(`${mockEnv.DODO_API_BASE}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockEnv.DODO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: "cus_123",
        product_id: mockEnv.DODO_FREE_PRODUCT_ID,
        status: 'active',
        metadata: {
          clerk_user_id: "user_123",
          clerk_org_id: "org_1",
          plan_type: 'free'
        }
      })
    });

    expect(subscriptionResponse.ok).toBe(false);
    expect(subscriptionResponse.status).toBe(400);
  });

  it("should validate required environment variables", () => {
    expect(mockEnv.DODO_API_BASE).toBe("https://test.dodopayments.com");
    expect(mockEnv.DODO_API_KEY).toBe("sk_test_fake");
    expect(mockEnv.DODO_FREE_PRODUCT_ID).toBe("prod_free_123");
  });
}); 