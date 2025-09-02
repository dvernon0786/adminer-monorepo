import React from 'react'

export default function TestApp() {
  console.log("🧪 TEST APP: Rendering minimal test component");
  
  return (
    <div style={{ padding: '20px', background: '#f0f0f0', color: '#333' }}>
      <h1>🧪 Test App Working</h1>
      <p>If you see this, React is rendering successfully!</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
}
