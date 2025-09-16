import React from 'react';

interface OrganizationRequiredProps {
  onUpgrade?: () => void;
}

export default function OrganizationRequired({ onUpgrade }: OrganizationRequiredProps) {
  return (
    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-blue-800">Organization Required</h3>
          <p className="text-sm text-blue-600 mt-1">
            You must be a member of an organization to use this feature. Please create or join an organization to continue.
          </p>
        </div>
      </div>
      
      <div className="mt-4 flex space-x-3">
        <button
          onClick={() => window.location.href = '/organization-setup'}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create Organization
        </button>
        <button
          onClick={() => window.location.href = '/join-organization'}
          className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Join Organization
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Why do I need an organization?</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Organizations help manage team access and billing</li>
          <li>• Quota limits are applied per organization</li>
          <li>• Team members can collaborate on analysis projects</li>
          <li>• Centralized billing and usage tracking</li>
        </ul>
      </div>
    </div>
  );
}