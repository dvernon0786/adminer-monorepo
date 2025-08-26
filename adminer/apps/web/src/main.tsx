import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { BrowserRouter } from "react-router-dom";
import App from "./App";

import { ClerkProvider } from "@clerk/clerk-react";

const pk = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!;

if (!pk) {
  console.error("Missing Clerk publishable key.");
  throw new Error("Missing Clerk publishable key.");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={pk}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
); 