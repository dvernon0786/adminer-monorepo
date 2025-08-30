// Fail fast if required envs are missing. Imported by middleware and handlers. Does not run in the browser.
// Only check environment variables in production runtime, not during build
const required = ["CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"] as const;

// Only run environment checks in production runtime, not during build
if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  for (const key of required) {
    const v = process.env[key];
    if (!v || String(v).trim() === "") {
      throw new Error(
        `Missing required env var: ${key}. Set it in Vercel Project Settings (Preview & Production) or pull locally via "vercel pull".`
      );
    }
  }
}

// Export typed accessors for server-side use only.
export const env = {
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY as string,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY as string
}; 

// Debug logging only in development
if (process.env.NODE_ENV === 'development') {
  console.log('CLERK_PUBLISHABLE_KEY:', process.env.CLERK_PUBLISHABLE_KEY);
}
