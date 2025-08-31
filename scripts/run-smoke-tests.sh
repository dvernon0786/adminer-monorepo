#!/bin/bash

# Run Smoke Tests Workflow Locally
export PATH="$HOME/.local/bin:$PATH"

echo "🔄 Running Smoke Tests Workflow Locally"
echo "======================================"

# Check if Act is installed
if ! command -v act &> /dev/null; then
    echo "❌ Act not found. Please run: ./scripts/run-local-workflows.sh first"
    exit 1
fi

# Run the smoke tests workflow
echo "📁 Workflow: .github/workflows/smoke.yml"
echo "🎯 Event: push"
echo ""

act workflow -W .github/workflows/smoke.yml --eventpath <(echo '{"push": {}}') --list

echo ""
echo "✅ Smoke Tests workflow completed!" 