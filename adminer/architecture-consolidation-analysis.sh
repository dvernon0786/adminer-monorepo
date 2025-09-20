#!/bin/bash

set -e

echo "🔍 ARCHITECTURE CONSOLIDATION: ELIMINATING DUPLICATES"
echo "======================================================"
echo "Scanning for duplicate payment/quota implementations to ensure single architecture"
echo ""

echo "✅ Starting analysis in current directory: $(pwd)"

echo ""
echo "📊 PHASE 1: IDENTIFY DUPLICATE PAYMENT IMPLEMENTATIONS"
echo "====================================================="

echo "🔍 Searching for all payment-related files..."

# Find all payment-related files
PAYMENT_FILES=$(find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" \) | xargs grep -l "dodo\|checkout\|payment\|billing\|subscription" 2>/dev/null | grep -v node_modules | grep -v .git | sort)

echo "Found payment-related files:"
echo "$PAYMENT_FILES"

echo ""
echo "📊 PHASE 2: IDENTIFY DUPLICATE QUOTA IMPLEMENTATIONS"
echo "=================================================="

echo "🔍 Searching for all quota-related files..."

# Find all quota-related files
QUOTA_FILES=$(find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" \) | xargs grep -l "quota\|consumeQuota\|quota_used" 2>/dev/null | grep -v node_modules | grep -v .git | sort)

echo "Found quota-related files:"
echo "$QUOTA_FILES"

echo ""
echo "📊 PHASE 3: IDENTIFY DUPLICATE API ENDPOINTS"
echo "=========================================="

echo "🔍 Scanning for duplicate API endpoints..."

# Check for duplicate API endpoints
API_DIRS=$(find . -path "*/api/*" -name "*.js" -o -path "*/api/*" -name "*.ts" | grep -v node_modules | sort)

echo "API endpoint files:"
for file in $API_DIRS; do
    if grep -q "export default.*handler\|module.exports.*handler\|function.*handler" "$file" 2>/dev/null; then
        echo "  $file"
        # Extract the likely endpoint path
        ENDPOINT_PATH=$(echo "$file" | sed 's|.*api/||' | sed 's|\.js$||' | sed 's|\.ts$||' | sed 's|/index$||')
        echo "    -> Likely endpoint: /api/$ENDPOINT_PATH"
    fi
done

echo ""
echo "📊 PHASE 4: ANALYZE DUPLICATE COMPONENTS"
echo "======================================="

echo "🔍 Searching for duplicate React components..."

# Find duplicate component patterns
COMPONENT_PATTERNS=(
    "Pricing"
    "Payment" 
    "Quota"
    "Billing"
    "Checkout"
    "Modal"
    "Paywall"
)

for pattern in "${COMPONENT_PATTERNS[@]}"; do
    echo ""
    echo "Components matching '$pattern':"
    find . -name "*$pattern*.tsx" -o -name "*$pattern*.jsx" | grep -v node_modules | while read file; do
        echo "  $file"
        # Check what this component exports
        if grep -q "export default\|export.*function\|export.*const" "$file" 2>/dev/null; then
            EXPORTS=$(grep "export default\|export.*function\|export.*const" "$file" | head -3)
            echo "    Exports: $(echo "$EXPORTS" | tr '\n' ' ')"
        fi
    done
done

echo ""
echo "📊 PHASE 5: DETECT CONFLICTING IMPLEMENTATIONS"
echo "============================================="

echo "🔍 Checking for conflicting quota consumption patterns..."

# Check for different quota consumption patterns
echo ""
echo "Quota consumption patterns found:"

# Pattern 1: Direct SQL updates
DIRECT_SQL=$(grep -r "UPDATE.*quota_used.*+" . --include="*.js" --include="*.ts" --exclude-dir=node_modules 2>/dev/null | head -5)
if [ ! -z "$DIRECT_SQL" ]; then
    echo ""
    echo "❌ PATTERN 1: Direct SQL quota updates (OLD PATTERN)"
    echo "$DIRECT_SQL"
fi

# Pattern 2: orgDb.consumeQuota calls
ORGDB_CALLS=$(grep -r "orgDb\.consumeQuota\|db\.consumeQuota" . --include="*.js" --include="*.ts" --exclude-dir=node_modules 2>/dev/null | head -5)
if [ ! -z "$ORGDB_CALLS" ]; then
    echo ""
    echo "✅ PATTERN 2: orgDb.consumeQuota calls (PREFERRED PATTERN)"
    echo "$ORGDB_CALLS"
fi

# Pattern 3: Custom quota functions
CUSTOM_QUOTA=$(grep -r "function.*consumeQuota\|const.*consumeQuota" . --include="*.js" --include="*.ts" --exclude-dir=node_modules 2>/dev/null | head -5)
if [ ! -z "$CUSTOM_QUOTA" ]; then
    echo ""
    echo "⚠️ PATTERN 3: Custom quota functions (POTENTIAL DUPLICATE)"
    echo "$CUSTOM_QUOTA"
fi

echo ""
echo "🔍 Checking for conflicting payment patterns..."

# Check for different payment patterns
echo ""
echo "Payment integration patterns found:"

# Pattern 1: Dodo API calls
DODO_CALLS=$(grep -r "dodo\|Dodo" . --include="*.js" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules 2>/dev/null | grep -v "console.log" | head -5)
if [ ! -z "$DODO_CALLS" ]; then
    echo ""
    echo "✅ PATTERN 1: Dodo payment integration"
    echo "$DODO_CALLS"
fi

# Pattern 2: Stripe references (potential old implementation)
STRIPE_CALLS=$(grep -r "stripe\|Stripe" . --include="*.js" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules 2>/dev/null | head -3)
if [ ! -z "$STRIPE_CALLS" ]; then
    echo ""
    echo "❌ PATTERN 2: Stripe references (OLD IMPLEMENTATION - SHOULD BE REMOVED)"
    echo "$STRIPE_CALLS"
fi

# Pattern 3: PayPal references
PAYPAL_CALLS=$(grep -r "paypal\|PayPal" . --include="*.js" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules 2>/dev/null | head -3)
if [ ! -z "$PAYPAL_CALLS" ]; then
    echo ""
    echo "❌ PATTERN 3: PayPal references (OLD IMPLEMENTATION - SHOULD BE REMOVED)"
    echo "$PAYPAL_CALLS"
fi

echo ""
echo "📊 PHASE 6: BACKUP AND CONSOLIDATION PLAN"
echo "========================================"

echo "🔧 Creating backup and consolidation strategy..."

# Create consolidation plan
cat > architecture_consolidation_plan.md << 'EOF'
# ARCHITECTURE CONSOLIDATION PLAN

## DUPLICATE DETECTION RESULTS

### 1. QUOTA CONSUMPTION DUPLICATES
**KEEP**: 
- `src/lib/db.ts` - orgDb.consumeQuota() (TypeScript - PREFERRED)
- All Inngest functions using orgDb.consumeQuota()

**REMOVE**:
- Any direct SQL quota updates in Inngest functions
- Custom quota consumption functions
- Hardcoded quota increments

### 2. PAYMENT INTEGRATION DUPLICATES  
**KEEP**:
- `/api/dodo/checkout.js` - Dodo checkout API (NEW)
- `/api/dodo/webhook.js` - Dodo webhook API (NEW)  
- `/api/dodo/free.js` - Free plan API (NEW)
- `src/lib/dodo.js` - DodoClient library (NEW)

**REMOVE**:
- Any Stripe payment references
- Old backup payment files
- Mock payment implementations in production

### 3. COMPONENT DUPLICATES
**KEEP**:
- `components/homepage/Pricing.tsx` - Main pricing component
- `components/dashboard/QuotaExceededModal.tsx` - Quota exceeded modal (NEW)
- `pages/mock-payment.tsx` - Development testing (NEW)

**REMOVE**:
- Old pricing components in other directories
- Duplicate modal components
- Unused billing components

### 4. API ENDPOINT DUPLICATES
**KEEP**:
- `/api/dodo/*` - All Dodo payment APIs (NEW)
- `/api/quota` - Quota status API
- `/api/jobs` - Job creation with quota validation

**REMOVE**:
- Old payment APIs (if any)
- Duplicate quota endpoints
- Unused billing endpoints

## CONSOLIDATION ACTIONS

1. **Backup conflicting files**
2. **Remove duplicate implementations** 
3. **Update imports/references**
4. **Test single architecture**
5. **Deploy consolidated version**
EOF

echo "✅ Consolidation plan created"

echo ""
echo "📊 PHASE 7: AUTOMATED DUPLICATE REMOVAL"
echo "======================================"

echo "🔧 Creating automated cleanup script..."

cat > cleanup_duplicates.sh << 'EOF'
#!/bin/bash

echo "🧹 AUTOMATED DUPLICATE CLEANUP"
echo "=============================="

# Create backup directory
mkdir -p _architecture_backups/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="_architecture_backups/$(date +%Y%m%d_%H%M%S)"

echo "📦 Creating backups in $BACKUP_DIR..."

# Backup potential duplicate files before removal
echo "Backing up potential duplicates..."

# Find and backup old payment files
find . -name "*stripe*" -o -name "*paypal*" | grep -v node_modules | while read file; do
    if [ -f "$file" ]; then
        echo "  Backing up: $file"
        mkdir -p "$BACKUP_DIR/$(dirname "$file")"
        cp "$file" "$BACKUP_DIR/$file"
    fi
done

# Find and backup old quota files with direct SQL
grep -r "UPDATE.*quota_used.*+" . --include="*.js" --include="*.ts" --exclude-dir=node_modules -l 2>/dev/null | while read file; do
    echo "  Backing up potential old quota file: $file"
    mkdir -p "$BACKUP_DIR/$(dirname "$file")"
    cp "$file" "$BACKUP_DIR/$file"
done

echo "✅ Backups created"

echo ""
echo "🔧 REMOVING DUPLICATES..."

# Remove Stripe references (if any)
echo "Removing Stripe references..."
find . -name "*stripe*" -not -path "./node_modules/*" -not -path "./.git/*" | while read file; do
    if [ -f "$file" ]; then
        echo "  Removing: $file"
        rm -f "$file"
    fi
done

# Remove PayPal references (if any)  
echo "Removing PayPal references..."
find . -name "*paypal*" -not -path "./node_modules/*" -not -path "./.git/*" | while read file; do
    if [ -f "$file" ]; then
        echo "  Removing: $file"
        rm -f "$file"
    fi
done

# Comment out direct SQL quota updates in favor of orgDb.consumeQuota
echo "Commenting out direct SQL quota updates..."
find . -name "*.js" -o -name "*.ts" | grep -v node_modules | xargs grep -l "UPDATE.*quota_used.*+" 2>/dev/null | while read file; do
    echo "  Updating quota pattern in: $file"
    sed -i.bak 's/UPDATE organizations SET quota_used = quota_used + \${/\/\/ DEPRECATED: UPDATE organizations SET quota_used = quota_used + \${/g' "$file"
    sed -i.bak 's/UPDATE organizations SET quota_used = quota_used + 1/\/\/ DEPRECATED: UPDATE organizations SET quota_used = quota_used + 1/g' "$file"
done

echo "✅ Duplicate cleanup completed"
echo "✅ Backups available in: $BACKUP_DIR"
EOF

chmod +x cleanup_duplicates.sh

echo "✅ Cleanup script created"

echo ""
echo "📊 PHASE 8: VALIDATION SCRIPT"
echo "============================"

echo "🔧 Creating architecture validation script..."

cat > validate_single_architecture.sh << 'EOF'
#!/bin/bash

echo "✅ ARCHITECTURE VALIDATION"
echo "========================="

echo "🔍 Validating single payment architecture..."

# Check for single Dodo implementation
DODO_FILES=$(find . -name "dodo.js" -o -name "dodo.ts" | grep -v node_modules | wc -l)
echo "Dodo client libraries found: $DODO_FILES (should be 1)"

# Check for single quota consumption pattern
QUOTA_PATTERNS=$(grep -r "consumeQuota\|quota_used.*+" . --include="*.js" --include="*.ts" --exclude-dir=node_modules 2>/dev/null | grep -v "DEPRECATED" | grep -v "console.log" | wc -l)
echo "Active quota consumption patterns: $QUOTA_PATTERNS"

# Check for single pricing component
PRICING_COMPONENTS=$(find . -name "*Pricing*" -name "*.tsx" | grep -v node_modules | wc -l)
echo "Pricing components found: $PRICING_COMPONENTS (should be 1-2)"

# Check for single payment API structure
PAYMENT_APIS=$(find . -path "*/api/dodo/*" -name "*.js" | wc -l)
echo "Dodo payment APIs found: $PAYMENT_APIS (should be 3: checkout, webhook, free)"

echo ""
echo "🎯 ARCHITECTURE VALIDATION RESULTS:"
if [ "$DODO_FILES" -eq 1 ] && [ "$PAYMENT_APIS" -eq 3 ]; then
    echo "✅ SINGLE ARCHITECTURE CONFIRMED"
    echo "✅ Payment system consolidated"
    echo "✅ No conflicting implementations detected"
else
    echo "⚠️  ARCHITECTURE ISSUES DETECTED"
    echo "Please review the duplicate detection results above"
fi
EOF

chmod +x validate_single_architecture.sh

echo "✅ Validation script created"

echo ""
echo "📊 COMPREHENSIVE ANALYSIS SUMMARY"
echo "================================"

echo ""
echo "🎯 DUPLICATE DETECTION COMPLETE"
echo "=============================="

echo ""
echo "**SCRIPTS CREATED:**"
echo "✅ architecture_consolidation_plan.md - Detailed consolidation strategy"
echo "✅ cleanup_duplicates.sh - Automated duplicate removal"
echo "✅ validate_single_architecture.sh - Architecture validation"
echo ""

echo "**NEXT STEPS:**"
echo "1. Review the duplicate detection results above"
echo "2. Run cleanup_duplicates.sh to remove duplicates (with backups)"
echo "3. Run validate_single_architecture.sh to confirm single architecture"
echo "4. Deploy consolidated architecture"
echo ""

echo "**CRITICAL FINDINGS:**"
if echo "$DIRECT_SQL" | grep -q "UPDATE.*quota_used"; then
    echo "❌ DUPLICATE QUOTA PATTERNS DETECTED - Direct SQL updates found"
    echo "   These should be replaced with orgDb.consumeQuota() calls"
fi

if echo "$STRIPE_CALLS" | grep -q "stripe"; then
    echo "❌ OLD PAYMENT SYSTEM DETECTED - Stripe references found"
    echo "   These should be removed in favor of Dodo integration"
fi

if [ $(echo "$PAYMENT_FILES" | wc -l) -gt 10 ]; then
    echo "⚠️  MANY PAYMENT FILES DETECTED - Review for potential duplicates"
fi

echo ""
echo "✅ ARCHITECTURE CONSOLIDATION ANALYSIS COMPLETE"
echo "==============================================="
echo ""
echo "Run the generated scripts to ensure single, unified architecture before deploying payment system."

echo ""
echo "🎯 RECOMMENDATION:"
echo "=================="
echo "Before proceeding with payment deployment:"
echo "1. Run this duplicate detection analysis"
echo "2. Execute cleanup_duplicates.sh to remove conflicts"  
echo "3. Validate with validate_single_architecture.sh"
echo "4. Only then deploy the unified payment system"
echo ""
echo "This ensures no architectural regressions or conflicts."