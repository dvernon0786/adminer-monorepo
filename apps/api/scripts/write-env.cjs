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

const outDir = path.join(__dirname, '..', 'public');
const out = path.join(outDir, 'env.js');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Get environment variables
const frontendApi = process.env.CLERK_FRONTEND_API || '';
const publishableKey = process.env.CLERK_PUBLISHABLE_KEY || '';

const ENV = {
  CLERK_FRONTEND_API: frontendApi,
  CLERK_PROXY_URL: "/clerk",
  CLERK_PUBLISHABLE_KEY: publishableKey,
};

// Check for missing publishable key in non-local environments
const scope = process.env.VERCEL_ENV || process.env.NODE_ENV || "local";
if (!ENV.CLERK_PUBLISHABLE_KEY) {
  const isLocal = scope === "development" || scope === "local";
  const msg = `[write-env] CLERK_PUBLISHABLE_KEY ${isLocal ? "missing (ok for local)" : "MISSING (NOT OK for preview/prod)"} — scope=${scope}`;
  isLocal ? console.warn(msg) : console.error(msg);
}

fs.writeFileSync(out, `window.ENV=${JSON.stringify(ENV)};`);
console.log(`[write-env] Wrote ${out}`);
console.log(`[write-env] Environment: ${scope}, CLERK_PUBLISHABLE_KEY: ${publishableKey ? 'SET' : 'NOT SET'}`); 