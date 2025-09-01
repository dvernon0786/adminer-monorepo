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
    console.log("APP.TSX: Showing loading state...");
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Loading...</h1>
        <p>Initializing application...</p>
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
