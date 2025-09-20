import React from "react";
import { X, AlertTriangle, Check } from "lucide-react";

interface QuotaExceededModalProps {
  isOpen: boolean;
  currentPlan: 'free' | 'pro' | 'enterprise';
  quotaUsed: number;
  quotaLimit: number;
  onUpgrade: (plan: string) => void;
  onClose: () => void;
  loading?: string | null;
}

const QuotaExceededModal: React.FC<QuotaExceededModalProps> = ({
  isOpen,
  currentPlan,
  quotaUsed,
  quotaLimit,
  onUpgrade,
  onClose,
  loading = null
}) => {
  console.log('QUOTA_MODAL_RENDER:', {
    isOpen,
    currentPlan,
    quotaUsed,
    quotaLimit,
    timestamp: new Date().toISOString()
  });
  
  if (!isOpen) return null;

  const getUpgradeMessage = () => {
    switch (currentPlan) {
      case 'free':
        return `You've used ${quotaUsed}/${quotaLimit} ads. Upgrade to Pro for 500 ads/month.`;
      case 'pro':
        return `You've used ${quotaUsed}/${quotaLimit} ads. Upgrade to Enterprise for 2000 ads/month.`;
      case 'enterprise':
        return `You've reached your ${quotaLimit} ads limit. Contact sales for higher limits.`;
      default:
        return 'Upgrade needed.';
    }
  };

  const getUpgradeOptions = () => {
    switch (currentPlan) {
      case 'free':
        return [
          { 
            plan: 'pro', 
            price: '$99', 
            period: '/month',
            ads: '500 ads/month', 
            features: [
              '500 competitor analyses',
              'Advanced insights', 
              'Priority analysis',
              'Multi-result export'
            ] 
          },
          { 
            plan: 'enterprise', 
            price: '$199', 
            period: '/month',
            ads: '2000 ads/month', 
            features: [
              '2000 competitor analyses',
              'Team seats',
              'SLA support', 
              'Custom reports'
            ] 
          }
        ];
      case 'pro':
        return [
          { 
            plan: 'enterprise', 
            price: '$199', 
            period: '/month',
            ads: '2000 ads/month', 
            features: [
              '2000 competitor analyses',
              'Team seats',
              'SLA support', 
              'Custom reports'
            ] 
          }
        ];
      case 'enterprise':
        return [
          { 
            plan: 'contact-sales', 
            price: 'Custom', 
            period: '',
            ads: 'Unlimited', 
            features: [
              'Custom limits',
              'White-label options',
              'Dedicated account manager',
              'Priority support'
            ] 
          }
        ];
      default:
        return [];
    }
  };

  const handleUpgrade = (plan: string) => {
    console.log('QUOTA_MODAL_UPGRADE_CLICKED:', {
      plan,
      timestamp: new Date().toISOString(),
      source: 'QuotaExceededModal'
    });
    
    if (plan === 'contact-sales') {
      window.open('mailto:sales@adminer.online?subject=Enterprise Plan Inquiry', '_blank');
    } else {
      onUpgrade(plan);
    }
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
          {getUpgradeOptions().map((option) => (
            <div key={option.plan} className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4 hover:border-white/20 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold capitalize">{option.plan.replace('-', ' ')}</h3>
                {option.plan === 'pro' && (
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/20">Most Popular</span>
                )}
              </div>
              
              <div className="text-3xl font-bold">
                {option.price}
                <span className="text-base text-neutral-400">{option.period}</span>
              </div>
              
              <div className="text-lg text-blue-400 font-medium">{option.ads}</div>
              
              <ul className="space-y-2 text-sm text-neutral-300 flex-grow">
                {option.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleUpgrade(option.plan)}
                disabled={loading === option.plan}
                className="mt-auto gradient-btn text-center py-2.5 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === option.plan ? 'Creating checkout...' : (option.plan === 'contact-sales' ? 'Contact Sales' : 'Upgrade Now')}
              </button>
            </div>
          ))}
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
};

export default QuotaExceededModal;