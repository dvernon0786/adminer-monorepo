import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In production builds, environment variables are already set by Vercel
// We don't need to load .env files, just check if the variables exist

// Check required Dodo environment variables
const required = [
  "DODO_API_KEY",
  "DODO_WEBHOOK_SECRET",
  "DODO_FREE_PRODUCT_ID",
  // add PRO/ENTERPRISE if you guard them at build time:
  "DODO_PRO_PRODUCT_ID",
  "DODO_ENT_PRODUCT_ID",
];

// Detect when running on Vercel vs local for clearer messages
const isVercel = !!process.env.VERCEL || !!process.env.NEXT_RUNTIME;

const missing = required.filter((k) => !process.env[k]);

if (missing.length) {
  console.error("❌ Missing Dodo env vars:");
  for (const m of missing) console.error("   - " + m);
  console.error(
    isVercel
      ? "Vercel: Add these in Project → Settings → Environment Variables (correct scope: Production/Preview)."
      : "Local: Export these in your shell (or run `direnv`/`source .env.local`), since we intentionally do not load .env files."
  );
  process.exit(1);
}

console.log("✅ Dodo environment variables are set.");
console.log(`Environment variables found: [${required.join(', ')}]`); 