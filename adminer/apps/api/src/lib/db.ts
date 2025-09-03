import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../../.env.local' });

// Create database connection
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// Database operations for organizations
export const orgDb = {
  // Get organization by Clerk ID
  async getByClerkId(clerkOrgId: string) {
    const result = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.clerkOrgId, clerkOrgId))
      .limit(1);
    return result[0] || null;
  },

  // Create new organization
  async create(data: { clerkOrgId: string; name: string; plan?: string; quotaLimit?: number }) {
    const result = await db
      .insert(schema.organizations)
      .values({
        clerkOrgId: data.clerkOrgId,
        name: data.name,
        plan: data.plan || 'free',
        quotaLimit: data.quotaLimit || 100,
        quotaUsed: 0,
      })
      .returning();
    return result[0];
  },

  // Update organization
  async update(clerkOrgId: string, data: Partial<schema.NewOrganization>) {
    const result = await db
      .update(schema.organizations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.organizations.clerkOrgId, clerkOrgId))
      .returning();
    return result[0];
  },

  // Get quota status
  async getQuotaStatus(clerkOrgId: string) {
    const org = await this.getByClerkId(clerkOrgId);
    if (!org) return null;

    return {
      used: org.quotaUsed,
      limit: org.quotaLimit,
      percentage: Math.round((org.quotaUsed / org.quotaLimit) * 100),
      plan: org.plan,
    };
  },

  // Consume quota
  async consumeQuota(clerkOrgId: string, amount: number, type: string, description?: string) {
    const org = await this.getByClerkId(clerkOrgId);
    if (!org) throw new Error('Organization not found');

    // Check if quota would be exceeded
    if (org.quotaUsed + amount > org.quotaLimit) {
      throw new Error('Quota limit exceeded');
    }

    // Update organization quota
    await db
      .update(schema.organizations)
      .set({ 
        quotaUsed: org.quotaUsed + amount,
        updatedAt: new Date()
      })
      .where(eq(schema.organizations.clerkOrgId, clerkOrgId));

    // Record quota usage
    await db.insert(schema.quotaUsage).values({
      orgId: org.id,
      type,
      amount,
      description,
    });

    return { success: true, remaining: org.quotaLimit - (org.quotaUsed + amount) };
  },
};

// Database operations for jobs
export const jobDb = {
  // Create new job
  async create(data: { orgId: string; type: string; input: any }) {
    const result = await db
      .insert(schema.jobs)
      .values({
        orgId: data.orgId,
        type: data.type,
        input: data.input,
        status: 'pending',
      })
      .returning();
    return result[0];
  },

  // Update job status
  async updateStatus(jobId: string, status: string, output?: any, error?: string) {
    const updateData: any = { status };
    
    if (status === 'running') {
      updateData.startedAt = new Date();
    } else if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
      if (output) updateData.output = output;
      if (error) updateData.error = error;
    }

    const result = await db
      .update(schema.jobs)
      .set(updateData)
      .where(eq(schema.jobs.id, jobId))
      .returning();
    return result[0];
  },

  // Get jobs for organization
  async getByOrgId(orgId: string, limit = 50) {
    const result = await db
      .select()
      .from(schema.jobs)
      .where(eq(schema.jobs.orgId, orgId))
      .orderBy(desc(schema.jobs.createdAt))
      .limit(limit);
    return result;
  },

  // Get jobs by status
  async findByStatus(status: string) {
    const result = await db
      .select()
      .from(schema.jobs)
      .where(eq(schema.jobs.status, status))
      .orderBy(desc(schema.jobs.createdAt));
    return result;
  },
};

// Database operations for subscriptions
export const subscriptionDb = {
  // Create or update subscription
  async upsert(data: { orgId: string; dodoSubscriptionId: string; plan: string; status: string }) {
    const result = await db
      .insert(schema.subscriptions)
      .values({
        orgId: data.orgId,
        dodoSubscriptionId: data.dodoSubscriptionId,
        plan: data.plan,
        status: data.status,
      })
      .onConflictDoUpdate({
        target: schema.subscriptions.dodoSubscriptionId,
        set: {
          plan: data.plan,
          status: data.status,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  },

  // Get subscription by organization
  async getByOrgId(orgId: string) {
    const result = await db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.orgId, orgId))
      .limit(1);
    return result[0] || null;
  },
};

// Database operations for webhook events
export const webhookDb = {
  // Store webhook event
  async store(type: string, source: string, data: any) {
    const result = await db
      .insert(schema.webhookEvents)
      .values({
        type,
        source,
        data,
        processed: false,
      })
      .returning();
    return result[0];
  },

  // Mark webhook as processed
  async markProcessed(id: string) {
    const result = await db
      .update(schema.webhookEvents)
      .set({ 
        processed: true,
        processedAt: new Date()
      })
      .where(eq(schema.webhookEvents.id, id))
      .returning();
    return result[0];
  },
};