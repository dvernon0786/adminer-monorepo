/* apps/api/scripts/spa-integrate.cjs */
const { execSync } = require("node:child_process");
const { existsSync, readFileSync, readdirSync, cpSync, mkdirSync } = require("node:fs");
const path = require("node:path");
const { join } = path;

const repoRoot = path.resolve(__dirname, "..", "..", "..");
const webDir = path.join(repoRoot, "apps", "web");
const webDist = path.join(webDir, "dist");
const apiPublic = path.join(repoRoot, "apps", "api", "public");

const log = (...a) => console.log("[spa:integrate]", ...a);
const run = (cmd, opts = {}) => {
  log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
};

const tryRun = (cmd, opts = {}) => {
  try {
    run(cmd, opts);
    return true;
  } catch {
    return false;
  }
};

(async () => {
  try {
    log("Preflight check...");

    // Check if apps/web/package.json exists
    const pkgFile = join(webDir, "package.json");
    if (!existsSync(pkgFile)) {
      throw new Error("ERROR: apps/web/package.json not found.");
    }

    // Verify the build script is correct
    const pkg = JSON.parse(readFileSync(pkgFile, "utf8"));
    if (!pkg.scripts || pkg.scripts.build !== "vite build") {
      throw new Error('ERROR: apps/web/package.json must contain `"build": "vite build"` in scripts.');
    }

    log("Preflight passed ✅");

    log("Building SPA (@adminer/web)...");

    // 1) First attempt: workspace build (works locally if root install covered it)
    const builtWithWorkspace = tryRun(`npm run build --workspace @adminer/web`, { cwd: repoRoot });

    // 2) Fallback: install web deps in isolation, then build
    if (!builtWithWorkspace) {
      log("Workspace build failed; installing web deps directly...");
      run(`npm install --prefix apps/web`, { cwd: repoRoot });
      run(`npm run build --prefix apps/web`, { cwd: repoRoot });
    }

    // 3) Post-build sanity check
    if (!existsSync(webDist)) {
      throw new Error("ERROR: SPA build completed but dist/ folder not found.");
    }
    
    const distContents = readdirSync(webDist);
    if (distContents.length === 0) {
      throw new Error("ERROR: SPA build completed but dist/ folder is empty.");
    }

    log(`SPA build completed with ${distContents.length} items ✅`);

    // 4) Copy dist → apps/api/public
    log("Syncing dist → apps/api/public ...");
    mkdirSync(apiPublic, { recursive: true });

    // Clean existing public directory but keep the directory itself
    for (const name of distContents) {
      const publicPath = join(apiPublic, name);
      if (existsSync(publicPath)) {
        const stats = require("node:fs").statSync(publicPath);
        if (stats.isDirectory()) {
          require("node:fs").rmSync(publicPath, { recursive: true, force: true });
        } else {
          require("node:fs").unlinkSync(publicPath);
        }
      }
    }

    // Copy all files from dist to public
    cpSync(webDist, apiPublic, { recursive: true });

    // 5) Fix asset paths in index.html
    const indexPath = join(apiPublic, "index.html");
    if (existsSync(indexPath)) {
      let html = readFileSync(indexPath, "utf8");

      // Fix common incorrect prefixes that cause MIME text/html for CSS/JS:
      // - "/public/assets/*" → "/assets/*"
      // - "public/assets/*"  → "/assets/*"
      // - "./assets/*"       → "/assets/*" (absolute so Next serves from /public/assets/)
      // - "assets/*"         → "/assets/*" (normalize)
      html = html
        .replace(/\/public\/assets\//g, "/assets/")
        .replace(/(["'(])public\/assets\//g, "$1/assets/")
        .replace(/(["'(])\.\/assets\//g, "$1/assets/")
        .replace(/(["'(])assets\//g, "$1/assets/");

      require("node:fs").writeFileSync(indexPath, html, "utf8");
      log("Fixed asset paths in index.html ✅");
    }

    log("SPA integrated successfully ✅");
  } catch (err) {
    console.error("SPA integration failed ❌\n", err?.stack || err);
    process.exit(1);
  }
})(); 