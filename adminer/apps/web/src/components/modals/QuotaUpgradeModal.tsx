import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

interface QuotaUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  quota: {
    used: number;
    limit: number;
    percentage: number;
  };
}

export default function QuotaUpgradeModal({ isOpen, onClose, quota }: QuotaUpgradeModalProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      console.log('🎯 QUOTA_UPGRADE_MODAL_LOADED', {
        timestamp: new Date().toISOString(),
        quota,
        userEmail: user?.emailAddresses[0]?.emailAddress,
        modalVersion: 'FINAL_FIX_V4'
      });
    }
  }, [isOpen, quota, user]);

  if (!isOpen) return null;

  const handleUpgrade = async (plan: string) => {
    try {
      setLoading(plan);
      
      console.log('🚀 UPGRADE_INITIATED', {
        plan,
        userEmail: user?.emailAddresses[0]?.emailAddress,
        timestamp: new Date().toISOString()
      });

      const planCode = plan === 'pro' ? 'pro-500' : 'ent-2000';
      
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

      console.log('🔗 CHECKOUT_API_RESPONSE', {
        status: response.status,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error(`Checkout failed: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('🔍 CHECKOUT_API_DATA_FULL_RESPONSE:', data);

      if (data.checkout_url) {
        console.log('✅ REDIRECTING_TO_CHECKOUT', data.checkout_url);
        window.location.href = data.checkout_url;
      } else {
        console.error('❌ NO_CHECKOUT_URL_RECEIVED:', {
          responseData: data,
          hasCheckoutUrl: !!data.checkout_url,
          responseKeys: Object.keys(data)
        });
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      console.error('❌ UPGRADE_ERROR', error);
      alert(`Upgrade failed: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Quota Exceeded</h2>
        <p className="text-gray-600 mb-6">
          You've used {quota.used}/{quota.limit} ads. Upgrade to continue.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => handleUpgrade('pro')}
            disabled={loading === 'pro'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading === 'pro' ? 'Loading...' : 'Upgrade to Pro - $99/month'}
          </button>
          
          <button
            onClick={() => handleUpgrade('enterprise')}
            disabled={loading === 'enterprise'}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading === 'enterprise' ? 'Loading...' : 'Upgrade to Enterprise - $199/month'}
          </button>
          
          <button
            onClick={onClose}
            className="w-full border border-gray-300 py-2 px-4 rounded hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}