// Clerk Security Tripwire
// Blocks unauthorized script injections while allowing legitimate Clerk scripts

(function secureScriptAppendChild() {
  const nativeAppendChild = Element.prototype.appendChild;

  function isSameOrigin(url: URL) {
    return url.origin === window.location.origin;
  }

  // Allowlist patterns for same-origin dynamic chunks Clerk injects
  const SAME_ORIGIN_CLERK_CHUNK = /^\/(framework|vendors|ui-common)_clerk\.browser_[A-Za-z0-9_.-]+\.js$/;

  // Optional: if you ever point clerkJSUrl back to CDN, these hosts are ok.
  const ALLOWED_CDN_HOSTS = [
    // Clerk CDN / npm CDNs commonly used by Clerk
    'clerk.com',
    'clerkstage.dev',
    'cdn.jsdelivr.net',
    'unpkg.com'
  ];

  function isAllowedCdn(url: URL) {
    return ALLOWED_CDN_HOSTS.some(host =>
      url.hostname === host || url.hostname.endsWith(`.${host}`)
    );
  }

  // Helper: is this the base runtime we serve locally?
  function isLocalClerkRuntime(url: URL) {
    // e.g. /clerk.browser.js
    return url.pathname === '/clerk.browser.js';
  }

  // Helper: same-origin dynamic Clerk chunks
  function isSameOriginClerkChunk(url: URL) {
    return isSameOrigin(url) && SAME_ORIGIN_CLERK_CHUNK.test(url.pathname);
  }

  Element.prototype.appendChild = function guardedAppendChild<T extends Node>(node: T): T {
    try {
      // Only guard <script> elements that actually have a src
      if (
        node &&
        node.nodeName === 'SCRIPT' &&
        (node as HTMLScriptElement).src
      ) {
        const src = (node as HTMLScriptElement).src;
        const url = new URL(src, window.location.href);

        // ✅ Allow our local runtime
        if (isLocalClerkRuntime(url)) {
          return nativeAppendChild.call(this, node);
        }

        // ✅ Allow same-origin dynamic Clerk chunks
        if (isSameOriginClerkChunk(url)) {
          return nativeAppendChild.call(this, node);
        }

        // ✅ (Optional) Allow official CDNs if you ever use them
        if (isAllowedCdn(url)) {
          return nativeAppendChild.call(this, node);
        }

        // ❌ Everything else is blocked
        console.error(
          '[clerk-tripwire] Blocked script (appendChild):',
          url.href
        );
        throw new Error('Security tripwire: non-allowed script attempted to load.');
      }
    } catch (e) {
      // Surface the error so Clerk can handle/fail fast
      return Promise.reject(e) as unknown as T;
    }

    // Non-script or script without src → allow
    return nativeAppendChild.call(this, node);
  };
})(); 