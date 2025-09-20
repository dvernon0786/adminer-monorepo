import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import type { QuotaData } from "@/hooks/useQuota";

interface QuotaPaywallProps {
  quota: QuotaData | null;
  onUpgrade?: () => void;
}

export default function QuotaPaywall({ quota, onUpgrade }: QuotaPaywallProps) {
  const { user } = useUser();
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);

  if (!quota) return null;

  // FIXED: Direct checkout instead of pricing page redirect
  const handleUpgrade = async (plan: string) => {
    try {
      setUpgradeLoading(plan);
      
      console.log('QUOTA_PAYWALL_UPGRADE:', {
        currentPlan: quota?.plan || 'free',
        targetPlan: plan,
        userEmail: user?.emailAddresses[0]?.emailAddress,
        timestamp: new Date().toISOString()
      });

      // Determine plan code for Dodo API
      const planCode = plan === 'pro' ? 'pro-500' : 'ent-2000';
      
      // CRITICAL FIX: Call Dodo checkout API directly
      const response = await fetch('/api/dodo/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-workspace-id': user?.id || ''
        },
        body: JSON.stringify({
          plan: planCode,
          email: user?.emailAddresses[0]?.emailAddress,
          orgName: user?.fullName || 'Personal Workspace'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      console.log('QUOTA_PAYWALL_CHECKOUT_SUCCESS:', {
        checkoutUrl: data.checkout_url,
        sessionId: data.session_id,
        planCode
      });

      if (data.immediate_activation) {
        // Free plan activated immediately
        window.location.href = data.redirect_url || '/dashboard?plan=free&activated=true';
      } else if (data.checkout_url) {
        // FIXED: Direct redirect to Dodo checkout (NO PRICING PAGE)
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL provided');
      }

    } catch (error) {
      console.error('QUOTA_PAYWALL_UPGRADE_ERROR:', error);
      
      // Graceful fallback: redirect to pricing page if checkout fails
      console.log('QUOTA_PAYWALL_FALLBACK: Redirecting to pricing page');
      window.location.href = `/pricing?plan=${plan}&error=checkout_failed`;
      
    } finally {
      setUpgradeLoading(null);
    }
  };

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
        <button
          onClick={() => handleUpgrade('pro')}
          disabled={upgradeLoading === 'pro'}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {upgradeLoading === 'pro' ? 'Creating checkout...' : 'Upgrade to Pro Now'}
        </button>
        <button
          onClick={() => handleUpgrade('enterprise')}
          disabled={upgradeLoading === 'enterprise'}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {upgradeLoading === 'enterprise' ? 'Creating checkout...' : 'Upgrade to Enterprise'}
        </button>
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