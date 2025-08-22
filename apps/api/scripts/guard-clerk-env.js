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