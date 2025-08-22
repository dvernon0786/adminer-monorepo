import { spawnSync } from "node:child_process";

const steps = [
  ["==== [Prebuild Guard: Dodo] ====", "scripts/guard-dodo-env.js"],
  ["==== [Prebuild Guard: Clerk] ====", "scripts/guard-clerk-env.js"],
];

for (const [banner, file] of steps) {
  console.log("\n" + banner + "\n");
  const proc = spawnSync(process.execPath, [file], { stdio: "inherit" });
  if (proc.status !== 0) process.exit(proc.status ?? 1);
}

console.log("\n==== [Prebuild Guards: All Passed] ====\n"); 