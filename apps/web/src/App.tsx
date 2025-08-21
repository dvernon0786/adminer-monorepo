// --- Clerk publishable key resolution (add at top of App.tsx) ---
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Homepage from './pages/Homepage'

// Priority: Vite build var → injected window var → Next-style var
const viteKey =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any)?.env?.VITE_CLERK_PUBLISHABLE_KEY) || undefined

const windowKey =
  (typeof window !== 'undefined' &&
    (window as any).__env__?.VITE_CLERK_PUBLISHABLE_KEY) || undefined

const nextKey =
  (typeof window !== 'undefined' &&
    (window as any).__NEXT_DATA__?.props?.pageProps?.env
      ?.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) || undefined

export const CLERK_PUBLISHABLE_KEY: string | undefined =
  viteKey || windowKey || nextKey

if (!CLERK_PUBLISHABLE_KEY) {
  const msg =
    'Clerk publishable key missing. Set VITE_CLERK_PUBLISHABLE_KEY for SPA and CLERK_SECRET_KEY on API.'
  // Fail loudly in dev; warn in prod
  if ((import.meta as any)?.env?.DEV) {
    throw new Error(msg)
  } else {
    // eslint-disable-next-line no-console
    console.warn(msg)
  }
}

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY!}>
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/dashboard" element={<div className="p-8 text-center">Dashboard - Coming Soon</div>} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </ClerkProvider>
  )
}

export default App 