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
