#!/usr/bin/env bash
set -euxo pipefail

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "🚀 Starting unified Vercel build from: $SCRIPT_DIR"

# Ensure we're in the API directory
cd "$SCRIPT_DIR"

# Define paths relative to the API directory
WEB_DIR="$SCRIPT_DIR/../web"
echo "📁 Web directory: $WEB_DIR"

# Check if web directory exists
if [ ! -d "$WEB_DIR" ]; then
  echo "❌ Error: Web directory not found at $WEB_DIR"
  ls -la "$SCRIPT_DIR/.."
  exit 1
fi

# 1) Build the Vite SPA
echo "📦 Building Vite SPA..."
cd "$WEB_DIR"
if command -v pnpm &> /dev/null; then
  pnpm install --frozen-lockfile
  pnpm build
else
  npm ci --include=dev
  npm run build
fi

# 2) Copy SPA build into Next public/
echo "📋 Copying SPA build to public directory..."
cd "$SCRIPT_DIR"
rm -rf public/*
mkdir -p public
cp -r "$WEB_DIR/dist"/* public/

# Verify SPA files are in place
if [ ! -f public/index.html ]; then
  echo "❌ Error: SPA index.html not found in public directory"
  ls -la public/
  exit 1
fi

echo "✅ SPA files copied successfully"

# 3) Build the Next.js API app
echo "🏗️ Building Next.js API app..."
cd "$SCRIPT_DIR"
if command -v pnpm &> /dev/null; then
  pnpm install --frozen-lockfile
  pnpm build
else
  npm ci --include=dev
  npm run build
fi

echo "🎉 Unified build completed successfully!"
echo "📁 SPA files available in: public/"
echo "📁 Next.js build available in: .next/" 