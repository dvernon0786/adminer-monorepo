import React from 'react';
import { useQuota } from '../../hooks/useQuota';
import { QuotaBanner } from '../../components/QuotaBanner';

console.log("FULL-DASHBOARD: Component file loading...");
console.log("FULL-DASHBOARD: Function name will be: FullDashboard");

const FullDashboard = () => {
  console.log("FULL-DASHBOARD: Component executing...");
  console.log("FULL-DASHBOARD: This is the FULL dashboard component with quota management");

  const { data: quota, loading, error } = useQuota();

  console.log("FULL-DASHBOARD: Quota hook result:", { loading, quota, error });

  if (loading) {
    console.log("FULL-DASHBOARD: Showing loading state");
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f0f9ff',
        border: '2px solid #0ea5e9',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h2>Loading Dashboard...</h2>
        <p>Fetching your quota and usage information...</p>
        <div style={{ marginTop: '10px' }}>
          <div style={{ 
            width: '100%', 
            height: '4px', 
            backgroundColor: '#e0e7ff', 
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '30%',
              height: '100%',
              backgroundColor: '#0ea5e9',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.log("FULL-DASHBOARD: Showing error state");
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#fef2f2',
        border: '2px solid #ef4444',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h2>Error Loading Dashboard</h2>
        <p>We encountered an issue while loading your dashboard:</p>
        <p style={{ 
          backgroundColor: '#fee2e2', 
          padding: '10px', 
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          {error}
        </p>
        <p style={{ marginTop: '15px' }}>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </p>
      </div>
    );
  }

  if (!quota) {
    console.log("FULL-DASHBOARD: No quota data - showing auth prompt");
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#eff6ff',
        border: '2px solid #3b82f6',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h2>Authentication Required</h2>
        <p>Please sign in to view your dashboard and quota information.</p>
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280' }}>
          The dashboard requires authentication to access your quota data.
        </p>
      </div>
    );
  }

  console.log("FULL-DASHBOARD: Rendering main dashboard with quota data");
  console.log("FULL-DASHBOARD: Quota object structure:", JSON.stringify(quota, null, 2));
  console.log("FULL-DASHBOARD: Quota.used:", quota?.used);
  console.log("FULL-DASHBOARD: Quota.limit:", quota?.limit);
  
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f0fdf4',
      border: '2px solid #22c55e',
      borderRadius: '8px',
      margin: '20px'
    }}>
      <h1>Dashboard - FULL VERSION</h1>
      <p><strong>Welcome to your complete dashboard!</strong></p>
      <p>Component name: FullDashboard</p>
      <p>Time: {new Date().toLocaleString()}</p>
      
      {/* Quota Banner */}
      <div style={{ marginTop: '20px' }}>
        <QuotaBanner quota={quota} />
      </div>
      
      {/* Quota Details */}
      <div style={{ 
        marginTop: '20px', 
        padding: '20px', 
        backgroundColor: '#e0e7ff', 
        borderRadius: '8px' 
      }}>
        <h3>Quota Information</h3>
        
        {/* Debug Quota Structure */}
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#fef3c7', 
          borderRadius: '6px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          <h4>Debug: Quota Data Structure</h4>
          <pre>{JSON.stringify(quota, null, 2)}</pre>
        </div>
        
        {/* Fixed Quota Display - Using direct properties from extracted data */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px',
          marginTop: '15px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '6px',
            border: '1px solid #d1d5db'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#374151' }}>Used</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#059669' }}>
              {quota?.used ? quota.used.toLocaleString() : 'N/A'}
            </p>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '6px',
            border: '1px solid #d1d5db'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#374151' }}>Limit</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#dc2626' }}>
              {quota?.limit ? quota.limit.toLocaleString() : 'N/A'}
            </p>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '6px',
            border: '1px solid #d1d5db'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#374151' }}>Remaining</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#059669' }}>
              {quota?.used && quota?.limit ? (quota.limit - quota.used).toLocaleString() : 'N/A'}
            </p>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '6px',
            border: '1px solid #d1d5db'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#374151' }}>Usage %</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#dc2626' }}>
              {quota?.used && quota?.limit ? Math.round((quota.used / quota.limit) * 100) : 'N/A'}%
            </p>
          </div>
        </div>
      </div>
      
      {/* Debug Info */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#fef3c7', 
        borderRadius: '6px' 
      }}>
        <h3>Debug Information</h3>
        <p><strong>Component Status:</strong> Successfully rendered with full functionality</p>
        <p><strong>Import System:</strong> Working correctly (no more Hl() issues!)</p>
        <p><strong>Quota Hook:</strong> Functional and returning data</p>
        <p><strong>Build System:</strong> Minification disabled to preserve names</p>
        <p><strong>Quota Data:</strong> {quota ? 'Present' : 'Missing'}</p>
        <p><strong>Quota Keys:</strong> {quota ? Object.keys(quota).join(', ') : 'None'}</p>
        <p><strong>Fixed Access:</strong> Hook now extracts data from API response</p>
      </div>
    </div>
  );
};

export default FullDashboard; 