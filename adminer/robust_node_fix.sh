#!/bin/bash

# Robust Node.js Version Fix using jq for safe JSON editing
# Addresses fragility issues with sed-based JSON modification

set -e

echo "Robust Node.js version fix for Vercel compatibility..."

# Check for required tools
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required for safe JSON editing"
    echo "Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    exit 1
fi

# Verify we're in the right location
if [[ ! -d "apps/api" ]]; then
    echo "Error: Run this script from the repository root (adminer directory)"
    exit 1
fi

cd apps/api

# Detect current git branch and remote
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
REMOTE_NAME=$(git remote | head -1)

echo "Working on branch: $CURRENT_BRANCH"
echo "Will push to remote: $REMOTE_NAME"

# Create timestamped backup directory
BACKUP_DIR="../../../backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Creating backups in $BACKUP_DIR..."

# Function to safely update package.json
update_package_json() {
    if [[ ! -f "package.json" ]]; then
        echo "Warning: package.json not found"
        return 1
    fi
    
    cp "package.json" "$BACKUP_DIR/package.json.bak"
    
    # Check current engines.node value
    CURRENT_NODE=$(jq -r '.engines.node // "not set"' package.json)
    echo "Current engines.node: $CURRENT_NODE"
    
    if [[ "$CURRENT_NODE" == "22.x" ]]; then
        echo "Node.js version already set to 22.x"
        return 0
    fi
    
    # Update engines.node to 22.x, creating engines object if it doesn't exist
    jq '.engines.node = "22.x"' package.json > package.json.tmp
    mv package.json.tmp package.json
    echo "Updated engines.node to 22.x"
    return 0
}

# Function to safely update vercel.json
update_vercel_json() {
    if [[ ! -f "vercel.json" ]]; then
        echo "Warning: vercel.json not found"
        return 1
    fi
    
    cp "vercel.json" "$BACKUP_DIR/vercel.json.bak"
    
    # Check current runtime configuration
    RUNTIME_CONFIG=$(jq -r '.functions // empty' vercel.json)
    
    if [[ -z "$RUNTIME_CONFIG" || "$RUNTIME_CONFIG" == "null" ]]; then
        echo "No functions configuration found in vercel.json"
        return 0
    fi
    
    # Check if runtime needs updating
    CURRENT_RUNTIME=$(jq -r '.functions."api/**/*.js".runtime // "not set"' vercel.json)
    echo "Current runtime: $CURRENT_RUNTIME"
    
    if [[ "$CURRENT_RUNTIME" == "@vercel/node@3.0.0" ]]; then
        echo "Runtime already set to @vercel/node@3.0.0"
        return 0
    fi
    
    # Update runtime to proper Vercel format
    jq '.functions."api/**/*.js".runtime = "@vercel/node@3.0.0"' vercel.json > vercel.json.tmp
    mv vercel.json.tmp vercel.json
    echo "Updated runtime to @vercel/node@3.0.0"
    return 0
}

# Dry run option
if [[ "${1:-}" == "--dry-run" ]]; then
    echo "DRY RUN MODE - No changes will be made"
    echo ""
    
    if [[ -f "package.json" ]]; then
        echo "Current package.json engines.node:"
        jq -r '.engines.node // "not set"' package.json
        echo "Would update to: 22.x"
    fi
    
    if [[ -f "vercel.json" ]]; then
        echo "Current vercel.json runtime:"
        jq -r '.functions."api/**/*.js".runtime // "not set"' vercel.json
        echo "Would update to: @vercel/node@3.0.0"
    fi
    
    exit 0
fi

# Update files
CHANGED_FILES=()

if update_package_json; then
    if ! git diff --quiet package.json 2>/dev/null; then
        CHANGED_FILES+=("package.json")
    fi
fi

if update_vercel_json; then
    if ! git diff --quiet vercel.json 2>/dev/null; then
        CHANGED_FILES+=("vercel.json")
    fi
fi

# Check if there are any changes
if [[ ${#CHANGED_FILES[@]} -eq 0 ]]; then
    echo "No changes needed - configuration already correct"
    exit 0
fi

echo ""
echo "Files modified: ${CHANGED_FILES[*]}"

# Show changes
echo ""
echo "Changes to be committed:"
for file in "${CHANGED_FILES[@]}"; do
    echo "--- $file ---"
    git diff "$file"
done

echo ""
read -p "Commit and push these changes? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled. Changes made but not committed."
    echo "To restore backups: cp $BACKUP_DIR/* ."
    echo "To commit manually: git add ${CHANGED_FILES[*]} && git commit"
    exit 0
fi

# Stage changed files
for file in "${CHANGED_FILES[@]}"; do
    git add "$file"
done

echo "Committing changes..."
git commit -m "FIX: Update Node.js to 22.x and correct Vercel runtime

- Updated package.json engines.node to 22.x (Vercel requirement)
- Fixed vercel.json runtime to @vercel/node@3.0.0 (proper format)
- Used jq for safe JSON editing
- Preserves all existing configuration

Backup saved to: $BACKUP_DIR"

echo "Pushing to $REMOTE_NAME/$CURRENT_BRANCH..."
git push "$REMOTE_NAME" "$CURRENT_BRANCH"

echo ""
echo "Deployment triggered. Check Vercel dashboard for status."

# Optional deployment status check (if vercel CLI is available and authenticated)
if command -v vercel &> /dev/null; then
    echo "Checking recent deployments..."
    vercel ls 2>/dev/null | head -5 || echo "Unable to fetch deployment status"
fi

echo ""
echo "Fix complete!"
echo "- Used jq for safe JSON editing"
echo "- Node.js version: $(jq -r '.engines.node' package.json 2>/dev/null || echo 'unknown')"
echo "- Vercel runtime: $(jq -r '.functions."api/**/*.js".runtime' vercel.json 2>/dev/null || echo 'unknown')"
echo "- Backups: $BACKUP_DIR"
echo ""
echo "Test endpoint after deployment (2-3 minutes):"
echo "curl -X PUT https://api-three-omega-53.vercel.app/api/inngest"
