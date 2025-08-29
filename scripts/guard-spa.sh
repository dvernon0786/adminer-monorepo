#!/usr/bin/env bash
set -euo pipefail
HTML="adminer/apps/api/public/index.html"
test -f "$HTML"
JS_REF=$(grep -oE '/assets/index-[A-Za-z0-9]+\.js' "$HTML" | head -n1)
test -f "adminer/apps/api/public${JS_REF}"
echo "✅ Local guard: ${JS_REF} exists" 