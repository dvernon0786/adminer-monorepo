
// Neon Database Queries Lock - Architecture Lock Phase 2
// This file locks the working database query patterns

class NeonQueriesLock {
  constructor() {
    this.queryPatterns = this.initializeQueryPatterns();
  }

  initializeQueryPatterns() {
    return {
      // Lock the working organization queries
      organizations: {
        create: `INSERT INTO organizations (id, name, clerk_org_id, plan, quota_limit, quota_used, created_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW()) RETURNING *`,
        findByClerkId: `SELECT * FROM organizations WHERE clerk_org_id = $1`,
        updatePlan: `UPDATE organizations SET plan = $1, quota_limit = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
        updateQuota: `UPDATE organizations SET quota_used = $1, updated_at = NOW() WHERE id = $2 RETURNING *`
      },
      
      // Lock the working subscription queries
      subscriptions: {
        create: `INSERT INTO subscriptions (id, org_id, dodo_subscription_id, plan, status, created_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW()) RETURNING *`,
        findByOrgId: `SELECT * FROM subscriptions WHERE org_id = $1`,
        updateStatus: `UPDATE subscriptions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`
      },
      
      // Lock the working webhook events queries
      webhookEvents: {
        create: `INSERT INTO webhook_events (id, event_type, org_id, data, processed_at) VALUES (gen_random_uuid(), $1, $2, $3, NOW()) RETURNING *`,
        findByOrgId: `SELECT * FROM webhook_events WHERE org_id = $1 ORDER BY processed_at DESC`
      }
    };
  }

  getQueryPatterns() {
    return this.queryPatterns;
  }
}

module.exports = { NeonQueriesLock };
