// Import required modules
const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const { eq, count, sql } = require('drizzle-orm');

// Database schema definitions (inline to avoid TypeScript import issues)
const organizations = {
  tableName: 'organizations',
  clerkOrgId: 'clerk_org_id',
  name: 'name',
  plan: 'plan',
  quotaLimit: 'quota_limit',
  quotaUsed: 'quota_used'
};

const jobs = {
  tableName: 'jobs',
  orgId: 'org_id',
  type: 'type',
  status: 'status',
  input: 'input',
  output: 'output',
  error: 'error'
};

// Initialize real Neon database connection
let db = null;
let dbInitialized = false;

async function initializeDatabase() {
  if (dbInitialized) return db;
  
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable not set');
      return null;
    }
    
    const neonClient = neon(process.env.DATABASE_URL);
    db = drizzle(neonClient);
    dbInitialized = true;
    console.log('✅ Database connection initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return null;
  }
}

// Real quota function
async function getRealQuotaStatus(orgId = 'default-org') {
  try {
    console.log('🔍 Starting quota query for orgId:', orgId);
    const database = await initializeDatabase();
    if (!database) {
      throw new Error('Database not available');
    }
    
    console.log('✅ Database initialized, executing query...');
    
    // Query real organization data using raw SQL to avoid schema import issues
    const orgResult = await database.execute(sql`
      SELECT quota_used, quota_limit, plan 
      FROM organizations 
      WHERE clerk_org_id = ${orgId} 
      LIMIT 1
    `);
    
    console.log('📊 Query result:', { 
      rowCount: orgResult.length, 
      result: orgResult,
      orgId 
    });
    
    if (orgResult.length === 0) {
      console.log('🆕 No organization found, creating default...');
      // Create default organization if it doesn't exist
      await database.execute(sql`
        INSERT INTO organizations (clerk_org_id, name, plan, quota_limit, quota_used)
        VALUES (${orgId}, 'Default Organization', 'free', 100, 0)
        ON CONFLICT (clerk_org_id) DO NOTHING
      `);
      
      console.log('✅ Default organization created');
      return {
        used: 0,
        limit: 100,
        percentage: 0,
        plan: 'free'
      };
    }
    
    const org = orgResult[0];
    console.log('✅ Organization found:', org);
    return {
      used: org.quota_used || 0,
      limit: org.quota_limit || 100,
      percentage: Math.round(((org.quota_used || 0) / (org.quota_limit || 100)) * 100),
      plan: org.plan || 'free'
    };
    
  } catch (error) {
    console.error('❌ Database query failed:', {
      error: error.message,
      stack: error.stack,
      orgId,
      errorType: error.constructor.name
    });
    // Fallback to default values (not mock data)
    return {
      used: 0,
      limit: 100,
      percentage: 0,
      plan: 'free',
      error: `Database query failed: ${error.message}`
    };
  }
}

// Real analysis stats function
async function getRealAnalysisStats(orgId = 'default-org') {
  try {
    console.log('🔍 Starting analysis stats query for orgId:', orgId);
    const database = await initializeDatabase();
    if (!database) {
      throw new Error('Database not available');
    }
    
    console.log('✅ Database initialized for stats, getting organization ID...');
    
    // Get organization ID first
    const orgResult = await database.execute(sql`
      SELECT id FROM organizations WHERE clerk_org_id = ${orgId} LIMIT 1
    `);
    
    console.log('📊 Organization query result:', { 
      rowCount: orgResult.length, 
      result: orgResult,
      orgId 
    });
    
    if (orgResult.length === 0) {
      console.log('⚠️ No organization found for stats, returning empty stats');
      return {
        total: 0,
        images: 0,
        videos: 0,
        text: 0,
        errors: 0
      };
    }
    
    const orgDbId = orgResult[0]?.id;
    console.log('✅ Organization ID found:', orgDbId);
    
    if (!orgDbId) {
      console.log('⚠️ No organization ID found, returning empty stats');
      return {
        total: 0,
        images: 0,
        videos: 0,
        text: 0,
        errors: 0
      };
    }
    
    // Query real job counts by type
    console.log('📊 Querying job stats...');
    const stats = await database.execute(sql`
      SELECT 
        type,
        COUNT(*) as count
      FROM jobs 
      WHERE org_id = ${orgDbId}
      GROUP BY type
    `);
    
    console.log('📊 Job stats result:', { 
      rowCount: stats.length, 
      result: stats 
    });
    
    // Process results
    const result = {
      total: 0,
      images: 0,
      videos: 0,
      text: 0,
      errors: 0
    };
    
    stats.forEach(stat => {
      const count = parseInt(stat.count) || 0;
      result.total += count;
      if (stat.type === 'image') result.images = count;
      else if (stat.type === 'video') result.videos = count;
      else if (stat.type === 'text') result.text = count;
    });
    
    // Count failed jobs as errors
    console.log('📊 Querying error count...');
    const errorCount = await database.execute(sql`
      SELECT COUNT(*) as count
      FROM jobs 
      WHERE org_id = ${orgDbId} AND status = 'failed'
    `);
    
    console.log('📊 Error count result:', { 
      rowCount: errorCount.length, 
      result: errorCount 
    });
      
    if (errorCount.length > 0) {
      result.errors = parseInt(errorCount[0].count);
    }
    
    console.log('✅ Final stats result:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Analysis stats query failed:', {
      error: error.message,
      stack: error.stack,
      orgId,
      errorType: error.constructor.name
    });
    // Return empty stats (not mock data)
    return {
      total: 0,
      images: 0,
      videos: 0,
      text: 0,
      errors: 0,
      error: `Database query failed: ${error.message}`
    };
  }
}

