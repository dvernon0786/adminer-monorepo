#!/bin/bash
# Execute this script to create all missing database connection files

set -e
# We're already in the correct directory

echo "Installing database dependencies..."
npm install drizzle-orm@^0.36.4 @neondatabase/serverless@^0.10.1 postgres@^3.4.5
npm install -D drizzle-kit@^0.30.0

echo "Creating directory structure..."
mkdir -p src/db src/lib

echo "Creating drizzle.config.ts..."
cat > drizzle.config.ts << 'EOF'
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
EOF

echo "Creating src/db/schema.ts..."
cat > src/db/schema.ts << 'EOF'
import { pgTable, text, integer, timestamp, boolean, jsonb, primaryKey } from 'drizzle-orm/pg-core';

export const orgs = pgTable('orgs', {
  id: text('id').primaryKey(),
  name: text('name'),
  plan: text('plan').default('free'),
  status: text('status').default('active'),
  quotaLimit: integer('quota_limit').default(10),
  quotaUsed: integer('quota_used').default(0),
  dodoCustomerId: text('dodo_customer_id'),
  dodoSubscriptionId: text('dodo_subscription_id'),
  currentPeriodEnd: timestamp('current_period_end'),
  planCode: text('plan_code'),
  externalId: text('external_id').notNull().unique(),
  billingStatus: text('billing_status'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const plans = pgTable('plans', {
  code: text('code').primaryKey(),
  name: text('name').notNull(),
  monthlyQuota: integer('monthly_quota').notNull(),
});

export const usage = pgTable('usage', {
  orgId: text('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  yyyymm: text('yyyymm').notNull(),
  used: integer('used').notNull().default(0),
}, (table) => ({
  pk: primaryKey({ columns: [table.orgId, table.yyyymm] }),
}));

export const webhookEvents = pgTable('webhook_events', {
  id: text('id').primaryKey(),
  eventType: text('event_type').notNull(),
  orgId: text('org_id').notNull(),
  processedAt: timestamp('processed_at').defaultNow(),
  data: text('data'),
  type: text('type'),
  payload: jsonb('payload'),
  receivedAt: timestamp('received_at'),
});

export const quotaUsage = pgTable('quota_usage', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull(),
  jobId: text('job_id'),
  createdAt: timestamp('created_at').defaultNow(),
  billingPeriod: text('billing_period').notNull(),
});

export const jobs = pgTable('jobs', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  jobType: text('job_type'),
  status: text('status').default('pending'),
  result: jsonb('result'),
  adsRequested: integer('ads_requested'),
  adsImported: integer('ads_imported'),
  quotaDebit: integer('quota_debit'),
});
EOF

echo "Creating src/lib/db.ts..."
cat > src/lib/db.ts << 'EOF'
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../db/schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
export * from '../db/schema';
EOF

echo "Backing up existing consolidated.js..."
if [ -f "pages/api/consolidated.js" ]; then
  cp pages/api/consolidated.js pages/api/consolidated-backup-$(date +%Y%m%d-%H%M%S).js
fi

echo "Creating new pages/api/consolidated.js with database integration..."
cat > pages/api/consolidated.js << 'EOF'
const { db, orgs, plans, usage } = require('../../src/lib/db');
const { eq, and } = require('drizzle-orm');

module.exports = async function handler(req, res) {
  const { action, orgId } = req.query;

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (action) {
      case 'quota':
      case 'quota/status':
        return await handleQuotaStatus(req, res, orgId);
      case 'health':
        return await handleHealth(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

async function handleQuotaStatus(req, res, orgId) {
  if (!orgId) {
    return res.status(400).json({ error: 'orgId required' });
  }

  try {
    // Get org with plan info
    const orgResult = await db
      .select({
        id: orgs.id,
        quotaLimit: orgs.quotaLimit,
        quotaUsed: orgs.quotaUsed,
        plan: orgs.plan,
        billingStatus: orgs.billingStatus,
      })
      .from(orgs)
      .where(eq(orgs.id, orgId))
      .limit(1);

    if (orgResult.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const orgData = orgResult[0];
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Get current month usage
    const monthlyUsageResult = await db
      .select({ used: usage.used })
      .from(usage)
      .where(and(
        eq(usage.orgId, orgId),
        eq(usage.yyyymm, currentMonth)
      ))
      .limit(1);

    const currentUsage = monthlyUsageResult.length > 0 ? monthlyUsageResult[0].used : 0;
    const remaining = Math.max(0, orgData.quotaLimit - currentUsage);
    const isOverQuota = currentUsage >= orgData.quotaLimit;

    if (isOverQuota && orgData.plan === 'free') {
      return res.status(402).json({
        status: 'QUOTA_EXCEEDED',
        quota: orgData.quotaLimit,
        used: currentUsage,
        remaining: 0,
        upgradeUrl: `/upgrade?orgId=${orgId}`,
        message: 'Quota exceeded. Please upgrade to continue.'
      });
    }

    return res.status(200).json({
      status: 'ACTIVE',
      quota: orgData.quotaLimit,
      used: currentUsage,
      remaining,
      plan: orgData.plan,
      billingStatus: orgData.billingStatus || 'active',
    });
  } catch (dbError) {
    console.error('Database error in quota check:', dbError);
    return res.status(500).json({ 
      error: 'Database error', 
      details: dbError.message 
    });
  }
}

async function handleHealth(req, res) {
  try {
    // Test database connection
    const plansResult = await db.select({ code: plans.code }).from(plans).limit(1);
    
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      plansFound: plansResult.length,
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check database error:', error);
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
}
EOF

echo "Adding database scripts to package.json..."
npm pkg set scripts.db:generate="drizzle-kit generate"
npm pkg set scripts.db:migrate="drizzle-kit migrate"
npm pkg set scripts.db:studio="drizzle-kit studio"

echo "Creating test file..."
cat > test-database-connection.js << 'EOF'
const { db, plans, orgs } = require('./src/lib/db');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test plans table
    const planResults = await db.select().from(plans);
    console.log(`✅ Plans table: ${planResults.length} plans found`);
    planResults.forEach(plan => {
      console.log(`  - ${plan.name} (${plan.code}): ${plan.monthlyQuota} requests/month`);
    });
    
    // Test orgs table
    const orgCount = await db.select().from(orgs);
    console.log(`✅ Orgs table: ${orgCount.length} organizations found`);
    
    console.log('✅ Database connection successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Make sure DATABASE_URL is set in your environment');
    process.exit(1);
  }
}

testConnection();
EOF

echo ""
echo "✅ Phase 1 Database Connection Layer Complete!"
echo ""
echo "Next steps:"
echo "1. Make sure DATABASE_URL is set in your Vercel environment variables"
echo "2. Test locally: node test-database-connection.js"
echo "3. Run MVP checker: cd ../../ && ./adminer_mvp_status_checker.sh"
echo "4. Commit: git add . && git commit -m 'FEAT: Database connection layer'"
echo ""
echo "Expected result: Database section in MVP checker should change from ❌ to ✅"