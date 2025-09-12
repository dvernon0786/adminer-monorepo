// Simplified database operations for testing
// This is a mock implementation for Phase 1 testing

const jobDb = {
  async create(data) {
    console.log('Creating job in database:', data);
    return {
      id: data.orgId + '-' + Date.now(),
      orgId: data.orgId,
      type: data.type,
      input: data.input,
      status: 'pending',
      createdAt: new Date()
    };
  },

  async updateStatus(jobId, status, output, error) {
    console.log('Updating job status:', { jobId, status, output, error });
    return {
      id: jobId,
      status: status,
      output: output,
      error: error,
      updatedAt: new Date()
    };
  }
};

const orgDb = {
  async getByClerkId(clerkOrgId) {
    console.log('Getting organization by Clerk ID:', clerkOrgId);
    // For now, return a mock organization for testing
    return {
      id: 'org-' + clerkOrgId,
      clerkOrgId: clerkOrgId,
      name: 'Test Organization',
      plan: 'free',
      quotaLimit: 100,
      quotaUsed: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },

  async getQuotaStatus(clerkOrgId) {
    console.log('Getting quota status for:', clerkOrgId);
    
    try {
      // Import the real database connection
      const { orgDb } = await import('./db.ts');
      
      // Get real quota status from database
      const quotaStatus = await orgDb.getQuotaStatus(clerkOrgId);
      
      if (quotaStatus) {
        console.log('Real quota status:', quotaStatus);
        return quotaStatus;
      }
      
      // Fallback to mock data if no organization found
      return {
        used: 0,
        limit: 100,
        percentage: 0,
        plan: 'free'
      };
    } catch (error) {
      console.error('Error fetching real quota status:', error);
      
      // Fallback to mock data if database query fails
      return {
        used: 0,
        limit: 100,
        percentage: 0,
        plan: 'free'
      };
    }
  },

  async consumeQuota(orgId, amount, type, description) {
    console.log('Consuming quota:', { orgId, amount, type, description });
    // Mock quota consumption - always succeeds for testing
    return {
      success: true,
      remaining: 1000 - amount
    };
  }
};

const analysisDb = {
  async getStats(orgId) {
    console.log('Getting analysis statistics for org:', orgId);
    
    try {
      // Import the real database connection
      const { db } = await import('./db.ts');
      const { jobs } = await import('../db/schema.js');
      const { eq } = await import('drizzle-orm');
      
      // Query real data from the jobs table
      const allJobs = await db.select().from(jobs).where(eq(jobs.orgId, orgId));
      
      // Calculate statistics from real data
      const stats = {
        total: allJobs.length,
        images: allJobs.filter(job => job.type === 'image' || job.input?.contentType === 'image').length,
        videos: allJobs.filter(job => job.type === 'video' || job.input?.contentType === 'video').length,
        text: allJobs.filter(job => job.type === 'text' || job.input?.contentType === 'text').length,
        errors: allJobs.filter(job => job.status === 'failed').length
      };
      
      console.log('Real analysis statistics:', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching real analysis statistics:', error);
      
      // Fallback to mock data if database query fails
      return {
        total: 12,
        images: 5,
        videos: 3,
        text: 4,
        errors: 0
      };
    }
  },

  async getAnalyses(orgId, limit = 50, offset = 0) {
    console.log('Getting analyses for org:', orgId, { limit, offset });
    
    // Mock analyses data for now
    return [
      {
        id: 'analysis-1',
        orgId: orgId,
        type: 'image',
        status: 'completed',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        summary: 'Image analysis completed'
      },
      {
        id: 'analysis-2', 
        orgId: orgId,
        type: 'video',
        status: 'pending',
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        summary: 'Video analysis in progress'
      }
    ];
  }
};

const webhookDb = {
  async store(type, source, data) {
    console.log('Storing webhook event:', { type, source, data });
    return {
      id: 'webhook-' + Date.now(),
      type,
      source,
      data,
      processed: false
    };
  }
};

module.exports = {
  jobDb,
  orgDb,
  analysisDb,
  webhookDb
};