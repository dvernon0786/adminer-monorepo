#!/usr/bin/env bash
set -euo pipefail

ROOT="adminer/apps/api"

if grep -R --line-number -E "next export" "$ROOT/package.json" 2>/dev/null; then
  echo "❌ found 'next export' in package.json"
  exit 1
fi

if [ -f "$ROOT/next.config.mjs" ] && grep -E "output:\s*['\"]export['\"]" "$ROOT/next.config.mjs" >/dev/null; then
  echo "❌ found output: 'export' in next.config.mjs"
  exit 1
fi

if [ -d "$ROOT/out" ]; then
  echo "❌ found 'out/' directory (static export)"
  exit 1
fi

echo "✅ guard passed: no export mode detected" 