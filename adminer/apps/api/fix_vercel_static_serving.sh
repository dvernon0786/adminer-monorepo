#!/bin/bash

cd adminer/apps/api

echo "Fixing Vercel static asset serving configuration"

# The issue is that Vercel is treating this as a serverless function project
# but serving static assets from the public directory with wrong MIME types
# We need to properly configure it as a static site with API functions

# 1. Check current build configuration
echo "Current build configuration:"
cat vercel.json

echo ""
echo "Current package.json build script:"
grep -A 5 '"build"' package.json

# 2. The fundamental issue is the outputDirectory configuration
# Vercel is looking for an outputDirectory but our public directory is static
# Let's reconfigure this properly

echo ""
echo "Creating new vercel.json configuration for hybrid static + serverless:"

cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/assets/(.*)",
      "dest": "/public/assets/$1",
      "headers": {
        "Content-Type": "application/javascript; charset=utf-8"
      }
    },
    {
      "src": "/(.*\\.(js|css|png|jpg|jpeg|gif|ico|svg))",
      "dest": "/public/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*\\.js)$",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/javascript; charset=utf-8"
        }
      ]
    },
    {
      "source": "/(.*\\.css)$",
      "headers": [
        {
          "key": "Content-Type",
          "value": "text/css; charset=utf-8"
        }
      ]
    }
  ]
}
EOF

# 3. Alternative approach - create a simplified build-focused vercel.json
echo ""
echo "Alternative: Creating simplified static-first configuration:"

cat > vercel.json.alt << 'EOF'
{
  "version": 2,
  "buildCommand": "echo 'Using pre-built files'",
  "outputDirectory": "public",
  "installCommand": "npm install",
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "headers": [
    {
      "source": "/assets/(.*\\.js)$",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/javascript; charset=utf-8"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/assets/(.*\\.css)$", 
      "headers": [
        {
          "key": "Content-Type",
          "value": "text/css; charset=utf-8"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*\\.js)$",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/javascript; charset=utf-8"
        }
      ]
    },
    {
      "source": "/(.*\\.css)$",
      "headers": [
        {
          "key": "Content-Type",
          "value": "text/css; charset=utf-8"
        }
      ]
    }
  ]
}
EOF

# 4. Use the alternative configuration
mv vercel.json vercel.json.backup
mv vercel.json.alt vercel.json

echo "Applied simplified static-first Vercel configuration"

# 5. Verify the JavaScript file exists and check its content type
echo ""
echo "Checking the JavaScript file that's causing issues:"
if [ -f "public/assets/index-DzNHsRAh.js" ]; then
    echo "File exists: public/assets/index-DzNHsRAh.js"
    echo "File size: $(wc -c < public/assets/index-DzNHsRAh.js) bytes"
    echo "First 100 characters:"
    head -c 100 public/assets/index-DzNHsRAh.js
    echo ""
else
    echo "File NOT found: public/assets/index-DzNHsRAh.js"
    echo "Available files in public/assets/:"
    ls -la public/assets/ || echo "No assets directory found"
fi

# 6. Test the configuration locally if possible
echo ""
echo "Configuration applied. Summary of changes:"
echo "1. Changed to static-first Vercel configuration"
echo "2. Explicit Content-Type headers for .js and .css files"
echo "3. Proper routing for assets and API functions"
echo "4. Added caching headers for better performance"

echo ""
echo "Deploy these changes:"
echo "git add vercel.json"
echo "git commit -m 'FIX: Reconfigure Vercel for proper static asset serving'"
echo "git push origin main"