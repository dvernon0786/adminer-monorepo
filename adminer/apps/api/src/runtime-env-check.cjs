(function () {
  console.log("\n==== [Runtime Env Check] ====\n");
  
  const required = [
    "DODO_API_KEY",
    "DODO_WEBHOOK_SECRET",
    "CLERK_SECRET_KEY"
  ];
  
  const missing = required.filter((k) => !process.env[k]);
  
  if (missing.length) {
    console.error("❌ Runtime missing envs:", missing);
    console.error("💥 Server will exit to prevent half-broken deployment");
    process.exit(1); // crash early; prevents a half-broken deploy
  }
  
  console.log("✅ Runtime env check passed.");
  console.log("✅ Server can start safely.");
  
  // Add scope hint for debugging
  const scope = process.env.VERCEL_ENV || (process.env.VERCEL ? "unknown" : "local");
  console.log(`ℹ️  Environment scope: ${scope}`);
  
  // Add runtime summary table
  const summary = Object.keys(process.env)
    .filter((k) => /^(DODO_|CLERK_)/.test(k))
    .sort()
    .map((k) => ({ key: k, value: process.env[k] ? "***" : "" }));
  
  if (summary.length) {
    console.log("\n— Runtime Env Summary (masked) —");
    console.table(summary);
  }
  
  console.log("\n==== [Runtime Env Check Complete] ====\n");
})(); 