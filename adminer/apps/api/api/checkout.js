export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { plan = 'pro-500', orgId = 'test-org' } = req.query;
  
  try {
    // Mock checkout session for testing
    const mockSession = {
      id: `session_${Date.now()}`,
      checkout_url: `https://checkout.dodo.com/session_${Date.now()}`,
      plan: plan,
      orgId: orgId
    };
    
    return res.status(200).json({
      success: true,
      checkoutUrl: mockSession.checkout_url,
      sessionId: mockSession.id,
      plan: plan,
      orgId: orgId,
      message: 'Checkout session created successfully'
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}