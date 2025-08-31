import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import Homepage from './pages/Homepage'
import Dashboard from './pages/dashboard'

console.log("APP.TSX: App component starting...");
console.log("APP.TSX: Dashboard component imported:", Dashboard);
console.log("APP.TSX: Dashboard component type:", typeof Dashboard);
console.log("APP.TSX: Dashboard component name:", Dashboard?.name);

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
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<div><h1>404 - Page not found</h1></div>} />
      </Routes>
    </Router>
  );
}

export default App
