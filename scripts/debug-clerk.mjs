#!/usr/bin/env node
/**
 * One-shot Clerk wiring debugger for Adminer
 * Scans: envs, index.html, env.js, main.tsx, CSP, proxy, network tags
 * Output: green/red status + concrete fix hints
 */

import fs from "fs";
import path from "path";
import url from "url";

const repoRoot = process.cwd();
const webDir = path.join(repoRoot, "adminer", "apps", "web");
const apiDir = path.join(repoRoot, "adminer", "apps", "api");

const files = {
  webEnvLocal: path.join(webDir, ".env.local"),
  webEnv: path.join(webDir, ".env"),
  webIndexHtml: path.join(webDir, "index.html"),
  webMainTsx: path.join(webDir, "src", "main.tsx"),
  webAppTsx: path.join(webDir, "src", "App.tsx"),
  apiPublicEnvJs: path.join(apiDir, "public", "env.js"),
  apiCsp: path.join(apiDir, "src", "lib", "csp.ts"),
  apiNextConfig: path.join(apiDir, "next.config.mjs"),
  apiMiddleware: path.join(apiDir, "middleware.ts"),
};

const ok = (msg) => console.log(`\x1b[32m✔\x1b[0m ${msg}`);
const warn = (msg) => console.log(`\x1b[33m▲\x1b[0m ${msg}`);
const bad = (msg) => console.log(`\x1b[31m✘\x1b[0m ${msg}`);
const head = (msg) => console.log(`\n\x1b[36m=== ${msg} ===\x1b[0m`);

function readIfExists(p) {
  try { return fs.readFileSync(p, "utf8"); } catch { return null; }
}
function grep(str, re) {
  if (!str) return null;
  const m = str.match(re);
  return m ? m[0] : null;
}

function maskKey(val) {
  if (!val || val.length < 10) return val || "(empty)";
  return val.slice(0, 6) + "…" + val.slice(-4);
}

function checkEnvVars() {
  head("ENV: Build-time (Vite) & Runtime (env.js)");
  const envLocal = readIfExists(files.webEnvLocal) || "";
  const envGeneric = readIfExists(files.webEnv) || "";
  const pkFromEnvLocal = grep(envLocal, /VITE_CLERK_PUBLISHABLE_KEY\s*=\s*.+/);
  const pkFromEnv = grep(envGeneric, /VITE_CLERK_PUBLISHABLE_KEY\s*=\s*.+/);

  if (pkFromEnvLocal || pkFromEnv) {
    ok(`VITE_CLERK_PUBLISHABLE_KEY in apps/web: ${maskKey((pkFromEnvLocal||pkFromEnv).split("=").pop().trim())}`);
  } else {
    bad("VITE_CLERK_PUBLISHABLE_KEY missing in apps/web .env/.env.local");
  }

  const envJs = readIfExists(files.apiPublicEnvJs);
  if (!envJs) {
    bad("apps/api/public/env.js not found (runtime window.ENV fallback will be empty)");
  } else {
    // Simple check for CLERK_PUBLISHABLE_KEY presence
    if (envJs.includes("CLERK_PUBLISHABLE_KEY")) {
      ok("Runtime window.ENV.CLERK_PUBLISHABLE_KEY present in env.js");
    } else {
      bad("Runtime env.js present, but CLERK_PUBLISHABLE_KEY is missing");
    }
  }
}

function checkIndexHtml() {
  head("index.html: External script & env loader");
  const idx = readIfExists(files.webIndexHtml);
  if (!idx) { bad("apps/web/index.html missing"); return; }

  // Block external clerk-js (should be none)
  const externalClerk = idx.match(/clerk\.adminer\.online|clerk\.com\/npm\/@clerk\/clerk-js/i);
  if (externalClerk) {
    bad(`External Clerk JS detected in index.html → remove any <script src="...clerk..."> tags.`);
  } else {
    ok("No external Clerk JS in index.html");
  }

  // Ensure env.js is included (runtime fallback)
  const hasEnv = idx.match(/<script\s+src="\/env\.js[^"]*"><\/script>/i);
  if (hasEnv) ok(`env.js loader present in index.html`);
  else warn(`env.js not referenced in index.html — runtime window.ENV fallback will not work in production`);
}

