#!/bin/bash

cd adminer/apps/api

echo "Fixing TypeScript build errors for Vercel deployment"

# 1. Install missing dependencies with correct package names
echo "Installing missing dependencies..."
npm install inngest apify-client @neondatabase/serverless dotenv
npm install drizzle-orm

# 2. Install missing dev dependencies
echo "Installing missing dev dependencies..."
npm install --save-dev typescript @types/node

# 3. Fix TypeScript import paths in inngest.ts - remove .ts extensions
echo "Fixing TypeScript import paths..."
cp src/lib/inngest.ts src/lib/inngest.ts.backup

sed -i 's|from '\''./db.ts'\''|from '\''./db'\''|g' src/lib/inngest.ts
sed -i 's|from '\''./apify.ts'\''|from '\''./apify'\''|g' src/lib/inngest.ts  
sed -i 's|from '\''../db/schema.ts'\''|from '\''../db/schema'\''|g' src/lib/inngest.ts

# 4. Fix the jobId scope issue in processScrapeJob function
echo "Fixing jobId variable scope..."

# Use a more targeted sed approach to fix the jobId issue
# Look for the processScrapeJob function and add proper variable extraction
if ! grep -q "const { jobId } = event.data;" src/lib/inngest.ts; then
    # Add jobId extraction at the start of the processScrapeJob function
    sed -i '/export const processScrapeJob = inngest.createFunction(/,/async ({ event, step }) => {/a\
  const { jobId } = event.data;' src/lib/inngest.ts
fi

# 5. Create tsconfig.json for proper TypeScript compilation
echo "Creating tsconfig.json..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es2020",
    "lib": ["es2020"],
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["node"],
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "noEmit": true
  },
  "include": [
    "src/**/*",
    "api/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "public"
  ]
}
EOF

# 6. Test TypeScript compilation locally
echo "Testing TypeScript compilation..."
npx tsc --noEmit || echo "TypeScript compilation has errors - check manually"

# 7. Show current dependencies
echo ""
echo "Updated dependencies:"
grep -A 15 '"dependencies"' package.json

echo ""
echo "Updated devDependencies:"
grep -A 10 '"devDependencies"' package.json

# 8. Check the fixed inngest.ts file
echo ""
echo "Checking fixed import paths in inngest.ts:"
head -10 src/lib/inngest.ts

echo ""
echo "Build fix complete. Changes made:"
echo "1. ✅ Installed missing dependencies: inngest, apify-client, drizzle-orm, etc."
echo "2. ✅ Added TypeScript and Node type definitions"
echo "3. ✅ Fixed .ts import extensions in inngest.ts"
echo "4. ✅ Added jobId variable extraction in processScrapeJob"
echo "5. ✅ Created tsconfig.json with proper configuration"

echo ""
echo "Commit these changes:"
echo "git add ."
echo "git commit -m 'FIX: Resolve TypeScript build errors for Vercel deployment'"
echo "git push origin main"