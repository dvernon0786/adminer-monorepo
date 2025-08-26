#!/usr/bin/env bash
set -euo pipefail

# Always echo what we do
log() { echo -e "$1"; }

# Resolve paths relative to this script, regardless of where it's called from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$SCRIPT_DIR"              # adminer/
API_DIR="$MONOREPO_ROOT/apps/api"
WEB_DIR="$MONOREPO_ROOT/apps/web"
PUBLIC_DIR="$API_DIR/public"
DIST_DIR="$WEB_DIR/dist"

log "Cache bust: $(date -u)"

# --- Safety checks -----------------------------------------------------------
if [[ ! -f "$API_DIR/package.json" ]]; then
  echo "❌ Expected API at $API_DIR but package.json not found."
  exit 1
fi
if [[ ! -f "$WEB_DIR/package.json" ]]; then
  echo "❌ Expected Web SPA at $WEB_DIR but package.json not found."
  exit 1
fi

# --- Clerk tripwire (keeps proxy regression from sneaking in) ---------------
# If you have a file that must exist / string that must NOT exist, check it here.
# Example guard (adjust to your project needs):
# if grep -R "NEXT_PUBLIC_CLERK_PROXY_URL" "$WEB_DIR" >/dev/null; then
#   echo "❌ Unexpected NEXT_PUBLIC_CLERK_PROXY_URL usage found in SPA."
#   exit 1
# fi

# --- Clean API public dir ----------------------------------------------------
log "🧹 Cleaning public directory..."
rm -rf "$PUBLIC_DIR"
mkdir -p "$PUBLIC_DIR"

# --- Install & Build SPA -----------------------------------------------------
log "➡️ Installing SPA deps at: $WEB_DIR"
pushd "$WEB_DIR" >/dev/null
if [[ -f package-lock.json ]]; then
  npm ci --include=dev
else
  npm install --include=dev
fi

log "🏗  Building SPA (vite) ..."
# Use local vite via npm script so PATH is correct
# Ensure your apps/web/package.json has: "build": "rm -rf dist && vite build"
npm run build
popd >/dev/null

# --- Validate build output ---------------------------------------------------
if [[ ! -d "$DIST_DIR" ]] || [[ -z "$(ls -A "$DIST_DIR" 2>/dev/null || true)" ]]; then
  echo "❌ SPA build produced no files at $DIST_DIR"
  exit 1
fi

# --- Copy artifacts into API public (portable, no rsync) --------------------
log "📦 Copying SPA artifacts from $DIST_DIR → $PUBLIC_DIR"
# Use tar pipe to preserve dotfiles and avoid globbing pitfalls
# Works on Vercel build images (no need for rsync)
tar -C "$DIST_DIR" -cf - . | tar -C "$PUBLIC_DIR" -xpf -

# --- Build Next.js API app so .next/ exists ---------------------------------
log "🧱 Building Next.js API app at: $API_DIR"
pushd "$API_DIR" >/dev/null
if npm run -s | grep -qE '^  build'; then
  npm run build
else
  npx --yes next build
fi
popd >/dev/null

# --- Done -------------------------------------------------------------------
log "✅ Build completed. Public assets ready at: $PUBLIC_DIR and Next .next/ built." 