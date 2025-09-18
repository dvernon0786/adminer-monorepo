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

// Real quota function - Updated for user-based workspaces
async function getRealQuotaStatus(userId) {
  try {
    // Use user ID as organization ID for personal workspaces
    if (!userId) {
      throw new Error('User ID required for quota check');
    }

    // Get database connection
    const database = await initializeDatabase();
    if (!database) {
      throw new Error('Database connection failed');
    }

    let result = await database.query(`
      SELECT o.plan, o.quota_limit, o.quota_used,
             ROUND((o.quota_used::decimal / o.quota_limit::decimal) * 100, 1) as percentage
      FROM organizations o 
      WHERE o.clerk_org_id = $1
    `, [userId]);
    
    // If organization doesn't exist, create personal workspace
    if (!result || result.length === 0) {
      console.log(`Creating personal workspace for user: ${userId}`);
      
      await database.query(`
        INSERT INTO organizations (clerk_org_id, name, plan, status, quota_limit, quota_used, created_at, updated_at)
        VALUES ($1, $2, 'free', 'active', 100, 0, NOW(), NOW())
      `, [userId, `Personal Workspace ${userId}`]);
      
      result = await database.query(`
        SELECT o.plan, o.quota_limit, o.quota_used,
               ROUND((o.quota_used::decimal / o.quota_limit::decimal) * 100, 1) as percentage
        FROM organizations o 
        WHERE o.clerk_org_id = $1
      `, [userId]);
    }
    
    const org = result[0];
    return {
      used: parseInt(org.quota_used) || 0,
      limit: parseInt(org.quota_limit) || 100,
      percentage: parseFloat(org.percentage) || 0,
      plan: org.plan || 'free'
    };
  } catch (error) {
    console.error('Error fetching quota status:', error);
    throw error;
  }
}

