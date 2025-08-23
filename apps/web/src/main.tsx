import { ClerkProvider } from '@clerk/clerk-react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, useNavigate } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// window.ENV is written by apps/api/public/env.js
const FRONTEND_API = window.ENV?.CLERK_FRONTEND_API || 'clerk.adminer.online'

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

// Only log diagnostics in dev (no build-time noise, no prod noise)
if (import.meta.env.DEV) {
  console.debug('🔧 Clerk config resolved:', {
    frontendApi: FRONTEND_API,
  })
}

function ClerkWithRouter({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  
  return (
    <ClerkProvider
      frontendApi={FRONTEND_API}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      // Make Clerk use your SPA router instead of full reloads
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      // Bypass publishableKey requirement in keyless mode
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