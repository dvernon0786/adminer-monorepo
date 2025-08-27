#!/usr/bin/env bash
set -euxo pipefail

# Ensure we're in apps/api
cd "$(dirname "$0")"

echo "🚀 Starting unified Vercel build..."

# 1) Build the Vite SPA
echo "📦 Building Vite SPA..."
pushd ../web
if command -v pnpm &> /dev/null; then
  pnpm install --frozen-lockfile
  pnpm build
else
  npm ci --include=dev
  npm run build
fi
popd

# 2) Copy SPA build into Next public/
echo "📋 Copying SPA build to public directory..."
rm -rf public/*
mkdir -p public
cp -r ../web/dist/* public/

# Verify SPA files are in place
if [ ! -f public/index.html ]; then
  echo "❌ Error: SPA index.html not found in public directory"
  exit 1
fi

echo "✅ SPA files copied successfully"

# 3) Build the Next.js API app
echo "🏗️ Building Next.js API app..."
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