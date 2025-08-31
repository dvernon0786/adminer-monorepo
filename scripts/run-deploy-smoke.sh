#!/bin/bash

# Run Deploy Wait & Smoke Workflow Locally
export PATH="$HOME/.local/bin:$PATH"

echo "🔄 Running Deploy Wait & Smoke Workflow Locally"
echo "=============================================="

# Check if Act is installed
if ! command -v act &> /dev/null; then
    echo "❌ Act not found. Please run: ./scripts/run-local-workflows.sh first"
    exit 1
fi

# Run the deploy-wait-and-smoke workflow
echo "📁 Workflow: .github/workflows/deploy-wait-and-smoke.yml"
echo "🎯 Event: push"
echo ""

act workflow -W .github/workflows/deploy-wait-and-smoke.yml --eventpath <(echo '{"push": {}}') --list

echo ""
echo "✅ Deploy Wait & Smoke workflow completed!" 