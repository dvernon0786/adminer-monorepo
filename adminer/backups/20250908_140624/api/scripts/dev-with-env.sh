#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Setting up development environment..."

if [ -f ".env.shell" ]; then
  echo "📁 Found .env.shell, sourcing environment variables..."
  source .env.shell
  echo "✅ Environment variables loaded from .env.shell"
else
  echo "⚠️  No .env.shell found"
  echo "💡 Tip: create apps/api/.env.shell and 'source' it to export your envs"
  echo "   cp env.shell.example .env.shell"
  echo "   # Edit .env.shell with your actual values"
  echo "   source .env.shell"
fi

echo "🚀 Running prebuild..."
npm run prebuild

echo "🎉 Prebuild completed successfully!"
echo "💡 You can now run: npm run build" 