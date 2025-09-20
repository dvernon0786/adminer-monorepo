/* VERSION: DIRECT_CHECKOUT_V3_20250921_UNIQUE */
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

interface DirectCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  quota: {
    used: number;
    limit: number;
    percentage: number;
  };
}

export default function DirectCheckoutModal({ isOpen, onClose, currentPlan, quota }: DirectCheckoutModalProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState<string | null>(null);

  // Add unique identifier to verify this component is loaded
  useEffect(() => {
    if (isOpen) {
      console.log('DIRECT_CHECKOUT_MODAL_V3_LOADED', {
        timestamp: new Date().toISOString(),
        currentPlan,
        quota,
        componentVersion: 'V3_UNIQUE_NAME',
        componentName: 'DirectCheckoutModal'
      });
    }
  }, [isOpen, currentPlan, quota]);

  if (!isOpen) return null;

  // DEFINITIVE DIRECT CHECKOUT - NO PRICING REDIRECTS EVER
  const handleDirectCheckout = async (targetPlan: string) => {
    try {
      setLoading(targetPlan);
      
      console.log('DIRECT_CHECKOUT_V3_INITIATED', {
        targetPlan,
        currentPlan,
        userEmail: user?.emailAddresses[0]?.emailAddress,
        timestamp: new Date().toISOString(),
        component: 'DirectCheckoutModal_V3'
      });

      // Map plan names to plan codes
      const planCode = targetPlan === 'pro' ? 'pro-500' : 'ent-2000';
      
      // CRITICAL: Direct API call to Dodo checkout - NEVER redirect to pricing
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

      console.log('DIRECT_CHECKOUT_V3_API_RESPONSE', {
        status: response.status,
        ok: response.ok,
        planCode
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      console.log('DIRECT_CHECKOUT_V3_SUCCESS', {
        sessionId: data.session_id,
        hasCheckoutUrl: !!data.checkout_url,
        immediateActivation: data.immediate_activation || false
      });

      if (data.immediate_activation) {
        console.log('DIRECT_CHECKOUT_V3_FREE_ACTIVATION');
        window.location.href = data.redirect_url || '/dashboard?plan=free&activated=true';
        return;
      }

      if (!data.checkout_url) {
        throw new Error('No checkout URL provided by Dodo API');
      }

      // DIRECT REDIRECT TO DODO CHECKOUT - NEVER TO PRICING
      console.log('DIRECT_CHECKOUT_V3_REDIRECTING', data.checkout_url);
      window.location.href = data.checkout_url;

    } catch (error) {
      console.error('DIRECT_CHECKOUT_V3_ERROR', {
        error: error.message,
        targetPlan,
        timestamp: new Date().toISOString()
      });
      
      // Show user-friendly error - DO NOT REDIRECT TO PRICING
      alert(`Upgrade failed: ${error.message}\n\nPlease try again or contact support at support@adminer.online`);
      
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Quota Exceeded
          </h2>
          
          <p className="text-gray-600 mb-4">
            You've used {quota.used}/{quota.limit} ads ({quota.percentage}% of your {currentPlan} plan).
            Upgrade now to continue scraping with higher limits.
          </p>
        </div>

        {/* Upgrade Options */}
        <div className="space-y-4">
          {/* Pro Plan Option */}
          <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pro Plan</h3>
                <p className="text-gray-600">Perfect for growing businesses</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">$99</div>
                <div className="text-sm text-gray-500">per month</div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-900 mb-2">What you get:</div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 500 ads per month (50x more than free)</li>
                <li>• Priority processing</li>
                <li>• Advanced insights</li>
                <li>• Email support</li>
              </ul>
            </div>
            
            <button
              onClick={() => handleDirectCheckout('pro')}
              disabled={loading === 'pro'}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {loading === 'pro' ? 'Creating secure checkout...' : 'Upgrade to Pro - $99/month'}
            </button>
          </div>

          {/* Enterprise Plan Option */}
          <div className="border border-purple-200 rounded-lg p-6 bg-purple-50">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Enterprise Plan</h3>
                <p className="text-gray-600">For large-scale operations</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">$199</div>
                <div className="text-sm text-gray-500">per month</div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-900 mb-2">What you get:</div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 2,000 ads per month (200x more than free)</li>
                <li>• Fastest processing</li>
                <li>• Premium features</li>
                <li>• Priority support</li>
              </ul>
            </div>
            
            <button
              onClick={() => handleDirectCheckout('enterprise')}
              disabled={loading === 'enterprise'}
              className="w-full bg-purple-600 text-white px-4 py-3 rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
            >
              {loading === 'enterprise' ? 'Creating secure checkout...' : 'Upgrade to Enterprise - $199/month'}
            </button>
          </div>
        </div>

        {/* Help and Close */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-500">
            Need help choosing? <a href="mailto:support@adminer.online" className="text-blue-600 hover:text-blue-700">Contact our team</a>
          </p>
          
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}