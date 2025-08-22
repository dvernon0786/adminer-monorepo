export function fatal(message, details = []) {
  console.error("❌ " + message);
  for (const d of details) console.error("   - " + d);
  process.exit(1);
}

export function ok(message) {
  console.log("✅ " + message);
}

export function isVercel() {
  return !!process.env.VERCEL || !!process.env.NEXT_RUNTIME;
} 