#!/bin/bash

cd adminer/apps/api

echo "Final fix: Rebuilding frontend assets and fixing deployment architecture"

# The issue is that we're trying to serve a Vite-built SPA from the API directory
# This is fundamentally wrong. Let's check the actual build structure

echo "Checking current build structure:"
ls -la public/
ls -la public/assets/ || echo "No assets directory"

# Check what's actually in the index.html
echo ""
echo "Current index.html content:"
cat public/index.html

# The real issue is that we have a Vite SPA (from web app) being served 
# from the API directory. This creates a mismatch.

echo ""
echo "Checking if we have the web build in the wrong location:"
find . -name "*.js" -path "*/assets/*" -exec ls -la {} \;

# Check the content of the problematic JS file
echo ""
echo "Checking content of the problematic JS file:"
if [ -f "public/assets/index-DzNHsRAh.js" ]; then
    echo "File exists. First 200 chars:"
    head -c 200 public/assets/index-DzNHsRAh.js
    echo ""
    echo "File type detection:"
    file public/assets/index-DzNHsRAh.js
else
    echo "File not found!"
fi

# The solution is to either:
# 1. Deploy the web app separately, or 
# 2. Properly configure Vercel to serve the SPA

echo ""
echo "Creating a working vercel.json for SPA + API hybrid:"

cat > vercel.json << 'EOF'
{
  "version": 2,
  "functions": {
    "api/*.js": {
      "runtime": "@vercel/node@3.1.5"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
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
          "key": "Content-Type",
          "value": "application/javascript"
        },
        {
          "key": "Cache-Control", 
          "value": "public, max-age=31536000"
        }
      ]
    }
  ]
}
EOF

# Alternative: Create a simple test to verify if Vercel can serve JS correctly
echo ""
echo "Creating a simple test JS file to verify MIME type serving:"

mkdir -p public/test
cat > public/test/simple.js << 'EOF'
console.log('Test JS file loaded successfully');
export default function test() {
    return 'MIME type test working';
}
EOF

# Update index.html to test the simple JS file first
cp public/index.html public/index.html.backup

cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Adminer - MIME Test</title>
</head>
<body>
    <div id="root">
        <h1>Testing MIME Type Fix</h1>
        <p>If you see this, HTML is working.</p>
        <p id="js-test">JavaScript test pending...</p>
    </div>
    
    <script type="module">
        try {
            const response = await fetch('/test/simple.js');
            const contentType = response.headers.get('content-type');
            console.log('Response Content-Type:', contentType);
            
            if (contentType && contentType.includes('javascript')) {
                document.getElementById('js-test').innerHTML = '✅ JavaScript MIME type is correct!';
            } else {
                document.getElementById('js-test').innerHTML = '❌ JavaScript MIME type is wrong: ' + contentType;
            }
        } catch (error) {
            document.getElementById('js-test').innerHTML = '❌ Error loading JS: ' + error.message;
            console.error('JS load error:', error);
        }
    </script>
</body>
</html>
EOF

echo ""
echo "Created MIME type test page and updated Vercel config."
echo ""
echo "Changes made:"
echo "1. Created proper vercel.json with explicit function runtime"
echo "2. Added test JS file to verify MIME type serving"
echo "3. Created test HTML page to verify the fix"
echo "4. Backed up original index.html"
echo ""
echo "Deploy these changes and test:"
echo "git add ."
echo "git commit -m 'TEST: MIME type fix verification'"
echo "git push origin main"
echo ""
echo "Then visit https://adminer.online to see if MIME types are working"