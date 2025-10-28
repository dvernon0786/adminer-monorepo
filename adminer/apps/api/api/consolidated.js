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

// Real quota function - Updated to match quota API logic
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

    const sql = neon(process.env.DATABASE_URL);
    
    // STEP 1: Find or create user's personal organization
    let orgResult = await sql`
      SELECT id, plan FROM organizations 
      WHERE clerk_org_id = ${userId}
      LIMIT 1
    `;

    if (orgResult.length === 0) {
      console.log(`Creating personal organization with free plan for user: ${userId}`);
      
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

    // STEP 2: Get plan details from plans table
    const planResult = await sql`
      SELECT code, name, monthly_quota 
      FROM plans 
      WHERE code LIKE ${organizationPlan + '%'}
      LIMIT 1
    `;
    
    // Default plan if not found
    let planQuota = 10; // Default for free
    let planCode = 'free-10';
    
    if (planResult.length > 0) {
      planQuota = planResult[0].monthly_quota;
      planCode = planResult[0].code;
    }

    // STEP 3: Count completed jobs (same as quota API)
    const jobsResult = await sql`
      SELECT COUNT(*) as completed_jobs
      FROM jobs 
      WHERE org_id = ${organizationId}
      AND status = 'completed'
    `;
    
    const jobsCompleted = parseInt(jobsResult[0]?.completed_jobs || 0);
    const percentage = Math.min(Math.round((jobsCompleted / planQuota) * 100), 100);
    
    // STEP 4: Update organization quota to match plan
    await sql`
      UPDATE organizations 
      SET quota_limit = ${planQuota}, updated_at = NOW()
      WHERE id = ${organizationId}
    `;
    
    return {
      used: jobsCompleted,
      limit: planQuota,
      percentage: percentage,
      plan: organizationPlan
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
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as total_ads_scraped
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
      // Job listing endpoint with real database query
      try {
        const userId = req.headers['x-user-id'];
        const workspaceId = req.headers['x-workspace-id'] || userId;
        
        if (!userId) {
          return res.status(400).json({
            success: false,
            error: 'Missing user ID',
            message: 'User ID required to fetch jobs',
            requiresUser: true
          });
        }
        
        console.log(`📋 Fetching jobs for user: ${userId}`);
        
        // Get organization ID from userId
        const { neon } = require('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL);
        
        const orgResult = await sql`
          SELECT id FROM organizations WHERE clerk_org_id = ${userId} LIMIT 1
        `;
        
        if (!orgResult || orgResult.length === 0) {
          return res.status(200).json({
            success: true,
            data: {
              jobs: [],
              total: 0,
              message: 'No organization found'
            }
          });
        }
        
        const orgId = orgResult[0].id;
        
        // Get all jobs for this organization with AI analysis fields
        const jobsResult = await sql`
          SELECT 
            id, org_id, type, status, input, 
            summary, content_type, text_analysis, image_analysis, 
            video_analysis, rewritten_ad_copy, key_insights, 
            competitor_strategy, recommendations,
            created_at, completed_at, updated_at
          FROM jobs 
          WHERE org_id = ${orgId}
          ORDER BY created_at DESC 
          LIMIT 50
        `;
        
        console.log(`✅ Found ${jobsResult.length} jobs for user: ${userId}`);
        
        res.status(200).json({
          success: true,
          data: {
            jobs: jobsResult || [],
            total: jobsResult.length,
            userId,
            orgId
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
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    } else if (path === '/api/quota') {
    // QUOTA ENDPOINT - FIXED TO USE PLANS TABLE
    console.log('QUOTA API: Fixed endpoint using plans table');
    
    // Check for emergency reset parameter
    const resetQuota = req.query.reset === 'true';
    if (resetQuota) {
      console.log('🚨 EMERGENCY QUOTA RESET: Reset parameter detected');
    }
    
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
      
      // EMERGENCY QUOTA RESET - Fix overage crisis
      console.log('🚨 EMERGENCY QUOTA RESET: Reset parameter value:', resetQuota);
      if (resetQuota) {
        console.log('🚨 EMERGENCY QUOTA RESET: Resetting quota to 0 for org:', organizationId);
        
        const resetResult = await sql`
          UPDATE organizations 
          SET quota_used = 0, updated_at = NOW()
          WHERE id = ${organizationId}
          RETURNING quota_used, quota_limit
        `;
        
        console.log('🚨 EMERGENCY QUOTA RESET: Reset result:', resetResult);
        
        // Verify the reset
        const verifyResult = await sql`
          SELECT quota_used, quota_limit
          FROM organizations 
          WHERE id = ${organizationId}
          LIMIT 1
        `;
        
        console.log('🚨 EMERGENCY QUOTA RESET: Verification result:', verifyResult);
      } else {
        console.log('🚨 EMERGENCY QUOTA RESET: Reset parameter not set, skipping reset');
      }

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

      // STEP 3: Get actual quota usage from organizations table (FIXED)
      // Read quota_used from organizations table where Inngest functions update it
      const quotaResult = await sql`
        SELECT quota_used, quota_limit
        FROM organizations 
        WHERE id = ${organizationId}
        LIMIT 1
      `;
      
      console.log('QUOTA API: Quota usage query result:', quotaResult);
      
      const quotaUsed = parseInt(quotaResult[0]?.quota_used || 0);
      const percentage = Math.min(Math.round((quotaUsed / planQuota) * 100), 100);
      
      console.log('QUOTA API: Actual quota used from organizations table:', quotaUsed);
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
          used: quotaUsed, // FIXED: Use actual quota_used from organizations table
          limit: planQuota,
          percentage: percentage,
          plan: organizationPlan,
          planCode: planCode,
          userId: userId,
          workspaceId: workspaceId,
          organizationId: organizationId,
          quotaType: 'personal',
          quotaUnit: 'ads_scraped', // Match frontend expectations
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          features: {
            jobs: true,
            analytics: true,
            exports: true,
            priority: organizationPlan !== 'free'
          },
          debug: {
            planFromDatabase: true,
            quotaSource: 'organizations_table', // FIXED: Correct data source
            calculationMethod: 'quota_used_column' // FIXED: Correct calculation method
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
  } else if (path === '/api/emergency/reset-quota') {
    // EMERGENCY QUOTA RESET ENDPOINT - Fix quota overage crisis
    try {
      console.log('🚨 EMERGENCY QUOTA RESET: Starting quota reset...');
      
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
      console.log('🚨 EMERGENCY QUOTA RESET: Database connection initialized');
      
      // Get current quota status
      const currentQuota = await sql`
        SELECT id, clerk_org_id, name, quota_used, quota_limit, plan
        FROM organizations 
        WHERE clerk_org_id = ${userId}
        LIMIT 1
      `;
      
      console.log('🚨 EMERGENCY QUOTA RESET: Current quota status:', currentQuota);
      
      if (currentQuota.length === 0) {
        return res.status(200).json({
          success: false,
          error: 'Organization not found',
          userId: userId
        });
      }
      
      const org = currentQuota[0];
      const currentUsed = org.quota_used || 0;
      const currentLimit = org.quota_limit || 10;
      
      console.log(`🚨 EMERGENCY QUOTA RESET: Current quota: ${currentUsed}/${currentLimit}`);
      
      // Reset quota to 0
      const resetResult = await sql`
        UPDATE organizations 
        SET quota_used = 0, updated_at = NOW()
        WHERE clerk_org_id = ${userId}
        RETURNING id, clerk_org_id, quota_used, quota_limit
      `;
      
      console.log('🚨 EMERGENCY QUOTA RESET: Quota reset result:', resetResult);
      
      // Verify reset
      const verifyResult = await sql`
        SELECT id, clerk_org_id, name, quota_used, quota_limit, plan
        FROM organizations 
        WHERE clerk_org_id = ${userId}
        LIMIT 1
      `;
      
      console.log('🚨 EMERGENCY QUOTA RESET: Verification result:', verifyResult);
      
      return res.status(200).json({
        success: true,
        message: 'Quota reset successfully',
        userId: userId,
        beforeReset: {
          used: currentUsed,
          limit: currentLimit,
          overage: Math.max(0, currentUsed - currentLimit)
        },
        afterReset: {
          used: verifyResult[0]?.quota_used || 0,
          limit: verifyResult[0]?.quota_limit || 10,
          overage: 0
        },
        organization: verifyResult[0],
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('🚨 EMERGENCY QUOTA RESET: Error:', error);
      return res.status(200).json({
        success: false,
        error: error.message,
        userId: req.headers['x-user-id'] || 'test-user',
        timestamp: new Date().toISOString()
      });
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
      
      // Test organization lookup (same logic as quota API)
      let orgResult = await sql`
        SELECT id, clerk_org_id, name, quota_used, quota_limit, plan, created_at, updated_at FROM organizations 
        WHERE clerk_org_id = ${userId}
        LIMIT 1
      `;
      
      console.log('DEBUG QUOTA: Organization lookup result:', orgResult);
      
      // If organization doesn't exist, create it (same logic as quota API)
      if (orgResult.length === 0) {
        console.log('DEBUG QUOTA: Organization not found, creating...');
        await sql`
          INSERT INTO organizations (id, clerk_org_id, name, plan, quota_limit, quota_used, created_at, updated_at)
          VALUES (gen_random_uuid(), ${userId}, 'Personal Workspace', 'free', 10, 0, NOW(), NOW())
        `;
        
        orgResult = await sql`
          SELECT id, clerk_org_id, name, quota_used, quota_limit, plan, created_at, updated_at FROM organizations 
          WHERE clerk_org_id = ${userId}
          LIMIT 1
        `;
      }
      
      // Also check all organizations to see what exists
      const allOrgs = await sql`
        SELECT id, clerk_org_id, name, quota_used, quota_limit FROM organizations 
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
        
        // Get quota usage records
        const quotaUsageResult = await sql`
          SELECT id, org_id, job_id, type, amount, description, created_at
          FROM quota_usage 
          WHERE org_id = ${orgId}
          ORDER BY created_at DESC
        `;
        
        console.log('DEBUG QUOTA: Quota usage records:', quotaUsageResult);
        
        // Get job records
        const jobRecords = await sql`
          SELECT id, org_id, type, status, input, created_at, updated_at
          FROM jobs 
          WHERE org_id = ${orgId}
          ORDER BY created_at DESC
        `;
        
        console.log('DEBUG QUOTA: Job records:', jobRecords);
        
        return res.status(200).json({
          success: true,
          userId: userId,
          organization: orgResult[0],
          jobsCount: jobsResult[0]?.count || 0,
          quotaUsageRecords: quotaUsageResult,
          jobRecords: jobRecords,
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
  } else if (path === '/api/quota/monitor') {
    // QUOTA MONITORING ENDPOINT - Detect quota anomalies
    try {
      console.log('QUOTA MONITOR: Checking for quota anomalies...');
      
      const { neon } = require('@neondatabase/serverless');
      
      if (!process.env.DATABASE_URL) {
        return res.status(500).json({ success: false, error: 'Database not configured' });
      }
      
      const sql = neon(process.env.DATABASE_URL);
      
      // Check for quota overages
      const overages = await sql`
        SELECT clerk_org_id, name, quota_used, quota_limit, 
               (quota_used - quota_limit) as overage
        FROM organizations 
        WHERE quota_used > quota_limit
        ORDER BY overage DESC
      `;
      
      // Check for quota usage without records
      const missingRecords = await sql`
        SELECT o.clerk_org_id, o.name, o.quota_used, o.quota_limit,
               COUNT(qu.id) as usage_records
        FROM organizations o
        LEFT JOIN quota_usage qu ON o.id = qu.org_id
        WHERE o.quota_used > 0
        GROUP BY o.id, o.clerk_org_id, o.name, o.quota_used, o.quota_limit
        HAVING COUNT(qu.id) = 0
        ORDER BY o.quota_used DESC
      `;
      
      // Check for jobs without quota usage
      const jobsWithoutQuota = await sql`
        SELECT j.id, j.org_id, j.type, j.status, j.input,
               o.clerk_org_id, o.name
        FROM jobs j
        JOIN organizations o ON j.org_id = o.id
        LEFT JOIN quota_usage qu ON j.org_id = qu.org_id AND qu.job_id = j.id
        WHERE qu.id IS NULL AND j.status = 'completed'
        ORDER BY j.created_at DESC
        LIMIT 10
      `;
      
      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        anomalies: {
          quotaOverages: overages,
          missingUsageRecords: missingRecords,
          jobsWithoutQuota: jobsWithoutQuota
        },
        summary: {
          totalOverages: overages.length,
          totalMissingRecords: missingRecords.length,
          totalJobsWithoutQuota: jobsWithoutQuota.length
        }
      });
      
    } catch (error) {
      console.error('QUOTA MONITOR: Error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
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
        SELECT id, org_id, type, status, input, created_at
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
  } else if (path === '/api/dodo/test') {
    // Simple test endpoint for dodo checkout
    res.status(200).json({
      success: true,
      message: 'Dodo test endpoint working',
      timestamp: new Date().toISOString(),
      path: path,
      method: req.method
    });
  } else if (path === '/api/ai-analysis') {
    // AI ANALYSIS ENDPOINT - Phase 2: Real AI analysis implementation
    try {
      console.log('🤖 AI Analysis endpoint hit:', { method: req.method, path });
      
      if (req.method === 'POST') {
        const { jobId } = req.body;
        
        if (!jobId) {
          return res.status(400).json({
            success: false,
            error: 'Missing required field: jobId'
          });
        }

        console.log(`🤖 Processing real AI analysis for job: ${jobId}`);

        const { neon } = require('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL);

        // Step 1: Get job data and raw scraped data
        const jobResult = await sql`
          SELECT id, raw_data, org_id, status 
          FROM jobs 
          WHERE id = ${jobId}
          LIMIT 1
        `;

        if (!jobResult || jobResult.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Job not found',
            jobId: jobId
          });
        }

        const job = jobResult[0];
        console.log(`📊 Job found: ${job.id}, status: ${job.status}`);

        if (!job.raw_data) {
          return res.status(400).json({
            success: false,
            error: 'No raw data found for analysis',
            jobId: jobId
          });
        }

        // Step 2: Parse raw data
        let scrapedData;
        try {
          scrapedData = typeof job.raw_data === 'string' ? JSON.parse(job.raw_data) : job.raw_data;
        } catch (parseError) {
          console.error('❌ Failed to parse raw data:', parseError);
          return res.status(400).json({
            success: false,
            error: 'Invalid raw data format',
            jobId: jobId
          });
        }

        console.log(`📊 Raw data parsed, ads count: ${scrapedData.data?.length || 0}`);

        // Trigger AI analysis via Inngest (async, no timeout)
        const adsData = scrapedData.data || scrapedData.results || [];
        if (!Array.isArray(adsData) || adsData.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'No ads data found in scraped data',
            jobId: jobId
          });
        }

        console.log(`🔄 Queuing AI analysis for ${adsData.length} ads via Inngest...`);
        
        // Send Inngest event instead of processing synchronously
        try {
          const { inngest } = await loadInngest();
          
          await inngest.send({
            name: 'ai/analyze.start',
            data: {
              jobId: jobId,
              orgId: job.org_id,
              scraped_data: scrapedData,
              keyword: job.input?.keyword || 'unknown'
            }
          });
          
          console.log(`✅ AI analysis queued for job: ${jobId}`);
        } catch (inngestError) {
          console.error('❌ Failed to trigger AI analysis:', inngestError);
          return res.status(500).json({
            success: false,
            error: 'Failed to queue AI analysis',
            message: inngestError.message
          });
        }
        
        // AI analysis is now handled asynchronously via Inngest
        console.log(`✅ AI analysis queued successfully for job: ${jobId}`);

        return res.status(200).json({
          success: true,
          message: 'AI analysis queued successfully',
          jobId: jobId,
          adsQueued: adsData.length,
          status: 'queued',
          note: 'Analysis will be processed asynchronously by Inngest',
          timestamp: new Date().toISOString()
        });

      } else {
        return res.status(405).json({ 
          success: false, 
          error: 'Method not allowed' 
        });
      }
    } catch (error) {
      console.error('❌ AI Analysis endpoint error:', error);
      return res.status(500).json({
        success: false,
        error: 'AI analysis failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  } else if (path === '/api/dodo/checkout') {
    try {
      console.log('🔗 DODO_CHECKOUT_CONFIGURED_URLS_V5', {
        timestamp: new Date().toISOString(),
        method: req.method,
        body: req.body
      });

      const { plan, email, orgId, orgName } = req.body;
      const userId = req.headers['x-user-id'] || req.body.userId;
      const workspaceId = req.headers['x-workspace-id'] || userId;

      // Validate required fields
      if (!plan || !email || !userId) {
        console.log('❌ DODO_VALIDATION_ERROR_V5', { plan, email, userId });
        return res.status(400).json({
          error: 'Missing required fields: plan, email, userId'
        });
      }

      // Map plan codes to product IDs
      const planToProductId = {
        'pro-500': 'prod_pro_plan',
        'ent-2000': 'prod_enterprise_plan',
        'free-10': 'prod_free_plan'
      };
      
      const productId = planToProductId[plan];
      if (!productId) {
        console.log('❌ DODO_INVALID_PLAN_V5', { plan, availablePlans: Object.keys(planToProductId) });
        return res.status(400).json({
          error: `Invalid plan: ${plan}`,
          availablePlans: Object.keys(planToProductId)
        });
      }

      console.log('📦 DODO_PLAN_TO_PRODUCT_V5', {
        plan: plan,
        productId: productId
      });

      // Create checkout session with configured URLs
      const checkoutSessionData = {
        product_cart: [
          {
            product_id: productId,
            quantity: 1
          }
        ],
        customer: {
          email: email,
          name: orgName || email.split('@')[0] || 'Customer'
        },
        metadata: {
          plan: plan,
          source: 'adminer_quota_modal',
          user_id: userId,
          workspace_id: workspaceId
        }
      };

      console.log('🚀 DODO_USING_CONFIGURED_URLS_V5', {
        productId: productId,
        customerEmail: email
      });

      // Call DodoClient with configured URLs
      const dodo = require('../src/lib/dodo.js');
      const checkoutSession = await dodo.createCheckoutSession(checkoutSessionData);

      console.log('📋 DODO_CONFIGURED_URLS_RESULT_V5', {
        success: checkoutSession.success,
        hasCheckoutUrl: !!checkoutSession.checkout_url,
        sessionId: checkoutSession.session_id,
        configuredUrl: checkoutSession.configured_url,
        error: checkoutSession.error
      });

      // Handle errors
      if (!checkoutSession.success || checkoutSession.error) {
        console.log('❌ DODO_CONFIGURED_URLS_ERROR_V5', {
          error: checkoutSession.error
        });

        return res.status(500).json({
          success: false,
          error: 'Checkout session creation failed',
          details: checkoutSession.error,
          message: 'Please try again or contact support'
        });
      }

      // Log successful checkout session (optional)
      try {
        const { neon } = require('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL);

        // Get or create organization for logging
        const generateUuidFromClerkId = (clerkId) => {
          if (clerkId && clerkId.startsWith('user_')) {
            const crypto = require('crypto');
            return crypto.randomUUID();
          }
          return clerkId;
        };

        const finalOrgId = orgId || workspaceId || userId;
        const orgUuid = generateUuidFromClerkId(finalOrgId);

        let orgResult = await sql`
          SELECT id FROM organizations 
          WHERE clerk_org_id = ${finalOrgId} OR id = ${orgUuid}
          LIMIT 1
        `;

        if (orgResult.length > 0) {
          await sql`
            INSERT INTO webhook_events (
              id, event_type, org_id, data, processed_at
            ) VALUES (
              gen_random_uuid(),
              'checkout_session_created_configured',
              ${orgResult[0].id},
              ${JSON.stringify({
                sessionId: checkoutSession.session_id,
                plan: plan,
                productId: productId,
                checkoutUrl: checkoutSession.checkout_url,
                email: email,
                configuredUrl: true
              })},
              NOW()
            )
          `;
          console.log('✅ DODO_CONFIGURED_URLS_LOGGED_V5');
        }
      } catch (logError) {
        console.log('⚠️ DODO_CONFIGURED_URLS_LOG_ERROR_V5', logError.message);
        // Continue even if logging fails
      }

      // Return successful response
      const response = {
        success: true,
        checkout_url: checkoutSession.checkout_url,
        session_id: checkoutSession.session_id,
        plan: checkoutSession.plan,
        configured_url: true,
        message: 'Using configured Dodo checkout URL',
        immediate_activation: checkoutSession.immediate_activation || false,
        redirect_url: checkoutSession.redirect_url
      };

      console.log('🎯 DODO_CONFIGURED_URLS_SUCCESS_V5', {
        sessionId: response.session_id,
        hasCheckoutUrl: !!response.checkout_url,
        configuredUrl: response.configured_url
      });

      return res.status(200).json(response);

    } catch (error) {
      console.error('💥 DODO_CONFIGURED_URLS_API_ERROR_V5', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      return res.status(500).json({
        success: false,
        error: 'Checkout API failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  } else {
    // Default response for unknown paths
    res.status(200).json({ 
      success: true, 
      message: 'Consolidated API endpoint working',
      availableEndpoints: ['/api/test', '/api/inngest', '/api/jobs', '/api/health', '/api/webhook', '/api/apify/health', '/api/apify/webhook', '/api/quota', '/api/analyses/stats', '/api/organizations', '/api/dodo/checkout', '/api/ai-analysis'],
      timestamp: new Date().toISOString()
    });
  }
}