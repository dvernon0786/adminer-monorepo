const required = ["CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"];

// Skip env check in development mode
if (process.env.NODE_ENV === 'development') {
  console.log("🔧 Development mode - skipping env check");
  process.exit(0);
}

for (const key of required) {
  const v = process.env[key];
  if (!v || String(v).trim() === "") {
    console.error(
      `❌ Missing required env var: ${key}. Set it in Vercel (Preview & Production) or run "vercel pull" locally.`
    );
    process.exit(1);
  }
}
console.log("✅ Env check passed."); 