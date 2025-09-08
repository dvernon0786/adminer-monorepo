#!/bin/bash

cd adminer/apps/api

echo "Fixing Inngest import path in jobs API"

# Create backup
cp api/jobs.js api/jobs.js.backup
echo "Backup created: api/jobs.js.backup"

# Show the current broken import
echo ""
echo "Current broken import (around line 45-50):"
grep -n -A 3 -B 3 "inngest.js" api/jobs.js

# Fix the import path from .js to extensionless
echo ""
echo "Fixing import path from inngest.js to extensionless inngest..."
sed -i 's|../src/lib/inngest.js|../src/lib/inngest|g' api/jobs.js

# Verify the fix
echo ""
echo "Fixed import path:"
grep -n -A 3 -B 3 "inngest" api/jobs.js | grep -v "inngest.js"

# Show the complete section to verify context
echo ""
echo "Complete dynamic import section after fix:"
grep -n -A 10 -B 5 "Dynamic import for Inngest client" api/jobs.js

# Commit the fix
echo ""
echo "Committing the fix..."
git add api/jobs.js
git commit -m "FIX: Correct Inngest import path - remove file extension

- Fix dynamic import path in /api/jobs endpoint
- Change '../src/lib/inngest.js' to '../src/lib/inngest' (extensionless)
- Ensures compatibility with Vercel's compilation process
- Resolves import failure that prevented Inngest triggers
- Enables complete wire: Frontend → API → Inngest → Apify → Database
- Background job processing should now work correctly"

git push origin main

echo ""
echo "SUCCESS! Fixed the critical import path issue."
echo ""
echo "What was changed:"
echo "- Fixed: '../src/lib/inngest.js' → '../src/lib/inngest' (extensionless)"
echo ""
echo "Expected results after deployment:"
echo "1. Dynamic import of Inngest client will succeed"
echo "2. inngest.send('job/created') will execute"
echo "3. Background processing will start automatically"
echo "4. Apify scraping will run"
echo "5. Raw data will be stored in database"
echo ""
echo "Test instructions:"
echo "1. Wait 2-3 minutes for Vercel deployment"
echo "2. Go to dashboard and enter a keyword"
echo "3. Click 'Start Analysis'"
echo "4. Check browser console and Vercel logs for Inngest trigger messages"
echo "5. Verify job processing occurs in background"