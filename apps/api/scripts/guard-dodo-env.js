/* apps/api/scripts/guard-dodo-env.js */
const required = ["DODO_CHECKOUT_PRO_URL", "DODO_CHECKOUT_ENT_URL"];
const missing = required.filter((k) => !process.env[k]);
const env = process.env.VERCEL_ENV || process.env.NODE_ENV || "development";
const force = String(process.env.FORCE_BILLING_GUARDS || "").toLowerCase() === "true";

const isProd = env === "production";

console.log("\n==== [Prebuild Guard: Dodo] ====\n");

if (missing.length) {
  if (isProd || force) {
    console.error("❌ Missing Dodo env vars:");
    missing.forEach((m) => console.error(`   - ${m}`));
    console.error(
      "Vercel: Add these in Project → Settings → Environment Variables (scope: Production/Preview)."
    );
    process.exit(1);
  } else {
    console.warn("⚠️  Missing Dodo env vars (non-production):");
    missing.forEach((m) => console.warn(`   - ${m}`));
    console.warn("Build will continue in Preview/Dev.\n");
  }
} else {
  console.log("✅ Dodo env vars present.\n");
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