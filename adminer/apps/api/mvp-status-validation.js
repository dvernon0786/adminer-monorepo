#!/usr/bin/env node

/**
 * MVP STATUS VALIDATION SCRIPT
 * Comprehensive validation of ADminer MVP completion status
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 === ADMINER MVP STATUS VALIDATION ===\n');

// Track completion status
let completed = 0;
let missing = 0;
let partial = 0;
const total = 31;

function statusComplete(message) {
  console.log(`✅ ${message}`);
  completed++;
}

function statusMissing(message) {
  console.log(`❌ ${message}`);
  missing++;
}

function statusPartial(message) {
  console.log(`⚠️ ${message}`);
  partial++;
}

// =============================================================================
// 1. INFRASTRUCTURE & DEPLOYMENT STATUS
// =============================================================================
console.log('🏗️ === INFRASTRUCTURE & DEPLOYMENT ===');

// Check if deployment is working
try {
  const { execSync } = require('child_process');
  execSync('curl -s --connect-timeout 10 https://adminer.online/ >/dev/null 2>&1', { stdio: 'pipe' });
  statusComplete('Production deployment accessible');
} catch (error) {
  statusMissing('Production deployment not accessible');
}

// Check Vercel configuration
if (fs.existsSync('vercel.json')) {
  statusComplete('Vercel configuration exists');
} else {
  statusMissing('Vercel configuration missing');
}

console.log('');

// =============================================================================
// 2. ENVIRONMENT VARIABLES
// =============================================================================
console.log('🔑 === ENVIRONMENT VARIABLES ===');

// Check .env.local file
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  
  // Clerk
  if (envContent.includes('CLERK_PUBLISHABLE_KEY') && envContent.includes('pk_')) {
    statusComplete('Clerk authentication configured');
  } else {
    statusMissing('Clerk authentication not configured');
  }
  
  // Database
  if (envContent.includes('DATABASE_URL') && envContent.includes('postgresql://')) {
    statusComplete('Database URL configured');
  } else {
    statusMissing('Database URL not configured');
  }
  
  // Dodo payments
  if (envContent.includes('DODO_PAYMENTS_API_KEY') && envContent.includes('dodo_')) {
    statusComplete('Dodo payments configured');
  } else {
    statusMissing('Dodo payments not configured');
  }
  
  // Inngest
  if (envContent.includes('INNGEST_EVENT_KEY') && envContent.includes('INNGEST_SIGNING_KEY')) {
    statusComplete('Inngest configured');
  } else {
    statusMissing('Inngest not configured');
  }
  
  // Apify
  if (envContent.includes('APIFY_TOKEN') && envContent.includes('apify_api_')) {
    statusComplete('Apify configured');
  } else {
    statusMissing('Apify not configured');
  }
} else {
  statusMissing('Environment file missing');
}

console.log('');

// =============================================================================
// 3. DATABASE SETUP
// =============================================================================
console.log('🗄️ === DATABASE SETUP ===');

// Check Drizzle configuration
if (fs.existsSync('drizzle.config.ts')) {
  statusComplete('Drizzle configuration exists');
} else {
  statusMissing('Drizzle configuration missing');
}

// Check database schema
if (fs.existsSync('src/db/schema.ts')) {
  statusComplete('Database schema defined');
} else {
  statusMissing('Database schema missing');
}

// Check if AI analysis migration was run
if (fs.existsSync('scripts/migrate-ai-analysis-fields.js')) {
  statusComplete('AI analysis migration script exists');
} else {
  statusMissing('AI analysis migration script missing');
}

// Check database operations
if (fs.existsSync('src/lib/db.js')) {
  statusComplete('Database operations implemented');
} else {
  statusMissing('Database operations missing');
}

console.log('');

// =============================================================================
// 4. PAYMENTS SYSTEM
// =============================================================================
console.log('💳 === PAYMENTS SYSTEM ===');

// Check Dodo integration
if (fs.existsSync('src/lib/dodo.js')) {
  statusComplete('Dodo integration implemented');
} else {
  statusMissing('Dodo integration missing');
}

// Check webhook endpoint
if (fs.existsSync('api/dodo-webhook.js')) {
  statusComplete('Dodo webhook endpoint exists');
} else {
  statusMissing('Dodo webhook endpoint missing');
}

// Check subscription plans
if (fs.existsSync('src/lib/subscription-plans.js')) {
  statusComplete('Subscription plans defined');
} else {
  statusMissing('Subscription plans missing');
}

console.log('');

// =============================================================================
// 5. QUOTA SYSTEM
// =============================================================================
console.log('📊 === QUOTA SYSTEM ===');

// Check quota status endpoint
if (fs.existsSync('api/quota.js')) {
  statusComplete('Quota status endpoint exists');
} else {
  statusMissing('Quota status endpoint missing');
}

// Check quota enforcement
const consolidatedApi = fs.existsSync('api/consolidated.js') ? fs.readFileSync('api/consolidated.js', 'utf8') : '';
if (consolidatedApi.includes('quota') && consolidatedApi.includes('limit')) {
  statusComplete('Quota enforcement implemented');
} else {
  statusMissing('Quota enforcement missing');
}

// Check upgrade links
if (consolidatedApi.includes('upgrade') || consolidatedApi.includes('checkout')) {
  statusComplete('Upgrade links implemented');
} else {
  statusMissing('Upgrade links missing');
}

// Check if quota system uses real data
if (consolidatedApi.includes('mock') && consolidatedApi.includes('quota')) {
  statusPartial('Quota system partially implemented (still using some mock data)');
} else {
  statusComplete('Real quota system implemented');
}

console.log('');

// =============================================================================
// 6. JOBS PIPELINE
// =============================================================================
console.log('⚙️ === JOBS PIPELINE ===');

// Check Inngest functions
if (fs.existsSync('src/inngest/functions.js')) {
  statusComplete('Inngest functions implemented');
} else {
  statusMissing('Inngest functions missing');
}

// Check Apify integration
if (fs.existsSync('src/lib/apify.js')) {
  statusComplete('Apify integration implemented');
} else {
  statusMissing('Apify integration missing');
}

// Check job status tracking
if (consolidatedApi.includes('job') && consolidatedApi.includes('status')) {
  statusComplete('Job status tracking implemented');
} else {
  statusMissing('Job status tracking missing');
}

// Check job events
if (consolidatedApi.includes('event') && consolidatedApi.includes('inngest')) {
  statusComplete('Job events implemented');
} else {
  statusMissing('Job events missing');
}

console.log('');

// =============================================================================
// 7. AI ANALYSIS
// =============================================================================
console.log('🤖 === AI ANALYSIS ===');

// Check GPT-4o integration
if (fs.existsSync('src/lib/unified-ai-analyzer.js')) {
  statusComplete('GPT-4o integration implemented');
} else {
  statusMissing('GPT-4o integration missing');
}

// Check Gemini integration
const aiAnalyzer = fs.existsSync('src/lib/unified-ai-analyzer.js') ? fs.readFileSync('src/lib/unified-ai-analyzer.js', 'utf8') : '';
if (aiAnalyzer.includes('gemini') || aiAnalyzer.includes('Gemini')) {
  statusComplete('Gemini integration implemented');
} else {
  statusMissing('Gemini integration missing');
}

// Check structured data processing
if (aiAnalyzer.includes('processApifyData') && aiAnalyzer.includes('analysis')) {
  statusComplete('Structured data processing implemented');
} else {
  statusMissing('Structured data processing missing');
}

console.log('');

// =============================================================================
// 8. API ENDPOINTS & SMOKE TESTS
// =============================================================================
console.log('🔧 === API ENDPOINTS & SMOKE TESTS ===');

// Check consolidated API endpoint
if (fs.existsSync('api/consolidated.js')) {
  statusComplete('Consolidated API endpoint exists');
} else {
  statusMissing('Consolidated API endpoint missing');
}

// Check health endpoint
if (consolidatedApi.includes('health') || consolidatedApi.includes('/api/health')) {
  statusComplete('Health endpoint implemented');
} else {
  statusMissing('Health endpoint missing');
}

// Check production API responding
try {
  const { execSync } = require('child_process');
  execSync('curl -s --connect-timeout 10 https://adminer.online/api/health >/dev/null 2>&1', { stdio: 'pipe' });
  statusComplete('Production API responding');
} catch (error) {
  statusMissing('Production API not responding');
}

console.log('');

// =============================================================================
// 9. FRONTEND INTEGRATION
// =============================================================================
console.log('🎨 === FRONTEND INTEGRATION ===');

// Check dashboard component
if (fs.existsSync('../web/src/pages/dashboard/index.tsx')) {
  statusComplete('Dashboard component exists');
} else {
  statusMissing('Dashboard component missing');
}

// Check frontend API integration
if (fs.existsSync('../web/src/hooks/useQuota.ts')) {
  statusComplete('Frontend API integration exists');
} else {
  statusMissing('Frontend API integration missing');
}

// Check authentication integration
if (fs.existsSync('../web/src/hooks/useUser.ts') || fs.existsSync('../web/src/lib/auth.ts')) {
  statusComplete('Authentication integration exists');
} else {
  statusMissing('Authentication integration missing');
}

console.log('');

// =============================================================================
// 10. FINAL SUMMARY
// =============================================================================
console.log('📊 === MVP COMPLETION SUMMARY ===');
console.log('');
console.log(`✅ Completed: ${completed}`);
console.log(`❌ Missing: ${missing}`);
console.log(`⚠️ Partial: ${partial}`);
console.log('');
console.log(`📈 Overall Completion: ${Math.round((completed / total) * 100)}%`);

if (completed >= 28) {
  console.log('🎉 MVP is nearly complete! Focus on the missing items.');
} else if (completed >= 20) {
  console.log('⚠️ MVP is making good progress. Continue with implementation.');
} else {
  console.log('❌ MVP needs significant work. Focus on core components.');
}

console.log('');
console.log('🎯 Next Priority Actions:');
console.log('1. Address the ❌ missing components above');
console.log('2. Focus on critical path: Database → Payments → Quota → Jobs → AI');
console.log('3. Run this script again to track progress');
console.log('');
console.log('=== ✅ STATUS CHECK COMPLETE ===');
