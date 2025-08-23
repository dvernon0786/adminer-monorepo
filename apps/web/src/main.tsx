import { ClerkProvider } from '@clerk/clerk-react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, useNavigate } from 'react-router-dom'
import App from './App'
import './index.css'

// window.ENV is written by apps/api/public/env.js
const FRONTEND_API = window.ENV?.CLERK_FRONTEND_API || 'clerk.adminer.online'
const PROXY_URL = window.ENV?.CLERK_PROXY_URL || '/clerk'
const PK = window.ENV?.CLERK_PUBLISHABLE_KEY || ''

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
if (location.hostname !== 'localhost' && !PK) {
  throw new Error('Clerk v5 requires publishableKey; CLERK_PUBLISHABLE_KEY missing at runtime');
}

// Temporary runtime diagnostics
console.log('🧪 ENV at mount:', window.ENV);
document.addEventListener('clerk:loaded', () => console.log('🧪 Clerk loaded event'));

// Only log diagnostics in dev (no build-time noise, no prod noise)
if (import.meta.env?.DEV) {
  console.debug('🔧 Clerk config resolved:', {
    publishableKey: PK ? 'SET' : 'NOT SET',
    proxyUrl: PROXY_URL,
  })
}

function ClerkWithRouter({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  
  return (
    <ClerkProvider
      // v5 requires a real publishable key (safe to expose)
      publishableKey={PK}
      // 🔑 Keep everything same-origin via the reverse proxy
      proxyUrl={PROXY_URL}
      // Also load Clerk JS via the proxy to keep CSP/connect-src 'self'
      clerkJSUrl={`${PROXY_URL}/npm/@clerk/clerk-js@5/dist/clerk.browser.js`}
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