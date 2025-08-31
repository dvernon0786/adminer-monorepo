#!/bin/bash
set -e

echo "🚀 Running Deploy and Smoke with Atomic Builds"

# Check if act is available
if ! command -v act &> /dev/null; then
    echo "❌ Error: 'act' is not installed. Please install it first:"
    echo "   curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash"
    exit 1
fi

# Set environment variables
export ACTIONS_RUNNER_DEBUG=1
export ACTIONS_STEP_DEBUG=1

echo "🔒 Running deploy workflow with atomic builds..."

# Run the deploy workflow
act workflow_dispatch \
    --input deploy=true \
    --input environment=production \
    --secret-file .env.local.act \
    --artifact-server-path /tmp/artifacts \
    --container-architecture linux/amd64 \
    --reuse \
    --workflows .github/workflows/deploy-wait-and-smoke.yml

echo "✅ Deploy and smoke completed with atomic builds!" 