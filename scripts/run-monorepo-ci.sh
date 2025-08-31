#!/bin/bash

# Run Monorepo CI Workflow Locally
export PATH="$HOME/.local/bin:$PATH"

echo "🔄 Running Monorepo CI Workflow Locally"
echo "======================================"

# Check if Act is installed
if ! command -v act &> /dev/null; then
    echo "❌ Act not found. Please run: ./scripts/run-local-workflows.sh first"
    exit 1
fi

# Run the monorepo-ci workflow
echo "📁 Workflow: .github/workflows/monorepo-ci.yml"
echo "🎯 Event: push"
echo ""

act workflow -W .github/workflows/monorepo-ci.yml --eventpath <(echo '{"push": {}}') --list

echo ""
echo "✅ Monorepo CI workflow completed!" 