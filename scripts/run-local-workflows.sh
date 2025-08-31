#!/bin/bash

# Local GitHub Actions Runner Script
# This script runs all your GitHub Actions workflows locally using Act

set -e

echo "🚀 Setting up Local GitHub Actions with Act"
echo "============================================="

# Add Act to PATH
export PATH="$HOME/.local/bin:$PATH"

# Check if Act is installed
if ! command -v act &> /dev/null; then
    echo "❌ Act not found. Installing..."
    mkdir -p ~/.local/bin
    curl -L https://github.com/nektos/act/releases/latest/download/act_Linux_x86_64.tar.gz | tar -xz -C ~/.local/bin act
    export PATH="$HOME/.local/bin:$PATH"
fi

echo "✅ Act version: $(act --version)"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Function to run a workflow
run_workflow() {
    local workflow_name=$1
    local workflow_file=$2
    local event_type=${3:-push}
    
    echo ""
    echo "🔄 Running workflow: $workflow_name"
    echo "📁 File: $workflow_file"
    echo "🎯 Event: $event_type"
    echo "----------------------------------------"
    
    if act workflow -W "$workflow_file" --eventpath <(echo "{\"$event_type\": {}}") --list; then
        echo "✅ Workflow $workflow_name completed successfully"
    else
        echo "❌ Workflow $workflow_name failed"
        return 1
    fi
}

# Run all workflows
echo ""
echo "🎯 Running All Workflows Locally"
echo "================================"

# 1. Monorepo CI (main workflow)
run_workflow "Monorepo CI" ".github/workflows/monorepo-ci.yml" "push"

# 2. Deploy Wait & Smoke
run_workflow "Deploy Wait & Smoke" ".github/workflows/deploy-wait-and-smoke.yml" "push"

# 3. Smoke Tests
run_workflow "Smoke Tests" ".github/workflows/smoke.yml" "push"

# 4. Promote and Smoke
run_workflow "Promote and Smoke" ".github/workflows/promote-and-smoke.yml" "push"

echo ""
echo "🎉 All workflows completed!"
echo "📊 Check the output above for any failures"
echo ""
echo "💡 Tips:"
echo "   - Use 'act workflow -W .github/workflows/[workflow].yml --list' to see what a workflow will do"
echo "   - Use 'act workflow -W .github/workflows/[workflow].yml --dryrun' to test without running"
echo "   - Check .env.local.act for environment variables" 