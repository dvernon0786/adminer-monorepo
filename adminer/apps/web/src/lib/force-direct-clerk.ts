// Runs on module import, before <ClerkProvider/>
// Goal: make it impossible for Clerk to "discover" a proxy via window globals.

declare global {
  interface Window {
    __clerk_proxy_url?: string;
    __clerk_frontend_api?: string;
    CLERK_FRONTEND_API?: string;
    __clerk_publishableKey?: string;
    env?: Record<string, unknown>;
  }
}

function nuke(name: keyof Window, label = String(name)) {
  try {
    if (name in window) {
      // Remove if possible
      // @ts-expect-error - dynamic delete
      delete (window as any)[name];
    }
    // Re-define as read-only undefined to block re-injection at runtime
    Object.defineProperty(window, name, {
      configurable: false,
      enumerable: false,
      get() {
        return undefined;
      },
      set(_) {
        // swallow attempts
      },
    });
    // eslint-disable-next-line no-console
    if (import.meta.env.DEV) console.debug(`[clerk-guard] neutralized ${label}`);
  } catch {
    /* no-op */
  }
}

export function forceDirectClerk() {
  if (typeof window === "undefined") return;

  // Kill any known proxy fingerprints
  nuke("__clerk_proxy_url", "window.__clerk_proxy_url");
  nuke("__clerk_frontend_api", "window.__clerk_frontend_api");
  nuke("CLERK_FRONTEND_API", "window.CLERK_FRONTEND_API");

  // If some frameworks stash env on window, null them too
  try {
    if (window.env && typeof window.env === "object") {
      const keys = ["CLERK_FRONTEND_API", "__clerk_proxy_url", "__clerk_frontend_api"];
      for (const k of keys) {
        // @ts-expect-error dynamic
        if (k in window.env) delete (window.env as any)[k];
      }
    }
  } catch {
    /* no-op */
  }
}

// Auto-run on import
forceDirectClerk(); 