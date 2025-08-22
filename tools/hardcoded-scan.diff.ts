import fg from "fast-glob";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

type Pattern = { id: string; regex: string };
type Config = {
  include: string[];
  exclude: string[];
  whitelist: string[];
  patterns: Pattern[];
};

const root = process.cwd();
const configPath = path.join(root, "tools", "hardcoded-scan.config.json");
const config: Config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const whitelistRegexes = config.whitelist.map((w) => new RegExp(w));
const patterns = config.patterns.map((p) => ({ id: p.id, re: new RegExp(p.regex, "g") }));

function isWhitelisted(s: string): boolean {
  return whitelistRegexes.some((re) => re.test(s));
}

function isDocsFile(file: string) {
  return file.endsWith(".md") || file.includes("/docs/");
}

function* iterLines(content: string) {
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) yield { num: i + 1, text: lines[i] };
}

function listStagedFiles(): string[] {
  const out = execSync("git diff --name-only --cached", { encoding: "utf8" }).trim();
  return out.split("\n").filter(Boolean);
}

async function main() {
  const staged = listStagedFiles();
  if (staged.length === 0) {
    console.log("No staged files. Skipping diff scan.");
    process.exit(0);
  }

  // Match staged files against include/exclude globs
  const included = await fg(config.include, { ignore: config.exclude, dot: true });
  const files = staged.filter((f) => included.includes(f) && fs.existsSync(f) && !fs.statSync(f).isDirectory());

  const findings: Array<{ file: string; line: number; id: string; match: string }> = [];

  for (const file of files) {
    let content: string;
    try { content = fs.readFileSync(file, "utf8"); } catch { continue; }

    for (const { num, text } of iterLines(content)) {
      for (const { id, re } of patterns) {
        re.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
          const matched = m[0];
          if (isWhitelisted(matched)) continue;
          if (isDocsFile(file) && id === "PLACEHOLDER_GENERIC") continue; // ignore doc placeholders
          findings.push({ file, line: num, id, match: matched.slice(0, 200) });
        }
      }
    }
  }

  if (findings.length > 0) {
    console.error("❌ Hardcoded/placeholder findings detected (diff):");
    for (const f of findings) console.error(`- [${f.id}] ${f.file}:${f.line}  →  ${f.match}`);
    console.error(`\nTotal findings: ${findings.length}`);
    process.exit(1);
  } else {
    console.log("✅ No issues in staged files.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); }); 