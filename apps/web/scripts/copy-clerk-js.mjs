// Tiny util to vendor Clerk browser bundle into /public
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, "../../../node_modules/@clerk/clerk-js/dist/clerk.browser.js");
const destDir = resolve(__dirname, "../../public/vendor/clerk");
const dest = resolve(destDir, "clerk.browser.js");

await mkdir(destDir, { recursive: true });
await copyFile(src, dest);
console.log(`[copy-clerk-js] vendored -> ${dest}`); 