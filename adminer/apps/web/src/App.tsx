import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import Homepage from './pages/Homepage'
import Dashboard from './pages/dashboard'

console.log("APP.TSX: App component starting...");
console.log("APP.TSX: Dashboard component imported:", Dashboard);
console.log("APP.TSX: Dashboard component type:", typeof Dashboard);
console.log("APP.TSX: Dashboard component name:", Dashboard?.name);

// Fallback redirect component for post-authentication navigation
function PostAuthRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && isSignedIn && location.pathname === '/') {
      console.log("APP.TSX: User authenticated on homepage, redirecting to dashboard...");
      navigate('/dashboard', { replace: true });
    }
  }, [isSignedIn, isLoaded, location.pathname, navigate]);

  return null;
}

function App() {
  console.log("APP.TSX: App function executing...");
  
  const { isLoaded } = useAuth();
  
  console.log("APP.TSX: Auth loaded:", isLoaded);
  
  if (!isLoaded) {
    console.log("APP.TSX: Showing enhanced loading state...");
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-semibold text-white mb-2">Loading Adminer</h1>
          <p className="text-slate-300">Initializing secure authentication...</p>
        </div>
      </div>
    );
  }
  
  console.log("APP.TSX: Rendering Router with routes...");
  console.log("APP.TSX: About to render Dashboard component...");
  
  return (
    <Router>
      <PostAuthRedirect />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<div><h1>404 - Page not found</h1></div>} />
      </Routes>
    </Router>
  );
}

export default App
