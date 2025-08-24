// Hard-fail if anything tries to load Clerk from non-official domains in production.

const OFFICIAL_SCRIPT = "https://clerk.com/npm/@clerk/clerk-js@5/dist/clerk.browser.js";
const JS_DELIVR_CLERK_SCRIPT = "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js";
const LOCAL_CLERK_SCRIPT = "/clerk.browser.js";
const OFFICIAL_ALLOWED_PREFIXES = [
  "https://clerk.com/",
  "https://www.clerk.com/",
  "https://api.clerk.com/", // not a script, but we keep the brand surface tight
  "https://assets.clerk.com/", // future-proofing (doesn't hurt)
];

// Trusted CDN for Clerk scripts
const TRUSTED_CDN_PREFIXES = [
  "https://cdn.jsdelivr.net/npm/@clerk/", // jsDelivr - official npm CDN
];

function isAllowedClerkSrc(src: string | null): boolean {
  if (!src) return false;
  if (src === OFFICIAL_SCRIPT) return true;
  if (src === JS_DELIVR_CLERK_SCRIPT) return true; // Allow jsDelivr Clerk script
  if (src === LOCAL_CLERK_SCRIPT) return true; // Allow locally served Clerk script
  if (OFFICIAL_ALLOWED_PREFIXES.some((p) => src.startsWith(p))) return true;
  if (TRUSTED_CDN_PREFIXES.some((p) => src.startsWith(p))) return true; // Allow trusted CDNs
  return false;
}

export function installClerkTripwire() {
  if (typeof window === "undefined") return;
  if (!import.meta.env.PROD) return; // only tripwire in prod

  // Observe new scripts
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const n of Array.from(m.addedNodes)) {
        if (n.nodeType === 1 && (n as Element).tagName === "SCRIPT") {
          const s = n as HTMLScriptElement;
          const src = s.getAttribute("src");
          if (src && /clerk/i.test(src) && !isAllowedClerkSrc(src)) {
            console.error("[clerk-tripwire] Blocked non-official Clerk script:", src);
            throw new Error("Security tripwire: non-official Clerk script attempted to load.");
          }
        }
      }
    }
  });

  mo.observe(document.documentElement, { subtree: true, childList: true });

  // Patch appendChild to catch dynamic script injection
  const _appendChild = Element.prototype.appendChild;
  // @ts-expect-error patching
  Element.prototype.appendChild = function (child: Node) {
    if (child instanceof HTMLScriptElement) {
      const src = child.getAttribute("src");
      if (src && /clerk/i.test(src) && !isAllowedClerkSrc(src)) {
        console.error("[clerk-tripwire] Blocked non-official Clerk script (appendChild):", src);
        throw new Error("Security tripwire: non-official Clerk script attempted to load.");
      }
    }
    return _appendChild.call(this, child);
  };
}

// Auto-install
installClerkTripwire(); 