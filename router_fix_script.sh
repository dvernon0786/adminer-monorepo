#!/bin/bash
set -e

echo "React Router Fix Script"
echo "====================="

cd adminer/apps/web

# Check current App.tsx structure
echo "1. Checking current App.tsx structure..."
grep -n "Router\|useLocation\|BrowserRouter" src/App.tsx | head -10

# Fix the Router configuration
echo "2. Fixing Router configuration..."
cat > src/App.tsx << 'EOF'
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import Homepage from './pages/Homepage'
import Dashboard from './pages/dashboard'

console.log("🎭 APP.TSX: App component starting...");

function App() {
  console.log("🎭 APP.TSX: App function executing...");
  
  const { isLoaded } = useAuth();
  
  console.log("🎭 APP.TSX: Auth loaded:", isLoaded);
  
  if (!isLoaded) {
    console.log("🎭 APP.TSX: Showing loading state...");
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Loading...</h1>
        <p>Initializing application...</p>
      </div>
    );
  }
  
  console.log("🎭 APP.TSX: Rendering Router with routes...");
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<div><h1>404 - Page not found</h1></div>} />
      </Routes>
    </Router>
  );
}

export default App
EOF

# Also create a minimal Dashboard component that doesn't use any router hooks
echo "3. Creating minimal Dashboard component..."
cat > src/pages/dashboard/minimal.tsx << 'EOF'
import React from 'react'
import { useUser } from '@clerk/clerk-react'

console.log("🧪 DASHBOARD: Minimal dashboard component loading...");

export default function MinimalDashboard() {
  console.log("🧪 DASHBOARD: Component rendering...");
  
  const { user, isLoaded } = useUser();
  
  console.log("🧪 DASHBOARD: User loaded:", isLoaded, "User:", !!user);
  
  if (!isLoaded) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Loading Dashboard...</h1>
        <p>Checking authentication...</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Please Sign In</h1>
        <p>You need to be authenticated to view the dashboard.</p>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard Working!</h1>
      <p>Welcome, {user.firstName || user.emailAddresses[0].emailAddress}!</p>
      <p>If you see this, React Router is working correctly.</p>
      <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0' }}>
        <h3>Quota Information</h3>
        <p>Used: 45 / 100 (45%)</p>
        <p>Plan: Free</p>
      </div>
    </div>
  );
}
EOF

# Update the main dashboard index to use minimal component temporarily
echo "4. Updating dashboard index to use minimal component..."
cat > src/pages/dashboard/index.tsx << 'EOF'
// Temporarily using minimal dashboard to isolate router issues
export { default } from './minimal'
EOF

# Build with the router fix
echo "5. Building with router fix..."
npm run build

# Copy to API directory
echo "6. Copying to API directory..."
cd ../api
rm -rf public/*
cp -r ../web/dist/* public/

# Check bundle name
BUNDLE_FILE=$(ls public/assets/index-*.js | head -1 | xargs basename)
echo "New bundle: $BUNDLE_FILE"

# Verify HTML references correct bundle
HTML_BUNDLE=$(grep -o 'index-[^"]*\.js' public/index.html)
if [ "$HTML_BUNDLE" = "$BUNDLE_FILE" ]; then
    echo "Bundle sync verified: $HTML_BUNDLE"
else
    echo "Bundle mismatch: HTML=$HTML_BUNDLE, Actual=$BUNDLE_FILE"
fi

echo ""
echo "Router Fix Complete!"
echo "==================="
echo ""
echo "Next steps:"
echo "1. Restart server: pkill -f simple-server && node simple-server.cjs &"
echo "2. Test dashboard: http://localhost:3000/dashboard"
echo "3. Look for debug messages in console"
echo ""
echo "Expected result: Dashboard loads with working authentication" 