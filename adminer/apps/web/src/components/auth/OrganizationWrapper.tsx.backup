// Organization Wrapper Component
// This component wraps the dashboard and handles organization detection

import React from 'react';
import { useOrganization, useUser } from "@clerk/clerk-react";
import { OrganizationSetup } from './OrganizationSetup';

interface OrganizationWrapperProps {
  children: React.ReactNode;
}

export function OrganizationWrapper({ children }: OrganizationWrapperProps) {
  const { isSignedIn, user, isLoaded: userLoaded } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();

  // Show loading while Clerk is initializing
  if (!userLoaded || !orgLoaded) {
    return <OrganizationLoadingScreen />;
  }

  // If user is not signed in, let the auth system handle it
  if (!isSignedIn) {
    return <>{children}</>;
  }

  // If user is signed in but has no organization, show setup flow
  if (!organization) {
    return <OrganizationSetup />;
  }

  // User has an organization, show the normal app
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