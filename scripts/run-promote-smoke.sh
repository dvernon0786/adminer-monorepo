#!/bin/bash

# Run Promote and Smoke Workflow Locally
# This script runs the promote-and-smoke.yml workflow using Act

set -euo pipefail

echo "🚀 Running Promote and Smoke Workflow Locally"
echo "============================================="

# Check if Act is installed
if ! command -v act &> /dev/null; then
    echo "❌ Act is not installed. Please install it first:"
    echo "   curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Act version: $(act version)"
echo "✅ Docker is running"

echo ""
echo "🔄 Running workflow: Promote and Smoke"
echo "📁 File: .github/workflows/promote-and-smoke.yml"
echo "🎯 Event: push"
echo "----------------------------------------"

# Run the workflow
act workflow -W .github/workflows/promote-and-smoke.yml --list

echo ""
echo "🎯 Starting workflow execution..."

# Execute the workflow with push event
act push -W .github/workflows/promote-and-smoke.yml

echo ""
echo "✅ Promote and Smoke workflow completed!"
echo ""
echo "💡 Next steps:"
echo "   - Check the output above for any failures"
echo "   - Run './scripts/run-local-workflows.sh' to run all workflows"
echo "   - Use 'act workflow -W .github/workflows/promote-and-smoke.yml --dryrun' to test without running" 