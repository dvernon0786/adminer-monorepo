import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter as Router, useNavigate } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Declare global window.ENV type
declare global {
  interface Window {
    ENV?: Record<string, string>
  }
}

// Resolve Clerk configuration from runtime environment
const ENV = (typeof window !== 'undefined' && (window as any).ENV) || {};

// Debug logging to see what's in window.ENV
if (typeof window !== 'undefined') {
  console.log('🔍 Debug: window.ENV contents:', window.ENV);
  console.log('🔍 Debug: ENV.CLERK_PROXY_URL:', ENV.CLERK_PROXY_URL);
}

const PUBLISHABLE_KEY =
  ENV.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// If you are intentionally proxying Clerk via a custom domain, set this:
const PROXY_URL = ENV.CLERK_PROXY_URL || import.meta.env.VITE_CLERK_PROXY_URL;
const CLERK_JS_URL = ENV.CLERK_JS_URL || import.meta.env.VITE_CLERK_JS_URL;

// Debug logging for resolved values
console.log('🔍 Debug: Resolved PROXY_URL:', PROXY_URL);
console.log('🔍 Debug: Resolved CLERK_JS_URL:', CLERK_JS_URL);

// For Clerk v5, we need to set frontendApi directly to the proxy domain
const FRONTEND_API = PROXY_URL || undefined;
console.log('🔍 Debug: Setting Clerk frontendApi to:', FRONTEND_API);

if (!PUBLISHABLE_KEY) {
  console.error('Missing Clerk publishable key')
}

function ClerkWithRouter({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY!}
      {...(FRONTEND_API ? { frontendApi: FRONTEND_API } : {})}
      {...(CLERK_JS_URL ? { clerkJSUrl: CLERK_JS_URL } : {})}
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