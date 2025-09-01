#!/bin/bash
set -e

# Pure Static Architecture Fix Script
# Converts deployment to pure static site by removing API functions

PROJECT_ROOT="/home/dghost/Desktop/ADminerFinal"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=============================================="
echo "PURE STATIC ARCHITECTURE CONVERSION"
echo "=============================================="
echo "Converting to pure static site deployment"
echo "Timestamp: $(date)"
echo ""

# Change to project root
cd "$PROJECT_ROOT" || { echo "Project root not found"; exit 1; }

# Function to create backup
create_backup() {
    echo -e "${BLUE}=== CREATING BACKUP ===${NC}"
    
    BACKUP_DIR="$PROJECT_ROOT/backups/pre_static_conversion_$TIMESTAMP"
    mkdir -p "$BACKUP_DIR"
    
    # Backup API functions before deletion
    if [ -d "api" ]; then
        echo "Backing up API functions..."
        cp -r api "$BACKUP_DIR/api_functions_backup"
        echo "  ✓ API functions backed up to: $BACKUP_DIR/api_functions_backup"
    fi
    
    # Backup vercel.json
    if [ -f "adminer/apps/api/vercel.json" ]; then
        cp "adminer/apps/api/vercel.json" "$BACKUP_DIR/vercel.json.backup"
        echo "  ✓ Vercel config backed up"
    fi
    
    # Backup frontend source (in case API calls need to be removed)
    if [ -d "adminer/apps/web/src" ]; then
        cp -r "adminer/apps/web/src" "$BACKUP_DIR/web_src_backup"
        echo "  ✓ Frontend source backed up"
    fi
    
    echo "Backup created at: $BACKUP_DIR"
    echo "$BACKUP_DIR" > "$PROJECT_ROOT/.pre_static_backup"
    echo ""
}

