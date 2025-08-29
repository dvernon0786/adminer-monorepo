#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.."; pwd)"

npm -C "$ROOT/adminer/apps/web" install
npm -C "$ROOT/adminer/apps/web" run build

rm -rf "$ROOT/adminer/apps/api/public"
mkdir -p "$ROOT/adminer/apps/api/public"
cp -r "$ROOT/adminer/apps/web/dist/"* "$ROOT/adminer/apps/api/public/"

HTML="$ROOT/adminer/apps/api/public/index.html"
test -f "$HTML"

JS_REF=$(grep -oE '/assets/index-[A-Za-z0-9]+\.js' "$HTML" | head -n1 || true)
if [[ -z "${JS_REF:-}" ]] || [[ ! -f "$ROOT/adminer/apps/api/public${JS_REF}" ]]; then
  echo "❌ Guard: index.html → ${JS_REF:-<none>} missing"; exit 1
fi
if grep -q "https://clerk\.adminer\.online" "$HTML"; then
  echo "❌ Guard: proxy leak in index.html"; exit 1
fi
if ! grep -qE 'pk_(test|live)_' "$ROOT/adminer/apps/api/public${JS_REF}"; then
  echo "❌ Guard: Clerk key not detected in bundle"; exit 1
fi
echo "✅ Guard OK: ${JS_REF}" 