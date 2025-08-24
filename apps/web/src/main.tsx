import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import "./index.css";

// Guards must run before Clerk
import "./lib/force-direct-clerk";
import "./lib/clerk-tripwire";

import { ClerkProvider } from "@clerk/clerk-react";

const PUBLISHABLE_KEY =
  (window as any).env?.CLERK_PUBLISHABLE_KEY ||
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  // Fail fast to surface config drift during preview/prod
  // eslint-disable-next-line no-console
  console.error("Missing Clerk publishable key.");
  throw new Error("Missing Clerk publishable key.");
}

const PINNED_CLERK_JS = "https://clerk.com/npm/@clerk/clerk-js@5/dist/clerk.browser.js";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} clerkJSUrl={PINNED_CLERK_JS}>
        <App />
      </ClerkProvider>
    </Router>
  </React.StrictMode>
); 