"use client";

import React from 'react';
import { useQuota } from '@/hooks/useQuota';

export default function ExampleUsage() {
  const { data: quota, loading, error, needsAuth, needsUpgrade } = useQuota();

  if (loading) {
    return <div>Loading quota information...</div>;
  }

  if (needsAuth) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-blue-800 font-medium">Sign In Required</h3>
        <p className="text-blue-600 text-sm">Please sign in to view your usage information.</p>
      </div>
    );
  }

  if (needsUpgrade && quota?.upgradeUrl) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-yellow-800 font-medium">Quota Exceeded</h3>
        <p className="text-yellow-600 text-sm">
          You've reached your plan limit. <a href={quota.upgradeUrl} className="underline font-medium">Upgrade now</a> to continue.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-medium">Error Loading Quota</h3>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!quota) {
    return <div>No quota information available</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900">Current Plan</h3>
          <p className="text-2xl font-bold text-blue-600">{quota.plan}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900">Used</h3>
          <p className="text-2xl font-bold text-orange-600">{quota.used}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900">Remaining</h3>
          <p className="text-2xl font-bold text-green-600">{quota.remaining}</p>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, (quota.used / quota.limit) * 100)}%` }}
        />
      </div>
      
      <p className="text-sm text-gray-600">
        {quota.used} of {quota.limit} used this month
      </p>
    </div>
  );
} 