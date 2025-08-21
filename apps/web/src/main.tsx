import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={publishableKey!}>
      <App />
    </ClerkProvider>
  </React.StrictMode>,
) 