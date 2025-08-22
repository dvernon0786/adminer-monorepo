#!/usr/bin/env node

import fg from "fast-glob";
import fs from "fs";
import path from "path";

type Pattern = { id: string; regex: string };
type Config = {
  include: string[];
  exclude: string[];
  whitelist: string[];
  patterns: Pattern[];
};

const root = process.cwd();
const configPath = path.join(root, "tools", "hardcoded-scan.config.json");

if (!fs.existsSync(configPath)) {
  console.error(`❌ Config file not found: ${configPath}`);
  process.exit(1);
}

const config: Config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const whitelistRegexes = config.whitelist.map((w) => new RegExp(w));

function isWhitelisted(s: string): boolean {
  return whitelistRegexes.some((re) => re.test(s));
}

// Add this small helper near the top:
function isDocsFile(file: string) {
  return file.endsWith(".md") || file.includes("/docs/") || file.includes("hardcoded-scan.config.json");
}

function* iterLines(content: string) {
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    yield { num: i + 1, text: lines[i] };
  }
}

async function main() {
  console.log("🔍 Scanning for hardcoded values, placeholders, and security risks...");
  console.log(`📁 Root directory: ${root}`);
  console.log(`⚙️  Config file: ${configPath}`);
  console.log("");

  const entries = await fg(config.include, { ignore: config.exclude, dot: true });
  const patterns = config.patterns.map((p) => ({ id: p.id, re: new RegExp(p.regex, "g") }));

  console.log(`📋 Found ${entries.length} files to scan`);
  console.log(`🔍 Using ${patterns.length} detection patterns`);
  
  // Show what patterns we're looking for
  console.log("\n🎯 Detection patterns:");
  for (const pattern of config.patterns.slice(0, 10)) { // Show first 10 patterns
    console.log(`   • ${pattern.id}: ${pattern.regex.substring(0, 50)}${pattern.regex.length > 50 ? '...' : ''}`);
  }
  if (config.patterns.length > 10) {
    console.log(`   • ... and ${config.patterns.length - 10} more patterns`);
  }
  console.log("");

  const findings: Array<{
    file: string;
    line: number;
    id: string;
    match: string;
    context: string;
  }> = [];

  let filesScanned = 0;
  let filesWithIssues = 0;

  // Show sample files being scanned
  console.log("📄 Sample files being scanned:");
  for (let i = 0; i < Math.min(5, entries.length); i++) {
    const relativePath = path.relative(root, entries[i]);
    console.log(`   • ${relativePath}`);
  }
  if (entries.length > 5) {
    console.log(`   • ... and ${entries.length - 5} more files`);
  }
  console.log("");

  for (const file of entries) {
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue;
    
    filesScanned++;
    let content: string;
    
    try {
      content = fs.readFileSync(file, "utf8");
    } catch (error) {
      console.warn(`⚠️  Could not read file: ${file}`);
      continue;
    }



    let fileHasIssues = false;

    for (const { num, text } of iterLines(content)) {
      for (const { id, re } of patterns) {
        re.lastIndex = 0;
        let m: RegExpExecArray | null;
        
        while ((m = re.exec(text)) !== null) {
          const matched = m[0];
          
          // Skip matches that are in whitelist
          if (isWhitelisted(matched)) continue;
          
          // Skip placeholder noise in docs, but still catch other patterns (keys/urls etc.)
          if (isDocsFile(file) && (id === "PLACEHOLDER_GENERIC")) {
            continue;
          }
          
          // Get some context around the match
          const start = Math.max(0, m.index - 20);
          const end = Math.min(text.length, m.index + matched.length + 20);
          const context = text.slice(start, end).replace(/\n/g, ' ').trim();
          
          findings.push({ 
            file, 
            line: num, 
            id, 
            match: matched.slice(0, 200),
            context: `...${context}...`
          });
          
          fileHasIssues = true;
        }
      }
    }

    if (fileHasIssues) {
      filesWithIssues++;
    }
  }

  console.log(`📊 Scan complete!`);
  console.log(`   Files scanned: ${filesScanned}`);
  console.log(`   Files with issues: ${filesWithIssues}`);
  console.log(`   Total findings: ${findings.length}`);
  console.log("");

  if (findings.length > 0) {
    console.error("❌ Hardcoded/placeholder findings detected:");
    console.error("=" * 80);
    
    // Group findings by type
    const groupedFindings = findings.reduce((acc, finding) => {
      if (!acc[finding.id]) acc[finding.id] = [];
      acc[finding.id].push(finding);
      return acc;
    }, {} as Record<string, typeof findings>);

    for (const [id, groupFindings] of Object.entries(groupedFindings)) {
      console.error(`\n🔴 ${id} (${groupFindings.length} findings):`);
      console.error("-" * 40);
      
      for (const f of groupFindings) {
        const relativePath = path.relative(root, f.file);
        console.error(`  📍 ${relativePath}:${f.line} | ${f.match}`);
        console.error(`     Context: ${f.context}`);
        console.error("");
      }
    }

    console.error(`\n💡 Recommendations:`);
    console.error(`   • Review all findings above`);
    console.error(`   • Add legitimate strings to whitelist in ${configPath}`);
    console.error(`   • Replace placeholders with proper values`);
    console.error(`   • Remove hardcoded secrets/tokens`);
    console.error(`   • Use environment variables for configuration`);
    
    process.exit(1);
  } else {
    console.log("✅ No hardcoded values/placeholders detected.");
    console.log("🎉 Your repository is clean!");
  }
}

main().catch((e) => {
  console.error("💥 Scanner error:", e);
  process.exit(1);
}); 