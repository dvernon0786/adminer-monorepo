import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useClerk, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import Homepage from './pages/Homepage'

function App() {
  // Debug Clerk initialization in development
  if (import.meta.env.DEV) {
    const clerk = useClerk()
    // Log Clerk configuration for debugging
    console.debug('Clerk configuration:', {
      frontendApi: clerk?.frontendApi,
      proxyUrl: clerk?.proxyUrl,
      isLoaded: clerk?.isLoaded
    })
  }

  return (
    <>
      {/* Minimal UI Smoke Test */}
      <div style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
        <h1>Clerk Wiring Smoke Test</h1>
        <SignedIn>
          <p>Signed in ✅</p>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <p>Signed out ❌</p>
          <SignInButton />
        </SignedOut>
        <pre id="conf" style={{ marginTop: 16, padding: 12, background: "#111", color: "#0f0" }}>
          {JSON.stringify({
            viteKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "(none)",
            winKey: (window as any)?.ENV?.CLERK_PUBLISHABLE_KEY || "(none)",
          }, null, 2)}
        </pre>
      </div>

      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/dashboard" element={<div className="p-8 text-center">Dashboard - Coming Soon</div>} />
      </Routes>
      <Toaster position="top-right" />
    </>
  )
}

export default App 