import { ClerkProvider } from '@clerk/clerk-react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, useNavigate } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// window.ENV is written by apps/api/public/env.js
const PUBLISHABLE_KEY =
  window.ENV?.VITE_CLERK_PUBLISHABLE_KEY || window.ENV?.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

// IMPORTANT for v5 + proxy: use the FULL proxy URL with https:// protocol
const PROXY_URL = window.ENV?.CLERK_PROXY_URL // e.g. "https://clerk.adminer.online"
const CLERK_JS_URL = window.ENV?.CLERK_JS_URL // optional; Clerk auto-detects when proxyUrl is set

// 🚨 Runtime safety: block pk_test_* in non-localhost environments
if (location.hostname !== 'localhost' && PUBLISHABLE_KEY?.startsWith('pk_test_')) {
  console.error(
    '❌ SECURITY ERROR: Test Clerk publishable key detected on non-localhost environment!',
    '\nKey prefix:', PUBLISHABLE_KEY.slice(0, 12) + '…',
    '\nHost:', location.hostname,
    '\nCheck your Vercel environment variables.'
  );
}

if (!PUBLISHABLE_KEY) {
  // Always keep this one loud
  console.error('Clerk publishable key missing')
}

// Only log diagnostics in dev (no build-time noise, no prod noise)
if (import.meta.env.DEV) {
  console.debug('🔧 Clerk config resolved:', {
    publishableKey: PUBLISHABLE_KEY?.slice(0, 8) + '…',
    proxyUrl: PROXY_URL,
    clerkJSUrl: CLERK_JS_URL,
  })
}

function ClerkWithRouter({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      proxyUrl={PROXY_URL}
      clerkJSUrl={CLERK_JS_URL /* optional; leave undefined unless you need to force it */}
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