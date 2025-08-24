// apps/api/scripts/spa-integrate.cjs
const { execSync } = require("node:child_process");
const { existsSync, readFileSync, readdirSync, cpSync, mkdirSync } = require("node:fs");
const { join } = require("node:path");

function run(cmd, opts = {}) {
  console.log(`[spa:integrate] $ ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

function tryRun(cmd, opts = {}) {
  try { run(cmd, opts); return true; } catch { return false; }
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
    
    // Check for any /public/ references that shouldn't be there
    if (copiedHtml.includes('/public/')) {
      console.warn(`[spa:integrate] WARNING: Found /public/ references in index.html!`);
    }
  }
})(); 