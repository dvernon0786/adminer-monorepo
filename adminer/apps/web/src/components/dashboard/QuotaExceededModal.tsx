import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { X, AlertTriangle, Check } from "lucide-react";

interface QuotaExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  quota: {
    used: number;
    limit: number;
    percentage: number;
  };
}

export default function QuotaExceededModal({ isOpen, onClose, currentPlan, quota }: QuotaExceededModalProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState<string | null>(null);

  console.log('QUOTA_MODAL_RENDER:', {
    isOpen,
    currentPlan,
    quota,
    timestamp: new Date().toISOString()
  });

  if (!isOpen) return null;

  // DEFINITIVE FIX: Direct Dodo checkout API call - NO PRICING REDIRECTS
  const handleDirectCheckout = async (targetPlan: string) => {
    try {
      setLoading(targetPlan);
      
      console.log('QUOTA_MODAL_DIRECT_CHECKOUT:', {
        targetPlan,
        currentPlan,
        userEmail: user?.emailAddresses[0]?.emailAddress,
        timestamp: new Date().toISOString(),
        source: 'QuotaExceededModal_DIRECT_CHECKOUT'
      });

      // Map plan names to plan codes
      const planCode = targetPlan === 'pro' ? 'pro-500' : 'ent-2000';
      
      // CRITICAL: Call Dodo checkout API directly - NEVER redirect to pricing
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      console.log('QUOTA_MODAL_CHECKOUT_API_SUCCESS:', {
        sessionId: data.session_id,
        checkoutUrl: data.checkout_url ? 'GENERATED' : 'MISSING',
        immediateActivation: data.immediate_activation || false
      });

      if (data.immediate_activation) {
        // Free plan - immediate activation
        console.log('QUOTA_MODAL_FREE_PLAN_ACTIVATION');
        window.location.href = data.redirect_url || '/dashboard?plan=free&activated=true';
        return;
      }

      if (!data.checkout_url) {
        throw new Error('No checkout URL provided by API');
      }

      // DIRECT REDIRECT TO DODO CHECKOUT - NO PRICING PAGE
      console.log('QUOTA_MODAL_REDIRECTING_TO_CHECKOUT:', data.checkout_url);
      window.location.href = data.checkout_url;

    } catch (error) {
      console.error('QUOTA_MODAL_CHECKOUT_ERROR:', {
        error: error.message,
        targetPlan,
        timestamp: new Date().toISOString()
      });
      
      // Show user-friendly error instead of redirecting to pricing
      alert(`Checkout failed: ${error.message}. Please try again or contact support at support@adminer.online`);
      
    } finally {
      setLoading(null);
    }
  };

  const getUpgradeMessage = () => {
    return `You've used ${quota.used}/${quota.limit} ads (${quota.percentage}% of your ${currentPlan} plan). Upgrade now to continue scraping with higher limits.`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Quota Exceeded - Upgrade Required"
    >
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0F172A] text-neutral-200 shadow-lg">
        {/* Gradient Header */}
        <div className="h-2 w-full gradient-underline rounded-t-2xl" />
        
        {/* Header */}
        <div className="p-6 md:p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-red-400">Quota Exceeded</h2>
              <p className="text-neutral-400 mt-1">{getUpgradeMessage()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upgrade Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-6 md:p-8 pt-0">
          {/* Pro Plan Option */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4 hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Pro Plan</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/20">Most Popular</span>
            </div>
            
            <div className="text-3xl font-bold">
              $99
              <span className="text-base text-neutral-400">/month</span>
            </div>
            
            <div className="text-lg text-blue-400 font-medium">500 ads/month</div>
            
            <ul className="space-y-2 text-sm text-neutral-300 flex-grow">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                500 competitor analyses
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                Advanced insights
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                Priority analysis
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                Multi-result export
              </li>
            </ul>
            
            <button
              onClick={() => handleDirectCheckout('pro')}
              disabled={loading === 'pro'}
              className="mt-auto gradient-btn text-center py-2.5 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'pro' ? 'Creating secure checkout...' : 'Upgrade to Pro - $99/month'}
            </button>
          </div>

          {/* Enterprise Plan Option */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4 hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Enterprise Plan</h3>
            </div>
            
            <div className="text-3xl font-bold">
              $199
              <span className="text-base text-neutral-400">/month</span>
            </div>
            
            <div className="text-lg text-blue-400 font-medium">2000 ads/month</div>
            
            <ul className="space-y-2 text-sm text-neutral-300 flex-grow">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                2000 competitor analyses
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                Team seats
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                SLA support
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                Custom reports
              </li>
            </ul>
            
            <button
              onClick={() => handleDirectCheckout('enterprise')}
              disabled={loading === 'enterprise'}
              className="mt-auto gradient-btn text-center py-2.5 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'enterprise' ? 'Creating secure checkout...' : 'Upgrade to Enterprise - $199/month'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 md:px-8 pb-6 md:pb-8">
          <div className="text-center text-sm text-neutral-400">
            Need help choosing? <button className="text-blue-400 hover:text-blue-300 underline" onClick={() => window.open('mailto:support@adminer.online', '_blank')}>Contact our team</button>
          </div>
        </div>
      </div>
    </div>
  );
}