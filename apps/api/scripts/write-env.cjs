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

// Try multiple environment variable names for maximum compatibility
const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 
            process.env.VITE_CLERK_PUBLISHABLE_KEY || 
            process.env.CLERK_PUBLISHABLE_KEY || '';

// Get proxy URL if available
const proxyUrl = process.env.CLERK_PROXY_URL || process.env.VITE_CLERK_PROXY_URL || '';
const clerkJsUrl = process.env.CLERK_JS_URL || process.env.VITE_CLERK_JS_URL || '';

// Debug logging
console.log('Environment variables available:');
console.log('- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT SET');
console.log('- VITE_CLERK_PUBLISHABLE_KEY:', process.env.VITE_CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT SET');
console.log('- CLERK_PUBLISHABLE_KEY:', process.env.CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT SET');
console.log('- CLERK_PROXY_URL:', proxyUrl ? 'SET' : 'NOT SET');
console.log('- CLERK_JS_URL:', clerkJsUrl ? 'SET' : 'NOT SET');
console.log('- Final key length:', key.length);

const envContent = {
  VITE_CLERK_PUBLISHABLE_KEY: key,
  ...(proxyUrl && { CLERK_PROXY_URL: proxyUrl }),
  ...(clerkJsUrl && { CLERK_JS_URL: clerkJsUrl })
};

fs.writeFileSync(out, `window.ENV=${JSON.stringify(envContent)};`);
console.log('Wrote /public/env.js with environment variables'); 