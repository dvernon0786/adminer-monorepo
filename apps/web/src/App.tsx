import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useClerk } from '@clerk/clerk-react'
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
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/dashboard" element={<div className="p-8 text-center">Dashboard - Coming Soon</div>} />
      </Routes>
      <Toaster position="top-right" />
    </>
  )
}

export default App 