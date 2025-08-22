/* apps/api/scripts/check-spa-paths.cjs */
const fs = require("node:fs");
const fsp = fs.promises;
const path = require("node:path");

const apiPublic = path.resolve(__dirname, "..", "public");
const indexPath = path.join(apiPublic, "index.html");

const log = (...a) => console.log("[check-spa-paths]", ...a);

(async () => {
  try {
    if (!fs.existsSync(indexPath)) {
      throw new Error(`Missing ${indexPath}. Did spa:integrate run?`);
    }
    let html = await fsp.readFile(indexPath, "utf8");

    // Hard fail if any bad prefixes remain
    const BAD = ["/public/assets/", "public/assets/"];
    for (const bad of BAD) {
      if (html.includes(bad)) {
        throw new Error(`Found bad asset prefix "${bad}" in index.html`);
      }
    }

    // Extract assets referenced via href/src that begin with /assets/
    const assetPaths = new Set();
    const re = /\s(?:href|src)=["'](\/assets\/[^"']+)["']/g;
    let m;
    while ((m = re.exec(html))) assetPaths.add(m[1]);

    // Verify each asset exists under apps/api/public
    const missing = [];
    for (const a of assetPaths) {
      const fsPath = path.join(apiPublic, a);
      if (!fs.existsSync(fsPath)) missing.push(a);
    }

    if (missing.length) {
      throw new Error(
        `Missing ${missing.length} asset(s):\n` + missing.map((x) => ` - ${x}`).join("\n")
      );
    }

    log(`OK: ${assetPaths.size} assets validated, index.html clean ✅`);
  } catch (err) {
    console.error("Post-build SPA path check failed ❌\n", err?.message || err);
    process.exit(1);
  }
})(); 