import React from 'react';
import { useQuota } from '../hooks/useQuota';
import { QuotaBanner } from '../components/QuotaBanner';

export default function Dashboard() {
  const { data: quota, loading, error, needsAuth, needsUpgrade } = useQuota();

  if (loading) {
    return <div className="space-y-4">Loading quota...</div>;
  }

  if (needsAuth) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-blue-800 font-medium">Sign In Required</h3>
          <p className="text-blue-600 text-sm">Please sign in to view your dashboard and quota information.</p>
        </div>
      </div>
    );
  }

  if (needsUpgrade && quota?.upgradeUrl) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-yellow-800 font-medium">Quota Exceeded</h3>
          <p className="text-yellow-600 text-sm">You've reached your plan limit. <a href={quota.upgradeUrl} className="underline">Upgrade now</a> to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <QuotaBanner quota={quota} />
      {/* ...rest */}
    </div>
  );
} 