import React from 'react'

console.log("CSS-TEST: Component loading...");

export default function CSSTestDashboard() {
  console.log("CSS-TEST: Rendering with aggressive CSS...");
  
  return (
    <div 
      id="css-test-dashboard"
      style={{ 
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'red',
        zIndex: 9999999,
        display: 'block',
        visibility: 'visible',
        opacity: 1,
        padding: '50px',
        boxSizing: 'border-box',
        color: 'white',
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center',
        overflow: 'auto'
      }}
    >
      <h1 style={{ 
        fontSize: '48px', 
        margin: '0 0 20px 0',
        color: 'yellow',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
      }}>
        DASHBOARD IS WORKING!
      </h1>
      
      <div style={{
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '20px',
        borderRadius: '10px',
        margin: '20px 0'
      }}>
        <p>If you can see this red screen, the Dashboard component is rendering successfully!</p>
        <p>Time: {new Date().toLocaleString()}</p>
        <p>Component: CSSTestDashboard</p>
        <p>Status: Successfully mounted and visible</p>
      </div>
      
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: '15px',
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        <h3>Debug Information:</h3>
        <p>Position: Fixed (covers entire screen)</p>
        <p>Z-Index: 9999999 (highest priority)</p>
        <p>Background: Red (maximum visibility)</p>
        <p>Text: Yellow with shadow (high contrast)</p>
      </div>
    </div>
  );
}
