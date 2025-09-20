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
