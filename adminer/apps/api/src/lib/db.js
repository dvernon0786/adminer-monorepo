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
  async consumeQuota(orgId, amount, type, description) {
    console.log('Consuming quota:', { orgId, amount, type, description });
    // Mock quota consumption - always succeeds for testing
    return {
      success: true,
      remaining: 1000 - amount
    };
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
  webhookDb
};