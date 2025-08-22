import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter as Router, useNavigate } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Declare global window.__env__ type
declare global {
  interface Window {
    __env__?: Record<string, string>
  }
}

// Resolve Clerk publishable key from runtime environment
const publishableKey = 
  window.__env__?.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY // fallback to build-time if available

if (!publishableKey) {
  console.error('Clerk publishable key missing from runtime environment')
}

function ClerkWithRouter({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <ClerkProvider
      publishableKey={publishableKey!}
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