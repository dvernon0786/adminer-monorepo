import React from 'react'
import ReactDOM from 'react-dom/client'
import TestApp from './TestApp.tsx'

console.log("🧪 MAIN-TEST: Starting minimal React test...");

const rootElement = document.getElementById('root');
console.log("🧪 MAIN-TEST: Root element:", rootElement ? "Found" : "Not found");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  console.log("🧪 MAIN-TEST: Rendering test app...");
  
  root.render(<TestApp />);
  
  console.log("✅ MAIN-TEST: Test app rendered successfully");
} else {
  console.error("❌ MAIN-TEST: Root element not found");
}
