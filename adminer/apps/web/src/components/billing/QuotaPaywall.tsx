import React from 'react';
import type { QuotaData } from "@/hooks/useQuota";

interface QuotaPaywallProps {
  quota: QuotaData | null;
  onUpgrade?: () => void;
}

export default function QuotaPaywall({ quota, onUpgrade }: QuotaPaywallProps) {
  if (!quota) return null;

  return (
    <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-red-800">Quota Exceeded</h3>
          <p className="text-sm text-red-600 mt-1">
            You've used {quota.used}/{quota.limit} ads from your {quota.plan} plan.
          </p>
        </div>
      </div>
      
      <div className="mt-4 flex space-x-3">
        <a
          href="/pricing"
          onClick={onUpgrade}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Upgrade Now
        </a>
        <a
          href="/billing"
          className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          View Billing
        </a>
      </div>
    </div>
  );
}

// Quota warning component for when approaching limit
export function QuotaWarning({ quota }: { quota: QuotaData | null }) {
  if (!quota || quota.percentage < 80) return null;

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Approaching Quota Limit
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            You've used {quota.used}/{quota.limit} ads ({quota.percentage}% of your {quota.plan} plan).
            <a href="/pricing" className="font-medium underline hover:text-yellow-600 ml-1">
              Consider upgrading
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}