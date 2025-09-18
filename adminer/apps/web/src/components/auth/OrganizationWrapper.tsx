// Personal Workspace Wrapper Component
// This component bypasses organization requirement and creates personal workspaces

import React, { createContext, useContext, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';

interface PersonalWorkspace {
  id: string;
  name: string;
  slug: string;
  createdBy: string;
  members: string[];
  type: 'personal';
}

interface PersonalWorkspaceContextType {
  workspace: PersonalWorkspace;
  isLoaded: boolean;
}

const PersonalWorkspaceContext = createContext<PersonalWorkspaceContextType | null>(null);

export const usePersonalWorkspace = () => {
  const context = useContext(PersonalWorkspaceContext);
  if (!context) {
    throw new Error('usePersonalWorkspace must be used within PersonalWorkspaceProvider');
  }
  return context;
};

interface OrganizationWrapperProps {
  children: React.ReactNode;
}

export function OrganizationWrapper({ children }: OrganizationWrapperProps) {
  const { isLoaded, isSignedIn, user } = useUser();

  console.log('ORGANIZATION_WRAPPER: BYPASSING ORGANIZATION - USING USER WORKSPACE');

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <a href="/sign-in" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // Memoized workspace to prevent unnecessary re-renders
  const personalWorkspace = useMemo(() => ({
    id: user.id,
    name: `${user?.firstName || user?.emailAddresses[0]?.emailAddress || 'Personal'} Workspace`,
    slug: `personal-${user.id}`,
    createdBy: user.id,
    members: [user.id],
    type: 'personal' as const
  }), [user.id, user?.firstName, user?.emailAddresses]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    workspace: personalWorkspace,
    isLoaded: true
  }), [personalWorkspace]);

  console.log('ORGANIZATION_WRAPPER: Personal workspace created:', personalWorkspace.name);
  
  return (
    <PersonalWorkspaceContext.Provider value={contextValue}>
      {children}
    </PersonalWorkspaceContext.Provider>
  );
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