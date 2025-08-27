import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth, SignIn, SignUp } from '@clerk/clerk-react'
import Homepage from './pages/Homepage'
import Dashboard from './pages/dashboard'
import AdminWebhookEvents from './pages/AdminWebhookEvents'

// Auth guard component for protected routes
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  
  if (!isLoaded) return null;
  if (!isSignedIn) {
    return (
      <div className="w-full bg-blue-50 text-blue-800 border-b border-blue-200">
        <div className="max-w-6xl mx-auto p-3 text-sm">
          <strong>Sign In Required</strong>
          <span className="ml-2">Please sign in to view your dashboard and quota information.</span>
        </div>
      </div>
    );
  }
  return <>{children}</>;
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
        <SignUp 
          routing="path" 
          path="/sign-up"
          afterSignUpUrl="/dashboard"
        />
      </div>
    </div>
  )
}

function App() {
  return (
    <>
      <Routes>
        {/* Auth routes must accept nested steps */}
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        
        {/* Public landing - accessible to all users */}
        <Route path="/" element={<Homepage />} />
        
        {/* Protected area — properly gated with auth guard */}
        <Route path="/dashboard/*" element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        } />
        
        {/* Admin routes */}
        <Route path="/admin/webhooks" element={<AdminWebhookEvents />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  )
}

export default App 