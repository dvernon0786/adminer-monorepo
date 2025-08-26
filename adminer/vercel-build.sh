#!/usr/bin/env bash
set -euo pipefail

echo "Cache bust: $(date -u)"

# repo root = directory containing this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Install once at monorepo root (Vercel already did npm i, but this is safe)
# npm ci

# --- BUILD WEB (if present) ---
if npm run -ws --silent | grep -q "@adminer/web"; then
  echo "➡️ Building @adminer/web"
  npm run -w @adminer/web build
else
  echo "ℹ️ @adminer/web workspace not found, skipping"
fi

# --- OPTIONAL PREBUILD FOR API ---
if npm run -w @adminer/api --silent | grep -q "^  prebuild"; then
  echo "➡️ Prebuilding @adminer/api"
  npm run -w @adminer/api prebuild
else
  echo "ℹ️ No prebuild in @adminer/api, skipping"
fi

# --- BUILD API ---
echo "➡️ Building @adminer/api"
npm run -w @adminer/api build

# --- SPA INTEGRATION ---
if npm run -w @adminer/api --silent | grep -q "^  spa:integrate"; then
  echo "➡️ Running SPA integration"
  npm run -w @adminer/api spa:integrate
else
  echo "ℹ️ No spa:integrate in @adminer/api, skipping"
fi

echo "✅ Build completed" 