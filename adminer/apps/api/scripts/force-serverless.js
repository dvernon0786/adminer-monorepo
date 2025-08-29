#!/usr/bin/env node

/**
 * Force Serverless Mode Script
 * This script ensures Next.js builds in serverless mode, not export mode
 */

console.log('🔧 Force Serverless Mode: Starting...');

// Override any export mode environment variables
process.env.NEXT_EXPORT = 'false';
process.env.VERCEL_EXPORT = 'false';
process.env.NODE_ENV = 'production';

// Force disable any export-related flags
process.env.NEXT_TELEMETRY_DISABLED = '1';

// Additional aggressive overrides
process.env.NEXT_SHARP_PATH = '';
process.env.NEXT_RUNTIME = 'nodejs';
process.env.NEXT_STANDALONE = 'true';

// Force serverless mode
process.env.NEXT_OUTPUT = 'standalone';

console.log('✅ Environment variables overridden:');
console.log('   NEXT_EXPORT = false');
console.log('   VERCEL_EXPORT = false');
console.log('   NODE_ENV = production');
console.log('   NEXT_TELEMETRY_DISABLED = 1');
console.log('   NEXT_RUNTIME = nodejs');
console.log('   NEXT_STANDALONE = true');
console.log('   NEXT_OUTPUT = standalone');

console.log('🚀 Proceeding with serverless build...'); 