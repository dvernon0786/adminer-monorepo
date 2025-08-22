import fs from "node:fs";
import { config } from "dotenv";

// Load .env.local file
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env.local");
config({ path: envPath, override: true });

const required = ["DODO_API_KEY", "DODO_FREE_PRODUCT_ID"];
console.log("Environment variables found:", Object.keys(process.env).filter(k => k.startsWith('DODO_')));
console.log("DODO_API_KEY:", process.env.DODO_API_KEY ? "SET" : "MISSING");
console.log("DODO_FREE_PRODUCT_ID:", process.env.DODO_FREE_PRODUCT_ID ? "SET" : "MISSING");

const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error("Missing Dodo env:", missing.join(", "));
  process.exit(1);
}

// (optional) lock format—no blank assignment
const envFile = "apps/api/.env.local";
if (fs.existsSync(envFile)) {
  const text = fs.readFileSync(envFile, "utf8");
  if (/^DODO_FREE_PRODUCT_ID=$/m.test(text)) {
    console.error("DODO_FREE_PRODUCT_ID has empty value in .env.local");
    process.exit(1);
  }
}

console.log("✅ Dodo environment variables validated"); 