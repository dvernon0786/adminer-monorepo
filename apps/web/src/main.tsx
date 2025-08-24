import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { BrowserRouter } from "react-router-dom";
import App from "./App";

// Guards (load before Clerk)
import "./lib/force-direct-clerk";
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
      clerkJSUrl="/clerk.browser.js"        // 🔒 local script
      signInUrl="/sign-in"                  // ✅ relative
      signUpUrl="/sign-up"                  // ✅ relative
      afterSignInUrl="/"                    // ✅ relative (we'll route to /dashboard ourselves)
      afterSignUpUrl="/"
      telemetry={false}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
); 