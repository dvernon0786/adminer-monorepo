import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useEffect } from 'react'
import { useUser, SignIn, SignUp } from '@clerk/clerk-react'
import { useLocation, useNavigate } from 'react-router-dom'
import Homepage from './pages/Homepage'
import Dashboard from './pages/dashboard'

// Post-auth redirect logic
function PostAuthRedirect() {
  const { isSignedIn, isLoaded } = useUser()
  const nav = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    // Wait for Clerk to fully load before making auth decisions
    if (!isLoaded) return
    
    // If signed in and we're on an auth page, go to dashboard
    if (isSignedIn && (pathname === '/' || pathname.startsWith('/sign-'))) {
      nav('/dashboard', { replace: true })
    }
  }, [isSignedIn, isLoaded, pathname, nav])

  return null
}

// Auth page components
function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <SignIn routing="path" path="/sign-in" />
      </div>
    </div>
  )
}

function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <SignUp routing="path" path="/sign-up" />
      </div>
    </div>
  )
}

function App() {
  return (
    <>
      <PostAuthRedirect />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  )
}

export default App 