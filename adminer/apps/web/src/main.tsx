import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { BrowserRouter } from "react-router-dom";
import App from "./App";

import { ClerkProvider } from "@clerk/clerk-react";

// ---------------------------------------------
// Env wiring (Vite): define in .env and .env.production
// VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx
// ---------------------------------------------
const pk = __VITE_CLERK_PUBLISHABLE_KEY__ as string | undefined;
if (!pk) {
  // Hard fail early so it never silently breaks in production
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={pk}
      // Removed proxyUrl - using direct Clerk CDN instead
      // Fallback redirects are helpful if your guarded routes live under /dashboard
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
); // Build timestamp: 1756605345
