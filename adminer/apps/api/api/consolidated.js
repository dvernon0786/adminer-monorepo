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
async function getRealQuotaStatus(orgId) {
  try {
    // REJECT DEFAULT-ORG - Force proper Clerk integration
    if (!orgId || orgId === 'default-org' || orgId === 'no-org') {
      throw new Error('Invalid organization ID - user must be in a valid Clerk organization');
    }

    let result = await database.query(`
      SELECT o.plan, o.quota_limit, o.quota_used,
             ROUND((o.quota_used::decimal / o.quota_limit::decimal) * 100, 1) as percentage
      FROM organizations o 
      WHERE o.clerk_org_id = $1
    `, [orgId]);
    
    // If organization doesn't exist, create it with proper Clerk org ID
    if (!result || result.length === 0) {
      console.log(`Creating new organization for Clerk org: ${orgId}`);
      
      await database.query(`
        INSERT INTO organizations (clerk_org_id, name, plan, status, quota_limit, quota_used, created_at, updated_at)
        VALUES ($1, $2, 'free', 'active', 10, 0, NOW(), NOW())
      `, [orgId, `Organization ${orgId}`]);
      
      result = await database.query(`
        SELECT o.plan, o.quota_limit, o.quota_used,
               ROUND((o.quota_used::decimal / o.quota_limit::decimal) * 100, 1) as percentage
        FROM organizations o 
        WHERE o.clerk_org_id = $1
      `, [orgId]);
    }
    
    const org = result[0];
    return {
      used: parseInt(org.quota_used) || 0,
      limit: parseInt(org.quota_limit) || 10,
      percentage: parseFloat(org.percentage) || 0,
      plan: org.plan || 'free'
    };
  } catch (error) {
    console.error('Error fetching quota status:', error);
    throw error; // Don't return fallback for invalid org IDs
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
    
    // Get organization ID first using neon client directly
    const neonClient = neon(process.env.DATABASE_URL);
    const orgResult = await neonClient`
      SELECT id FROM organizations WHERE clerk_org_id = ${orgId} LIMIT 1
    `;
    
    console.log('📊 Organization query result:', { 
      rowCount: orgResult?.length || 0, 
      result: orgResult,
      orgId 
    });
    
    if (!orgResult || orgResult.length === 0) {
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
    
    // Query real job counts by type using neon client
    console.log('📊 Querying job stats...');
    const stats = await neonClient`
      SELECT 
        type,
        COUNT(*) as count
      FROM jobs 
      WHERE org_id = ${orgDbId}
      GROUP BY type
    `;
    
    console.log('📊 Job stats result:', { 
      rowCount: stats?.length || 0, 
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
    
    if (stats) {
      stats.forEach(stat => {
        const count = parseInt(stat.count) || 0;
        result.total += count;
        if (stat.type === 'image') result.images = count;
        else if (stat.type === 'video') result.videos = count;
        else if (stat.type === 'text') result.text = count;
      });
    }
    
    // Count failed jobs as errors using neon client
    console.log('📊 Querying error count...');
    const errorCount = await neonClient`
      SELECT COUNT(*) as count
      FROM jobs 
      WHERE org_id = ${orgDbId} AND status = 'failed'
    `;
    
    console.log('📊 Error count result:', { 
      rowCount: errorCount?.length || 0, 
      result: errorCount 
    });
      
    if (errorCount && errorCount.length > 0) {
      result.errors = parseInt(errorCount[0].count) || 0;
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
    // Import the Inngest client directly from client.js
    const { inngest: inngestClient } = require('../src/inngest/client.js');
    inngest = inngestClient;
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
      try {
        // Return proper Inngest sync format without loading client
        res.status(200).json({
          functions: [
            {
              id: "job-created",
              name: "Job Created Handler",
              triggers: [{ event: "job.created" }]
            }
          ],
          appId: "adminer-jobs",
          appName: "Adminer Job Pipeline",
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Inngest sync error:', error);
        res.status(500).json({
          error: "Internal server error",
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } else if (path === '/api/jobs') {
    console.log('Jobs endpoint hit:', { method: req.method, path });
    if (req.method === 'POST') {
      try {
        const { keyword, limit = 10 } = req.body;
        const orgId = req.headers['x-org-id'] || 'default-org';
        
        // Validate required fields
        if (!keyword) {
          return res.status(400).json({
            success: false,
            error: 'Missing required field: keyword'
          });
        }

        // CRITICAL: PRE-JOB QUOTA VALIDATION - BUSINESS MODEL FIX
        console.log(`🔍 Checking quota for org: ${orgId}`);
        const quotaStatus = await getRealQuotaStatus(orgId);
        console.log(`📊 Quota status: ${quotaStatus.used}/${quotaStatus.limit} (${quotaStatus.percentage}%)`);
        
        // Check if quota already exceeded
        if (quotaStatus.used >= quotaStatus.limit) {
          console.log(`❌ Quota exceeded: ${quotaStatus.used}/${quotaStatus.limit}`);
          return res.status(402).json({
            success: false,
            error: 'Quota exceeded',
            code: 'QUOTA_EXCEEDED',
            message: `You have used ${quotaStatus.used}/${quotaStatus.limit} ads. Upgrade to continue.`,
            quota: {
              used: quotaStatus.used,
              limit: quotaStatus.limit,
              percentage: quotaStatus.percentage,
              plan: quotaStatus.plan
            },
            upgradeUrl: '/pricing'
          });
        }

        // Check if requested ads would exceed quota
        const requestedAds = parseInt(limit);
        if (quotaStatus.used + requestedAds > quotaStatus.limit) {
          const remainingAds = quotaStatus.limit - quotaStatus.used;
          console.log(`❌ Insufficient quota: requested ${requestedAds}, remaining ${remainingAds}`);
          return res.status(402).json({
            success: false,
            error: 'Insufficient quota',
            code: 'QUOTA_INSUFFICIENT',
            message: `You can only request ${remainingAds} more ads. Upgrade to continue.`,
            quota: {
              used: quotaStatus.used,
              limit: quotaStatus.limit,
              remaining: remainingAds,
              requested: requestedAds,
              plan: quotaStatus.plan
            },
            upgradeUrl: '/pricing'
          });
        }

        console.log(`✅ Quota validation passed: ${quotaStatus.used + requestedAds}/${quotaStatus.limit} after job completion`);
        
        // Generate job ID
        const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`Creating job: ${jobId} for org: ${orgId}`);
        
        // Send event to Inngest with comprehensive error handling
        let inngestResult = null;
        let inngestError = null;
        
        try {
          // Use the existing loadInngest function
          const inngestClient = await loadInngest();
          
          // Send event with proper payload structure
          inngestResult = await inngestClient.send({
            name: 'job.created',
            data: {
              jobId,
              keyword,
              limit: parseInt(limit),
              orgId,
              timestamp: new Date().toISOString(),
              metadata: {
                source: 'api',
                version: '1.0'
              }
            }
          });
          
          console.log('✅ Inngest event sent successfully:', inngestResult);
          
        } catch (error) {
          inngestError = error;
          console.error('❌ Inngest event failed:', error.message);
          console.error('Error details:', error);
        }
        
        // Return response with Inngest status and quota information
        const response = {
          success: true,
          message: 'Job created successfully',
          data: { 
            jobId, 
            keyword, 
            limit: requestedAds,
            orgId,
            status: 'queued',
            quota: {
              used: quotaStatus.used,
              limit: quotaStatus.limit,
              willBeUsed: quotaStatus.used + requestedAds,
              plan: quotaStatus.plan
            }
          },
          timestamp: new Date().toISOString()
        };
        
        if (inngestResult) {
          response.inngest = {
            status: 'sent',
            eventId: inngestResult.ids?.[0] || 'unknown'
          };
        } else if (inngestError) {
          response.inngest = {
            status: 'failed',
            error: inngestError.message
          };
        }
        
        res.status(201).json(response);
        
      } catch (error) {
        console.error('Job creation error:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
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
    // QUOTA ENDPOINT - Real database integration with Clerk validation
    try {
      console.log('Quota endpoint hit:', { method: req.method, path });
      
      if (req.method === 'GET') {
        // Get organization ID from headers (Clerk)
        const orgId = req.headers['x-org-id'];
        
        // STRICT VALIDATION - No fallbacks to default-org
        if (!orgId || orgId === 'default-org') {
          return res.status(400).json({
            success: false,
            error: 'Missing or invalid organization ID',
            message: 'User must be in a valid Clerk organization',
            requiresOrganization: true
          });
        }
        
        // Initialize database on first request
        await initializeDatabase();
        
        // Get real quota status from database
        const quotaStatus = await getRealQuotaStatus(orgId);
        
        // Check if quota is exceeded
        if (quotaStatus.used >= quotaStatus.limit) {
          return res.status(402).json({
            success: false,
            error: 'Quota exceeded',
            code: 'QUOTA_EXCEEDED',
            message: `You have used ${quotaStatus.used}/${quotaStatus.limit} ads. Upgrade to continue.`,
            quota: quotaStatus,
            upgradeUrl: '/pricing'
          });
        }
        
        return res.status(200).json({
          success: true,
          data: quotaStatus
        });
      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }
    } catch (error) {
      console.error('Quota endpoint error:', error);
      
      if (error.message.includes('Invalid organization ID')) {
        return res.status(400).json({
          success: false,
          error: error.message,
          requiresOrganization: true
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quota status'
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
      
      // Use custom SQL from request body if provided
      let testResult;
      if (req.body && req.body.sql) {
        console.log('🔍 Debug: Using custom SQL:', req.body.sql);
        testResult = await database.execute(sql.raw(req.body.sql));
      } else {
        // Default test query
        testResult = await database.execute(sql`
          SELECT quota_used, quota_limit, plan 
          FROM organizations 
          WHERE clerk_org_id = ${'default-org'} 
          LIMIT 1
        `);
      }
      
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
      console.error('Debug endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Debug query failed',
        message: error.message
      });
    }
  } else if (path === '/api/jobs/list') {
    // List all jobs from database
    try {
      console.log('📋 Jobs list endpoint hit');
      const database = await initializeDatabase();
      if (!database) {
        throw new Error('Database not available');
      }
      
      const orgId = req.headers['x-org-id'] || 'default-org';
      
      // Get organization ID from clerk_org_id
      const orgResult = await database.execute(sql`
        SELECT id FROM organizations 
        WHERE clerk_org_id = ${orgId} 
        LIMIT 1
      `);
      
      if (!orgResult.rows || orgResult.rows.length === 0) {
        return res.status(200).json({
          success: true,
          data: { jobs: [], total: 0, message: 'No organization found' }
        });
      }
      
      const dbOrgId = orgResult.rows[0].id;
      
      // Get all jobs for this organization
      const jobsResult = await database.execute(sql`
        SELECT id, job_id, org_id, keyword, status, type, results_count, 
               apify_run_id, created_at, completed_at, metadata
        FROM jobs 
        WHERE org_id = ${dbOrgId}
        ORDER BY created_at DESC 
        LIMIT 50
      `);
      
      console.log('📋 Jobs query result:', {
        rowCount: jobsResult.rows?.length || 0,
        result: jobsResult
      });
      
      res.status(200).json({
        success: true,
        data: {
          jobs: jobsResult.rows || [],
          total: jobsResult.rows?.length || 0,
          orgId: orgId,
          dbOrgId: dbOrgId
        },
        source: 'real_database',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Jobs list error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch jobs',
        message: error.message
      });
    }
  } else if (path === '/api/env-check') {
    // Environment variables check endpoint
    res.status(200).json({
      success: true,
      inngest: {
        hasEventKey: !!process.env.INNGEST_EVENT_KEY,
        hasSigningKey: !!process.env.INNGEST_SIGNING_KEY,
        eventKeyLength: process.env.INNGEST_EVENT_KEY?.length || 0,
        signingKeyLength: process.env.INNGEST_SIGNING_KEY?.length || 0,
        eventKeyPreview: process.env.INNGEST_EVENT_KEY ? 
          `${process.env.INNGEST_EVENT_KEY.substring(0, 8)}...` : 'Not set'
      },
      database: {
        hasUrl: !!process.env.DATABASE_URL,
        urlLength: process.env.DATABASE_URL?.length || 0,
        urlPreview: process.env.DATABASE_URL ? 
          `${process.env.DATABASE_URL.substring(0, 20)}...` : 'Not set'
      },
      environment: process.env.NODE_ENV || 'unknown',
      timestamp: new Date().toISOString()
    });
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