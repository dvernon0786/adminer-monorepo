#!/usr/bin/env bash
set -euo pipefail

echo "Cache bust: $(date -u)"

# Go to repo root (folder containing this script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ---- HARD CLEAN old public assets to avoid stale Clerk bits
rm -rf adminer/apps/api/public/* || true
mkdir -p adminer/apps/api/public

# ---- Build SPA
if npm run -ws --silent | grep -q "@adminer/web"; then
  echo "➡️ Building @adminer/web"
  npm run -w @adminer/web build
else
  echo "ℹ️ @adminer/web workspace not found, skipping"
fi

# ---- Copy fresh SPA into API public
cp -R adminer/apps/web/dist/* adminer/apps/api/public/

# ---- Fail build if any forbidden Clerk proxy config appears in built assets
echo "🔎 Scanning built artifacts for forbidden Clerk proxy config..."
if rg -n "(clerkJSUrl|proxyUrl|__clerk_proxy_url|CLERK_FRONTEND_API)" adminer/apps/api/public 2>/dev/null; then
  echo "❌ Forbidden Clerk proxy references found in built artifacts. Aborting."
  exit 1
else
  echo "✅ Built artifacts are clean."
fi

# ---- OPTIONAL PREBUILD FOR API ---
if npm run -w @adminer/api --silent | grep -q "^  prebuild"; then
  echo "➡️ Prebuilding @adminer/api"
  npm run -w @adminer/api prebuild
else
  echo "ℹ️ No prebuild in @adminer/api, skipping"
fi

# ---- BUILD API ---
echo "➡️ Building @adminer/api"
npm run -w @adminer/api build

# ---- SPA INTEGRATION ---
if npm run -w @adminer/api --silent | grep -q "^  spa:integrate"; then
  echo "➡️ Running SPA integration"
  npm run -w @adminer/api spa:integrate
else
  echo "ℹ️ No spa:integrate in @adminer/api, skipping"
fi

echo "✅ Build completed" 