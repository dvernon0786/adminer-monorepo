import React from 'react'

console.log("SIMPLE DASHBOARD: Component loading...");

export default function SimpleDashboard() {
  console.log("SIMPLE DASHBOARD: Component function executing...");
  
  try {
    console.log("SIMPLE DASHBOARD: About to return JSX...");
    
    const jsx = (
      <div style={{ 
        padding: '40px', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '10px',
        margin: '20px',
        textAlign: 'center',
        border: '5px solid #333'
      }}>
        <h1>🧪 Simple Dashboard Test</h1>
        <p>If you see this, the component is working!</p>
        <p>Time: {new Date().toLocaleTimeString()}</p>
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '15px', 
          borderRadius: '5px',
          marginTop: '20px'
        }}>
          <h3>Debug Info</h3>
          <p>✅ Component: Loaded</p>
          <p>✅ Function: Executing</p>
          <p>✅ JSX: Returning</p>
          <p>✅ Render: Should work</p>
        </div>
      </div>
    );
    
    console.log("SIMPLE DASHBOARD: JSX created successfully:", jsx);
    return jsx;
    
  } catch (error) {
    console.error("SIMPLE DASHBOARD: Error in component:", error);
    return (
      <div style={{ 
        padding: '40px', 
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        color: 'white',
        borderRadius: '10px',
        margin: '20px',
        textAlign: 'center',
        border: '5px solid #c44569'
      }}>
        <h1>🚨 Component Error</h1>
        <p>Error occurred in SimpleDashboard component</p>
        <pre style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '10px', 
          borderRadius: '5px',
          overflow: 'auto',
          fontSize: '12px'
        }}>
          {error?.message || 'Unknown error'}
        </pre>
      </div>
    );
  }
}
