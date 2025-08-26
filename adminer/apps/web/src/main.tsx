import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { BrowserRouter } from "react-router-dom";
import App from "./App";

// Clerk Security Tripwire (keeps this for runtime protection)
import "./lib/clerk-tripwire";

import { ClerkProvider } from "@clerk/clerk-react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.error("Missing Clerk publishable key.");
  throw new Error("Missing Clerk publishable key.");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      // ✅ Direct Clerk CDN - no proxy configuration
      telemetry={false}
      // modern props (non-deprecated)
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"  // ✅ send to dashboard after sign-in
      signUpFallbackRedirectUrl="/dashboard"  // ✅ send to dashboard after sign-up
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
); 