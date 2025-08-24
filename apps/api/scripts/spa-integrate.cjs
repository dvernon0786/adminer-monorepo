// apps/api/scripts/spa-integrate.cjs
const { execSync } = require("node:child_process");
const { existsSync, readFileSync, readdirSync, cpSync, mkdirSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

function run(cmd, opts = {}) {
  console.log(`[spa:integrate] $ ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

function tryRun(cmd, opts = {}) {
  try { run(cmd); return true; } catch { return false; }
}

(function main() {
  console.log("[spa:integrate] Preflight check...");

  const apiCwd = process.cwd();
  const webDir = join(apiCwd, "..", "web");
  const pkgFile = join(webDir, "package.json");

  if (!existsSync(pkgFile)) {
    throw new Error("[spa:integrate] ERROR: apps/web/package.json not found.");
  }

  const pkg = JSON.parse(readFileSync(pkgFile, "utf8"));
  if (!pkg.scripts || !pkg.scripts.build || !pkg.scripts.build.includes("vite build")) {
    throw new Error('[spa:integrate] ERROR: apps/web/package.json must contain build script with "vite build".');
  }

  console.log("[spa:integrate] Preflight passed ✅");
  console.log("[spa:integrate] Building SPA (@adminer/web)...");

  // 1) Try workspace build first (works locally when root install covered it)
  const builtWithWorkspace = tryRun("npm run build --workspace @adminer/web");

  // 2) Fallback: force install devDependencies in apps/web, then build
  if (!builtWithWorkspace) {
    console.warn("[spa:integrate] Workspace build failed; forcing dev deps install in apps/web...");

    const envWithDev = {
      ...process.env,
      NODE_ENV: "development",
      NPM_CONFIG_PRODUCTION: "false"
    };

    // Prefer npm v9/10 flag when available; keep env fallback for reliability
    // This will install dev deps even in Vercel's production environment.
    run("npm install --prefix ../web --include=dev", { env: envWithDev });

    // Build using npx so we don't rely on script PATH resolution quirks
    if (!tryRun("npx --yes --prefix ../web vite build", { env: envWithDev })) {
      // As a backup, try the package script
      run("npm run build --prefix ../web", { env: envWithDev });
    }
  }

  // 3) Post-build sanity checks
  const distDir = join(webDir, "dist");
  if (!existsSync(distDir)) {
    throw new Error("[spa:integrate] ERROR: SPA build completed but dist/ folder not found.");
  }
  if (readdirSync(distDir).length === 0) {
    throw new Error("[spa:integrate] ERROR: SPA build completed but dist/ folder is empty.");
  }

  // 4) Copy dist → apps/api/public (with cache busting)
  const publicDir = join(apiCwd, "public");
  
  // Clear any existing assets to prevent cache issues
  if (existsSync(publicDir)) {
    const assetsDir = join(publicDir, "assets");
    if (existsSync(assetsDir)) {
      console.log("[spa:integrate] Clearing existing assets to prevent cache issues...");
      require("fs").rmSync(assetsDir, { recursive: true, force: true });
    }
  }
  
  mkdirSync(publicDir, { recursive: true });
  cpSync(distDir, publicDir, { recursive: true });

  // Debug: Check what was actually copied and verify paths
  console.log(`[spa:integrate] Copied SPA build to ${publicDir} ✅`);
  console.log(`[spa:integrate] Current working directory: ${process.cwd()}`);
  console.log(`[spa:integrate] API directory: ${apiCwd}`);
  console.log(`[spa:integrate] Web directory: ${webDir}`);
  console.log(`[spa:integrate] Dist directory: ${distDir}`);
  
  // List what was actually copied
  const copiedFiles = readdirSync(publicDir);
  console.log(`[spa:integrate] Files in public directory:`, copiedFiles);
  
  // Check if assets directory exists and what's in it
  const assetsDir = join(publicDir, "assets");
  if (existsSync(assetsDir)) {
    const assetFiles = readdirSync(assetsDir);
    console.log(`[spa:integrate] Files in assets directory:`, assetFiles);
  }
  
  // Verify the copied index.html has correct asset paths
  const copiedIndexPath = join(publicDir, "index.html");
  if (existsSync(copiedIndexPath)) {
    const copiedHtml = readFileSync(copiedIndexPath, "utf8");
    const assetMatches = copiedHtml.match(/(src|href)=["']([^"']+)["']/g) || [];
    console.log(`[spa:integrate] Asset paths in copied index.html:`);
    assetMatches.forEach(match => {
      if (match.includes('/assets/') || match.includes('/public/')) {
        console.log(`  ${match}`);
      }
    });
  }

  // 5) Write a clean env.js that **never** exposes proxy hints and pins Clerk JS URL
  const envJsPath = join(publicDir, "env.js");
  
  // Try multiple environment variable sources for Vercel compatibility
  const publishable = process.env.CLERK_PUBLISHABLE_KEY || 
                      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 
                      "";
  
  console.log(`[spa:integrate] Environment check - CLERK_PUBLISHABLE_KEY: ${publishable ? 'SET' : 'NOT SET'}`);
  console.log(`[spa:integrate] Available env vars: ${Object.keys(process.env).filter(k => k.includes('CLERK')).join(', ')}`);
  
  if (!publishable) {
    console.error("[spa:integrate] Missing CLERK_PUBLISHABLE_KEY - cannot generate env.js");
    console.error("[spa:integrate] This will cause client-side errors. Check Vercel environment variables.");
    // Don't exit - let the build continue but warn about the issue
    console.warn("[spa:integrate] Continuing build without env.js - authentication will fail!");
    
    // Write a minimal env.js with error message
    const ENV = {
      CLERK_PUBLISHABLE_KEY: "",
      CLERK_JS_URL: "https://clerk.com/npm/@clerk/clerk-js@5/dist/clerk.browser.js",
      ERROR: "Missing CLERK_PUBLISHABLE_KEY - check Vercel environment variables"
    };
    
    writeFileSync(
      envJsPath,
      `// Generated at build - DO NOT EDIT\n` +
        `// ERROR: Missing CLERK_PUBLISHABLE_KEY\n` +
        `window.env = ${JSON.stringify(ENV, null, 2)};\n`,
      "utf8"
    );
    console.log("[spa:integrate] Wrote error env.js - authentication will fail!");
    return;
  }

  const ENV = {
    CLERK_PUBLISHABLE_KEY: publishable,
    // Expose the pinned script URL so the SPA can double‑check if desired
    CLERK_JS_URL: "https://clerk.com/npm/@clerk/clerk-js@5/dist/clerk.browser.js",
  };

  writeFileSync(
    envJsPath,
    `// Generated at build - DO NOT EDIT\n` +
      `window.env = ${JSON.stringify(ENV, null, 2)};\n`,
    "utf8"
  );
  console.log("[spa:integrate] Re-wrote env.js post-copy ✅");

  // 6) Re-order scripts in index.html so env.js always loads before the SPA bundle
  const index = join(publicDir, 'index.html');
  let html = readFileSync(index, 'utf8');

  // 1) Remove any existing env.js tag so we can deterministically inject it first
  html = html.replace(/<script[^>]+src="\/env\.js[^"]*"[^>]*><\/script>\s*/g, '');

  // 2) Inject env.js immediately after <head> to guarantee availability
  html = html.replace(
    /<head>/i,
    `<head>\n  <script src="/env.js" crossorigin="anonymous"></script>`
  );

  // 3) Optional: small inline **sanity fallback** (won't run if key is present)
  html = html.replace(
    /<\/head>/i,
    `  <script>
      if (!window.env || !window.env.CLERK_PUBLISHABLE_KEY) {
        console.error('env.js missing CLERK_PUBLISHABLE_KEY (fallback inline set)');
        window.env = { CLERK_PUBLISHABLE_KEY: "${(process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}" };
      }
    </script>\n</head>`
  );

  writeFileSync(index, html, 'utf8');
  console.log('[spa:integrate] ✅ Ensured env.js loads before bundle');
})(); 