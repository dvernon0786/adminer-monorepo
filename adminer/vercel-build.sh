#!/usr/bin/env bash
set -euo pipefail
echo "Cache bust: $(date -u)"

# Move to repo root (folder containing this script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

API_DIR="apps/api"
PUBLIC_DIR="$API_DIR/public"
WEB_DIR="apps/web"

# ---------- HARD CLEAN public ----------
echo "🧹 Cleaning public directory..."
rm -rf "$PUBLIC_DIR" || true
mkdir -p "$PUBLIC_DIR"

# ---------- Build SPA if not already built ----------
if [ -d "$WEB_DIR/dist" ]; then
  echo "✅ SPA already built at $WEB_DIR/dist"
else
  echo "➡️ Building SPA at: $WEB_DIR"
  if [ -f "$WEB_DIR/package.json" ]; then
    (cd "$WEB_DIR" && npm run build)
  else
    echo "❌ No package.json found at $WEB_DIR"
    exit 1
  fi
fi

# ---------- Copy SPA artifacts to API public ----------
if [ -d "$WEB_DIR/dist" ]; then
  echo "➡️ Copying SPA artifacts from $WEB_DIR/dist -> $PUBLIC_DIR"
  # Use rsync to avoid glob expansion issues
  rsync -a "$WEB_DIR/dist"/ "$PUBLIC_DIR"/
  echo "✅ SPA artifacts copied successfully"
else
  echo "❌ Expected $WEB_DIR/dist after build, but it was not found."
  exit 1
fi

# ---------- Tripwire: forbid stale Clerk proxy bits in built artifacts ----------
echo "🔎 Scanning built artifacts for forbidden Clerk proxy config..."
if rg -n "(clerkJSUrl|proxyUrl|__clerk_proxy_url|CLERK_FRONTEND_API)" "$PUBLIC_DIR" 2>/dev/null; then
  echo "❌ Forbidden Clerk proxy references found in built artifacts. Aborting."
  exit 1
else
  echo "✅ Built artifacts are clean."
fi

# ---------- Build API (Next.js) ----------
echo "➡️ Building @adminer/api (from $API_DIR)"
(cd "$API_DIR" && npm run build)

echo "✅ Build completed" 