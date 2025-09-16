import React from 'react';
import type { QuotaData } from "@/hooks/useQuota";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quota: QuotaData | null;
}

export default function UpgradeModal({ open, onOpenChange, quota }: UpgradeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Upgrade Your Plan</h2>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-800">Quota Exceeded</h3>
              <p className="text-sm text-red-600 mt-1">
                You've used {quota?.used || 0}/{quota?.limit || 0} ads from your {quota?.plan || 'free'} plan.
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Upgrade to continue:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Pro Plan: 500 ads per month</li>
              <li>• Enterprise Plan: 2000 ads per month</li>
              <li>• Priority support and advanced features</li>
            </ul>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <a
              href="/pricing"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Upgrade Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 