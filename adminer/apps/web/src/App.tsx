import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import Homepage from './pages/Homepage';
import Dashboard from './pages/dashboard';
import { OrganizationWrapper } from './components/auth/OrganizationWrapper';
import { ErrorBoundary } from './components/ErrorBoundary';

// Render protection to detect infinite loops
let renderCount = 0;
const MAX_RENDERS = 20;

function App() {
  const { isLoaded } = useAuth();
  const [renderKey, setRenderKey] = useState(0);
  
  // Increment render count and detect infinite loops
  renderCount++;
  if (renderCount > MAX_RENDERS) {
    console.error('INFINITE RENDER LOOP DETECTED:', renderCount, 'renders');
    throw new Error(`Infinite render loop detected: ${renderCount} renders`);
  }

  console.log('APP.TSX: App function executing... (render #' + renderCount + ')');
  console.log('APP.TSX: Auth loaded:', isLoaded);
  
  // Reset render count on successful completion
  useEffect(() => {
    if (isLoaded) {
      renderCount = 0; // Reset on successful auth load
    }
  }, [isLoaded]);

  // Timeout protection for auth loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoaded) {
        console.log('APP.TSX: Auth loading timeout, forcing re-render');
        setRenderKey(prev => prev + 1);
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timer);
  }, [isLoaded, renderKey]);

  if (!isLoaded) {
    console.log('APP.TSX: Auth loading in background...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Adminer...</p>
        </div>
      </div>
    );
  }
  
  console.log('APP.TSX: Rendering Router with routes...');
  
  return (
    <Router>
      <PostAuthRedirect />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/dashboard" element={
          <ErrorBoundary>
            <OrganizationWrapper>
              <Dashboard />
            </OrganizationWrapper>
          </ErrorBoundary>
        } />
        <Route path="*" element={<div><h1>404 - Page not found</h1></div>} />
      </Routes>
    </Router>
  );
}

// PostAuthRedirect component with render protection
function PostAuthRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && isSignedIn && location.pathname === '/') {
      console.log("APP.TSX: User authenticated on homepage, redirecting to dashboard...");
      navigate('/dashboard', { replace: true });
    }
  }, [isSignedIn, isLoaded, location.pathname, navigate]); // Explicit dependencies

  return null;
}

export default App;