// Organization Setup Flow Components
import React, { useState } from 'react';
import { useOrganization, useUser, useOrganizationList } from "@clerk/clerk-react";

// Main Organization Setup Component
export function OrganizationSetup() {
  const { user } = useUser();
  const { organizationList, isLoaded: orgListLoaded } = useOrganizationList();
  const [setupStep, setSetupStep] = useState<'detect' | 'choose' | 'create' | 'join' | 'complete'>('detect');

  // Detect user's organization status
  React.useEffect(() => {
    if (orgListLoaded && organizationList) {
      if (organizationList.length === 0) {
        setSetupStep('choose');
      } else {
        setSetupStep('join');
      }
    }
  }, [orgListLoaded, organizationList]);

  if (!orgListLoaded) {
    return <OrganizationSetupSkeleton />;
  }

  switch (setupStep) {
    case 'detect':
      return <OrganizationSetupSkeleton />;
    
    case 'choose':
      return (
        <OrganizationChoiceStep
          onCreateNew={() => setSetupStep('create')}
          onJoinExisting={() => setSetupStep('join')}
        />
      );
    
    case 'create':
      return (
        <OrganizationCreateStep
          onSuccess={() => setSetupStep('complete')}
          onBack={() => setSetupStep('choose')}
        />
      );
    
    case 'join':
      return (
        <OrganizationJoinStep
          organizations={organizationList || []}
          onSuccess={() => setSetupStep('complete')}
          onCreateNew={() => setSetupStep('create')}
        />
      );
    
    case 'complete':
      return <OrganizationSetupComplete />;
    
    default:
      return <OrganizationChoiceStep onCreateNew={() => setSetupStep('create')} onJoinExisting={() => setSetupStep('join')} />;
  }
}

// Step 1: Choose between creating or joining
function OrganizationChoiceStep({ 
  onCreateNew, 
  onJoinExisting 
}: { 
  onCreateNew: () => void; 
  onJoinExisting: () => void; 
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Organization Required
            </h1>
            <p className="text-gray-600">
              To use Adminer, you need to be part of an organization. This helps organize your data and manage team access.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={onCreateNew}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Organization
            </button>
            
            <button
              onClick={onJoinExisting}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Join Existing Organization
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Organizations help you manage team access and data privacy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 2a: Create new organization
function OrganizationCreateStep({ 
  onSuccess, 
  onBack 
}: { 
  onSuccess: () => void; 
  onBack: () => void; 
}) {
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) {
      setError('Organization name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orgName.trim() })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create organization');
      }
    } catch (error) {
      setError('Failed to create organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <button
              onClick={onBack}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Create Organization
            </h1>
            <p className="text-gray-600">
              Choose a name for your new organization
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g., My Company, Marketing Team"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleCreateOrganization}
              disabled={loading || !orgName.trim()}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 2b: Join existing organization
function OrganizationJoinStep({ 
  organizations, 
  onSuccess, 
  onCreateNew 
}: { 
  organizations: any[];
  onSuccess: () => void; 
  onCreateNew: () => void; 
}) {
  const [loading, setLoading] = useState('');
  const { setActive } = useOrganization();

  const handleJoinOrganization = async (orgId: string) => {
    setLoading(orgId);
    try {
      await setActive({ organization: orgId });
      onSuccess();
    } catch (error) {
      console.error('Failed to join organization:', error);
    } finally {
      setLoading('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {organizations.length > 0 ? 'Select Organization' : 'No Organizations Found'}
            </h1>
            <p className="text-gray-600">
              {organizations.length > 0 
                ? 'Choose an organization to join' 
                : 'You are not a member of any organizations yet'
              }
            </p>
          </div>

          <div className="space-y-4">
            {organizations.length > 0 ? (
              organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleJoinOrganization(org.id)}
                  disabled={loading === org.id}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-gray-600">
                        {org.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{org.name}</p>
                      <p className="text-sm text-gray-500">Organization</p>
                    </div>
                  </div>
                  {loading === org.id ? (
                    <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              ))
            ) : null}

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={onCreateNew}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Organization
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 3: Setup complete
function OrganizationSetupComplete() {
  const { organization } = useOrganization();
  
  React.useEffect(() => {
    // Redirect to dashboard after a brief delay
    const timer = setTimeout(() => {
      window.location.reload(); // Reload to trigger dashboard with new org
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Setup Complete!
          </h1>
          <p className="text-gray-600 mb-4">
            You're now part of <span className="font-medium">{organization?.name}</span>
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton
function OrganizationSetupSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="animate-pulse">
            <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}