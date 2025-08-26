import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose";

type Plan = "free" | "pro" | "enterprise";
type Org = { id: string; plan: Plan };

const PLAN_LIMITS: Record<Plan, number> = {
  free: 10,
  pro: 500,
  enterprise: 2000,
};

export type AuthContext = {
  userId: string;               // payload.sub (Clerk user id)
  orgId?: string;               // from your JWT template claim
  email?: string;               // from your JWT template claim
  plan?: Plan;                  // resolved from DB
  usage?: number;               // current usage (month)
  payload: JWTPayload;          // full verified payload if needed
};

export type WithAuthOptions = {
  /**
   * If true (default), requests must include an org_id claim.
   * Set false if some routes are user-scoped.
   */
  requireOrg?: boolean;

  /**
   * Fetch org by id (must return plan).
   */
  getOrgById: (orgId: string) => Promise<Org | null>;

  /**
   * Return current month usage for the org.
   */
  getMonthlyUsage: (orgId: string) => Promise<number>;

  /**
   * Optional: map plan -> upgrade URL (Dodo hosted checkout).
   * If omitted, 402 responses won't include a link.
   */
  getUpgradeUrl?: (plan: Plan) => string | undefined;

  /**
   * Clerk issuer (your instance URL), e.g. https://clerk.adminer.online
   * If omitted, taken from env CLERK_ISSUER.
   */
  issuer?: string;

  /**
   * Name of the JWT template used on the client (only for logging/diagnostics).
   * Not required to verify.
   */
  templateName?: string;
};

function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

export function withAuthAndQuota(
  handler: (req: Request, ctx: AuthContext) => Promise<Response> | Response,
  opts: WithAuthOptions
) {
  const requireOrg = opts.requireOrg ?? true;
  const ISSUER = (opts.issuer || process.env.CLERK_ISSUER || "").trim();
  if (!ISSUER) {
    throw new Error("withAuthAndQuota: Missing Clerk issuer (set opts.issuer or CLERK_ISSUER)");
  }
  const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));

  return async (req: Request): Promise<Response> => {
    try {
      const token = bearer(req);
      if (!token) {
        return new Response(JSON.stringify({ error: "Missing token" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }

      // Verify token from Clerk
      const { payload } = await jwtVerify(token, JWKS, { issuer: ISSUER });

      const userId = payload.sub as string | undefined;
      if (!userId) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }

      // Your custom claims from the JWT template (per your screenshot)
      const email = (payload as any).email as string | undefined;
      const orgId = (payload as any).org_id as string | undefined;

      if (requireOrg && !orgId) {
        return new Response(JSON.stringify({ error: "Organization context required" }), {
          status: 403,
          headers: { "content-type": "application/json" },
        });
      }

      let plan: Plan | undefined;
      let usage: number | undefined;

      if (orgId) {
        const org = await opts.getOrgById(orgId);
        if (!org) {
          return new Response(JSON.stringify({ error: "Organization not found" }), {
            status: 403,
            headers: { "content-type": "application/json" },
          });
        }
        plan = org.plan;
        usage = await opts.getMonthlyUsage(org.id);

        const limit = PLAN_LIMITS[plan];
        if (usage >= limit) {
          const upgradeUrl = opts.getUpgradeUrl?.(plan);
          return new Response(
            JSON.stringify({
              error: "Quota exceeded",
              plan,
              usage,
              limit,
              ...(upgradeUrl ? { upgradeUrl } : {}),
            }),
            { status: 402, headers: { "content-type": "application/json" } }
          );
        }
      }

      // Hand off to the route handler with auth context
      return await handler(req, { userId, orgId, email, plan, usage, payload });
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", detail: err?.message || String(err) }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }
  };
} 