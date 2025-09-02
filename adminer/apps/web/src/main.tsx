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
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      fallbackRedirectUrl="/dashboard"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)

console.log("MAIN.TSX: App render called successfully");
// Build timestamp: 1756638206
// Build timestamp: 1756765016
// Build timestamp: 1756766807
// Build timestamp: 1756768267
// Build timestamp: 1756807659
// Build timestamp: 1756808284
// Build timestamp: 1756808365
// Build timestamp: 1756808601
// Build timestamp: 1756809933
// Build timestamp: 1756813090
// Build timestamp: 1756825539
// Build timestamp: 1756852050
// Build timestamp: 1756852201
// Build timestamp: 1756852319
