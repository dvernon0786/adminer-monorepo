#!/bin/bash

# Test Act Setup
export PATH="$HOME/.local/bin:$PATH"

echo "🧪 Testing Act Setup"
echo "==================="

# Check Act installation
if command -v act &> /dev/null; then
    echo "✅ Act is installed: $(act --version)"
else
    echo "❌ Act not found"
    exit 1
fi

# Check Docker
if docker info &> /dev/null; then
    echo "✅ Docker is running"
else
    echo "❌ Docker not running"
    exit 1
fi

# Test with a simple workflow
echo ""
echo "🧪 Testing with a simple workflow..."
echo ""

# Create a minimal test workflow
cat > .test-workflow.yml << 'EOF'
name: Test Workflow
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Test Step
        run: echo "Hello from local GitHub Actions!"
EOF

# Run the test workflow
echo "Running test workflow..."
if act workflow -W .test-workflow.yml --eventpath <(echo '{"push": {}}') --list; then
    echo "✅ Act is working correctly!"
else
    echo "❌ Act test failed"
    exit 1
fi

# Cleanup
rm -f .test-workflow.yml

echo ""
echo "🎉 Act setup is working correctly!"
echo "You can now run your workflows locally using:"
echo "  ./scripts/run-local-workflows.sh" 