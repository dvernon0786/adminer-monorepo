#!/bin/bash
echo "🔧 Setting up production-ready development environment..."

# Install ESLint dependencies
echo "📦 Installing ESLint dependencies..."
npm install --save-dev eslint @eslint/js

cd adminer/apps/web
npm install --save-dev eslint @eslint/js @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks

cd ../api
npm install --save-dev eslint @eslint/js

cd ../../..

# Force git to use .git/hooks
echo "🔧 Configuring git hooks..."
git config core.hooksPath .git/hooks

# Make hooks executable
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit-bypass

# Create bypass log
touch .bypass.log
echo ".bypass.log" >> .gitignore

# Verify setup
echo "✅ Hook path: $(git config --get core.hooksPath)"
echo "✅ ESLint installed and configured"
echo "✅ Hooks setup complete"
echo ""
echo "🚀 Ready for development!"
echo "   - Normal commits: Fast path"
echo "   - Lockfile changes: Quick validation"
echo "   - Config changes: Full build test"
echo "   - Emergency bypass: Logged with traceability"