import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useClerk } from '@clerk/clerk-react'
import Homepage from './pages/Homepage'

function App() {
  // Debug Clerk initialization in development
  if (import.meta.env.DEV) {
    const clerk = useClerk()
    // Removed legacy frontendApi logging - not relevant in Clerk v5
    console.debug('Clerk publishableKey:', clerk?.publishableKey)
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