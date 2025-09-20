import { Check, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { SignedIn, SignedOut, SignUpButton, useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'

// Safe hook that handles being outside PersonalWorkspaceProvider
const useSafeWorkspace = () => {
  const { user } = useAuth();
  
  // Create fallback workspace if context not available
  const fallbackWorkspace = {
    id: user?.id || 'anonymous',
    name: `${user?.firstName || 'Personal'} Workspace`,
    slug: `personal-${user?.id || 'anonymous'}`,
    createdBy: user?.id || 'anonymous',
    members: user?.id ? [user.id] : [],
    type: 'personal' as const
  };

  console.log('PRICING: Using fallback workspace (no context dependency)');
  return { workspace: fallbackWorkspace, isLoaded: !!user };
};

export default function Pricing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { workspace } = useSafeWorkspace()
  const [upgrading, setUpgrading] = useState<string | null>(null)

  // Debug logging to track pricing page access
  console.log('PRICING_PAGE_ACCESS:', {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    url: window.location.href,
    user: user?.id || 'anonymous',
    source: 'Pricing component render'
  });
  
  const plans = [
    {
      name: 'Starter',
      price: '$0',
      period: '/month',
      description: 'Perfect for trying out Facebook ad analysis',
      features: [
        '10 Facebook ad analyses per month',
        'Basic AI insights',
        'Standard analysis speed',
        'Email support',
        'Export to PDF'
      ],
      buttonText: 'Start Free',
      buttonStyle: 'outline',
      popular: false,
      planId: 'free'
    },
    {
      name: 'Professional',
      price: '$99',
      period: '/month',
      description: 'For agencies and growing brands analyzing competitor strategies',
      features: [
        '500 competitor ad analyses',
        'Advanced AI strategic insights',
        'Priority analysis speed (2-3 min)',
        'Facebook intelligence (live)',
        'Early access to new platforms',
        'Advanced export options',
        'Priority email support'
      ],
      buttonText: 'Start Free Trial',
      buttonStyle: 'primary',
      popular: true,
      planId: 'pro'
    },
    {
      name: 'Enterprise',
      price: '$199',
      period: '/month',
      description: 'Custom intelligence solutions for large marketing teams',
      features: [
        'Unlimited analyses',
        'All platforms (when available)',
        'Custom AI model training',
        'White-label reports',
        'API access',
        'Dedicated account manager',
        '24/7 priority support',
        'Custom integrations'
      ],
      buttonText: 'Start Free Trial',
      buttonStyle: 'outline',
      popular: false,
      planId: 'enterprise'
    },
  ]

  const handleUpgrade = async (planId: string) => {
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      toast.error('Please sign in with a valid email address')
      return
    }

    setUpgrading(planId)
    
    try {
      console.log('PRICING_UPGRADE_REQUEST:', {
        planId,
        userEmail: user?.emailAddresses[0]?.emailAddress,
        timestamp: new Date().toISOString()
      });

      const response = await fetch('/api/dodo/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-workspace-id': user?.id || ''
        },
        body: JSON.stringify({
          plan: planId,
          email: user.emailAddresses[0].emailAddress,
          orgName: user?.fullName || 'Personal Workspace'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      console.log('PRICING_CHECKOUT_RESPONSE:', data);

      if (data.immediate_activation) {
        // Free plan activated immediately
        console.log('FREE_PLAN_ACTIVATED');
        toast.success('Free plan activated! Redirecting to dashboard...');
        setTimeout(() => {
          window.location.href = data.redirect_url || '/dashboard?plan=free&activated=true';
        }, 1000);
      } else if (data.checkout_url) {
        // Redirect to Dodo checkout
        console.log('REDIRECTING_TO_CHECKOUT:', data.checkout_url);
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL or activation provided');
      }
      
    } catch (error) {
      console.error('PRICING_UPGRADE_ERROR:', error);
      toast.error(`Upgrade failed: ${error.message}. Please try again or contact support.`);
    } finally {
      setUpgrading(null)
    }
  }

  const startFree = async (orgId?: string, orgName?: string) => {
    try {
      const res = await fetch('/api/dodo/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, orgName })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to start Free')
      }
      return res.json()
    } catch (error) {
      console.error('Free plan error:', error)
      throw error
    }
  }

  const handlePlanAction = async (planId: string) => {
    if (planId === 'free') {
      // Handle free plan creation
      const orgId = workspace?.id
      const orgName = workspace?.name || 'My Workspace'
      
      if (!orgId) {
        toast.error('Please create or select a workspace first')
        return
      }
      
      try {
        setUpgrading('free')
        await startFree(orgId, orgName)
        toast.success('Free plan activated! Redirecting to dashboard...')
        setTimeout(() => navigate('/dashboard'), 1000)
      } catch (e) {
        toast.error((e as Error).message || 'Failed to activate free plan')
      } finally {
        setUpgrading(null)
      }
    } else {
      // Handle paid plan upgrades
      handleUpgrade(planId)
    }
  }

  return (
    <section id="pricing" className="relative z-10 py-24 px-6 lg:px-10 bg-white/5 backdrop-blur-lg border-y border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight fade-in">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto fade-in fade-1">
            Start with Facebook intelligence today. Unlock new platforms as we launch them. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative bg-black/70 border rounded-2xl p-8 hover:border-white/30 transition-all fade-in ${
                index === 0 ? '' : index === 1 ? 'fade-1' : 'fade-2'
              } ${
                plan.popular 
                  ? 'border-blue-500/50 lg:scale-105 lg:z-10' 
                  : 'border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <SignedOut>
                <SignUpButton mode="modal" redirectUrl="/">
                  <Button
                    className={`w-full py-3 font-medium transition-all ${
                      plan.buttonStyle === 'primary'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:scale-105'
                        : 'border border-white/20 text-white hover:border-white/40 hover:bg-white/5'
                    }`}
                  >
                    {plan.buttonText}
                    {plan.buttonStyle === 'primary' && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Button
                  className={`w-full py-3 font-medium transition-all ${
                    plan.buttonStyle === 'primary'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:scale-105'
                      : 'border border-white/20 text-white hover:border-white/40 hover:bg-white/5'
                  }`}
                  onClick={() => handlePlanAction(plan.planId)}
                  disabled={upgrading === plan.planId}
                >
                  {upgrading === plan.planId ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : plan.planId === 'free' ? (
                    'Start Free'
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                  {plan.buttonStyle === 'primary' && !upgrading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </SignedIn>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 