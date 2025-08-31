#!/bin/bash
set -e

echo "🚀 Running Monorepo CI with Atomic Builds"

# Check if act is available
if ! command -v act &> /dev/null; then
    echo "❌ Error: 'act' is not installed. Please install it first:"
    echo "   curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash"
    exit 1
fi

# Set environment variables
export ACTIONS_RUNNER_DEBUG=1
export ACTIONS_STEP_DEBUG=1

echo "🔒 Running with atomic build system..."

# Run the monorepo CI workflow
act workflow_dispatch \
    --input deploy=true \
    --input environment=production \
    --secret-file .env.local.act \
    --artifact-server-path /tmp/artifacts \
    --container-architecture linux/amd64 \
    --reuse \
    --workflows .github/workflows/monorepo-ci.yml

echo "✅ Monorepo CI completed with atomic builds!" 