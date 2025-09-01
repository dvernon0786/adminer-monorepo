import React from 'react'

// Debug logging that won't be stripped out
window.console.log("🧪 DASHBOARD: Minimal dashboard component loading...");

export default function MinimalDashboard() {
  window.console.log("🧪 DASHBOARD: Component rendering...");
  
  // Super simple test - just render basic content
  return (
    <div style={{ 
      padding: '20px', 
      background: '#e6ffe6', 
      border: '3px solid green',
      margin: '20px',
      borderRadius: '8px'
    }}>
      <h1 style={{ color: '#006600' }}>🧪 Dashboard Test Component</h1>
      <p>If you can see this, the Dashboard component is rendering!</p>
      <p>Timestamp: {new Date().toISOString()}</p>
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: '#f0f0f0',
        borderRadius: '4px'
      }}>
        <h3>Debug Info</h3>
        <p>✅ Component mounted successfully</p>
        <p>✅ React Router is working</p>
        <p>✅ Dashboard route is rendering</p>
      </div>
    </div>
  );
}