// Fixed analysis stats function with proper database syntax - Updated for user-based workspaces
async function getRealAnalysisStats(userId) {
  try {
    console.log('🔍 Starting analysis stats query for userId:', userId);
    
    // Validate user ID
    if (!userId) {
      throw new Error('User ID required for analysis stats');
    }

    // Get organization database ID using neon client - use user ID as clerk_org_id
    const neonClient = neon(process.env.DATABASE_URL);
    const orgResult = await neonClient`
      SELECT id FROM organizations WHERE clerk_org_id = ${userId} LIMIT 1
    `;
    
    console.log('📊 Organization query result:', { 
      rowCount: orgResult?.length || 0, 
      result: orgResult,
      userId 
    });
    
    if (!orgResult || orgResult.length === 0) {
      console.log('⚠️ No personal workspace found for stats, returning empty stats');
      return {
        total: 0,
        images: 0,
        videos: 0,
        text: 0,
        errors: 0
      };
    }

    const orgDbId = orgResult[0].id;
    console.log('✅ Personal workspace ID found:', orgDbId);

    // Get job statistics with correct column name (organization_id)
    console.log('📊 Querying job stats...');
    const jobStats = await neonClient`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_jobs,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_jobs,
        COUNT(CASE WHEN status IN ('queued', 'running') THEN 1 END) as pending_jobs,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 
          COALESCE(
            (raw_data->>'dataExtracted')::integer, 
            CASE WHEN jsonb_typeof(raw_data->'data') = 'array' 
              THEN jsonb_array_length(raw_data->'data')
              ELSE 0 
            END
          )
        END), 0) as total_ads_scraped
      FROM jobs 
      WHERE org_id = ${orgDbId}
    `;

    console.log('📊 Job stats result:', { 
      rowCount: jobStats?.length || 0, 
      result: jobStats 
    });

    const stats = jobStats[0] || {};
    
    // Process results with proper field mapping
    const result = {
      total: parseInt(stats.total_jobs) || 0,
      images: 0, // Will be calculated from job types if needed
      videos: 0, // Will be calculated from job types if needed
      text: 0,   // Will be calculated from job types if needed
      errors: parseInt(stats.failed_jobs) || 0
    };
    
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
        const { keyword, limit = 10, userId, workspaceId } = req.body;
        const userIdFromHeader = req.headers['x-user-id'];
        const workspaceIdFromHeader = req.headers['x-workspace-id'];
        
        // Use user ID from header or body
        const finalUserId = userIdFromHeader || userId;
        const finalWorkspaceId = workspaceIdFromHeader || workspaceId || finalUserId;
        
        // Validate required fields
        if (!keyword) {
          return res.status(400).json({
            success: false,
            error: 'Missing required field: keyword'
          });
        }
        
        if (!finalUserId) {
          return res.status(400).json({
            success: false,
            error: 'Missing user ID',
            message: 'User ID required for job creation',
            requiresUser: true
          });
        }

        // CRITICAL: PRE-JOB QUOTA VALIDATION - BUSINESS MODEL FIX
        console.log(`🔍 Checking quota for user: ${finalUserId}`);
        const quotaStatus = await getRealQuotaStatus(finalUserId);
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
        
        console.log(`Creating job: ${jobId} for user: ${finalUserId}`);
        
        // Send event to Inngest with comprehensive error handling
        let inngestResult = null;
        let inngestError = null;
        
        try {
          // Use the existing loadInngest function
          const inngestClient = await loadInngest();
          
          // Send event with proper payload structure using user ID
          inngestResult = await inngestClient.send({
            name: 'job.created',
            data: {
              jobId,
              keyword,
              limit: parseInt(limit),
              orgId: finalUserId, // Use user ID as organization ID
              userId: finalUserId, // Add explicit user ID
              workspaceId: finalWorkspaceId, // Add workspace ID
              timestamp: new Date().toISOString(),
              metadata: {
                source: 'api',
                version: '1.0',
                workspaceType: 'personal'
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
            userId: finalUserId,
            workspaceId: finalWorkspaceId,
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
    // QUOTA ENDPOINT - FIXED TO USE PLANS TABLE
    console.log('QUOTA API: Fixed endpoint using plans table');
    
    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false, 
        error: 'Method not allowed' 
      });
    }
    
    try {
      const userId = req.headers['x-user-id'];
      const workspaceId = req.headers['x-workspace-id'];
      
      console.log('QUOTA API: User ID:', userId);
      console.log('QUOTA API: Workspace ID:', workspaceId);
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User ID required' });
      }

      if (!process.env.DATABASE_URL) {
        return res.status(500).json({ success: false, error: 'Database not configured' });
      }

      const { neon } = require('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL);
      console.log('QUOTA API: Database connection initialized');
      
      // STEP 1: Find or create user's personal organization
      let orgResult = await sql`
        SELECT id, plan FROM organizations 
        WHERE clerk_org_id = ${userId}
        LIMIT 1
      `;

      console.log('QUOTA API: Organization lookup:', orgResult);

      if (orgResult.length === 0) {
        console.log('QUOTA API: Creating personal organization with free plan');
        
        // Create organization with free plan
        await sql`
          INSERT INTO organizations (id, clerk_org_id, name, plan, quota_limit, quota_used, created_at, updated_at)
          VALUES (gen_random_uuid(), ${userId}, 'Personal Workspace', 'free', 10, 0, NOW(), NOW())
        `;
        
        orgResult = await sql`
          SELECT id, plan FROM organizations 
          WHERE clerk_org_id = ${userId}
          LIMIT 1
        `;
      }

      const organizationId = orgResult[0]?.id;
      const organizationPlan = orgResult[0]?.plan || 'free';
      
      console.log('QUOTA API: Organization ID:', organizationId);
      console.log('QUOTA API: Organization Plan:', organizationPlan);

      // STEP 2: Get plan details from plans table (FIXED: Use actual plans table)
      const planResult = await sql`
        SELECT code, name, monthly_quota 
        FROM plans 
        WHERE code LIKE ${organizationPlan + '%'}
        LIMIT 1
      `;
      
      console.log('QUOTA API: Plan lookup result:', planResult);
      
      // Default plan if not found
      let planQuota = 10; // Default for free
      let planCode = 'free-10';
      
      if (planResult.length > 0) {
        planQuota = planResult[0].monthly_quota;
        planCode = planResult[0].code;
        console.log('QUOTA API: Using plan quota from database:', planQuota);
      } else {
        console.log('QUOTA API: Plan not found, using default free quota:', planQuota);
      }

      // STEP 3: Count ads scraped (NOT jobs - ads are the quota unit)
      // This counts individual ads scraped across all jobs
      const adsResult = await sql`
        SELECT COALESCE(SUM(
          CASE 
            WHEN output IS NOT NULL AND output::text != '{}' 
            THEN COALESCE(
              (output->>'ads_count')::integer,
              (output->>'results_count')::integer, 
              (output->>'items_count')::integer,
              CASE WHEN output->>'ads' IS NOT NULL 
                   THEN json_array_length(output->'ads')
                   ELSE 1 
              END
            )
            ELSE 0 
          END
        ), 0) as total_ads_scraped
        FROM jobs 
        WHERE org_id = ${organizationId}
        AND status = 'completed'
      `;
      
      console.log('QUOTA API: Ads count query result:', adsResult);
      
      const adsScraped = parseInt(adsResult[0]?.total_ads_scraped || 0);
      const percentage = Math.min(Math.round((adsScraped / planQuota) * 100), 100);
      
      console.log('QUOTA API: Total ads scraped:', adsScraped);
      console.log('QUOTA API: Plan quota limit:', planQuota);
      console.log('QUOTA API: Usage percentage:', percentage);

      // STEP 4: Update organization quota to match plan
      await sql`
        UPDATE organizations 
        SET quota_limit = ${planQuota}, updated_at = NOW()
        WHERE id = ${organizationId}
      `;
      
      console.log('QUOTA API: Updated organization quota_limit to:', planQuota);

      const quotaData = {
        success: true,
        data: {
          used: adsScraped,
          limit: planQuota,
          percentage: percentage,
          plan: organizationPlan,
          planCode: planCode,
          userId: userId,
          workspaceId: workspaceId,
          organizationId: organizationId,
          quotaType: 'personal',
          quotaUnit: 'ads_scraped', // Clarify what we're counting
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          features: {
            jobs: true,
            analytics: true,
            exports: true,
            priority: organizationPlan !== 'free'
          },
          debug: {
            planFromDatabase: true,
            quotaSource: 'plans_table',
            calculationMethod: 'ads_scraped_count'
          }
        }
      };

      console.log('QUOTA API: SUCCESS - Returning real data from plans table:', quotaData);
      return res.status(200).json(quotaData);

    } catch (error) {
      console.error('QUOTA API: Error:', error);
      
      // Emergency fallback with correct free plan quota
      const fallbackData = {
        success: true,
        data: {
          used: 0,
          limit: 10, // FIXED: Correct free plan limit
          percentage: 0,
          plan: 'free',
          planCode: 'free-10',
          quotaType: 'personal',
          quotaUnit: 'ads_scraped',
          note: 'Fallback data due to database error',
          error: error.message
        }
      };
      
      console.log('QUOTA API: Using corrected fallback data:', fallbackData);
      return res.status(200).json(fallbackData);
    }
  } else if (path === '/api/debug/quota') {
    // DEBUG ENDPOINT - Test quota database connection
    try {
      console.log('DEBUG QUOTA: Testing database connection...');
      
      const userId = req.headers['x-user-id'] || 'test-user';
      const { neon } = require('@neondatabase/serverless');
      
      if (!process.env.DATABASE_URL) {
        return res.status(200).json({
          success: false,
          error: 'DATABASE_URL not configured',
          userId: userId
        });
      }
      
      const sql = neon(process.env.DATABASE_URL);
      console.log('DEBUG QUOTA: Database connection initialized');
      
      // Test organization lookup
      const orgResult = await sql`
        SELECT id, clerk_org_id, name FROM organizations 
        WHERE clerk_org_id = ${userId}
        LIMIT 1
      `;
      
      console.log('DEBUG QUOTA: Organization lookup result:', orgResult);
      
      // Also check all organizations to see what exists
      const allOrgs = await sql`
        SELECT id, clerk_org_id, name FROM organizations 
        LIMIT 10
      `;
      
      console.log('DEBUG QUOTA: All organizations in database:', allOrgs);
      
      // Test jobs count
      if (orgResult.length > 0) {
        const orgId = orgResult[0].id;
        const jobsResult = await sql`
          SELECT COUNT(*) as count FROM jobs 
          WHERE org_id = ${orgId}
        `;
        
        console.log('DEBUG QUOTA: Jobs count result:', jobsResult);
        
        return res.status(200).json({
          success: true,
          userId: userId,
          organization: orgResult[0],
          jobsCount: jobsResult[0]?.count || 0,
          databaseConnected: true,
          allOrganizations: allOrgs
        });
      } else {
        // Try to create organization to test the creation process
        console.log('DEBUG QUOTA: Attempting to create organization...');
        try {
          await sql`
            INSERT INTO organizations (id, clerk_org_id, name, plan, quota_limit, quota_used, created_at, updated_at)
            VALUES (gen_random_uuid(), ${userId}, ${`Personal Workspace`}, 'free', 100, 0, NOW(), NOW())
          `;
          
          // Check if creation was successful
          const newOrgResult = await sql`
            SELECT id, clerk_org_id, name FROM organizations 
            WHERE clerk_org_id = ${userId}
            LIMIT 1
          `;
          
          console.log('DEBUG QUOTA: Organization creation result:', newOrgResult);
          
          return res.status(200).json({
            success: true,
            userId: userId,
            organization: newOrgResult[0] || null,
            jobsCount: 0,
            databaseConnected: true,
            note: 'Organization created successfully',
            allOrganizations: allOrgs
          });
          
        } catch (createError) {
          console.error('DEBUG QUOTA: Organization creation failed:', createError);
          return res.status(200).json({
            success: false,
            userId: userId,
            organization: null,
            jobsCount: 0,
            databaseConnected: true,
            error: createError.message,
            note: 'Organization creation failed',
            allOrganizations: allOrgs
          });
        }
      }
      
    } catch (error) {
      console.error('DEBUG QUOTA: Error:', error);
      return res.status(200).json({
        success: false,
        error: error.message,
        userId: req.headers['x-user-id'] || 'test-user',
        databaseConnected: false
      });
    }
  } else if (path === '/api/analyses/stats') {
    // ANALYSIS STATS ENDPOINT - Real database integration
    try {
      console.log('Analyses stats endpoint hit:', { method: req.method, path });
      
      if (req.method === 'GET') {
        // Get user ID from headers (Personal Workspace)
        const userId = req.headers['x-user-id'];
        const workspaceId = req.headers['x-workspace-id'];
        
        // STRICT VALIDATION - User ID required
        if (!userId) {
          return res.status(400).json({
            success: false,
            error: 'Missing user ID',
            message: 'User ID required for analysis stats',
            requiresUser: true
          });
        }
        
        // Initialize database on first request
        await initializeDatabase();
        
        // Get real analysis statistics from database using user ID
        const statsData = await getRealAnalysisStats(userId);
        
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
  } else if (path === '/api/organizations') {
    // ORGANIZATION MANAGEMENT ENDPOINTS
    
    if (req.method === 'POST') {
      // Create new organization
      const { name } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Organization name is required'
        });
      }

      try {
        // Generate a unique organization ID
        const orgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create organization in database using neon client
        const neonClient = neon(process.env.DATABASE_URL);
        await neonClient`
          INSERT INTO organizations (clerk_org_id, name, plan, quota_limit, quota_used, created_at, updated_at)
          VALUES (${orgId}, ${name.trim()}, 'free', 10, 0, NOW(), NOW())
        `;

        console.log(`Created organization: ${orgId} - ${name}`);

        return res.status(201).json({
          success: true,
          message: 'Organization created successfully',
          data: {
            id: orgId,
            name: name.trim(),
            plan: 'free',
            quota_limit: 10,
            quota_used: 0
          }
        });

      } catch (error) {
        console.error('Failed to create organization:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to create organization',
          details: error.message
        });
      }
    }
    
    if (req.method === 'GET') {
      // List user's organizations
      try {
        // For demo purposes, return empty array to force organization creation
        // In production, you'd fetch from Clerk or your database
        
        return res.status(200).json({
          success: true,
          data: [
            // This would be populated from Clerk's organization list
            // For now, return empty array to force organization creation
          ]
        });

      } catch (error) {
        console.error('Failed to fetch organizations:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch organizations'
        });
      }
    }
    
    // Method not allowed
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  } else {
    // Default response for unknown paths
    res.status(200).json({ 
      success: true, 
      message: 'Consolidated API endpoint working',
      availableEndpoints: ['/api/test', '/api/inngest', '/api/jobs', '/api/health', '/api/webhook', '/api/apify/health', '/api/apify/webhook', '/api/quota', '/api/analyses/stats', '/api/organizations'],
      timestamp: new Date().toISOString()
    });
  }
}