/* apps/api/scripts/guard-dodo-env.js
 * Purpose: Fail builds in Production if paid checkout URLs are missing.
 * Notes:
 *  - Free never requires a checkout URL.
 *  - In Preview/Dev, only warn (unless FORCE_BILLING_GUARDS=true).
 */
const requiredPaid = ["DODO_CHECKOUT_PRO_URL", "DODO_CHECKOUT_ENT_URL"];
const missing = requiredPaid.filter((k) => !process.env[k]);

const env = process.env.VERCEL_ENV || process.env.NODE_ENV || "development";
const force = String(process.env.FORCE_BILLING_GUARDS || "").toLowerCase() === "true";
const isProd = env === "production";

console.log("\n==== [Prebuild Guard: Dodo] ====\n");
console.log("Info: Free plan does not require any checkout URL.");

if (missing.length) {
  if (isProd || force) {
    console.error("❌ Missing required checkout URLs for paid plans:");
    missing.forEach((m) => console.error(`   - ${m}`));
    console.error(
      "Vercel: Add these in Project → Settings → Environment Variables (scope: Production)."
    );
    process.exit(1);
  } else {
    console.warn("⚠️  Missing paid checkout URLs (non-production):");
    missing.forEach((m) => console.warn(`   - ${m}`));
    console.warn("Continuing build in Preview/Dev.\n");
  }
} else {
  console.log("✅ Paid checkout URLs present.\n");
}

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