#!/bin/bash
set -e

echo "Module Resolution Diagnostic Test"
echo "================================"

cd adminer/apps/web

# Step 1: Check what files actually exist
echo "1. Checking dashboard files..."
ls -la src/pages/dashboard/
echo ""

# Step 2: Check what each file exports
echo "2. Checking file exports..."
for file in src/pages/dashboard/*.tsx; do
    echo "--- $file ---"
    grep -E "export|function|const.*=" "$file" | head -3
    echo ""
done

# Step 3: Check the index.tsx export
echo "3. Checking index.tsx export..."
cat src/pages/dashboard/index.tsx
echo ""

# Step 4: Create inline component directly in App.tsx to bypass module system
echo "4. Creating inline component in App.tsx to bypass imports..."
cat > src/App.tsx << 'EOF'
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import Homepage from './pages/Homepage'

console.log("APP.TSX: App component starting...");

// Inline Dashboard component to bypass module resolution issues
const InlineDashboard = () => {
  console.log("INLINE-DASHBOARD: Component executing...");
  
  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#FF0000',
      color: '#FFFF00',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '48px',
      fontWeight: 'bold',
      zIndex: 999999
    }}>
      <h1>INLINE DASHBOARD WORKING!</h1>
      <p style={{ fontSize: '24px' }}>This component is defined directly in App.tsx</p>
      <p style={{ fontSize: '20px' }}>No imports, no module resolution</p>
      <p style={{ fontSize: '16px' }}>Time: {new Date().toLocaleString()}</p>
    </div>
  );
};

function App() {
  console.log("APP.TSX: App function executing...");
  
  const { isLoaded } = useAuth();
  
  console.log("APP.TSX: Auth loaded:", isLoaded);
  
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
  console.log("APP.TSX: About to render InlineDashboard component...");
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/dashboard" element={<InlineDashboard />} />
        <Route path="*" element={<div><h1>404 - Page not found</h1></div>} />
      </Routes>
    </Router>
  );
}

export default App
EOF

# Step 5: Build with inline component
echo "5. Building with inline component..."
npm run build

# Step 6: Copy to API directory
echo "6. Copying to API directory..."
cd ../api
rm -rf public/*
cp -r ../web/dist/* public/

# Step 7: Verify bundle
BUNDLE_FILE=$(ls public/assets/index-*.js | head -1 | xargs basename)
HTML_BUNDLE=$(grep -o 'index-[^"]*\.js' public/index.html)

echo "Bundle verification:"
echo "  HTML references: $HTML_BUNDLE"
echo "  Actual file: $BUNDLE_FILE"

echo ""
echo "Module Resolution Test Complete!"
echo "==============================="
echo ""
echo "Changes made:"
echo "  - Created inline Dashboard component directly in App.tsx"
echo "  - Bypassed all module imports and resolution"
echo "  - No external file dependencies"
echo "  - Direct component definition"
echo ""
echo "Next steps:"
echo "1. Restart server: pkill -f simple-server && node simple-server.cjs &"
echo "2. Test dashboard: http://localhost:3000/dashboard"
echo ""
echo "Expected result:"
echo "  - Red screen with 'INLINE DASHBOARD WORKING!'"
echo "  - INLINE-DASHBOARD console messages"
echo "  - Confirms if issue is module resolution or React rendering" 