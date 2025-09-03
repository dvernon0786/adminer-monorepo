#!/bin/bash

echo "Implementing separate deployment configuration for adminer-monorepo"

# Step 1: Configure the web app for separate deployment
cd adminer/apps/web

echo "Configuring web app deployment..."

# Create vercel.json for the web app
cat > vercel.json << 'EOF'
{
  "version": 2,
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
EOF

echo "Created vercel.json for web app"

# Check if dist directory exists and has built files
if [ -d "dist" ]; then
    echo "✅ Web app dist directory exists"
    ls -la dist/
else
    echo "⚠️ Building web app..."
    npm install
    npm run build
fi

# Step 2: Configure the API for serverless-only deployment
cd ../api

echo ""
echo "Configuring API for serverless-only deployment..."

# Create clean vercel.json for API only
cat > vercel.json << 'EOF'
{
  "version": 2,
  "framework": null,
  "functions": {
    "api/*.js": {
      "runtime": "@vercel/node@3.1.5"
    }
  }
}
EOF

echo "Created clean vercel.json for API"

# Remove the problematic public directory to avoid confusion
if [ -d "public" ]; then
    echo "Removing public directory from API deployment..."
    mv public public_backup_$(date +%Y%m%d_%H%M%S)
    echo "Backed up public directory"
fi

# Step 3: Update API endpoints to include CORS headers
echo ""
echo "Adding CORS headers to API endpoints..."

# Function to add CORS headers to a file
add_cors_headers() {
    local file=$1
    if [ -f "$file" ]; then
        # Check if CORS headers are already present
        if ! grep -q "Access-Control-Allow-Origin" "$file"; then
            echo "Adding CORS headers to $file"
            # Create a temporary file with CORS headers
            cat > temp_cors_update.js << 'CORS_EOF'
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://adminer-web.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-org-id');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
CORS_EOF
            
            # Insert CORS headers after the function declaration
            sed -i '/export default.*function.*{/a\
  // Add CORS headers\
  res.setHeader('\''Access-Control-Allow-Origin'\'', process.env.FRONTEND_URL || '\''https://adminer-web.vercel.app'\'');\
  res.setHeader('\''Access-Control-Allow-Methods'\'', '\''GET, POST, PUT, DELETE, OPTIONS'\'');\
  res.setHeader('\''Access-Control-Allow-Headers'\'', '\''Content-Type, Authorization, x-org-id'\'');\
  \
  if (req.method === '\''OPTIONS'\'') {\
    return res.status(200).end();\
  }' "$file"
        else
            echo "CORS headers already present in $file"
        fi
    fi
}

# Add CORS to key API endpoints
add_cors_headers "api/jobs.js"
add_cors_headers "api/consolidated.js"
add_cors_headers "api/health.js"
add_cors_headers "api/checkout.js"
add_cors_headers "api/webhook.js"

# Step 4: Update web app to point to API domain
cd ../web

echo ""
echo "Updating web app API configuration..."

# Check if there's an API configuration file
if [ -f "src/config/api.js" ] || [ -f "src/config/api.ts" ]; then
    echo "Found existing API config"
else
    # Create API configuration
    mkdir -p src/config
    cat > src/config/api.ts << 'EOF'
// API Configuration
const isDevelopment = import.meta.env.MODE === 'development';

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3000'
  : 'https://adminer-api.vercel.app';

// API endpoints
export const API_ENDPOINTS = {
  jobs: `${API_BASE_URL}/api/jobs`,
  consolidated: `${API_BASE_URL}/api/consolidated`,
  health: `${API_BASE_URL}/api/health`,
  checkout: `${API_BASE_URL}/api/checkout`,
  webhook: `${API_BASE_URL}/api/webhook`,
  inngest: `${API_BASE_URL}/api/inngest`
};
EOF
    echo "Created API configuration"
fi

# Step 5: Create deployment scripts
cd ../../..

echo ""
echo "Creating deployment scripts..."

cat > deploy-web.sh << 'EOF'
#!/bin/bash
echo "Deploying web app to Vercel..."
cd adminer/apps/web
vercel --prod
EOF

cat > deploy-api.sh << 'EOF'
#!/bin/bash
echo "Deploying API to Vercel..."
cd adminer/apps/api
vercel --prod
EOF

cat > deploy-both.sh << 'EOF'
#!/bin/bash
echo "Deploying both web and API..."

echo "1. Deploying API first..."
cd adminer/apps/api
vercel --prod

echo "2. Deploying web app..."
cd ../web  
vercel --prod

echo "Deployment complete!"
echo "Web app: https://adminer-web.vercel.app"
echo "API: https://adminer-api.vercel.app"
EOF

chmod +x deploy-web.sh deploy-api.sh deploy-both.sh

# Step 6: Update package.json scripts
echo ""
echo "Summary of changes:"
echo "✅ Created separate vercel.json for web app (Vite framework)"
echo "✅ Created clean vercel.json for API (serverless functions only)"
echo "✅ Removed problematic public directory from API"
echo "✅ Added CORS headers to API endpoints"
echo "✅ Created API configuration for web app"
echo "✅ Created deployment scripts"

echo ""
echo "Next steps:"
echo "1. Commit these changes:"
echo "   git add ."
echo "   git commit -m 'FEAT: Implement separate deployment architecture'"
echo "   git push origin main"
echo ""
echo "2. Deploy API first:"
echo "   cd adminer/apps/api"
echo "   vercel --prod"
echo ""
echo "3. Deploy web app:"
echo "   cd ../web"  
echo "   vercel --prod"
echo ""
echo "4. Update web app API URLs to point to deployed API domain"
echo ""
echo "This separates the deployments and should resolve the MIME type issues."