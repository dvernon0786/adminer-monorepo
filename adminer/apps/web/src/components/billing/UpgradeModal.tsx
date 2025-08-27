import React from 'react';
import type { QuotaStatus } from "@/hooks/useQuota";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quota: QuotaStatus | null;
}

export default function UpgradeModal({ open, onOpenChange, quota }: UpgradeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Upgrade Your Plan</h2>
        
        {quota?.upgradeUrl ? (
          <div className="space-y-4">
            <p className="text-gray-600">
              You've reached your current plan limit. Upgrade to continue using our services.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <a
                href={quota.upgradeUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Upgrade Now
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              Upgrade your plan to get more features and higher limits.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <a
                href="/pricing"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View Plans
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 