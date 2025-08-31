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
// Build timestamp: 1756638206
