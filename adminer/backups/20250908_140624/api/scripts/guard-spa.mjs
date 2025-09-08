import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const must = [
  join(__dirname, "../public/index.html"),
  join(__dirname, "../public/assets"),
];

for (const p of must) {
  if (!existsSync(p)) {
    throw new Error(`Missing ${p}. Did web build + copy run?`);
  }
}

console.log("✅ SPA assets present");
console.log("   - index.html: ✓");
console.log("   - assets/: ✓"); 