# Function to analyze current API usage
analyze_api_usage() {
    echo -e "${BLUE}=== ANALYZING API USAGE ===${NC}"
    
    if [ -d "api" ]; then
        echo "Current API functions:"
        for api_file in api/*.js; do
            if [ -f "$api_file" ]; then
                echo "  • $(basename "$api_file") ($(wc -l < "$api_file") lines)"
            fi
        done
        echo ""
        
        # Check if frontend code references these API endpoints
        echo "Checking frontend for API references..."
        cd "adminer/apps/web/src" || return
        
        API_REFS_FOUND=false
        
        # Check for /api/consolidated references
        if grep -r "/api/consolidated" . 2>/dev/null; then
            echo "  ⚠ Found references to /api/consolidated endpoint"
            API_REFS_FOUND=true
        fi
        
        # Check for /api/health references
        if grep -r "/api/health" . 2>/dev/null; then
            echo "  ⚠ Found references to /api/health endpoint"
            API_REFS_FOUND=true
        fi
        
        # Check for localhost:3000/api references
        if grep -r "localhost:3000/api" . 2>/dev/null; then
            echo "  ⚠ Found localhost API references"
            API_REFS_FOUND=true
        fi
        
        if [ "$API_REFS_FOUND" = true ]; then
            echo ""
            echo -e "${YELLOW}WARNING: Frontend code contains API references${NC}"
            echo "These will need to be removed or updated after API deletion"
        else
            echo "  ✓ No API references found in frontend code"
        fi
        
        cd "$PROJECT_ROOT"
    else
        echo "No API functions found - already static-only"
    fi
    echo ""
}

# Function to remove API functions
remove_api_functions() {
    echo -e "${BLUE}=== REMOVING API FUNCTIONS ===${NC}"
    
    if [ -d "api" ]; then
        echo "Removing root API directory..."
        rm -rf api
        echo "  ✓ API functions removed: ./api/"
        
        # Verify removal
        if [ ! -d "api" ]; then
            echo "  ✓ Confirmation: API directory successfully deleted"
        else
            echo "  ✗ Error: API directory still exists"
            exit 1
        fi
    else
        echo "  ✓ No API directory to remove - already clean"
    fi
    echo ""
}

# Function to update Vercel configuration for pure static
update_vercel_config() {
    echo -e "${BLUE}=== UPDATING VERCEL CONFIGURATION ===${NC}"
    
    cd "adminer/apps/api" || { echo "API directory not found"; exit 1; }
    
    if [ -f "vercel.json" ]; then
        echo "Current vercel.json configuration:"
        cat vercel.json
        echo ""
        
        # Create optimized static-only vercel.json
        cat > vercel.json << 'EOF'
{
  "version": 2,
  "framework": null,
  "buildCommand": "echo 'Using pre-built files'",
  "outputDirectory": "public",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
EOF
        
        echo "Updated vercel.json for pure static deployment:"
        cat vercel.json
        echo "  ✓ Vercel configuration updated for static-only deployment"
    else
        echo "  ⚠ vercel.json not found - this might cause deployment issues"
    fi
    
    cd "$PROJECT_ROOT"
    echo ""
}

# Function to clean up frontend API references
clean_frontend_api_refs() {
    echo -e "${BLUE}=== CLEANING FRONTEND API REFERENCES ===${NC}"
    
    cd "adminer/apps/web/src" || return
    
    # Create a summary of what needs manual attention
    echo "Scanning for API references that may need manual cleanup..."
    
    API_FILES_TO_CHECK=()
    
    # Find files with API references
    while IFS= read -r -d '' file; do
        if grep -l "/api/" "$file" 2>/dev/null; then
            API_FILES_TO_CHECK+=("$file")
        fi
    done < <(find . -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" -print0)
    
    if [ ${#API_FILES_TO_CHECK[@]} -gt 0 ]; then
        echo "Files that may contain API references:"
        for file in "${API_FILES_TO_CHECK[@]}"; do
            echo "  • $file"
            # Show the specific lines with API references
            grep -n "/api/" "$file" 2>/dev/null | head -3 | sed 's/^/    /'
        done
        echo ""
        echo -e "${YELLOW}MANUAL ACTION REQUIRED:${NC}"
        echo "Review these files and remove or mock API calls before deployment"
    else
        echo "  ✓ No API references found in frontend code"
    fi
    
    cd "$PROJECT_ROOT"
    echo ""
}

# Function to validate the conversion
validate_conversion() {
    echo -e "${BLUE}=== VALIDATING STATIC CONVERSION ===${NC}"
    
    # Check that API functions are removed
    if [ ! -d "api" ]; then
        echo "  ✓ API functions successfully removed"
    else
        echo "  ✗ API functions still present"
        return 1
    fi
    
    # Check that vercel.json is configured for static
    cd "adminer/apps/api" || return 1
    
    if [ -f "vercel.json" ]; then
        if grep -q "Using pre-built files" vercel.json; then
            echo "  ✓ Vercel configured for static deployment"
        else
            echo "  ⚠ Vercel configuration may need adjustment"
        fi
        
        if grep -q '"framework": null' vercel.json; then
            echo "  ✓ Framework correctly set to null"
        else
            echo "  ⚠ Framework setting may need adjustment"
        fi
    else
        echo "  ✗ vercel.json not found"
        return 1
    fi
    
    # Check that public directory exists with built files
    if [ -d "public" ] && [ -f "public/index.html" ]; then
        echo "  ✓ Static files ready for deployment"
    else
        echo "  ⚠ Static files may need to be rebuilt"
    fi
    
    cd "$PROJECT_ROOT"
    echo "  ✓ Static conversion validation completed"
    echo ""
}

# Function to provide deployment instructions
provide_deployment_instructions() {
    echo -e "${BLUE}=== DEPLOYMENT INSTRUCTIONS ===${NC}"
    
    echo "Next steps to complete the static deployment:"
    echo ""
    echo "1. Commit and push changes:"
    echo "   git add ."
    echo "   git commit -m 'Convert to pure static architecture - remove API functions'"
    echo "   git push origin main"
    echo ""
    echo "2. Verify deployment on Vercel:"
    echo "   • Check that build completes without 'No entrypoint found' errors"
    echo "   • Verify site loads at https://adminer.online/"
    echo "   • Test all frontend functionality"
    echo ""
    echo "3. If API functionality was needed:"
    echo "   • Consider external API services"
    echo "   • Or implement serverless functions properly later"
    echo "   • Backup is available at: $(cat .pre_static_backup 2>/dev/null || echo 'No backup path found')"
    echo ""
    echo -e "${GREEN}Static conversion complete!${NC}"
    echo "Your deployment should now work without architecture mismatch errors."
}

# Main execution
main() {
    echo "Starting pure static architecture conversion..."
    echo ""
    
    # Create backup before making changes
    create_backup
    
    # Analyze current API usage
    analyze_api_usage
    
    # Remove API functions
    remove_api_functions
    
    # Update Vercel configuration
    update_vercel_config
    
    # Clean up frontend API references
    clean_frontend_api_refs
    
    # Validate the conversion
    validate_conversion
    
    # Provide deployment instructions
    provide_deployment_instructions
}

# Execute main function
main "$@" 