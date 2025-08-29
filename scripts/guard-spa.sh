#!/usr/bin/env bash
set -euo pipefail
ROOT="adminer/apps/api/public"
[[ -f "${ROOT}/index.html" ]] || { echo "❌ Missing ${ROOT}/index.html"; exit 1; }
[[ -d "${ROOT}/assets" ]] || { echo "❌ Missing ${ROOT}/assets/"; exit 1; }
echo "✅ Guard OK: SPA present" 