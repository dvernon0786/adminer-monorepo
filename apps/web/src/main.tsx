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

// Resolve Clerk publishable key from runtime environment
const PUBLISHABLE_KEY =
  (typeof window !== 'undefined' && window?.ENV?.VITE_CLERK_PUBLISHABLE_KEY) ||
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// If you are intentionally proxying Clerk via a custom domain, set this:
const PROXY_URL =
  (typeof window !== 'undefined' && window?.ENV?.CLERK_PROXY_URL) ||
  import.meta.env.VITE_CLERK_PROXY_URL ||
  undefined

if (!PUBLISHABLE_KEY) {
  console.error('Missing Clerk publishable key')
}

function ClerkWithRouter({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY!}
      {...(PROXY_URL ? { proxyUrl: PROXY_URL } : {})}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
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