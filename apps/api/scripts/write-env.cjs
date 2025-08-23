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
        const value = valueParts.join('=');
        process.env[key] = value;
      }
    }
  });
  console.log('✅ Loaded .env.local file');
}

const outDir = path.join(__dirname, '..', 'public');
const out = path.join(outDir, 'env.js');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Get frontend API (host-only) for Clerk keyless mode - CNAME only
const frontendApi = process.env.CLERK_FRONTEND_API || 'clerk.adminer.online';

// Debug logging
console.log('Environment variables available:');
console.log('- CLERK_FRONTEND_API:', process.env.CLERK_FRONTEND_API ? 'SET' : 'NOT SET');
console.log('- Final frontendApi:', frontendApi);

const envContent = {
  CLERK_FRONTEND_API: frontendApi
};

fs.writeFileSync(out, `window.ENV=${JSON.stringify(envContent)};`);
console.log('Wrote /public/env.js with environment variables'); 