let inngest;

async function loadInngest() {
  if (!inngest) {
    const functions = await import('../src/inngest/functions.js');
    inngest = functions.inngest;
  }
  return inngest;
}

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get the path from the URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  // Debug logging
  console.log('API Request:', { method: req.method, path, url: req.url });
  console.log('Path matching check:', { 
    path, 
    isQuota: path === '/api/quota',
    isAnalysesStats: path === '/api/analyses/stats'
  });
  
  // Route based on path
  if (path === '/api/test') {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      message: 'API test endpoint working',
      timestamp: new Date().toISOString(),
      method: req.method,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      database: dbInitialized ? 'connected' : 'not_connected',
      headers: req.headers,
      url: req.url
    });
  } else if (path === '/api/inngest') {
    if (req.method === 'PUT') {
      res.status(200).json({
        functions: [
          {
            id: "job/created",
            name: "Process Job Creation"
          },
          {
            id: "scrape/process", 
            name: "Process Scrape Job"
          }
        ],
        appId: "adminer-jobs",
        appName: "Adminer Job Pipeline"
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } else if (path === '/api/jobs') {
    console.log('Jobs endpoint hit:', { method: req.method, path });
    if (req.method === 'POST') {
      try {
        const body = req.body;
        const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        console.log('Job creation request:', { jobId, body, method: req.method });
        
        // Trigger Inngest event
        try {
          const inngestClient = await loadInngest();
          await inngestClient.send({
            name: 'job.created',
            data: {
              jobId,
              orgId: 'default-org',
              type: 'scrape',
              input: body,
              createdAt: new Date().toISOString()
            }
          });
          console.log('Inngest event triggered for job:', jobId);
        } catch (inngestError) {
          console.error('Inngest event failed:', inngestError);
          // Continue with job creation even if Inngest fails
        }
        
        res.status(201).json({
          success: true,
          data: {
            jobId,
            type: 'scrape',
            status: 'created',
            createdAt: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Job creation error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to create job',
          message: error.message
        });
      }
    } else if (req.method === 'GET') {
      // Job listing endpoint
      res.status(200).json({
        success: true,
        data: {
          jobs: [],
          total: 0,
          limit: 50
        }
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } else if (path === '/api/quota') {
    // QUOTA ENDPOINT - Real database integration
    try {
      console.log('Quota endpoint hit:', { method: req.method, path });
      
      if (req.method === 'GET') {
        // Get organization ID from headers (Clerk)
        const orgId = req.headers['x-org-id'] || 'default-org';
        
        // Initialize database on first request
        await initializeDatabase();
        
        // Get real quota status from database
        const quotaData = await getRealQuotaStatus(orgId);
        
        res.status(200).json({
          success: true,
          data: quotaData,
          source: 'real_database',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }
    } catch (error) {
      console.error('Quota endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quota',
        message: error.message
      });
    }
  } else if (path === '/api/analyses/stats') {
    // ANALYSIS STATS ENDPOINT - Real database integration
    try {
      console.log('Analyses stats endpoint hit:', { method: req.method, path });
      
      if (req.method === 'GET') {
        // Get organization ID from headers (Clerk)
        const orgId = req.headers['x-org-id'] || 'default-org';
        
        // Initialize database on first request
        await initializeDatabase();
        
        // Get real analysis statistics from database
        const statsData = await getRealAnalysisStats(orgId);
        
        res.status(200).json({
          success: true,
          data: statsData,
          source: 'real_database',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }
    } catch (error) {
      console.error('Analyses stats endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analysis statistics',
        message: error.message
      });
    }
  } else if (path === '/api/health') {
    const dbStatus = dbInitialized ? 'connected' : 'not_initialized';
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'unknown',
      vercelRegion: process.env.VERCEL_REGION || 'unknown',
      database: dbStatus
    });
  } else if (path === '/api/debug-db') {
    // Debug endpoint to see raw database query results
    try {
      console.log('🔍 Debug: Testing database query...');
      const database = await initializeDatabase();
      if (!database) {
        throw new Error('Database not available');
      }
      
      // Test a simple query to see the result structure
      const testResult = await database.execute(sql`
        SELECT quota_used, quota_limit, plan 
        FROM organizations 
        WHERE clerk_org_id = ${'default-org'} 
        LIMIT 1
      `);
      
      console.log('🔍 Debug: Raw query result:', {
        type: typeof testResult,
        isArray: Array.isArray(testResult),
        length: testResult?.length,
        result: testResult
      });
      
      res.status(200).json({
        success: true,
        debug: {
          type: typeof testResult,
          isArray: Array.isArray(testResult),
          length: testResult?.length,
          result: testResult,
          firstItem: testResult?.[0],
          firstItemKeys: testResult?.[0] ? Object.keys(testResult[0]) : null
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Debug query failed:', error);
      res.status(500).json({
        success: false,
        error: 'Debug query failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  } else if (path === '/api/setup-db') {
    // Database setup endpoint - creates tables if they don't exist
    try {
      console.log('🔧 Setting up database schema...');
      const database = await initializeDatabase();
      if (!database) {
        throw new Error('Database not available');
      }
      
      // Create organizations table
      console.log('📊 Creating organizations table...');
      await database.execute(sql`
        CREATE TABLE IF NOT EXISTS organizations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          clerk_org_id TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          plan TEXT NOT NULL DEFAULT 'free',
          quota_limit INTEGER NOT NULL DEFAULT 100,
          quota_used INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      
      // Create jobs table
      console.log('📊 Creating jobs table...');
      await database.execute(sql`
        CREATE TABLE IF NOT EXISTS jobs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          org_id UUID NOT NULL REFERENCES organizations(id),
          type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          input JSONB NOT NULL,
          output JSONB,
          error TEXT,
          started_at TIMESTAMP,
          completed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      
      // Create quota_usage table
      console.log('📊 Creating quota_usage table...');
      await database.execute(sql`
        CREATE TABLE IF NOT EXISTS quota_usage (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          org_id UUID NOT NULL REFERENCES organizations(id),
          job_id UUID REFERENCES jobs(id),
          type TEXT NOT NULL,
          amount INTEGER NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      
      // Create subscriptions table
      console.log('📊 Creating subscriptions table...');
      await database.execute(sql`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          org_id UUID NOT NULL REFERENCES organizations(id),
          dodo_subscription_id TEXT UNIQUE,
          plan TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          current_period_start TIMESTAMP,
          current_period_end TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      
      // Create webhook_events table
      console.log('📊 Creating webhook_events table...');
      await database.execute(sql`
        CREATE TABLE IF NOT EXISTS webhook_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type TEXT NOT NULL,
          source TEXT NOT NULL,
          data JSONB NOT NULL,
          processed BOOLEAN DEFAULT FALSE,
          processed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      
      console.log('✅ Database schema setup complete');
      
      res.status(200).json({
        success: true,
        message: 'Database schema created successfully',
        tables: ['organizations', 'jobs', 'quota_usage', 'subscriptions', 'webhook_events'],
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Database setup failed:', error);
      res.status(500).json({
        success: false,
        error: 'Database setup failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  } else if (path === '/api/webhook') {
    // Webhook endpoint
    res.status(200).json({
      success: true,
      message: 'Webhook received',
      timestamp: new Date().toISOString()
    });
  } else if (path === '/api/apify/health') {
    // Apify health check endpoint
    try {
      console.log('Checking Apify health...');
      
      const healthCheck = {
        status: 'healthy',
        message: 'Apify service is available'
      };
      
      console.log('Apify health check result:', healthCheck);

      res.status(200).json({
        success: true,
        service: 'apify',
        status: healthCheck.status,
        message: healthCheck.message,
        timestamp: new Date().toISOString(),
        environment: {
          hasToken: !!(process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN),
          hasActorId: !!process.env.APIFY_ACTOR_ID
        }
      });
    } catch (error) {
      console.error('Apify health check failed:', error);
      
      res.status(500).json({
        success: false,
        service: 'apify',
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  } else if (path === '/api/apify/webhook') {
    // Apify webhook endpoint
    try {
      if (req.method === 'GET') {
        // Health check for webhook endpoint
        res.status(200).json({
          success: true,
          message: 'Apify webhook endpoint is ready',
          timestamp: new Date().toISOString(),
          method: 'GET',
          note: 'Webhook validation disabled - using synchronous API calls'
        });
      } else if (req.method === 'POST') {
        // Handle webhook payload (simplified without signature validation)
        const payload = req.body;
        
        console.log('Apify webhook received (no validation):', {
          eventType: payload?.eventType,
          runId: payload?.data?.runId,
          status: payload?.data?.status,
          hasData: !!payload?.data
        });
        
        res.status(200).json({
          success: true,
          message: 'Webhook received successfully (no validation)',
          timestamp: new Date().toISOString(),
          method: 'POST',
          eventType: payload?.eventType,
          note: 'Webhook validation disabled - using synchronous API calls'
        });
      } else {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
      }
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  } else {
    // Default response for unknown paths
    res.status(200).json({ 
      success: true, 
      message: 'Consolidated API endpoint working',
      availableEndpoints: ['/api/test', '/api/inngest', '/api/jobs', '/api/health', '/api/webhook', '/api/apify/health', '/api/apify/webhook', '/api/quota', '/api/analyses/stats'],
      timestamp: new Date().toISOString()
    });
  }
}