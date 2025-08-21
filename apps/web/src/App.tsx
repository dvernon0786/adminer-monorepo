import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { Toaster } from 'sonner'
import Homepage from './pages/Homepage'

// You'll need to add your Clerk publishable key to your environment variables
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
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