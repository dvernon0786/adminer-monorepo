#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load .env.local file if it exists
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('📁 Loading environment variables from .env.local...');
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  
  // Parse .env.local file and set process.env
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        // Support quoted values and keep '=' inside values
        let value = valueParts.join('=').trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  });
  console.log('✅ Loaded .env.local file');
}

const scope = process.env.VERCEL_ENV || process.env.NODE_ENV || "local";
const secret = !!process.env.CLERK_SECRET_KEY;
const pk = !!process.env.CLERK_PUBLISHABLE_KEY;

console.log("==== [Prebuild Guard: Clerk] ===");
console.log(`Environment: ${scope}`);
console.log(`CLERK_SECRET_KEY: ${secret ? '✅ SET' : '❌ MISSING'}`);
console.log(`CLERK_PUBLISHABLE_KEY: ${pk ? '✅ SET' : '❌ MISSING'}`);

if (!secret) throw new Error("Missing CLERK_SECRET_KEY");

if (scope !== "development" && scope !== "local") {
  if (!pk) throw new Error("Missing CLERK_PUBLISHABLE_KEY in Preview/Production.");
}

console.log("✅ Clerk environment variables validated");
console.log("==== [Prebuild Guards: All Passed] ==="); 