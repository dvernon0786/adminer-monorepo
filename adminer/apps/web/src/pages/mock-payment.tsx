import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function MockPayment() {
  const router = useRouter();
  const { plan, amount } = router.query;
  const [processing, setProcessing] = useState(false);

  const handleMockPayment = async (success: boolean) => {
    setProcessing(true);
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (success) {
      // Simulate successful payment webhook
      const mockWebhook = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: `mock_session_${Date.now()}`,
            customer: `mock_customer_${Date.now()}`,
            amount_total: parseInt(amount as string) || 4900,
            metadata: {
              orgId: 'mock_org_id',
              planCode: plan as string
            }
          }
        }
      };

      try {
        await fetch('/api/dodo/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'dodo-signature': 'mock_signature'
          },
          body: JSON.stringify(mockWebhook)
        });

        // Redirect to success page
        router.push(`/dashboard?payment=success&plan=${plan}`);
      } catch (error) {
        console.error('Mock webhook failed:', error);
        router.push(`/dashboard?payment=error&plan=${plan}`);
      }
    } else {
      // Redirect to cancelled page
      router.push(`/pricing?payment=cancelled&plan=${plan}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Mock Payment
          </h2>
          
          <p className="text-gray-600 mb-6">
            Plan: {plan}<br/>
            Amount: ${(parseInt(amount as string) || 4900) / 100}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => handleMockPayment(true)}
              disabled={processing}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {processing ? 'Processing...' : 'Simulate Successful Payment'}
            </button>
            
            <button
              onClick={() => handleMockPayment(false)}
              disabled={processing}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {processing ? 'Processing...' : 'Simulate Failed Payment'}
            </button>
            
            <button
              onClick={() => router.push('/pricing')}
              disabled={processing}
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
          
          <div className="mt-6 text-xs text-gray-500">
            This is a mock payment page for development testing.
            In production, users would be redirected to Dodo's secure checkout.
          </div>
        </div>
      </div>
    </div>
  );
}