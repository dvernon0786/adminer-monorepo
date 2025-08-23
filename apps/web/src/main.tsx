import { ClerkProvider } from '@clerk/clerk-react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, useNavigate } from 'react-router-dom'
import App from './App'
import './index.css'

const ENV = (window as any).ENV ?? {};
const publishableKey: string | undefined = ENV.CLERK_PUBLISHABLE_KEY;
const proxyUrl: string | undefined = ENV.CLERK_PROXY_URL || "/clerk";

if (!publishableKey) {
  // Hard fail in non-local to surface misconfig immediately.
  const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  console.error("Missing CLERK_PUBLISHABLE_KEY in window.ENV", { ENV });
  if (!isLocal) {
    throw new Error("CLERK_PUBLISHABLE_KEY is required in Preview/Production.");
  }
}

// Temporary runtime diagnostics
console.log('🧪 ENV at mount:', window.ENV);
document.addEventListener('clerk:loaded', () => console.log('🧪 Clerk loaded event'));

// Only log diagnostics in dev (no build-time noise, no prod noise)
if (import.meta.env?.DEV) {
  console.debug('🔧 Clerk config resolved:', {
    publishableKey: publishableKey ? 'SET' : 'NOT SET',
    proxyUrl: proxyUrl,
  })
}

function ClerkWithRouter({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  
  // Only render ClerkProvider if we have a valid publishableKey
  if (!publishableKey) {
    return <div>Loading Clerk configuration...</div>;
  }
  
  return (
    <ClerkProvider 
      publishableKey={publishableKey} 
      proxyUrl={proxyUrl}
      // Use direct CDN URL to avoid MIME type issues with proxy
      clerkJSUrl="https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      // Make Clerk use your SPA router instead of full reloads
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      {children}
    </ClerkProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <ClerkWithRouter>
        <App />
      </ClerkWithRouter>
    </Router>
  </React.StrictMode>,
) 