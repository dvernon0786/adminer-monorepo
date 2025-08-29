#!/usr/bin/env bash
set -euo pipefail
HTML="adminer/apps/api/public/index.html"
[ -f "$HTML" ] || { echo "❌ no index.html"; exit 1; }
JS_REF="$(grep -oE '/assets/index-[A-Za-z0-9]+\.js' "$HTML" | head -n1 || true)"
[ -n "${JS_REF:-}" ] || { echo "❌ no main bundle ref"; exit 1; }
[ -f "adminer/apps/api/public${JS_REF}" ] || { echo "❌ bundle missing: ${JS_REF}"; exit 1; }
! grep -q "https://clerk\.adminer\.online" "$HTML" || { echo "❌ proxy leak in HTML"; exit 1; }
echo "✅ Local guard OK: ${JS_REF}" 