import { cpSync, existsSync, rmSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const src = join(__dirname, "../../web/dist");
const dst = join(__dirname, "../public");

if (!existsSync(src)) {
  throw new Error("Web dist missing. Run: npm --prefix ../web run build");
}

// Clean and recreate destination
rmSync(dst, { recursive: true, force: true });
mkdirSync(dst, { recursive: true });

// Copy SPA build
cpSync(src, dst, { recursive: true });

console.log("✅ Copied SPA → apps/api/public");
console.log(`   Source: ${src}`);
console.log(`   Destination: ${dst}`); 