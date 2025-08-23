const fs = require('fs');
const path = require('path');

console.log("\n==== [Prebuild Guard: Clerk] ====\n");

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
} else {
  console.log('⚠️  No .env.local file found, using existing environment variables');
}

const required = [
  // Server side (only if your API needs it at build time)
  "CLERK_SECRET_KEY",

  // Client/SSR publishable keys — at least one is typically present
  "CLERK_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "VITE_CLERK_PUBLISHABLE_KEY",
];

const present = required.filter((k) => !!process.env[k]);
const missing = required.filter((k) => !process.env[k]);

// Allow flexibility: require at least one publishable key + secret if you truly need secret at build
const hasAnyPublishable =
  !!process.env.CLERK_PUBLISHABLE_KEY ||
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  !!process.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!hasAnyPublishable) {
  console.error("❌ No Clerk publishable key found (need at least one of):");
  console.error("   - CLERK_PUBLISHABLE_KEY");
  console.error("   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  console.error("   - VITE_CLERK_PUBLISHABLE_KEY");
  process.exit(1);
}

// If your API code uses the secret at build time, enforce it:
if (!process.env.CLERK_SECRET_KEY) {
  console.error("❌ Missing Clerk server key: CLERK_SECRET_KEY");
  process.exit(1);
}

console.log(
  "✅ Clerk environment variables are set:",
  present.map((k) => `${k}=***`).join(", ")
);

// Add scope hint for debugging
const scope = process.env.VERCEL_ENV || (process.env.VERCEL ? "unknown" : "local");
console.log(`ℹ️  Environment scope: ${scope}`);

// Add self-auditing summary table
const summary = Object.keys(process.env)
  .filter((k) => /^(CLERK_|NEXT_PUBLIC_CLERK_)/.test(k))
  .sort()
  .map((k) => ({ key: k, value: process.env[k] ? "***" : "" }));

if (summary.length) {
  console.log("\n— Clerk Env Summary (masked) —");
  console.table(summary);
} 