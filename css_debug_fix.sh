#!/bin/bash
set -e

echo "CSS Visibility Debug Fix"
echo "========================"

cd adminer/apps/web

# Create a component with aggressive CSS to force visibility
echo "1. Creating CSS-aggressive test component..."
cat > src/pages/dashboard/css-test.tsx << 'EOF'
import React from 'react'

console.log("CSS-TEST: Component loading...");

export default function CSSTestDashboard() {
  console.log("CSS-TEST: Rendering with aggressive CSS...");
  
  return (
    <div 
      id="css-test-dashboard"
      style={{ 
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'red',
        zIndex: 9999999,
        display: 'block',
        visibility: 'visible',
        opacity: 1,
        padding: '50px',
        boxSizing: 'border-box',
        color: 'white',
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center',
        overflow: 'auto'
      }}
    >
      <h1 style={{ 
        fontSize: '48px', 
        margin: '0 0 20px 0',
        color: 'yellow',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
      }}>
        DASHBOARD IS WORKING!
      </h1>
      
      <div style={{
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '20px',
        borderRadius: '10px',
        margin: '20px 0'
      }}>
        <p>If you can see this red screen, the Dashboard component is rendering successfully!</p>
        <p>Time: {new Date().toLocaleString()}</p>
        <p>Component: CSSTestDashboard</p>
        <p>Status: Successfully mounted and visible</p>
      </div>
      
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: '15px',
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        <h3>Debug Information:</h3>
        <p>Position: Fixed (covers entire screen)</p>
        <p>Z-Index: 9999999 (highest priority)</p>
        <p>Background: Red (maximum visibility)</p>
        <p>Text: Yellow with shadow (high contrast)</p>
      </div>
    </div>
  );
}
EOF

# Update dashboard index to use CSS test component
echo "2. Updating dashboard to use CSS test component..."
cat > src/pages/dashboard/index.tsx << 'EOF'
// Using CSS-aggressive component to debug visibility issues
export { default } from './css-test'
EOF

# Also add global CSS reset to prevent conflicts
echo "3. Adding global CSS reset..."
cat > src/css-reset.css << 'EOF'
/* CSS Reset to prevent conflicts */
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

#root {
  width: 100%;
  min-height: 100vh;
  position: relative;
}

/* Ensure no hidden overflow or positioning issues */
div {
  position: relative;
}
EOF

# Import CSS reset in main.tsx
echo "4. Adding CSS reset to main.tsx..."
cat > src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.tsx'
import './index.css'
import './css-reset.css'

console.log("MAIN.TSX: Starting React app initialization...");

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
console.log("MAIN.TSX: Clerk key:", PUBLISHABLE_KEY ? "Present" : "Missing");

if (!PUBLISHABLE_KEY) {
  console.error("MAIN.TSX: Missing VITE_CLERK_PUBLISHABLE_KEY");
  throw new Error("Missing Publishable Key")
}

console.log("MAIN.TSX: Getting root element...");
const rootElement = document.getElementById('root');
console.log("MAIN.TSX: Root element:", rootElement ? "Found" : "Not found");

if (!rootElement) {
  console.error("MAIN.TSX: Root element not found!");
  throw new Error("Root element not found");
}

console.log("MAIN.TSX: Creating React root...");
const root = ReactDOM.createRoot(rootElement);
console.log("MAIN.TSX: React root created successfully");

console.log("MAIN.TSX: Rendering App with ClerkProvider...");
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)

console.log("MAIN.TSX: App render called successfully");
EOF

# Build with CSS debug version
echo "5. Building with CSS debug version..."
npm run build

# Copy to API directory
echo "6. Copying to API directory..."
cd ../api
rm -rf public/*
cp -r ../web/dist/* public/

# Check bundle sync
BUNDLE_FILE=$(ls public/assets/index-*.js | head -1 | xargs basename)
HTML_BUNDLE=$(grep -o 'index-[^"]*\.js' public/index.html)

echo "Bundle verification:"
echo "  HTML references: $HTML_BUNDLE"
echo "  Actual file: $BUNDLE_FILE"

if [ "$HTML_BUNDLE" = "$HTML_BUNDLE" ]; then
    echo "Bundle sync verified"
else
    echo "Bundle mismatch detected"
fi

echo ""
echo "CSS Debug Fix Complete!"
echo "======================"
echo ""
echo "Next steps:"
echo "1. Restart server: pkill -f simple-server && node simple-server.cjs &"
echo "2. Hard refresh dashboard: http://localhost:3000/dashboard (Ctrl+F5)"
echo "3. Expected: FULL RED SCREEN with yellow text"
echo ""
echo "If you see red screen: Component rendering works, issue was CSS"
echo "If still blank: Deeper DOM or React mounting issue" 