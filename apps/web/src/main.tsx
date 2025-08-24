import './guards/clerk-direct-mode'
import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import "./index.css";

// Prefer Vite env at build-time; fallback to runtime window.ENV for SSR'ed index.html + env.js pattern
const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || (window as any)?.ENV?.CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.error('Clerk publishable key missing from VITE_CLERK_PUBLISHABLE_KEY (and window.ENV.CLERK_PUBLISHABLE_KEY fallback)');
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY (and window.ENV.CLERK_PUBLISHABLE_KEY fallback)');
}

// Add runtime error handling for Clerk failures
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (String(e?.message || '').includes('Clerk')) {
      console.error('[Clerk] Load failed. Ensure CSP allows *.clerk.com and no custom clerkJSUrl/proxyUrl is set.');
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      {/* IMPORTANT: Do NOT pass clerkJSUrl, proxyUrl, frontendApi, or anything else. */}
      {/* This forces official *.clerk.com asset loading. */}
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </Router>
  </React.StrictMode>
); 