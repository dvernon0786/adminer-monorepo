#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$SCRIPT_DIR"
WEB_DIR="$SCRIPT_DIR/../web"
PUBLIC_DIR="$API_DIR/public"

# Handle case where script runs from root (Vercel environment)
if [[ "$SCRIPT_DIR" == "/vercel/path0" ]]; then
  API_DIR="/vercel/path0/adminer/apps/api"
  WEB_DIR="/vercel/path0/adminer/apps/web"
  PUBLIC_DIR="$API_DIR/public"
# Handle case where script runs from API directory in Vercel
elif [[ "$SCRIPT_DIR" == "/vercel/path0/adminer/apps/api" ]]; then
  API_DIR="$SCRIPT_DIR"
  WEB_DIR="/vercel/path0/adminer/apps/web"
  PUBLIC_DIR="$API_DIR/public"
fi

say() { printf "%s\n" "$*"; }

install_deps_and_build() {
  local dir="$1" build_cmd="$2"
  cd "$dir"

  if command -v pnpm >/dev/null 2>&1 && [ -f pnpm-lock.yaml ]; then
    say "📦 Using pnpm in $dir"
    pnpm install --frozen-lockfile
    pnpm run "$build_cmd"
  elif [ -f package-lock.json ]; then
    say "📦 Using npm (lockfile) in $dir"
    npm ci --include=dev
    npm run "$build_cmd"
  else
    say "📦 Using npm (no lockfile) in $dir"
    npm install --include=dev
    npm run "$build_cmd"
  fi
}

say "🚀 Unified build start: $API_DIR"
say "📁 Web directory: $WEB_DIR"
say "📁 Public directory: $PUBLIC_DIR"

# 1) Build Vite SPA
[ -d "$WEB_DIR" ] || { echo "❌ WEB_DIR not found: $WEB_DIR"; ls -la "$(dirname "$WEB_DIR")" || true; exit 1; }
say "🏗️ Building SPA (Vite) ..."
install_deps_and_build "$WEB_DIR" build   # expects "build" script in @adminer/web

# 2) Copy SPA to Next public/
say "📋 Copying SPA → $PUBLIC_DIR"
rm -rf "$PUBLIC_DIR"/*
mkdir -p "$PUBLIC_DIR"
cp -r "$WEB_DIR/dist/"* "$PUBLIC_DIR/"

[ -f "$PUBLIC_DIR/index.html" ] || { echo "❌ index.html missing in public/"; ls -la "$PUBLIC_DIR" || true; exit 1; }
say "✅ SPA files present"

# 3) Build Next API app
say "🏗️ Building Next API ..."
install_deps_and_build "$API_DIR" build   # expects "build" script = next build

say "🎉 Unified build completed" 