import { Routes, Route, Navigate, useSearchParams, useLocation, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth, SignIn, SignUp } from '@clerk/clerk-react'
import { useEffect } from 'react'
import Homepage from './pages/Homepage'
import Dashboard from './pages/dashboard'
import AdminWebhookEvents from './pages/AdminWebhookEvents'
import SignInBanner from './components/SignInBanner'

// Auth guard component for protected routes
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { pathname, search } = useLocation();
  
  if (!isLoaded) return null;
  if (!isSignedIn) {
    const next = encodeURIComponent(pathname + search);
    return <Navigate to={`/sign-in?next=${next}`} replace />;
  }
  return <>{children}</>;
}

// Auth page components
function SignInPage() {
  const [params] = useSearchParams();
  const next = params.get("next") || "/dashboard";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <SignIn
          routing="path"
          path="/sign-in"
          // Both props below are supported. afterSignInUrl is the one that triggers
          // a client-side redirect post-auth; fallback to redirectUrl for older flows.
          afterSignInUrl={next}
          redirectUrl={next}
        />
      </div>
    </div>
  )
}

function SignUpPage() {
  const [params] = useSearchParams();
  const next = params.get("next") || "/dashboard";

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
          afterSignUpUrl={next}
          redirectUrl={next}
        />
      </div>
    </div>
  )
}

export default function App() {
  const { isSignedIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Removed automatic redirect - let users choose their destination
  // Users can stay on homepage or navigate to dashboard manually

  return (
    <div className="min-h-screen flex flex-col">
      <SignInBanner />
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
    </div>
  )
} 