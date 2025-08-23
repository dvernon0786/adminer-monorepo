import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

// ⛔️ Do NOT read window.ENV.CLERK_FRONTEND_API on the web – it flips you back to keyless/CDN mode.
const CLERK_JS_LOCAL_URL = "/vendor/clerk/clerk.browser.js";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        clerkJSUrl={CLERK_JS_LOCAL_URL}
      >
        <App />
      </ClerkProvider>
    </Router>
  </React.StrictMode>
); 