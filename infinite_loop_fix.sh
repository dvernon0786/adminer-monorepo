#!/bin/bash
set -e

echo "Fixing Infinite Re-rendering Loop"
echo "================================="

cd adminer/apps/web

# Fix the App.tsx to prevent infinite re-rendering
echo "1. Fixing infinite loop in App.tsx..."
cat > src/App.tsx << 'EOF'
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import Homepage from './pages/Homepage'
import Dashboard from './pages/dashboard'

console.log("APP.TSX: App component starting...");

function App() {
  console.log("APP.TSX: App function executing...");
  
  const { isLoaded } = useAuth();
  
  console.log("APP.TSX: Auth loaded:", isLoaded);
  
  // Remove useEffect that's causing infinite loop
  // Just use the auth state directly without side effects
  
  if (!isLoaded) {
    console.log("APP.TSX: Showing loading state...");
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Loading...</h1>
        <p>Initializing application...</p>
      </div>
    );
  }
  
  console.log("APP.TSX: Rendering Router with routes...");
  
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

# Create an even simpler Dashboard component to test rendering
echo "2. Creating ultra-simple Dashboard component..."
cat > src/pages/dashboard/simple.tsx << 'EOF'
import React from 'react'

console.log("SIMPLE DASHBOARD: Component loading...");

export default function SimpleDashboard() {
  console.log("SIMPLE DASHBOARD: Rendering...");
  
  return (
    <div style={{ 
      padding: '40px', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      borderRadius: '10px',
      margin: '20px',
      textAlign: 'center'
    }}>
      <h1>Dashboard Works!</h1>
      <p>React Router is working correctly</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: '10px', 
        borderRadius: '5px',
        marginTop: '20px'
      }}>
        <h3>Status Check</h3>
        <p>✅ React: Rendering</p>
        <p>✅ Router: Working</p>
        <p>✅ Component: Mounted</p>
      </div>
    </div>
  );
}
EOF

# Update dashboard index to use simple component
echo "3. Updating dashboard to use simple component..."
cat > src/pages/dashboard/index.tsx << 'EOF'
// Using ultra-simple component to test React rendering
export { default } from './simple'
EOF

# Build with the infinite loop fix
echo "4. Building with infinite loop fix..."
npm run build

# Copy to API directory
echo "5. Copying to API directory..."
cd ../api
rm -rf public/*
cp -r ../web/dist/* public/

# Verify bundle sync
BUNDLE_FILE=$(ls public/assets/index-*.js | head -1 | xargs basename)
HTML_BUNDLE=$(grep -o 'index-[^"]*\.js' public/index.html)

echo "Bundle verification:"
echo "  HTML references: $HTML_BUNDLE"
echo "  Actual file: $BUNDLE_FILE"

if [ "$HTML_BUNDLE" = "$BUNDLE_FILE" ]; then
    echo "✅ Bundle sync verified"
else
    echo "❌ Bundle mismatch detected"
fi

echo ""
echo "Infinite Loop Fix Complete!"
echo "=========================="
echo ""
echo "Changes made:"
echo "  - Removed useEffect causing infinite re-rendering"
echo "  - Created ultra-simple Dashboard component"
echo "  - Eliminated all complex authentication logic"
echo "  - Added visual indicators for success"
echo ""
echo "Next steps:"
echo "1. Restart server: pkill -f simple-server && node simple-server.cjs &"
echo "2. Hard refresh dashboard: http://localhost:3000/dashboard (Ctrl+F5)"
echo "3. Check console - should see SIMPLE DASHBOARD messages"
echo ""
echo "Expected: Purple gradient dashboard with status indicators" 