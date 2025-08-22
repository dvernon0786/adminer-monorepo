import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In production builds, environment variables are already set by Vercel
// We don't need to load .env files, just check if the variables exist

console.log("\n==== [Prebuild Guard: Dodo] ====\n");

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

// Add scope hint for debugging
const scope = process.env.VERCEL_ENV || (process.env.VERCEL ? "unknown" : "local");
console.log(`ℹ️  Environment scope: ${scope}`);

// Add self-auditing summary table
const summary = Object.keys(process.env)
  .filter((k) => /^DODO_/.test(k))
  .sort()
  .map((k) => ({ key: k, value: process.env[k] ? "***" : "" }));

if (summary.length) {
  console.log("\n— Dodo Env Summary (masked) —");
  console.table(summary);
} 