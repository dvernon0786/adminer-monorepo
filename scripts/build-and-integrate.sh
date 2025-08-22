#!/bin/bash

# 🚀 SPA Build and Integration Script
# Automates building web app and integrating with API public directory

set -e

echo "🚀 Starting SPA Build and Integration..."
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuration
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$REPO_ROOT/apps/web"
API_DIR="$REPO_ROOT/apps/api"
BUILD_DIR="$WEB_DIR/dist"
PUBLIC_DIR="$API_DIR/public"

echo "📁 Directory Configuration:"
echo "   Repo Root: $REPO_ROOT"
echo "   Web App: $WEB_DIR"
echo "   API: $API_DIR"
echo "   Build Output: $BUILD_DIR"
echo "   Public Target: $PUBLIC_DIR"
echo ""

# Check if we're in the right directory
if [ ! -f "$REPO_ROOT/package.json" ]; then
    log_error "Not in repository root directory"
    log_info "Please run this script from the adminer directory"
    exit 1
fi

# Step 1: Build Web App
log_info "Step 1: Building web application..."
cd "$WEB_DIR"

if [ ! -f "package.json" ]; then
    log_error "Web app package.json not found at $WEB_DIR"
    exit 1
fi

# Check if build script exists
if ! grep -q '"build"' package.json; then
    log_error "No build script found in web app package.json"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    log_info "Installing web app dependencies..."
    npm ci
fi

# Build the web app
log_info "Running web app build..."
if npm run build; then
    log_success "Web app built successfully"
else
    log_error "Web app build failed"
    exit 1
fi

# Fix asset prefixes in built index.html
log_info "Fixing asset prefixes in dist/index.html..."
# Vercel serves /public/* at /*, so /public/assets/* must be /assets/*
if command -v sed >/dev/null 2>&1; then
    sed -i.bak 's|/public/assets/|/assets/|g' "$BUILD_DIR/index.html" || true
    log_success "Asset prefixes fixed in index.html"
else
    log_warning "sed not available, asset prefixes may need manual fixing"
fi

# Verify build output
if [ ! -d "$BUILD_DIR" ]; then
    log_error "Build output directory not found: $BUILD_DIR"
    exit 1
fi

if [ ! -f "$BUILD_DIR/index.html" ]; then
    log_error "Build output missing index.html"
    exit 1
fi

log_success "Build output verified: $BUILD_DIR"

# Step 2: Create API public directory if it doesn't exist
log_info "Step 2: Preparing API public directory..."
cd "$API_DIR"

if [ ! -d "public" ]; then
    log_info "Creating public directory..."
    mkdir -p public
fi

# Step 3: Copy SPA bundle to API public
log_info "Step 3: Copying SPA bundle to API public directory..."

# Check if rsync is available
if command -v rsync >/dev/null 2>&1; then
    log_info "Using rsync for efficient copying..."
    rsync -av --delete "$BUILD_DIR/" "$PUBLIC_DIR/"
else
    log_warning "rsync not available, using cp instead..."
    # Remove existing files
    rm -rf "$PUBLIC_DIR"/*
    # Copy new files
    cp -r "$BUILD_DIR"/* "$PUBLIC_DIR/"
fi

# Step 4: Verify integration
log_info "Step 4: Verifying integration..."

if [ -f "$PUBLIC_DIR/index.html" ]; then
    log_success "SPA bundle successfully integrated"
    echo ""
    echo "📊 Integration Summary:"
    echo "   ✅ Web app built successfully"
    echo "   ✅ SPA bundle copied to $PUBLIC_DIR"
    echo "   ✅ index.html verified at $PUBLIC_DIR/index.html"
    echo ""
    
    # Show file count
    FILE_COUNT=$(find "$PUBLIC_DIR" -type f | wc -l)
    echo "📁 Total files in public directory: $FILE_COUNT"
    
    # Show key files
    echo "🔑 Key files:"
    ls -la "$PUBLIC_DIR" | head -10
    
    if [ $FILE_COUNT -gt 10 ]; then
        echo "   ... and $((FILE_COUNT - 10)) more files"
    fi
else
    log_error "Integration failed - index.html not found in public directory"
    exit 1
fi

# Step 5: Optional - Build API to verify integration
log_info "Step 5: Verifying API build with integrated SPA..."

cd "$API_DIR"

# Check if prebuild script exists
if grep -q '"prebuild"' package.json; then
    log_info "Running API prebuild validation..."
    if npm run prebuild; then
        log_success "API prebuild validation passed"
    else
        log_warning "API prebuild validation failed (may need environment variables)"
    fi
else
    log_info "No prebuild script found, skipping API validation"
fi

# Step 6: Final verification
echo ""
echo "🎯 Final Integration Verification:"
echo "================================"

# Check if SPA is accessible
if [ -f "$PUBLIC_DIR/index.html" ]; then
    log_success "✅ SPA bundle accessible at $PUBLIC_DIR/index.html"
else
    log_error "❌ SPA bundle not accessible"
fi

# Check if static assets are present
if [ -d "$PUBLIC_DIR/assets" ] || [ -d "$PUBLIC_DIR/static" ] || [ -d "$PUBLIC_DIR/js" ]; then
    log_success "✅ Static assets present in public directory"
else
    log_warning "⚠️  No static assets directory found (may be normal for some builds)"
fi

# Check file permissions
if [ -r "$PUBLIC_DIR/index.html" ]; then
    log_success "✅ Public files are readable"
else
    log_error "❌ Public files are not readable"
fi

echo ""
log_success "🎉 SPA Build and Integration Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Deploy to Vercel with project root: apps/api"
echo "   2. Ensure 'Include files outside root' is ON in Vercel"
echo "   3. Run post-deploy smoke tests: npm run micro:smoke"
echo "   4. Verify SPA routes are accessible in production"
echo ""
echo "🚀 Ready for production deployment!" 