function checkMainTsx() {
  head("main.tsx: Single-source ClerkProvider config");
  const main = readIfExists(files.webMainTsx);
  if (!main) { bad("apps/web/src/main.tsx not found"); return; }

  const usesPublishable = /ClerkProvider[^>]*publishableKey\s*=\s*{[^}]+}/.test(main);
  if (usesPublishable) ok("ClerkProvider uses publishableKey prop");
  else bad("ClerkProvider does not use publishableKey");

  const hasFrontendApiProp = /ClerkProvider[^>]*frontendApi\s*=/.test(main);
  const hasProxyUrlProp   = /ClerkProvider[^>]*proxyUrl\s*=/.test(main);
  const hasClerkJsUrl     = /ClerkProvider[^>]*clerkJSUrl\s*=/.test(main);

  if (hasFrontendApiProp || hasProxyUrlProp || hasClerkJsUrl) {
    bad("ClerkProvider still has frontendApi/proxyUrl/clerkJSUrl props — remove for single-source mode");
  } else {
    ok("No frontendApi/proxyUrl/clerkJSUrl props in ClerkProvider");
  }

  const hasEnvFallback = /import\.meta\.env\.VITE_CLERK_PUBLISHABLE_KEY\s*\|\|\s*\(window as any\)\?\.ENV\?\.CLERK_PUBLISHABLE_KEY/.test(main);
  if (hasEnvFallback) ok("Single-source key with build-time + window.ENV fallback is present");
  else warn("Consider adding fallback: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || window.ENV?.CLERK_PUBLISHABLE_KEY");
}

function checkCspAndProxy() {
  head("API CSP & Proxy: Must not force reverse-proxy if single-source");
  const csp = readIfExists(files.apiCsp) || "";
  const mentionsProxy = csp.includes("/clerk/") || csp.match(/\/clerk\//);
  const nextCfg = readIfExists(files.apiNextConfig) || "";
  const proxyRewrite = nextCfg.match(/\/clerk\/.*destination/i);

  if (mentionsProxy) warn("CSP mentions reverse-proxy (/clerk/*). Remove if you truly want direct Clerk CDN/API.");
  else ok("CSP does not reference /clerk/* proxy");

  if (proxyRewrite) warn("next.config.mjs has a /clerk/* rewrite. Remove for direct mode.");
  else ok("No /clerk/* rewrites in next.config.mjs");
}

function checkMiddleware() {
  head("Middleware & Sign routes");
  const mw = readIfExists(files.apiMiddleware) || "";
  if (!mw) { warn("No middleware.ts in apps/api — that's fine if not used."); return; }
  const usesClerk = /withClerkMiddleware|clerkMiddleware/.test(mw);
  if (usesClerk) ok("Middleware uses Clerk — ensure it doesn't block SPA static assets");
  else warn("Middleware present but not using Clerk — confirm your protection strategy");
}

function summaryHints() {
  head("Actionable Hints");
  console.log(`
1) If console shows "Clerk configuration: { frontendApi: '', proxyUrl: '' }":
   → Your app is **not** receiving publishableKey at runtime. Fix either:
     - Build-time: set VITE_CLERK_PUBLISHABLE_KEY in apps/web/.env.local
     - Runtime: ensure /env.js is generated and index.html includes <script src="/env.js"></script>
     - Verify main.tsx uses:
         const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || (window as any)?.ENV?.CLERK_PUBLISHABLE_KEY;
         <ClerkProvider publishableKey={PUBLISHABLE_KEY}>...</ClerkProvider>

2) If you see requests to https://clerk.adminer.online/npm/@clerk/clerk-js...:
   → There's still an external <script> tag or a 'clerkJSUrl' in code. Remove it.

3) If build logs say "Reverse-proxy mode: Clerk calls routed through /clerk/*":
   → Your CSP checker or next.config.mjs still configures proxy. Remove proxy rewrites and relax CSP to allow official Clerk domains.

4) Minimal sanity test page (no auth wrapping):
   - In App.tsx, render <UserButton/> behind <SignedIn/> and <SignInButton/> behind <SignedOut/>. If isLoaded stays false, keys are missing.

5) After changes:
   - Rebuild SPA, ensure env.js is copied to apps/api/public
   - Open DevTools > Network and verify clerk-js loads from *.clerk.com (or your chosen official domain), not your custom host.
`);
}

(function main() {
  console.log("\n🩺 Clerk One‑Shot Wiring Debugger\n");
  checkEnvVars();
  checkIndexHtml();
  checkMainTsx();
  checkCspAndProxy();
  checkMiddleware();
  summaryHints();
  console.log("\nDone.\n");
})(); 