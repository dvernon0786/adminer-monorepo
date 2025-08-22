/* apps/api/scripts/spa-integrate.cjs */
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const fsp = fs.promises;
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..", "..", "..");
const webDir = path.join(repoRoot, "apps", "web");
const webDist = path.join(webDir, "dist");
const apiPublic = path.join(repoRoot, "apps", "api", "public");

const log = (...a) => console.log("[spa:integrate]", ...a);
const run = (cmd, opts = {}) => execSync(cmd, { stdio: "inherit", ...opts });

(async () => {
  try {
    log("Building SPA (@adminer/web)...");
    // Prefer workspace, gracefully fallback
    try {
      run(`npm --workspace @adminer/web run build`, { cwd: repoRoot });
    } catch {
      log("Workspace build failed; trying direct build in apps/web...");
      run(`npm run build`, { cwd: webDir });
    }

    // Sanity check: dist exists
    if (!fs.existsSync(webDist)) {
      throw new Error(`Missing ${webDist}. Did the web build succeed?`);
    }

    // Ensure public/ exists and is clean
    await fsp.mkdir(apiPublic, { recursive: true });

    // Copy dist -> apps/api/public (replace fully)
    log("Syncing dist → apps/api/public ...");
    // lightweight rm -rf for public, but keep directory
    for (const name of await fsp.readdir(apiPublic)) {
      await fsp.rm(path.join(apiPublic, name), { recursive: true, force: true });
    }

    // Copy all files
    const copyRecursive = async (src, dest) => {
      const stats = await fsp.stat(src);
      if (stats.isDirectory()) {
        await fsp.mkdir(dest, { recursive: true });
        for (const entry of await fsp.readdir(src)) {
          await copyRecursive(path.join(src, entry), path.join(dest, entry));
        }
      } else {
        await fsp.copyFile(src, dest);
      }
    };
    await copyRecursive(webDist, apiPublic);

    // Rewrite asset paths in public/index.html:
    const indexPath = path.join(apiPublic, "index.html");
    let html = await fsp.readFile(indexPath, "utf8");

    // Fix common incorrect prefixes that cause MIME  text/html for CSS/JS:
    // - "/public/assets/*" → "/assets/*"
    // - "public/assets/*"  → "/assets/*"
    // - "./assets/*"       → "/assets/*" (absolute so Next serves from /public/assets/)
    // - "assets/*"         → "/assets/*" (normalize)
    html = html
      .replace(/\/public\/assets\//g, "/assets/")
      .replace(/(["'(])public\/assets\//g, "$1/assets/")
      .replace(/(["'(])\.\/assets\//g, "$1/assets/")
      .replace(/(["'(])assets\//g, "$1/assets/");

    await fsp.writeFile(indexPath, html, "utf8");

    log("SPA integrated successfully ✅");
  } catch (err) {
    console.error("SPA integration failed ❌\n", err?.stack || err);
    process.exit(1);
  }
})(); 