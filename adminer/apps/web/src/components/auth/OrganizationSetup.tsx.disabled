import React, { useState, useCallback } from 'react';
import { useOrganization, useUser, useClerk } from '@clerk/clerk-react';

interface OrganizationSetupProps {
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export function OrganizationSetup({ onComplete, onError }: OrganizationSetupProps) {
  console.log('ORGANIZATION_SETUP: Component rendering...');
  
  // Safe Clerk hooks usage with fallbacks - USE SAME HOOKS AS ORGANIZATIONWRAPPER
  const organizationHook = useOrganization();
  const { user, isLoaded } = useUser(); // Use useUser() to match OrganizationWrapper
  const clerk = useClerk();
  
  const createOrganization = organizationHook?.createOrganization;
  
  // Debug Clerk configuration
  console.log('ORGANIZATION_SETUP: Debug info:', {
    organizationHook: !!organizationHook,
    createOrganization: !!createOrganization,
    user: !!user,
    userEmail: user?.primaryEmailAddress?.emailAddress,
    isLoaded: isLoaded,
    clerk: !!clerk,
    organizationHookKeys: organizationHook ? Object.keys(organizationHook) : 'undefined'
  });
  
  const [currentStep, setCurrentStep] = useState<'welcome' | 'create'>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading...
          </h2>
          <p className="text-gray-600">
            Please wait while we initialize your session.
          </p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be signed in to create an organization. Please sign in to continue.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/sign-in'}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Sign In
            </button>
            <button
              onClick={() => window.location.href = '/sign-up'}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Safe organization creation with comprehensive error handling
  const handleCreateOrg = useCallback(async () => {
    console.log('ORGANIZATION_SETUP: Create org button clicked');
    
    if (!orgName.trim()) {
      setError('Organization name is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('ORGANIZATION_SETUP: Creating organization...', orgName);
      console.log('ORGANIZATION_SETUP: createOrganization available:', !!createOrganization);
      console.log('ORGANIZATION_SETUP: organizationHook:', organizationHook);
      
      if (!createOrganization) {
        // Check if Clerk is still loading
        if (!isLoaded) {
          throw new Error('Clerk is still loading - please wait a moment and try again');
        }
        
        // Check if Clerk is properly configured
        if (!organizationHook) {
          throw new Error('Clerk organization hook not available - please check Clerk configuration');
        }
        
        // Check if user has permission to create organizations
        if (!user) {
          throw new Error('User not authenticated - please sign in first');
        }
        
        throw new Error('Organization creation not available. This may be due to:\n\n1. Clerk plan doesn\'t include organizations (requires Pro plan or higher)\n2. Organizations not enabled in Clerk dashboard\n3. User doesn\'t have permission to create organizations\n\nPlease contact support or upgrade your Clerk plan to enable organizations.');
      }
      
      const result = await createOrganization({ name: orgName.trim() });
      console.log('ORGANIZATION_SETUP: Organization created successfully', result);
      
      // Call completion callback safely
      if (onComplete && typeof onComplete === 'function') {
        console.log('ORGANIZATION_SETUP: Calling onComplete callback');
        onComplete();
      }
    } catch (err) {
      console.error('ORGANIZATION_SETUP: Failed to create organization:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create organization';
      setError(errorMessage);
      
      // Call error callback safely
      if (onError && typeof onError === 'function') {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      setLoading(false);
    }
  }, [orgName, createOrganization, onComplete, onError, organizationHook, user]);

  // Handle step navigation
  const handleBack = useCallback(() => {
    setCurrentStep('welcome');
    setError(null);
  }, []);

  const handleCreateStep = useCallback(() => {
    setCurrentStep('create');
    setError(null);
  }, []);

  // Render welcome step
  const renderWelcomeStep = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Welcome to Adminer
      </h2>
      <p className="text-gray-600 mb-6">
        You need to be in an organization to use Adminer. Let's get you set up!
      </p>
      
      <div className="space-y-3">
        <button
          onClick={handleCreateStep}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          disabled={loading}
        >
          Create New Organization
        </button>
        <button
          onClick={async () => {
            try {
              console.log('ORGANIZATION_SETUP: Signing out user...');
              await clerk.signOut();
              console.log('ORGANIZATION_SETUP: User signed out successfully');
              window.location.href = '/sign-in';
            } catch (error) {
              console.error('ORGANIZATION_SETUP: Sign out failed:', error);
              // Fallback to page reload if sign out fails
              window.location.href = '/sign-in';
            }
          }}
          className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Sign Out
        </button>
      </div>
      
      {user?.primaryEmailAddress?.emailAddress && (
        <p className="mt-4 text-sm text-gray-500">
          Signed in as: {user.primaryEmailAddress.emailAddress}
        </p>
      )}
    </div>
  );

  // Render create step
  const renderCreateStep = () => (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Create Organization
      </h3>
      <p className="text-gray-600 text-sm mb-4">
        Enter a name for your new organization.
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-1">
            Organization Name
          </label>
          <input
            id="orgName"
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && orgName.trim() && handleCreateOrg()}
            placeholder="My Organization"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
            autoFocus
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm whitespace-pre-line">{error}</p>
            <div className="mt-3 space-y-2">
              <p className="text-red-600 text-xs font-medium">Alternative options:</p>
              <div className="space-y-1">
                <button
                  onClick={() => window.open('https://clerk.com/pricing', '_blank')}
                  className="block text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  • Check Clerk pricing plans
                </button>
                <button
                  onClick={() => window.open('https://clerk.com/docs/organizations', '_blank')}
                  className="block text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  • Learn about Clerk organizations
                </button>
                <button
                  onClick={async () => {
                    try {
                      console.log('ORGANIZATION_SETUP: Signing out user from error section...');
                      await clerk.signOut();
                      console.log('ORGANIZATION_SETUP: User signed out successfully');
                      window.location.href = '/sign-in';
                    } catch (error) {
                      console.error('ORGANIZATION_SETUP: Sign out failed:', error);
                      window.location.href = '/sign-in';
                    }
                  }}
                  className="block text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  • Sign out and try again
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleCreateOrg}
            disabled={loading || !orgName.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Creating...
              </div>
            ) : (
              'Create Organization'
            )}
          </button>
          <button
            onClick={handleBack}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        {currentStep === 'welcome' && renderWelcomeStep()}
        {currentStep === 'create' && renderCreateStep()}
      </div>
    </div>
  );
}

// Both named and default export for maximum compatibility
export default OrganizationSetup;