// Organization Wrapper Component
// This component wraps the dashboard and handles organization detection

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useOrganization, useUser } from "@clerk/clerk-react";
import { OrganizationSetup } from './OrganizationSetup';

interface OrganizationWrapperProps {
  children: React.ReactNode;
}

// CRITICAL FIX: Render count tracking to prevent infinite loops
let renderCount = 0;
const resetRenderCount = () => {
  renderCount = 0;
};

export function OrganizationWrapper({ children }: OrganizationWrapperProps) {
  // Increment and check render count
  renderCount++;
  console.log(`ORGANIZATION_WRAPPER: Rendering... (count: ${renderCount})`);

  // CRITICAL FIX: Prevent infinite render loops
  if (renderCount > 5) {
    console.error('OrganizationWrapper infinite render detected - STOPPED');
    setTimeout(resetRenderCount, 100);
    
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto mt-20">
        <h3 className="text-red-800 font-semibold mb-2">Organization Setup Required</h3>
        <p className="text-red-600 mb-4">
          Unable to detect organization. Please refresh and try again.
        </p>
        <button 
          onClick={() => {
            resetRenderCount();
            window.location.reload();
          }}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Refresh & Retry
        </button>
      </div>
    );
  }

  // Stable Clerk hook usage
  const { isSignedIn, user, isLoaded: userLoaded } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();

  // Memoized status to prevent re-renders
  const status = useMemo(() => {
    console.log(`ORGANIZATION_WRAPPER: userLoaded=${userLoaded}, orgLoaded=${orgLoaded}, isSignedIn=${isSignedIn}, org=${!!organization}`);
    
    if (!userLoaded || !orgLoaded) return 'loading';
    if (!isSignedIn) return 'not-signed-in';
    if (organization) {
      resetRenderCount(); // Reset on success
      return 'ready';
    }
    return 'needs-setup';
  }, [userLoaded, orgLoaded, isSignedIn, organization?.id]); // Stable dependency on org ID

  // Callback for setup completion - prevents re-render loops
  const handleSetupComplete = useCallback(() => {
    console.log('ORGANIZATION_WRAPPER: Setup completed');
    resetRenderCount();
  }, []);

  // Loading state with render protection
  if (status === 'loading') {
    console.log('ORGANIZATION_WRAPPER: Loading Clerk data...');
    return <OrganizationLoadingScreen />;
  }

  // If user is not signed in, let the auth system handle it
  if (status === 'not-signed-in') {
    console.log('ORGANIZATION_WRAPPER: User not signed in, showing children');
    return <>{children}</>;
  }

  // Organization setup needed - STABLE COMPONENT
  if (status === 'needs-setup') {
    console.log('ORGANIZATION_WRAPPER: No organization, showing setup');
    return <OrganizationSetup onComplete={handleSetupComplete} />;
  }

  // Normal app flow - organization exists
  console.log('ORGANIZATION_WRAPPER: Organization found, showing children');
  return <>{children}</>;
}

// Loading screen component
function OrganizationLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 mb-4">
          <svg className="animate-spin w-16 h-16 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Adminer</h2>
        <p className="text-gray-600">Setting up your workspace...</p>
      </div>
    </div>
  );
}