// Kills any accidental proxy "hints" that Clerk reads from globals
// Must execute before <ClerkProvider/>

declare global {
  interface Window {
    __clerk_proxy_url?: string;
    __clerk_frontend_api?: string;
  }
}

if (typeof window !== "undefined") {
  // Remove any proxy fingerprints that might be injected by legacy bundles/env
  delete (window as any).__clerk_proxy_url;
  delete (window as any).__clerk_frontend_api;
} 