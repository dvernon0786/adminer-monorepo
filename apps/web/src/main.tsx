import { ClerkProvider } from '@clerk/clerk-react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, useNavigate } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// window.ENV is written by apps/api/public/env.js
const FRONTEND_API = window.ENV?.CLERK_FRONTEND_API || 'clerk.adminer.online'
const PROXY_URL = window.ENV?.CLERK_PROXY_URL || '/clerk'

// 🚨 Runtime safety: validate frontendApi exists outside localhost
if (location.hostname !== 'localhost' && !FRONTEND_API) {
  console.error(
    '❌ CONFIG ERROR: CLERK_FRONTEND_API is missing on non-localhost environment!',
    '\nHost:', location.hostname,
    '\nCheck your Vercel environment variables.'
  );
}

// Defensive guard so we fail before React mounts
if (!window.ENV?.CLERK_FRONTEND_API) {
  throw new Error('Clerk keyless mode: window.ENV.CLERK_FRONTEND_API missing at runtime');
}

// Temporary runtime diagnostics
console.log('🧪 ENV at mount:', window.ENV);
document.addEventListener('clerk:loaded', () => console.log('🧪 Clerk loaded event'));

// Only log diagnostics in dev (no build-time noise, no prod noise)
if (import.meta.env.DEV) {
  console.debug('🔧 Clerk config resolved:', {
    frontendApi: FRONTEND_API,
    proxyUrl: PROXY_URL,
  })
}

function ClerkWithRouter({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  
  return (
    <ClerkProvider
      // Keep the CNAME for completeness, but the SDK will use the proxy
      frontendApi={FRONTEND_API}
      // 🔑 The magic: tell Clerk SDK to call our proxy paths instead of *.clerk.*
      proxyUrl={PROXY_URL}
      // Load the browser bundle from our own origin as well (rewritten to jsDelivr)
      clerkJSUrl={`${PROXY_URL}/npm/@clerk/clerk-js@5/dist/clerk.browser.js`}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      // Make Clerk use your SPA router instead of full reloads
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      // keep this to silence legacy publishableKey checks in older internals
      // (safe no-op in newer versions)
      __internal_bypassMissingPublishableKey={true}
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