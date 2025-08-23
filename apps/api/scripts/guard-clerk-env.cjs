#!/usr/bin/env node

const scope = process.env.VERCEL_ENV || process.env.NODE_ENV || "local";
const secret = !!process.env.CLERK_SECRET_KEY;
const frontendApi = !!process.env.CLERK_FRONTEND_API;
const pk = !!process.env.CLERK_PUBLISHABLE_KEY;

console.log("==== [Prebuild Guard: Clerk] ===");
console.log(`Environment: ${scope}`);
console.log(`CLERK_SECRET_KEY: ${secret ? '✅ SET' : '❌ MISSING'}`);
console.log(`CLERK_FRONTEND_API: ${frontendApi ? '✅ SET' : '❌ MISSING'}`);
console.log(`CLERK_PUBLISHABLE_KEY: ${pk ? '✅ SET' : '❌ MISSING'}`);

if (!secret) throw new Error("Missing CLERK_SECRET_KEY");
if (!frontendApi) console.warn("CLERK_FRONTEND_API not set (ok if using publishableKey only).");

if (scope !== "development" && scope !== "local") {
  if (!pk) throw new Error("Missing CLERK_PUBLISHABLE_KEY in Preview/Production.");
}

console.log("✅ Clerk environment variables validated");
console.log("==== [Prebuild Guards: All Passed] ==="); 