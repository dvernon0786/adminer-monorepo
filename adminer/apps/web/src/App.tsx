import { Routes, Route, Navigate, useSearchParams, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth, SignIn, SignUp } from '@clerk/clerk-react'
import Homepage from './pages/Homepage'
import Dashboard from './pages/dashboard'
import AdminWebhookEvents from './pages/AdminWebhookEvents'
import SignInBanner from './components/SignInBanner'

// Auth guard component for protected routes
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  
  if (!isLoaded) return null;
  if (!isSignedIn) {
    // Redirect to sign-in with next parameter for post-auth return
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?next=${next}`} replace />;
  }
  return <>{children}</>;
}

// Auth page components
function SignInPage() {
  const [params] = useSearchParams();
  // Allow ?next=/dashboard or any protected deep-link
  const next = params.get("next");
  const afterUrl = next && next.startsWith("/") ? next : "/dashboard";

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
          // send user where they intended, else dashboard
          afterSignInUrl={afterUrl}
          // optional but nice: if they click "Sign up" from here,
          // carry the same next param into the sign-up page.
          signUpUrl={next ? `/sign-up?next=${encodeURIComponent(next)}` : "/sign-up"}
        />
      </div>
    </div>
  )
}

function SignUpPage() {
  const [params] = useSearchParams();
  const next = params.get("next");
  const afterUrl = next && next.startsWith("/") ? next : "/dashboard";

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
          afterSignUpUrl={afterUrl}
          // if they switch to sign-in, keep intent too
          signInUrl={next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in"}
        />
      </div>
    </div>
  )
}

function App() {
  return (
    <>
      <SignInBanner />  {/* ← now banner appears ONLY on protected paths when signed out */}
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