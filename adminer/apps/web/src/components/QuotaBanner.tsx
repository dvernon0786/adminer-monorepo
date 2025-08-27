import React from 'react';

export function QuotaBanner({ quota }: { quota: any }) {
  if (quota?.quotaExceeded) {
    return (
      <div className="rounded-xl p-3 bg-amber-100 text-amber-900 flex items-center justify-between">
        <span>Monthly quota reached. Please upgrade to continue.</span>
        <a href={quota.upgradeUrl} className="px-3 py-1 rounded-lg bg-amber-900 text-amber-50">Upgrade</a>
      </div>
    );
  }
  return null;
} 